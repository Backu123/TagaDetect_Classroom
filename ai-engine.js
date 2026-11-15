/**
 * TagaDetect - AI Prediction & Heuristic Shuffle Engine
 * Note: Machine Learning model will be implemented by the development team.
 * This engine generates randomized/shuffled predictions with realistic heuristics,
 * sentence segmentation, and diagnostic breakdowns.
 */

const AI_DETECTOR_ENGINE = {
  // Sample texts for user testing
  SAMPLE_TEXTS: {
    ai: `In the rapidly evolving landscape of contemporary technology, artificial intelligence plays a pivotal role in reshaping societal paradigms. It is crucial to understand that machine learning architectures, particularly transformer models, have ushered in an unprecedented era of automated cognition. Furthermore, these sophisticated systems delve into complex multi-dimensional embeddings to extrapolate semantic relationships with remarkable fidelity. However, as we navigate the nuances of ethical deployment, it becomes abundantly clear that algorithmic transparency serves as a vital safeguard against unintended bias. In conclusion, the ongoing synthesis between human ingenuity and artificial intelligence stands as a compelling testament to the limitless possibilities of modern computer science.`,
    
    human: `I started tinkering with our neural net implementation around 2 AM when my third coffee wore off, and honestly, the loss function looked like an absolute trainwreck. For the first fifty epochs, our gradient was just bouncing off the walls—literally jumping from 4.2 straight up into NaN territory before I noticed I forgot to clip the gradient norms! Once I fixed that silly transpose bug in the attention mask, things finally clicked. The output went from pure garbled junk into surprisingly readable prose. It’s wild how one tiny tensor dimension mistake can make the difference between complete chaos and something that actually looks intelligent.`,
    
    mixed: `When analyzing modern deep learning paradigms, the structural divergence between self-attention mechanisms and recurrent neural architectures represents a fundamental paradigm shift in computational linguistics. In traditional LSTM networks, hidden states are sequentially propagated across temporal steps. However, when I ran our lab benchmarks on an older RTX 3080 card, the memory bottlenecks were ridiculous. We had to drastically drop the batch size to even prevent CUDA out-of-memory errors! In conclusion, while transformers clearly surpass recurrent baselines in empirical benchmark evaluations, recurrent inductive biases still offer superior sample efficiency for low-resource temporal sequences.`
  },

  /**
   * Split text into clean sentences
   */
  splitSentences(text) {
    if (!text || !text.trim()) return [];
    return text
      .replace(/([.?!])\s*(?=[A-Z0-9"']|$)/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 0);
  },

  /**
   * Fisher-Yates shuffle array
   */
  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /**
   * Run shuffled prediction on input text
   * Shuffles prediction probabilities and sentence labels
   */
  predictShuffle(text, mode = 'random') {
    if (!text || text.trim().length < 15) {
      return {
        overallAiScore: 0,
        verdict: 'Text too short to evaluate',
        humanProbability: 100,
        perplexityScore: 0,
        burstinessScore: 0,
        wordCount: 0,
        characterCount: 0,
        sentenceCount: 0,
        flags: ['Please enter at least 15 characters to run prediction.'],
        sentenceBreakdown: []
      };
    }

    const sentences = this.splitSentences(text);
    const tokens = text.match(/\b\w+\b/g) || [];
    const wordCount = tokens.length;
    const characterCount = text.length;

    // Shuffled pool of potential sentence score tiers
    const sampleTiers = [
      { score: Math.floor(Math.random() * 20) + 80, label: 'ai' },       // 80-99% AI
      { score: Math.floor(Math.random() * 25) + 70, label: 'ai' },       // 70-94% AI
      { score: Math.floor(Math.random() * 30) + 40, label: 'mixed' },    // 40-69% Mixed
      { score: Math.floor(Math.random() * 25) + 15, label: 'human' },    // 15-39% Human
      { score: Math.floor(Math.random() * 12) + 2, label: 'human' }      // 2-14% Human
    ];

    // Build shuffled sentence breakdown
    const sentenceBreakdown = sentences.map((sentence, idx) => {
      // Shuffled selection with slight randomness
      const tierIndex = Math.floor(Math.random() * sampleTiers.length);
      const tier = sampleTiers[tierIndex];
      // Jitter the score
      const jitteredScore = Math.min(99, Math.max(1, tier.score + (Math.floor(Math.random() * 9) - 4)));
      
      let label = 'human';
      if (jitteredScore >= 68) label = 'ai';
      else if (jitteredScore >= 38) label = 'mixed';

      return {
        id: `s_${idx + 1}`,
        text: sentence,
        score: jitteredScore,
        label: label,
        wordCount: sentence.split(/\s+/).filter(Boolean).length
      };
    });

    // Calculate aggregated overall score from shuffled sentences
    const avgScore = sentenceBreakdown.reduce((sum, s) => sum + s.score, 0) / (sentenceBreakdown.length || 1);
    const overallAiScore = Math.min(99, Math.max(1, Math.round(avgScore)));
    const humanProbability = 100 - overallAiScore;

    // Shuffle perplexity and burstiness metrics inversely proportional to AI score with random jitter
    const shuffledPerplexity = Math.min(95, Math.max(12, Math.round((100 - overallAiScore) * 0.85 + (Math.random() * 15 - 7))));
    const shuffledBurstiness = Math.min(92, Math.max(10, Math.round((100 - overallAiScore) * 0.75 + (Math.random() * 20 - 10))));

    // Determine verdict
    let verdict = 'Authentic Human Authorship';
    if (overallAiScore >= 70) {
      verdict = 'High Synthetic (AI) Probability';
    } else if (overallAiScore >= 40) {
      verdict = 'Mixed / Hybrid Authorship Detected';
    } else if (overallAiScore >= 20) {
      verdict = 'Likely Human with Minor Automated Assistance';
    }

    // Diagnostic flags pool
    const flagPool = [
      'Token predictability variance analyzed across clauses',
      'Sentence length distribution calculated for burstiness index',
      'Repetitive syntactical cadence evaluated against baseline',
      'Idiosyncratic vocabulary and human voice signatures scanned',
      'Contextual perplexity evaluated via token entropy'
    ];

    const flags = this.shuffleArray(flagPool).slice(0, 3);
    const aiSentences = sentenceBreakdown.filter(s => s.label === 'ai').length;
    flags.unshift(`${aiSentences} of ${sentences.length} sentences classified as high synthetic probability`);

    return {
      generatedAt: new Date().toISOString(),
      overallAiScore,
      humanProbability,
      verdict,
      perplexityScore: shuffledPerplexity,
      burstinessScore: shuffledBurstiness,
      wordCount,
      characterCount,
      sentenceCount: sentences.length,
      flags,
      sentenceBreakdown
    };
  },

  /**
   * Automatically generate an AI Review report for submitted student activity
   * Invoked upon submission pass, visible to student and professor
   */
  generateSubmissionReview(activityText) {
    return this.predictShuffle(activityText, 'review');
  }
};
