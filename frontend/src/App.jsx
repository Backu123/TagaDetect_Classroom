import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'

/* =====================================================================
   SECTION 1: STORAGE (saves data in the browser, like data.js did)
   ===================================================================== */

const STORAGE_KEYS = {
  CURRENT_USER: 'tagadetect_current_user',
  THEME: 'tagadetect_theme',
  USERS: 'tagadetect_users',
  CLASSES: 'tagadetect_classes',
  ACTIVITIES: 'tagadetect_activities',
  SUBMISSIONS: 'tagadetect_submissions',
  MATERIALS: 'tagadetect_materials',
  FEEDBACK: 'tagadetect_ai_feedback',
}

const store = {
  get(key, fallback) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage errors
    }
  },
}

// A state value that is saved in the browser every time it changes
function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => store.get(key, initialValue))
  useEffect(() => {
    store.set(key, value)
  }, [key, value])
  return [value, setValue]
}

/* =====================================================================
   SECTION 2: SAMPLE DATA (from data.js)
   ===================================================================== */

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'

const INITIAL_USERS = [
  {
    id: 'usr_student_1',
    name: 'Alex Rivera',
    username: 'alex_r',
    email: 'alex.rivera@student.tagadetect.edu',
    password: 'password123',
    role: 'student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    university: 'Polytechnic State University',
    department: 'Computer Science (3IS1)',
    bio: 'BSCS 3rd year student taking Automata Theory, IS Project Management, and Networking.',
    joinedDate: '2026-09-01',
  },
  {
    id: 'usr_student_2',
    name: 'Chloe Chen',
    username: 'chloe_c',
    email: 'chloe.chen@student.tagadetect.edu',
    password: 'password123',
    role: 'student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    university: 'Polytechnic State University',
    department: 'Information Technology (3IS1)',
    bio: 'Junior IT student interested in human-computer interaction and web applications.',
    joinedDate: '2026-09-15',
  },
  {
    id: 'usr_student_3',
    name: 'Marcus Brody',
    username: 'm_brody',
    email: 'marcus.brody@student.tagadetect.edu',
    password: 'password123',
    role: 'student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    university: 'Polytechnic State University',
    department: 'Computer Science (3IS1)',
    bio: 'Passionate about algorithms and systems architecture.',
    joinedDate: '2026-09-10',
  },
  {
    id: 'usr_student_4',
    name: 'Sophia Wu',
    username: 'sophia_wu',
    email: 'sophia.wu@student.tagadetect.edu',
    password: 'password123',
    role: 'student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    university: 'Polytechnic State University',
    department: 'Computer Science (3IS1)',
    bio: 'Undergraduate researcher in formal grammars and logic.',
    joinedDate: '2026-09-12',
  },
  {
    id: 'usr_prof_1',
    name: 'Kristine Kaye Arida',
    username: 'prof_arida',
    email: 'kristine.arida@faculty.tagadetect.edu',
    password: 'password123',
    role: 'professor',
    status: 'approved',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    university: 'Polytechnic State University',
    department: 'College of Computer Studies',
    bio: 'Instructor for Automata Theory, Formal Languages, and Information Systems.',
    joinedDate: '2026-01-10',
  },
  {
    id: 'usr_prof_2',
    name: 'Neirro Ilagan',
    username: 'prof_ilagan',
    email: 'neirro.ilagan@faculty.tagadetect.edu',
    password: 'password123',
    role: 'professor',
    status: 'approved',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    university: 'Polytechnic State University',
    department: 'Computer Engineering & Networking',
    bio: 'Assistant Professor handling Data Communications, Networking, and Infrastructure.',
    joinedDate: '2026-02-15',
  },
  {
    id: 'usr_prof_3',
    name: 'Prof. Sofia Al-Mansoor',
    username: 'prof_sofia',
    email: 'sofia.mansoor@faculty.tagadetect.edu',
    password: 'password123',
    role: 'professor',
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
    university: 'Polytechnic State University',
    department: 'Information Assurance & Security',
    bio: 'Lecturer in Information Assurance, Security Audits, and Cyberethics awaiting administrative clearance.',
    joinedDate: '2026-11-12',
  },
  {
    id: 'usr_admin',
    name: 'Eleanor Sterling',
    username: 'admin_eleanor',
    email: 'eleanor.sterling@admin.tagadetect.edu',
    password: 'password123',
    role: 'admin',
    status: 'approved',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    university: 'TagaDetect Academic Governance',
    department: 'Registrar & Faculty Oversight',
    bio: 'Academic Administrator managing faculty clearances, role permissions, and system compliance.',
    joinedDate: '2025-08-01',
  },
]

const INITIAL_CLASSES = [
  {
    id: 'cls_1',
    subjectName: 'CMSC 305 - Automata Theory & Formal Languages',
    section: '3IS1',
    code: 'AUT-305',
    professorId: 'usr_prof_1',
    professorName: 'Kristine Kaye Arida',
    professorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    room: 'Lab 304',
    schedule: 'Mon / Wed 10:00 AM - 11:30 AM',
    description: 'Study of finite automata, pushdown automata, context-free grammars, Turing machines, and computability.',
    studentIds: ['usr_student_1', 'usr_student_2', 'usr_student_3', 'usr_student_4'],
  },
  {
    id: 'cls_2',
    subjectName: '2026 CMSC 306 - Information Systems',
    section: 'BSCS 3IS-1',
    code: 'IS-306',
    professorId: 'usr_prof_1',
    professorName: 'Kristine Kaye Arida',
    professorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    room: 'Room 201',
    schedule: 'Tue / Thu 1:00 PM - 2:30 PM',
    description: 'Enterprise information systems architectures, database integration, and business process modeling.',
    studentIds: ['usr_student_1', 'usr_student_3'],
  },
  {
    id: 'cls_3',
    subjectName: '2026 CMSC 309 - IS Project Management',
    section: '3IS-1',
    code: 'PM-309',
    professorId: 'usr_prof_1',
    professorName: 'Kristine Kaye Arida',
    professorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    room: 'Online Virtual Lab',
    schedule: 'Friday 9:00 AM - 12:00 PM',
    description: 'Agile methodologies, sprint cycles, and software quality assurance in enterprise applications.',
    studentIds: ['usr_student_1', 'usr_student_2', 'usr_student_4'],
  },
  {
    id: 'cls_4',
    subjectName: 'CMSC 310 DATA COMMUNICATION & NETWORKING',
    section: 'BSCS 3IS1 / 2026-2027 / 1st SEM',
    code: 'NET-310',
    professorId: 'usr_prof_2',
    professorName: 'Neirro Ilagan',
    professorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    room: 'Cisco Networking Lab',
    schedule: 'Mon / Wed 1:00 PM - 2:30 PM',
    description: 'OSI 7-layer model, TCP/IP protocols, subnetting, packet inspection, and transmission security.',
    studentIds: ['usr_student_1', 'usr_student_2', 'usr_student_3'],
  },
]

const INITIAL_ACTIVITIES = [
  {
    id: 'act_1',
    classId: 'cls_1',
    title: 'Activity 1: Deterministic vs Non-Deterministic Finite Automata',
    description: 'Write an analytical essay comparing DFA and NFA computational state space and language equivalence. Contrast subset construction algorithms with direct minimization techniques.',
    dueDate: '2026-11-20',
    maxPoints: 100,
    rubric: 'Conceptual Rigor (40 pts), Formal Proof Clarity (30 pts), Original Analysis (30 pts)',
    status: 'open',
    createdAt: '2026-11-01',
  },
  {
    id: 'act_2',
    classId: 'cls_1',
    title: 'Activity 2: Chomsky Hierarchy & Context-Free Grammars',
    description: 'Critique the computational boundaries between regular grammars and context-free grammars with respect to modern compiler syntax trees.',
    dueDate: '2026-11-26',
    maxPoints: 50,
    rubric: 'Syntactic parsing accuracy (25 pts), Practical compiler examples (25 pts)',
    status: 'open',
    createdAt: '2026-11-05',
  },
  {
    id: 'act_3',
    classId: 'cls_4',
    title: 'Research Analysis: TCP Congestion Control Algorithms',
    description: 'Compare BBR, Reno, and Cubic congestion control algorithms across high-latency satellite and fiber networks.',
    dueDate: '2026-11-24',
    maxPoints: 100,
    rubric: 'Protocol analysis (50 pts), Performance benchmarks (50 pts)',
    status: 'open',
    createdAt: '2026-11-08',
  },
]

const INITIAL_MATERIALS = [
  {
    id: 'mat_1',
    classId: 'cls_1',
    title: 'CMSC 305 Course Syllabus & Grading Policy',
    category: 'Syllabus & Guidelines',
    type: 'PDF Document',
    description: 'Detailed course schedule, examination dates, academic integrity policies, and grading breakdown for Semester 1.',
    postedAt: '2026-09-02',
    fileSize: '1.2 MB',
  },
  {
    id: 'mat_2',
    classId: 'cls_1',
    title: 'Module 1 Lecture Slides: Finite State Automata & Transitions',
    category: 'Lecture Slides',
    type: 'Presentation Slides',
    description: 'Comprehensive slides covering formal alphabet definitions, transition tables, state diagram graphs, and epsilon-moves.',
    postedAt: '2026-09-10',
    fileSize: '4.8 MB',
  },
  {
    id: 'mat_3',
    classId: 'cls_1',
    title: 'JFLAP State Machine Simulator Software & Lab Guide',
    category: 'Lab Tools & Guides',
    type: 'Software Resource',
    description: 'Interactive visualization package for designing, animating, and validating DFA, NFA, PDA, and Turing Machines.',
    postedAt: '2026-09-18',
    fileSize: '12.4 MB',
  },
  {
    id: 'mat_4',
    classId: 'cls_1',
    title: 'Chomsky Hierarchy Quick Reference Chart',
    category: 'Reference Cheat Sheet',
    type: 'PDF Document',
    description: 'Single-page tabular comparison of Type 0, Type 1, Type 2, and Type 3 languages with corresponding machine models.',
    postedAt: '2026-10-05',
    fileSize: '850 KB',
  },
  {
    id: 'mat_5',
    classId: 'cls_4',
    title: 'OSI 7-Layer Protocol Reference Guide & Packet Formats',
    category: 'Reference Manual',
    type: 'PDF Document',
    description: 'Detailed protocol headers for Ethernet, IPv4, IPv6, TCP, UDP, and application layer encapsulations.',
    postedAt: '2026-09-04',
    fileSize: '2.6 MB',
  },
  {
    id: 'mat_6',
    classId: 'cls_4',
    title: 'Wireshark Packet Capture & Network Inspection Lab Manual',
    category: 'Lab Manual',
    type: 'Lab Guide',
    description: 'Step-by-step hands-on tutorial for capturing live packets, filtering three-way handshakes, and analyzing jitter.',
    postedAt: '2026-09-22',
    fileSize: '3.1 MB',
  },
]

const INITIAL_SUBMISSIONS = [
  {
    id: 'sub_1',
    activityId: 'act_1',
    studentId: 'usr_student_1',
    studentName: 'Alex Rivera',
    studentEmail: 'alex.rivera@student.tagadetect.edu',
    submittedAt: '2026-11-10T14:32:00Z',
    content: `When analyzing modern computational models, the structural equivalence between deterministic finite automata and non-deterministic finite automata represents a cornerstone of formal language theory. In a DFA, each state-transition pair yields exactly one unique successor state, guaranteeing deterministic linear-time execution across input sequences. Conversely, non-deterministic automata allow multiple simultaneous branch transitions for identical input symbols, effectively exploring power-set search spaces in parallel.\n\nHowever, via the classical powerset construction algorithm (subset construction), every NFA with N states can be transformed into an equivalent DFA with at most 2^N states. In conclusion, while NFAs provide vastly simpler human conceptualizations for complex regular expressions, physical hardware executes equivalent DFAs to preserve deterministic clock cycles.`,
    wordCount: 122,
    aiReview: {
      generatedAt: '2026-11-10T14:32:01Z',
      overallAiScore: 72,
      verdict: 'High Synthetic Probability',
      perplexityScore: 26,
      burstinessScore: 21,
      flags: ['Uniform sentence cadence detected', 'Formulaic transition ("In conclusion")', 'High token predictability'],
      sentenceBreakdown: [
        { text: 'When analyzing modern computational models, the structural equivalence between deterministic finite automata and non-deterministic finite automata represents a cornerstone of formal language theory.', score: 81, label: 'ai' },
        { text: 'In a DFA, each state-transition pair yields exactly one unique successor state, guaranteeing deterministic linear-time execution across input sequences.', score: 76, label: 'ai' },
        { text: 'Conversely, non-deterministic automata allow multiple simultaneous branch transitions for identical input symbols, effectively exploring power-set search spaces in parallel.', score: 78, label: 'ai' },
        { text: 'However, via the classical powerset construction algorithm (subset construction), every NFA with N states can be transformed into an equivalent DFA with at most 2^N states.', score: 45, label: 'mixed' },
        { text: 'In conclusion, while NFAs provide vastly simpler human conceptualizations for complex regular expressions, physical hardware executes equivalent DFAs to preserve deterministic clock cycles.', score: 88, label: 'ai' },
      ],
    },
    grade: 90,
    gradedAt: '2026-11-12T16:10:00Z',
    gradedBy: 'Kristine Kaye Arida',
    professorFeedback: 'Excellent explanation of powerset construction. Note the automated AI phrasing score; in the next assignment, elaborate with your own hand-drawn state transition diagrams.',
  },
  {
    id: 'sub_2',
    activityId: 'act_1',
    studentId: 'usr_student_2',
    studentName: 'Chloe Chen',
    studentEmail: 'chloe.chen@student.tagadetect.edu',
    submittedAt: '2026-11-11T09:15:00Z',
    content: `I spent Thursday night drawing transition tables on my whiteboard until my dry erase marker dried up! What really clicked for me was thinking about an NFA as a timeline splitter, like in sci-fi movies where every time a branching path opens, the universe duplicates itself to test every possibility at once.\n\nA DFA doesn't have that luxury. It has to make up its mind on the spot. That's why powerset construction feels like compiling all those branching multiverse timelines into one giant, hyper-organized map before you even start reading the input. It might blow up exponentially in worst-case state space, but once built, lookup is blazing fast!`,
    wordCount: 111,
    aiReview: {
      generatedAt: '2026-11-11T09:15:01Z',
      overallAiScore: 9,
      verdict: 'Authentic Human Authorship',
      perplexityScore: 89,
      burstinessScore: 67,
      flags: ['Dynamic sentence length variability', 'First-person empirical narration', 'Creative metaphorical explanations'],
      sentenceBreakdown: [
        { text: 'I spent Thursday night drawing transition tables on my whiteboard until my dry erase marker dried up!', score: 5, label: 'human' },
        { text: 'What really clicked for me was thinking about an NFA as a timeline splitter, like in sci-fi movies where every time a branching path opens, the universe duplicates itself to test every possibility at once.', score: 8, label: 'human' },
        { text: "A DFA doesn't have that luxury.", score: 6, label: 'human' },
        { text: 'It has to make up its mind on the spot.', score: 10, label: 'human' },
        { text: "That's why powerset construction feels like compiling all those branching multiverse timelines into one giant, hyper-organized map before you even start reading the input.", score: 12, label: 'human' },
        { text: 'It might blow up exponentially in worst-case state space, but once built, lookup is blazing fast!', score: 7, label: 'human' },
      ],
    },
    grade: 99,
    gradedAt: '2026-11-12T16:25:00Z',
    gradedBy: 'Kristine Kaye Arida',
    professorFeedback: 'Outstanding intuition and analogy, Chloe! The timeline splitter metaphor is phenomenal.',
  },
]

const INITIAL_FEEDBACK = [
  {
    id: 'fb_1',
    userId: 'usr_student_1',
    userName: 'Alex Rivera',
    userRole: 'student',
    timestamp: '2026-11-10T15:00:00Z',
    detectedScore: 72,
    accuracyRating: 'partially_accurate',
    feedbackType: 'False Positive Flags',
    comment: 'The concluding sentence was flagged as 88% AI, but I drafted that summary based on my lecture slides. The first paragraph indeed used phrasing from an AI outline.',
    status: 'Reviewed',
  },
  {
    id: 'fb_2',
    userId: 'usr_prof_1',
    userName: 'Kristine Kaye Arida',
    userRole: 'professor',
    timestamp: '2026-11-12T11:20:00Z',
    detectedScore: 9,
    accuracyRating: 'highly_accurate',
    feedbackType: 'Accurate Detection',
    comment: "Very accurate detection for Chloe Chen's paper. Correctly identified human burstiness and distinctive metaphorical phrasing.",
    status: 'Confirmed',
  },
]

/* =====================================================================
   SECTION 3: DETECTOR ENGINE (from ai-engine.js, still shuffled)
   Replace the shuffle logic inside predictShuffle with your real
   machine learning model when it is ready.
   ===================================================================== */

const DETECTOR_SAMPLES = {
  ai: `In today's rapidly evolving digital landscape, artificial intelligence plays an increasingly pivotal role across diverse educational environments. Furthermore, it is essential to recognize the multifaceted implications that arise from autonomous algorithmic workflows. By leveraging advanced natural language processing paradigms, educational software can dynamically adapt to user requirements. In conclusion, the integration of computational tools fosters pedagogical enhancement while maintaining rigorous systematic evaluation.`,
  human: `I honestly didn't think I would enjoy Automata Theory this semester, but Professor Arida's whiteboard breakdown of NFAs vs DFAs really changed my perspective! Drawing out state transitions with branching paths felt just like walking through a sci-fi multiverse map. I definitely spent way too many hours debugging transition tables, but having it click during Friday lab was such a huge relief.`,
  mixed: `In contemporary computational science, formal language theory establishes mathematical foundations for compiler construction and syntactic validation. However, when I first started learning regex in class, I kept getting lost in catastrophic backtracking loops! Modern lexers handle finite state transitions efficiently, but manually writing out the state table for our class project proved to be quite an adventure.`,
}

function splitSentences(text) {
  if (!text || !text.trim()) return []
  return text
    .replace(/([.?!])\s*(?=[A-Z0-9"']|$)/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function predictShuffle(text) {
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
      sentenceBreakdown: [],
    }
  }

  const sentences = splitSentences(text)
  const tokens = text.match(/\b\w+\b/g) || []
  const wordCount = tokens.length
  const characterCount = text.length

  const sampleTiers = [
    { score: Math.floor(Math.random() * 20) + 80, label: 'ai' },
    { score: Math.floor(Math.random() * 25) + 70, label: 'ai' },
    { score: Math.floor(Math.random() * 30) + 40, label: 'mixed' },
    { score: Math.floor(Math.random() * 25) + 15, label: 'human' },
    { score: Math.floor(Math.random() * 12) + 2, label: 'human' },
  ]

  const sentenceBreakdown = sentences.map((sentence, idx) => {
    const tier = sampleTiers[Math.floor(Math.random() * sampleTiers.length)]
    const jitteredScore = Math.min(
      99,
      Math.max(1, tier.score + (Math.floor(Math.random() * 9) - 4))
    )

    let label = 'human'
    if (jitteredScore >= 68) label = 'ai'
    else if (jitteredScore >= 38) label = 'mixed'

    return {
      id: `s_${idx + 1}`,
      text: sentence,
      score: jitteredScore,
      label,
      wordCount: sentence.split(/\s+/).filter(Boolean).length,
    }
  })

  const avgScore =
    sentenceBreakdown.reduce((sum, s) => sum + s.score, 0) /
    (sentenceBreakdown.length || 1)
  const overallAiScore = Math.min(99, Math.max(1, Math.round(avgScore)))
  const humanProbability = 100 - overallAiScore

  const perplexityScore = Math.min(
    95,
    Math.max(12, Math.round((100 - overallAiScore) * 0.85 + (Math.random() * 15 - 7)))
  )
  const burstinessScore = Math.min(
    92,
    Math.max(10, Math.round((100 - overallAiScore) * 0.75 + (Math.random() * 20 - 10)))
  )

  let verdict = 'Authentic Human Authorship'
  if (overallAiScore >= 70) verdict = 'High Synthetic (AI) Probability'
  else if (overallAiScore >= 40) verdict = 'Mixed / Hybrid Authorship Detected'
  else if (overallAiScore >= 20) verdict = 'Likely Human with Minor Automated Assistance'

  const flagPool = [
    'Token predictability variance analyzed across clauses',
    'Sentence length distribution calculated for burstiness index',
    'Repetitive syntactical cadence evaluated against baseline',
    'Idiosyncratic vocabulary and human voice signatures scanned',
    'Contextual perplexity evaluated via token entropy',
  ]
  const flags = shuffleArray(flagPool).slice(0, 3)
  const aiSentences = sentenceBreakdown.filter((s) => s.label === 'ai').length
  flags.unshift(
    `${aiSentences} of ${sentences.length} sentences classified as high synthetic probability`
  )

  return {
    generatedAt: new Date().toISOString(),
    overallAiScore,
    humanProbability,
    verdict,
    perplexityScore,
    burstinessScore,
    wordCount,
    characterCount,
    sentenceCount: sentences.length,
    flags,
    sentenceBreakdown,
  }
}

// Runs automatically when a student passes an activity
function generateSubmissionReview(text) {
  return predictShuffle(text)
}

/* =====================================================================
   SECTION 4: APP CONTEXT, ROUTER, AND SHARED BUILDING BLOCKS
   ===================================================================== */

const AppContext = createContext(null)

function useApp() {
  return useContext(AppContext)
}

// Router: the page is chosen by the address after the # in the browser
function subscribeHash(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function useRoute() {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => ''
  )
  const path = hash.replace(/^#\/?/, '')
  const [name = '', param = null] = path.split('/')
  return { name: name || 'home', param }
}

function navigate(path = '') {
  window.location.hash = `#/${path}`
}

// Shared style pieces
const cardClass =
  'bg-card border border-line rounded-[20px] p-7 shadow-card transition-colors duration-200'

const formLabelClass = 'block text-[13px] font-semibold text-muted mb-2'

const formInputClass =
  'w-full px-4 py-3 bg-card-inner border border-line rounded-[14px] text-main text-sm font-[inherit] focus:outline-none focus:border-accent transition-colors duration-200'

function btn(kind = 'primary', extra = '') {
  const base =
    'inline-flex items-center justify-center gap-2 text-sm font-semibold px-[22px] py-[11px] rounded-full border border-transparent cursor-pointer transition-all duration-200 no-underline disabled:opacity-50 disabled:cursor-not-allowed'
  const kinds = {
    primary:
      'bg-accent text-white shadow-md shadow-accent/30 hover:bg-accent-hover hover:-translate-y-px',
    secondary:
      'bg-card border-line text-main hover:border-accent hover:text-accent',
  }
  return `${base} ${kinds[kind]} ${extra}`
}

function badge(variant = 'ai', extra = '') {
  const base =
    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border'
  const variants = {
    ai: 'bg-accent/20 text-accent border-accent',
    human: 'bg-emerald/20 text-emerald border-emerald',
    mixed: 'bg-amber/20 text-amber border-amber',
    pending: 'bg-rose/20 text-rose border-rose',
    success: 'bg-emerald/20 text-emerald border-emerald',
  }
  return `${base} ${variants[variant]} ${extra}`
}

// Popup window (used for join class, create class, grading, and more)
function Modal({ open, onClose, title, subtitle, maxWidth = 640, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-overlay backdrop-blur-[8px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-h-[90vh] overflow-y-auto bg-card border border-line rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between gap-4 px-7 py-[22px] border-b border-line">
          <div>
            <h2 className="text-lg font-bold text-main">{title}</h2>
            {subtitle && <p className="text-[13px] text-muted mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="bg-transparent border-none text-muted text-xl cursor-pointer hover:text-main"
          >
            ✕
          </button>
        </div>
        <div className="p-7">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-line">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Small messages that appear at the bottom right
function Toasts({ toasts }) {
  const borders = {
    success: 'border-l-accent',
    info: 'border-l-accent',
    warning: 'border-l-amber',
    danger: 'border-l-rose',
    error: 'border-l-rose',
  }
  const icons = {
    success: '✓',
    info: 'ℹ️',
    warning: '⚠️',
    danger: '✕',
    error: '✕',
  }

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in flex items-center gap-2.5 min-w-[280px] px-5 py-3.5 bg-card border border-line border-l-4 ${borders[t.type] || borders.success} rounded-[14px] shadow-[0_8px_20px_rgba(0,0,0,0.4)] text-main text-sm`}
        >
          <span className="font-bold">{icons[t.type] || icons.success}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

// Top navigation bar (from nav.js)
function Navbar({ route }) {
  const { user, users, theme, toggleTheme, signOut, switchUser, pendingCount } = useApp()

  const isLoggedIn = !!user
  const isStudent = user?.role === 'student'
  const isProf = user?.role === 'professor'
  const isAdmin = user?.role === 'admin'
  const active = route.name === 'class' ? 'home' : route.name

  const navItem = (page) =>
    `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold no-underline cursor-pointer transition-all duration-200 ${
      active === page
        ? 'bg-accent text-white shadow-md shadow-accent/30'
        : 'text-muted hover:text-main hover:bg-card'
    }`

  const homeLabel = isStudent ? 'Enrolled Classes' : isProf ? 'Classes Handled' : 'Classes'

  return (
    <header className="sticky top-0 z-[100] h-[72px] bg-bg-dark border-b border-line backdrop-blur-sm flex items-center justify-between px-10 max-md:px-4 transition-colors duration-200">
      <a href="#/" className="flex items-center gap-3 no-underline cursor-pointer">
        <div
          className="w-[38px] h-[38px] rounded-[14px] flex items-center justify-center text-white font-extrabold text-[19px] shadow-md shadow-accent/30"
          style={{ background: 'linear-gradient(135deg, var(--color-accent), #6366f1)' }}
        >
          T
        </div>
        <div className="text-xl font-extrabold tracking-[-0.5px] text-main">
          Taga<span className="text-accent">Detect</span>
        </div>
      </a>

      <nav className="flex items-center gap-2 max-md:hidden">
        <a href="#/" className={navItem('home')}>
          {homeLabel}
        </a>
        <a href="#/detector" className={navItem('detector')}>
          AI Detector
        </a>
        <a href="#/about" className={navItem('about')}>
          About
        </a>
        <a href="#/faq" className={navItem('faq')}>
          FAQ
        </a>
        {isLoggedIn && (
          <a href="#/settings" className={navItem('settings')}>
            Settings
          </a>
        )}
        {isAdmin && (
          <a href="#/admin" className={navItem('admin')}>
            Admin Approvals
            {pendingCount > 0 && (
              <span className="ml-1 px-[7px] py-0.5 text-[11px] font-semibold rounded-full bg-rose/20 text-rose border border-rose">
                {pendingCount}
              </span>
            )}
          </a>
        )}
      </nav>

      <div className="flex items-center gap-3.5">
        {isLoggedIn && (
          <select
            value={user.id}
            onChange={(e) => switchUser(e.target.value)}
            title="Demo role switcher"
            className="bg-card border border-line text-main px-3.5 py-[7px] rounded-full text-xs font-semibold cursor-pointer outline-none focus:border-accent max-lg:hidden"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="w-[38px] h-[38px] rounded-full border border-line bg-card text-main cursor-pointer flex items-center justify-center text-base transition-all duration-200 hover:border-accent hover:rotate-[15deg]"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {isLoggedIn ? (
          <>
            <a
              href="#/settings"
              title="View Profile & Settings"
              className="flex items-center gap-2 py-1 pr-2.5 pl-1 rounded-full bg-card-inner border border-line no-underline cursor-pointer transition-all duration-200 hover:border-accent hover:bg-card"
            >
              <img
                src={user.avatar || FALLBACK_AVATAR}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="text-[13px] font-semibold text-main max-sm:hidden">
                {user.name.split(' ')[0]}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-accent max-sm:hidden">
                {user.role}
              </span>
            </a>

            <button
              type="button"
              onClick={signOut}
              title="Sign out of your account"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border border-line text-muted bg-card-inner rounded-full cursor-pointer transition-all duration-200 hover:border-rose hover:text-rose hover:bg-rose/10"
            >
              <span>Sign Out</span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <a href="#/login" className={btn('secondary', '!px-3.5 !py-1.5 !text-xs')}>
              Sign In
            </a>
            <a href="#/signup" className={btn('primary', '!px-4 !py-1.5 !text-xs')}>
              Sign Up
            </a>
          </>
        )}
      </div>
    </header>
  )
}

/* =====================================================================
   SECTION 5: PAGES
   Each page below is a temporary placeholder. The next stages replace
   them one by one with the real pages.
   ===================================================================== */

function PlaceholderPage({ title }) {
  const { user, users, signIn } = useApp()
  const demoIds = ['usr_student_1', 'usr_prof_1', 'usr_admin']

  return (
    <div className={`${cardClass} max-w-[560px] mx-auto text-center`}>
      <h1 className="text-2xl font-extrabold mb-2">{title}</h1>
      <p className="text-muted text-sm mb-5">
        This screen is a placeholder. It is replaced in a later stage.
      </p>
      {user ? (
        <p className="text-sm">
          Signed in as <strong>{user.name}</strong> ({user.role})
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-muted">Temporary sign in for testing:</p>
          {demoIds.map((id) => {
            const u = users.find((x) => x.id === id)
            return (
              <button
                key={id}
                type="button"
                className={btn('primary')}
                onClick={() => {
                  signIn(id)
                  navigate('')
                }}
              >
                Sign in as {u.name} ({u.role})
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LoginPage() {
  return <PlaceholderPage title="Login" />
}

function SignupPage() {
  return <PlaceholderPage title="Sign Up" />
}

function HomePage() {
  return <PlaceholderPage title="Home (Classes)" />
}

function ClassPage() {
  return <PlaceholderPage title="Class Page" />
}

function DetectorPage() {
  return <PlaceholderPage title="AI Detector" />
}

function AboutPage() {
  return <PlaceholderPage title="About" />
}

function FaqPage() {
  return <PlaceholderPage title="FAQ" />
}

function SettingsPage() {
  return <PlaceholderPage title="Settings" />
}

function AdminPage() {
  return <PlaceholderPage title="Admin Approvals" />
}

const PAGES = {
  login: LoginPage,
  signup: SignupPage,
  home: HomePage,
  class: ClassPage,
  detector: DetectorPage,
  about: AboutPage,
  faq: FaqPage,
  settings: SettingsPage,
  admin: AdminPage,
}

/* =====================================================================
   SECTION 6: APP (holds all the data and decides which page to show)
   ===================================================================== */

function App() {
  const route = useRoute()

  const [theme, setTheme] = usePersistedState(STORAGE_KEYS.THEME, 'dark')
  const [users, setUsers] = usePersistedState(STORAGE_KEYS.USERS, INITIAL_USERS)
  const [classes, setClasses] = usePersistedState(STORAGE_KEYS.CLASSES, INITIAL_CLASSES)
  const [activities, setActivities] = usePersistedState(
    STORAGE_KEYS.ACTIVITIES,
    INITIAL_ACTIVITIES
  )
  const [materials, setMaterials] = usePersistedState(
    STORAGE_KEYS.MATERIALS,
    INITIAL_MATERIALS
  )
  const [submissions, setSubmissions] = usePersistedState(
    STORAGE_KEYS.SUBMISSIONS,
    INITIAL_SUBMISSIONS
  )
  const [feedback, setFeedback] = usePersistedState(
    STORAGE_KEYS.FEEDBACK,
    INITIAL_FEEDBACK
  )
  const [currentUserId, setCurrentUserId] = usePersistedState(
    STORAGE_KEYS.CURRENT_USER,
    null
  )
  const [toasts, setToasts] = useState([])

  const user = users.find((u) => u.id === currentUserId) || null
  const pendingCount = users.filter(
    (u) => u.role === 'professor' && u.status === 'pending'
  ).length

  // Apply the theme to the whole page
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Scroll to the top when the page changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.name, route.param])

  // Pages that need a signed in user
  const needsLogin = ['home', 'settings', 'admin', 'class'].includes(route.name)
  const blocked = needsLogin && !user
  useEffect(() => {
    if (blocked) navigate('login')
  }, [blocked])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    toast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`)
  }

  const signIn = (userId) => {
    setCurrentUserId(userId)
  }

  const switchUser = (userId) => {
    const target = users.find((u) => u.id === userId)
    if (!target) return
    setCurrentUserId(userId)
    toast(`Switched view to ${target.name} (${target.role.toUpperCase()})`)
    navigate('')
  }

  const signOut = () => {
    setCurrentUserId(null)
    toast('Signed out successfully.', 'info')
    navigate('login')
  }

  const ctx = {
    user,
    users,
    setUsers,
    classes,
    setClasses,
    activities,
    setActivities,
    materials,
    setMaterials,
    submissions,
    setSubmissions,
    feedback,
    setFeedback,
    theme,
    setTheme,
    toggleTheme,
    toast,
    signIn,
    signOut,
    switchUser,
    pendingCount,
  }

  const Page = PAGES[route.name] || HomePage
  const isAuthPage = route.name === 'login' || route.name === 'signup'

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen flex flex-col">
        {!isAuthPage && <Navbar route={route} />}

        {isAuthPage ? (
          <main className="flex-1 flex items-center justify-center px-5 py-10">
            <Page route={route} />
          </main>
        ) : (
          <main className="w-full max-w-[1240px] mx-auto px-6 pt-9 pb-20">
            {blocked ? null : <Page route={route} />}
          </main>
        )}

        <Toasts toasts={toasts} />
      </div>
    </AppContext.Provider>
  )
}

export default App