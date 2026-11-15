/**
 * TagaDetect - Application Data & State Management
 * Persistent with localStorage
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'tagadetect_current_user',
  THEME: 'tagadetect_theme',
  USERS: 'tagadetect_users',
  CLASSES: 'tagadetect_classes',
  ACTIVITIES: 'tagadetect_activities',
  SUBMISSIONS: 'tagadetect_submissions',
  MATERIALS: 'tagadetect_materials',
  FEEDBACK: 'tagadetect_ai_feedback',
  SETTINGS: 'tagadetect_settings'
};

// 4 Founders
const INITIAL_FOUNDERS = [
  {
    id: 'f1',
    name: 'Dr. Aris Thorne',
    role: 'Lead AI Architect & Co-Founder',
    bio: 'Pioneered early neural watermark detection and stylistic invariant analysis for educational software.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    contributions: ['Predictive Token Shuffling Engine', 'Perplexity Heuristics', 'Stylistic Cadence Models'],
    social: { linkedin: '#', github: '#', twitter: '#' }
  },
  {
    id: 'f2',
    name: 'Elena Rostova, Ph.D.',
    role: 'Head of Pedagogy & Co-Founder',
    bio: 'Curriculum architect and advocate for transparent, non-punitive academic integrity tools.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    contributions: ['Automated Review Pipeline', 'Context-Aware Rubric Engine', 'Student-Professor Dual View'],
    social: { linkedin: '#', github: '#', twitter: '#' }
  },
  {
    id: 'f3',
    name: 'Kaelen Vance',
    role: 'Chief Product Engineer & Co-Founder',
    bio: 'Systems specialist developing high-throughput web applications with secure cloud credentialing.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    contributions: ['High-Performance LMS Core', 'Google OAuth Integration Layer', 'Encrypted Activity Storage'],
    social: { linkedin: '#', github: '#', twitter: '#' }
  },
  {
    id: 'f4',
    name: 'Maya Lin-Patel',
    role: 'Head of Design & Ethics & Co-Founder',
    bio: 'Human-Centered UI/UX researcher creating intuitive academic tools that prioritize student empowerment.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    contributions: ['Dark Classroom Visual Aesthetic', 'Sentence-Level Highlight Visualization', 'User Feedback Audit Portal'],
    social: { linkedin: '#', github: '#', twitter: '#' }
  }
];

// Technical How-To's
const TECHNICAL_HOW_TOS = [
  {
    id: 'how-to-detection',
    category: 'AI Detection & Shuffle Engine',
    title: 'How TagaDetect Prediction & Heuristics Operate',
    steps: [
      {
        step: 1,
        title: 'Sentence Segmentation & Tokenization',
        detail: 'The submitted passage is split into discrete sentences and lexical tokens while preserving punctuation context.'
      },
      {
        step: 2,
        title: 'Heuristic & Shuffle Analysis',
        detail: 'The engine evaluates structural variance, sentence length distribution, and predictability metrics.'
      },
      {
        step: 3,
        title: 'Sentence-by-Sentence Classification',
        detail: 'Sentences are tagged into High AI (purple/red), Mixed/Hybrid (amber), and Human-Authentic (green).'
      },
      {
        step: 4,
        title: 'User Feedback Feedback Loop',
        detail: 'Users can submit direct feedback on any detection result to flag false positives or confirm accuracy.'
      }
    ]
  },
  {
    id: 'how-to-submission',
    category: 'Automated Student Submissions',
    title: 'How Text-Based Activity Submission & Automated Review Works',
    steps: [
      {
        step: 1,
        title: 'Drafting Activity in TagaDetect',
        detail: 'Students write or paste their text-based activity in the submission editor with live word counters.'
      },
      {
        step: 2,
        title: 'Instant Automated AI Review Generation',
        detail: 'Upon submission, TagaDetect automatically evaluates the activity and creates an automated AI review report.'
      },
      {
        step: 3,
        title: 'Shared Dual Visibility',
        detail: 'Both student and professor can inspect the exact same automated AI review breakdown.'
      },
      {
        step: 4,
        title: 'Professor Evaluation & Grading',
        detail: 'The professor reviews the submission alongside the automated AI report, assigns a grade, and adds feedback.'
      }
    ]
  },
  {
    id: 'how-to-professor',
    category: 'Professor & Admin Workflow',
    title: 'Professor Account Approval & Class Management',
    steps: [
      {
        step: 1,
        title: 'Professor Registration',
        detail: 'Professors sign up with their institutional email. Their account is placed in the "Pending Approval" queue.'
      },
      {
        step: 2,
        title: 'Admin Verification & Approval',
        detail: 'The Administrator reviews faculty credentials and approves the account in one click.'
      },
      {
        step: 3,
        title: 'Class Creation & Unique Code',
        detail: 'Professors create subjects and sections. Only students can join using the generated code.'
      },
      {
        step: 4,
        title: 'Publishing Activities & Rubrics',
        detail: 'Professors set activity titles, instructions, deadlines, points, and class materials.'
      }
    ]
  }
];

// FAQs
const FAQS = [
  {
    id: 'faq-1',
    category: 'AI Detection',
    question: 'How does the AI Detector work in this version?',
    answer: 'The system uses a shuffle-based prediction engine calibrated with statistical metrics (perplexity, burstiness, and sentence categorization) that simulates the upcoming custom Machine Learning model.'
  },
  {
    id: 'faq-2',
    category: 'AI Detection',
    question: 'How do I give feedback on the AI Detector results?',
    answer: 'Whenever you run an analysis on the AI Detector page, a "Feedback" button is available. You can rate its accuracy, report false positives or false negatives, and leave specific comments.'
  },
  {
    id: 'faq-3',
    category: 'Activities & Submissions',
    question: 'Who can see the automated AI review on submitted activities?',
    answer: 'Both the student who submitted the activity and the professor handling the class can see the automated AI review report.'
  },
  {
    id: 'faq-4',
    category: 'Classes & Roles',
    question: 'Who can join and who can create classes?',
    answer: 'Only students can join classes using a 6-character class code. Only professors can create classes, post materials, publish activities, and grade submissions.'
  },
  {
    id: 'faq-5',
    category: 'Professor Accounts',
    question: 'Why does a newly registered Professor account need Admin approval?',
    answer: 'To ensure campus security and verify faculty authenticity, professors require one-time approval by an Administrator before class creation and grading are unlocked.'
  },
  {
    id: 'faq-6',
    category: 'Google Authentication',
    question: 'Can I log in using my Google Account?',
    answer: 'Yes! Click "Continue with Google" on the Login or Signup page to authenticate seamlessly.'
  }
];

// Seed Users
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
    joinedDate: '2026-09-01'
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
    joinedDate: '2026-09-15'
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
    joinedDate: '2026-09-10'
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
    joinedDate: '2026-09-12'
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
    joinedDate: '2026-01-10'
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
    joinedDate: '2026-02-15'
  },
  {
    id: 'usr_prof_3',
    name: 'Prof. Sofia Al-Mansoor',
    username: 'prof_sofia',
    email: 'sofia.mansoor@faculty.tagadetect.edu',
    password: 'password123',
    role: 'professor',
    status: 'pending', // Pending Admin approval!
    avatar: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
    university: 'Polytechnic State University',
    department: 'Information Assurance & Security',
    bio: 'Lecturer in Information Assurance, Security Audits, and Cyberethics awaiting administrative clearance.',
    joinedDate: '2026-11-12'
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
    joinedDate: '2025-08-01'
  }
];

// Seed Classes
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
    studentIds: ['usr_student_1', 'usr_student_2', 'usr_student_3', 'usr_student_4']
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
    studentIds: ['usr_student_1', 'usr_student_3']
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
    studentIds: ['usr_student_1', 'usr_student_2', 'usr_student_4']
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
    studentIds: ['usr_student_1', 'usr_student_2', 'usr_student_3']
  }
];

// Seed Activities
const INITIAL_ACTIVITIES = [
  {
    id: 'act_1',
    classId: 'cls_1',
    title: 'Activity 1: Deterministic vs Non-Deterministic Finite Automata',
    description: 'Write an analytical essay comparing DFA and NFA computational state space and language equivalence. Contrast subset construction algorithms with direct minimization techniques.',
    dueDate: '2026-11-20',
    maxPoints: 100,
    rubric: 'Conceptual Rigor (40 pts), Formal Proof Clarity (30 pts), Original Analysis (30 pts)',
    createdAt: '2026-11-01'
  },
  {
    id: 'act_2',
    classId: 'cls_1',
    title: 'Activity 2: Chomsky Hierarchy & Context-Free Grammars',
    description: 'Critique the computational boundaries between regular grammars and context-free grammars with respect to modern compiler syntax trees.',
    dueDate: '2026-11-26',
    maxPoints: 50,
    rubric: 'Syntactic parsing accuracy (25 pts), Practical compiler examples (25 pts)',
    createdAt: '2026-11-05'
  },
  {
    id: 'act_3',
    classId: 'cls_4',
    title: 'Research Analysis: TCP Congestion Control Algorithms',
    description: 'Compare BBR, Reno, and Cubic congestion control algorithms across high-latency satellite and fiber networks.',
    dueDate: '2026-11-24',
    maxPoints: 100,
    rubric: 'Protocol analysis (50 pts), Performance benchmarks (50 pts)',
    createdAt: '2026-11-08'
  }
];

// Seed Class Materials (visualized inside each class's dedicated page)
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
    downloadUrl: '#'
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
    downloadUrl: '#'
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
    downloadUrl: '#'
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
    downloadUrl: '#'
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
    downloadUrl: '#'
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
    downloadUrl: '#'
  }
];

// Seed Submissions with Automated AI Reviews
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
        { text: 'In conclusion, while NFAs provide vastly simpler human conceptualizations for complex regular expressions, physical hardware executes equivalent DFAs to preserve deterministic clock cycles.', score: 88, label: 'ai' }
      ]
    },
    grade: 90,
    gradedAt: '2026-11-12T16:10:00Z',
    gradedBy: 'Kristine Kaye Arida',
    professorFeedback: 'Excellent explanation of powerset construction. Note the automated AI phrasing score; in the next assignment, elaborate with your own hand-drawn state transition diagrams.'
  },
  {
    id: 'sub_2',
    activityId: 'act_1',
    studentId: 'usr_student_2',
    studentName: 'Chloe Chen',
    studentEmail: 'chloe.chen@student.tagadetect.edu',
    submittedAt: '2026-11-11T09:15:00Z',
    content: `I spent Thursday night drawing transition tables on my whiteboard until my dry erase marker dried up! What really clicked for me was thinking about an NFA as a timeline splitter—like in sci-fi movies where every time a branching path opens, the universe duplicates itself to test every possibility at once.\n\nA DFA doesn't have that luxury. It has to make up its mind on the spot. That’s why powerset construction feels like compiling all those branching multiverse timelines into one giant, hyper-organized map before you even start reading the input. It might blow up exponentially in worst-case state space, but once built, lookup is blazing fast!`,
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
        { text: 'What really clicked for me was thinking about an NFA as a timeline splitter—like in sci-fi movies where every time a branching path opens, the universe duplicates itself to test every possibility at once.', score: 8, label: 'human' },
        { text: 'A DFA doesn\'t have that luxury.', score: 6, label: 'human' },
        { text: 'It has to make up its mind on the spot.', score: 10, label: 'human' },
        { text: 'That’s why powerset construction feels like compiling all those branching multiverse timelines into one giant, hyper-organized map before you even start reading the input.', score: 12, label: 'human' },
        { text: 'It might blow up exponentially in worst-case state space, but once built, lookup is blazing fast!', score: 7, label: 'human' }
      ]
    },
    grade: 99,
    gradedAt: '2026-11-12T16:25:00Z',
    gradedBy: 'Kristine Kaye Arida',
    professorFeedback: 'Outstanding intuition and analogy, Chloe! The timeline splitter metaphor is phenomenal.'
  }
];

// Seed AI Detector Feedback
const INITIAL_AI_FEEDBACK = [
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
    status: 'Reviewed'
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
    comment: 'Very accurate detection for Chloe Chen’s paper. Correctly identified human burstiness and distinctive metaphorical phrasing.',
    status: 'Confirmed'
  }
];

// State Store Manager
class TagaStore {
  static get(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  }

  static init() {
    if (!localStorage.getItem('tagadetect_v3_synced')) {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
      this.set(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
      this.set(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      this.set(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
      this.set(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
      this.set(STORAGE_KEYS.FEEDBACK, INITIAL_AI_FEEDBACK);
      this.set(STORAGE_KEYS.THEME, 'dark');
      this.set(STORAGE_KEYS.SETTINGS, {
        sensitivity: 'balanced',
        shuffleMode: 'realistic_shuffled',
        emailAlerts: true,
        autoScanSubmissions: true
      });
      this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
      localStorage.setItem('tagadetect_v3_synced', 'true');
    }
  }

  static resetToDefault() {
    localStorage.clear();
    this.init();
    window.location.reload();
  }
}

// Initialize store immediately
TagaStore.init();
