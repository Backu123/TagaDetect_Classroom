import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { supabase } from "./supabaseClient";
// Loads every PNG in src/assets/icons. Vite supports this without any install.
const ICON_FILES = import.meta.glob("./assets/icons/*.png", {
  eager: true,
  import: "default",
});

function Icon({ name, size = 16, className = "" }) {
  const src = ICON_FILES[`./assets/icons/${name}.png`];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}

/* =====================================================================
   SECTION 1: STORAGE (saves data in the browser, like data.js did)
   ===================================================================== */

const STORAGE_KEYS = {
  CURRENT_USER: "tagadetect_current_user",
  THEME: "tagadetect_theme",
  USERS: "tagadetect_users",
  CLASSES: "tagadetect_classes",
  ACTIVITIES: "tagadetect_activities",
  SUBMISSIONS: "tagadetect_submissions",
  MATERIALS: "tagadetect_materials",
  FEEDBACK: "tagadetect_ai_feedback_v2",
};

const store = {
  get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  },
};

// A state value that is saved in the browser every time it changes
function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => store.get(key, initialValue));
  useEffect(() => {
    store.set(key, value);
  }, [key, value]);
  return [value, setValue];
}

/* =====================================================================
   SECTION 2: SAMPLE DATA (from data.js)
   ===================================================================== */

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";

const INITIAL_USERS = [
  {
    id: "usr_student_1",
    name: "Alex Rivera",
    username: "alex_r",
    email: "alex.rivera@student.tagadetect.edu",
    password: "password123",
    role: "student",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    university: "Polytechnic State University",
    department: "Computer Science (3IS1)",
    bio: "BSCS 3rd year student taking Automata Theory, IS Project Management, and Networking.",
    joinedDate: "2026-09-01",
  },
  {
    id: "usr_student_2",
    name: "Chloe Chen",
    username: "chloe_c",
    email: "chloe.chen@student.tagadetect.edu",
    password: "password123",
    role: "student",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    university: "Polytechnic State University",
    department: "Information Technology (3IS1)",
    bio: "Junior IT student interested in human-computer interaction and web applications.",
    joinedDate: "2026-09-15",
  },
  {
    id: "usr_student_3",
    name: "Marcus Brody",
    username: "m_brody",
    email: "marcus.brody@student.tagadetect.edu",
    password: "password123",
    role: "student",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    university: "Polytechnic State University",
    department: "Computer Science (3IS1)",
    bio: "Passionate about algorithms and systems architecture.",
    joinedDate: "2026-09-10",
  },
  {
    id: "usr_student_4",
    name: "Sophia Wu",
    username: "sophia_wu",
    email: "sophia.wu@student.tagadetect.edu",
    password: "password123",
    role: "student",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    university: "Polytechnic State University",
    department: "Computer Science (3IS1)",
    bio: "Undergraduate researcher in formal grammars and logic.",
    joinedDate: "2026-09-12",
  },
  {
    id: "usr_prof_1",
    name: "Kristine Kaye Arida",
    username: "prof_arida",
    email: "kristine.arida@faculty.tagadetect.edu",
    password: "password123",
    role: "professor",
    status: "approved",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    university: "Polytechnic State University",
    department: "College of Computer Studies",
    bio: "Instructor for Automata Theory, Formal Languages, and Information Systems.",
    joinedDate: "2026-01-10",
  },
  {
    id: "usr_prof_2",
    name: "Neirro Ilagan",
    username: "prof_ilagan",
    email: "neirro.ilagan@faculty.tagadetect.edu",
    password: "password123",
    role: "professor",
    status: "approved",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    university: "Polytechnic State University",
    department: "Computer Engineering & Networking",
    bio: "Assistant Professor handling Data Communications, Networking, and Infrastructure.",
    joinedDate: "2026-02-15",
  },
  {
    id: "usr_prof_3",
    name: "Prof. Sofia Al-Mansoor",
    username: "prof_sofia",
    email: "sofia.mansoor@faculty.tagadetect.edu",
    password: "password123",
    role: "professor",
    status: "pending",
    avatar:
      "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80",
    university: "Polytechnic State University",
    department: "Information Assurance & Security",
    bio: "Lecturer in Information Assurance, Security Audits, and Cyberethics awaiting administrative clearance.",
    joinedDate: "2026-11-12",
  },
  {
    id: "usr_admin",
    name: "Eleanor Sterling",
    username: "admin_eleanor",
    email: "eleanor.sterling@admin.tagadetect.edu",
    password: "password123",
    role: "admin",
    status: "approved",
    avatar:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    university: "TagaDetect Academic Governance",
    department: "Registrar & Faculty Oversight",
    bio: "Academic Administrator managing faculty clearances, role permissions, and system compliance.",
    joinedDate: "2025-08-01",
  },
];

const INITIAL_CLASSES = [
  {
    id: "cls_1",
    subjectName: "CMSC 305 - Automata Theory & Formal Languages",
    section: "3IS1",
    code: "AUT-305",
    professorId: "usr_prof_1",
    professorName: "Kristine Kaye Arida",
    professorAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    room: "Lab 304",
    schedule: "Mon / Wed 10:00 AM - 11:30 AM",
    description:
      "Study of finite automata, pushdown automata, context-free grammars, Turing machines, and computability.",
    studentIds: [
      "usr_student_1",
      "usr_student_2",
      "usr_student_3",
      "usr_student_4",
    ],
  },
  {
    id: "cls_2",
    subjectName: "2026 CMSC 306 - Information Systems",
    section: "BSCS 3IS-1",
    code: "IS-306",
    professorId: "usr_prof_1",
    professorName: "Kristine Kaye Arida",
    professorAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    room: "Room 201",
    schedule: "Tue / Thu 1:00 PM - 2:30 PM",
    description:
      "Enterprise information systems architectures, database integration, and business process modeling.",
    studentIds: ["usr_student_1", "usr_student_3"],
  },
  {
    id: "cls_3",
    subjectName: "2026 CMSC 309 - IS Project Management",
    section: "3IS-1",
    code: "PM-309",
    professorId: "usr_prof_1",
    professorName: "Kristine Kaye Arida",
    professorAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    room: "Online Virtual Lab",
    schedule: "Friday 9:00 AM - 12:00 PM",
    description:
      "Agile methodologies, sprint cycles, and software quality assurance in enterprise applications.",
    studentIds: ["usr_student_1", "usr_student_2", "usr_student_4"],
  },
  {
    id: "cls_4",
    subjectName: "CMSC 310 DATA COMMUNICATION & NETWORKING",
    section: "BSCS 3IS1 / 2026-2027 / 1st SEM",
    code: "NET-310",
    professorId: "usr_prof_2",
    professorName: "Neirro Ilagan",
    professorAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    room: "Cisco Networking Lab",
    schedule: "Mon / Wed 1:00 PM - 2:30 PM",
    description:
      "OSI 7-layer model, TCP/IP protocols, subnetting, packet inspection, and transmission security.",
    studentIds: ["usr_student_1", "usr_student_2", "usr_student_3"],
  },
];

const INITIAL_ACTIVITIES = [
  {
    id: "act_1",
    classId: "cls_1",
    title: "Activity 1: Deterministic vs Non-Deterministic Finite Automata",
    description:
      "Write an analytical essay comparing DFA and NFA computational state space and language equivalence. Contrast subset construction algorithms with direct minimization techniques.",
    dueDate: "2026-11-20",
    maxPoints: 100,
    rubric:
      "Conceptual Rigor (40 pts), Formal Proof Clarity (30 pts), Original Analysis (30 pts)",
    status: "open",
    createdAt: "2026-11-01",
  },
  {
    id: "act_2",
    classId: "cls_1",
    title: "Activity 2: Chomsky Hierarchy & Context-Free Grammars",
    description:
      "Critique the computational boundaries between regular grammars and context-free grammars with respect to modern compiler syntax trees.",
    dueDate: "2026-11-26",
    maxPoints: 50,
    rubric:
      "Syntactic parsing accuracy (25 pts), Practical compiler examples (25 pts)",
    status: "open",
    createdAt: "2026-11-05",
  },
  {
    id: "act_3",
    classId: "cls_4",
    title: "Research Analysis: TCP Congestion Control Algorithms",
    description:
      "Compare BBR, Reno, and Cubic congestion control algorithms across high-latency satellite and fiber networks.",
    dueDate: "2026-11-24",
    maxPoints: 100,
    rubric: "Protocol analysis (50 pts), Performance benchmarks (50 pts)",
    status: "open",
    createdAt: "2026-11-08",
  },
];

const INITIAL_MATERIALS = [
  {
    id: "mat_1",
    classId: "cls_1",
    title: "CMSC 305 Course Syllabus & Grading Policy",
    category: "Syllabus & Guidelines",
    type: "PDF Document",
    description:
      "Detailed course schedule, examination dates, academic integrity policies, and grading breakdown for Semester 1.",
    postedAt: "2026-09-02",
    fileSize: "1.2 MB",
  },
  {
    id: "mat_2",
    classId: "cls_1",
    title: "Module 1 Lecture Slides: Finite State Automata & Transitions",
    category: "Lecture Slides",
    type: "Presentation Slides",
    description:
      "Comprehensive slides covering formal alphabet definitions, transition tables, state diagram graphs, and epsilon-moves.",
    postedAt: "2026-09-10",
    fileSize: "4.8 MB",
  },
  {
    id: "mat_3",
    classId: "cls_1",
    title: "JFLAP State Machine Simulator Software & Lab Guide",
    category: "Lab Tools & Guides",
    type: "Software Resource",
    description:
      "Interactive visualization package for designing, animating, and validating DFA, NFA, PDA, and Turing Machines.",
    postedAt: "2026-09-18",
    fileSize: "12.4 MB",
  },
  {
    id: "mat_4",
    classId: "cls_1",
    title: "Chomsky Hierarchy Quick Reference Chart",
    category: "Reference Cheat Sheet",
    type: "PDF Document",
    description:
      "Single-page tabular comparison of Type 0, Type 1, Type 2, and Type 3 languages with corresponding machine models.",
    postedAt: "2026-10-05",
    fileSize: "850 KB",
  },
  {
    id: "mat_5",
    classId: "cls_4",
    title: "OSI 7-Layer Protocol Reference Guide & Packet Formats",
    category: "Reference Manual",
    type: "PDF Document",
    description:
      "Detailed protocol headers for Ethernet, IPv4, IPv6, TCP, UDP, and application layer encapsulations.",
    postedAt: "2026-09-04",
    fileSize: "2.6 MB",
  },
  {
    id: "mat_6",
    classId: "cls_4",
    title: "Wireshark Packet Capture & Network Inspection Lab Manual",
    category: "Lab Manual",
    type: "Lab Guide",
    description:
      "Step-by-step hands-on tutorial for capturing live packets, filtering three-way handshakes, and analyzing jitter.",
    postedAt: "2026-09-22",
    fileSize: "3.1 MB",
  },
];

const INITIAL_SUBMISSIONS = [
  {
    id: "sub_1",
    activityId: "act_1",
    studentId: "usr_student_1",
    studentName: "Alex Rivera",
    studentEmail: "alex.rivera@student.tagadetect.edu",
    submittedAt: "2026-11-10T14:32:00Z",
    content: `When analyzing modern computational models, the structural equivalence between deterministic finite automata and non-deterministic finite automata represents a cornerstone of formal language theory. In a DFA, each state-transition pair yields exactly one unique successor state, guaranteeing deterministic linear-time execution across input sequences. Conversely, non-deterministic automata allow multiple simultaneous branch transitions for identical input symbols, effectively exploring power-set search spaces in parallel.\n\nHowever, via the classical powerset construction algorithm (subset construction), every NFA with N states can be transformed into an equivalent DFA with at most 2^N states. In conclusion, while NFAs provide vastly simpler human conceptualizations for complex regular expressions, physical hardware executes equivalent DFAs to preserve deterministic clock cycles.`,
    wordCount: 122,
    aiReview: {
      generatedAt: "2026-11-10T14:32:01Z",
      overallAiScore: 72,
      verdict: "High Synthetic Probability",
      perplexityScore: 26,
      burstinessScore: 21,
      flags: [
        "Uniform sentence cadence detected",
        'Formulaic transition ("In conclusion")',
        "High token predictability",
      ],
      sentenceBreakdown: [
        {
          text: "When analyzing modern computational models, the structural equivalence between deterministic finite automata and non-deterministic finite automata represents a cornerstone of formal language theory.",
          score: 81,
          label: "ai",
        },
        {
          text: "In a DFA, each state-transition pair yields exactly one unique successor state, guaranteeing deterministic linear-time execution across input sequences.",
          score: 76,
          label: "ai",
        },
        {
          text: "Conversely, non-deterministic automata allow multiple simultaneous branch transitions for identical input symbols, effectively exploring power-set search spaces in parallel.",
          score: 78,
          label: "ai",
        },
        {
          text: "However, via the classical powerset construction algorithm (subset construction), every NFA with N states can be transformed into an equivalent DFA with at most 2^N states.",
          score: 45,
          label: "mixed",
        },
        {
          text: "In conclusion, while NFAs provide vastly simpler human conceptualizations for complex regular expressions, physical hardware executes equivalent DFAs to preserve deterministic clock cycles.",
          score: 88,
          label: "ai",
        },
      ],
    },
    grade: 90,
    gradedAt: "2026-11-12T16:10:00Z",
    gradedBy: "Kristine Kaye Arida",
    professorFeedback:
      "Excellent explanation of powerset construction. Note the automated AI phrasing score; in the next assignment, elaborate with your own hand-drawn state transition diagrams.",
  },
  {
    id: "sub_2",
    activityId: "act_1",
    studentId: "usr_student_2",
    studentName: "Chloe Chen",
    studentEmail: "chloe.chen@student.tagadetect.edu",
    submittedAt: "2026-11-11T09:15:00Z",
    content: `I spent Thursday night drawing transition tables on my whiteboard until my dry erase marker dried up! What really clicked for me was thinking about an NFA as a timeline splitter, like in sci-fi movies where every time a branching path opens, the universe duplicates itself to test every possibility at once.\n\nA DFA doesn't have that luxury. It has to make up its mind on the spot. That's why powerset construction feels like compiling all those branching multiverse timelines into one giant, hyper-organized map before you even start reading the input. It might blow up exponentially in worst-case state space, but once built, lookup is blazing fast!`,
    wordCount: 111,
    aiReview: {
      generatedAt: "2026-11-11T09:15:01Z",
      overallAiScore: 9,
      verdict: "Authentic Human Authorship",
      perplexityScore: 89,
      burstinessScore: 67,
      flags: [
        "Dynamic sentence length variability",
        "First-person empirical narration",
        "Creative metaphorical explanations",
      ],
      sentenceBreakdown: [
        {
          text: "I spent Thursday night drawing transition tables on my whiteboard until my dry erase marker dried up!",
          score: 5,
          label: "human",
        },
        {
          text: "What really clicked for me was thinking about an NFA as a timeline splitter, like in sci-fi movies where every time a branching path opens, the universe duplicates itself to test every possibility at once.",
          score: 8,
          label: "human",
        },
        { text: "A DFA doesn't have that luxury.", score: 6, label: "human" },
        {
          text: "It has to make up its mind on the spot.",
          score: 10,
          label: "human",
        },
        {
          text: "That's why powerset construction feels like compiling all those branching multiverse timelines into one giant, hyper-organized map before you even start reading the input.",
          score: 12,
          label: "human",
        },
        {
          text: "It might blow up exponentially in worst-case state space, but once built, lookup is blazing fast!",
          score: 7,
          label: "human",
        },
      ],
    },
    grade: 99,
    gradedAt: "2026-11-12T16:25:00Z",
    gradedBy: "Kristine Kaye Arida",
    professorFeedback:
      "Outstanding intuition and analogy, Chloe! The timeline splitter metaphor is phenomenal.",
  },
];

const INITIAL_FEEDBACK = [];

/* =====================================================================
   SECTION 3: DETECTOR ENGINE (from ai-engine.js, still shuffled)
   Replace the shuffle logic inside predictShuffle with your real
   machine learning model when it is ready.
   ===================================================================== */

const DETECTOR_SAMPLES = {
  ai: `In today's rapidly evolving digital landscape, artificial intelligence plays an increasingly pivotal role across diverse educational environments. Furthermore, it is essential to recognize the multifaceted implications that arise from autonomous algorithmic workflows. By leveraging advanced natural language processing paradigms, educational software can dynamically adapt to user requirements. In conclusion, the integration of computational tools fosters pedagogical enhancement while maintaining rigorous systematic evaluation.`,
  human: `I honestly didn't think I would enjoy Automata Theory this semester, but Professor Arida's whiteboard breakdown of NFAs vs DFAs really changed my perspective! Drawing out state transitions with branching paths felt just like walking through a sci-fi multiverse map. I definitely spent way too many hours debugging transition tables, but having it click during Friday lab was such a huge relief.`,
  mixed: `In contemporary computational science, formal language theory establishes mathematical foundations for compiler construction and syntactic validation. However, when I first started learning regex in class, I kept getting lost in catastrophic backtracking loops! Modern lexers handle finite state transitions efficiently, but manually writing out the state table for our class project proved to be quite an adventure.`,
};

function splitSentences(text) {
  if (!text || !text.trim()) return [];
  return text
    .replace(/([.?!])\s*(?=[A-Z0-9"']|$)/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function predictShuffle(text) {
  if (!text || text.trim().length < 15) {
    return {
      overallAiScore: 0,
      verdict: "Text too short to evaluate",
      humanProbability: 100,
      perplexityScore: 0,
      burstinessScore: 0,
      wordCount: 0,
      characterCount: 0,
      sentenceCount: 0,
      flags: ["Please enter at least 15 characters to run prediction."],
      sentenceBreakdown: [],
    };
  }

  const sentences = splitSentences(text);
  const tokens = text.match(/\b\w+\b/g) || [];
  const wordCount = tokens.length;
  const characterCount = text.length;

  const sampleTiers = [
    { score: Math.floor(Math.random() * 20) + 80, label: "ai" },
    { score: Math.floor(Math.random() * 25) + 70, label: "ai" },
    { score: Math.floor(Math.random() * 30) + 40, label: "mixed" },
    { score: Math.floor(Math.random() * 25) + 15, label: "human" },
    { score: Math.floor(Math.random() * 12) + 2, label: "human" },
  ];

  const sentenceBreakdown = sentences.map((sentence, idx) => {
    const tier = sampleTiers[Math.floor(Math.random() * sampleTiers.length)];
    const jitteredScore = Math.min(
      99,
      Math.max(1, tier.score + (Math.floor(Math.random() * 9) - 4)),
    );

    let label = "human";
    if (jitteredScore >= 68) label = "ai";
    else if (jitteredScore >= 38) label = "mixed";

    return {
      id: `s_${idx + 1}`,
      text: sentence,
      score: jitteredScore,
      label,
      wordCount: sentence.split(/\s+/).filter(Boolean).length,
    };
  });

  const avgScore =
    sentenceBreakdown.reduce((sum, s) => sum + s.score, 0) /
    (sentenceBreakdown.length || 1);
  const overallAiScore = Math.min(99, Math.max(1, Math.round(avgScore)));
  const humanProbability = 100 - overallAiScore;

  const perplexityScore = Math.min(
    95,
    Math.max(
      12,
      Math.round((100 - overallAiScore) * 0.85 + (Math.random() * 15 - 7)),
    ),
  );
  const burstinessScore = Math.min(
    92,
    Math.max(
      10,
      Math.round((100 - overallAiScore) * 0.75 + (Math.random() * 20 - 10)),
    ),
  );

  let verdict = "Authentic Human Authorship";
  if (overallAiScore >= 70) verdict = "High Synthetic (AI) Probability";
  else if (overallAiScore >= 40) verdict = "Mixed / Hybrid Authorship Detected";
  else if (overallAiScore >= 20)
    verdict = "Likely Human with Minor Automated Assistance";

  const flagPool = [
    "Token predictability variance analyzed across clauses",
    "Sentence length distribution calculated for burstiness index",
    "Repetitive syntactical cadence evaluated against baseline",
    "Idiosyncratic vocabulary and human voice signatures scanned",
    "Contextual perplexity evaluated via token entropy",
  ];
  const flags = shuffleArray(flagPool).slice(0, 3);
  const aiSentences = sentenceBreakdown.filter((s) => s.label === "ai").length;
  flags.unshift(
    `${aiSentences} of ${sentences.length} sentences classified as high synthetic probability`,
  );

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
  };
}

// Runs automatically when a student passes an activity
function generateSubmissionReview(text) {
  return predictShuffle(text);
}

/* =====================================================================
   SECTION 4: APP CONTEXT, ROUTER, AND SHARED BUILDING BLOCKS
   ===================================================================== */

const AppContext = createContext(null);

function useApp() {
  return useContext(AppContext);
}

// Router: the page is chosen by the address after the # in the browser
function subscribeHash(callback) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function useRoute() {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const path = hash.replace(/^#\/?/, "");
  const [name = "", param = null] = path.split("/");
  return { name: name || "home", param };
}

function navigate(path = "") {
  window.location.hash = `#/${path}`;
}

// Shared style pieces
const cardClass =
  "bg-card border border-line rounded-[20px] p-7 shadow-card transition-colors duration-200";

const formLabelClass = "block text-[13px] font-semibold text-muted mb-2";

const formInputClass =
  "w-full px-4 py-3 bg-card-inner border border-line rounded-[14px] text-main text-sm font-[inherit] focus:outline-none focus:border-accent transition-colors duration-200";

function btn(kind = "primary", extra = "") {
  const base =
    "inline-flex items-center justify-center gap-2 text-sm font-semibold px-[22px] py-[11px] rounded-full border border-transparent cursor-pointer transition-all duration-200 no-underline disabled:opacity-50 disabled:cursor-not-allowed";
  const kinds = {
    primary:
      "bg-accent text-white shadow-md shadow-accent/30 hover:bg-accent-hover hover:-translate-y-px",
    secondary:
      "bg-card border-line text-main hover:border-accent hover:text-accent",
  };
  return `${base} ${kinds[kind]} ${extra}`;
}

function badge(variant = "ai", extra = "") {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold";
  const variants = {
    ai: "bg-accent/20 text-accent",
    human: "bg-emerald/20 text-emerald",
    mixed: "bg-amber/20 text-amber",
    pending: "bg-rose/20 text-rose",
    success: "bg-emerald/20 text-emerald",
  };
  return `${base} ${variants[variant]} ${extra}`;
}

// Popup window (used for join class, create class, grading, and more)
function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 640,
  children,
  footer,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-overlay backdrop-blur-[8px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-h-[90vh] overflow-y-auto bg-card border border-line rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between gap-4 px-7 py-[22px] border-b border-line">
          <div>
            <h2 className="text-lg font-bold text-main">{title}</h2>
            {subtitle && (
              <p className="text-[13px] text-muted mt-1">{subtitle}</p>
            )}
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
  );
}

// Small messages that appear at the bottom right
function Toasts({ toasts }) {
  const borders = {
    success: "border-l-accent",
    info: "border-l-accent",
    warning: "border-l-amber",
    danger: "border-l-rose",
    error: "border-l-rose",
  };
  const icons = {
    success: "✓",
    info: <Icon name="info" />,
    warning: <Icon name="warning" />,
    danger: "✕",
    error: "✕",
  };
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
  );
}

// Top navigation bar (from nav.js)
function Navbar({ route }) {
  const { user, users, theme, toggleTheme, signOut, switchUser, pendingCount } =
    useApp();

  const isLoggedIn = !!user;
  const isStudent = user?.role === "student";
  const isProf = user?.role === "professor";
  const isAdmin = user?.role === "admin";
  const active = route.name === "class" ? "home" : route.name;

  const navItem = (page) =>
    `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold no-underline cursor-pointer transition-all duration-200 ${
      active === page
        ? "bg-accent text-white shadow-md shadow-accent/30"
        : "text-muted hover:text-main hover:bg-card"
    }`;

  const homeLabel = isStudent
    ? "Enrolled Classes"
    : isProf
      ? "Classes Handled"
      : "Classes";

  return (
    <header className="sticky top-0 z-[100] h-[72px] bg-bg-dark border-b border-line backdrop-blur-sm flex items-center justify-between px-10 max-md:px-4 transition-colors duration-200">
      <a
        href="#/"
        className="flex items-center gap-3 no-underline cursor-pointer"
      >
        <div
          className="w-[38px] h-[38px] rounded-[14px] flex items-center justify-center text-white font-extrabold text-[19px] shadow-md shadow-accent/30"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), #6366f1)",
          }}
        >
          T
        </div>
        <div className="text-xl font-extrabold tracking-[-0.5px] text-main">
          Taga<span className="text-accent">Detect</span>
        </div>
      </a>

      <nav className="flex items-center gap-2 max-md:hidden">
        <a href="#/" className={navItem("home")}>
          {homeLabel}
        </a>
        <a href="#/detector" className={navItem("detector")}>
          AI Detector
        </a>
        <a href="#/about" className={navItem("about")}>
          About
        </a>
        <a href="#/faq" className={navItem("faq")}>
          FAQ
        </a>
        {isLoggedIn && (
          <a href="#/settings" className={navItem("settings")}>
            Settings
          </a>
        )}
        {isAdmin && (
          <a href="#/admin" className={navItem("admin")}>
            Admin Approvals
            {pendingCount > 0 && (
              <span className="ml-1 px-[7px] py-0.5 text-[11px] font-semibold rounded-full bg-rose/20 text-rose">
                {pendingCount}
              </span>
            )}
          </a>
        )}
      </nav>

      <div className="flex items-center gap-3.5">


        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          className="w-[38px] h-[38px] rounded-full border border-line bg-card text-main cursor-pointer flex items-center justify-center text-base transition-all duration-200 hover:border-accent hover:rotate-[15deg]"
        >
          {theme === "dark" ? "☀️" : "🌙"}
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
                {user.name.split(" ")[0]}
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
            <a
              href="#/login"
              className={btn("secondary", "!px-3.5 !py-1.5 !text-xs")}
            >
              Sign In
            </a>
            <a
              href="#/signup"
              className={btn("primary", "!px-4 !py-1.5 !text-xs")}
            >
              Sign Up
            </a>
          </>
        )}
      </div>
    </header>
  );
}

/* =====================================================================
   SECTION 5: PAGES
   Each page below is a temporary placeholder. The next stages replace
   them one by one with the real pages.
   ===================================================================== */

function PlaceholderPage({ title }) {
  const { user, users, signIn } = useApp();
  const demoIds = ["usr_student_1", "usr_prof_1", "usr_admin"];

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
            const u = users.find((x) => x.id === id);
            return (
              <button
                key={id}
                type="button"
                className={btn("primary")}
                onClick={() => {
                  signIn(id);
                  navigate("");
                }}
              >
                Sign in as {u.name} ({u.role})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Shared pieces for the sign in and sign up screens ---------- */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AuthLogo() {
  return (
    <div
      className="w-12 h-12 rounded-xl inline-flex items-center justify-center text-2xl font-extrabold text-white mb-3"
      style={{
        background: "linear-gradient(135deg, var(--color-accent), #0fbcf9)",
      }}
    >
      T
    </div>
  );
}

function OrDivider({ label }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex-1 h-px bg-line" />
      <span className="text-[11px] uppercase text-muted font-bold">
        {label}
      </span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}

/* ---------- Login ---------- */

function LoginPage() {
  const { toast } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legal, setLegal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => setLockoutTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  const handleGoogle = async () => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast(error.message, "danger");
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (lockoutTimer > 0) {
      toast(`Too many failed attempts. Please wait ${lockoutTimer}s.`, "warning");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      toast("Please enter both email and password.", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockoutTimer(30);
          setAttempts(0);
          toast("Too many failed attempts. Login locked for 30 seconds.", "danger");
        } else {
          toast("Invalid credentials or unconfirmed account.", "danger");
        }
        return;
      }

      // Check account approval status if professor
      if (data?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("status, role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (prof?.role === "professor" && prof?.status === "pending") {
          toast("Notice: Your professor account is pending admin verification.", "warning");
        } else {
          toast("Welcome back!");
        }
      }

      setAttempts(0);
      navigate("");
    } catch (err) {
      toast("An unexpected connection error occurred.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <div className="w-full max-w-[440px] bg-card border border-line rounded-[20px] shadow-card-hover px-8 py-9">
        <div className="text-center mb-7">
          <AuthLogo />
          <h1 className="text-[22px] font-extrabold text-main">Welcome Back</h1>
          <p className="text-[13px] text-muted mt-1">
            Sign in to your TagaDetect academic workspace
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isSubmitting}
          className={btn("secondary", "w-full !py-2.5 !text-[13px] mb-5")}
        >
          <GoogleIcon />
          Sign in with Google Account
        </button>

        <OrDivider label="OR EMAIL" />

        <form onSubmit={handleEmailLogin}>
          <div className="mb-[18px]">
            <label className={formLabelClass}>Academic Email</label>
            <input
              type="email"
              required
              disabled={isSubmitting || lockoutTimer > 0}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.rivera@tagadetect.edu"
              className={formInputClass}
            />
          </div>

          <div className="mb-[18px]">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[13px] font-semibold text-muted">
                Password
              </label>
              <a
                href="#/login"
                className="text-[11px] text-accent no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  toast("Password reset email sent (demo simulation).", "info");
                }}
              >
                Forgot?
              </a>
            </div>
            <input
              type="password"
              required
              disabled={isSubmitting || lockoutTimer > 0}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={formInputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || lockoutTimer > 0}
            className={btn("primary", "w-full !py-2.5 mt-2")}
          >
            {isSubmitting
              ? "Signing in..."
              : lockoutTimer > 0
              ? `Locked (${lockoutTimer}s)`
              : "Sign In"}
          </button>
        </form>

        <div className="text-[11px] text-muted text-center mt-5 leading-normal">
          By signing in, you agree to our{" "}
          <a
            href="#/login"
            className="text-accent"
            onClick={(e) => {
              e.preventDefault();
              setLegal("terms");
            }}
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#/login"
            className="text-accent"
            onClick={(e) => {
              e.preventDefault();
              setLegal("privacy");
            }}
          >
            Privacy Policy
          </a>
          .
        </div>

        <div className="text-center mt-6 pt-[18px] border-t border-line text-[13px] text-muted">
          Don't have an account yet?{" "}
          <a href="#/signup" className="text-accent font-bold no-underline">
            Sign Up
          </a>
        </div>
      </div>

      <Modal
        open={legal === "terms"}
        onClose={() => setLegal(null)}
        title="Terms of Service"
        footer={
          <button
            type="button"
            className={btn("primary")}
            onClick={() => setLegal(null)}
          >
            Understood
          </button>
        }
      >
        <div className="text-[13px] text-muted leading-relaxed max-h-[300px] overflow-y-auto">
          <p>
            1. <strong>Institutional Purpose:</strong> TagaDetect is engineered
            to foster transparent, non-punitive academic integrity and stylistic
            evaluation.
          </p>
          <p className="mt-2.5">
            2. <strong>Role Boundaries:</strong> Students exclusively enroll in
            course sections with instructor approval. Faculty members create and
            grade sections.
          </p>
          <p className="mt-2.5">
            3. <strong>Predictive Heuristics:</strong> AI detection metrics are
            diagnostic heuristics and must be interpreted in conjunction with
            pedagogical human context.
          </p>
        </div>
      </Modal>

      <Modal
        open={legal === "privacy"}
        onClose={() => setLegal(null)}
        title="Privacy Policy"
        footer={
          <button
            type="button"
            className={btn("primary")}
            onClick={() => setLegal(null)}
          >
            Close
          </button>
        }
      >
        <p className="text-[13px] text-muted leading-relaxed">
          Your academic text submissions and detection metrics are stored
          locally within your secure session environment and never sold to
          third-party data aggregators.
        </p>
      </Modal>
    </>
  );
}

/* ---------- Sign up ---------- */

function SignupPage() {
  const { toast } = useApp();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "student",
  });

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isProf = form.role === "professor";

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast(error.message, "danger");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const username = form.username.trim();
    const email = form.email.trim();

    if (!name || !username || !email) {
      toast("Please fill out all required fields.", "warning");
      return;
    }
    if (form.password.length < 6) {
      toast("Password must be at least 6 characters.", "warning");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: { data: { full_name: name, username, role: form.role } },
    });

    if (error) {
      const taken = error.message.toLowerCase().includes("database error");
      toast(
        taken ? "That username is already taken." : error.message,
        "danger",
      );
      return;
    }

    // If email confirmation is still on, there is no session yet
    if (!data.session) {
      toast("Check your email to confirm your account, then sign in.", "info");
      navigate("login");
      return;
    }

    toast(
      isProf
        ? "Professor account registered! Awaiting Admin approval."
        : "Account registered as Student! Welcome to TagaDetect.",
      isProf ? "warning" : "success",
    );
    navigate("");
  };
const roles = [
  { value: "student", title: "Student", hint: "Join classes & pass work" },
  { value: "professor", title: "Professor", hint: "Create & grade classes" },
];

return (
  <div className="w-full max-w-[480px] bg-card border border-line rounded-[20px] shadow-card-hover px-8 py-9">
    <div className="text-center mb-6">
      <AuthLogo />
      <h1 className="text-[22px] font-extrabold text-main">
        Create Your Account
      </h1>
      <p className="text-[13px] text-muted mt-1">
        Join the academic integrity community on TagaDetect
      </p>
    </div>

    <button
      type="button"
      onClick={handleGoogle}
      className={btn("secondary", "w-full !py-2.5 !text-[13px] mb-5")}
    >
      <GoogleIcon />
      Sign up with Google
    </button>

    <OrDivider label="OR MANUAL REGISTRATION" />

    <form onSubmit={handleSignup}>
      <div className="grid grid-cols-2 gap-3">
        <div className="mb-[18px]">
          <label className={formLabelClass}>Full Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={setField("name")}
            placeholder="e.g. Jordan Blake"
            className={formInputClass}
          />
        </div>
        <div className="mb-[18px]">
          <label className={formLabelClass}>Username</label>
          <input
            type="text"
            required
            value={form.username}
            onChange={setField("username")}
            placeholder="e.g. jblake"
            className={formInputClass}
          />
        </div>
      </div>

      <div className="mb-[18px]">
        <label className={formLabelClass}>Academic Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={setField("email")}
          placeholder="e.g. jblake@tagadetect.edu"
          className={formInputClass}
        />
      </div>

      <div className="mb-[18px]">
        <label className={formLabelClass}>Password</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={setField("password")}
          placeholder="••••••••••••"
          className={formInputClass}
        />
      </div>

      <div className="mb-[18px]">
        <label className={formLabelClass}>Account Role</label>
        <div className="grid grid-cols-2 gap-2.5">
          {roles.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-2 p-3 rounded-lg bg-card-inner cursor-pointer border transition-colors duration-200 ${
                form.role === r.value ? "border-accent" : "border-line"
              }`}
            >
              <input
                type="radio"
                name="account-role"
                value={r.value}
                checked={form.role === r.value}
                onChange={setField("role")}
                className="accent-accent"
              />
              <div>
                <strong className="text-[13px] text-main block">
                  {r.title}
                </strong>
                <span className="text-[11px] text-muted">{r.hint}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {isProf && (
        <div className="bg-amber/10 border border-amber rounded-lg px-3.5 py-3 mb-5 text-xs text-muted">
          <strong className="text-amber">Admin Approval Required:</strong> As an
          institutional integrity policy, professor accounts must be verified
          and approved by an Administrator before class creation and grading
          permissions are activated.
        </div>
      )}

      <button type="submit" className={btn("primary", "w-full !py-2.5 mt-2")}>
        Complete Registration
      </button>
    </form>

    <div className="text-center mt-6 pt-[18px] border-t border-line text-[13px] text-muted">
      Already have an account?{" "}
      <a href="#/login" className="text-accent font-bold no-underline">
        Sign In
      </a>
    </div>
  </div>
);
}
/* ---------- Home: class grid with Join Class and Create Class ---------- */

const EMPTY_CLASS_FORM = {
  title: "",
  section: "",
  room: "",
  schedule: "",
  desc: "",
};

function ClassCard({ cls, activityCount, materialCount }) {
  const open = () => navigate(`class/${cls.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open();
      }}
      className="group relative flex flex-col justify-between overflow-hidden bg-card border border-line rounded-[20px] px-6 py-[22px] shadow-card cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-accent/45 hover:shadow-[0_16px_36px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: "linear-gradient(90deg, var(--color-accent), #0fbcf9)",
        }}
      />

      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.5px] uppercase bg-accent/10 text-accent px-2.5 py-1 rounded-md">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            CODE: {cls.code}
          </span>
          <span className="text-[11px] text-muted font-semibold bg-card-inner px-2 py-[3px] rounded">
            {cls.section}
          </span>
        </div>

        <h3 className="text-[17px] font-bold leading-[1.35] text-main mb-3.5 min-h-[46px] line-clamp-2">
          {cls.subjectName}
        </h3>

        <div className="flex items-center gap-3 mb-[18px] px-3 py-2.5 bg-card-inner border border-line rounded-lg">
          <img
            src={cls.professorAvatar || FALLBACK_AVATAR}
            alt={cls.professorName}
            className="w-9 h-9 rounded-full object-cover border-2 border-accent shrink-0"
          />
          <div>
            <div className="text-[13px] font-semibold text-main leading-tight">
              {cls.professorName}
            </div>
            <div className="text-[11px] text-muted mt-0.5">
              {cls.room} • {cls.schedule}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2.5 pt-3.5 mt-auto border-t border-line">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-muted bg-card-inner px-2 py-1 rounded-md">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {activityCount} Activities
          </span>
          <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-muted bg-card-inner px-2 py-1 rounded-md">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            {materialCount} Materials
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/10 px-2.5 py-[5px] rounded-md whitespace-nowrap transition-all duration-200 group-hover:bg-accent group-hover:text-white">
          Open Class
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="transition-transform duration-200 group-hover:translate-x-[3px]"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function HomePage() {
  const {
    user,
    classes,
    setClasses,
    activities,
    materials,
    toast,
    switchUser,
  } = useApp();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [enrollCode, setEnrollCode] = useState("");
  const [createForm, setCreateForm] = useState(EMPTY_CLASS_FORM);

  if (!user) return null;

  const isStudent = user.role === "student";
  const isProf = user.role === "professor";
  const isAdmin = user.role === "admin";
  const isPendingProf = isProf && user.status === "pending";

  let roleClasses = classes;
  if (isStudent) {
    roleClasses = classes.filter(
      (c) => c.studentIds && c.studentIds.includes(user.id),
    );
  } else if (isProf) {
    roleClasses = classes.filter((c) => c.professorId === user.id);
  }

  const q = search.trim().toLowerCase();
  const visibleClasses = q
    ? roleClasses.filter(
        (c) =>
          c.subjectName.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.section.toLowerCase().includes(q),
      )
    : roleClasses;

  const closeModal = () => setModal(null);

  const submitEnroll = () => {
    if (user.role !== "student") {
      toast("Only students can join class sections.", "warning");
      return;
    }

    const code = enrollCode.trim().toUpperCase();
    if (!code) {
      toast("Please enter a 6-character class code.", "warning");
      return;
    }

    const target = classes.find((c) => c.code.toUpperCase() === code);
    if (!target) {
      toast(
        `Class code "${code}" not found. Try AUT-305, NET-310, or IS-306`,
        "danger",
      );
      return;
    }

    if (target.studentIds && target.studentIds.includes(user.id)) {
      toast(`You are already enrolled in ${target.subjectName}!`, "info");
      closeModal();
      return;
    }

    setClasses((prev) =>
      prev.map((c) =>
        c.id === target.id
          ? { ...c, studentIds: [...(c.studentIds || []), user.id] }
          : c,
      ),
    );
    setEnrollCode("");
    closeModal();
    toast(`Successfully joined ${target.subjectName} (${target.section})!`);
  };

  const submitCreate = () => {
    if (user.role !== "professor" && user.role !== "admin") {
      toast("Only professors can create new class sections.", "warning");
      return;
    }

    if (isPendingProf) {
      toast("Your professor account is pending admin approval.", "warning");
      return;
    }

    const title = createForm.title.trim();
    if (!title) {
      toast("Please provide a subject title.", "warning");
      return;
    }

    const prefix =
      title
        .replace(/[^A-Za-z]/g, "")
        .substring(0, 3)
        .toUpperCase() || "CLS";
    let code;
    do {
      code = `${prefix}-${Math.floor(100 + Math.random() * 899)}`;
    } while (classes.some((c) => c.code === code));

    const newClass = {
      id: `cls_${Date.now()}`,
      code,
      subjectName: title,
      section: createForm.section.trim() || "BSCS 3IS-1",
      professorId: user.id,
      professorName: user.name,
      professorAvatar: user.avatar,
      room: createForm.room.trim() || "Lab 305",
      schedule: createForm.schedule.trim() || "Mon/Wed 1:00 PM - 2:30 PM",
      description:
        createForm.desc.trim() ||
        "Academic course section exploring foundational principles and applied projects.",
      studentIds: ["usr_student_1", "usr_student_2"],
    };

    setClasses((prev) => [newClass, ...prev]);
    setCreateForm(EMPTY_CLASS_FORM);
    closeModal();
    toast(`Created section ${title}! Enrollment code: ${code}`);
  };

  const setCreateField = (field) => (e) =>
    setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));

  const heroTitle = isStudent
    ? "Join classes, explore materials, and pass activities."
    : isProf
      ? "Create classes, upload materials, and grade activities."
      : "Institutional integrity, faculty verification, and course oversight.";

  const heroText = isStudent
    ? "Students exclusively join class sections using instructor-provided codes. Passed text activities are evaluated automatically upon submission with transparent AI diagnostics."
    : isProf
      ? "Professors are the exclusive creators of course sections. Generate access codes, share lecture slides, and grade student submissions with automated AI insight reports."
      : "Monitor institutional classes, audit pending professor account requests, and evaluate user feedback on detection accuracy.";

  const floatCardClass =
    "bg-card border border-line rounded-[20px] px-6 py-[22px] shadow-card transition-transform duration-300 hover:-translate-y-[3px] hover:border-accent/40";

  return (
    <div>
      {isPendingProf && (
        <div className="bg-rose/10 border border-rose rounded-[20px] px-[22px] py-[18px] mb-7">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <Icon name="hourglass" size={28} />
              <div>
                <h3 className="text-[15px] font-bold text-rose">
                  Professor Account Pending Administrative Verification
                </h3>
                <p className="text-[13px] text-muted mt-0.5">
                  Your account is currently in the Admin Approval Queue. An
                  administrator must verify your faculty credentials before
                  class creation is unlocked.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hero */}
      <section className="grid grid-cols-[1.15fr_0.85fr] max-lg:grid-cols-1 items-center gap-12 max-lg:gap-8 pt-10 pb-12">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[1px] text-accent bg-accent/10 px-3.5 py-1.5 rounded-full mb-[18px]">
            <span>✦</span>{" "}
            {isStudent
              ? "STUDENT PORTAL"
              : isProf
                ? "PROFESSOR PORTAL"
                : "ADMINISTRATOR PORTAL"}
          </div>
          <h1 className="text-[42px] max-md:text-[32px] font-extrabold leading-[1.18] tracking-[-1px] text-main mb-4">
            {heroTitle}
          </h1>
          <p className="text-base leading-relaxed text-muted mb-7 max-w-[520px]">
            {heroText}
          </p>

          <div className="flex items-center gap-3.5 flex-wrap">
            {isStudent && (
              <button
                type="button"
                className={btn("primary")}
                onClick={() => setModal("enroll")}
              >
                + Join Class with Code
              </button>
            )}
            {isProf && (
              <button
                type="button"
                className={btn("primary")}
                disabled={isPendingProf}
                title={isPendingProf ? "Account pending approval" : undefined}
                onClick={() => setModal("create")}
              >
                + Create New Class Section
              </button>
            )}
            {isAdmin && (
              <a href="#/admin" className={btn("primary")}>
                Inspect Pending Approvals Queue
              </a>
            )}
            <a href="#/detector" className={btn("secondary")}>
              Open AI Detector
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className={floatCardClass}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted uppercase">
                {isStudent
                  ? "Enrolled Classes"
                  : isProf
                    ? "Classes Handled"
                    : "Total Active Classes"}
              </span>
              <span className={badge(isStudent ? "human" : "ai")}>
                {isStudent ? "Enrolled" : "Faculty"}
              </span>
            </div>
            <div className="text-[32px] font-extrabold text-accent">
              {roleClasses.length}
            </div>
            <div className="text-[13px] text-muted mt-1">
              {isStudent
                ? "Select any class below to view its dedicated page, activities, materials, and people."
                : "Click any class below to manage materials, publish activities, and grade submissions."}
            </div>
          </div>

          <div
            className={`${floatCardClass} flex items-center justify-between`}
          >
            <div>
              <strong className="text-sm text-main">
                Dedicated Class Pages
              </strong>
              <div className="text-xs text-muted">
                Dedicated view for Activities, Materials, and People
              </div>
            </div>
            <span className={badge("ai")}>Full Hub</span>
          </div>
        </div>
      </section>

      {/* Section header with search and action */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-7 pb-4 border-b border-line">
        <div>
          <h2 className="text-2xl font-extrabold tracking-[-0.5px] text-main">
            {isStudent
              ? "My Enrolled Classes"
              : isProf
                ? "Classes Handled by You"
                : "All Institutional Classes"}
          </h2>
          <p className="text-sm text-muted mt-1">
            Select any class card to open its dedicated page with activities,
            materials, and class roster
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject or code..."
            className={`${formInputClass} !w-[220px] !px-3 !py-[7px] !text-[13px]`}
          />
          {isStudent && (
            <button
              type="button"
              className={btn("primary", "!px-4 !py-2 !text-[13px]")}
              onClick={() => setModal("enroll")}
            >
              + Join Class
            </button>
          )}
          {isProf && (
            <button
              type="button"
              className={btn("primary", "!px-4 !py-2 !text-[13px]")}
              disabled={isPendingProf}
              onClick={() => setModal("create")}
            >
              + Create Class
            </button>
          )}
        </div>
      </div>

      {/* Class grid */}
      {roleClasses.length === 0 ? (
        <div className={`${cardClass} text-center !px-6 !py-12`}>
          <div className="mb-3">
            <Icon name={isStudent ? "backpack" : "books"} size={44} />
          </div>
          <h3 className="text-lg font-bold mb-2">
            {isStudent
              ? "No Enrolled Classes Found"
              : "No Handled Classes Found"}
          </h3>
          <p className="text-muted text-sm max-w-[480px] mx-auto mb-5">
            {isStudent
              ? 'Click "+ Join Class" and enter an instructor-provided code (such as AUT-305 or NET-310) to access your class page.'
              : 'Click "+ Create Class" to establish a new section and generate a 6-character code for your students.'}
          </p>
          {isStudent && (
            <button
              type="button"
              className={btn("primary")}
              onClick={() => setModal("enroll")}
            >
              + Join a Class Section
            </button>
          )}
          {isProf && (
            <button
              type="button"
              className={btn("primary")}
              disabled={isPendingProf}
              onClick={() => setModal("create")}
            >
              + Create Class Section
            </button>
          )}
        </div>
      ) : visibleClasses.length === 0 ? (
        <div className={`${cardClass} text-center text-muted text-sm`}>
          No classes match your search.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(330px,100%),1fr))] gap-[22px]">
          {visibleClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              activityCount={
                activities.filter((a) => a.classId === cls.id).length
              }
              materialCount={
                materials.filter((m) => m.classId === cls.id).length
              }
            />
          ))}
        </div>
      )}

      {/* Join Class popup (students) */}
      <Modal
        open={modal === "enroll"}
        onClose={closeModal}
        title="Join Class Section"
        subtitle="Enter the 6-character course code provided by your instructor"
        footer={
          <>
            <button
              type="button"
              className={btn("secondary")}
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary")}
              onClick={submitEnroll}
            >
              Confirm Enrollment
            </button>
          </>
        }
      >
        <div className="mb-[18px]">
          <label className={formLabelClass}>Class Code</label>
          <input
            type="text"
            value={enrollCode}
            onChange={(e) => setEnrollCode(e.target.value)}
            maxLength={10}
            placeholder="e.g. AUT-305, NET-310, IS-306"
            className={`${formInputClass} uppercase font-mono !text-base tracking-[1px]`}
          />
          <div className="text-xs text-muted mt-1.5">
            Available demo codes:{" "}
            {["AUT-305", "NET-310", "IS-306", "PM-309"].map((c, i) => (
              <span key={c}>
                <code className="text-accent">{c}</code>
                {i < 3 ? ", " : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-card-inner border border-line rounded-lg p-3.5">
          <div className="text-xs font-bold text-main mb-1">
            Student Enrollment Notice
          </div>
          <div className="text-xs text-muted">
            Only students can join class sections. Once enrolled, you can access
            materials, view assignments, and pass text activities with automated
            AI reviews.
          </div>
        </div>
      </Modal>

      {/* Create Class popup (professors) */}
      <Modal
        open={modal === "create"}
        onClose={closeModal}
        title="Create Class Section"
        subtitle="Establish a new academic course section and generate an enrollment code"
        footer={
          <>
            <button
              type="button"
              className={btn("secondary")}
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary")}
              onClick={submitCreate}
            >
              Create & Publish Section
            </button>
          </>
        }
      >
        <div className="mb-[18px]">
          <label className={formLabelClass}>Subject Title</label>
          <input
            type="text"
            value={createForm.title}
            onChange={setCreateField("title")}
            placeholder="e.g. CMSC 315 - Operating Systems Architecture"
            className={formInputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="mb-[18px]">
            <label className={formLabelClass}>Section Tag</label>
            <input
              type="text"
              value={createForm.section}
              onChange={setCreateField("section")}
              placeholder="e.g. BSCS 3IS-1"
              className={formInputClass}
            />
          </div>
          <div className="mb-[18px]">
            <label className={formLabelClass}>Room / Delivery</label>
            <input
              type="text"
              value={createForm.room}
              onChange={setCreateField("room")}
              placeholder="e.g. Lab 402 or Online"
              className={formInputClass}
            />
          </div>
        </div>

        <div className="mb-[18px]">
          <label className={formLabelClass}>Schedule</label>
          <input
            type="text"
            value={createForm.schedule}
            onChange={setCreateField("schedule")}
            placeholder="e.g. Mon / Wed 1:00 PM - 2:30 PM"
            className={formInputClass}
          />
        </div>

        <div>
          <label className={formLabelClass}>Course Description & Goals</label>
          <textarea
            value={createForm.desc}
            onChange={setCreateField("desc")}
            placeholder="Outline expectations, syllabus focus, and integrity rubrics..."
            className={`${formInputClass} min-h-[100px] resize-y`}
          />
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Helpers shared by the class page and the detector page ---------- */

const SENTENCE_TONES = {
  accent: {
    ai: "bg-accent/10 border-l-accent",
    mixed: "bg-amber/10 border-l-amber",
    human: "bg-emerald/10 border-l-emerald",
  },
  rose: {
    ai: "bg-rose/10 border-l-rose",
    mixed: "bg-amber/10 border-l-amber",
    human: "bg-emerald/10 border-l-emerald",
  },
};

function countWords(text) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

const hasGrade = (sub) => sub.grade !== undefined && sub.grade !== null;

const EMPTY_ACTIVITY_FORM = {
  title: "",
  due: "",
  points: "100",
  instructions: "",
};
const EMPTY_MATERIAL_FORM = {
  title: "",
  category: "Lecture Slides",
  type: "PDF Document",
  desc: "",
};

function SentenceList({ items, tone = "accent", maxHeight = 220 }) {
  return (
    <div
      className="flex flex-col gap-1.5 overflow-y-auto"
      style={{ maxHeight }}
    >
      {items.map((s, i) => (
        <div
          key={i}
          className={`px-3 py-2 rounded-md text-[13px] leading-snug border-l-[3px] ${SENTENCE_TONES[tone][s.label]}`}
        >
          {s.text}
          <span className="text-[10px] opacity-80 ml-1.5">[{s.score}% AI]</span>
        </div>
      ))}
    </div>
  );
}

function ReviewReport({ sub }) {
  const rev = sub.aiReview;
  if (!rev) return null;

  return (
    <div>
      <div className="bg-card-inner border border-line rounded-[14px] p-[18px] mb-5">
        <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
          <span
            className={badge(
              rev.overallAiScore > 50 ? "ai" : "human",
              "!text-[13px] !px-3.5 !py-1.5",
            )}
          >
            {rev.overallAiScore}% AI Probability
          </span>
          <span className="text-[13px] font-bold text-main">{rev.verdict}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-muted">
          <div>
            Perplexity Score:{" "}
            <strong className="text-main">{rev.perplexityScore}</strong>
          </div>
          <div>
            Burstiness Score:{" "}
            <strong className="text-main">{rev.burstinessScore}</strong>
          </div>
        </div>
      </div>

      {hasGrade(sub) && (
        <div className="bg-emerald/10 border border-emerald rounded-[14px] px-4 py-3 mb-5">
          <div className="text-sm font-bold text-emerald">
            Grade: {sub.grade} pts
          </div>
          <div className="text-[13px] text-main mt-1">
            <strong>Professor Feedback:</strong>{" "}
            {sub.professorFeedback || "None"}
          </div>
        </div>
      )}

      <h4 className="text-sm font-bold mb-2">Sentence Breakdown</h4>
      <SentenceList
        items={rev.sentenceBreakdown || []}
        tone="accent"
        maxHeight={260}
      />
    </div>
  );
}

/* ---------- Class page: Activities, Materials, and People ---------- */

function ClassPage({ route }) {
  const {
    user,
    users,
    classes,
    activities,
    setActivities,
    materials,
    setMaterials,
    submissions,
    setSubmissions,
    toast,
  } = useApp();

  const [tab, setTab] = useState("activities");
  const [modal, setModal] = useState(null);
  const [passActivity, setPassActivity] = useState(null);
  const [passText, setPassText] = useState("");
  const [reviewId, setReviewId] = useState(null);
  const [gradeId, setGradeId] = useState(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [actForm, setActForm] = useState(EMPTY_ACTIVITY_FORM);
  const [matForm, setMatForm] = useState(EMPTY_MATERIAL_FORM);

  const cls = classes.find((c) => c.id === route.param);

  if (!user) return null;

  if (!cls) {
    return (
      <div className={`${cardClass} max-w-[560px] mx-auto text-center`}>
        <h1 className="text-2xl font-extrabold mb-2">Class not found</h1>
        <p className="text-muted text-sm mb-5">
          This class does not exist or was removed.
        </p>
        <a href="#/" className={btn("primary")}>
          ← Back to Classes
        </a>
      </div>
    );
  }

  const isStudent = user.role === "student";
  const isProf = user.role === "professor";
  const isAdmin = user.role === "admin";

  if (isStudent && !(cls.studentIds || []).includes(user.id)) {
    return (
      <div className={`${cardClass} max-w-[560px] mx-auto text-center`}>
        <h1 className="text-2xl font-extrabold mb-2">You are not enrolled</h1>
        <p className="text-muted text-sm mb-5">
          Join this class with its class code to see its activities and
          materials.
        </p>
        <a href="#/" className={btn("primary")}>
          ← Back to Classes
        </a>
      </div>
    );
  }

  const canManage =
    isAdmin ||
    (isProf && cls.professorId === user.id && user.status !== "pending");

  const classActivities = activities.filter((a) => a.classId === cls.id);
  const classMaterials = materials.filter((m) => m.classId === cls.id);
  const enrolled = (cls.studentIds || [])
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);
  const instructor = users.find((u) => u.id === cls.professorId);

  const reviewSub = submissions.find((s) => s.id === reviewId) || null;
  const gradeSub = submissions.find((s) => s.id === gradeId) || null;
  const gradeActivity = gradeSub
    ? activities.find((a) => a.id === gradeSub.activityId)
    : null;

  const closeModal = () => setModal(null);

  const copyCode = () => {
    try {
      navigator.clipboard.writeText(cls.code);
    } catch {
      // Ignore clipboard errors
    }
    toast(`Class Code "${cls.code}" copied to clipboard!`);
  };

  const openPass = (act) => {
    setPassActivity(act);
    setPassText("");
    setModal("pass");
  };

  const submitPass = () => {
    if (!passActivity) return;
    const text = passText.trim();
    if (text.length < 30) {
      toast(
        "Please write at least 30 characters for your submission.",
        "warning",
      );
      return;
    }

    const aiReview = generateSubmissionReview(text);
    const newSub = {
      id: `sub_${Date.now()}`,
      activityId: passActivity.id,
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      submittedAt: new Date().toISOString(),
      content: text,
      wordCount: countWords(text),
      aiReview,
      grade: null,
      professorFeedback: null,
    };

    setSubmissions((prev) => [
      newSub,
      ...prev.filter(
        (s) => !(s.activityId === passActivity.id && s.studentId === user.id),
      ),
    ]);
    closeModal();
    toast(
      `Activity successfully passed! AI Review: ${aiReview.overallAiScore}% AI.`,
    );
  };

  const submitActivity = () => {
    const title = actForm.title.trim();
    if (!title) {
      toast("Please provide an activity title.", "warning");
      return;
    }

    const points = Math.min(
      100,
      Math.max(10, parseInt(actForm.points, 10) || 100),
    );
    const newAct = {
      id: `act_${Date.now()}`,
      classId: cls.id,
      title,
      description:
        actForm.instructions.trim() ||
        "Complete the assignment prompt in clear, structured prose.",
      dueDate: actForm.due || "2026-11-20",
      maxPoints: points,
      rubric: "Conceptual rigor & clarity",
      status: "open",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setActivities((prev) => [newAct, ...prev]);
    setActForm(EMPTY_ACTIVITY_FORM);
    closeModal();
    toast(`Published activity "${title}"!`);
  };

  const submitMaterial = () => {
    const title = matForm.title.trim();
    if (!title) {
      toast("Please provide a document title.", "warning");
      return;
    }

    const newMat = {
      id: `mat_${Date.now()}`,
      classId: cls.id,
      title,
      category: matForm.category,
      type: matForm.type,
      description: matForm.desc.trim() || "Official course document.",
      postedAt: new Date().toISOString().split("T")[0],
      fileSize: "1.8 MB",
    };

    setMaterials((prev) => [newMat, ...prev]);
    setMatForm(EMPTY_MATERIAL_FORM);
    closeModal();
    toast(`Material "${title}" added to class hub!`);
  };

  const openReview = (sub) => {
    setReviewId(sub.id);
    setModal("review");
  };

  const openGrade = (sub) => {
    setGradeId(sub.id);
    setGradeScore(hasGrade(sub) ? String(sub.grade) : "");
    setGradeFeedback(sub.professorFeedback || "");
    setModal("grade");
  };

  const submitGrade = () => {
    if (!gradeSub) return;
    const max = gradeActivity ? gradeActivity.maxPoints : 100;
    const score = parseFloat(gradeScore);

    if (Number.isNaN(score) || score < 0 || score > max) {
      toast(`Enter a score between 0 and ${max}.`, "warning");
      return;
    }

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === gradeSub.id
          ? {
              ...s,
              grade: score,
              professorFeedback: gradeFeedback.trim(),
              gradedAt: new Date().toISOString(),
              gradedBy: user.name,
            }
          : s,
      ),
    );
    closeModal();
    toast(`Grade recorded for ${gradeSub.studentName}!`);
  };

  const setActField = (field) => (e) =>
    setActForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setMatField = (field) => (e) =>
    setMatForm((prev) => ({ ...prev, [field]: e.target.value }));

  const tabs = [
    {
      id: "activities",
      label: `Activities & Passing (${classActivities.length})`,
      icon: "document",
    },
    {
      id: "materials",
      label: `Class Materials (${classMaterials.length})`,
      icon: "folder",
    },
    {
      id: "people",
      label: `People in Class (${enrolled.length + 1})`,
      icon: "people",
    },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-[13px] text-muted">
        <a
          href="#/"
          className="text-muted no-underline font-medium hover:text-accent"
        >
          ← Back to Classes
        </a>
        <span>/</span>
        <span className="text-main font-semibold">{cls.subjectName}</span>
      </div>

      {/* Class header */}
      <div className={`${cardClass} !p-8 mb-7`}>
        <div className="flex justify-between items-start gap-5 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center text-[11px] font-bold tracking-[0.5px] uppercase bg-accent/10 text-accent px-2.5 py-1 rounded-md">
                CODE: {cls.code}
              </span>
              <span className="text-[11px] text-muted font-semibold bg-card-inner px-2 py-[3px] rounded">
                {cls.section}
              </span>
            </div>
            <h1 className="text-[26px] font-extrabold text-main mb-2">
              {cls.subjectName}
            </h1>
            <p className="text-sm text-muted max-w-[680px]">
              {cls.description}
            </p>
            <div className="flex items-center gap-4 mt-3.5 text-[13px] text-muted flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="location" size={15} /> {cls.room}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={15} /> {cls.schedule}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="people" size={15} /> {enrolled.length} Students
                Enrolled
              </span>
            </div>
          </div>

          <div className="bg-card-inner border border-line rounded-[14px] px-5 py-4 min-w-[250px]">
            <div className="text-[11px] uppercase font-bold text-muted mb-2">
              Course Instructor
            </div>
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src={cls.professorAvatar || FALLBACK_AVATAR}
                alt={cls.professorName}
                className="w-[38px] h-[38px] rounded-full border-2 border-accent object-cover"
              />
              <div>
                <div className="text-[13px] font-bold text-main">
                  {cls.professorName}
                </div>
                <div className="text-[11px] text-muted">Lead Faculty</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-line">
              <span className="text-xs text-muted">Class Code</span>
              <button
                type="button"
                onClick={copyCode}
                title="Click to copy"
                className="inline-flex items-center text-[11px] font-bold uppercase bg-transparent text-accent px-2.5 py-1 rounded-md cursor-pointer hover:bg-accent/10"
              >
                {cls.code} <Icon name="copy" size={14} className="ml-1.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-7 pb-3 border-b border-line flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={btn(
                tab === t.id ? "primary" : "secondary",
                "!px-4 !py-[7px] !text-[13px]",
              )}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Activities */}
      {tab === "activities" && (
        <div>
          <div className="flex justify-between items-center gap-4 flex-wrap mb-5">
            <div>
              <h2 className="text-xl font-bold">
                Subject Activities & Submissions
              </h2>
              <p className="text-[13px] text-muted">
                {isStudent
                  ? "Pass your written activities below. Each submission undergoes automatic AI analysis visible to both you and your professor."
                  : "Publish activities, set deadlines, and grade student submissions with automated AI insight reports."}
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                className={btn("primary")}
                onClick={() => setModal("activity")}
              >
                + Publish Activity
              </button>
            )}
          </div>

          {classActivities.length === 0 ? (
            <div className={`${cardClass} text-center !p-10`}>
              <p className="text-muted text-sm">
                No activities published for this class yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {classActivities.map((act) => {
                const mySub = submissions.find(
                  (s) => s.activityId === act.id && s.studentId === user.id,
                );
                const actSubs = submissions.filter(
                  (s) => s.activityId === act.id,
                );
                const isOpen = act.status !== "closed";

                return (
                  <div key={act.id} className={`${cardClass} !p-6`}>
                    <div className="flex justify-between items-start gap-4 flex-wrap mb-3">
                      <div>
                        <span
                          className={badge(isOpen ? "human" : "ai", "mb-2")}
                        >
                          {isOpen ? "Open for Submission" : "Closed"}
                        </span>
                        <h3 className="text-lg font-bold text-main mt-1">
                          {act.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[13px] font-bold text-accent">
                          {act.maxPoints} Points
                        </span>
                        <div className="text-xs text-muted">
                          Due: {act.dueDate}
                        </div>
                      </div>
                    </div>

                    <p className="text-[13px] text-muted leading-normal mb-2">
                      {act.description}
                    </p>
                    {act.rubric && (
                      <p className="text-xs text-muted mb-4">
                        <strong className="text-main">Rubric:</strong>{" "}
                        {act.rubric}
                      </p>
                    )}

                    {/* Student view */}
                    {isStudent && (
                      <div>
                        <div className="flex justify-between items-center flex-wrap gap-3 pt-3.5 border-t border-line">
                          <div className="flex items-center flex-wrap gap-2">
                            {mySub ? (
                              <>
                                <span className={badge("human")}>Passed</span>
                                <span className="text-xs text-muted">
                                  Passed on{" "}
                                  {new Date(
                                    mySub.submittedAt,
                                  ).toLocaleDateString()}
                                </span>
                                {hasGrade(mySub) ? (
                                  <span className="text-xs font-bold text-emerald">
                                    Grade: {mySub.grade} / {act.maxPoints}
                                  </span>
                                ) : (
                                  <span className="text-xs text-amber">
                                    Awaiting Professor Grade
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className={badge("pending")}>
                                Not Yet Passed
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2.5">
                            {mySub ? (
                              <>
                                <button
                                  type="button"
                                  className={btn(
                                    "secondary",
                                    "!text-xs !px-3.5 !py-1.5",
                                  )}
                                  onClick={() => openReview(mySub)}
                                >
                                  View Automated Review (
                                  {mySub.aiReview.overallAiScore}% AI)
                                </button>
                                <button
                                  type="button"
                                  className={btn(
                                    "secondary",
                                    "!text-xs !px-3.5 !py-1.5",
                                  )}
                                  onClick={() => openPass(act)}
                                >
                                  Re-Pass Activity
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className={btn(
                                  "primary",
                                  "!text-xs !px-4 !py-1.5",
                                )}
                                onClick={() => openPass(act)}
                              >
                                Pass Activity Now →
                              </button>
                            )}
                          </div>
                        </div>

                        {mySub && mySub.professorFeedback && (
                          <div className="mt-3 pt-2.5 border-t border-line text-[13px]">
                            <strong>Instructor Feedback:</strong>{" "}
                            <span className="text-muted">
                              {mySub.professorFeedback}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Professor view */}
                    {!isStudent && canManage && (
                      <div className="pt-3.5 mt-2.5 border-t border-line">
                        <div className="text-[13px] font-bold text-main mb-2.5">
                          Student Submissions ({actSubs.length})
                        </div>
                        {actSubs.length === 0 ? (
                          <div className="text-xs text-muted">
                            No student has submitted work for this activity yet.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {actSubs.map((sub) => {
                              const score = sub.aiReview
                                ? sub.aiReview.overallAiScore
                                : 0;
                              return (
                                <div
                                  key={sub.id}
                                  className="flex justify-between items-center flex-wrap gap-2 bg-card-inner border border-line rounded-lg px-3.5 py-2"
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-[13px] font-semibold text-main">
                                      {sub.studentName}
                                    </span>
                                    <span
                                      className={badge(
                                        score > 50 ? "ai" : "human",
                                        "!text-[10px]",
                                      )}
                                    >
                                      {score}% AI Score
                                    </span>
                                    <span className="text-[11px] text-muted">
                                      {sub.wordCount} words
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className={btn(
                                        "secondary",
                                        "!text-[11px] !px-2.5 !py-1",
                                      )}
                                      onClick={() => openReview(sub)}
                                    >
                                      Inspect Review
                                    </button>
                                    <button
                                      type="button"
                                      className={btn(
                                        "primary",
                                        "!text-[11px] !px-3 !py-1",
                                      )}
                                      onClick={() => openGrade(sub)}
                                    >
                                      {hasGrade(sub) ? (
                                        `Graded: ${sub.grade}`
                                      ) : (
                                        <>
                                          Grade{" "}
                                          <Icon name="document" size={14} />
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Other professors can look but not grade */}
                    {!isStudent && !canManage && (
                      <div className="pt-3.5 mt-2.5 border-t border-line">
                        <span className={badge("ai")}>
                          {actSubs.length} Submissions
                        </span>
                        <span className="text-xs text-muted ml-2">
                          View only. Only the class professor can grade.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Materials */}
      {tab === "materials" && (
        <div>
          <div className="flex justify-between items-center gap-4 flex-wrap mb-5">
            <div>
              <h2 className="text-xl font-bold">
                Course Documents & Learning Materials
              </h2>
              <p className="text-[13px] text-muted">
                Official syllabi, lecture presentations, manuals, and reference
                sheets.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                className={btn("primary")}
                onClick={() => setModal("material")}
              >
                + Add Material
              </button>
            )}
          </div>

          {classMaterials.length === 0 ? (
            <div className={`${cardClass} text-center !p-10`}>
              <p className="text-muted text-sm">
                No materials uploaded for this class yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4">
              {classMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className={`${cardClass} !p-5 flex flex-col justify-between hover:-translate-y-0.5 hover:border-accent`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className={badge("human", "!text-[10px]")}>
                        {mat.type}
                      </span>
                      <span className="text-[11px] text-muted">
                        {mat.fileSize}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-accent mb-1.5">
                      {mat.category}
                    </div>
                    <h3 className="text-[15px] font-bold text-main mb-1.5">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-muted leading-snug mb-4">
                      {mat.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-line">
                    <span className="text-[11px] text-muted">
                      Added {new Date(mat.postedAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      className={btn(
                        "secondary",
                        "!text-[11px] !px-3 !py-[5px]",
                      )}
                      onClick={() => toast(`Downloading "${mat.title}"...`)}
                    >
                      Download <Icon name="download" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: People */}
      {tab === "people" && (
        <div>
          <div className="mb-7">
            <h2 className="text-lg font-bold mb-3.5 text-accent">
              Lead Faculty & Instructors
            </h2>
            <div
              className={`${cardClass} !p-5 flex items-center gap-4 max-w-[450px]`}
            >
              <img
                src={cls.professorAvatar || FALLBACK_AVATAR}
                alt={cls.professorName}
                className="w-[50px] h-[50px] rounded-full border-2 border-accent object-cover"
              />
              <div>
                <h3 className="text-[15px] font-bold text-main">
                  {cls.professorName}
                </h3>
                <div className="text-xs text-muted mt-0.5">
                  Lead Instructor •{" "}
                  {instructor?.department || "College of Computer Studies"}
                </div>
                <div className="text-xs text-accent mt-1">
                  {instructor?.email || "instructor@tagadetect.edu"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3.5">
              Enrolled Students ({enrolled.length})
            </h2>
            {enrolled.length === 0 ? (
              <div className={`${cardClass} !p-8 text-center text-muted`}>
                No students enrolled in this section yet. Share class code{" "}
                <strong className="text-main">{cls.code}</strong> with your
                students.
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3.5">
                {enrolled.map((st) => (
                  <div
                    key={st.id}
                    className={`${cardClass} !p-4 flex items-center gap-3`}
                  >
                    <img
                      src={st.avatar || FALLBACK_AVATAR}
                      alt={st.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-accent"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-main truncate">
                        {st.name}
                      </h4>
                      <div className="text-[11px] text-muted truncate">
                        {st.email}
                      </div>
                      <span
                        className={badge(
                          "human",
                          "!text-[9px] !px-1.5 !py-0.5 mt-1",
                        )}
                      >
                        Student
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pass activity popup (students) */}
      <Modal
        open={modal === "pass"}
        onClose={closeModal}
        title={
          passActivity
            ? `Pass: ${passActivity.title}`
            : "Pass Activity Submission"
        }
        subtitle="Draft or paste your written activity. It will be reviewed automatically by TagaDetect."
        maxWidth={680}
        footer={
          <>
            <button
              type="button"
              className={btn("secondary")}
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary")}
              onClick={submitPass}
            >
              Pass & Run Automated Review
            </button>
          </>
        }
      >
        <div className="mb-[18px]">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[13px] font-semibold text-muted">
              Your Written Submission
            </label>
            <span className="text-xs text-muted">
              {countWords(passText)} words
            </span>
          </div>
          <textarea
            value={passText}
            onChange={(e) => setPassText(e.target.value)}
            placeholder="Type or paste your complete assignment essay, reflection, or technical report here..."
            className={`${formInputClass} min-h-[200px] text-sm leading-[1.6] resize-y`}
          />
        </div>
        <div className="bg-accent/10 border border-accent/25 rounded-lg px-4 py-3 text-xs text-muted">
          <strong className="text-accent">Automated AI Review Notice:</strong>{" "}
          Upon passing, TagaDetect automatically evaluates token shuffling
          heuristics and sentence cadence. Both you and your professor receive
          the identical diagnostic report.
        </div>
      </Modal>

      {/* Publish activity popup (professors) */}
      <Modal
        open={modal === "activity"}
        onClose={closeModal}
        title="Publish Class Activity"
        subtitle="Create a text-based assignment with scoring rubrics"
        maxWidth={620}
        footer={
          <>
            <button
              type="button"
              className={btn("secondary")}
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary")}
              onClick={submitActivity}
            >
              Publish to Class
            </button>
          </>
        }
      >
        <div className="mb-[18px]">
          <label className={formLabelClass}>Activity Title</label>
          <input
            type="text"
            value={actForm.title}
            onChange={setActField("title")}
            placeholder="e.g. Activity 3: Automata Finite State Machine Analysis"
            className={formInputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="mb-[18px]">
            <label className={formLabelClass}>Due Date</label>
            <input
              type="date"
              value={actForm.due}
              onChange={setActField("due")}
              className={formInputClass}
            />
          </div>
          <div className="mb-[18px]">
            <label className={formLabelClass}>Total Points</label>
            <input
              type="number"
              min="10"
              max="100"
              value={actForm.points}
              onChange={setActField("points")}
              className={formInputClass}
            />
          </div>
        </div>
        <div>
          <label className={formLabelClass}>Instructions & Prompt</label>
          <textarea
            value={actForm.instructions}
            onChange={setActField("instructions")}
            placeholder="Detail the questions, length requirements, and citations expected..."
            className={`${formInputClass} min-h-[100px] resize-y`}
          />
        </div>
      </Modal>

      {/* Add material popup (professors) */}
      <Modal
        open={modal === "material"}
        onClose={closeModal}
        title="Upload Course Material"
        subtitle="Add syllabus, lecture slides, manuals, or reference guides"
        footer={
          <>
            <button
              type="button"
              className={btn("secondary")}
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary")}
              onClick={submitMaterial}
            >
              Upload to Class Hub
            </button>
          </>
        }
      >
        <div className="mb-[18px]">
          <label className={formLabelClass}>Document Title</label>
          <input
            type="text"
            value={matForm.title}
            onChange={setMatField("title")}
            placeholder="e.g. Module 3: State Minimization Slides (PDF)"
            className={formInputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="mb-[18px]">
            <label className={formLabelClass}>Category</label>
            <select
              value={matForm.category}
              onChange={setMatField("category")}
              className={formInputClass}
            >
              <option value="Lecture Slides">Lecture Slides</option>
              <option value="Syllabus">Course Syllabus</option>
              <option value="Lab Manual">Lab Manual</option>
              <option value="Reference Sheet">Reference Sheet</option>
            </select>
          </div>
          <div className="mb-[18px]">
            <label className={formLabelClass}>File Type</label>
            <select
              value={matForm.type}
              onChange={setMatField("type")}
              className={formInputClass}
            >
              <option value="PDF Document">PDF Document</option>
              <option value="Slide Presentation">Slide Presentation</option>
              <option value="Word Document">Word Document</option>
              <option value="Interactive Lab Tool">Interactive Lab Tool</option>
            </select>
          </div>
        </div>
        <div>
          <label className={formLabelClass}>Brief Description</label>
          <input
            type="text"
            value={matForm.desc}
            onChange={setMatField("desc")}
            placeholder="e.g. Complete lecture presentation including DFAs and NFAs."
            className={formInputClass}
          />
        </div>
      </Modal>

      {/* Automated review report popup */}
      <Modal
        open={modal === "review"}
        onClose={closeModal}
        title="Automated AI Diagnostic Report"
        subtitle={
          reviewSub
            ? `Transparent AI review for ${reviewSub.studentName}, generated upon passing`
            : ""
        }
        maxWidth={720}
        footer={
          <button
            type="button"
            className={btn("secondary")}
            onClick={closeModal}
          >
            Close Report
          </button>
        }
      >
        {reviewSub && <ReviewReport sub={reviewSub} />}
      </Modal>

      {/* Grade popup (professors) */}
      <Modal
        open={modal === "grade"}
        onClose={closeModal}
        title="Grade Activity Submission"
        subtitle={
          gradeSub ? `Evaluating submission from ${gradeSub.studentName}` : ""
        }
        maxWidth={650}
        footer={
          <>
            <button
              type="button"
              className={btn("secondary")}
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary")}
              onClick={submitGrade}
            >
              Record Grade
            </button>
          </>
        }
      >
        {gradeSub && (
          <>
            <div className="mb-[18px]">
              <label className={formLabelClass}>Submission Excerpt</label>
              <div className="bg-card-inner border border-line rounded-lg p-3 text-[13px] max-h-[140px] overflow-y-auto text-muted whitespace-pre-wrap">
                {gradeSub.content}
              </div>
            </div>

            <div className="mb-[18px]">
              <label className={formLabelClass}>
                Automated AI Detection Review
              </label>
              <div className="flex items-center gap-3">
                <span
                  className={badge(
                    gradeSub.aiReview && gradeSub.aiReview.overallAiScore > 50
                      ? "ai"
                      : "human",
                  )}
                >
                  {gradeSub.aiReview ? gradeSub.aiReview.overallAiScore : 0}% AI
                  Probability
                </span>
                <span className="text-xs text-muted">
                  {gradeSub.aiReview
                    ? gradeSub.aiReview.verdict
                    : "Review Ready"}
                </span>
              </div>
            </div>

            <div className="mb-[18px]">
              <label className={formLabelClass}>
                Score (Points, max{" "}
                {gradeActivity ? gradeActivity.maxPoints : 100})
              </label>
              <input
                type="number"
                min="0"
                max={gradeActivity ? gradeActivity.maxPoints : 100}
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                className={formInputClass}
              />
            </div>

            <div>
              <label className={formLabelClass}>
                Professor Written Feedback
              </label>
              <textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Provide constructive feedback and rubric remarks for the student..."
                className={`${formInputClass} min-h-[100px] resize-y`}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ---------- AI Detector page ---------- */

function DetectorPage() {
  const { user, feedback, setFeedback, toast } = useApp();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fbOpen, setFbOpen] = useState(false);
  const [fbForm, setFbForm] = useState({
    rating: "highly_accurate",
    type: "Accuracy Feedback",
    comment: "",
  });

  const trimmed = text.trim();
  const words = countWords(text);
  const sentenceCount = trimmed
    ? (text.match(/[^.!?]+[.!?]+/g) || [trimmed]).length
    : 0;

  const runDetection = (value = text) => {
    const input = value.trim();
    if (input.length < 15) {
      toast("Please enter at least 15 characters to run detection.", "warning");
      return;
    }

    setAnalyzing(true);
    setTimeout(() => {
      const res = predictShuffle(input);
      setResult(res);
      setAnalyzing(false);
      toast(`Analysis complete: ${res.verdict}!`);
    }, 400);
  };

  const loadSample = (type) => {
    const sample = DETECTOR_SAMPLES[type] || "";
    setText(sample);
    toast(`Loaded Sample ${type.toUpperCase()} passage!`, "info");
    runDetection(sample);
  };

  const clearInput = () => {
    setText("");
    setResult(null);
  };

  const submitFeedback = () => {
    const comment = fbForm.comment.trim();
    if (!comment) {
      toast(
        "Please write a brief comment describing your feedback.",
        "warning",
      );
      return;
    }

    const entry = {
      id: `fb_${Date.now()}`,
      userId: user ? user.id : "usr_guest",
      userName: user ? user.name : "Guest User",
      userRole: user ? user.role : "student",
      timestamp: new Date().toISOString(),
      detectedScore: result ? result.overallAiScore : 0,
      accuracyRating: fbForm.rating,
      feedbackType: fbForm.type,
      comment,
      status: "Audited",
    };

    setFeedback((prev) => [entry, ...prev]);
    setFbForm({
      rating: "highly_accurate",
      type: "Accuracy Feedback",
      comment: "",
    });
    setFbOpen(false);
    toast("Thank you! Your feedback on the detection result was recorded.");
  };

  const circumference = 408.4;
  const score = result ? result.overallAiScore : 0;
  const offset = circumference - (score / 100) * circumference;
  const gaugeColor =
    score > 65
      ? "var(--color-rose)"
      : score > 35
        ? "var(--color-amber)"
        : "var(--color-emerald)";
  const verdictVariant = score > 65 ? "ai" : score > 35 ? "pending" : "human";

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[1px] text-accent bg-accent/10 px-3.5 py-1.5 rounded-full">
          <span>✦</span> HEURISTIC INTEGRITY SUITE
        </div>
        <h1 className="text-[28px] font-extrabold text-main mt-1.5">
          Stylistic Cadence & AI Detection Engine
        </h1>
        <p className="text-muted text-sm max-w-[680px] mt-1">
          Evaluates lexical predictability, perplexity invariants, and token
          shuffling variations to distinguish authentic human prose from
          synthetic language models.
        </p>
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] max-lg:grid-cols-1 gap-6 items-start">
        {/* Left: input */}
        <div className={`${cardClass} !p-6`}>
          <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
            <label className="text-[13px] font-semibold text-muted">
              Analyze Text Passage
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                className={btn("secondary", "!text-[11px] !px-2.5 !py-1")}
                onClick={() => loadSample("ai")}
              >
                Sample AI
              </button>
              <button
                type="button"
                className={btn("secondary", "!text-[11px] !px-2.5 !py-1")}
                onClick={() => loadSample("human")}
              >
                Sample Human
              </button>
              <button
                type="button"
                className={btn("secondary", "!text-[11px] !px-2.5 !py-1")}
                onClick={() => loadSample("mixed")}
              >
                Sample Mixed
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste an essay, article, assignment, or report here (at least 20 words recommended for optimal heuristic stability)..."
            className={`${formInputClass} min-h-[280px] text-sm leading-[1.6] resize-y`}
          />

          <div className="flex justify-between items-center flex-wrap gap-3 mt-3 pt-3 border-t border-line">
            <div className="flex gap-4 text-xs text-muted">
              <span>
                Words: <strong className="text-main">{words}</strong>
              </span>
              <span>
                Characters: <strong className="text-main">{text.length}</strong>
              </span>
              <span>
                Sentences:{" "}
                <strong className="text-main">{sentenceCount}</strong>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={btn("secondary", "!text-[13px] !px-3.5 !py-2")}
                onClick={clearInput}
              >
                Clear
              </button>
              <button
                type="button"
                className={btn("primary", "!text-[13px] !px-5 !py-2")}
                disabled={analyzing}
                onClick={() => runDetection()}
              >
                {analyzing ? (
                  <>
                    Analyzing... <Icon name="hourglass" size={15} />
                  </>
                ) : (
                  <>
                    Analyze Passage <Icon name="bolt" size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className={`${cardClass} !p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold">Diagnostic Results</h3>
            {result && (
              <button
                type="button"
                className={btn("secondary", "!text-[11px] !px-2.5 !py-1")}
                onClick={() => setFbOpen(true)}
              >
                Give Feedback <Icon name="feedback" size={14} />
              </button>
            )}

          </div>

          {!result ? (
            <div className="text-center px-5 py-[50px] text-muted">
              <div className="mb-3 flex justify-center">
                <Icon name="search" size={44} />
              </div>
              <p className="text-sm font-semibold">Awaiting Analysis</p>
              <p className="text-xs mt-1">
                Paste your content on the left and click "Analyze Passage" to
                generate stylistic metrics.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col items-center mb-5">
                <div className="relative w-[160px] h-[160px]">
                  <svg
                    width="160"
                    height="160"
                    viewBox="0 0 160 160"
                    className="-rotate-90"
                  >
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      strokeWidth="12"
                      style={{ stroke: "var(--color-gauge-track)" }}
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      className="transition-[stroke-dashoffset,stroke] duration-1000 ease-out"
                      style={{ stroke: gaugeColor }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[34px] font-extrabold text-main">
                      {score}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-muted tracking-[0.5px]">
                      AI Probability
                    </span>
                  </div>
                </div>

                <div
                  className={badge(
                    verdictVariant,
                    "mt-2.5 !text-[13px] !px-4 !py-1.5",
                  )}
                >
                  {result.verdict}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="bg-card-inner border border-line rounded-lg px-3 py-2.5">
                  <div className="text-[11px] text-muted">Perplexity Score</div>
                  <div className="text-lg font-bold text-main mt-0.5">
                    {result.perplexityScore} / 100
                  </div>
                </div>
                <div className="bg-card-inner border border-line rounded-lg px-3 py-2.5">
                  <div className="text-[11px] text-muted">
                    Burstiness Variety
                  </div>
                  <div className="text-lg font-bold text-main mt-0.5">
                    {result.burstinessScore} / 100
                  </div>
                </div>
              </div>

              <h4 className="text-[13px] font-bold mb-2">
                Sentence Cadence Breakdown
              </h4>
              <SentenceList
                items={result.sentenceBreakdown}
                tone="rose"
                maxHeight={220}
              />
            </div>
          )}
        </div>
      </div>

      {/* Feedback stream */}
      <div className={`${cardClass} !p-6 mt-8`}>
        <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold">
              Community & Faculty Feedback Stream
            </h3>
            <p className="text-[13px] text-muted">
              Recent user ratings on AI detection precision, false positives,
              and cadence metrics.
            </p>
          </div>
          <button
            type="button"
            className={btn("secondary", "!text-xs !px-3.5 !py-1.5")}
            onClick={() => setFbOpen(true)}
          >
            + Submit Result Feedback
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted">
              No feedback has been submitted yet.
            </p>
          ) : (
            feedback.filter((fb) => !["fb_1", "fb_2"].includes(fb.id)).slice(0, 5).map((fb) => (
              <div
                key={fb.id}
                className="bg-card-inner border border-line rounded-lg px-4 py-3"
              >
                <div className="flex justify-between items-center flex-wrap gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <strong className="text-[13px] text-main">
                      {fb.userName}
                    </strong>
                    <span
                      className={badge(
                        fb.userRole === "professor" ? "ai" : "human",
                        "!text-[9px] !px-1.5 !py-0.5",
                      )}
                    >
                      {fb.userRole}
                    </span>
                    <span className="text-[11px] text-muted">
                      • {new Date(fb.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-accent/10 text-accent px-2 py-[3px] rounded-md">
                    {fb.feedbackType}
                  </span>
                </div>
                <p className="text-xs text-muted">"{fb.comment}"</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAQ nudge */}
      <div className="flex items-center justify-between gap-4 flex-wrap mt-8 bg-card border border-line border-l-4 border-l-accent rounded-r-[14px] px-5 py-3.5">
        <div className="text-[13px] text-muted">
          <strong className="text-main">Questions about your results?</strong>{" "}
          Our FAQ explains what the AI score means, how the heatmap works, and
          what to do with the verdict.
        </div>
        <a
          href="#/faq"
          className={btn(
            "secondary",
            "!text-xs !px-4 !py-[7px] whitespace-nowrap",
          )}
        >
          Read the FAQ →
        </a>
      </div>

      {/* Feedback popup */}
      <Modal
        open={fbOpen}
        onClose={() => setFbOpen(false)}
        title="AI Detector Result Feedback"
        subtitle="Help improve detection models by sharing evaluation feedback"
        footer={
          <>
            <button
              type="button"
              className={btn("secondary")}
              onClick={() => setFbOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary")}
              onClick={submitFeedback}
            >
              Submit Feedback
            </button>
          </>
        }
      >
        <div className="mb-[18px]">
          <label className={formLabelClass}>Accuracy Rating</label>
          <select
            value={fbForm.rating}
            onChange={(e) =>
              setFbForm((p) => ({ ...p, rating: e.target.value }))
            }
            className={formInputClass}
          >
            <option value="highly_accurate">
              Highly Accurate (Reflects True Authorship)
            </option>
            <option value="partially_accurate">
              Partially Accurate (Mixed Nuance)
            </option>
            <option value="false_positive">
              False Positive (Human text flagged as AI)
            </option>
            <option value="false_negative">
              False Negative (AI text undetected)
            </option>
          </select>
        </div>
        <div className="mb-[18px]">
          <label className={formLabelClass}>Feedback Category</label>
          <select
            value={fbForm.type}
            onChange={(e) => setFbForm((p) => ({ ...p, type: e.target.value }))}
            className={formInputClass}
          >
            <option value="Accuracy Feedback">General Accuracy</option>
            <option value="False Positive Flags">
              False Positive Correction
            </option>
            <option value="False Negative Flags">Missed AI Usage</option>
            <option value="Sentence Highlight Correction">
              Sentence Highlight Feedback
            </option>
          </select>
        </div>
        <div>
          <label className={formLabelClass}>Detailed Commentary</label>
          <textarea
            value={fbForm.comment}
            onChange={(e) =>
              setFbForm((p) => ({ ...p, comment: e.target.value }))
            }
            placeholder="Explain which sentences or elements were misclassified..."
            className={`${formInputClass} min-h-[100px] resize-y`}
          />
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Small pieces shared by About, FAQ, Settings, and Admin ---------- */

// Turns **bold**, *italic*, and `code` marks inside text into styled pieces
function RichText({ text }) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**")) {
      return (
        <strong key={i} className="text-main font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`")) {
      return (
        <code key={i} className="text-accent">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-end justify-between mb-7 pb-4 border-b border-line">
      <div>
        <h2 className="text-2xl font-extrabold tracking-[-0.5px] text-main">
          {title}
        </h2>
        <p className="text-sm text-muted mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function HeroTag({ children }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[1px] text-accent bg-accent/10 px-3.5 py-1.5 rounded-full">
      <span>✦</span> {children}
    </div>
  );
}

/* ---------- About ---------- */

const ABOUT_FOUNDERS = [
  {
    name: "Timoth Rayjell E. Audije",
    role: "Backend Developer & Machine Learning Lead",
    bio: "Leads the backend architecture and machine learning pipeline powering TagaDetect's heuristic AI analysis engine.",
    initial: "T",
    work: [
      "Machine Learning Engine",
      "Backend API Development",
      "Heuristic Detection Models",
    ],
  },
  {
    name: "John Wayne M. Capistrano",
    role: "Design & Frontend Developer",
    bio: "Crafts the visual identity and user interface of TagaDetect, ensuring an intuitive and accessible experience for all users.",
    initial: "J",
    work: [
      "UI/UX Design System",
      "Frontend Development",
      "Component Architecture",
    ],
  },
  {
    name: "Leilanie Alaine M. Cristobal",
    role: "Backend Developer & Documenter",
    bio: "Develops core backend systems and maintains comprehensive technical documentation for the TagaDetect platform.",
    initial: "L",
    work: [
      "Backend Systems",
      "Technical Documentation",
      "Data Management",
    ],
  },
  {
    name: "Gabriel M. Samaniego",
    role: "Frontend Developer & Documenter",
    bio: "Implements frontend features and contributes to the platform's documentation, ensuring clarity and consistency throughout.",
    initial: "G",
    work: [
      "Frontend Implementation",
      "Project Documentation",
      "UI Integration",
    ],
  },
];

const ABOUT_HOWTOS = [
  {
    title: "1. Predictive Token Shuffling & Cadence",
    steps: [
      [
        "Step 1: Sentence Tokenization",
        "Raw text is parsed into discrete clause tokens while retaining boundary delimiters.",
      ],
      [
        "Step 2: Shuffled Heuristic Analysis",
        "Evaluates n-gram uniformity and structural variance across the text blocks.",
      ],
      [
        "Step 3: Cadence Scoring",
        "Computes perplexity invariants (0-100) and burstiness variability (sentence length distribution).",
      ],
      [
        "Step 4: Color-Coded Tagging",
        "Sentences are tagged as High AI (rose/purple), Hybrid/Mixed (amber), or Authentic Human (emerald).",
      ],
    ],
  },
  {
    title: "2. Automated Review upon Student Submission",
    steps: [
      [
        "Step 1: Student Passes Text",
        "The student inputs their written reflection or essay into the submission portal.",
      ],
      [
        "Step 2: Instant Engine Execution",
        "The submission triggers `generateSubmissionReview()` immediately on pass.",
      ],
      [
        "Step 3: Shared Report Storage",
        "A comprehensive diagnostic report is attached to the submission record.",
      ],
      [
        "Step 4: Dual Transparency",
        "Both the student and instructor view the identical analysis report before grading.",
      ],
    ],
  },
];

const ABOUT_FAQS = [
  {
    q: "Can professors join classes as students?",
    a: "No. In TagaDetect, role boundaries are strictly enforced. Only students can join classes using class codes. Professors create classes, publish activities, upload materials, and grade student submissions.",
  },
  {
    q: "Why do professor accounts require admin approval?",
    a: "To preserve institutional trust and curriculum integrity, newly registered professor accounts are placed in the Admin Verification Queue. An administrator confirms their faculty credentials before course creation is enabled.",
  },
  {
    q: "How does the User Feedback mechanism work?",
    a: "Users can submit feedback directly from the AI Detector results panel to flag false positives or report accuracy ratings. These reports stream to the administrator dashboard to continuously refine the machine learning heuristics.",
  },
];

function AboutPage() {
  return (
    <div>
      <section className="text-center max-w-[780px] mx-auto mb-[50px]">
        <HeroTag>ARCHITECTURE & FOUNDATION</HeroTag>
        <h1 className="text-[32px] max-md:text-2xl font-extrabold text-main mt-2">
          Transparent Academic Integrity & AI Stylistics
        </h1>
        <p className="text-muted text-[15px] mt-2.5 leading-relaxed">
          TagaDetect was created to bridge pedagogical transparency with
          cutting-edge stylistic heuristic modeling. We believe academic
          integrity should empower student expression rather than serve as a
          punitive black box.
        </p>
      </section>

      <section className="mb-[60px]">
        <SectionHeader
          title="Platform Founders & Research Architects"
          subtitle="The interdisciplinary team behind the heuristic shuffle engine and classroom architecture"
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(270px,100%),1fr))] gap-6">
          {ABOUT_FOUNDERS.map((f) => (
            <div key={f.name} className={`${cardClass} !p-6 text-center`}>
              {f.avatar ? (
                <img
                  src={f.avatar}
                  alt={f.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3.5 border-[3px] border-accent"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-card-inner border-[3px] border-accent mx-auto mb-3.5 flex items-center justify-center text-[28px] font-extrabold text-accent">
                  {f.initial || f.name.charAt(0)}
                </div>
              )}
              <h3 className="text-[17px] font-bold text-main">{f.name}</h3>
              <div className="text-xs font-semibold text-accent mb-2.5">
                {f.role}
              </div>
              <p className="text-[13px] text-muted leading-normal mb-4">
                {f.bio}
              </p>
              <div className="text-left bg-card-inner border border-line rounded-lg px-3 py-2.5">
                <div className="text-[11px] font-bold uppercase text-muted mb-1">
                  Key Contributions
                </div>
                <div className="text-[11px] text-main">
                  {f.work.map((w) => (
                    <div key={w}>• {w}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-[60px]">
        <SectionHeader
          title="Technical How-To's"
          subtitle="Detailed step-by-step documentation on how TagaDetect operates under the hood"
        />
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-6">
          {ABOUT_HOWTOS.map((guide) => (
            <div key={guide.title} className={`${cardClass} !p-6`}>
              <h3 className="text-base font-bold text-accent mb-3.5">
                {guide.title}
              </h3>
              <div className="flex flex-col gap-3 text-[13px] text-muted">
                {guide.steps.map(([step, detail]) => (
                  <div key={step}>
                    <strong className="text-main">{step}</strong> —{" "}
                    <RichText text={detail} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-[60px]">
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about permissions, detection accuracy, and roles"
        />
        <div className="flex flex-col gap-3 max-w-[820px] mx-auto">
          {ABOUT_FAQS.map((item) => (
            <div key={item.q} className={`${cardClass} !px-6 !py-[18px]`}>
              <h4 className="text-[15px] font-bold text-main mb-1.5">
                {item.q}
              </h4>
              <p className="text-[13px] text-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- FAQ (search, filters, and accordion) ---------- */

const FAQ_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "start", label: "Getting started" },
  { id: "results", label: "Your results" },
  { id: "accuracy", label: "Accuracy & limits" },
  { id: "privacy", label: "Privacy" },
  { id: "help", label: "Troubleshooting" },
];

const FAQ_GROUPS = [
  {
    cat: "start",
    title: "Getting started",
    about: "What TagaDetect does and how to run a check.",
    items: [
      {
        q: "What is TagaDetect?",
        a: [
          `TagaDetect is a web tool that estimates how likely it is that a piece of writing was generated by an AI model such as ChatGPT, Claude, or Gemini. It works with English, Filipino (Tagalog), and Taglish text.`,
          `It is made for anyone who needs a second look at a piece of writing, including students, teachers, writers, editors, and publishers.`,
        ],
      },
      {
        q: "Which languages does it support?",
        a: [
          `English, Filipino (Tagalog), and Taglish — the mix of Tagalog and English that many Filipinos use every day.`,
          `Taglish support is experimental. It has the least training data of the three, so treat Taglish results with extra caution.`,
        ],
      },
      {
        q: "How do I check a text?",
        a: [
          {
            list: [
              `Paste your text into the box, or upload a **.txt** file.`,
              `Select **Detect AI Content**.`,
              `Read your results in the Result Analysis section below the box.`,
            ],
          },
        ],
      },
      {
        q: "How much text do I need?",
        a: [
          `Use at least **50 words**. A few full paragraphs give much better results. Very short texts — such as a single sentence or a chat message — don't show enough writing patterns for a dependable estimate.`,
        ],
      },
      {
        q: "Why won't TagaDetect analyze my text?",
        a: [
          `It can refuse a text when:`,
          {
            list: [
              `the text is too short,`,
              `the text is mostly numbers, tables, lists, or code, or`,
              `the text is in a language TagaDetect doesn't support.`,
            ],
          },
          `To fix this, paste complete paragraphs of normal written text in English, Filipino, or Taglish.`,
        ],
      },
      {
        q: "Can I upload Word or PDF files?",
        a: [
          `Not yet. You can upload **.txt** files only. For a Word or PDF document, copy the text from the file and paste it into the box.`,
        ],
      },
      {
        q: "Can I check several texts at once?",
        a: [
          `Not at the moment. Check one text at a time. Batch checking is planned for a future update.`,
        ],
      },
    ],
  },
  {
    cat: "results",
    title: "Your results",
    about: "What the score, the verdict, and the heatmap tell you.",
    items: [
      {
        q: "What does the AI score mean?",
        a: [
          `The score is an estimate of how likely it is that the whole text was written by AI. It is **not** the share of your text that came from AI.`,
          `For example, 26% means the model found only weak signs of AI writing. It does not mean a quarter of the text was AI-written.`,
          { scale: true },
        ],
      },
      {
        q: "What do the verdicts mean?",
        a: [
          {
            list: [
              `**Likely human-written:** the writing shows few of the patterns the model links with AI text.`,
              `**Unclear:** the signals are mixed. Don't draw a conclusion from this result.`,
              `**Likely AI-generated:** the writing shows many patterns the model links with AI text. This is still an estimate, not proof.`,
            ],
          },
        ],
      },
      {
        q: "What is the sentence heatmap?",
        a: [
          `The heatmap colors parts of your text to show which passages look more or less like AI writing. Use it to see where to look more closely.`,
          `Scores are calculated for small groups of sentences, not for each sentence alone, and they are approximate. A single highlighted sentence does not mean that sentence was written by AI.`,
        ],
      },
      {
        q: "Does a high AI score prove someone used AI?",
        a: [
          `No. A detector can only estimate, and it can be wrong in both directions. A high score is a reason to look closer, not a verdict.`,
        ],
      },
      {
        q: "I'm a teacher or editor. How should I use the results?",
        a: [
          `Treat the result as one signal among several, never as the only evidence. Helpful next steps:`,
          {
            list: [
              `compare the text with the writer's earlier work,`,
              `ask to see drafts or the document's edit history,`,
              `talk with the writer and let them explain how they wrote it.`,
            ],
          },
          `Avoid penalizing anyone based on a score alone.`,
        ],
      },
      {
        q: "Why was my own writing flagged as AI?",
        a: [
          `Detectors sometimes flag real human writing. This is more likely when the text is:`,
          {
            list: [
              `very formal, polished, or written from a template, such as a cover letter or report,`,
              `heavily rewritten with grammar or rewriting tools,`,
              `short,`,
              `written by someone still learning the language.`,
            ],
          },
          `If you believe a result is wrong, please report it. See *"How do I report a wrong result?"* under Troubleshooting.`,
        ],
      },
      {
        q: "Why wasn't AI-written text flagged?",
        a: [
          `AI text can slip through when it has been edited or paraphrased by a person, mixed with human writing, or produced by a newer AI model than the ones TagaDetect learned from. A "Likely human-written" result does not guarantee that no AI was involved.`,
        ],
      },
    ],
  },
  {
    cat: "accuracy",
    title: "Accuracy & limits",
    about: "How TagaDetect works and where it can fall short.",
    items: [
      {
        q: "How does TagaDetect work?",
        a: [
          `TagaDetect looks at patterns in how a text is written — such as the words and letter combinations used, how sentence lengths vary, and how punctuation is used. It compares those patterns with examples of human and AI writing it learned from, then estimates the likelihood that your text is AI-generated.`,
          `It does not search the internet, and it does not know who wrote the text.`,
        ],
      },
      {
        q: "How accurate is it?",
        a: [
          `No AI detector is always right. TagaDetect is still being tested, so accuracy figures are not published yet.`,
          `English has the most training data, Filipino has less, and Taglish has the least. Expect results to be steadier for English than for the other two, and treat every result as an estimate.`,
        ],
      },
      {
        q: "Does it work on Taglish?",
        a: [
          `Yes, but it is experimental. Text that switches between Tagalog and English is harder to judge, and the model has had less Taglish to learn from. Results for Taglish are marked as experimental and should be read with extra care.`,
        ],
      },
      {
        q: "What kinds of text work best?",
        a: [
          `Essays, articles, reports, and posts of several sentences or more, written in English, Filipino, or Taglish.`,
          `It is not designed for poems, song lyrics, code, tables, lists, or very short messages.`,
        ],
      },
      {
        q: "Does it check for plagiarism?",
        a: [
          `No. TagaDetect estimates whether a text looks AI-generated. It does not compare your text with other sources, so it cannot tell you whether something was copied.`,
        ],
      },
      {
        q: "Can it tell which AI wrote a text?",
        a: [
          `No. It gives one overall estimate and does not identify a specific AI tool.`,
        ],
      },
      {
        q: "Can the result be fooled?",
        a: [
          `Yes. Rewriting AI text by hand, paraphrasing it, or mixing it with your own writing can lower the score. This is a limit of every AI detector — another reason to treat results as an estimate.`,
        ],
      },
    ],
  },
  {
    cat: "privacy",
    title: "Privacy",
    about: "What happens to the text you check.",
    items: [
      {
        q: "Is my text saved?",
        a: [
          `Your text is analyzed to produce a result and is not kept on our servers. Your history, if you use it, is saved only in your own browser.`,
        ],
      },
      {
        q: "How do I delete my history?",
        a: [
          `Open History and delete individual entries, or clear the whole list. Clearing your browser's site data for TagaDetect also removes it.`,
        ],
      },
      {
        q: "Is my text used to improve TagaDetect?",
        a: [
          `Only if you choose to share it. If you report a wrong result and agree to share the text, it may be used to improve the model. Nothing is shared without your agreement.`,
        ],
      },
      {
        q: "Can other people see my results?",
        a: [
          `No. Your results and history are visible only to you in your browser.`,
        ],
      },
    ],
  },
  {
    cat: "help",
    title: "Troubleshooting",
    about: "Fixes for common problems.",
    items: [
      {
        q: "Nothing happens when I select Detect AI Content",
        a: [
          {
            list: [
              `Check that the text box is not empty and the text meets the minimum length.`,
              `Refresh the page and try again.`,
              `Check your internet connection.`,
            ],
          },
        ],
      },
      {
        q: "My uploaded file shows strange characters",
        a: [
          `Save the file as a **.txt** file with **UTF-8 encoding**. In Notepad, choose Save As and set Encoding to UTF-8. This keeps characters such as ñ and curved quotation marks intact. If it still looks wrong, paste the text into the box instead.`,
        ],
      },
      {
        q: "The page is too dark or too bright",
        a: [
          `Use the theme switch (☀️ / 🌙) in the top-right corner of any page to change between dark and light mode.`,
        ],
      },
      {
        q: "How do I report a wrong result?",
        a: [
          `Use the **Feedback** option on the results screen to tell us the result was wrong, and say whether the text was written by a person or by AI. Reports help us find where the model needs to improve.`,
        ],
      },
    ],
  },
];

function faqSearchText(item) {
  const answer = item.a
    .map((block) =>
      typeof block === "string" ? block : (block.list || []).join(" "),
    )
    .join(" ");
  return `${item.q} ${answer}`.toLowerCase();
}

function FaqBlock({ block }) {
  if (typeof block === "string") {
    return (
      <p className="mb-2.5 last:mb-0">
        <RichText text={block} />
      </p>
    );
  }

  if (block.list) {
    return (
      <ul className="list-disc pl-5 mb-2.5 last:mb-0">
        {block.list.map((li, i) => (
          <li key={i} className="mb-[5px]">
            <RichText text={li} />
          </li>
        ))}
      </ul>
    );
  }

  if (block.scale) {
    return (
      <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-2 mt-2.5 mb-3.5 max-w-[500px]">
        <div className="border-t-4 border-emerald pt-1.5 text-xs font-semibold text-main">
          Likely human-written
        </div>
        <div className="border-t-4 border-amber pt-1.5 text-xs font-semibold text-main">
          Unclear
        </div>
        <div className="border-t-4 border-rose pt-1.5 text-xs font-semibold text-main">
          Likely AI-generated
        </div>
      </div>
    );
  }

  return null;
}

function FaqPage() {
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState([]);

  const term = query.trim().toLowerCase();

  const groups = FAQ_GROUPS.map((g) => ({
    ...g,
    items: g.items
      .map((item, i) => ({ ...item, id: `${g.cat}-${i}` }))
      .filter(
        (item) =>
          (cat === "all" || g.cat === cat) &&
          (!term || faqSearchText(item).includes(term)),
      ),
  })).filter((g) => g.items.length > 0);

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  const toggle = (id) =>
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div>
      <section className="text-center max-w-[680px] mx-auto mb-11">
        <HeroTag>HELP CENTER</HeroTag>
        <h1 className="text-[32px] max-sm:text-2xl font-extrabold text-main mt-2.5 tracking-[-0.5px]">
          Frequently Asked Questions
        </h1>
        <p className="text-muted text-[15px] mt-2.5 leading-relaxed">
          Answers about checking text, reading your results, and how your
          writing is handled.
        </p>
      </section>

      <div className="relative mb-4">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search questions, e.g. "short text" or "privacy"…'
          autoComplete="off"
          className="w-full py-[13px] pr-4 pl-11 text-sm text-main bg-card border border-line rounded-[14px] outline-none transition-colors duration-150 placeholder:text-muted focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-2.5">
        {FAQ_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`text-[13px] px-3.5 py-1.5 rounded-full border cursor-pointer transition-colors duration-150 ${
              cat === c.id
                ? "bg-accent border-accent text-white font-semibold"
                : "bg-card border-line text-muted font-medium hover:bg-card-inner hover:text-main"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div
        className="text-xs text-muted min-h-[1.4em] mt-1.5 mb-7"
        role="status"
      >
        {total ? `${total} ${total === 1 ? "question" : "questions"}` : ""}
      </div>

      {groups.map((g) => (
        <section key={g.cat} className="mb-10">
          <h2 className="text-lg font-bold text-main mb-1">{g.title}</h2>
          <p className="text-[13px] text-muted mb-3.5">{g.about}</p>

          {g.items.map((item) => {
            const open = openIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`bg-card border rounded-[14px] mb-2 overflow-hidden transition-colors duration-150 ${
                  open
                    ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]"
                    : "border-line"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={open}
                  className="w-full flex justify-between items-center gap-4 px-5 py-4 text-left text-sm font-semibold text-main bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-card-inner"
                >
                  {item.q}
                  <span
                    className={`shrink-0 w-2 h-2 border-r-2 border-b-2 border-accent transition-transform duration-200 ${
                      open
                        ? "-rotate-[135deg] translate-y-0.5"
                        : "rotate-45 -translate-y-0.5"
                    }`}
                  />
                </button>
                {open && (
                  <div className="px-5 pb-[18px] text-sm text-muted leading-[1.7] max-w-[70ch]">
                    {item.a.map((block, i) => (
                      <FaqBlock key={i} block={block} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {total === 0 && (
        <div className="bg-card border border-dashed border-line rounded-[14px] px-6 py-7 text-muted text-sm">
          <strong>No questions match your search.</strong>
          <br />
          Try fewer words, or select <em>All</em> to see every topic.
        </div>
      )}

      <div className="mt-4 px-5 py-4 border-l-4 border-accent bg-card rounded-r-[14px] text-muted text-sm leading-relaxed">
        <strong className="text-main">
          TagaDetect gives an estimate, not proof.
        </strong>{" "}
        Use a result as one signal alongside your own judgment, and give people
        a chance to explain before drawing conclusions.
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */

function SettingsPage() {
  const { user, theme, setTheme, toast } = useApp();
  const [prefs, setPrefs] = usePersistedState("tagadetect_settings", {
    sensitivity: "balanced",
    shuffleMode: "pseudo_shuffled",
  });

  if (!user) return null;

  const savePref = (field) => (e) => {
    const value = e.target.value;
    setPrefs((prev) => ({ ...prev, [field]: value }));
    toast("Detector heuristic settings saved!");
  };

  const chooseTheme = (next) => {
    setTheme(next);
    toast(`Applied ${next === "dark" ? "Dark" : "Light"} Theme!`);
  };

  const resetAll = () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all data back to factory defaults?",
      )
    ) {
      return;
    }
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("tagadetect_settings");
    window.location.hash = "#/login";
    window.location.reload();
  };

  return (
    <div className="max-w-[860px] mx-auto">
      <div className="mb-7">
        <h1 className="text-[26px] font-extrabold text-main">
          Account & Platform Settings
        </h1>
        <p className="text-muted text-sm mt-1">
          Manage your profile, theme mode, detection heuristics, and
          notifications
        </p>
      </div>

      {/* Profile */}
      <div className={`${cardClass} !p-6 mb-6`}>
        <h3 className="text-base font-bold mb-4">Active Profile</h3>
        <div className="flex items-center gap-5 flex-wrap">
          <img
            src={user.avatar || FALLBACK_AVATAR}
            alt={user.name}
            className="w-16 h-16 rounded-full border-[3px] border-accent object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-main">{user.name}</h2>
              <span className={badge(user.role === "student" ? "human" : "ai")}>
                {user.role.toUpperCase()}
              </span>
              <span className="text-xs text-muted">({user.status})</span>
            </div>
            <div className="text-[13px] text-muted mt-0.5">{user.email}</div>
            <div className="text-xs text-accent mt-1">
              College of Computer Studies • UST / DLSU Partner Network
            </div>
          </div>
          <button
            type="button"
            className={btn("secondary", "!text-xs !px-3.5 !py-1.5")}
            onClick={() => toast("Profile details updated (demo mode).")}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className={`${cardClass} !p-6 mb-6`}>
        <h3 className="text-base font-bold mb-1.5">
          Visual Appearance & Theme
        </h3>
        <p className="text-[13px] text-muted mb-4">
          Customize the interface color scheme
        </p>

        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => chooseTheme("dark")}
            onKeyDown={(e) => {
              if (e.key === "Enter") chooseTheme("dark");
            }}
            className={`rounded-[14px] p-4 cursor-pointer border-2 ${
              theme === "dark" ? "border-accent" : "border-line"
            }`}
            style={{ background: "#12101d" }}
          >
            <div className="flex justify-between items-center mb-2">
              <strong className="text-sm text-white">
                🌙 Dark Mode (Default)
              </strong>
              {theme === "dark" && (
                <span className="text-accent font-bold">✓</span>
              )}
            </div>
            <p className="text-xs" style={{ color: "#b0aec4" }}>
              Rich purple accents with deep midnight slate canvas.
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => chooseTheme("light")}
            onKeyDown={(e) => {
              if (e.key === "Enter") chooseTheme("light");
            }}
            className={`rounded-[14px] p-4 cursor-pointer border-2 ${
              theme === "light" ? "border-accent" : "border-line"
            }`}
            style={{ background: "#ffffff" }}
          >
            <div className="flex justify-between items-center mb-2">
              <strong className="text-sm" style={{ color: "#1e1b2e" }}>
                ☀️ Light Mode
              </strong>
              {theme === "light" && (
                <span className="text-accent font-bold">✓</span>
              )}
            </div>
            <p className="text-xs" style={{ color: "#6b6880" }}>
              High contrast clean white canvas with crisp borders.
            </p>
          </div>
        </div>
      </div>

      {/* Detection preferences */}
      <div className={`${cardClass} !p-6 mb-6`}>
        <h3 className="text-base font-bold mb-1.5">
          AI Detection Engine Preferences
        </h3>
        <p className="text-[13px] text-muted mb-4">
          Configure heuristic tolerance and token cadence parameters
        </p>

        <div className="mb-[18px]">
          <label className={formLabelClass}>Heuristic Sensitivity</label>
          <select
            value={prefs.sensitivity}
            onChange={savePref("sensitivity")}
            className={formInputClass}
          >
            <option value="conservative">
              Conservative (Minimizes false positives, higher human tolerance)
            </option>
            <option value="balanced">
              Balanced (Standard academic calibration)
            </option>
            <option value="strict">
              Strict (High sensitivity for advanced LLM watermarks)
            </option>
          </select>
        </div>

        <div>
          <label className={formLabelClass}>
            Shuffling & Predictability Model
          </label>
          <select
            value={prefs.shuffleMode}
            onChange={savePref("shuffleMode")}
            className={formInputClass}
          >
            <option value="pseudo_shuffled">
              Pseudo-Shuffled Token Permutation (Fast Heuristic)
            </option>
            <option value="ngram_burstiness">
              N-Gram Burstiness & Perplexity Analysis
            </option>
          </select>
        </div>
      </div>

      {/* Reset */}
      <div className="bg-rose/5 border border-rose rounded-[20px] p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-[15px] font-bold text-rose">
              Reset Application Data
            </h3>
            <p className="text-[13px] text-muted mt-0.5">
              Restore all classes, founders, activities, and initial users to
              factory seed defaults.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-full bg-card border border-rose text-rose cursor-pointer transition-all duration-200 hover:bg-rose/10"
          >
            Reset to Factory Defaults ↺
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Admin: approvals and feedback audit ---------- */

function AdminPage() {
  const { user, users, setUsers, feedback, switchUser, toast } = useApp();

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const pending = users.filter(
    (u) => u.role === "professor" && u.status === "pending",
  );

  const approve = (target) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, status: "approved" } : u)),
    );
    toast(`Approved ${target.name}! Faculty permissions now active.`);
  };

  const reject = (target) => {
    setUsers((prev) => prev.filter((u) => u.id !== target.id));
    toast(`Registration request for ${target.name} rejected.`, "warning");
  };

  return (
    <div>
      <div className="mb-7">
        <HeroTag>ADMINISTRATIVE CONTROL CENTER</HeroTag>
        <h1 className="text-[28px] font-extrabold text-main mt-1.5">
          Faculty Approvals & AI Integrity Audit
        </h1>
        <p className="text-muted text-sm max-w-[720px] mt-1">
          Verify professor registrations to authorize course section creation,
          and audit user feedback on AI heuristic detections.
        </p>
      </div>



      {/* Pending queue */}
      <div className={`${cardClass} !p-[26px] mb-8`}>
        <div className="flex justify-between items-center gap-3 mb-[18px]">
          <div>
            <h2 className="text-lg font-bold">
              Pending Professor Account Registrations
            </h2>
            <p className="text-[13px] text-muted">
              Newly registered professors must be approved before they can
              establish class sections or grade submissions.
            </p>
          </div>
          <span className={badge("pending")}>{pending.length} Pending</span>
        </div>

        {pending.length === 0 ? (
          <div className="text-center p-[30px] text-muted text-sm">
            ✓ All faculty registrations have been processed. No pending
            requests.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((prof) => (
              <div
                key={prof.id}
                className="flex justify-between items-center flex-wrap gap-3.5 bg-card-inner border border-line rounded-lg px-5 py-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={prof.avatar || FALLBACK_AVATAR}
                    alt={prof.name}
                    className="w-11 h-11 rounded-full border-2 border-amber object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-[15px] text-main">
                        {prof.name}
                      </strong>
                      <span className={badge("pending", "!text-[10px]")}>
                        Pending Verification
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {prof.email} • Requested: Professor Role
                    </div>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center text-xs font-semibold px-3.5 py-1.5 rounded-full bg-card border border-rose text-rose cursor-pointer hover:bg-rose/10"
                      onClick={() => reject(prof)}
                    >
                      Reject ✕
                    </button>
                    <button
                      type="button"
                      className={btn("primary", "!text-xs !px-4 !py-1.5")}
                      onClick={() => approve(prof)}
                    >
                      Approve Account ✓
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted">
                    Only the admin can decide.
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback audit */}
      <div className={`${cardClass} !p-[26px]`}>
        <div className="mb-[18px]">
          <h2 className="text-lg font-bold">
            User Feedback on Detection Accuracy
          </h2>
          <p className="text-[13px] text-muted">
            Submissions from students and professors reporting false positives,
            false negatives, and cadence ratings.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {feedback.length === 0 && (
            <p className="text-sm text-muted">
              No feedback has been submitted yet.
            </p>
          )}
          {feedback.map((fb) => (
            <div
              key={fb.id}
              className="bg-card-inner border border-line rounded-lg px-[18px] py-3.5"
            >
              <div className="flex justify-between items-center flex-wrap gap-2 mb-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <strong className="text-sm text-main">{fb.userName}</strong>
                  <span
                    className={badge(
                      fb.userRole === "professor" ? "ai" : "human",
                      "!text-[10px]",
                    )}
                  >
                    {fb.userRole}
                  </span>
                  <span className="text-xs text-muted">
                    Detected: {fb.detectedScore}% AI
                  </span>
                </div>
                <span
                  className={badge(
                    fb.accuracyRating === "highly_accurate"
                      ? "human"
                      : fb.accuracyRating === "partially_accurate"
                        ? "pending"
                        : "ai",
                    "!text-[10px]",
                  )}
                >
                  {fb.accuracyRating.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              <p className="text-[13px] text-muted mb-1">"{fb.comment}"</p>
              <div className="text-[11px] text-muted">
                Logged on {new Date(fb.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
};

/* =====================================================================
   SECTION 6: APP (holds all the data and decides which page to show)
   ===================================================================== */

function App() {
  const route = useRoute();

  const [theme, setTheme] = usePersistedState(STORAGE_KEYS.THEME, "dark");
  const [users, setUsers] = usePersistedState(
    STORAGE_KEYS.USERS,
    INITIAL_USERS,
  );
  const [classes, setClasses] = usePersistedState(
    STORAGE_KEYS.CLASSES,
    INITIAL_CLASSES,
  );
  const [activities, setActivities] = usePersistedState(
    STORAGE_KEYS.ACTIVITIES,
    INITIAL_ACTIVITIES,
  );
  const [materials, setMaterials] = usePersistedState(
    STORAGE_KEYS.MATERIALS,
    INITIAL_MATERIALS,
  );
  const [submissions, setSubmissions] = usePersistedState(
    STORAGE_KEYS.SUBMISSIONS,
    INITIAL_SUBMISSIONS,
  );
  const [feedback, setFeedback] = usePersistedState(
    STORAGE_KEYS.FEEDBACK,
    INITIAL_FEEDBACK,
  );
  const [toasts, setToasts] = useState([]);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore the session on page load and listen for sign in / sign out
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession) setAuthLoading(true);
        setSession(newSession);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load the profile row that belongs to the signed in user
  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Profile load error:", error);
          toast(`Profile error: ${error.message}`, "danger");
        } else if (!data) {
          console.error("No profile row for user", session.user.id);
          toast("No profile found for this account.", "danger");
        }
        setProfile(data);
        setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Same shape the rest of your app already expects
  const user = profile
    ? {
        ...profile,
        name: profile.full_name || profile.username || profile.email || "User",
        avatar: profile.avatar_url,
      }
    : null;
  const pendingCount = users.filter(
    (u) => u.role === "professor" && u.status === "pending",
  ).length;

  // Apply the theme to the whole page
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Scroll to the top when the page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name, route.param]);

  // Pages that need a signed in user
  const needsLogin = ["home", "settings", "admin", "class"].includes(
    route.name,
  );
  const blocked = needsLogin && !user && !authLoading;
  useEffect(() => {
    if (blocked) navigate("login");
  }, [blocked]);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    toast(`Switched to ${next === "dark" ? "Dark" : "Light"} Mode`);
  };

  const signIn = () => {};

  const switchUser = () => {
    toast(
      "Role switching is off. Sign in with another account instead.",
      "info",
    );
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    toast("Signed out successfully.", "info");
    navigate("login");
  };
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
  };

  const Page = PAGES[route.name] || HomePage;
  const isAuthPage = route.name === "login" || route.name === "signup";

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
            {blocked || authLoading ? null : <Page route={route} />}
          </main>
        )}

        <Toasts toasts={toasts} />
      </div>
    </AppContext.Provider>
  );
}

export default App;
