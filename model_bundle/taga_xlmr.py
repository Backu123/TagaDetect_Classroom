"""taga_xlmr.py - XLM-RoBERTa fine-tuning and prediction helpers (plain PyTorch, no Trainer API)."""
import random
import time

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import f1_score
from torch.utils.data import DataLoader, Dataset
from transformers import (AutoModelForSequenceClassification, AutoTokenizer,
                          get_linear_schedule_with_warmup)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def set_seed_all(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


class TextDataset(Dataset):
    def __init__(self, tokenizer, texts, labels, max_len):
        self.enc = tokenizer(list(texts), truncation=True, max_length=max_len)
        self.labels = None if labels is None else [int(x) for x in labels]

    def __len__(self):
        return len(self.enc["input_ids"])

    def __getitem__(self, i):
        item = {"input_ids": self.enc["input_ids"][i], "attention_mask": self.enc["attention_mask"][i]}
        if self.labels is not None:
            item["labels"] = self.labels[i]
        return item


def _collate_factory(tokenizer):
    def collate(batch):
        labels = [b["labels"] for b in batch if "labels" in b]
        features = [{k: v for k, v in b.items() if k != "labels"} for b in batch]
        out = tokenizer.pad(features, return_tensors="pt")
        if labels:
            out["labels"] = torch.tensor(labels, dtype=torch.long)
        return out
    return collate


@torch.no_grad()
def predict_proba(model, tokenizer, texts, max_len, batch_size=32):
    """Class probabilities, shape (n_texts, n_classes)."""
    model.eval()
    loader = DataLoader(TextDataset(tokenizer, texts, None, max_len), batch_size=batch_size,
                        shuffle=False, collate_fn=_collate_factory(tokenizer))
    use_amp = DEVICE == "cuda"
    outputs = []
    for batch in loader:
        batch = {k: v.to(DEVICE) for k, v in batch.items()}
        with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=use_amp):
            logits = model(**batch).logits
        outputs.append(torch.softmax(logits.float(), dim=-1).cpu().numpy())
    return np.vstack(outputs)


def train_classifier(tokenizer, model_name, train_texts, train_y, val_texts, val_y, num_labels, *,
                     max_len, epochs, lr, batch_size, patience, seed, tag):
    """Fine-tune with class-weighted loss and early stopping on validation macro-F1.
    Returns the model restored to its best epoch."""
    set_seed_all(seed)
    use_amp = DEVICE == "cuda"
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=num_labels).to(DEVICE)

    train_y = np.asarray(train_y, dtype=int)
    val_y = np.asarray(val_y, dtype=int)
    generator = torch.Generator()
    generator.manual_seed(seed)
    train_loader = DataLoader(TextDataset(tokenizer, train_texts, train_y, max_len), batch_size=batch_size,
                              shuffle=True, collate_fn=_collate_factory(tokenizer), generator=generator)

    counts = np.bincount(train_y, minlength=num_labels).astype(float)
    class_weights = torch.tensor(counts.sum() / (num_labels * np.maximum(counts, 1.0)),
                                 dtype=torch.float, device=DEVICE)
    loss_fn = nn.CrossEntropyLoss(weight=class_weights)

    no_decay = ("bias", "LayerNorm.weight")
    grouped = [
        {"params": [p for n, p in model.named_parameters() if not any(nd in n for nd in no_decay)],
         "weight_decay": 0.01},
        {"params": [p for n, p in model.named_parameters() if any(nd in n for nd in no_decay)],
         "weight_decay": 0.0},
    ]
    optimizer = torch.optim.AdamW(grouped, lr=lr)
    total_steps = max(1, len(train_loader) * epochs)
    scheduler = get_linear_schedule_with_warmup(optimizer, int(0.1 * total_steps), total_steps)
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp)

    best_score, best_state, bad_epochs = -1.0, None, 0
    for epoch in range(1, epochs + 1):
        model.train()
        started, running = time.time(), 0.0
        for batch in train_loader:
            batch = {k: v.to(DEVICE) for k, v in batch.items()}
            labels = batch.pop("labels")
            with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=use_amp):
                logits = model(**batch).logits
            loss = loss_fn(logits.float(), labels)
            optimizer.zero_grad(set_to_none=True)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            running += loss.item()

        val_prob = predict_proba(model, tokenizer, val_texts, max_len)
        score = f1_score(val_y, val_prob.argmax(axis=1), average="macro")
        print(f"[{tag}] epoch {epoch}/{epochs}  train loss {running / len(train_loader):.4f}  "
              f"val macro-F1 {score:.4f}  ({time.time() - started:.0f}s)")
        if score > best_score + 1e-4:
            best_score, bad_epochs = score, 0
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        else:
            bad_epochs += 1
            if bad_epochs >= patience:
                print(f"[{tag}] early stopping (no improvement for {patience} epochs)")
                break

    model.load_state_dict(best_state)
    model.eval()
    print(f"[{tag}] best validation macro-F1: {best_score:.4f}")
    return model


def save_model(model, tokenizer, path):
    """Save a fine-tuned model and its tokenizer to a folder."""
    model.save_pretrained(path)
    tokenizer.save_pretrained(path)


def load_model(path):
    """Load a fine-tuned model and its tokenizer saved with save_model()."""
    tokenizer = AutoTokenizer.from_pretrained(path)
    model = AutoModelForSequenceClassification.from_pretrained(path).to(DEVICE).eval()
    return model, tokenizer
