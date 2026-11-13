import { evaluateAssessmentSubmission } from '../utils/mastery';
import type {
  Announcement,
  AppNotification,
  Assessment,
  AssessmentSubmission,
  AttendanceSession,
  ChatMessage,
  Classroom,
  ClassroomActivity,
  Conversation,
  CurriculumTopicProgress,
  MaterialEngagement,
  PersistedLessonPlan,
  QuestionBankItem,
  RevisionTaskProgress,
  StudentStudyNote,
  StudyMaterial,
  TutorDoubtEntry,
  UserProfile,
} from '../types/learnsense';

export const DEMO_TEACHER: UserProfile = {
  uid: 'demo_teacher_kavitha',
  email: 'kavitha.rao@learnsense.edu',
  name: 'Dr. Kavitha Rao',
  role: 'teacher',
  preferredLanguage: 'en',
  createdAt: '2026-10-01T08:00:00Z',
  isDemo: true,
};

export const DEMO_STUDENT: UserProfile = {
  uid: 'demo_stu_aarav',
  email: 'aarav.k@learnsense.edu',
  name: 'Aarav Kulkarni',
  role: 'student',
  preferredLanguage: 'en',
  createdAt: '2026-10-02T08:00:00Z',
  isDemo: true,
};

export const DEMO_ADMIN: UserProfile = {
  uid: 'demo_admin_dean',
  email: 'raghavendra.bhat@learnsense.edu',
  name: 'Prof. Raghavendra Bhat',
  role: 'admin',
  preferredLanguage: 'en',
  createdAt: '2026-09-15T08:00:00Z',
  isDemo: true,
};

export interface LearnSenseWorkspaceState {
  classrooms: Classroom[];
  materials: StudyMaterial[];
  assessments: Assessment[];
  submissions: AssessmentSubmission[];
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  announcements: Announcement[];
  notifications: AppNotification[];
  attendanceSessions: AttendanceSession[];
  lessonPlans: PersistedLessonPlan[];
  tutorDoubts: TutorDoubtEntry[];
  revisionTasks: RevisionTaskProgress[];
  materialEngagements: MaterialEngagement[];
  classroomActivities: ClassroomActivity[];
  questionBank: QuestionBankItem[];
  studentNotes: StudentStudyNote[];
  curriculumProgress: CurriculumTopicProgress[];
}

export function createInitialDemoWorkspace(): LearnSenseWorkspaceState {
  // Sample Data roster used strictly for end-to-end demonstration (never real university records).
  const classrooms: Classroom[] = [
    {
      id: 'cls_cs304_dbms',
      name: 'Database Management Systems',
      subject: 'Computer Science & Engineering',
      gradeLevel: 'B.Tech CSE · Sem V',
      courseCode: 'CS-304',
      semester: 'Semester V · Fall 2026',
      credits: 4,
      joinCode: 'DBMS304',
      teacherUid: DEMO_TEACHER.uid,
      teacherName: DEMO_TEACHER.name,
      studentUids: ['demo_stu_aarav', 'demo_stu_meera', 'demo_stu_rohan', 'demo_stu_ananya'],
      students: [
        { uid: 'demo_stu_aarav', name: 'Aarav Kulkarni', email: 'aarav.k@learnsense.edu', rollNumber: 'CS24-01' },
        { uid: 'demo_stu_meera', name: 'Meera Nair', email: 'meera.n@learnsense.edu', rollNumber: 'CS24-02' },
        { uid: 'demo_stu_rohan', name: 'Rohan Shetty', email: 'rohan.s@learnsense.edu', rollNumber: 'CS24-03' },
        { uid: 'demo_stu_ananya', name: 'Ananya Gowda', email: 'ananya.g@learnsense.edu', rollNumber: 'CS24-04' },
      ],
      createdAt: '2026-10-03T09:00:00Z',
    },
    {
      id: 'cls_grade9_science',
      name: 'Applied Physics & Cell Biology',
      subject: 'Natural Sciences',
      gradeLevel: 'Foundation · Sem I',
      courseCode: 'SCI-101',
      semester: 'Semester I · Fall 2026',
      credits: 3,
      joinCode: 'SCI9A',
      teacherUid: DEMO_TEACHER.uid,
      teacherName: DEMO_TEACHER.name,
      studentUids: ['demo_stu_aarav', 'demo_stu_meera', 'demo_stu_rohan', 'demo_stu_ananya'],
      students: [
        { uid: 'demo_stu_aarav', name: 'Aarav Kulkarni', email: 'aarav.k@learnsense.edu', rollNumber: '9A-01' },
        { uid: 'demo_stu_meera', name: 'Meera Nair', email: 'meera.n@learnsense.edu', rollNumber: '9A-02' },
        { uid: 'demo_stu_rohan', name: 'Rohan Shetty', email: 'rohan.s@learnsense.edu', rollNumber: '9A-03' },
        { uid: 'demo_stu_ananya', name: 'Ananya Gowda', email: 'ananya.g@learnsense.edu', rollNumber: '9A-04' },
      ],
      createdAt: '2026-10-05T09:00:00Z',
    },
    {
      id: 'cls_grade10_math',
      name: 'Discrete Mathematics & Algebra',
      subject: 'Mathematics',
      gradeLevel: 'B.Tech CSE · Sem III',
      courseCode: 'MA-201',
      semester: 'Semester III · Fall 2026',
      credits: 3,
      joinCode: 'ALG10',
      teacherUid: DEMO_TEACHER.uid,
      teacherName: DEMO_TEACHER.name,
      studentUids: ['demo_stu_aarav', 'demo_stu_meera'],
      students: [
        { uid: 'demo_stu_aarav', name: 'Aarav Kulkarni', email: 'aarav.k@learnsense.edu', rollNumber: '10-01' },
        { uid: 'demo_stu_meera', name: 'Meera Nair', email: 'meera.n@learnsense.edu', rollNumber: '10-02' },
      ],
      createdAt: '2026-10-12T09:00:00Z',
    },
  ];

  const materials: StudyMaterial[] = [
    {
      id: 'mat_dbms_u1_u2',
      classroomId: 'cls_cs304_dbms',
      teacherUid: DEMO_TEACHER.uid,
      title: 'DBMS Units 1–2: ER Modeling, Keys, SQL & Relational Algebra',
      fileName: 'cs304_units_1_2_notes.txt',
      extractedText: `1. Three-Schema Architecture & ER Model
The ANSI/SPARC architecture separates External Views, Conceptual Schema, and Internal Storage for logical and physical data independence. M:N relationships map to associative tables with composite foreign keys.

2. Relational Keys & Referential Integrity
Candidate keys are minimal super keys. Entity integrity forbids NULL primary keys; referential integrity requires foreign keys to match parent primary keys or be NULL.

3. SQL Subsets & Joins
DDL (CREATE, ALTER, TRUNCATE), DML (SELECT, INSERT, UPDATE, DELETE), DCL (GRANT, REVOKE), TCL (COMMIT, ROLLBACK, SAVEPOINT). LEFT OUTER JOIN retains unmatched left rows; WHERE filters before GROUP BY while HAVING filters groups.

4. Relational Algebra
Selection (σ) filters rows, Projection (π) chooses columns, Natural Join (⋈) merges shared attributes, and Division (÷) solves universal quantification queries.`,
      extractionSource: 'local_pdf_parser',
      topics: [
        {
          id: 'concept_dbms_er_keys',
          title: 'ER Model & Keys',
          description: 'Entity-relationship cardinality mapping, candidate keys, and referential integrity.',
          subtopics: [
            {
              id: 'sub_dbms_three_schema',
              title: 'Three-Schema Data Independence',
              summary: 'Separating external views, conceptual tables, and internal B+-Tree storage.',
            },
          ],
        },
        {
          id: 'concept_dbms_sql_algebra',
          title: 'SQL Joins & Relational Algebra',
          description: 'DDL/DML/DCL/TCL commands, OUTER joins, HAVING filters, and σ/π/⋈/÷ operators.',
          subtopics: [
            {
              id: 'sub_dbms_subqueries',
              title: 'Correlated Subqueries & EXISTS',
              summary: 'Checking existence safely even when nullable columns are present.',
            },
          ],
        },
      ],
      createdAt: '2026-10-28T09:30:00Z',
    },
    {
      id: 'mat_dbms_u3_u4',
      classroomId: 'cls_cs304_dbms',
      teacherUid: DEMO_TEACHER.uid,
      title: 'DBMS Units 3–4: BCNF Normalization, ACID, 2PL & Indexing',
      fileName: 'cs304_units_3_4_notes.txt',
      extractedText: `1. Functional Dependencies & Normalization (1NF–BCNF)
Attribute closure X+ identifies candidate keys. 2NF eliminates partial dependencies; 3NF eliminates transitive dependencies of non-prime attributes; BCNF mandates that every non-trivial FD X -> Y has a Super Key on the left-hand side. Decomposition must be Lossless-Join.

2. Transactions, ACID & Strict 2PL Locking
Atomicity, Consistency, Isolation, and Durability protect multi-user updates. Precedence graphs verify conflict serializability. Strict Two-Phase Locking holds exclusive (X) locks until COMMIT to prevent cascading aborts.

3. Deadlocks, ARIES Recovery & B+-Trees
Wait-Die and Wound-Wait use transaction timestamps to prevent deadlocks. Write-Ahead Logging (WAL) flushes log records before dirty pages during Analysis, REDO, and UNDO. B+-Trees link leaf pages sequentially for O(log N) range scans.`,
      extractionSource: 'local_pdf_parser',
      topics: [
        {
          id: 'concept_dbms_normalization',
          title: 'Normalization & BCNF',
          description: 'Closure X+, 1NF/2NF/3NF/BCNF rules, and lossless-join decomposition.',
          subtopics: [],
        },
        {
          id: 'concept_dbms_transactions',
          title: 'ACID, 2PL & Recovery',
          description: 'Conflict serializability, Strict 2PL, deadlock prevention, and WAL/ARIES recovery.',
          subtopics: [],
        },
      ],
      createdAt: '2026-11-02T11:00:00Z',
    },
    {
      id: 'mat_newton_laws',
      classroomId: 'cls_grade9_science',
      teacherUid: DEMO_TEACHER.uid,
      title: "Unit 2: Newton's Laws of Motion & Momentum",
      fileName: 'unit2_newtons_laws_motion.txt',
      extractedText: `1. Newton's First Law (Inertia)
An object remains at rest or in uniform straight-line motion unless acted upon by an unbalanced external force. Inertia depends directly on the mass of the object.

2. Newton's Second Law (Force, Mass & Acceleration)
The rate of change of momentum is proportional to the applied unbalanced force: F = m * a. One Newton is the force required to accelerate a 1 kg mass at 1 m/s^2.

3. Conservation of Linear Momentum
When no external net force acts on a closed system of colliding bodies, total linear momentum before collision equals total momentum after collision (m1*u1 + m2*u2 = m1*v1 + m2*v2).`,
      extractionSource: 'local_pdf_parser',
      topics: [
        {
          id: 'concept_inertia',
          title: 'Inertia & First Law',
          description: 'Resistance of a body to changes in its state of rest or uniform motion.',
          subtopics: [
            {
              id: 'sub_mass_inertia',
              title: 'Mass as a Measure of Inertia',
              summary: 'Heavier objects require larger forces to change velocity.',
            },
          ],
        },
        {
          id: 'concept_fma',
          title: 'Force, Mass & Acceleration',
          description: 'Quantitative relationship F = m * a and SI unit Newton.',
          subtopics: [
            {
              id: 'sub_net_force',
              title: 'Unbalanced Net Force',
              summary: 'Acceleration occurs in the direction of the net resultant force.',
            },
          ],
        },
        {
          id: 'concept_momentum',
          title: 'Conservation of Momentum',
          description: 'Total system momentum stays constant when external net force is zero.',
          subtopics: [
            {
              id: 'sub_recoil',
              title: 'Collision & Recoil Velocity',
              summary: 'Equal and opposite impulse impulses during short interactions.',
            },
          ],
        },
      ],
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'mat_cell_respiration',
      classroomId: 'cls_grade9_science',
      teacherUid: DEMO_TEACHER.uid,
      title: 'Chapter 4: Photosynthesis & Cellular Transport',
      fileName: 'ch4_photosynthesis_transport.txt',
      extractedText: `1. Chloroplast Light Reactions
Chlorophyll absorbs light energy in thylakoid membranes to split water molecules, releasing oxygen and generating ATP and NADPH.

2. Osmosis & Membrane Transport
Water moves across a selectively permeable membrane from a region of higher water potential (hypotonic) to lower water potential (hypertonic).`,
      extractionSource: 'local_pdf_parser',
      topics: [
        {
          id: 'concept_chloroplast',
          title: 'Chloroplast Light Reactions',
          description: 'Photolysis of water and ATP synthesis inside thylakoid membranes.',
          subtopics: [],
        },
        {
          id: 'concept_osmosis',
          title: 'Osmosis & Water Potential',
          description: 'Passive movement of water across semi-permeable membranes.',
          subtopics: [],
        },
      ],
      createdAt: '2026-11-04T10:30:00Z',
    },
  ];

  const assessments: Assessment[] = [
    {
      id: 'assess_dbms_midterm',
      classroomId: 'cls_cs304_dbms',
      teacherUid: DEMO_TEACHER.uid,
      title: 'CS-304 Diagnostic: ER Model, SQL & Relational Algebra',
      description: 'Timed diagnostic assessment across DBMS Units 1 & 2 (retakes enabled for mastery tracking).',
      status: 'published',
      dueDate: '2026-11-24',
      durationMinutes: 25,
      allowRetakes: true,
      createdAt: '2026-11-01T09:00:00Z',
      questions: [
        {
          id: 'q_dbms_er_1',
          prompt: 'Which level of the ANSI/SPARC three-schema architecture isolates physical B+-Tree storage changes from SQL application queries?',
          type: 'mcq',
          options: [
            'Physical Data Independence (Conceptual-Internal mapping)',
            'External View Redundancy',
            'Hierarchical Pointer Chaining',
            'Unnormalized Flat Storage',
          ],
          correctAnswer: 'Physical Data Independence (Conceptual-Internal mapping)',
          explanation: 'Changing internal file/index organization without rewriting conceptual schemas or queries is physical data independence.',
          conceptId: 'concept_dbms_er_keys',
          conceptName: 'ER Model & Keys',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_dbms_keys_1',
          prompt: 'What is the minimal Super Key of a relation that uniquely identifies every tuple called?',
          type: 'short_answer',
          correctAnswer: 'Candidate Key',
          explanation: 'A Candidate Key is a minimal Super Key with no redundant attributes.',
          conceptId: 'concept_dbms_er_keys',
          conceptName: 'ER Model & Keys',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_dbms_sql_1',
          prompt: 'Which SQL clause filters aggregated groups AFTER GROUP BY has been evaluated?',
          type: 'mcq',
          options: ['HAVING', 'WHERE', 'DISTINCT', 'ORDER BY'],
          correctAnswer: 'HAVING',
          explanation: 'WHERE filters individual rows prior to grouping, whereas HAVING filters groups post-aggregation.',
          conceptId: 'concept_dbms_sql_algebra',
          conceptName: 'SQL Joins & Relational Algebra',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_dbms_alg_1',
          prompt: 'Which Relational Algebra operator finds tuples in relation R that are paired with ALL tuples in relation S?',
          type: 'mcq',
          options: ['Division (÷)', 'Projection (π)', 'Selection (σ)', 'Set Difference (−)'],
          correctAnswer: 'Division (÷)',
          explanation: 'Relational Division (R ÷ S) expresses universal quantification ("for all tuples in S").',
          conceptId: 'concept_dbms_sql_algebra',
          conceptName: 'SQL Joins & Relational Algebra',
          points: 2,
          source: 'gemini_ai',
          approvalStatus: 'approved',
        },
      ],
    },
    {
      id: 'assess_dbms_norm_tx',
      classroomId: 'cls_cs304_dbms',
      teacherUid: DEMO_TEACHER.uid,
      title: 'CS-304 Timed Exam: BCNF Normalization, ACID & Locking',
      description: 'Timed unit examination on Functional Dependencies, 3NF/BCNF decomposition, Strict 2PL, and ARIES WAL recovery.',
      status: 'published',
      dueDate: '2026-11-28',
      durationMinutes: 20,
      allowRetakes: true,
      createdAt: '2026-11-05T10:00:00Z',
      questions: [
        {
          id: 'q_dbms_bcnf_1',
          prompt: 'For every non-trivial functional dependency X → Y in a BCNF relation, what must X be?',
          type: 'mcq',
          options: [
            'A Super Key',
            'A Foreign Key',
            'A Prime Attribute only',
            'A Multivalued Attribute',
          ],
          correctAnswer: 'A Super Key',
          explanation: 'BCNF strictly requires the determinant X of every non-trivial FD X → Y to be a Super Key.',
          conceptId: 'concept_dbms_normalization',
          conceptName: 'Normalization & BCNF',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_dbms_lossless_1',
          prompt: 'Which mathematical condition guarantees that decomposing R into R1 and R2 is a Lossless-Join decomposition?',
          type: 'mcq',
          options: [
            '(R1 ∩ R2) → R1 or (R1 ∩ R2) → R2 in F+',
            'R1 ∩ R2 is empty',
            'R1 and R2 have equal cardinality',
            'Only prime attributes appear in R1',
          ],
          correctAnswer: '(R1 ∩ R2) → R1 or (R1 ∩ R2) → R2 in F+',
          explanation: 'The common attributes (R1 ∩ R2) must form a superkey of at least one decomposed relation.',
          conceptId: 'concept_dbms_normalization',
          conceptName: 'Normalization & BCNF',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_dbms_tx_1',
          prompt: 'How does Strict Two-Phase Locking (Strict 2PL) prevent cascading aborts?',
          type: 'mcq',
          options: [
            'By holding all Exclusive (X) locks until the transaction commits or aborts',
            'By releasing locks immediately after each write',
            'By disabling Write-Ahead Logging',
            'By allowing dirty reads across transactions',
          ],
          correctAnswer: 'By holding all Exclusive (X) locks until the transaction commits or aborts',
          explanation: 'Because no other transaction can read uncommitted writes until commit, cascading rollbacks cannot occur.',
          conceptId: 'concept_dbms_transactions',
          conceptName: 'ACID, 2PL & Recovery',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_dbms_wal_1',
          prompt: 'What does WAL stand for in database crash recovery?',
          type: 'short_answer',
          correctAnswer: 'Write-Ahead Logging',
          explanation: 'Write-Ahead Logging forces log records to stable storage before flushing modified buffer pages.',
          conceptId: 'concept_dbms_transactions',
          conceptName: 'ACID, 2PL & Recovery',
          points: 2,
          source: 'sarvam_ai',
          approvalStatus: 'approved',
        },
        {
          id: 'q_dbms_draft_pending',
          prompt: 'Which timestamp protocol aborts a younger transaction requesting an item held by an older transaction?',
          type: 'mcq',
          options: ['Wait-Die', 'Wound-Wait', 'Strict 2PL', 'B+-Tree Split'],
          correctAnswer: 'Wait-Die',
          explanation: 'In Wait-Die, older waits for younger while younger dies (aborts) if requesting from older.',
          conceptId: 'concept_dbms_transactions',
          conceptName: 'ACID, 2PL & Recovery',
          points: 2,
          source: 'gemini_ai',
          approvalStatus: 'pending_review',
        },
      ],
    },
    {
      id: 'assess_motion_diag',
      classroomId: 'cls_grade9_science',
      teacherUid: DEMO_TEACHER.uid,
      title: 'Diagnostic Check: Laws of Motion',
      description: 'Concept-mapped checkpoint covering Inertia, F = ma, and Momentum Conservation.',
      status: 'published',
      dueDate: '2026-11-18',
      durationMinutes: 20,
      allowRetakes: true,
      createdAt: '2026-11-06T09:00:00Z',
      questions: [
        {
          id: 'q_inertia_1',
          prompt: 'When a moving bus stops abruptly, standing passengers lean forward primarily due to:',
          type: 'mcq',
          options: [
            'Inertia of motion',
            'Gravitational pull',
            'Air resistance',
            'Centripetal acceleration',
          ],
          correctAnswer: 'Inertia of motion',
          explanation: 'The upper body tends to maintain its forward velocity while the feet stop with the bus floor.',
          conceptId: 'concept_inertia',
          conceptName: 'Inertia & First Law',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_fma_1',
          prompt: 'A 5 kg cart accelerates at 4 m/s^2. Calculate the net unbalanced force acting on it (in N).',
          type: 'short_answer',
          correctAnswer: '20',
          explanation: 'Using Newton Second Law, F = m * a = 5 kg * 4 m/s^2 = 20 N.',
          conceptId: 'concept_fma',
          conceptName: 'Force, Mass & Acceleration',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_fma_2',
          prompt: 'If the net force on an object is doubled while its mass stays constant, its acceleration:',
          type: 'mcq',
          options: ['Doubles', 'Halves', 'Remains unchanged', 'Quadruples'],
          correctAnswer: 'Doubles',
          explanation: 'Acceleration is directly proportional to net force for a fixed mass (a = F/m).',
          conceptId: 'concept_fma',
          conceptName: 'Force, Mass & Acceleration',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_mom_1',
          prompt: 'In an isolated collision with zero external force, total momentum after impact is:',
          type: 'mcq',
          options: [
            'Equal to total momentum before impact',
            'Always zero',
            'Greater than initial momentum',
            'Converted entirely to mass',
          ],
          correctAnswer: 'Equal to total momentum before impact',
          explanation: 'By conservation of linear momentum, total momentum of an isolated system remains constant.',
          conceptId: 'concept_momentum',
          conceptName: 'Conservation of Momentum',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_mom_2',
          prompt: 'A 2 kg ball moving at 3 m/s collides and sticks to a stationary 1 kg ball. What is total momentum (in kg·m/s)?',
          type: 'short_answer',
          correctAnswer: '6',
          explanation: 'Initial momentum = 2 * 3 + 1 * 0 = 6 kg·m/s, which is conserved after collision.',
          conceptId: 'concept_momentum',
          conceptName: 'Conservation of Momentum',
          points: 2,
          source: 'sarvam_ai',
          approvalStatus: 'approved',
        },
      ],
    },
    {
      id: 'assess_bio_upcoming',
      classroomId: 'cls_grade9_science',
      teacherUid: DEMO_TEACHER.uid,
      title: 'Cell Transport & Photosynthesis Quiz',
      description: 'Short diagnostic check on thylakoid light reactions and osmosis gradients.',
      status: 'published',
      dueDate: '2026-11-22',
      durationMinutes: 15,
      createdAt: '2026-11-09T11:00:00Z',
      questions: [
        {
          id: 'q_chloro_1',
          prompt: 'Which gas is released during the light-dependent splitting of water in chloroplasts?',
          type: 'mcq',
          options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Methane'],
          correctAnswer: 'Oxygen',
          explanation: 'Photolysis of H2O in thylakoid membranes releases O2 gas.',
          conceptId: 'concept_chloroplast',
          conceptName: 'Chloroplast Light Reactions',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
        {
          id: 'q_osmosis_1',
          prompt: 'When a plant cell is placed in a hypertonic salt solution, water moves:',
          type: 'mcq',
          options: [
            'Out of the cell toward lower water potential',
            'Into the cell rapidly',
            'Equally in both directions with no net flow',
            'Only into the nucleus',
          ],
          correctAnswer: 'Out of the cell toward lower water potential',
          explanation: 'Water diffuses down its water potential gradient out into the hypertonic surroundings.',
          conceptId: 'concept_osmosis',
          conceptName: 'Osmosis & Water Potential',
          points: 2,
          source: 'manual',
          approvalStatus: 'approved',
        },
      ],
    },
  ];

  // Sample Data submissions evaluated deterministically from actual answers (never invented).
  const dbmsMidterm = assessments[0];
  const motionAssess = assessments[2];
  const submissions: AssessmentSubmission[] = [
    {
      ...evaluateAssessmentSubmission(
        dbmsMidterm,
        'demo_stu_aarav',
        'Aarav Kulkarni',
        {
          q_dbms_er_1: 'Physical Data Independence (Conceptual-Internal mapping)',
          q_dbms_keys_1: 'Candidate Key',
          q_dbms_sql_1: 'WHERE',
          q_dbms_alg_1: 'Projection (π)',
        },
        '2026-11-03T10:15:00Z'
      ),
      id: 'sub_dbms_mid_aarav_1',
      attemptNumber: 1,
      evaluationStatus: 'evaluated',
      elapsedSeconds: 512,
      timedOut: false,
    },
    {
      ...evaluateAssessmentSubmission(
        dbmsMidterm,
        'demo_stu_aarav',
        'Aarav Kulkarni',
        {
          q_dbms_er_1: 'Physical Data Independence (Conceptual-Internal mapping)',
          q_dbms_keys_1: 'Candidate Key',
          q_dbms_sql_1: 'HAVING',
          q_dbms_alg_1: 'Projection (π)',
        },
        '2026-11-06T16:40:00Z'
      ),
      id: 'sub_dbms_mid_aarav_2',
      attemptNumber: 2,
      evaluationStatus: 'evaluated',
      elapsedSeconds: 420,
      timedOut: false,
    },
    {
      ...evaluateAssessmentSubmission(
        dbmsMidterm,
        'demo_stu_meera',
        'Meera Nair',
        {
          q_dbms_er_1: 'Physical Data Independence (Conceptual-Internal mapping)',
          q_dbms_keys_1: 'Candidate Key',
          q_dbms_sql_1: 'HAVING',
          q_dbms_alg_1: 'Division (÷)',
        },
        '2026-11-04T11:20:00Z'
      ),
      id: 'sub_dbms_mid_meera_1',
      attemptNumber: 1,
      evaluationStatus: 'evaluated',
      elapsedSeconds: 380,
      timedOut: false,
    },
    {
      ...evaluateAssessmentSubmission(
        dbmsMidterm,
        'demo_stu_rohan',
        'Rohan Shetty',
        {
          q_dbms_er_1: 'External View Redundancy',
          q_dbms_keys_1: 'Super Key',
          q_dbms_sql_1: 'WHERE',
          q_dbms_alg_1: 'Selection (σ)',
        },
        '2026-11-04T14:10:00Z'
      ),
      id: 'sub_dbms_mid_rohan_1',
      attemptNumber: 1,
      evaluationStatus: 'evaluated',
      elapsedSeconds: 615,
      timedOut: false,
    },
    {
      ...evaluateAssessmentSubmission(
        motionAssess,
        'demo_stu_aarav',
        'Aarav Kulkarni',
        {
          q_inertia_1: 'Inertia of motion',
          q_fma_1: '20',
          q_fma_2: 'Doubles',
          q_mom_1: 'Always zero',
          q_mom_2: '3',
        },
        '2026-11-08T14:20:00Z'
      ),
      id: 'sub_motion_aarav_1',
      attemptNumber: 1,
      evaluationStatus: 'evaluated',
      elapsedSeconds: 485,
      timedOut: false,
    },
    {
      ...evaluateAssessmentSubmission(
        motionAssess,
        'demo_stu_meera',
        'Meera Nair',
        {
          q_inertia_1: 'Inertia of motion',
          q_fma_1: '20',
          q_fma_2: 'Doubles',
          q_mom_1: 'Equal to total momentum before impact',
          q_mom_2: '6',
        },
        '2026-11-08T15:10:00Z'
      ),
      id: 'sub_motion_meera_1',
      attemptNumber: 1,
      evaluationStatus: 'evaluated',
      elapsedSeconds: 410,
      timedOut: false,
    },
    {
      ...evaluateAssessmentSubmission(
        motionAssess,
        'demo_stu_rohan',
        'Rohan Shetty',
        {
          q_inertia_1: 'Inertia of motion',
          q_fma_1: '9',
          q_fma_2: 'Halves',
          q_mom_1: 'Always zero',
          q_mom_2: '2',
        },
        '2026-11-08T16:05:00Z'
      ),
      id: 'sub_motion_rohan_1',
      attemptNumber: 1,
      evaluationStatus: 'evaluated',
      elapsedSeconds: 690,
      timedOut: false,
    },
    {
      ...evaluateAssessmentSubmission(
        motionAssess,
        'demo_stu_ananya',
        'Ananya Gowda',
        {
          q_inertia_1: 'Inertia of motion',
          q_fma_1: '20',
          q_fma_2: 'Doubles',
          q_mom_1: 'Equal to total momentum before impact',
          q_mom_2: '4',
        },
        '2026-11-08T17:45:00Z'
      ),
      id: 'sub_motion_ananya_1',
      attemptNumber: 1,
      evaluationStatus: 'evaluated',
      elapsedSeconds: 530,
      timedOut: false,
    },
  ];

  const conversations: Conversation[] = [
    {
      id: 'conv_dir_cls_cs304_dbms_demo_stu_aarav',
      type: 'direct',
      classroomId: 'cls_cs304_dbms',
      classroomName: 'Database Management Systems',
      teacherUid: DEMO_TEACHER.uid,
      teacherName: DEMO_TEACHER.name,
      studentUid: DEMO_STUDENT.uid,
      studentName: DEMO_STUDENT.name,
      participantUids: [DEMO_TEACHER.uid, DEMO_STUDENT.uid],
      title: 'Aarav Kulkarni · CS-304 Mentoring',
      lastMessageText: 'Great improvement on HAVING! Review Relational Division (÷) in Unit 2 before the BCNF quiz.',
      lastMessageAt: '2026-11-10T11:20:00Z',
      lastSenderUid: DEMO_TEACHER.uid,
      lastSenderName: DEMO_TEACHER.name,
      unreadCounts: {
        [DEMO_TEACHER.uid]: 0,
        [DEMO_STUDENT.uid]: 1,
      },
      createdAt: '2026-11-04T10:00:00Z',
    },
    {
      id: 'conv_cls_cls_cs304_dbms',
      type: 'classroom',
      classroomId: 'cls_cs304_dbms',
      classroomName: 'Database Management Systems',
      teacherUid: DEMO_TEACHER.uid,
      teacherName: DEMO_TEACHER.name,
      participantUids: [
        DEMO_TEACHER.uid,
        'demo_stu_aarav',
        'demo_stu_meera',
        'demo_stu_rohan',
        'demo_stu_ananya',
      ],
      title: 'CS-304 DBMS (Class Channel)',
      lastMessageText: 'Timed Unit 3–4 Exam (BCNF, Strict 2PL & WAL) is open in Online Tests.',
      lastMessageAt: '2026-11-10T09:30:00Z',
      lastSenderUid: DEMO_TEACHER.uid,
      lastSenderName: DEMO_TEACHER.name,
      unreadCounts: {
        [DEMO_TEACHER.uid]: 0,
        demo_stu_aarav: 1,
        demo_stu_meera: 1,
        demo_stu_rohan: 1,
        demo_stu_ananya: 1,
      },
      createdAt: '2026-10-28T09:00:00Z',
    },
    {
      id: 'conv_dir_cls_grade9_science_demo_stu_aarav',
      type: 'direct',
      classroomId: 'cls_grade9_science',
      classroomName: 'Applied Physics & Cell Biology',
      teacherUid: DEMO_TEACHER.uid,
      teacherName: DEMO_TEACHER.name,
      studentUid: DEMO_STUDENT.uid,
      studentName: DEMO_STUDENT.name,
      participantUids: [DEMO_TEACHER.uid, DEMO_STUDENT.uid],
      title: 'Aarav Kulkarni · SCI-101 Mentoring',
      lastMessageText: 'Review Section 3 of Unit 2 notes on inelastic collisions before Friday.',
      lastMessageAt: '2026-11-09T10:15:00Z',
      lastSenderUid: DEMO_TEACHER.uid,
      lastSenderName: DEMO_TEACHER.name,
      unreadCounts: {
        [DEMO_TEACHER.uid]: 0,
        [DEMO_STUDENT.uid]: 0,
      },
      createdAt: '2026-11-08T18:00:00Z',
    },
  ];

  const messagesByConversation: Record<string, ChatMessage[]> = {
    conv_dir_cls_cs304_dbms_demo_stu_aarav: [
      {
        id: 'msg_dbms_1',
        conversationId: 'conv_dir_cls_cs304_dbms_demo_stu_aarav',
        classroomId: 'cls_cs304_dbms',
        participantUids: [DEMO_TEACHER.uid, DEMO_STUDENT.uid],
        senderUid: DEMO_STUDENT.uid,
        senderName: DEMO_STUDENT.name,
        senderRole: 'student',
        body: 'Ma’am, I retook the SQL diagnostic and fixed my WHERE vs HAVING error, but still confuse Division (÷) with Set Difference (−).',
        readBy: {
          [DEMO_STUDENT.uid]: '2026-11-10T10:50:00Z',
          [DEMO_TEACHER.uid]: '2026-11-10T11:05:00Z',
        },
        createdAt: '2026-11-10T10:50:00Z',
      },
      {
        id: 'msg_dbms_2',
        conversationId: 'conv_dir_cls_cs304_dbms_demo_stu_aarav',
        classroomId: 'cls_cs304_dbms',
        participantUids: [DEMO_TEACHER.uid, DEMO_STUDENT.uid],
        senderUid: DEMO_TEACHER.uid,
        senderName: DEMO_TEACHER.name,
        senderRole: 'teacher',
        body: 'Great improvement on HAVING! Review Relational Division (÷) in Unit 2 before the BCNF quiz.',
        materialId: 'mat_dbms_u1_u2',
        materialTitle: 'DBMS Units 1–2: ER Modeling, Keys, SQL & Relational Algebra',
        readBy: {
          [DEMO_TEACHER.uid]: '2026-11-10T11:20:00Z',
        },
        createdAt: '2026-11-10T11:20:00Z',
      },
    ],
    conv_cls_cls_cs304_dbms: [
      {
        id: 'msg_dbms_cls_1',
        conversationId: 'conv_cls_cls_cs304_dbms',
        classroomId: 'cls_cs304_dbms',
        participantUids: [
          DEMO_TEACHER.uid,
          'demo_stu_aarav',
          'demo_stu_meera',
          'demo_stu_rohan',
          'demo_stu_ananya',
        ],
        senderUid: DEMO_TEACHER.uid,
        senderName: DEMO_TEACHER.name,
        senderRole: 'teacher',
        body: 'Timed Unit 3–4 Exam (BCNF, Strict 2PL & WAL) is open in Online Tests.',
        materialId: 'mat_dbms_u3_u4',
        materialTitle: 'DBMS Units 3–4: BCNF Normalization, ACID, 2PL & Indexing',
        readBy: {
          [DEMO_TEACHER.uid]: '2026-11-10T09:30:00Z',
        },
        createdAt: '2026-11-10T09:30:00Z',
      },
    ],
    conv_dir_cls_grade9_science_demo_stu_aarav: [
      {
        id: 'msg_demo_1',
        conversationId: 'conv_dir_cls_grade9_science_demo_stu_aarav',
        classroomId: 'cls_grade9_science',
        participantUids: [DEMO_TEACHER.uid, DEMO_STUDENT.uid],
        senderUid: DEMO_STUDENT.uid,
        senderName: DEMO_STUDENT.name,
        senderRole: 'student',
        body: 'Ma’am, I lost marks on Question 5 about two balls sticking together. Why is momentum not zero?',
        readBy: {
          [DEMO_STUDENT.uid]: '2026-11-09T09:10:00Z',
          [DEMO_TEACHER.uid]: '2026-11-09T09:20:00Z',
        },
        createdAt: '2026-11-09T09:10:00Z',
      },
      {
        id: 'msg_demo_2',
        conversationId: 'conv_dir_cls_grade9_science_demo_stu_aarav',
        classroomId: 'cls_grade9_science',
        participantUids: [DEMO_TEACHER.uid, DEMO_STUDENT.uid],
        senderUid: DEMO_TEACHER.uid,
        senderName: DEMO_TEACHER.name,
        senderRole: 'teacher',
        body: 'Review Section 3 of Unit 2 notes on inelastic collisions before Friday.',
        materialId: 'mat_newton_laws',
        materialTitle: "Unit 2: Newton's Laws of Motion & Momentum",
        readBy: {
          [DEMO_TEACHER.uid]: '2026-11-09T10:15:00Z',
          [DEMO_STUDENT.uid]: '2026-11-09T12:00:00Z',
        },
        createdAt: '2026-11-09T10:15:00Z',
      },
    ],
  };

  const announcements: Announcement[] = [
    {
      id: 'ann_dbms_1',
      classroomId: 'cls_cs304_dbms',
      classroomName: 'Database Management Systems',
      teacherUid: DEMO_TEACHER.uid,
      teacherName: DEMO_TEACHER.name,
      studentUids: ['demo_stu_aarav', 'demo_stu_meera', 'demo_stu_rohan', 'demo_stu_ananya'],
      title: 'CS-304 Timed Online Exam Open: BCNF, Strict 2PL & Recovery',
      body: 'Complete the 20-minute timed exam covering Units 3 & 4. Review the Starter DBMS Curriculum chapters and English/Kannada notes beforehand.',
      materialId: 'mat_dbms_u3_u4',
      materialTitle: 'DBMS Units 3–4: BCNF Normalization, ACID, 2PL & Indexing',
      priority: 'important',
      acknowledgedBy: ['demo_stu_meera'],
      createdAt: '2026-11-10T09:00:00Z',
    },
    {
      id: 'ann_demo_1',
      classroomId: 'cls_grade9_science',
      classroomName: 'Applied Physics & Cell Biology',
      teacherUid: DEMO_TEACHER.uid,
      teacherName: DEMO_TEACHER.name,
      studentUids: ['demo_stu_aarav', 'demo_stu_meera', 'demo_stu_rohan', 'demo_stu_ananya'],
      title: 'Revision Clinic: Conservation of Momentum & Cell Transport',
      body: 'We will spend 15 minutes at the start of next class walking through collision momentum problems before the Cell Transport & Photosynthesis Quiz.',
      materialId: 'mat_newton_laws',
      materialTitle: "Unit 2: Newton's Laws of Motion & Momentum",
      priority: 'normal',
      acknowledgedBy: ['demo_stu_meera'],
      createdAt: '2026-11-09T08:30:00Z',
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif_demo_stu_dbms_msg',
      recipientUid: DEMO_STUDENT.uid,
      actorUid: DEMO_TEACHER.uid,
      actorName: DEMO_TEACHER.name,
      type: 'teacher_message',
      title: 'Feedback on CS-304 SQL & Algebra',
      body: 'Review Relational Division (÷) in Unit 2 before the BCNF timed exam.',
      classroomId: 'cls_cs304_dbms',
      targetTab: 'communication',
      targetId: 'conv_dir_cls_cs304_dbms_demo_stu_aarav',
      read: false,
      createdAt: '2026-11-10T11:20:00Z',
    },
    {
      id: 'notif_demo_stu_ann',
      recipientUid: DEMO_STUDENT.uid,
      actorUid: DEMO_TEACHER.uid,
      actorName: DEMO_TEACHER.name,
      type: 'announcement',
      title: 'CS-304 Timed Online Exam Open',
      body: 'Complete the 20-minute BCNF, Strict 2PL & Recovery assessment.',
      classroomId: 'cls_cs304_dbms',
      targetTab: 'tests',
      targetId: 'assess_dbms_norm_tx',
      read: false,
      createdAt: '2026-11-10T09:00:00Z',
    },
    {
      id: 'notif_demo_tea_sub',
      recipientUid: DEMO_TEACHER.uid,
      actorUid: 'demo_stu_aarav',
      actorName: 'Aarav Kulkarni',
      type: 'assessment_result',
      title: 'Retake submission: CS-304 Diagnostic',
      body: 'Aarav Kulkarni improved to 75% on ER Model, SQL & Relational Algebra.',
      classroomId: 'cls_cs304_dbms',
      targetTab: 'reports',
      targetId: 'assess_dbms_midterm',
      read: false,
      createdAt: '2026-11-06T16:40:00Z',
    },
  ];

  const attendanceSessions: AttendanceSession[] = [
    {
      id: 'att_dbms_1',
      classroomId: 'cls_cs304_dbms',
      classroomName: 'Database Management Systems',
      teacherUid: DEMO_TEACHER.uid,
      sessionDate: '2026-11-10',
      topic: 'Unit 3 Lab: BCNF Decomposition & SQL Joins',
      studentUids: ['demo_stu_aarav', 'demo_stu_meera', 'demo_stu_rohan', 'demo_stu_ananya'],
      records: {
        demo_stu_aarav: 'present',
        demo_stu_meera: 'present',
        demo_stu_rohan: 'absent',
        demo_stu_ananya: 'present',
      },
      presentCount: 3,
      totalCount: 4,
      createdAt: '2026-11-10T09:00:00Z',
    },
    {
      id: 'att_demo_1',
      classroomId: 'cls_grade9_science',
      classroomName: 'Applied Physics & Cell Biology',
      teacherUid: DEMO_TEACHER.uid,
      sessionDate: '2026-11-09',
      topic: 'Newton Laws & Linear Momentum Practical',
      studentUids: ['demo_stu_aarav', 'demo_stu_meera', 'demo_stu_rohan', 'demo_stu_ananya'],
      records: {
        demo_stu_aarav: 'present',
        demo_stu_meera: 'present',
        demo_stu_rohan: 'absent',
        demo_stu_ananya: 'late',
      },
      presentCount: 3,
      totalCount: 4,
      createdAt: '2026-11-09T09:00:00Z',
    },
  ];

  const lessonPlans: PersistedLessonPlan[] = [
    {
      id: 'plan_cls_cs304_dbms_concept_dbms_sql_algebra',
      classroomId: 'cls_cs304_dbms',
      teacherUid: DEMO_TEACHER.uid,
      conceptId: 'concept_dbms_sql_algebra',
      conceptName: 'SQL Joins & Relational Algebra',
      classMasteryPct: 50,
      recommendedFocus: 'Clarify GROUP BY + HAVING execution order and Relational Division (R ÷ S) queries.',
      suggestedActivity: '15-min live SQL clinic writing correlated NOT EXISTS vs LEFT JOIN checks.',
      status: 'approved',
      createdAt: '2026-11-09T10:00:00Z',
      updatedAt: '2026-11-09T10:00:00Z',
    },
    {
      id: 'plan_cls_grade9_science_concept_momentum',
      classroomId: 'cls_grade9_science',
      teacherUid: DEMO_TEACHER.uid,
      conceptId: 'concept_momentum',
      conceptName: 'Conservation of Momentum',
      classMasteryPct: 38,
      recommendedFocus: 'Reinforce inelastic collision vector signs and conservation before/after impact.',
      suggestedActivity: '15-min guided trolley collision walkthrough + 2 exit-ticket problems.',
      status: 'approved',
      createdAt: '2026-11-09T10:00:00Z',
      updatedAt: '2026-11-09T10:00:00Z',
    },
  ];

  const tutorDoubts: TutorDoubtEntry[] = [
    {
      id: 'doubt_dbms_1',
      classroomId: 'cls_cs304_dbms',
      studentUid: DEMO_STUDENT.uid,
      teacherUid: DEMO_TEACHER.uid,
      materialId: 'mat_dbms_u1_u2',
      materialTitle: 'DBMS Units 1–2: ER Modeling, Keys, SQL & Relational Algebra',
      question: 'When should I use HAVING instead of WHERE in SQL aggregation queries?',
      answerEn:
        'WHERE filters individual rows BEFORE GROUP BY creates groups, so it cannot reference aggregate functions like AVG(percentage). HAVING filters entire groups AFTER GROUP BY completes.',
      answerKn:
        'WHERE ಷರತ್ತು GROUP BY ಗಿಂತ ಮೊದಲು ಪ್ರತ್ಯೇಕ ಸಾಲುಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡುತ್ತದೆ. HAVING ಷರತ್ತು GROUP BY ನಂತರ AVG ಅಥವಾ COUNT ನಂತಹ ಒಟ್ಟು ಫಲಿತಾಂಶಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡುತ್ತದೆ.',
      language: 'kn',
      entryType: 'doubt',
      createdAt: '2026-11-09T11:30:00Z',
    },
  ];

  const revisionTasks: RevisionTaskProgress[] = [
    {
      id: 'rev_demo_stu_aarav_cls_cs304_dbms_concept_dbms_sql_algebra',
      classroomId: 'cls_cs304_dbms',
      studentUid: DEMO_STUDENT.uid,
      teacherUid: DEMO_TEACHER.uid,
      conceptId: 'concept_dbms_sql_algebra',
      conceptName: 'SQL Joins & Relational Algebra',
      matchedMaterialId: 'mat_dbms_u1_u2',
      matchedMaterialTitle: 'DBMS Units 1–2: ER Modeling, Keys, SQL & Relational Algebra',
      status: 'pending',
      reflectionNote: 'Practice Relational Division (R ÷ S) equivalences.',
      updatedAt: '2026-11-09T12:00:00Z',
      createdAt: '2026-11-09T12:00:00Z',
    },
  ];

  const materialEngagements: MaterialEngagement[] = [
    {
      id: 'eng_mat_dbms_u1_u2_demo_stu_aarav',
      materialId: 'mat_dbms_u1_u2',
      classroomId: 'cls_cs304_dbms',
      teacherUid: DEMO_TEACHER.uid,
      studentUid: DEMO_STUDENT.uid,
      studentName: DEMO_STUDENT.name,
      status: 'viewed',
      viewCount: 3,
      lastViewedAt: '2026-11-09T14:00:00Z',
      createdAt: '2026-11-04T10:00:00Z',
    },
  ];

  const classroomActivities: ClassroomActivity[] = [
    {
      id: 'act_dbms_1',
      classroomId: 'cls_cs304_dbms',
      classroomName: 'Database Management Systems',
      teacherUid: DEMO_TEACHER.uid,
      studentUids: ['demo_stu_aarav', 'demo_stu_meera', 'demo_stu_rohan', 'demo_stu_ananya'],
      title: 'SQL Joins & Relational Algebra Clinic',
      activityType: 'revision_clinic',
      scheduledDate: '2026-11-19',
      description: 'Hands-on PostgreSQL practice comparing EXISTS, LEFT JOIN, and Relational Division.',
      completed: false,
      createdAt: '2026-11-10T09:30:00Z',
    },
    {
      id: 'act_demo_2',
      classroomId: 'cls_grade9_science',
      classroomName: 'Applied Physics & Cell Biology',
      teacherUid: DEMO_TEACHER.uid,
      studentUids: ['demo_stu_aarav', 'demo_stu_meera', 'demo_stu_rohan', 'demo_stu_ananya'],
      title: 'Osmosis Potato Strip Lab',
      activityType: 'lab',
      scheduledDate: '2026-11-20',
      description: 'Compare mass change across hypotonic and hypertonic sucrose solutions.',
      completed: false,
      createdAt: '2026-11-10T09:45:00Z',
    },
  ];

  const questionBank: QuestionBankItem[] = [
    {
      id: 'qbank_dbms_1',
      teacherUid: DEMO_TEACHER.uid,
      subject: 'Computer Science & Engineering',
      conceptId: 'concept_dbms_normalization',
      conceptName: 'Normalization & BCNF',
      prompt: 'True or False: Every relation in BCNF is guaranteed to be in 3NF and 2NF.',
      type: 'short_answer',
      correctAnswer: 'True',
      explanation: 'BCNF is strictly stronger than 3NF, which itself implies 2NF and 1NF.',
      points: 2,
      createdAt: '2026-11-05T09:00:00Z',
    },
    {
      id: 'qbank_demo_2',
      teacherUid: DEMO_TEACHER.uid,
      subject: 'Natural Sciences',
      conceptId: 'concept_inertia',
      conceptName: 'Inertia & First Law',
      prompt: 'Which physical quantity directly determines an object’s translational inertia?',
      type: 'mcq',
      options: ['Mass', 'Velocity', 'Surface area', 'Temperature'],
      correctAnswer: 'Mass',
      explanation: 'Greater mass offers greater resistance to changes in velocity.',
      points: 2,
      createdAt: '2026-11-07T09:15:00Z',
    },
  ];

  const studentNotes: StudentStudyNote[] = [
    {
      id: 'note_dbms_1',
      classroomId: 'cls_cs304_dbms',
      studentUid: DEMO_STUDENT.uid,
      conceptId: 'concept_dbms_normalization',
      conceptName: 'Normalization & BCNF',
      title: 'BCNF Quick Test Checklist',
      content:
        'Compute X+ for every non-trivial FD X -> Y. If X+ contains all attributes of R, X is a Super Key and BCNF holds. (ಪ್ರತಿಯೊಂದು X -> Y ನಿಯಮಕ್ಕೂ X ಸೂಪರ್ ಕೀ ಆಗಿರಬೇಕು)',
      language: 'kn',
      updatedAt: '2026-11-10T11:00:00Z',
      createdAt: '2026-11-10T11:00:00Z',
    },
  ];

  // Sample Data per-student curriculum completion (never real university records)
  const curriculumProgress: CurriculumTopicProgress[] = [
    {
      id: 'curr_demo_stu_aarav_dbms_starter',
      studentUid: 'demo_stu_aarav',
      curriculumId: 'dbms_starter',
      completedTopicIds: [
        'dbms_u1_intro_db_systems',
        'dbms_u1_characteristics',
        'dbms_u1_file_vs_dbms',
        'dbms_u1_architecture',
        'dbms_u1_three_schema',
        'dbms_u1_er_model',
        'dbms_u2_intro_sql',
        'dbms_u2_ddl',
        'dbms_u2_select',
        'dbms_u3_functional_dependencies',
      ],
      lastViewedTopicId: 'dbms_u3_bcnf',
      updatedAt: '2026-11-10T12:15:00Z',
      createdAt: '2026-11-01T09:00:00Z',
    },
    {
      id: 'curr_demo_stu_meera_dbms_starter',
      studentUid: 'demo_stu_meera',
      curriculumId: 'dbms_starter',
      completedTopicIds: [
        'dbms_u1_intro_db_systems',
        'dbms_u1_characteristics',
        'dbms_u1_file_vs_dbms',
        'dbms_u1_architecture',
        'dbms_u1_three_schema',
        'dbms_u1_data_independence',
        'dbms_u1_er_model',
        'dbms_u1_relational_model',
        'dbms_u1_pk_fk',
        'dbms_u2_intro_sql',
        'dbms_u2_ddl',
        'dbms_u2_dml',
        'dbms_u2_select',
        'dbms_u2_joins',
        'dbms_u3_functional_dependencies',
        'dbms_u3_1nf',
        'dbms_u3_2nf',
        'dbms_u3_3nf',
        'dbms_u3_bcnf',
      ],
      lastViewedTopicId: 'dbms_u4_acid',
      updatedAt: '2026-11-10T14:00:00Z',
      createdAt: '2026-11-01T09:00:00Z',
    },
    {
      id: 'curr_demo_stu_rohan_dbms_starter',
      studentUid: 'demo_stu_rohan',
      curriculumId: 'dbms_starter',
      completedTopicIds: [
        'dbms_u1_intro_db_systems',
        'dbms_u1_file_vs_dbms',
        'dbms_u2_intro_sql',
      ],
      lastViewedTopicId: 'dbms_u2_where_order_group',
      updatedAt: '2026-11-09T17:30:00Z',
      createdAt: '2026-11-02T10:00:00Z',
    },
    {
      id: 'curr_demo_stu_ananya_dbms_starter',
      studentUid: 'demo_stu_ananya',
      curriculumId: 'dbms_starter',
      completedTopicIds: [
        'dbms_u1_intro_db_systems',
        'dbms_u1_characteristics',
        'dbms_u1_er_model',
        'dbms_u1_pk_fk',
        'dbms_u2_intro_sql',
        'dbms_u2_select',
      ],
      lastViewedTopicId: 'dbms_u2_joins',
      updatedAt: '2026-11-09T18:10:00Z',
      createdAt: '2026-11-02T11:00:00Z',
    },
  ];

  return {
    classrooms,
    materials,
    assessments,
    submissions,
    conversations,
    messagesByConversation,
    announcements,
    notifications,
    attendanceSessions,
    lessonPlans,
    tutorDoubts,
    revisionTasks,
    materialEngagements,
    classroomActivities,
    questionBank,
    studentNotes,
    curriculumProgress,
  };
}
