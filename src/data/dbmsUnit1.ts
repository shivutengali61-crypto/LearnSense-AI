import type { DbmsChapter } from './dbmsCurriculumTypes';

export const DBMS_UNIT_1_CHAPTERS: DbmsChapter[] = [
  {
    id: 'dbms_u1_intro_db_systems',
    unitNumber: 1,
    code: '1.1',
    title: 'Introduction to Database Systems',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'A Database Management System (DBMS) is specialized software that stores, organizes, and retrieves related data safely for many users and applications at the same time.',
    detailedExplanation:
      'Unlike plain text or spreadsheet files, a database system combines a persistent collection of interrelated facts (the database) with a software layer (the DBMS) that enforces schemas, validates constraints, processes declarative queries, and coordinates concurrent access. Applications no longer embed byte offsets or custom file parsing logic; instead, they issue logical queries while the DBMS handles indexing, caching, and crash safety.',
    summaryEn:
      'A DBMS manages structured enterprise data with centralized schema control, multi-user concurrency, integrity checks, and declarative query execution.',
    summaryKn:
      'ಡೇಟಾಬೇಸ್ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಸಿಸ್ಟಮ್ (DBMS) ಸಂಬಂಧಿತ ಡೇಟಾವನ್ನು ವ್ಯವಸ್ಥಿತವಾಗಿ ಸಂಗ್ರಹಿಸುತ್ತದೆ ಮತ್ತು ಹಲವು ಬಳಕೆದಾರರಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಪ್ರವೇಶ ನೀಡುತ್ತದೆ.',
    realWorldExample:
      'A university enrollment portal stores student profiles, course catalogs, fee receipts, and exam grades in one DBMS so the admissions desk, library, and faculty portals read consistent records without duplicating files.',
    definitions: [
      { term: 'Database', definition: 'A persistent, logically coherent collection of structured data representing a mini-world.' },
      { term: 'DBMS', definition: 'General-purpose software that facilitates defining, constructing, manipulating, and sharing databases.' },
      { term: 'Catalog / Metadata', definition: 'Self-describing schema definitions, types, and constraints stored inside the DBMS.' },
    ],
    learningObjectives: [
      'Define the role of a DBMS relative to application programs and operating system files.',
      'Identify the core components of a database system environment: users, schema, catalog, and engine.',
      'Explain why centralized metadata enables multiple applications to share one source of truth.',
    ],
    difficultyLevels: {
      beginner: 'Think of a DBMS as an intelligent digital librarian: it knows where every book (row) lives, checks membership rules before lending, and lets hundreds of students search simultaneously.',
      intermediate: 'A DBMS separates logical schema (tables and constraints) from physical page management, providing ACID guarantees and declarative SQL optimization.',
      advanced: 'Modern DBMS engines integrate a parser, cost-based relational optimizer, buffer pool manager with LRU/Clock eviction, lock manager, and Write-Ahead Logging (WAL) recovery subsystem.',
    },
    keyTakeaways: [
      'Self-describing nature: system catalog stores table definitions alongside user data.',
      'Supports multiple user views over a single shared repository.',
      'Separates application code from storage layout.',
    ],
    codeOrDiagramTitle: 'Database System Ecosystem Overview',
    codeOrDiagram: `[Student Web App]  [Faculty Portal]  [Analytics Job]
         \\                |                /
          v               v               v
      +---------------------------------------+
      |   DBMS Engine (Query + Constraints)   |
      +---------------------------------------+
            |                       |
   [System Catalog]         [Stored Data Pages]`,
    relatedConceptIds: ['dbms_u1_characteristics', 'dbms_u1_file_vs_dbms', 'dbms_u1_architecture'],
    practiceQuestions: [
      {
        id: 'pq_u1_1_1',
        difficulty: 'beginner',
        prompt: 'What is metadata in a database system, and where does the DBMS store it?',
        hint: 'Think about how the DBMS knows column data types before reading table rows.',
        answer: 'Metadata describes the structure, data types, and constraints of the database; the DBMS stores it centrally in the System Catalog (Data Dictionary).',
      },
      {
        id: 'pq_u1_1_2',
        difficulty: 'intermediate',
        prompt: 'Give two reasons a university avoids storing exam marks in separate departmental Excel sheets.',
        hint: 'Consider duplicate updates and simultaneous edits by two staff members.',
        answer: 'Separate spreadsheets cause update anomalies when student details change in one sheet only and lack atomic multi-user concurrency control and referential integrity checks.',
      },
    ],
    practicePrompt: 'Explain how the System Catalog makes a DBMS self-describing compared to raw binary files.',
  },
  {
    id: 'dbms_u1_characteristics',
    unitNumber: 1,
    code: '1.2',
    title: 'Characteristics of DBMS',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'Key DBMS characteristics include self-describing schemas, program-data independence, multiple user views, controlled redundancy, and concurrent transaction safety.',
    detailedExplanation:
      'The database approach distinguishes itself through four foundational traits: (1) self-describing structure via the system catalog, (2) insulation between programs and data, (3) support for tailored external views per user role, and (4) sharing of data with multi-user transaction processing. Additional enterprise characteristics include enforcing integrity rules declaratively, restricting unauthorized access, and ensuring durability via backup and crash recovery.',
    summaryEn:
      'Core DBMS characteristics center on metadata catalogs, data abstraction, multi-view support, integrity enforcement, and concurrency control.',
    summaryKn:
      'ಸ್ವಯಂ-ವಿವರಣಾತ್ಮಕ ಕ್ಯಾಟಲಾಗ್, ಪ್ರೋಗ್ರಾಂ-ಡೇಟಾ ಸ್ವಾತಂತ್ರ್ಯ, ಬಹು-ಬಳಕೆದಾರ ನೋಟಗಳು ಮತ್ತು ಸುರಕ್ಷತೆಯು DBMS ನ ಪ್ರಮುಖ ಲಕ್ಷಣಗಳಾಗಿವೆ.',
    realWorldExample:
      'In LearnSense AI, a teacher views class-wide mastery averages while a student sees only their personal grades—both querying the exact same underlying submissions relation through role-scoped views.',
    definitions: [
      { term: 'Program-Data Independence', definition: 'Ability to modify file structures or storage indexes without rewriting application programs.' },
      { term: 'Controlled Redundancy', definition: 'Eliminating unnecessary duplicates while permitting deliberate denormalization or keys for joins.' },
      { term: 'Database View', definition: 'A virtual subset or derived projection customized for a specific user group.' },
    ],
    learningObjectives: [
      'Contrast uncontrolled duplication with controlled redundancy.',
      'Explain how multiple user views protect privacy without copying base tables.',
      'Describe how ACID concurrency protects shared multi-user updates.',
    ],
    difficultyLevels: {
      beginner: 'Focus on five words: Organized, Shared, Independent, Secure, and Reliable.',
      intermediate: 'Understand how views implement logical isolation and how catalog-driven engines eliminate hardcoded record offsets in client code.',
      advanced: 'Analyze trade-offs between strict normalization (zero redundancy) and controlled redundancy (materialized views, covering indexes) for read-heavy OLAP workloads.',
    },
    keyTakeaways: [
      'Catalog-driven execution keeps schemas decoupled from application code.',
      'Role-tailored views expose only authorized columns and rows.',
      'Declarative constraints reject invalid data regardless of which client connects.',
    ],
    codeOrDiagramTitle: 'Multiple Views Over Shared Data',
    codeOrDiagram: `CREATE VIEW student_grade_view AS
SELECT assessment_id, score, max_score, percentage
FROM assessment_submissions
WHERE student_uid = CURRENT_USER;`,
    relatedConceptIds: ['dbms_u1_intro_db_systems', 'dbms_u1_data_independence', 'dbms_u2_views'],
    practiceQuestions: [
      {
        id: 'pq_u1_2_1',
        difficulty: 'beginner',
        prompt: 'Why is "controlled redundancy" preferred over "zero redundancy" in real databases?',
        hint: 'Think about foreign keys or performance caches.',
        answer: 'Foreign keys intentionally repeat primary key values to link tables, and controlled copies like materialized views improve read latency when kept synchronized by the DBMS.',
      },
    ],
    practicePrompt: 'List four defining characteristics of the database approach and illustrate each with a campus scenario.',
  },
  {
    id: 'dbms_u1_file_vs_dbms',
    unitNumber: 1,
    code: '1.3',
    title: 'File System vs DBMS',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'Traditional file systems store isolated files per program, causing data duplication and inconsistency, whereas a DBMS centralizes data with rules and crash recovery.',
    detailedExplanation:
      'In early file-processing systems, each department built standalone COBOL or C programs managing private CSV or binary files. Changing a student’s phone number in Admissions left stale copies in Hostel and Library files (inconsistency). Adding a new field required recompiling every program (program-data dependence). File systems also lack declarative querying, fine-grained row locking, and atomic rollback if a program crashes mid-transfer.',
    summaryEn:
      'File systems suffer from redundancy, inconsistency, data isolation, and weak atomicity; a DBMS solves these with schemas, locks, and recovery logs.',
    summaryKn:
      'ಫೈಲ್ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಡೇಟಾ ಪುನರಾವರ್ತನೆ ಮತ್ತು ಅಸಂಗತತೆ ಉಂಟಾಗುತ್ತದೆ; DBMS ಕೇಂದ್ರೀಕೃತ ನಿಯಮಗಳು ಮತ್ತು ACID ಸುರಕ್ಷತೆಯನ್ನು ನೀಡುತ್ತದೆ.',
    realWorldExample:
      'If a bank transfer deducts ₹5,000 from Account A and power fails before crediting Account B, flat-file writes leave money missing, whereas a DBMS rolls back the uncommitted transaction automatically.',
    definitions: [
      { term: 'Data Isolation', definition: 'Difficulty combining records scattered across incompatible formats in separate files.' },
      { term: 'Atomicity Problem', definition: 'Partial updates remaining on disk when a crash interrupts a multi-step operation.' },
      { term: 'Integrity Violation', definition: 'Invalid values entering storage because rules reside only inside one application script.' },
    ],
    learningObjectives: [
      'Compare file processing and DBMS across redundancy, concurrency, security, and recovery.',
      'Identify update, insertion, and deletion anomalies in flat files.',
      'Recognize when simple flat files suffice (e.g., static config) versus when a DBMS is essential.',
    ],
    difficultyLevels: {
      beginner: 'Flat files = separate notebooks per office; DBMS = one shared cloud ledger where every office sees updates immediately.',
      intermediate: 'Compare OS file locking (whole-file locks) against DBMS row-level/tuple locking and B+-Tree indexed lookups.',
      advanced: 'Evaluate crash consistency: OS write() syscalls buffer in page cache without multi-file atomicity, while DBMS WAL guarantees REDO/UNDO idempotency.',
    },
    keyTakeaways: [
      'Eliminates data silos and inconsistent duplicate updates.',
      'Replaces imperative file-scanning loops with declarative SQL.',
      'Enforces row-level concurrency and atomic crash recovery.',
    ],
    codeOrDiagramTitle: 'Side-by-Side Comparison Matrix',
    codeOrDiagram: `Dimension           Flat File System             Relational DBMS
---------           ----------------             ---------------
Redundancy          High across app files        Controlled via normalization
Querying            Custom imperative code       Declarative SQL optimizer
Concurrency         Coarse OS file locks         Tuple locks + MVCC
Crash Recovery      Manual / partial corruption  Automatic WAL REDO/UNDO`,
    relatedConceptIds: ['dbms_u1_intro_db_systems', 'dbms_u3_anomalies', 'dbms_u4_acid'],
    practiceQuestions: [
      {
        id: 'pq_u1_3_1',
        difficulty: 'intermediate',
        prompt: 'Why is enforcing "balance >= 0" in application code weaker than enforcing a DBMS CHECK constraint?',
        hint: 'What happens if a second script or admin tool writes to the data?',
        answer: 'Application-level checks only guard that single app; a DBMS CHECK constraint guards the relation against every client, batch script, or SQL session.',
      },
    ],
    practicePrompt: 'Contrast flat-file processing and a DBMS with respect to concurrency anomalies and atomicity.',
  },
  {
    id: 'dbms_u1_architecture',
    unitNumber: 1,
    code: '1.4',
    title: 'Database Architecture',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Database architecture organizes how clients connect (2-tier / 3-tier) and how internal DBMS modules parse queries, manage memory buffers, and read disk pages.',
    detailedExplanation:
      'Externally, modern web apps use a 3-tier architecture: Presentation (React UI) → Application Server (Express API enforcing business rules) → Database Tier (DBMS engine). Internally, a DBMS splits into the Query Processor (DDL compiler, DML parser, cost-based optimizer, execution engine) and the Storage Manager (authorization/integrity manager, transaction manager, file manager, buffer pool manager).',
    summaryEn:
      'DBMS architecture comprises external 2-tier/3-tier client topologies and internal Query Processor + Storage Manager pipelines.',
    summaryKn:
      'DBMS ವಾಸ್ತುಶಿಲ್ಪವು 2-tier/3-tier ಕ್ಲೈಂಟ್ ವಿನ್ಯಾಸ ಹಾಗೂ ಆಂತರಿಕ Query Processor ಮತ್ತು Storage Manager ಘಟಕಗಳನ್ನು ಒಳಗೊಂಡಿದೆ.',
    realWorldExample:
      'In LearnSense AI, React runs in the browser (Tier 1), Express handles AI/auth APIs (Tier 2), and Cloud Firestore / PostgreSQL persists records (Tier 3), preventing clients from holding direct DB admin credentials.',
    definitions: [
      { term: 'Two-Tier Architecture', definition: 'Client applications talk directly to the DBMS via JDBC/ODBC drivers.' },
      { term: 'Three-Tier Architecture', definition: 'An intermediate application server mediates client requests, auth, and connection pooling.' },
      { term: 'Buffer Manager', definition: 'Transfers disk pages into main-memory frames and tracks dirty/pinned pages.' },
    ],
    learningObjectives: [
      'Distinguish 1-tier, 2-tier, and 3-tier deployment topologies.',
      'Trace an SQL query from parser through optimizer to buffer pool.',
      'Explain why web apps always place an application/auth layer in front of relational databases.',
    ],
    difficultyLevels: {
      beginner: 'A 3-tier system puts a waiter (web server) between the diner (browser) and the kitchen (database).',
      intermediate: 'Understand how connection pooling in the middle tier avoids exhausting DBMS worker processes under high web traffic.',
      advanced: 'Inspect Volcano/iterator execution pipelines, cost estimation using catalog histograms, and WAL/Buffer Pool interaction (steal/no-force policies).',
    },
    keyTakeaways: [
      'Query Processor converts declarative SQL into an optimal physical operator tree.',
      'Buffer Manager minimizes slow disk I/O by caching hot pages in RAM.',
      '3-tier architecture isolates database credentials from browsers.',
    ],
    codeOrDiagramTitle: 'Internal DBMS Engine Pipeline',
    codeOrDiagram: `SQL Query ─▶ [Parser & Validator] ─▶ [Cost-Based Optimizer]
                                              │
                                              ▼
[Disk Pages] ◀─ [Buffer Pool Mgr] ◀─ [Query Execution Engine]
                       ▲
              [Lock & WAL Recovery Mgr]`,
    relatedConceptIds: ['dbms_u1_three_schema', 'dbms_u2_indexes', 'dbms_u4_log_recovery'],
    practiceQuestions: [
      {
        id: 'pq_u1_4_1',
        difficulty: 'intermediate',
        prompt: 'Which internal DBMS component decides whether to use an index scan or a sequential table scan?',
        hint: 'It compares estimated I/O costs of alternative relational algebra plans.',
        answer: 'The Query Optimizer (using table statistics and histograms from the System Catalog).',
      },
    ],
    practicePrompt: 'Sketch the lifecycle of a SELECT statement inside the Query Processor and Storage Manager.',
  },
  {
    id: 'dbms_u1_three_schema',
    unitNumber: 1,
    code: '1.5',
    title: 'Three-Schema Architecture',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'The ANSI/SPARC Three-Schema Architecture divides a database into External (user views), Conceptual (logical tables), and Internal (physical storage) levels.',
    detailedExplanation:
      'Proposed by the ANSI/SPARC committee, the Three-Schema Architecture separates database description into three layers: (1) the Internal Schema describes physical storage paths, compression, and indexes; (2) the Conceptual Schema describes all entities, relationships, and integrity constraints across the entire organization; (3) External Schemas (views) describe tailored slices of data for specific user roles while hiding irrelevant or sensitive fields.',
    summaryEn:
      'Separates Internal physical layout, Conceptual logical design, and External user views with explicit mappings between adjacent layers.',
    summaryKn:
      'ANSI/SPARC ಮೂರು-ಸ್ತರಗಳ ವಾಸ್ತುಶಿಲ್ಪವು Internal, Conceptual ಮತ್ತು External ಸ್ತರಗಳನ್ನು ಪ್ರತ್ಯೇಕಿಸಿ ಸುರಕ್ಷತೆ ಮತ್ತು ಹೊಂದಾಣಿಕೆಯನ್ನು ನೀಡುತ್ತದೆ.',
    realWorldExample:
      'In a university DB, the Internal level stores B+-Tree files on SSDs; the Conceptual level defines Students, Courses, and Enrollments; the External level gives Accounts fee views and Faculty grade views.',
    definitions: [
      { term: 'External Level', definition: 'Highest abstraction layer presenting customized views per user role.' },
      { term: 'Conceptual Level', definition: 'Community logical view detailing all relations, attributes, and constraints.' },
      { term: 'Internal Level', definition: 'Lowest level specifying file organization, block layout, and index structures.' },
    ],
    learningObjectives: [
      'Identify what belongs in the External, Conceptual, and Internal schemas.',
      'Explain the role of External/Conceptual and Conceptual/Internal mappings.',
      'Connect the three-schema model directly to data independence.',
    ],
    difficultyLevels: {
      beginner: 'Three layers: What each user sees (External), the master blueprint (Conceptual), and how bytes sit on disk (Internal).',
      intermediate: 'Trace how a query against an External view is rewritten via External-to-Conceptual and Conceptual-to-Internal mappings.',
      advanced: 'Understand why mapping overhead is compiled away during query planning in modern RDBMS view expansion.',
    },
    keyTakeaways: [
      'One Conceptual Schema serves many External Views.',
      'Internal Schema hides physical storage mechanics from SQL developers.',
      'Mappings translate queries cleanly across levels.',
    ],
    codeOrDiagramTitle: 'ANSI/SPARC Three-Schema Stack',
    codeOrDiagram: `[ External Schema 1: Student ]   [ External Schema 2: Faculty ]
               \\                          /
                --- External/Conceptual Mapping ---
                                |
                    [ Conceptual Schema ]
        (Students, Courses, Enrollments, Constraints)
                                |
                --- Conceptual/Internal Mapping ---
                                |
                     [ Internal Schema ]
             (Heap Files, B+-Tree Indexes, Pages)`,
    relatedConceptIds: ['dbms_u1_architecture', 'dbms_u1_data_independence', 'dbms_u2_views'],
    practiceQuestions: [
      {
        id: 'pq_u1_5_1',
        difficulty: 'beginner',
        prompt: 'At which schema level are B+-Tree indexes and page sizes specified?',
        hint: 'It deals with physical storage efficiency.',
        answer: 'The Internal (Physical) Schema level.',
      },
    ],
    practicePrompt: 'Explain how External, Conceptual, and Internal schemas collaborate during a single SQL query.',
  },
  {
    id: 'dbms_u1_data_independence',
    unitNumber: 1,
    code: '1.6',
    title: 'Data Independence',
    estimatedMinutes: 20,
    difficulty: 'intermediate',
    simpleExplanation:
      'Data independence lets you change database storage or table structure at a lower level without breaking queries or applications at higher levels.',
    detailedExplanation:
      'Data independence is the primary payoff of the Three-Schema Architecture. Logical Data Independence means modifying the conceptual schema (such as adding a nullable column or splitting a table into 3NF) without rewriting existing external views or client reports—only the external/conceptual mapping updates. Physical Data Independence means changing internal storage (adding a B+-Tree index, partitioning, moving to NVMe storage) without altering the conceptual schema or SQL queries.',
    summaryEn:
      'Logical data independence shields views from conceptual changes; physical data independence shields SQL and schema from storage changes.',
    summaryKn:
      'Logical Data Independence ತಾರ್ಕಿಕ ಬದಲಾವಣೆಗಳಿಂದ ಬಳಕೆದಾರರ ನೋಟವನ್ನು ರಕ್ಷಿಸುತ್ತದೆ; Physical Data Independence ಭೌತಿಕ ಸಂಗ್ರಹಣೆ ಬದಲಾವಣೆಗಳಿಂದ ರಕ್ಷಿಸುತ್ತದೆ.',
    realWorldExample:
      'A DBA adds a composite index on (classroom_id, submitted_at) to speed up dashboards 10x. Zero React components or SQL queries need to change—demonstrating Physical Data Independence.',
    definitions: [
      { term: 'Logical Data Independence', definition: 'Capacity to change the conceptual schema without altering external schemas or app code.' },
      { term: 'Physical Data Independence', definition: 'Capacity to change the internal schema without altering the conceptual schema.' },
    ],
    learningObjectives: [
      'Differentiate logical data independence from physical data independence.',
      'Explain why logical data independence is harder to achieve than physical data independence.',
      'Provide concrete schema evolution examples for each type.',
    ],
    difficultyLevels: {
      beginner: 'Physical = change the disk/index without breaking tables; Logical = change tables without breaking user screens.',
      intermediate: 'Use SQL CREATE VIEW to preserve backward-compatible external projections after normalizing a conceptual table.',
      advanced: 'Recognize limits of logical independence: deleting a projected attribute or introducing non-updatable joins breaks transparent write-through views.',
    },
    keyTakeaways: [
      'Physical independence is routine in all modern RDBMS engines.',
      'Logical independence relies heavily on stable SQL Views.',
      'Reduces long-term software maintenance cost.',
    ],
    codeOrDiagramTitle: 'Preserving Logical Independence with Views',
    codeOrDiagram: `-- Conceptual table split into Students + Contacts:
CREATE VIEW legacy_student_directory AS
SELECT s.uid, s.name, c.email, c.phone
FROM students s
JOIN student_contacts c ON c.student_uid = s.uid;`,
    relatedConceptIds: ['dbms_u1_three_schema', 'dbms_u2_views', 'dbms_u3_schema_refinement'],
    practiceQuestions: [
      {
        id: 'pq_u1_6_1',
        difficulty: 'intermediate',
        prompt: 'Why is Logical Data Independence generally harder to achieve than Physical Data Independence?',
        hint: 'Think about how applications depend on column names and semantic relationships.',
        answer: 'Applications directly reference conceptual table names, columns, and semantics; altering conceptual relations requires updating view mappings and ensuring view-update rules remain valid.',
      },
    ],
    practicePrompt: 'Classify adding an index vs. splitting a table into two normalized tables under physical or logical independence.',
  },
  {
    id: 'dbms_u1_db_languages',
    unitNumber: 1,
    code: '1.7',
    title: 'Database Languages',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'Database languages provide distinct sub-commands to define tables (DDL), query and modify rows (DML), control permissions (DCL), and manage transactions (TCL).',
    detailedExplanation:
      'A DBMS exposes sub-languages matched to user roles. Data Definition Language (DDL) creates and alters schemas in the catalog (CREATE, ALTER, DROP). Storage Definition Language (SDL) and View Definition Language (VDL) refine physical storage and user views. Data Manipulation Language (DML) retrieves and updates data (SELECT, INSERT, UPDATE, DELETE). Data Control Language (DCL) manages privileges (GRANT, REVOKE), while Transaction Control Language (TCL) commits or rolls back work (COMMIT, ROLLBACK, SAVEPOINT).',
    summaryEn:
      'DBMS sub-languages span DDL (structure), DML (data queries/edits), DCL (access control), and TCL (atomic commit/rollback).',
    summaryKn:
      'ಡೇಟಾಬೇಸ್ ಭಾಷೆಗಳನ್ನು DDL (ವಿನ್ಯಾಸ), DML (ಡೇಟಾ ನಿರ್ವಹಣೆ), DCL (ಅನುಮತಿ) ಮತ್ತು TCL (ವಹಿವಾಟು) ಎಂದು ವಿಂಗಡಿಸಲಾಗಿದೆ.',
    realWorldExample:
      'During course setup, an admin runs DDL to create tables and DCL to grant read access to TAs; during semester grading, faculty run DML inside TCL transactions so grade batches commit cleanly.',
    definitions: [
      { term: 'DDL', definition: 'Data Definition Language used by designers/DBAs to specify schemas and constraints.' },
      { term: 'DML', definition: 'Data Manipulation Language used to retrieve, insert, modify, and delete tuples.' },
      { term: 'DCL & TCL', definition: 'Languages for security permissions (GRANT/REVOKE) and transaction boundaries (COMMIT/ROLLBACK).' },
    ],
    learningObjectives: [
      'Classify SQL statements accurately into DDL, DML, DCL, and TCL.',
      'Distinguish procedural DML (specifies how) from declarative DML (specifies what).',
      'Explain where DDL definitions are persisted (System Catalog).',
    ],
    difficultyLevels: {
      beginner: 'DDL = build the house; DML = move furniture inside; DCL = hand out keys; TCL = undo/save.',
      intermediate: 'Know that SQL is a non-procedural (declarative) DML where the optimizer chooses the execution algorithm.',
      advanced: 'Understand implicit commit behavior of DDL statements in engines like MySQL vs. transactional DDL in PostgreSQL.',
    },
    keyTakeaways: [
      'Declarative DML lets users state WHAT data they want, not HOW to scan files.',
      'DDL updates metadata inside the System Catalog.',
      'DCL and TCL enforce security and atomicity.',
    ],
    codeOrDiagramTitle: 'Taxonomy of Database Sub-Languages',
    codeOrDiagram: `DDL : CREATE TABLE courses (...);   ALTER TABLE ...;
DML : SELECT * FROM courses;        INSERT / UPDATE / DELETE ...;
DCL : GRANT SELECT ON grades TO ta_role;
TCL : BEGIN; ... SAVEPOINT sp1; COMMIT;`,
    relatedConceptIds: ['dbms_u2_intro_sql', 'dbms_u2_ddl', 'dbms_u2_dml'],
    practiceQuestions: [
      {
        id: 'pq_u1_7_1',
        difficulty: 'beginner',
        prompt: 'Which database sub-language is responsible for granting SELECT privilege to a user?',
        hint: 'Think of access control.',
        answer: 'DCL (Data Control Language), using the GRANT statement.',
      },
    ],
    practicePrompt: 'Explain the difference between procedural DML and declarative DML with SQL as an example.',
  },
  {
    id: 'dbms_u1_data_models',
    unitNumber: 1,
    code: '1.8',
    title: 'Data Models',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'A data model is a collection of concepts—such as entities, tables, graphs, or documents—used to describe the structure and rules of a database.',
    detailedExplanation:
      'Data models fall into three categories by abstraction level: (1) High-level Conceptual models (ER/EER) mirror how humans perceive domain concepts; (2) Representational/Logical models (Relational, Object-Relational, Document/Key-Value) bridge user understanding and computer storage; (3) Low-level Physical models describe record layouts, block sizes, and access paths (B+-Trees, Hash files).',
    summaryEn:
      'Data models span Conceptual (ER), Logical/Representational (Relational, Hierarchical, Network, NoSQL), and Physical storage models.',
    summaryKn:
      'ಡೇಟಾ ಮಾದರಿಗಳು Conceptual (ER), Logical (Relational, NoSQL) ಮತ್ತು Physical ಹಂತಗಳಲ್ಲಿ ಡೇಟಾ ರಚನೆಯನ್ನು ವಿವರಿಸುತ್ತವೆ.',
    realWorldExample:
      'A software team sketches domain objects in an ER diagram (Conceptual), converts them to PostgreSQL tables (Relational Logical), and adds B+-Tree indexes on foreign keys (Physical).',
    definitions: [
      { term: 'Conceptual Model', definition: 'Uses entities, attributes, and relationships close to domain vocabulary.' },
      { term: 'Representational Model', definition: 'Tables or JSON structures understood by users yet directly implementable in DBMS.' },
      { term: 'Schema vs. Instance', definition: 'Schema is the stable structural design; instance (state) is the snapshot of data at a moment.' },
    ],
    learningObjectives: [
      'Categorize ER, Relational, Network, Hierarchical, and Document models.',
      'Distinguish between a database schema (intension) and database state/instance (extension).',
      'Select an appropriate logical data model for structured vs. semi-structured data.',
    ],
    difficultyLevels: {
      beginner: 'Schema is the empty column headers of a spreadsheet; Instance is the filled-in rows today.',
      intermediate: 'Compare Relational strict-schema tables with NoSQL document/graph models for hierarchical vs. relational workloads.',
      advanced: 'Analyze historical shift from navigational pointer-based Network/CODASYL models to set-oriented Relational algebra.',
    },
    keyTakeaways: [
      'Schema changes infrequently; database instance changes on every DML write.',
      'ER models map cleanly into Relational schemas.',
      'Physical models focus on I/O latency and indexing.',
    ],
    codeOrDiagramTitle: 'Three Levels of Data Modeling',
    codeOrDiagram: `[Conceptual: ER Model]  ──▶  (Student) --<Enrolls>-- (Course)
                                    │
                                    ▼
[Logical: Relational]   ──▶  enrollments(student_uid PK/FK, course_id PK/FK)
                                    │
                                    ▼
[Physical: Storage]     ──▶  Heap tuples + B+-Tree Index on (course_id)`,
    relatedConceptIds: ['dbms_u1_er_model', 'dbms_u1_relational_model', 'dbms_u1_three_schema'],
    practiceQuestions: [
      {
        id: 'pq_u1_8_1',
        difficulty: 'beginner',
        prompt: 'What is the difference between a database schema and a database instance?',
        hint: 'One is the blueprint; the other is the current contents.',
        answer: 'A schema is the structural description (tables, columns, types) that rarely changes; an instance is the actual set of rows stored at a specific instant in time.',
      },
    ],
    practicePrompt: 'Why did the Relational Model replace Hierarchical and Network models for general enterprise applications?',
  },
  {
    id: 'dbms_u1_er_model',
    unitNumber: 1,
    code: '1.9',
    title: 'Entity Relationship Model',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'The Entity-Relationship (ER) model is a high-level conceptual blueprint that describes a system using Entities (objects), Attributes (properties), and Relationships (associations).',
    detailedExplanation:
      'Introduced by Peter Chen (1976), the ER model lets database designers collaborate with stakeholders before writing any SQL DDL. It models real-world things as entity types (Student, Course, Instructor), characterizes them with attributes, and links them via relationship types (Enrolls, Teaches). Extended ER (EER) adds inheritance (superclass/subclass specialization and generalization) and union categories.',
    summaryEn:
      'Conceptual modeling framework capturing domain entities, descriptive attributes, and typed relationships prior to relational mapping.',
    summaryKn:
      'ER ಮಾದರಿಯು SQL ಕೋಷ್ಟಕಗಳನ್ನು ರಚಿಸುವ ಮುನ್ನ Entities, Attributes ಮತ್ತು Relationships ಮೂಲಕ ವ್ಯವಸ್ಥೆಯ ನೀಲನಕ್ಷೆಯನ್ನು ತಯಾರಿಸುತ್ತದೆ.',
    realWorldExample:
      'Before building a hospital app, analysts model Patient, Doctor, Appointment, and Prescription as ER entities so billing and scheduling teams agree on business rules early.',
    definitions: [
      { term: 'Entity Type', definition: 'A category of distinguishable objects sharing the same attributes (e.g., Student).' },
      { term: 'Entity Set', definition: 'The collection of all current entity instances of a given entity type.' },
      { term: 'EER Model', definition: 'Extended ER adding specialization, generalization, and disjoint/completeness constraints.' },
    ],
    learningObjectives: [
      'Model a real-world problem statement using ER entity types and relationships.',
      'Differentiate entity type (blueprint) from entity set (current instances).',
      'Identify when EER subclassing is needed (e.g., Person → Student, Faculty).',
    ],
    difficultyLevels: {
      beginner: 'Entities = Nouns (Student, Course); Relationships = Verbs (Enrolls, Teaches); Attributes = Adjectives (Name, Credits).',
      intermediate: 'Translate a 1-paragraph business specification into complete ER constructs including keys and participation constraints.',
      advanced: 'Apply EER specialization rules (disjoint vs. overlapping, total vs. partial) and map inheritance to single-table, class-table, or concrete-table relational designs.',
    },
    keyTakeaways: [
      'Bridges non-technical stakeholders and SQL schema architects.',
      'Focuses on domain semantics without worrying about indexes or storage.',
      'Directly translates into normalized relational tables via 7-step ER-to-Relational mapping.',
    ],
    codeOrDiagramTitle: 'ER Conceptual Modeling Pattern',
    codeOrDiagram: `(DEPARTMENT) ──[1]──< OFFERS >──[N]── (COURSE)
     |                                    |
   dept_id (PK)                       course_id (PK)`,
    relatedConceptIds: ['dbms_u1_entities_attributes', 'dbms_u1_relationships_cardinality', 'dbms_u1_er_diagrams'],
    practiceQuestions: [
      {
        id: 'pq_u1_9_1',
        difficulty: 'beginner',
        prompt: 'In an ER model of a library, identify two Entities, two Attributes, and one Relationship.',
        hint: 'Look for nouns for entities and verbs for relationships.',
        answer: 'Entities: Member, Book. Attributes: member_id, isbn, title. Relationship: Borrows (Member borrows Book with borrow_date).',
      },
    ],
    practicePrompt: 'Why do designers create an ER model before writing CREATE TABLE statements?',
  },
  {
    id: 'dbms_u1_entities_attributes',
    unitNumber: 1,
    code: '1.10',
    title: 'Entities and Attributes',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Entities can be Strong (independent key) or Weak (dependent on an owner), while Attributes can be simple, composite, single-valued, multi-valued, or derived.',
    detailedExplanation:
      'A Strong Entity possesses its own key attribute (e.g., student_id), whereas a Weak Entity lacks an independent key and relies on a partial key (discriminator) combined with its identifying owner’s primary key (e.g., AssessmentQuestion identified within an Assessment, or Dependent within Employee). Attributes divide into: Simple vs. Composite (Address → Street, City, Pin), Single-valued vs. Multi-valued ({PhoneNumbers}), Stored vs. Derived (Age from DateOfBirth), and Key attributes.',
    summaryEn:
      'Distinguishes Strong vs. Weak entities and classifies Simple, Composite, Multi-valued, Stored, and Derived attributes.',
    summaryKn:
      'Strong ಮತ್ತು Weak Entities ಹಾಗೂ Simple, Composite, Multi-valued ಮತ್ತು Derived ಗುಣಲಕ್ಷಣಗಳ (Attributes) ನಡುವಿನ ವ್ಯತ್ಯಾಸವನ್ನು ವಿವರಿಸುತ್ತದೆ.',
    realWorldExample:
      'A student’s DateOfBirth is a stored attribute, Age is a derived attribute, FullName (First, Last) is composite, and multiple phone numbers are a multi-valued attribute (which becomes a separate table in 1NF).',
    definitions: [
      { term: 'Strong Entity', definition: 'Entity type with its own unique primary key attribute.' },
      { term: 'Weak Entity', definition: 'Entity type whose existence and identification depend on an identifying strong owner entity.' },
      { term: 'Multi-valued Attribute', definition: 'Attribute that can hold multiple values for one entity (requires a separate relation in 1NF).' },
    ],
    learningObjectives: [
      'Classify any domain attribute as simple/composite, single/multi-valued, or stored/derived.',
      'Identify weak entities and their partial key (discriminator).',
      'Map composite and multi-valued attributes accurately into relational columns or tables.',
    ],
    difficultyLevels: {
      beginner: 'Strong entities stand alone; Weak entities need a parent (like a Hotel Room needing a Hotel).',
      intermediate: 'Always convert multi-valued attributes into a separate child table with (parent_fk, value) as composite PK.',
      advanced: 'Decide when to materialize derived attributes vs. computing them in SQL views to avoid stale read anomalies.',
    },
    keyTakeaways: [
      'Weak entities always have total participation in their identifying relationship.',
      'Composite attributes flatten into individual atomic columns in relational tables.',
      'Multi-valued attributes become separate tables to satisfy 1NF.',
    ],
    codeOrDiagramTitle: 'Weak Entity & Multi-Valued Mapping',
    codeOrDiagram: `-- Weak Entity SECTION(course_id FK, section_no)
CREATE TABLE course_sections (
  course_id  VARCHAR(16) REFERENCES courses(id) ON DELETE CASCADE,
  section_no INT NOT NULL,
  room_code  VARCHAR(20),
  PRIMARY KEY (course_id, section_no)
);`,
    relatedConceptIds: ['dbms_u1_er_model', 'dbms_u1_er_diagrams', 'dbms_u3_1nf'],
    practiceQuestions: [
      {
        id: 'pq_u1_10_1',
        difficulty: 'intermediate',
        prompt: 'How is a multi-valued attribute such as Student.skills mapped into the Relational Model?',
        hint: 'Remember that relational cells cannot store lists in 1NF.',
        answer: 'Create a new table student_skills(student_uid, skill_name) with a composite primary key (student_uid, skill_name) and foreign key referencing students(uid).',
      },
    ],
    practicePrompt: 'Explain why a weak entity must have total participation in its identifying relationship.',
  },
  {
    id: 'dbms_u1_relationships_cardinality',
    unitNumber: 1,
    code: '1.11',
    title: 'Relationships and Cardinality',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Relationships link entities with structural constraints: Cardinality ratios (1:1, 1:N, M:N) and Participation constraints (Total vs. Partial).',
    detailedExplanation:
      'A relationship type has a degree (unary/recursive like Employee manages Employee, binary, or ternary). Its structural constraints govern instance counts: Cardinality Ratio specifies maximum participation (1:1, 1:N, M:N), while Participation (min-max) specifies minimum participation—Total (mandatory, minimum 1) vs. Partial (optional, minimum 0). Relationships can also carry descriptive attributes (e.g., enrolled_at or grade on Enrolls).',
    summaryEn:
      'Defines relationship degree, 1:1 / 1:N / M:N cardinality ratios, total vs. partial participation, and descriptive relationship attributes.',
    summaryKn:
      'ಸಂಬಂಧಗಳ Degree, Cardinality ಅನುಪಾತಗಳು (1:1, 1:N, M:N) ಮತ್ತು Total/Partial participation ನಿಯಮಗಳನ್ನು ವಿವರಿಸುತ್ತದೆ.',
    realWorldExample:
      'One Teacher teaches many Classrooms (1:N), while Students and Classrooms have an M:N relationship (each student joins many classes; each class holds many students). Every Classroom must have a teacher (Total participation).',
    definitions: [
      { term: 'Cardinality Ratio', definition: 'Maximum number of relationship instances an entity can participate in (1:1, 1:N, M:N).' },
      { term: 'Total Participation', definition: 'Every entity instance must participate in at least one relationship (shown as double line).' },
      { term: 'Recursive Relationship', definition: 'Relationship where the same entity type participates in different roles (e.g., Course prerequisite Course).' },
    ],
    learningObjectives: [
      'Determine 1:1, 1:N, and M:N cardinalities from business requirements.',
      'Distinguish total (mandatory) participation from partial (optional) participation.',
      'Map 1:1, 1:N, and M:N relationships correctly into foreign keys or junction tables.',
    ],
    difficultyLevels: {
      beginner: '1:N means "one parent, many children"; M:N means "many on both sides, requiring a middle link table".',
      intermediate: 'Place the FK on the N-side for 1:N relationships; create a junction table with both FKs for M:N relationships.',
      advanced: 'Understand why ternary relationships (Supplier-Part-Project) cannot always be decomposed losslessly into three binary relationships.',
    },
    keyTakeaways: [
      '1:N adds a foreign key to the N-side table.',
      'M:N always generates a new associative/junction table.',
      'Total participation corresponds to NOT NULL on the foreign key column.',
    ],
    codeOrDiagramTitle: 'ER Cardinality to Foreign Key Rules',
    codeOrDiagram: `1 : 1  -> Merge or place FK on Total-participation side (with UNIQUE)
1 : N  -> Place parent PK as FK inside the N-side table
M : N  -> New junction table J(A_pk FK, B_pk FK, rel_attrs..., PK(A_pk, B_pk))`,
    relatedConceptIds: ['dbms_u1_er_diagrams', 'dbms_u1_pk_fk', 'dbms_u2_self_join'],
    practiceQuestions: [
      {
        id: 'pq_u1_11_1',
        difficulty: 'intermediate',
        prompt: 'In a 1:N relationship "Department employs Professor", which table receives the foreign key?',
        hint: 'Avoid multi-valued lists inside Department.',
        answer: 'The Professor (N-side) table receives dept_id as a Foreign Key referencing Department(dept_id).',
      },
    ],
    practicePrompt: 'Explain how (min, max) notation captures both cardinality and total/partial participation simultaneously.',
  },
  {
    id: 'dbms_u1_er_diagrams',
    unitNumber: 1,
    code: '1.12',
    title: 'ER Diagrams',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'ER Diagrams (Chen and Crow’s Foot notations) visually draw entities, attributes, keys, weak entities, and cardinality rules as a readable system map.',
    detailedExplanation:
      'In classical Chen notation, rectangles denote Strong Entities, double rectangles denote Weak Entities, diamonds denote Relationships (double diamonds for identifying relationships), ovals denote Attributes (underlined for Key, dashed-underlined for Partial Key, double-ovals for Multi-valued, dashed ovals for Derived), and double lines indicate Total Participation. Modern engineering tools also use Crow’s Foot (IE) notation showing 0..1, 1..1, 0..*, and 1..* directly on connectors.',
    summaryEn:
      'Standard Chen and Crow’s Foot diagrammatic conventions for representing entities, keys, attributes, weak entities, and participation.',
    summaryKn:
      'Chen ಮತ್ತು Crow’s Foot ಚಿಹ್ನೆಗಳನ್ನು ಬಳಸಿ Entity, Key, Weak Entity ಮತ್ತು Cardinality ಗಳನ್ನು ಚಿತ್ರಾತ್ಮಕವಾಗಿ ತೋರಿಸುವ ವಿಧಾನ.',
    realWorldExample:
      'Architects sketch a Crow’s Foot ER diagram in design reviews so backend engineers, product managers, and QA testers agree on table relationships before running database migrations.',
    definitions: [
      { term: 'Double Rectangle', definition: 'Chen notation symbol representing a Weak Entity type.' },
      { term: 'Double Line', definition: 'Indicates Total (mandatory) participation of an entity in a relationship.' },
      { term: 'Crow’s Foot Notation', definition: 'Compact industrial ER style using ticks (|), circles (o), and crows-feet (<) for min/max cardinality.' },
    ],
    learningObjectives: [
      'Read and draw standard Chen ER symbols accurately.',
      'Convert between Chen notation and Crow’s Foot cardinality symbols.',
      'Execute the step-by-step algorithm to translate an ER diagram into SQL DDL.',
    ],
    difficultyLevels: {
      beginner: 'Learn the 4 core shapes: Rectangle = Entity, Oval = Attribute, Diamond = Relationship, Underline = Primary Key.',
      intermediate: 'Translate a complete multi-entity ER diagram (with weak entities and M:N relationships) into valid CREATE TABLE DDL.',
      advanced: 'Spot subtle modeling bugs in ER diagrams such as redundant transitive relationships or misplaced attributes on the wrong entity.',
    },
    keyTakeaways: [
      'Consistent visual notation prevents ambiguity during schema design.',
      'Every M:N diamond becomes a junction table in SQL.',
      'Double lines translate to NOT NULL constraints on foreign keys.',
    ],
    codeOrDiagramTitle: 'Chen vs. Crow’s Foot Symbol Reference',
    codeOrDiagram: `Chen Symbol          Meaning
-----------          -------
[ Entity ]           Strong Entity
[[ Weak ]]           Weak Entity
< Rel >              Relationship
( attr ) / ( _pk_ )  Attribute / Primary Key
(( multi ))          Multi-valued Attribute
==========           Total Participation`,
    relatedConceptIds: ['dbms_u1_er_model', 'dbms_u1_entities_attributes', 'dbms_u1_relational_model'],
    practiceQuestions: [
      {
        id: 'pq_u1_12_1',
        difficulty: 'beginner',
        prompt: 'In a Chen ER diagram, what does a double oval around an attribute represent?',
        hint: 'Think about storing multiple email addresses or phone numbers.',
        answer: 'A multi-valued attribute (one entity instance can possess multiple values for that attribute).',
      },
    ],
    practicePrompt: 'Draw and explain the ER-to-Relational conversion of a Strong Entity, a Weak Entity, and an M:N Relationship.',
  },
  {
    id: 'dbms_u1_relational_model',
    unitNumber: 1,
    code: '1.13',
    title: 'Relational Data Model',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'Proposed by E.F. Codd, the Relational Data Model represents all data as mathematical relations (tables) made of unordered rows (tuples) and atomic columns (attributes).',
    detailedExplanation:
      'In the formal Relational Model, a Relation Schema R(A1, A2, ..., An) specifies a relation name R and attribute list with domains dom(Ai). A Relation Instance r(R) is a mathematical set of n-tuples (so duplicate rows are disallowed in pure relations, row order is irrelevant, and column order does not alter semantics). Each attribute value must be atomic (indivisible) or the special marker NULL meaning unknown or inapplicable.',
    summaryEn:
      'Organizes data mathematically into relations, tuples, attributes, and domains with atomic values and unordered set semantics.',
    summaryKn:
      'ರಿಲೇಶನಲ್ ಮಾದರಿಯಲ್ಲಿ ಡೇಟಾವನ್ನು Relations (ಕೋಷ್ಟಕಗಳು), Tuples (ಸಾಲುಗಳು) ಮತ್ತು Attributes (ಕಾಲಮ್‌ಗಳು) ಆಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ.',
    realWorldExample:
      'A `students` table with columns (uid, name, email, roll_no) has degree 4. If 120 students are enrolled today, its cardinality is 120; shuffling row order on disk never alters query answers unless ORDER BY is requested.',
    definitions: [
      { term: 'Relation / Table', definition: 'A set of homogeneous tuples conforming to schema R(A1..An).' },
      { term: 'Degree (Arity)', definition: 'Total number of attributes (columns) in a relation schema.' },
      { term: 'Cardinality', definition: 'Current number of tuples (rows) in a relation instance.' },
    ],
    learningObjectives: [
      'Define relation, tuple, attribute, domain, degree, and cardinality precisely.',
      'Explain why tuple ordering and duplicate rows do not exist in pure relational theory.',
      'Describe how SQL treats NULL using three-valued logic (TRUE, FALSE, UNKNOWN).',
    ],
    difficultyLevels: {
      beginner: 'Relation = Table, Tuple = Row, Attribute = Column, Degree = Column count, Cardinality = Row count.',
      intermediate: 'Understand why SQL tables allow duplicate rows (multisets/bags) unless a PRIMARY KEY or DISTINCT is enforced.',
      advanced: 'Reason carefully about NULL propagation in SQL three-valued logic (e.g., `x = NULL` evaluates to UNKNOWN, requiring `IS NULL`).',
    },
    keyTakeaways: [
      'Values in every cell must be atomic (foundation of 1NF).',
      'Row order has no semantic meaning without ORDER BY.',
      'Backed directly by Relational Algebra and predicate calculus.',
    ],
    codeOrDiagramTitle: 'Relational Schema vs. Instance Anatomy',
    codeOrDiagram: `Schema:    Assessment(id: TEXT, title: TEXT, duration_min: INT)  -> Degree = 3
Instance:  { ('a1', 'DBMS Midterm', 45), ('a2', 'SQL Lab', 30) } -> Cardinality = 2`,
    relatedConceptIds: ['dbms_u1_pk_fk', 'dbms_u1_candidate_super_keys', 'dbms_u2_relational_algebra'],
    practiceQuestions: [
      {
        id: 'pq_u1_13_1',
        difficulty: 'beginner',
        prompt: 'A table has 6 columns and 250 rows. What are its degree and cardinality?',
        hint: 'Degree counts columns; cardinality counts rows.',
        answer: 'Degree (arity) = 6; Cardinality = 250.',
      },
    ],
    practicePrompt: 'Why does `WHERE marks = NULL` fail in SQL, and what operator must be used instead?',
  },
  {
    id: 'dbms_u1_pk_fk',
    unitNumber: 1,
    code: '1.14',
    title: 'Primary Keys and Foreign Keys',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'A Primary Key uniquely identifies every row in its own table (never NULL), while a Foreign Key references another table’s Primary Key to connect tables safely.',
    detailedExplanation:
      'Among a relation’s Candidate Keys, the designer chooses one as the Primary Key (PK), which cannot contain NULL values (Entity Integrity). A Foreign Key (FK) is an attribute (or composite set) in a referencing table whose non-null values must match an existing Primary Key (or Unique Key) value in a referenced parent table (Referential Integrity). Referential actions (ON DELETE CASCADE, RESTRICT, SET NULL) dictate what happens when a parent row is deleted or updated.',
    summaryEn:
      'Primary Keys guarantee unique non-null row identity; Foreign Keys enforce cross-table links with configurable CASCADE/RESTRICT actions.',
    summaryKn:
      'Primary Key ಪ್ರತಿ ಸಾಲನ್ನು ಅನನ್ಯವಾಗಿ ಗುರುತಿಸುತ್ತದೆ; Foreign Key ಕೋಷ್ಟಕಗಳ ನಡುವೆ ಸುರಕ್ಷಿತ ಸಂಬಂಧವನ್ನು (Referential Integrity) ನಿರ್ವಹಿಸುತ್ತದೆ.',
    realWorldExample:
      'In `submissions(id, assessment_id, student_uid)`, `id` is the Primary Key, while `assessment_id` and `student_uid` are Foreign Keys ensuring no orphan submission can exist for a non-existent test or student.',
    definitions: [
      { term: 'Primary Key', definition: 'Chosen candidate key uniquely identifying each tuple; automatically NOT NULL and UNIQUE.' },
      { term: 'Foreign Key', definition: 'Column(s) in a child table referencing a parent table’s Primary/Unique key.' },
      { term: 'Referential Actions', definition: 'CASCADE, RESTRICT/NO ACTION, SET NULL, or SET DEFAULT executed on parent delete/update.' },
    ],
    learningObjectives: [
      'Choose clean surrogate vs. natural Primary Keys.',
      'Declare Foreign Keys with ON DELETE CASCADE vs. RESTRICT appropriately.',
      'Explain why referencing a non-UNIQUE column as a Foreign Key is invalid.',
    ],
    difficultyLevels: {
      beginner: 'Primary Key = your unique Student Roll ID; Foreign Key = writing your Roll ID on an exam paper to link it to you.',
      intermediate: 'Know when to use ON DELETE RESTRICT (protect historical financial/exam records) vs. ON DELETE CASCADE (clean up child notes).',
      advanced: 'Analyze B+-Tree index benefits on Foreign Keys to avoid full child-table scans during parent DELETE checks.',
    },
    keyTakeaways: [
      'A table has at most one Primary Key (which may be composite across multiple columns).',
      'Foreign Keys can be NULL unless marked NOT NULL (representing optional relationships).',
      'Referential actions prevent dangling orphan pointers.',
    ],
    codeOrDiagramTitle: 'Primary & Foreign Key SQL DDL',
    codeOrDiagram: `CREATE TABLE assessments (
  id           VARCHAR(64) PRIMARY KEY,
  classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  title        VARCHAR(160) NOT NULL
);`,
    relatedConceptIds: ['dbms_u1_candidate_super_keys', 'dbms_u1_integrity_constraints', 'dbms_u2_joins'],
    practiceQuestions: [
      {
        id: 'pq_u1_14_1',
        difficulty: 'intermediate',
        prompt: 'What happens if you try to delete a Classroom referenced by Submissions with ON DELETE RESTRICT?',
        hint: 'RESTRICT protects referenced parent records.',
        answer: 'The DBMS rejects the DELETE with a referential integrity violation error until child submissions are handled.',
      },
    ],
    practicePrompt: 'Compare ON DELETE CASCADE and ON DELETE SET NULL with real-world university examples.',
  },
  {
    id: 'dbms_u1_candidate_super_keys',
    unitNumber: 1,
    code: '1.15',
    title: 'Candidate Keys and Super Keys',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'A Super Key is any set of columns that uniquely identifies a row; a Candidate Key is a minimal Super Key with no unnecessary extra columns.',
    detailedExplanation:
      'Formally, subset K of relation R is a Super Key if no two distinct tuples can ever share identical K-values (equivalently, K+ = R under functional dependencies). Removing redundant attributes from a Super Key produces a Candidate Key—a minimal Super Key where removing ANY single attribute destroys uniqueness. One Candidate Key becomes the Primary Key, and remaining Candidate Keys are Alternate Keys.',
    summaryEn:
      'Defines Super Keys, minimal Candidate Keys, Primary vs. Alternate Keys, and Prime vs. Non-Prime attributes.',
    summaryKn:
      'Super Key, ಕನಿಷ್ಠ ಗುಣಲಕ್ಷಣಗಳಿರುವ Candidate Key, Alternate Key ಮತ್ತು Prime Attribute ಗಳ ನಡುವಿನ ವ್ಯತ್ಯಾಸವನ್ನು ವಿವರಿಸುತ್ತದೆ.',
    realWorldExample:
      'In `Students(uid, roll_no, email, name)`, `{uid}`, `{roll_no}`, and `{email}` are minimal Candidate Keys; `{uid, name}` is a Super Key (unique, but `name` is redundant, so it is NOT a Candidate Key).',
    definitions: [
      { term: 'Super Key', definition: 'Any non-empty attribute subset K whose closure K+ determines all attributes of R.' },
      { term: 'Candidate Key', definition: 'A minimal Super Key: no proper subset of K is also a Super Key.' },
      { term: 'Prime Attribute', definition: 'Any attribute that belongs to at least one Candidate Key of R.' },
    ],
    learningObjectives: [
      'Distinguish Super Keys, Candidate Keys, Primary Keys, and Alternate Keys.',
      'Test minimality to prove an attribute set is a Candidate Key.',
      'Identify Prime vs. Non-Prime attributes (essential for 2NF/3NF proofs).',
    ],
    difficultyLevels: {
      beginner: 'Every Candidate Key is a Super Key, just like every minimal VIP pass is a valid pass—but adding extra useless badges still works as a Super Key, not a Candidate Key.',
      intermediate: 'Always inspect functional dependencies rather than a sample table snapshot before declaring a key!',
      advanced: 'Prove key minimality formally using attribute closure: K is a Candidate Key iff K+ = R and for every A in K, (K - {A})+ != R.',
    },
    keyTakeaways: [
      'A relation can have multiple Candidate Keys (all minimal).',
      'Alternate Keys are implemented in SQL via UNIQUE constraints.',
      'Prime attributes determine 2NF and 3NF exceptions.',
    ],
    codeOrDiagramTitle: 'Key Hierarchy & SQL Alternate Keys',
    codeOrDiagram: `Super Keys:     {uid, name}, {uid, email}, {uid}, {roll_no}, {email}
Candidate Keys: {uid}, {roll_no}, {email}   (all minimal!)
Primary Key:    {uid}
Alternate Keys: {roll_no}, {email}          -> SQL: UNIQUE(roll_no), UNIQUE(email)`,
    relatedConceptIds: ['dbms_u1_pk_fk', 'dbms_u3_candidate_key_id', 'dbms_u3_attribute_closure'],
    practiceQuestions: [
      {
        id: 'pq_u1_15_1',
        difficulty: 'intermediate',
        prompt: 'Is {student_uid, student_name} a Candidate Key if student_uid alone is already unique?',
        hint: 'Check minimality: what happens if you remove student_name?',
        answer: 'No. Because {student_uid} is a proper subset that already uniquely identifies rows, {student_uid, student_name} is a Super Key but NOT minimal, hence not a Candidate Key.',
      },
    ],
    practicePrompt: 'Explain why you cannot determine Candidate Keys reliably by inspecting only five sample rows.',
  },
  {
    id: 'dbms_u1_integrity_constraints',
    unitNumber: 1,
    code: '1.16',
    title: 'Integrity Constraints',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Integrity constraints are database-enforced rules—Domain, Key, Entity Integrity, Referential Integrity, and Semantic checks—that prevent invalid data from ever being saved.',
    detailedExplanation:
      'Integrity constraints guarantee that valid state transitions preserve database correctness. Domain constraints restrict column values to atomic types and ranges (NOT NULL, CHECK). Key constraints prohibit duplicate Candidate Key tuples. Entity Integrity forbids NULL values in any Primary Key attribute. Referential Integrity ensures Foreign Keys match existing parent keys. Semantic/Business constraints (CHECK, triggers, assertions) enforce cross-column or multi-table invariants.',
    summaryEn:
      'Covers Domain, Key, Entity Integrity, Referential Integrity, and Semantic CHECK constraints enforced automatically on every write.',
    summaryKn:
      'Domain, Key, Entity Integrity, Referential Integrity ಮತ್ತು CHECK ನಿಯಮಗಳು ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ತಪ್ಪು ಮೌಲ್ಯಗಳು ಸೇರದಂತೆ ತಡೆಯುತ್ತವೆ.',
    realWorldExample:
      'In an exam database, CHECK (score >= 0 AND score <= max_score) prevents impossible 120/100 scores, while Entity Integrity ensures no submission row lacks a valid Primary Key.',
    definitions: [
      { term: 'Domain Constraint', definition: 'Restricts attribute values to valid data types, formats, or CHECK ranges.' },
      { term: 'Entity Integrity', definition: 'No Primary Key attribute can ever hold a NULL value.' },
      { term: 'Referential Integrity', definition: 'A tuple in one relation referencing another must point to an existing tuple (or be NULL).' },
    ],
    learningObjectives: [
      'Define Domain, Key, Entity, and Referential Integrity constraints.',
      'Write SQL constraints (NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK).',
      'Predict which DML operations (INSERT, UPDATE, DELETE) can violate each constraint.',
    ],
    difficultyLevels: {
      beginner: 'Think of Integrity Constraints as automated bouncers at the database door rejecting bad dates, negative marks, or broken links.',
      intermediate: 'Know that INSERT can violate all four constraint categories, while DELETE mainly triggers Referential Integrity checks on child rows.',
      advanced: 'Understand deferred constraints (DEFERRABLE INITIALLY DEFERRED) for mutually referencing cycles committed at transaction end.',
    },
    keyTakeaways: [
      'Entity Integrity applies strictly to Primary Key columns (never NULL).',
      'Referential Integrity links child Foreign Keys to parent Candidate/Primary Keys.',
      'Centralized constraints protect data regardless of which client writes.',
    ],
    codeOrDiagramTitle: 'All Integrity Constraints in One Table',
    codeOrDiagram: `CREATE TABLE submissions (
  id            VARCHAR(64) PRIMARY KEY,              -- Key + Entity Integrity
  student_uid   VARCHAR(64) NOT NULL REFERENCES users(uid), -- Referential
  score         NUMERIC(5,2) NOT NULL CHECK (score >= 0),   -- Domain
  max_score     NUMERIC(5,2) NOT NULL CHECK (max_score > 0),
  CHECK (score <= max_score)                                -- Tuple Semantic
);`,
    relatedConceptIds: ['dbms_u1_pk_fk', 'dbms_u2_sql_constraints', 'dbms_u3_anomalies'],
    practiceQuestions: [
      {
        id: 'pq_u1_16_1',
        difficulty: 'intermediate',
        prompt: 'Which operations—INSERT, DELETE, or UPDATE—can violate Referential Integrity?',
        hint: 'Consider deleting a parent row or inserting a bad child foreign key.',
        answer: 'All three! INSERT on child (invalid FK), UPDATE on child FK or parent PK, and DELETE on a referenced parent row.',
      },
    ],
    practicePrompt: 'Distinguish Entity Integrity from Referential Integrity with concrete failure scenarios.',
  },
];
