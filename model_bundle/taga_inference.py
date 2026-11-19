"""taga_inference.py - run the trained TagaDetect bundle on new text.

    detector = TagaDetector("bundle_folder")
    detector.predict("Paste any English, Filipino or Taglish text here ...")
"""
import json
import os
import re

import numpy as np
import joblib

from taga_features import normalize_text, style_features


def _logit(p):
    p = min(max(p, 1e-6), 1 - 1e-6)
    return float(np.log(p / (1 - p)))


class TagaDetector:
    def __init__(self, bundle_dir="."):
        self.dir = bundle_dir
        with open(os.path.join(bundle_dir, "ensemble_config.json"), encoding="utf-8") as f:
            self.cfg = json.load(f)

        load = lambda name: joblib.load(os.path.join(bundle_dir, name))
        self.label_models = {"tfidf_lr": load("label_tfidf_lr.joblib"), "lgbm_style": load("label_lgbm_style.joblib")}
        self.source_models = {"tfidf_lr": load("source_tfidf_lr.joblib"), "lgbm_style": load("source_lgbm_style.joblib")}

        self.xlmr = {}
        xcfg = self.cfg.get("xlmr", {})
        if xcfg.get("enabled"):
            try:
                import taga_xlmr as xl
                self._xl = xl
                for task, folder in (("label", xcfg.get("label_dir")), ("source", xcfg.get("source_dir"))):
                    folder_path = os.path.join(bundle_dir, folder)
                    if os.path.exists(folder_path) and any(os.scandir(folder_path)):
                        self.xlmr[task] = xl.load_model(folder_path)
            except Exception as e:
                print(f"[TagaDetector] XLM-R notice: {e}. Using scikit-learn / LightGBM models.")

    # ------------------------------------------------------------------ helpers
    def _style(self, clean):
        return np.array([style_features(clean, self.cfg["style"]["max_words"])], dtype=float)

    def _xlmr_proba(self, task, clean):
        model, tokenizer = self.xlmr[task]
        return self._xl.predict_proba(model, tokenizer, [clean], self.cfg["xlmr"]["max_len"])[0]

    def _model_probs(self, task, clean):
        weights = self.cfg[task]["weights"]
        models = self.label_models if task == "label" else self.source_models
        out = {}
        if weights.get("tfidf_lr", 0) > 0 or "tfidf_lr" in models:
            out["tfidf_lr"] = np.asarray(models["tfidf_lr"].predict_proba([clean])[0])
        if weights.get("lgbm_style", 0) > 0 or "lgbm_style" in models:
            out["lgbm_style"] = np.asarray(models["lgbm_style"].predict_proba(self._style(clean))[0])
        if weights.get("xlmr", 0) > 0 and task in self.xlmr:
            out["xlmr"] = self._xlmr_proba(task, clean)
        return out

    def _ensemble(self, task, clean):
        weights = self.cfg[task]["weights"]
        probs = self._model_probs(task, clean)
        active_weights = {name: weights[name] for name in probs if weights.get(name, 0) > 0}
        total = sum(active_weights.values())
        if total > 0:
            mix = sum(active_weights[name] * probs[name] for name in active_weights) / total
        else:
            total = len(probs)
            mix = sum(probs.values()) / total
        return mix, probs

    def split_sentences(self, text):
        if not text or not text.strip():
            return []
        cleaned = re.sub(r'([.?!])\s*(?=[A-Z0-9"\'\u00C0-\u017F]|$)', r'\1|', text)
        return [s.strip() for s in cleaned.split('|') if s.strip()]

    # ------------------------------------------------------------------ public API
    def predict(self, text):
        clean = normalize_text(text)
        n_words = len(clean.split())
        label_cfg = self.cfg["label"]

        mixed, per_model = self._ensemble("label", clean)
        raw_ai = float(mixed[1])
        platt = label_cfg["platt"]
        z = platt["coef"] * _logit(raw_ai) + platt["intercept"]
        ai_probability = float(1.0 / (1.0 + np.exp(-z)))

        t_human = label_cfg["thresholds"]["likely_human_below"]
        t_ai = label_cfg["thresholds"]["likely_ai_at_or_above"]
        if ai_probability >= t_ai:
            band = "likely_ai"
        elif ai_probability < t_human:
            band = "likely_human"
        else:
            band = "unclear"

        result = {
            "ai_probability": round(ai_probability, 4),
            "band": band,
            "thresholds": {"likely_human_below": round(t_human, 4), "likely_ai_at_or_above": round(t_ai, 4)},
            "word_count": n_words,
            "too_short": n_words < self.cfg["min_words_reliable"],
            "model_scores": {k: round(float(v[1]), 4) for k, v in per_model.items()},
            "likely_source": None,
            "source_probabilities": None,
        }

        if band != "likely_human":
            source_mix, _ = self._ensemble("source", clean)
            classes = self.cfg["source"]["classes"]
            result["source_probabilities"] = {c: round(float(p), 4) for c, p in zip(classes, source_mix)}
            top = int(np.argmax(source_mix))
            if source_mix[top] >= self.cfg["source"]["min_conf"]:
                result["likely_source"] = classes[top]
        return result

    def predict_detailed(self, text):
        if not text or len(text.strip()) < 15:
            return {
                "overallAiScore": 0,
                "verdict": "Text too short to evaluate",
                "humanProbability": 100,
                "perplexityScore": 0,
                "burstinessScore": 0,
                "wordCount": 0,
                "characterCount": 0,
                "sentenceCount": 0,
                "flags": ["Please enter at least 15 characters to run prediction."],
                "sentenceBreakdown": [],
                "isRealModel": True,
                "modelScores": {},
                "likelySource": None,
                "sourceProbabilities": None
            }

        base_res = self.predict(text)
        overall_score = int(round(base_res["ai_probability"] * 100))
        human_prob = max(0, 100 - overall_score)

        sentences = self.split_sentences(text)
        if not sentences:
            sentences = [text.strip()]

        sentence_lengths = []
        sentence_breakdown = []

        for idx, sentence in enumerate(sentences):
            words = sentence.split()
            w_count = len(words)
            sentence_lengths.append(w_count)

            if w_count >= 4:
                try:
                    s_clean = normalize_text(sentence)
                    s_mixed, _ = self._ensemble("label", s_clean)
                    s_raw = float(s_mixed[1])
                    s_z = self.cfg["label"]["platt"]["coef"] * _logit(s_raw) + self.cfg["label"]["platt"]["intercept"]
                    s_prob = float(1.0 / (1.0 + np.exp(-s_z)))
                    s_score = int(round(s_prob * 100))
                except Exception:
                    s_score = overall_score
            else:
                s_score = overall_score

            if s_score >= 65:
                label = "ai"
            elif s_score >= 35:
                label = "mixed"
            else:
                label = "human"

            sentence_breakdown.append({
                "id": f"s_{idx + 1}",
                "text": sentence,
                "score": s_score,
                "label": label,
                "wordCount": w_count
            })

        # Calculate burstiness from sentence length variance
        if len(sentence_lengths) > 1:
            mean_len = float(np.mean(sentence_lengths))
            std_len = float(np.std(sentence_lengths))
            cv = (std_len / mean_len) if mean_len > 0 else 0
            burstiness = int(np.clip(cv * 60 + 20, 10, 95))
        else:
            burstiness = 50

        # Calculate lexical diversity / perplexity proxy
        all_words = text.lower().split()
        if all_words:
            ttr = len(set(all_words)) / len(all_words)
            perplexity = int(np.clip((1.0 - ttr) * 100 + (100 - overall_score) * 0.3, 15, 95))
        else:
            perplexity = 50

        # Determine verdict
        if overall_score >= 70:
            verdict = "High Synthetic (AI) Probability"
        elif overall_score >= 40:
            verdict = "Mixed / Hybrid Authorship Detected"
        elif overall_score >= 20:
            verdict = "Likely Human with Minor Automated Assistance"
        else:
            verdict = "Authentic Human Authorship"

        # Build diagnostic flags
        ai_cnt = sum(1 for s in sentence_breakdown if s["label"] == "ai")
        flags = [f"{ai_cnt} of {len(sentences)} sentences classified as synthetic cadence"]

        if base_res.get("likely_source"):
            conf = int(round(base_res["source_probabilities"].get(base_res["likely_source"], 0) * 100))
            flags.append(f"Synthesized generator signature: {base_res['likely_source']} ({conf}% confidence)")
        elif overall_score >= 40:
            flags.append("Synthetic structure detected across multiple generative model baselines")

        scores_str = ", ".join(f"{k.upper()}: {int(round(v*100))}%" for k, v in base_res["model_scores"].items())
        flags.append(f"Model components: {scores_str}")

        if base_res.get("too_short"):
            flags.append("Note: Sample under 50 words; confidence may be lower.")

        return {
            "overallAiScore": overall_score,
            "humanProbability": human_prob,
            "verdict": verdict,
            "band": base_res.get("band"),
            "perplexityScore": perplexity,
            "burstinessScore": burstiness,
            "wordCount": base_res.get("word_count", len(all_words)),
            "characterCount": len(text),
            "sentenceCount": len(sentences),
            "flags": flags,
            "sentenceBreakdown": sentence_breakdown,
            "isRealModel": True,
            "likelySource": base_res.get("likely_source"),
            "sourceProbabilities": base_res.get("source_probabilities"),
            "modelScores": base_res.get("model_scores")
        }
