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

# ---------------------------------------------------------------------------
# AI transition/cliché marker patterns
# High density of these phrases is a strong AI signal in both English & Tagalog
# ---------------------------------------------------------------------------
_AI_MARKER_PATTERNS_EN = re.compile(
    r"\b(in conclusion|furthermore|moreover|additionally|it is essential to|"
    r"it is important to note|it is worth noting|by leveraging|in the context of|"
    r"in today's (rapidly )?(changing |evolving |digital )?world|"
    r"plays? a (pivotal|crucial|vital|key) role|"
    r"rapidly evolving|at the forefront|delve into|"
    r"navigating|underscore|innovative solutions?|"
    r"comprehensive (understanding|approach|overview|analysis)|"
    r"highlights? the importance of|"
    r"in summary|to summarize|as (mentioned|stated|noted) (above|earlier|previously)|"
    r"a wide (range|variety|array) of|"
    r"with the (advent|rise|emergence) of|"
    r"in recent years|on the other hand|in light of|"
    r"to (achieve|ensure|address|tackle|foster|facilitate|promote|enhance|leverage|mitigate)|"
    r"first and foremost|last but not least|in essence|as a result)",
    re.IGNORECASE,
)

_AI_MARKER_PATTERNS_TL = re.compile(
    r"\b(sa makabagong panahon|bilang pagtatapos|sa kabuuan|"
    r"mahalaga(ng)? (banggitin|tandaan|pansinin)|"
    r"isa sa (mga )?mahalagang|"
    r"sa (ating|ating) (lipunan|bansa|mundo|panahon)|"
    r"ang (teknolohiya|modernong)|"
    r"sa (pamamagitan|tulong) ng|"
    r"may malaking (papel|epekto|impluwensya|kaugnayan)|"
    r"malawak na (pag-unawa|kaalaman|epekto)|"
    r"bukod dito|bukod pa rito|bukod pa dito|"
    r"gayunpaman|gayunman|sa kabilang banda|"
    r"upang (matiyak|maitaguyod|matugunan|makamit)|"
    r"nararapat (lamang|na)|una sa lahat|huli ngunit hindi kakaunti)",
    re.IGNORECASE,
)

# Markdown bold keyword syntax (e.g. **word**, **keyword**, **summary:**)
# This is a distinctive signature of raw AI/LLM outputs copied directly into text.
_AI_MARKER_PATTERNS_MD = re.compile(
    r"(\*\*[^*\n\r]{1,60}\*\*|\*\*word\*\*)",
    re.IGNORECASE,
)


def _ai_marker_density(text: str) -> float:
    """Return ratio of AI-cliché and markdown-bold keyword matches per 100 words."""
    words = text.split()
    n = max(len(words), 1)
    hits_en = len(_AI_MARKER_PATTERNS_EN.findall(text))
    hits_tl = len(_AI_MARKER_PATTERNS_TL.findall(text))
    hits_md = len(_AI_MARKER_PATTERNS_MD.findall(text))
    return (hits_en + hits_tl + hits_md * 2.0) / (n / 100.0)


def _sentence_cv(sentences) -> float:
    """Coefficient of Variation of sentence word-lengths.
    AI text: low CV (< 0.35, uniform), human text: high CV (> 0.50, varied).
    """
    lens = [len(s.split()) for s in sentences if s.strip()]
    if len(lens) < 2:
        return 0.5  # neutral
    m = float(np.mean(lens))
    if m == 0:
        return 0.5
    return float(np.std(lens) / m)


def _heuristic_ai_boost(text: str, sentences, base_prob: float) -> float:
    """Blend base ML probability with AI-marker density and sentence CV signals.

    - marker_density > 1.5 per 100 words  → strong AI signal
    - sentence_cv < 0.30                   → AI (uniform cadence)
    - sentence_cv > 0.55                   → human (varied cadence)
    Returns adjusted probability in [0, 1].
    """
    density = _ai_marker_density(text)
    cv = _sentence_cv(sentences)
    md_hits = len(_AI_MARKER_PATTERNS_MD.findall(text))

    # Marker signal: scale 0-10 density → 0.0-1.0 AI probability
    marker_signal = float(np.clip(density / 10.0, 0.0, 1.0))

    # CV signal: low CV → AI (high p), high CV → human (low p)
    # CV=0.0 → 1.0 AI;  CV=1.0 → 0.0 AI;  CV=0.5 → 0.5 neutral
    cv_signal = float(np.clip(1.0 - cv * 1.5, 0.0, 1.0))

    # Blend weights: ML=55%, marker=30%, cadence=15%
    n_words = len(text.split())
    if n_words < 50:
        # Too short for heuristics to be reliable — keep mostly ML score
        combined = base_prob * 0.80 + marker_signal * 0.15 + cv_signal * 0.05
    else:
        combined = base_prob * 0.55 + marker_signal * 0.30 + cv_signal * 0.15

    # Markdown formatting (e.g. **word**) is an explicit hallmark of raw AI/LLM outputs
    if md_hits > 0:
        boost = min(0.35, md_hits * 0.12)
        combined = min(1.0, combined + boost)

    return float(np.clip(combined, 0.0, 1.0))


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
        weights = dict(self.cfg[task]["weights"])
        probs = self._model_probs(task, clean)

        # When XLM-R transformer is not loaded (e.g. running on scikit-learn/LightGBM),
        # ensure lgbm_style is not zero-weighted. lgbm_style is language-agnostic and
        # critical for detecting AI writing in English and Taglish prose.
        if "xlmr" not in probs:
            if task == "label":
                style_feat = self._style(clean)[0]
                tl_share = style_feat[12] if len(style_feat) > 12 else 0.0
                if tl_share > 0.04:
                    weights = {"tfidf_lr": 0.60, "lgbm_style": 0.40}
                else:
                    weights = {"tfidf_lr": 0.20, "lgbm_style": 0.80}
            elif task == "source":
                weights = {"tfidf_lr": 0.50, "lgbm_style": 0.50}

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
        ml_probability = float(1.0 / (1.0 + np.exp(-z)))

        # --- Tier 2/3/4: Blend ML score with AI-marker & sentence-cadence signals ---
        sentences = self.split_sentences(text)
        ai_probability = _heuristic_ai_boost(text, sentences, ml_probability)

        # Recompute band with boosted score
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
            "ml_probability": round(ml_probability, 4),
            "band": band,
            "thresholds": {"likely_human_below": round(t_human, 4), "likely_ai_at_or_above": round(t_ai, 4)},
            "word_count": n_words,
            "too_short": n_words < self.cfg["min_words_reliable"],
            "model_scores": {k: round(float(v[1]), 4) for k, v in per_model.items()},
            "ai_marker_density": round(_ai_marker_density(text), 3),
            "sentence_cv": round(_sentence_cv(sentences), 3),
            "likely_source": None,
            "source_probabilities": None,
        }

        # Stage 2: Source classifier — runs when Stage 1 detects AI content (score >= 35% or band is not likely_human).
        # If the text is classified as human, skip source attribution entirely.
        if band != "likely_human" or ai_probability >= 0.35:
            source_mix, _ = self._ensemble("source", clean)
            classes = self.cfg["source"]["classes"]
            probs_dict = {c: round(float(p), 4) for c, p in zip(classes, source_mix)}
            result["source_probabilities"] = probs_dict
            top = int(np.argmax(source_mix))
            result["likely_source"] = classes[top]
            result["source_confidence"] = round(float(source_mix[top]), 4)

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
                "sourceProbabilities": None,
                "sortedSources": []
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

            # If the sentence contains markdown bold keywords (e.g. **word**), flag as AI
            if _AI_MARKER_PATTERNS_MD.search(sentence):
                s_score = max(s_score, 80)
                label = "ai"

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

        # Stage 2 results — populated when Stage 1 detected AI (score >= 35%).
        # For human text, base_res["likely_source"] is None, so these stay empty.
        likely_source = base_res.get("likely_source")        # None for human text
        source_probs = base_res.get("source_probabilities")  # None for human text
        sorted_sources = []
        if source_probs:
            sorted_sources = sorted(
                [{"name": k, "score": int(round(v * 100)), "percentage": int(round(v * 100)), "probability": v} for k, v in source_probs.items()],
                key=lambda x: x["score"],
                reverse=True
            )

        if not likely_source and sorted_sources and overall_score >= 35:
            likely_source = sorted_sources[0]["name"]

        # Determine verdict — when Mixed / Hybrid Authorship Detected is displayed, also display the most likely source
        if overall_score >= 70:
            verdict = "High Synthetic (AI) Probability"
        elif overall_score >= 40:
            if likely_source:
                verdict = f"Mixed / Hybrid Authorship Detected (Likely: {likely_source})"
            else:
                verdict = "Mixed / Hybrid Authorship Detected"
        elif overall_score >= 20:
            verdict = "Likely Human with Minor Automated Assistance"
        else:
            verdict = "Authentic Human Authorship"

        # Build diagnostic flags
        ai_cnt = sum(1 for s in sentence_breakdown if s["label"] == "ai")
        flags = [f"{ai_cnt} of {len(sentences)} sentences classified as synthetic cadence"]

        md_matches = _AI_MARKER_PATTERNS_MD.findall(text)
        if md_matches:
            flags.append(f"Markdown formatting keyword detected ({len(md_matches)} instances, e.g. '**word**'): characteristic AI generative marker")

        if likely_source and sorted_sources:
            flags.append(f"Top AI Source Baseline: {likely_source} ({sorted_sources[0]['score']}% match)")
        elif overall_score >= 40:
            flags.append("Synthetic structure detected across multiple generative model baselines")

        scores_str = ", ".join(f"{k.upper()}: {int(round(v*100))}%" for k, v in base_res["model_scores"].items())
        flags.append(f"Model components: {scores_str}")

        # AI marker / cadence diagnostics
        marker_density = base_res.get("ai_marker_density", 0)
        sentence_cv_val = base_res.get("sentence_cv", 0.5)
        flags.append(f"AI cliché markers: {marker_density:.1f} per 100 words | Sentence CV: {sentence_cv_val:.2f}")

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
            "likelySource": likely_source,
            "sourceProbabilities": source_probs,
            "sortedSources": sorted_sources,
            "modelScores": base_res.get("model_scores")
        }
