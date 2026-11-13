import type { DbmsChapter } from './dbmsCurriculumTypes';

export const DBMS_UNIT_4_CHAPTERS: DbmsChapter[] = [
  {
    id: 'dbms_u4_transactions',
    unitNumber: 4,
    code: '4.1',
    title: 'Transaction Concepts',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'A Transaction is a single logical unit of work—containing one or more SQL reads and writes—that must either complete completely or leave the database completely unchanged.',
    detailedExplanation:
      'Applications execute business workflows as sequences of `read_item(X)` and `write_item(X)` operations wrapped between `BEGIN TRANSACTION` and `COMMIT` or `ROLLBACK`. A transaction must be all-or-nothing even if hundreds of concurrent clients access overlapping tables simultaneously or if the server crashes midway through execution.',
    summaryEn:
      'Models logical units of database execution (`BEGIN ... COMMIT/ROLLBACK`) abstracting `read(X)` and `write(X)` schedules.',
    summaryKn:
      'Transaction ಎಂಬುದು ಒಂದೇ ತಾರ್ಕಿಕ ಕಾರ್ಯಘಟಕವಾಗಿದ್ದು, ಸಂಪೂರ್ಣವಾಗಿ ಯಶಸ್ವಿಯಾಗಬೇಕು (COMMIT) ಅಥವಾ ಸಂಪೂರ್ಣವಾಗಿ ರದ್ದಾಗಬೇಕು (ROLLBACK).',
    realWorldExample:
      'Submitting an exam in LearnSense locks the attempt, writes the submission record, and creates a teacher notification inside an atomic workflow—if locking fails due to duplicate attempt, nothing is saved.',
    definitions: [
      { term: 'Transaction (T_i)', definition: 'Indivisible sequence of database operations preserving database consistency.' },
      { term: 'Schedule (History)', definition: 'Chronological execution order of interleaved operations from concurrent transactions.' },
    ],
    learningObjectives: [
      'Explain why multi-statement workflows must execute as transactions.',
      'Model transactions formally using `R_i(X)`, `W_i(X)`, `C_i`, and `A_i` operations.',
      'Explain why concurrent interleaving improves throughput yet creates anomalies if uncontrolled.',
    ],
    difficultyLevels: {
      beginner: 'A transaction is like an online payment checkout: deduct money AND confirm ticket together, never half-way.',
      intermediate: 'Trace interleaved schedules `R1(A), W1(A), R2(A), W2(A)` to spot lost updates and dirty reads.',
      advanced: 'Understand savepoints (`SAVEPOINT sp`), nested sub-transactions, and distributed 2PC coordination.',
    },
    keyTakeaways: [
      'A schedule interleaves multiple transactions to keep CPU and disk I/O busy.',
      'Without concurrency control, interleaving causes Lost Update, Dirty Read, and Unrepeatable Read.',
      'COMMIT makes updates permanent; ROLLBACK undoes all writes of the transaction.',
    ],
    codeOrDiagramTitle: 'Lost Update Anomaly Without Transaction Isolation',
    codeOrDiagram: `T1 (Add 10 seats)          T2 (Add 5 seats)
READ(seats=40)
                           READ(seats=40)
seats = 50; WRITE(50)
                           seats = 45; WRITE(45)  <-- T1's +10 LOST!`,
    relatedConceptIds: ['dbms_u4_acid', 'dbms_u4_states', 'dbms_u4_concurrency'],
    practiceQuestions: [
      {
        id: 'pq_u4_1_1',
        difficulty: 'beginner',
        prompt: 'Why does a DBMS interleave concurrent transactions instead of running every transaction one after another serially?',
        hint: 'Think about slow disk/network wait times.',
        answer: 'Interleaving keeps the CPU productive on Transaction 2 while Transaction 1 waits on disk I/O or client round-trips, dramatically increasing throughput.',
      },
    ],
    practicePrompt: 'Illustrate a Dirty Read anomaly between two interleaved transactions T1 and T2.',
  },
  {
    id: 'dbms_u4_acid',
    unitNumber: 4,
    code: '4.2',
    title: 'ACID Properties',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'ACID stands for Atomicity (all-or-nothing), Consistency (valid invariants), Isolation (concurrent transactions don’t corrupt each other), and Durability (committed data survives crashes).',
    detailedExplanation:
      'Each ACID letter maps to a distinct DBMS subsystem: (1) Atomicity is guaranteed by the Recovery Manager (WAL UNDO logs); (2) Consistency is preserved by DBMS constraints + correct application logic taking one consistent state to another; (3) Isolation is enforced by the Concurrency Control Manager (2PL locking or MVCC snapshots) preventing Dirty Reads, Non-Repeatable Reads, and Phantom Reads; (4) Durability is guaranteed by flushing Commit log records to non-volatile storage before acknowledging success.',
    summaryEn:
      'Defines Atomicity, Consistency, Isolation, and Durability along with the exact DBMS subsystem responsible for each.',
    summaryKn:
      'ACID ಗುಣಲಕ್ಷಣಗಳು: Atomicity (ಸಂಪೂರ್ಣ ಅಥವಾ ಏನೂ ಇಲ್ಲ), Consistency (ನಿಯಮ ಪಾಲನೆ), Isolation (ಪ್ರತ್ಯೇಕತೆ) ಮತ್ತು Durability (ಸ್ಥಿರತೆ).',
    realWorldExample:
      'When transferring ₹2,000 from Savings to Checking, Atomicity ensures neither half occurs alone, Consistency keeps total bank balance unchanged, Isolation hides half-finished balances from audits, and Durability survives immediate power failure after COMMIT.',
    definitions: [
      { term: 'Atomicity', definition: 'Either 100% of a transaction’s operations apply or 0% apply.' },
      { term: 'Isolation', definition: 'Concurrent execution yields the same effect as some serial order.' },
      { term: 'Durability', definition: 'Once COMMIT returns success, updates persist across power/OS crashes.' },
    ],
    learningObjectives: [
      'Map each ACID property to the DBMS manager that enforces it.',
      'Differentiate Read Uncommitted, Read Committed, Repeatable Read, and Serializable isolation levels.',
      'Identify Dirty Read, Non-Repeatable Read, and Phantom Read anomalies.',
    ],
    difficultyLevels: {
      beginner: 'Memorize: A = All-or-nothing, C = Constraints hold, I = Invisible until done, D = Disk-safe forever.',
      intermediate: 'Know SQL’s 4 isolation levels and which anomalies (Dirty, Non-Repeatable, Phantom) each prevents.',
      advanced: 'Analyze Snapshot Isolation (MVCC) and why Write Skew requires Serializable Snapshot Isolation (SSI) to prevent.',
    },
    keyTakeaways: [
      'Recovery Manager enforces Atomicity & Durability.',
      'Concurrency Manager enforces Isolation.',
      'Constraints + transaction logic maintain Consistency.',
    ],
    codeOrDiagramTitle: 'SQL Isolation Levels vs. Anomalies',
    codeOrDiagram: `Isolation Level    Dirty Read   Non-Repeatable   Phantom Read
---------------    ----------   --------------   ------------
Read Uncommitted   Possible     Possible         Possible
Read Committed     Prevented    Possible         Possible
Repeatable Read    Prevented    Prevented        Possible (in strict SQL)
Serializable       Prevented    Prevented        Prevented`,
    relatedConceptIds: ['dbms_u4_transactions', 'dbms_u4_serializability', 'dbms_u4_log_recovery'],
    practiceQuestions: [
      {
        id: 'pq_u4_2_1',
        difficulty: 'intermediate',
        prompt: 'What distinguishes a Phantom Read from a Non-Repeatable Read?',
        hint: 'UPDATE existing row vs. INSERT/DELETE matching range.',
        answer: 'Non-Repeatable Read sees an existing row’s value change on re-read; Phantom Read sees brand-new rows appear or vanish in a `WHERE` range query due to another transaction’s INSERT/DELETE.',
      },
    ],
    practicePrompt: 'Explain which DBMS subsystems enforce Atomicity, Isolation, and Durability.',
  },
  {
    id: 'dbms_u4_states',
    unitNumber: 4,
    code: '4.3',
    title: 'Transaction States',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'Every transaction progresses through five states—Active, Partially Committed, Committed, Failed, and Aborted—before terminating cleanly.',
    detailedExplanation:
      'A transaction enters the **Active** state while executing reads and writes. Upon executing its final statement, it enters **Partially Committed**, where modified pages may still sit in volatile memory buffers. Once the Recovery Manager flushes the COMMIT log record safely to stable disk, it transitions permanently to **Committed**. If a runtime error, constraint violation, deadlock abort, or crash strikes during Active or Partially Committed, it moves to **Failed**, rolls back all writes via UNDO records, and terminates as **Aborted**.',
    summaryEn:
      'Tracks the finite state machine of a transaction across Active, Partially Committed, Committed, Failed, and Aborted states.',
    summaryKn:
      'ಪ್ರತಿಯೊಂದು Transaction ಸಹ Active, Partially Committed, Committed, Failed ಮತ್ತು Aborted ಎಂಬ ಐದು ಹಂತಗಳ ಮೂಲಕ ಸಾಗುತ್ತದೆ.',
    realWorldExample:
      'If a power outage occurs right after the final `UPDATE` (Partially Committed) before WAL flush completes, the DBMS detects no COMMIT log entry on reboot, marks it Failed, and rolls back to Aborted.',
    definitions: [
      { term: 'Partially Committed', definition: 'Final statement executed, awaiting WAL commit flush to disk.' },
      { term: 'Aborted', definition: 'Transaction rolled back completely; database restored to pre-transaction state.' },
    ],
    learningObjectives: [
      'Draw and trace all legal transitions in the 5-state transaction diagram.',
      'Explain why Partially Committed differs from Committed.',
      'Describe options after entering Aborted (restart vs. kill).',
    ],
    difficultyLevels: {
      beginner: 'Two happy endings (Committed) vs. one clean undo (Failed -> Aborted).',
      intermediate: 'Explain why a transaction CANNOT roll back after reaching Committed (compensating transactions are needed instead).',
      advanced: 'Relate Partially Committed WAL fsync latency to group-commit optimization in high-throughput OLTP engines.',
    },
    keyTakeaways: [
      'A transaction never transitions directly from Active to Committed without passing Partially Committed.',
      'Once Committed, changes cannot be undone by ROLLBACK.',
      'Aborted transactions leave zero trace on committed state.',
    ],
    codeOrDiagramTitle: 'Transaction Lifecycle State Machine',
    codeOrDiagram: `               (Final Stmt)                  (WAL Flush OK)
[Active] ────────────────────▶ [Partially Committed] ──────▶ [Committed]
   │                                    │
   │ (Error / Deadlock)                 │ (Flush / Check Fail)
   ▼                                    ▼
[Failed] ◀──────────────────────────────┘
   │
   │ (Recovery UNDO Complete)
   ▼
[Aborted] ──▶ (Restart or Return Error)`,
    relatedConceptIds: ['dbms_u4_transactions', 'dbms_u4_acid', 'dbms_u4_log_recovery'],
    practiceQuestions: [
      {
        id: 'pq_u4_3_1',
        difficulty: 'beginner',
        prompt: 'What is the key difference between the Partially Committed and Committed states?',
        hint: 'Think about volatile RAM vs. durable disk log.',
        answer: 'In Partially Committed, the transaction finished its queries in memory, but its WAL commit record has not yet been durably flushed to stable storage; Committed means durability is guaranteed.',
      },
    ],
    practicePrompt: 'Why can a transaction in Partially Committed still transition to Failed?',
  },
  {
    id: 'dbms_u4_serializability',
    unitNumber: 4,
    code: '4.4',
    title: 'Serializability',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'A concurrent schedule is Serializable if its final database state and read values are mathematically equivalent to running the same transactions serially one after another.',
    detailedExplanation:
      'Serial schedules (e.g., all of T1 then all of T2) are always safe yet hurt throughput. Serializable schedules interleave operations for speed while guaranteeing equivalence to SOME serial order (`T1 → T2` OR `T2 → T1`). There are two notions: **Conflict Serializability** (swapping adjacent non-conflicting operations yields a serial schedule; fast polynomial check) and **View Serializability** (matching initial reads, read-from dependencies, and final writes; covers rare "blind write" schedules, though testing View Serializability is NP-complete).',
    summaryEn:
      'Defines serial vs. concurrent schedules and compares Conflict Serializability against View Serializability.',
    summaryKn:
      'Serializability ಎಂದರೆ ಸಮಕಾಲೀನವಾಗಿ ಚಲಿಸುವ ವಹಿವಾಟುಗಳ ಫಲಿತಾಂಶವು ಅವುಗಳನ್ನು ಒಂದರ ನಂತರ ಒಂದರಂತೆ ಕ್ರಮವಾಗಿ ಚಲಾಯಿಸಿದ ಫಲಿತಾಂಶಕ್ಕೆ ಸಮನಾಗಿರುವುದು.',
    realWorldExample:
      'Two students submitting to separate rows (`stu_1` and `stu_2`) can interleave freely—the interleaved schedule is equivalent to both `T1; T2` and `T2; T1`.',
    definitions: [
      { term: 'Serial Schedule', definition: 'No interleaving: each transaction finishes entirely before the next begins.' },
      { term: 'Conflict Equivalence', definition: 'Two schedules can be transformed into each other by swapping non-conflicting adjacent operations.' },
      { term: 'View Serializability', definition: 'Weaker equivalence preserving initial-reads, read-from links, and final-writes (allows blind writes).' },
    ],
    learningObjectives: [
      'Distinguish Serial, Conflict-Serializable, View-Serializable, and Non-Serializable schedules.',
      'Explain why every Conflict-Serializable schedule is View-Serializable, but not vice versa.',
      'Understand why practical DBMS engines enforce Conflict Serializability via locking/timestamps.',
    ],
    difficultyLevels: {
      beginner: 'Interleaving is fine as long as the end result looks identical to running transactions one-by-one without overlap.',
      intermediate: 'Know the inclusion chain: `Serial ⊂ Conflict-Serializable ⊂ View-Serializable`.',
      advanced: 'Spot blind writes (`W_i(X)` without prior `R_i(X)`) that allow Thomas Write Rule / View-Serializable schedules outside Conflict Serializability.',
    },
    keyTakeaways: [
      'Any schedule with zero blind writes is View-Serializable iff it is Conflict-Serializable.',
      'Testing View Serializability in general is NP-complete.',
      'Conflict Serializability is fast to verify in O(V + E) via precedence graphs.',
    ],
    codeOrDiagramTitle: 'Schedule Classification Hierarchy',
    codeOrDiagram: `+-------------------------------------------------------+
| All Possible Concurrent Schedules                     |
|  +-------------------------------------------------+  |
|  | View-Serializable (allows safe blind writes)    |  |
|  |  +-------------------------------------------+  |  |
|  |  | Conflict-Serializable (Precedence Acyclic)|  |  |
|  |  |  +-------------------------------------+  |  |  |
|  |  |  | Serial Schedules (T1 -> T2)         |  |  |  |
|  |  |  +-------------------------------------+  |  |  |
|  |  +-------------------------------------------+  |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+`,
    relatedConceptIds: ['dbms_u4_conflict_serializability', 'dbms_u4_recoverability', 'dbms_u4_2pl'],
    practiceQuestions: [
      {
        id: 'pq_u4_4_1',
        difficulty: 'intermediate',
        prompt: 'Does serializability require a schedule to produce the same output as a SPECIFIC serial order like `T1 → T2`, or ANY serial order?',
        hint: 'Are `T1 → T2` and `T2 → T1` both serial?',
        answer: 'ANY serial order of the committed transactions! Both `T1 → T2` and `T2 → T1` are valid serial schedules.',
      },
    ],
    practicePrompt: 'Explain why View Serializability is rarely used directly as an online scheduler test.',
  },
  {
    id: 'dbms_u4_conflict_serializability',
    unitNumber: 4,
    code: '4.5',
    title: 'Conflict Serializability',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'A schedule is Conflict Serializable iff its Precedence (Serialization) Graph—drawn from conflicting read/write pairs on the same data item—has NO cycles.',
    detailedExplanation:
      'Two operations conflict iff: (1) they belong to DIFFERENT transactions, (2) they access the SAME data item X, and (3) AT LEAST ONE is a `WRITE(X)` (RW, WR, or WW pairs; RR never conflicts). Construct a directed **Precedence Graph** with one node per transaction; draw edge `T_i → T_j` whenever an operation of `T_i` conflicts with and precedes an operation of `T_j`. The schedule is Conflict Serializable iff the graph is a DAG (acyclic), and any topological sort yields an equivalent serial order!',
    summaryEn:
      'Tests Conflict Serializability in polynomial time by building a Precedence Graph of RW/WR/WW conflicts and checking for cycles.',
    summaryKn:
      'ಒಂದೇ ಡೇಟಾ ಮೇಲೆ ಬೇರೆ ಬೇರೆ Transaction ಗಳ ಕನಿಷ್ಠ ಒಂದು WRITE ಒಳಗೊಂಡ ಸಂಘರ್ಷಗಳಿಂದ (RW/WR/WW) ರಚಿಸಿದ Precedence Graph ಚಕ್ರರಹಿತವಾಗಿದ್ದರೆ ಅದು Conflict Serializable ಆಗಿರುತ್ತದೆ.',
    realWorldExample:
      'In schedule `R1(X), W2(X), W1(X)`, `R1(X)` before `W2(X)` creates edge `T1 → T2`, while `W2(X)` before `W1(X)` creates `T2 → T1`. Because `T1 → T2 → T1` forms a cycle, the schedule is NOT Conflict Serializable!',
    definitions: [
      { term: 'Conflicting Operations', definition: 'Operations from distinct transactions on the same item where at least one is a Write.' },
      { term: 'Precedence Graph', definition: 'Directed graph whose cycles prove conflict non-serializability and topological sorts give valid serial orders.' },
    ],
    learningObjectives: [
      'Identify all RW, WR, and WW conflict pairs in any schedule.',
      'Construct the Precedence Graph and detect cycles accurately.',
      'Compute every equivalent serial order via topological sorting when acyclic.',
    ],
    difficultyLevels: {
      beginner: 'Only two Reads (`R1(X), R2(X)`) can pass each other freely; any pair with a Write on the same item creates a dependency arrow.',
      intermediate: 'Remember to check EVERY pair (not just adjacent ones!) on the same item `X` across the whole schedule.',
      advanced: 'Prove why Strict 2PL guarantees an acyclic Precedence Graph ordered by lock-point timestamps.',
    },
    keyTakeaways: [
      'Read-Read pairs NEVER conflict.',
      'A cycle in the Precedence Graph immediately proves NOT Conflict Serializable.',
      'Topological sort of an acyclic graph gives the equivalent serial schedule(s).',
    ],
    codeOrDiagramTitle: 'Precedence Graph Cycle Check',
    codeOrDiagram: `Schedule S: R1(A); R2(A); W1(B); W2(B); W1(A)
Conflicts on A: R2(A) before W1(A)  ==> Edge T2 -> T1
Conflicts on B: W1(B) before W2(B)  ==> Edge T1 -> T2
Cycle detected: T1 -> T2 -> T1  ==> NOT Conflict Serializable!`,
    relatedConceptIds: ['dbms_u4_serializability', 'dbms_u4_2pl', 'dbms_u4_timestamp'],
    practiceQuestions: [
      {
        id: 'pq_u4_5_1',
        difficulty: 'intermediate',
        prompt: 'Check Conflict Serializability of `R1(X), R2(X), W2(Y), W1(Y)`.',
        hint: 'Check conflicts on X and conflicts on Y separately.',
        answer: 'No conflicts on X (both reads). On Y, `W2(Y)` precedes `W1(Y)`, giving only `T2 → T1`. Acyclic! Conflict Serializable (equivalent to `T2 → T1`).',
      },
    ],
    practicePrompt: 'Draw the Precedence Graph for `R1(X), W2(X), R3(X), W1(Y), W3(Y)` and list all valid topological serial orders.',
  },
  {
    id: 'dbms_u4_recoverability',
    unitNumber: 4,
    code: '4.6',
    title: 'Recoverability',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'A schedule is Recoverable if no transaction commits until every transaction whose uncommitted writes it read has already committed.',
    detailedExplanation:
      'Serializability alone is not enough when crashes occur! Suppose T1 writes X, T2 reads that uncommitted X and immediately COMMITS, and then T1 aborts—leaving T2 committed on phantom invalid data (**Non-Recoverable Schedule**). Better levels form a strict hierarchy: (1) **Recoverable**: T2 commits only after T1 commits; (2) **Cascadeless (ACA)**: transactions only read committed values (eliminates cascading rollbacks); (3) **Strict**: transactions neither read NOR overwrite uncommitted values (prevents dirty overwrites and simplifies UNDO!).',
    summaryEn:
      'Establishes the Recoverable ⊇ Cascadeless (ACA) ⊇ Strict schedule hierarchy preventing dirty-commit corruption and cascading aborts.',
    summaryKn:
      'Recoverable, Cascadeless ಮತ್ತು Strict ವೇಳಾಪಟ್ಟಿಗಳು ಅಪೂರ್ಣ ಡೇಟಾವನ್ನು ಓದಿದ Transaction ಗಳು ತಪ್ಪಾಗಿ Commit ಆಗದಂತೆ ಮತ್ತು Cascading Abort ತಡೆಯಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.',
    realWorldExample:
      'If T2 reads T1’s temporary balance update before T1 commits, then T1 fails validation and aborts, a Cascadeless scheduler blocks T2 from reading until T1 commits so T2 never has to cascade-abort.',
    definitions: [
      { term: 'Recoverable Schedule', definition: 'If T_j reads an item written by T_i, T_i must commit before T_j commits.' },
      { term: 'Cascadeless (ACA)', definition: 'T_j may only read items written by already-committed transactions (zero dirty reads).' },
      { term: 'Strict Schedule', definition: 'T_j can neither read nor write item X until the last writer T_i has committed or aborted.' },
    ],
    learningObjectives: [
      'Classify schedules as Non-Recoverable, Recoverable, Cascadeless, or Strict.',
      'Demonstrate a Cascading Rollback scenario and explain why production DBs forbid it.',
      'Connect Strict schedules directly to Strict 2PL.',
    ],
    difficultyLevels: {
      beginner: 'Never let Transaction B celebrate (commit) based on Transaction A’s scratchpad note before Transaction A finishes!',
      intermediate: 'Check WR dependencies for Recoverable/Cascadeless; check BOTH WR and WW dependencies for Strictness.',
      advanced: 'Analyze why Strictness guarantees physical before-image UNDO safety (`W1(X), W2(X), A1` fails recovery without strictness).',
    },
    keyTakeaways: [
      'Hierarchy: `Strict ⊂ Cascadeless ⊂ Recoverable`.',
      'Note: Recoverability and Serializability are orthogonal—a schedule can be Conflict Serializable yet Non-Recoverable!',
      'Strict 2PL guarantees BOTH Conflict Serializability AND Strictness.',
    ],
    codeOrDiagramTitle: 'Non-Recoverable vs. Strict Schedule',
    codeOrDiagram: `-- Non-Recoverable (ILLEGAL!):
  W1(X) -> R2(X) -> C2 -> A1  (T2 already committed on T1's aborted X!)

-- Strict (SAFE - holds X-lock until Commit/Abort):
  W1(X) -> C1 -> R2(X) -> W2(X) -> C2`,
    relatedConceptIds: ['dbms_u4_serializability', 'dbms_u4_2pl', 'dbms_u4_log_recovery'],
    practiceQuestions: [
      {
        id: 'pq_u4_6_1',
        difficulty: 'intermediate',
        prompt: 'Is `W1(X), W2(X), C2, A1` Cascadeless? Is it Strict?',
        hint: 'Did T2 read X, or overwrite X?',
        answer: 'It is Cascadeless (T2 performed no dirty read), yet NOT Strict (T2 overwrote uncommitted `W1(X)` before T1 committed/aborted, complicating UNDO!).',
      },
    ],
    practicePrompt: 'Construct an example schedule that is Conflict Serializable yet Non-Recoverable.',
  },
  {
    id: 'dbms_u4_concurrency',
    unitNumber: 4,
    code: '4.7',
    title: 'Concurrency Control',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Concurrency Control coordinates simultaneous transactions using Locking, Timestamps, Optimistic Validation, or MVCC so high throughput never compromises consistency.',
    detailedExplanation:
      'Concurrency Control protocols divide into two philosophies: **Pessimistic** protocols (Two-Phase Locking, Timestamp Ordering) prevent conflicts up-front via waits or aborts, ideal under high contention; **Optimistic** protocols (OCC) let transactions execute freely using private workspaces and validate conflicts at commit time, ideal when conflicts are rare. Modern engines (PostgreSQL, MySQL InnoDB, Oracle) combine locking for writes with **MVCC (Multi-Version Concurrency Control)** so readers never block writers and writers never block readers.',
    summaryEn:
      'Compares Pessimistic (2PL, Timestamps), Optimistic (Validation), and MVCC concurrency architectures.',
    summaryKn:
      'Concurrency Control ಏಕಕಾಲಿಕ Transaction ಗಳನ್ನು Locking, Timestamps, Optimistic Validation ಮತ್ತು MVCC ವಿಧಾನಗಳ ಮೂಲಕ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಯೋಜಿಸುತ್ತದೆ.',
    realWorldExample:
      'During final exam result publication, thousands of students read grades simultaneously while teachers update late submissions; MVCC gives students instant consistent snapshots without blocking teacher writes.',
    definitions: [
      { term: 'Pessimistic Control', definition: 'Assumes conflicts will happen and acquires locks or orders timestamps before accessing items.' },
      { term: 'Optimistic Control (OCC)', definition: 'Executes in Read -> Validation -> Write phases without locking during execution.' },
      { term: 'MVCC', definition: 'Maintains multiple timestamped row versions so readers see consistent snapshots lock-free.' },
    ],
    learningObjectives: [
      'Compare Pessimistic Locking, Timestamp Ordering, OCC, and MVCC.',
      'Select the best concurrency mechanism based on read/write contention ratios.',
      'Explain how MVCC eliminates read-write blocking.',
    ],
    difficultyLevels: {
      beginner: 'Pessimistic = reserve the room before entering; Optimistic = use the room and check at checkout if anyone else used it.',
      intermediate: 'Trace MVCC snapshot visibility rules using transaction creation/deletion IDs (`xmin`/`xmax`).',
      advanced: 'Understand why Write Skew occurs under Snapshot Isolation and how Serializable Snapshot Isolation (SSI) adds SIREAD conflict edges.',
    },
    keyTakeaways: [
      'MVCC avoids read-write lock contention in modern RDBMS engines.',
      'Pessimistic 2PL excels when write conflicts are frequent.',
      'OCC shines in read-mostly workloads with low contention.',
    ],
    codeOrDiagramTitle: 'Concurrency Control Protocol Landscape',
    codeOrDiagram: `Pessimistic   ──▶  Lock-Based (Strict 2PL) | Timestamp Ordering
Optimistic    ──▶  Read Phase -> Validate Conflicts -> Write Phase
Multi-Version ──▶  MVCC (Readers read snapshot; Writers create new row version)`,
    relatedConceptIds: ['dbms_u4_locking', 'dbms_u4_2pl', 'dbms_u4_timestamp'],
    practiceQuestions: [
      {
        id: 'pq_u4_7_1',
        difficulty: 'intermediate',
        prompt: 'How does MVCC prevent a long-running analytics SELECT query from blocking incoming INSERT/UPDATE writes?',
        hint: 'Does a reader read the in-flight version or a snapshot version?',
        answer: 'MVCC serves the SELECT query an older committed snapshot version of each row while writers create newer versions concurrently without waiting on shared read locks.',
      },
    ],
    practicePrompt: 'Compare Optimistic Concurrency Control vs. Two-Phase Locking under 95% reads vs. 80% concurrent updates on the same row.',
  },
  {
    id: 'dbms_u4_locking',
    unitNumber: 4,
    code: '4.8',
    title: 'Lock-Based Protocols',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Lock-Based Protocols synchronize table and row access using Shared (S) locks for reading and Exclusive (X) locks for writing according to a compatibility matrix.',
    detailedExplanation:
      'Before reading item X, a transaction requests a **Shared Lock (S-lock)**—multiple transactions can hold S-locks on X simultaneously. Before writing item X, it requests an **Exclusive Lock (X-lock)**—only one transaction can hold an X-lock, blocking all other S and X requests. Lock Managers also support **Lock Upgrades** (S → X), **Lock Granularity** hierarchies (Database → Table → Page → Row), and **Intention Locks (IS, IX, SIX)** so table-level scans don’t inspect millions of row locks.',
    summaryEn:
      'Explains Shared (S), Exclusive (X), and Multiple-Granularity Intention Locks (IS/IX/SIX) managed by the DBMS Lock Table.',
    summaryKn:
      'Lock-Based Protocols ಓದಲು Shared (S) ಲಾಕ್ ಮತ್ತು ಬರೆಯಲು Exclusive (X) ಲಾಕ್ ಬಳಸಿ ಏಕಕಾಲಿಕ ದೋಷಗಳನ್ನು ತಡೆಯುತ್ತವೆ.',
    realWorldExample:
      'Multiple students simultaneously read a published quiz (compatible S-locks), while a teacher editing quiz settings acquires a row X-lock (plus table IX-lock) temporarily blocking conflicting edits.',
    definitions: [
      { term: 'Shared Lock (S)', definition: 'Allows concurrent readers; incompatible with any Exclusive lock.' },
      { term: 'Exclusive Lock (X)', definition: 'Grants sole read/write access; incompatible with both S and X locks.' },
      { term: 'Intention Lock (IS/IX)', definition: 'Coarse-level flag signaling that finer-grained S/X locks exist inside child rows/pages.' },
    ],
    learningObjectives: [
      'Apply the S/X lock compatibility matrix accurately.',
      'Explain lock conversion (upgrade S → X, downgrade X → S) and why upgrades risk deadlocks.',
      'Use Intention Locks (IS, IX, SIX) in multiple-granularity locking trees.',
    ],
    difficultyLevels: {
      beginner: 'S-lock = "Many can look at once"; X-lock = "Only I can edit right now".',
      intermediate: 'Know why simply unlocking immediately after each single operation (`lock-read-unlock`) fails to prevent Dirty Reads and Non-Repeatable Reads!',
      advanced: 'Verify the full 5×5 lock compatibility matrix for `{IS, IX, S, SIX, X}` in hierarchical table/row locking.',
    },
    keyTakeaways: [
      'Locks alone are not enough without a lock-holding discipline (like 2PL).',
      'Row-level locking maximizes concurrency; Intention locks keep table checks O(1).',
      'Simultaneous S → X upgrades by two transactions cause classic deadlocks.',
    ],
    codeOrDiagramTitle: 'S/X & Intention Lock Compatibility',
    codeOrDiagram: `Requested \\ Held |   S    |   X
-----------------+--------+-------
      S          |  YES   |  NO (Wait)
      X          |  NO    |  NO (Wait)

Granularity Tree: [Database] -> [Table (IX)] -> [Page (IX)] -> [Row (X)]`,
    relatedConceptIds: ['dbms_u4_2pl', 'dbms_u4_deadlocks', 'dbms_u4_concurrency'],
    practiceQuestions: [
      {
        id: 'pq_u4_8_1',
        difficulty: 'intermediate',
        prompt: 'What problem occurs if T1 and T2 both hold S-locks on item X and both request an upgrade to X-lock?',
        hint: 'Each waits for the other to release its S-lock.',
        answer: 'Immediate Deadlock! Neither can upgrade because the other holds a conflicting S-lock (mitigated via Update Locks `U` or deadlock detection).',
      },
    ],
    practicePrompt: 'Why do Intention Locks (IS/IX) eliminate scanning every row lock when a DDL operation requests a Table X-lock?',
  },
  {
    id: 'dbms_u4_2pl',
    unitNumber: 4,
    code: '4.9',
    title: 'Two-Phase Locking',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'Two-Phase Locking (2PL) guarantees Conflict Serializability by splitting every transaction into a Growing Phase (acquire locks only) and a Shrinking Phase (release locks only).',
    detailedExplanation:
      'Under **Basic 2PL**, once a transaction releases ANY lock, it can NEVER acquire another lock—its lock point uniquely orders the serialization graph! However, Basic 2PL still permits **Cascading Rollbacks** if a transaction releases an X-lock before committing and then aborts. **Strict 2PL** fixes this by holding ALL Exclusive (X) locks until COMMIT/ABORT; **Rigorous 2PL** holds BOTH S and X locks until COMMIT/ABORT—making Rigorous 2PL guarantee Conflict Serializability, Cascadelessness, and Strictness.',
    summaryEn:
      'Contrasts Basic 2PL, Strict 2PL (holds X-locks to commit), and Rigorous 2PL (holds all locks to commit) for serializability and strict recovery.',
    summaryKn:
      'Two-Phase Locking (2PL) ನಲ್ಲಿ Growing ಹಂತದಲ್ಲಿ ಲಾಕ್‌ಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತದೆ ಮತ್ತು Shrinking ಹಂತದಲ್ಲಿ ಬಿಡುಗಡೆ ಮಾಡಲಾಗುತ್ತದೆ; Strict 2PL X-ಲಾಕ್‌ಗಳನ್ನು Commit ವರೆಗೆ ಹಿಡಿದಿಡುತ್ತದೆ.',
    realWorldExample:
      'In Strict 2PL, if T1 deducts inventory and writes `W1(stock)`, T1 keeps the X-lock on `stock` until `COMMIT`, ensuring T2 never reads dirty stock counts.',
    definitions: [
      { term: 'Growing Phase', definition: 'Transaction acquires new locks (and may upgrade S→X) but cannot release any lock.' },
      { term: 'Shrinking Phase', definition: 'Transaction releases locks and is forbidden from acquiring any new lock.' },
      { term: 'Strict 2PL', definition: '2PL variant holding all Exclusive locks until COMMIT or ABORT, eliminating cascading aborts.' },
    ],
    learningObjectives: [
      'Verify whether a locking schedule obeys Basic 2PL, Strict 2PL, or Rigorous 2PL.',
      'Explain why Basic 2PL guarantees Conflict Serializability yet allows cascading aborts.',
      'Recognize that 2PL does NOT prevent Deadlocks.',
    ],
    difficultyLevels: {
      beginner: 'Phase 1: gather all keys you need; Phase 2: hand them back—never pick up another key once you start returning them.',
      intermediate: 'Understand why 2PL is sufficient—yet NOT necessary—for Conflict Serializability (some conflict-serializable schedules violate 2PL).',
      advanced: 'Address Phantom Reads under 2PL using Index-Range / Predicate Locking (Next-Key Locking in InnoDB).',
    },
    keyTakeaways: [
      'Basic 2PL = Conflict Serializable, NOT guaranteed Cascadeless.',
      'Strict 2PL = Conflict Serializable + Cascadeless + Strict.',
      '2PL can still suffer Deadlocks (handled via detection or Wait-Die/Wound-Wait).',
    ],
    codeOrDiagramTitle: 'Basic 2PL vs. Strict 2PL Lock Timeline',
    codeOrDiagram: `Basic 2PL:
  Locks Held:  /|\\ (Grow) ... (Shrink early!) ──▶ Commit (Cascading risk!)

Strict 2PL:
  Locks Held:  /|─────────────────────────────▶ Commit ─▶ Release ALL X-Locks`,
    relatedConceptIds: ['dbms_u4_locking', 'dbms_u4_deadlocks', 'dbms_u4_conflict_serializability'],
    practiceQuestions: [
      {
        id: 'pq_u4_9_1',
        difficulty: 'intermediate',
        prompt: 'Does Strict 2PL prevent deadlocks? Why or why not?',
        hint: 'Consider T1 locking A then requesting B while T2 locks B then requests A.',
        answer: 'No! Both T1 and T2 remain in their Growing Phase waiting cyclically for each other’s held locks—Strict 2PL guarantees serializability and recoverability, not deadlock freedom.',
      },
    ],
    practicePrompt: 'Prove why releasing an X-lock early in Basic 2PL can force cascading aborts.',
  },
  {
    id: 'dbms_u4_deadlocks',
    unitNumber: 4,
    code: '4.10',
    title: 'Deadlocks',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'A Deadlock occurs when two or more transactions wait endlessly in a cycle for locks held by one another, detected via a Wait-For Graph or prevented via timestamps.',
    detailedExplanation:
      'Deadlocks arise whenever transactions request locks in opposite orders (`T1: Lock(A)->Lock(B)`, `T2: Lock(B)->Lock(A)`). Engines resolve deadlocks via three strategies: (1) **Detection & Recovery**: maintain a directed **Wait-For Graph (WFG)** (`T_i → T_j` if `T_i` waits for `T_j`); any cycle signals deadlock, resolved by aborting the cheapest victim (fewest writes/youngest); (2) **Timeout**: abort transactions waiting longer than N seconds; (3) **Deadlock Prevention**: non-preemptive **Wait-Die** (older waits, younger dies) and preemptive **Wound-Wait** (older wounds/aborts younger, younger waits).',
    summaryEn:
      'Covers Wait-For Graph cycle detection, victim selection, Wait-Die, Wound-Wait, and consistent lock ordering.',
    summaryKn:
      'ಎರಡು ವಹಿವಾಟುಗಳು ಪರಸ್ಪರರ ಲಾಕ್‌ಗಾಗಿ ಅನಂತವಾಗಿ ಕಾಯುವುದನ್ನು Deadlock ಎನ್ನುತ್ತೇವೆ; Wait-For Graph, Wait-Die ಮತ್ತು Wound-Wait ಮೂಲಕ ಇದನ್ನು ನಿಭಾಯಿಸಲಾಗುತ್ತದೆ.',
    realWorldExample:
      'Transaction T1 locks Student A’s grade then requests Student B’s; T2 locks Student B then requests Student A. PostgreSQL’s deadlock detector spots the 2-node cycle within 1 second and aborts T2 so T1 proceeds.',
    definitions: [
      { term: 'Wait-For Graph (WFG)', definition: 'Directed graph with edge `T_i → T_j` when T_i is blocked waiting for a lock held by T_j.' },
      { term: 'Wait-Die', definition: 'Non-preemptive rule: older transaction waits on younger; younger aborts and restarts with original timestamp.' },
      { term: 'Wound-Wait', definition: 'Preemptive rule: older transaction aborts (wounds) younger holder; younger waits on older.' },
    ],
    learningObjectives: [
      'Draw a Wait-For Graph from lock requests and identify deadlock cycles.',
      'Apply Wait-Die and Wound-Wait timestamp prevention rules accurately.',
      'Prevent application deadlocks by acquiring locks in a consistent canonical order (e.g., sorted IDs).',
    ],
    difficultyLevels: {
      beginner: 'Deadlock = two cars facing each other on a one-lane bridge where neither can back up until one gives way.',
      intermediate: 'Remember to preserve a restarted transaction’s ORIGINAL timestamp in Wait-Die/Wound-Wait so it eventually becomes the oldest and never starves!',
      advanced: 'Compare false-positive rates of Lock Timeouts vs. background WFG cycle detection.',
    },
    keyTakeaways: [
      'Always keep original timestamps on restart to prevent starvation.',
      'Sorting entity IDs before `SELECT ... FOR UPDATE` prevents circular wait at the app layer.',
      'Wound-Wait tends to cause fewer aborts than Wait-Die.',
    ],
    codeOrDiagramTitle: 'Wait-Die vs. Wound-Wait Rules',
    codeOrDiagram: `Suppose T_req requests lock held by T_holder (smaller TS = OLDER):

Policy       | T_req is OLDER              | T_req is YOUNGER
-------------+-----------------------------+---------------------------
Wait-Die     | T_req WAITS                 | T_req DIES (aborts)
Wound-Wait   | T_holder WOUNDED (aborts)   | T_req WAITS`,
    relatedConceptIds: ['dbms_u4_locking', 'dbms_u4_2pl', 'dbms_u4_timestamp'],
    practiceQuestions: [
      {
        id: 'pq_u4_10_1',
        difficulty: 'intermediate',
        prompt: 'Why must a transaction aborted by Wait-Die keep its ORIGINAL timestamp when restarted?',
        hint: 'What happens if it keeps getting brand-new timestamps every time it restarts?',
        answer: 'If it received a new timestamp on each restart, it would always remain the "youngest" and could be aborted forever (**starvation** / livelock).',
      },
    ],
    practicePrompt: 'If T1 (TS=10) requests a lock held by T2 (TS=25), what happens under Wait-Die vs. Wound-Wait?',
  },
  {
    id: 'dbms_u4_timestamp',
    unitNumber: 4,
    code: '4.11',
    title: 'Timestamp Ordering',
    estimatedMinutes: 30,
    difficulty: 'advanced',
    simpleExplanation:
      'Timestamp Ordering (TO) assigns every transaction a unique timestamp `TS(T)` at startup and forces all conflicting reads/writes to execute strictly in timestamp order—zero locks, zero deadlocks.',
    detailedExplanation:
      'Because locking can stall or deadlock, **Basic Timestamp Ordering** tracks two timestamps per data item X: `W-TS(X)` (largest timestamp of any transaction that wrote X) and `R-TS(X)` (largest timestamp that read X). If older `T` tries to read or write an item already touched by a younger transaction (`TS(T) < W-TS(X)` or `TS(T) < R-TS(X)`), `T` arrived too late and is aborted and restarted with a fresh timestamp! **Thomas’ Write Rule** optimizes obsolete writes: if `TS(T) < W-TS(X)` and `TS(T) >= R-TS(X)`, simply ignore T’s outdated write instead of aborting.',
    summaryEn:
      'Lock-free serialization protocol ordering transactions by `TS(T)` via `R-TS(X)` and `W-TS(X)`, plus Thomas’ Write Rule.',
    summaryKn:
      'Timestamp Ordering ಪ್ರತಿಯೊಂದು Transaction ಗೂ ಸಮಯದ ಗುರುತು (TS) ನೀಡಿ ಲಾಕ್‌ಗಳಿಲ್ಲದೆ ಮತ್ತು Deadlock ಇಲ್ಲದೆ ಸರಣಿ ಕ್ರಮವನ್ನು ನಿರ್ವಹಿಸುತ್ತದೆ.',
    realWorldExample:
      'In distributed databases where cross-datacenter locks are prohibitively slow, timestamp-based protocols (such as Google Spanner TrueTime / CockroachDB HLC) order distributed writes consistently.',
    definitions: [
      { term: 'R-TS(X) & W-TS(X)', definition: 'Highest transaction timestamps that have successfully read or written item X.' },
      { term: 'Thomas’ Write Rule', definition: 'Drops an obsolete write when a younger write already happened without an intervening read (View Serializable).' },
    ],
    learningObjectives: [
      'Execute Basic Timestamp Ordering accept/abort checks for `Read(X)` and `Write(X)`.',
      'Apply Thomas’ Write Rule to avoid unnecessary aborts.',
      'Explain why Timestamp Ordering is 100% deadlock-free yet vulnerable to cyclic restarts.',
    ],
    difficultyLevels: {
      beginner: 'Every transaction gets a ticket number at arrival; if you arrive late to a counter already served to a higher ticket number, take a new ticket and retry.',
      intermediate: 'Check `Read(X)`: reject if `TS(T) < W-TS(X)`. Check `Write(X)`: reject if `TS(T) < R-TS(X)` OR `TS(T) < W-TS(X)`.',
      advanced: 'Understand why Thomas’ Write Rule produces View-Serializable schedules that are not Conflict-Serializable.',
    },
    keyTakeaways: [
      'Zero waits means zero deadlocks.',
      'Enforces a fixed serial order equivalent to `TS(T1) < TS(T2) < ...`.',
      'High-contention items can trigger frequent aborts/restarts.',
    ],
    codeOrDiagramTitle: 'Basic Timestamp Ordering Decision Rules',
    codeOrDiagram: `On Read_T(X):
  if TS(T) < W-TS(X):  ABORT & Restart T
  else:                Execute Read; R-TS(X) = max(R-TS(X), TS(T))

On Write_T(X):
  if TS(T) < R-TS(X):  ABORT & Restart T
  elif TS(T) < W-TS(X):ABORT (or Ignore under Thomas Write Rule!)
  else:                Execute Write; W-TS(X) = TS(T)`,
    relatedConceptIds: ['dbms_u4_concurrency', 'dbms_u4_deadlocks', 'dbms_u4_distributed'],
    practiceQuestions: [
      {
        id: 'pq_u4_11_1',
        difficulty: 'advanced',
        prompt: 'Suppose item X has `R-TS(X) = 15` and `W-TS(X) = 12`. Transaction T (`TS = 14`) issues `Write(X)`. What happens under Basic TO?',
        hint: 'Compare `TS(T)` against `R-TS(X)`.',
        answer: 'Since `TS(T) = 14 < R-TS(X) = 15`, a younger transaction (TS=15) already read the older value of X! T must ABORT and restart.',
      },
    ],
    practicePrompt: 'Why is Timestamp Ordering guaranteed to be free of deadlocks?',
  },
  {
    id: 'dbms_u4_recovery',
    unitNumber: 4,
    code: '4.12',
    title: 'Database Recovery',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Database Recovery restores a database to a consistent state containing every committed transaction and zero uncommitted changes after transaction, system, or disk failures.',
    detailedExplanation:
      'Failures fall into three classes: (1) **Transaction failure** (logical error, constraint abort, deadlock victim); (2) **System crash** (power loss/OS panic wiping volatile RAM buffer pool while disk survives); (3) **Media/Disk failure** (head crash or corrupted volume, solved via backups + archive logs). Buffer pool policies strongly shape recovery: **Steal** (uncommitted dirty frames may flush to disk -> requires UNDO) vs. **No-Steal**, and **Force** (all pages flush on commit) vs. **No-Force** (dirty pages stay in RAM on commit -> requires REDO). High-performance engines use **Steal / No-Force**!',
    summaryEn:
      'Classifies transaction, crash, and media failures alongside Buffer Pool Steal/No-Force policies requiring REDO and UNDO recovery.',
    summaryKn:
      'ವಿದ್ಯುತ್ ಕಡಿತ ಅಥವಾ ಸಿಸ್ಟಮ್ ಕ್ರ್ಯಾಶ್ ಆದ ನಂತರ Database Recovery ಡೇಟಾಬೇಸ್ ಅನ್ನು ಸ್ಥಿರ (Committed) ಸ್ಥಿತಿಗೆ ಮರುಸ್ಥಾಪಿಸುತ್ತದೆ.',
    realWorldExample:
      'When a server reboots after an unexpected power outage, the Recovery Manager replays committed transactions that hadn’t flushed pages to SSD yet (REDO) and reverses uncommitted writes flushed prematurely (UNDO).',
    definitions: [
      { term: 'Steal Policy', definition: 'Allows buffer manager to write uncommitted dirty pages to disk before transaction commits (requires UNDO).' },
      { term: 'No-Force Policy', definition: 'Does not force all modified data pages to disk at COMMIT (fast writes; requires REDO).' },
    ],
    learningObjectives: [
      'Categorize transaction, system, and media failures.',
      'Explain why Steal/No-Force maximizes runtime performance yet demands both REDO and UNDO.',
      'Contrast Deferred Update (NO-UNDO / REDO) vs. Immediate Update (UNDO / REDO).',
    ],
    difficultyLevels: {
      beginner: 'After a crash, recovery has two jobs: erase unfinished work (UNDO) and make sure finished receipts actually reached disk (REDO).',
      intermediate: 'Map all 4 Buffer Pool combinations (Steal/No-Steal × Force/No-Force) to whether UNDO and/or REDO are needed.',
      advanced: 'Understand idempotency of recovery operations when crashes occur repeatedly *during* crash recovery itself (ARIES CLRs).',
    },
    keyTakeaways: [
      'Steal + No-Force delivers peak runtime speed at the cost of needing both UNDO and REDO.',
      'Media failure cannot be fixed by local logs alone—it requires off-site backups + archived WAL.',
      'Recovery algorithms must be idempotent.',
    ],
    codeOrDiagramTitle: 'Buffer Pool Policies & Recovery Requirements',
    codeOrDiagram: `Policy Pair         | Runtime Speed | UNDO Needed? | REDO Needed?
--------------------+---------------+--------------+-------------
No-Steal + Force    | Slowest       | No           | No
Steal    + Force    | Medium        | Yes          | No
No-Steal + No-Force | Medium        | No           | Yes
Steal    + No-Force | Fastest (DB)  | YES          | YES`,
    relatedConceptIds: ['dbms_u4_log_recovery', 'dbms_u4_checkpoints', 'dbms_u4_backup_recovery'],
    practiceQuestions: [
      {
        id: 'pq_u4_12_1',
        difficulty: 'intermediate',
        prompt: 'Why do production RDBMS engines like PostgreSQL prefer No-Force over Force at COMMIT time?',
        hint: 'Think of random disk I/O vs. sequential WAL append.',
        answer: 'Forcing scattered random data pages to disk on every COMMIT is very slow; appending a tiny sequential WAL commit record is orders of magnitude faster while REDO guarantees durability.',
      },
    ],
    practicePrompt: 'Explain why a Steal buffer policy forces the Recovery Manager to support UNDO.',
  },
  {
    id: 'dbms_u4_log_recovery',
    unitNumber: 4,
    code: '4.13',
    title: 'Log-Based Recovery',
    estimatedMinutes: 30,
    difficulty: 'advanced',
    simpleExplanation:
      'Log-Based Recovery records every write (`<Ti, X, old_val, new_val>`) sequentially in a Write-Ahead Log (WAL) on stable storage before data pages change, enabling exact REDO and UNDO.',
    detailedExplanation:
      'The **Write-Ahead Logging (WAL)** protocol enforces two golden rules: (1) Before overwriting item X on disk (Steal), force its UNDO log record (`old_val`) to stable storage; (2) Before declaring transaction `T_i` Committed, force all its log records (`new_val` + `<T_i, COMMIT>`) to stable storage. Modern **ARIES** recovery runs in three passes: **Analysis** (scan forward from last checkpoint to locate dirty pages & active loser transactions), **REDO** (replay all history forward from smallest recLSN), and **UNDO** (roll back losers backward while writing Compensation Log Records / CLRs).',
    summaryEn:
      'Explains Write-Ahead Logging (WAL) rules, Immediate vs. Deferred updates, and ARIES Analysis-REDO-UNDO crash recovery.',
    summaryKn:
      'Write-Ahead Logging (WAL) ನಿಯಮದಂತೆ ಡೇಟಾ ಪುಟಗಳ ಬದಲಾವಣೆಗೂ ಮುನ್ನ ಲಾಗ್ ಬರೆಯಲಾಗುತ್ತದೆ; ARIES Analysis, REDO ಮತ್ತು UNDO ಹಂತಗಳಲ್ಲಿ ಮರುಸ್ಥಾಪನೆ ಮಾಡುತ್ತದೆ.',
    realWorldExample:
      'PostgreSQL writes sequential WAL segments (`pg_wal`); if power cuts mid-batch, restart runs Analysis -> REDO -> UNDO automatically in seconds with zero committed data loss.',
    definitions: [
      { term: 'Write-Ahead Logging (WAL)', definition: 'Protocol requiring log records to hit durable disk BEFORE the corresponding dirty pages or commit confirmation.' },
      { term: 'LSN (Log Sequence Number)', definition: 'Monotonically increasing log offset stored inside each data page (`pageLSN`) to track what updates reached disk.' },
      { term: 'CLR (Compensation Log Record)', definition: 'Redo-only log entry written during UNDO so recovery never repeats an already-undone step on double crash.' },
    ],
    learningObjectives: [
      'State both Write-Ahead Logging (WAL) rules guaranteeing Atomicity and Durability.',
      'Trace REDO and UNDO actions across a concrete WAL trace after a crash.',
      'Explain the three passes of ARIES: Analysis, REDO, and UNDO.',
    ],
    difficultyLevels: {
      beginner: 'Write the receipt in the permanent journal (WAL) BEFORE touching the cash register or handing out confirmation.',
      intermediate: 'Know that REDO runs chronologically forward (`old -> new`) for committed winners, while UNDO runs backward (`new -> old`) for uncommitted losers.',
      advanced: 'Explain ARIES "Repeating History" during REDO (replaying even loser updates before UNDO) and physiological logging with `pageLSN`.',
    },
    keyTakeaways: [
      'Sequential WAL appends are vastly faster than random page flushes.',
      'WAL Rule 1 enables Atomicity (UNDO); WAL Rule 2 enables Durability (REDO).',
      'CLRs make ARIES immune to crashes occurring mid-recovery.',
    ],
    codeOrDiagramTitle: 'WAL Trace & ARIES Three Passes',
    codeOrDiagram: `WAL Trace before CRASH:
  <T1, START> -> <T1, A, 100, 80> -> <T1, COMMIT>
  <T2, START> -> <T2, B, 50, 90>  -> [SYSTEM CRASH!]

ARIES Recovery:
  1. ANALYSIS : Winner = {T1} (committed), Loser = {T2} (no commit record)
  2. REDO     : Ensure A=80 (and replay history forward)
  3. UNDO     : Roll back T2 backward -> restore B=50 + write <T2, ABORT>`,
    relatedConceptIds: ['dbms_u4_recovery', 'dbms_u4_checkpoints', 'dbms_u4_acid'],
    practiceQuestions: [
      {
        id: 'pq_u4_13_1',
        difficulty: 'advanced',
        prompt: 'In the WAL trace `<T1, START>, <T1, X, 10, 25>, <T2, START>, <T2, Y, 5, 15>, <T1, COMMIT>, [CRASH]`, what values do X and Y hold after recovery?',
        hint: 'Which transaction committed vs. remained active at crash?',
        answer: 'T1 committed -> REDO sets `X = 25`. T2 never committed -> UNDO restores `Y = 5`.',
      },
    ],
    practicePrompt: 'Why does ARIES scan backward during UNDO yet forward during REDO?',
  },
  {
    id: 'dbms_u4_checkpoints',
    unitNumber: 4,
    code: '4.14',
    title: 'Checkpoints',
    estimatedMinutes: 20,
    difficulty: 'intermediate',
    simpleExplanation:
      'A Checkpoint periodically snapshots active transactions and flushes dirty pages so crash recovery does not have to replay months of WAL logs from the very beginning.',
    detailedExplanation:
      'Without checkpoints, REDO would have to scan the entire transaction log from day one! Simple checkpoints halt new writes briefly, flush WAL + all dirty buffer pages to disk, and write `<CHECKPOINT L>` listing active transactions. Modern **Fuzzy Checkpoints** (used in ARIES) avoid freezing the database: they record `BEGIN_CHECKPOINT` and `END_CHECKPOINT` containing the Dirty Page Table (with `recLSN`) and Active Transaction Table while transactions keep running concurrently.',
    summaryEn:
      'Bounds crash recovery time by recording periodic consistent markers (`CHECKPOINT`) and dirty-page LSN watermarks.',
    summaryKn:
      'Checkpoint ಕಾಲಕಾಲಕ್ಕೆ ಡೇಟಾಬೇಸ್ ಸ್ಥಿತಿಯನ್ನು ದಾಖಲಿಸುವುದರಿಂದ Crash ಆದ ನಂತರ ಹಳೆಯ ಎಲ್ಲಾ ಲಾಗ್‌ಗಳನ್ನು ಮತ್ತೆ ಓದುವ ಅಗತ್ಯವಿರುವುದಿಲ್ಲ.',
    realWorldExample:
      'An OLTP database processing 10,000 TPS creates a fuzzy checkpoint every 5 minutes so crash recovery only inspects the last few minutes of WAL instead of hours.',
    definitions: [
      { term: 'Consistent (Simple) Checkpoint', definition: 'Pauses writes, flushes all dirty buffers, and logs active transactions.' },
      { term: 'Fuzzy Checkpoint', definition: 'Non-blocking ARIES checkpoint logging Dirty Page Table (`recLSN`) and Active Tx Table concurrently.' },
    ],
    learningObjectives: [
      'Explain why recovery time grows unboundedly without checkpoints.',
      'Determine which transactions need REDO vs. UNDO relative to a `<CHECKPOINT L>` record.',
      'Contrast Simple blocking Checkpoints vs. Fuzzy Checkpoints.',
    ],
    difficultyLevels: {
      beginner: 'A checkpoint is a video-game save point: after a crash, you resume from the last save point instead of Level 1.',
      intermediate: 'Know the 3 transaction cases around `<CHECKPOINT L>`: committed before checkpoint (skip!), committed after checkpoint (REDO), active at crash (UNDO).',
      advanced: 'Trace how ARIES computes the exact REDO start point (`min recLSN` across the checkpoint’s Dirty Page Table).',
    },
    keyTakeaways: [
      'Transactions committed BEFORE the checkpoint are already safely on disk.',
      'Fuzzy checkpoints avoid production latency spikes.',
      'Checkpoints also allow safe truncation/archiving of old WAL files.',
    ],
    codeOrDiagramTitle: 'Transaction Cases Around a Checkpoint',
    codeOrDiagram: `Timeline: ─────[Checkpoint]──────────[Crash]──▶
  T1: [=====Commit]                        -> SKIP (already flushed!)
  T2:   [======|======Commit]              -> REDO (from Checkpoint)
  T3:              [====Commit]            -> REDO
  T4:   [======|====================Crash] -> UNDO (must look back before Checkpoint!)`,
    relatedConceptIds: ['dbms_u4_log_recovery', 'dbms_u4_recovery', 'dbms_u4_backup_recovery'],
    practiceQuestions: [
      {
        id: 'pq_u4_14_1',
        difficulty: 'intermediate',
        prompt: 'If T4 started BEFORE the last Checkpoint and was still running when the crash occurred, can recovery ignore T4’s log records prior to the Checkpoint?',
        hint: 'What if T4 modified a page before the Checkpoint and never committed?',
        answer: 'No! To UNDO T4 completely, recovery must follow T4’s `prevLSN` chain backward even past the Checkpoint until `<T4, START>`.',
      },
    ],
    practicePrompt: 'Why do modern DBMS engines use Fuzzy Checkpoints instead of Simple Checkpoints?',
  },
  {
    id: 'dbms_u4_indexing',
    unitNumber: 4,
    code: '4.15',
    title: 'Database Indexing',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Database Indexing organizes file-level lookup structures—Primary, Clustering, Secondary, Dense, and Sparse indexes—to minimize disk block I/O during searches.',
    detailedExplanation:
      'Physical file organization stores rows in Heap, Sorted, or Hashed disk blocks. Adding an ordered index pairs search keys with block/record pointers (`<key, pointer>`). Indexes classify along two axes: **Primary/Clustering** (the data file itself is physically sorted on the index key; at most ONE per table—Primary is on a unique key, Clustering on a non-unique attribute like `classroom_id`) vs. **Secondary** (built on any unsorted column; always Dense); and **Sparse** (one entry per disk block, tiny footprint!) vs. **Dense** (one entry per record).',
    summaryEn:
      'Explains physical Primary, Clustering, Secondary, Dense, and Sparse index architectures and disk-block I/O optimization.',
    summaryKn:
      'Database Indexing ಡಿಸ್ಕ್ ಬ್ಲಾಕ್ I/O ಕಡಿಮೆ ಮಾಡಲು Primary, Clustering, Secondary, Dense ಮತ್ತು Sparse ಇಂಡೆಕ್ಸ್ ರಚನೆಗಳನ್ನು ಬಳಸುತ್ತದೆ.',
    realWorldExample:
      'Storing submissions physically clustered by `classroom_id` (Clustering Index) lets a teacher load all 60 students’ scores from 2 adjacent disk pages instead of 60 random disk seeks.',
    definitions: [
      { term: 'Sparse Index', definition: 'Stores one `<anchor_key, block_ptr>` per disk block; requires the data file to be physically sorted on that key.' },
      { term: 'Dense Index', definition: 'Stores an index entry for every single record in the data file; mandatory for Secondary indexes.' },
      { term: 'Clustering Index', definition: 'Ordered index on a non-unique field along which the physical table rows are sorted.' },
    ],
    learningObjectives: [
      'Differentiate Primary, Clustering, and Secondary indexes.',
      'Explain why a Secondary index MUST be Dense whereas a Primary index can be Sparse.',
      'Calculate binary-search disk block I/O savings with vs. without an index.',
    ],
    difficultyLevels: {
      beginner: 'Sparse index = chapter titles in a table of contents (one per section); Dense index = full word index listing every entry.',
      intermediate: 'Know why a table can have at most ONE Primary/Clustering index (physical sort order) yet many Secondary indexes.',
      advanced: 'Compare multi-level ISAM static trees against dynamically self-balancing B+-Trees under heavy inserts.',
    },
    keyTakeaways: [
      'One physical sort order per table -> max 1 Primary or Clustering index.',
      'Secondary indexes must be Dense because rows sit in arbitrary physical blocks.',
      'Multi-level indexes turn O(log2 N) block reads into 3–4 B+-Tree hops.',
    ],
    codeOrDiagramTitle: 'Primary Sparse vs. Secondary Dense Index',
    codeOrDiagram: `Primary Sparse Index (Data sorted by PK):
  [101 -> Block 1] ──▶ Block 1: [101, 102, 103]
  [104 -> Block 2] ──▶ Block 2: [104, 105, 106]

Secondary Dense Index (Data NOT sorted by email):
  [aarav@.. -> RID(B2, #1)]
  [meera@.. -> RID(B1, #3)]   (Every row needs a pointer!)`,
    relatedConceptIds: ['dbms_u4_btree', 'dbms_u4_hashing', 'dbms_u2_indexes'],
    practiceQuestions: [
      {
        id: 'pq_u4_15_1',
        difficulty: 'intermediate',
        prompt: 'Why is it impossible to build a Sparse Secondary index on an unsorted column?',
        hint: 'If the table isn’t sorted by that column, how could one block-anchor pointer find intermediate values?',
        answer: 'Because rows with similar secondary-key values are scattered across arbitrary disk blocks, skipping entries would make it impossible to locate non-anchor records.',
      },
    ],
    practicePrompt: 'Calculate how many index blocks a 1,000,000-row table needs under Dense vs. Sparse indexing (10 rows/block, 100 entries/index block).',
  },
  {
    id: 'dbms_u4_btree',
    unitNumber: 4,
    code: '4.16',
    title: 'B-Tree and B+ Tree',
    estimatedMinutes: 35,
    difficulty: 'advanced',
    simpleExplanation:
      'B-Trees and B+-Trees are self-balancing, high-fanout multi-way search trees tailored for disk/SSD pages; B+-Trees keep ALL record pointers in doubly-linked leaf nodes for fast range scans.',
    detailedExplanation:
      'Unlike binary search trees (tall, poor disk locality), a B+-Tree node matches a 4KB–16KB disk page holding hundreds of keys (high fanout `f`, keeping depth at 3–4 levels for billions of rows!). In a **B-Tree**, data/record pointers sit in BOTH internal and leaf nodes (search may finish early at root, yet reduces fanout and hurts range scans). In a **B+-Tree** (used by virtually every modern RDBMS), internal nodes store ONLY routing keys + child page pointers (maximizing fanout!), while ALL data pointers sit in **leaf nodes linked sequentially**, making `WHERE score BETWEEN 70 AND 90` an instant linear leaf scan.',
    summaryEn:
      'Compares B-Tree vs. B+-Tree structure, high disk-page fanout, balanced node splitting/merging, and leaf-linked range scans.',
    summaryKn:
      'B-Tree ಮತ್ತು B+-Tree ಡಿಸ್ಕ್ ಪುಟಗಳಿಗೆ ಹೊಂದಿಕೊಳ್ಳುವ ಸಮತೋಲಿತ ವೃಕ್ಷ ರಚನೆಗಳಾಗಿವೆ; B+-Tree ನಲ್ಲಿ ಎಲ್ಲಾ ಡೇಟಾ ಪಾಯಿಂಟರ್‌ಗಳು ಜೋಡಿಸಲ್ಪಟ್ಟ ಎಲೆ (Leaf) ನೋಡ್‌ಗಳಲ್ಲಿರುತ್ತವೆ.',
    realWorldExample:
      'A PostgreSQL B+-Tree with fanout 300 indexes 25 million rows in only 3–4 page hops (`300^3 = 27,000,000`) and walks leaf siblings for `ORDER BY submitted_at DESC` without sorting.',
    definitions: [
      { term: 'Order / Fanout (p)', definition: 'Maximum number of child pointers per node; high fanout keeps tree height tiny (O(log_p N)).' },
      { term: 'B+-Tree Leaf Chain', definition: 'Sequential linked pointers across leaf pages enabling ultra-fast `BETWEEN`, `>=`, and `ORDER BY` scans.' },
    ],
    learningObjectives: [
      'Contrast B-Tree vs. B+-Tree internal and leaf node contents.',
      'Calculate B+-Tree order and tree height for realistic 4KB/8KB disk pages.',
      'Trace B+-Tree leaf/internal node split on insertion.',
    ],
    difficultyLevels: {
      beginner: 'B+-Tree = shallow wide tree (3–4 floors tall) whose bottom floor connects all rooms in a hallway for fast range walking.',
      intermediate: 'Explain why omitting record pointers from B+-Tree internal nodes packs MORE routing keys per page, shrinking tree height.',
      advanced: 'Verify B+-Tree leaf occupancy invariant (`ceil((p_leaf)/2)` to `p_leaf` keys) and write the exact split-and-copy-up rule vs. B-Tree push-up rule.',
    },
    keyTakeaways: [
      'Every root-to-leaf path in a B+-Tree has identical length (perfectly balanced).',
      'B+-Trees excel at both point lookups (`=`) and range queries (`BETWEEN`, `>`, `<`).',
      'Leaf splits *copy* the middle key up to the parent; internal splits *push* the middle key up.',
    ],
    codeOrDiagramTitle: 'B+-Tree Internal Routing vs. Linked Leaf Pages',
    codeOrDiagram: `Internal Root Page:      [ 30 | 70 ]       (Routing keys only -> max fanout!)
                        /     |     \\
Leaf Pages:  [10, 20] <─▶ [30, 45, 60] <─▶ [70, 85, 95]  (All RIDs + next-leaf links!)`,
    relatedConceptIds: ['dbms_u4_indexing', 'dbms_u4_hashing', 'dbms_u2_indexes'],
    practiceQuestions: [
      {
        id: 'pq_u4_16_1',
        difficulty: 'intermediate',
        prompt: 'Give two reasons why relational databases prefer B+-Trees over B-Trees for table indexes.',
        hint: 'Consider internal node fanout and range queries.',
        answer: '1) Omitting data pointers from internal nodes increases fanout and reduces tree height (fewer disk reads); 2) Linked leaf nodes allow sequential range scans (`BETWEEN`) without revisiting parent nodes.',
      },
    ],
    practicePrompt: 'Explain the difference between splitting a B+-Tree leaf node (copy up) and splitting an internal node (push up).',
  },
  {
    id: 'dbms_u4_hashing',
    unitNumber: 4,
    code: '4.17',
    title: 'Hashing',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Hashing computes a bucket disk address directly from a search key (`h(key)`) for O(1) equality lookups—using Static, Extendible, or Linear Hashing to handle growth.',
    detailedExplanation:
      'While B+-Trees shine at range scans in O(log N), Hash Indexes target O(1) constant-time exact-match lookups (`WHERE uid = "u_42"`). **Static Hashing** maps keys modulo a fixed bucket count `M`, leading to overflow chains or wasted space when tables grow. **Dynamic Hashing** solves resizing incrementally: **Extendible Hashing** uses a directory of `2^d` pointers indexed by `d` global hash prefix bits, doubling only the directory on bucket split; **Linear Hashing** splits buckets sequentially in round-robin order using overflow pages without needing a directory.',
    summaryEn:
      'Explains O(1) equality lookup via Static Hashing, Extendible Hashing (directory + local/global depth), and Linear Hashing.',
    summaryKn:
      'Hashing `h(key)` ಫಂಕ್ಷನ್ ಮೂಲಕ ನೇರವಾಗಿ O(1) ಸಮಯದಲ್ಲಿ ಬಕೆಟ್ ಸ್ಥಳವನ್ನು ಹುಡುಕುತ್ತದೆ; Extendible ಮತ್ತು Linear Hashing ಡೇಟಾ ಬೆಳೆದಂತೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ವಿಸ್ತರಿಸುತ್ತವೆ.',
    realWorldExample:
      'In-memory hash join tables and exact UUID primary-key caches use hashing to find a matching record in 1 step, whereas range queries (`date >= ...`) always fall back to B+-Trees.',
    definitions: [
      { term: 'Hash Collision', definition: 'Two distinct keys hashing to the same bucket address, handled via open addressing or overflow chains.' },
      { term: 'Extendible Hashing', definition: 'Dynamic hash scheme using a bit-prefix directory (`global depth`) and per-bucket `local depth`.' },
      { term: 'Linear Hashing', definition: 'Directory-less dynamic hashing splitting bucket `next` sequentially whenever load factor threshold exceeds limit.' },
    ],
    learningObjectives: [
      'Contrast Hashing vs. B+-Trees for point (`=`) vs. range (`BETWEEN`, `LIKE "abc%"`) queries.',
      'Trace bucket splitting and directory doubling in Extendible Hashing.',
      'Compare Extendible Hashing vs. Linear Hashing.',
    ],
    difficultyLevels: {
      beginner: 'Hashing = instant O(1) cubbyhole lookup for exact IDs, useless for "find everyone between A and M".',
      intermediate: 'Know when Extendible Hashing doubles its directory (`local_depth == global_depth` on overflow) vs. splitting without doubling (`local_depth < global_depth`).',
      advanced: 'Analyze consistent hashing rings in distributed databases (Cassandra/Dynamo) to minimize key movement on node scaling.',
    },
    keyTakeaways: [
      'Hash indexes CANNOT accelerate range queries (`<`, `>`, `BETWEEN`) or `ORDER BY`.',
      'Extendible hashing avoids rehashing the whole table at once.',
      'Skewed hash functions degrade O(1) into O(N) overflow chains.',
    ],
    codeOrDiagramTitle: 'B+-Tree vs. Hash Index Trade-Off',
    codeOrDiagram: `Query Pattern                 Best Index
-------------                 ----------
WHERE uid = 'u_105'           Hash Index: O(1)  |  B+-Tree: O(log_f N)
WHERE score BETWEEN 70 & 90   B+-Tree ONLY (Hash scans entire table!)
WHERE name LIKE 'Aa%'         B+-Tree ONLY (Prefix range scan)`,
    relatedConceptIds: ['dbms_u4_btree', 'dbms_u4_indexing', 'dbms_u4_distributed'],
    practiceQuestions: [
      {
        id: 'pq_u4_17_1',
        difficulty: 'intermediate',
        prompt: 'In Extendible Hashing, when does a bucket split force the directory size to double?',
        hint: 'Compare the overflowing bucket’s local depth `d_L` with global depth `d_G`.',
        answer: 'Only when the overflowing bucket already has `local depth == global depth` (`d_L == d_G`); if `d_L < d_G`, the bucket splits cleanly using existing directory pointers.',
      },
    ],
    practicePrompt: 'Why can a Hash Index not help speed up `SELECT * FROM students ORDER BY roll_no`?',
  },
  {
    id: 'dbms_u4_security',
    unitNumber: 4,
    code: '4.18',
    title: 'Database Security',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'Database Security protects confidentiality, integrity, and availability through Authentication, RBAC / Discretionary & Mandatory Access Control, Row-Level Security, Encryption, and SQL Injection defense.',
    detailedExplanation:
      'Enterprise database security enforces defense-in-depth across layers: (1) **Access Control**: Discretionary (DAC via SQL `GRANT`/`REVOKE` with optional `WITH GRANT OPTION`), Role-Based Access Control (**RBAC** grouping privileges into roles like `student`, `teacher`, `admin`), Mandatory Access Control (MAC security clearances), and **Row-Level Security (RLS)** / Firestore Rules scoping each query to `auth.uid`; (2) **SQL Injection Defense**: strictly separating code from untrusted input via Parameterized Prepared Statements; (3) **Encryption**: TLS in transit + AES-256 at rest; (4) **Audit Logging**.',
    summaryEn:
      'Covers DAC (GRANT/REVOKE), RBAC, Row-Level Security (RLS), Parameterized SQL injection prevention, and encryption.',
    summaryKn:
      'Database Security ಎಂಬುದು RBAC, Row-Level Security (RLS), Parameterized Queries (SQL Injection ತಡೆ) ಮತ್ತು Encryption ಮೂಲಕ ಡೇಟಾವನ್ನು ರಕ್ಷಿಸುತ್ತದೆ.',
    realWorldExample:
      'LearnSense protects assessment answer keys in a separate `assessmentAnswerKeys` collection guarded by strict `firestore.rules` so students can never inspect answer keys before submitting.',
    definitions: [
      { term: 'DAC (GRANT / REVOKE)', definition: 'Discretionary privilege model where object owners grant/revoke SELECT, INSERT, UPDATE, or DELETE rights.' },
      { term: 'Row-Level Security (RLS)', definition: 'Policy predicate appended transparently to queries restricting visible rows per authenticated user.' },
      { term: 'SQL Injection', definition: 'Attack injecting raw SQL syntax through concatenated user strings; defeated completely by parameterized queries.' },
    ],
    learningObjectives: [
      'Write SQL `GRANT` and `REVOKE` DCL statements following Least Privilege.',
      'Identify vulnerable string-concatenated SQL and rewrite it safely with bind parameters.',
      'Design Row-Level Security policies matching Teacher vs. Student vs. Admin roles.',
    ],
    difficultyLevels: {
      beginner: 'Never trust user input in SQL strings—use `$1` / `?` parameters, and give every user only the minimum permissions they need.',
      intermediate: 'Understand how `REVOKE ... CASCADE` cleans up transitive privileges granted via `WITH GRANT OPTION`.',
      advanced: 'Audit security rules against confused-deputy privilege escalation, client-side role tampering, and indirect statistical inference attacks.',
    },
    keyTakeaways: [
      'Principle of Least Privilege: deny by default, allow explicitly.',
      'Always use parameterized queries—never string interpolation.',
      'Row-level policies enforce authorization inside the database itself, not only UI buttons.',
    ],
    codeOrDiagramTitle: 'RBAC, RLS Policy & Parameterized Query',
    codeOrDiagram: `-- 1. Least-Privilege RBAC:
REVOKE ALL ON assessment_answer_keys FROM PUBLIC;
GRANT SELECT ON published_assessments TO student_role;

-- 2. PostgreSQL Row-Level Security (RLS):
CREATE POLICY student_own_submissions ON assessment_submissions
  FOR SELECT USING (student_uid = current_setting('app.current_uid'));

-- 3. Parameterized Query (Immune to SQL Injection):
SELECT id, percentage FROM assessment_submissions WHERE student_uid = $1;`,
    relatedConceptIds: ['dbms_u2_views', 'dbms_u1_db_languages', 'dbms_u2_procedures_triggers'],
    practiceQuestions: [
      {
        id: 'pq_u4_18_1',
        difficulty: 'intermediate',
        prompt: 'Why is escaping quotes manually in JavaScript inferior to using parameterized queries (`WHERE email = $1`)?',
        hint: 'Think about parser separation vs. string manipulation.',
        answer: 'Parameterized queries transmit the SQL AST separately from bound parameter values, making it structurally impossible for user input to alter SQL syntax regardless of encoding or edge cases.',
      },
    ],
    practicePrompt: 'Explain what happens when Admin revokes a privilege from User A using `CASCADE` after User A shared it via `WITH GRANT OPTION`.',
  },
  {
    id: 'dbms_u4_backup_recovery',
    unitNumber: 4,
    code: '4.19',
    title: 'Backup and Recovery',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Backup and Recovery combines Full, Incremental, and Differential physical/logical backups with Continuous WAL Archiving to achieve Point-In-Time Recovery (PITR) after disk loss or human error.',
    detailedExplanation:
      'While WAL crash recovery repairs unexpected server reboots when disks stay intact, catastrophic events—drive corruption, ransomware, or an accidental `DROP TABLE`—require external **Backups**. Strategies include **Cold (Offline)** vs. **Hot (Online)** backups, **Logical** dumps (`pg_dump` SQL scripts) vs. **Physical** block-level snapshots, and **Full / Differential / Incremental** schedules. Pairing a base physical backup with continuous **WAL Archiving** enables **Point-In-Time Recovery (PITR)**: restoring the database to the exact second (`2026-11-12 14:29:55`) right before an accidental deletion!',
    summaryEn:
      'Contrasts Logical vs. Physical backups, Full/Incremental/Differential tiers, RPO/RTO targets, and Point-In-Time Recovery (PITR).',
    summaryKn:
      'Full, Incremental ಮತ್ತು Differential ಬ್ಯಾಕಪ್‌ಗಳು ಹಾಗೂ WAL Archiving ಸಹಾಯದಿಂದ ಡಿಸ್ಕ್ ಹಾನಿ ಅಥವಾ ತಪ್ಪಾಗಿ ಅಳಿಸಿದ ಡೇಟಾವನ್ನು Point-In-Time Recovery ಮೂಲಕ ಮರುಪಡೆಯಬಹುದು.',
    realWorldExample:
      'If an operator accidentally runs `DELETE FROM enrollments` without a WHERE clause at 10:15 AM, PITR restores Sunday’s physical base backup and replays archived WAL logs up to 10:14:59 AM.',
    definitions: [
      { term: 'RPO (Recovery Point Objective)', definition: 'Maximum acceptable data loss measured in time (e.g., < 5 minutes).' },
      { term: 'RTO (Recovery Time Objective)', definition: 'Maximum acceptable downtime to restore service after an outage.' },
      { term: 'PITR (Point-In-Time Recovery)', definition: 'Restoring a base backup plus replaying archived WAL segments up to a precise timestamp.' },
    ],
    learningObjectives: [
      'Compare Full, Differential, and Incremental backup speed vs. restore complexity.',
      'Explain how WAL archiving enables Point-In-Time Recovery (PITR).',
      'Define RPO and RTO and test backup restorability regularly.',
    ],
    difficultyLevels: {
      beginner: 'An untested backup is not a backup! Full = copy everything; Incremental = copy only changes since yesterday.',
      intermediate: 'Trade off Incremental (fastest backup, slowest restore chain) vs. Differential (moderate backup, 2-step restore).',
      advanced: 'Architect multi-region WAL shipping, streaming replication standbys, and delayed-apply replicas for accidental-drop protection.',
    },
    keyTakeaways: [
      'PITR rescues databases from human `DROP`/`DELETE` mistakes, not just disk failures.',
      'Replicate backups off-site/immutable to survive region failures.',
      'Regularly run automated restore drills to verify RTO.',
    ],
    codeOrDiagramTitle: 'Point-In-Time Recovery (PITR) Workflow',
    codeOrDiagram: `[Sunday Full Base Backup] ──▶ [Mon..Fri Archived WAL Segments]
                                       │
  Oops! Accidental DELETE at 10:15 AM ─┘
  PITR Action: Restore Sunday Backup + Replay WAL up to 10:14:59 AM!`,
    relatedConceptIds: ['dbms_u4_recovery', 'dbms_u4_log_recovery', 'dbms_u4_checkpoints'],
    practiceQuestions: [
      {
        id: 'pq_u4_19_1',
        difficulty: 'intermediate',
        prompt: 'Why does a streaming synchronous replica alone NOT protect against an accidental `DROP TABLE assessments`?',
        hint: 'What happens to the replica milliseconds after `DROP TABLE` runs on primary?',
        answer: 'The replica faithfully applies the `DROP TABLE` WAL record immediately too! Only PITR WAL archives, snapshots, or delayed replicas let you rewind before the mistake.',
      },
    ],
    practicePrompt: 'Compare Incremental vs. Differential backups on backup time, storage used, and recovery time.',
  },
  {
    id: 'dbms_u4_distributed',
    unitNumber: 4,
    code: '4.20',
    title: 'Distributed Databases',
    estimatedMinutes: 35,
    difficulty: 'advanced',
    simpleExplanation:
      'A Distributed DBMS stores data across multiple networked nodes using Fragmentation, Replication, Two-Phase Commit (2PC), and CAP trade-offs while appearing as one logical database.',
    detailedExplanation:
      'Distributed Databases scale beyond a single machine using **Horizontal Fragmentation (Sharding)** (splitting rows across regions via range/hash keys), **Vertical Fragmentation** (splitting columns while retaining Primary Key), and **Replication** (storing redundant copies for fault tolerance and low-latency local reads). Atomic multi-node transactions rely on **Two-Phase Commit (2PC)** (Prepare/Vote phase -> Commit/Abort phase, which can block if the coordinator crashes!). Finally, Brewer’s **CAP Theorem** states that during a Network Partition (`P`), a distributed store must choose between linearizable Consistency (`C`) and 100% Availability (`A`).',
    summaryEn:
      'Covers Horizontal/Vertical Fragmentation, Replication, Two-Phase Commit (2PC), and CAP Theorem consistency-availability trade-offs.',
    summaryKn:
      'Distributed Databases ಡೇಟಾವನ್ನು ಹಲವು ಸರ್ವರ್‌ಗಳಲ್ಲಿ Fragmentation ಮತ್ತು Replication ಮೂಲಕ ಸಂಗ್ರಹಿಸಿ 2PC ಮತ್ತು CAP ನಿಯಮಗಳ ಅಡಿಯಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ.',
    realWorldExample:
      'Sharding global university records horizontally by campus region (`region = "BLR"` vs. `"DEL"`) keeps student queries under 15ms locally while 2PC coordinates cross-region transfers.',
    definitions: [
      { term: 'Horizontal Fragmentation (Sharding)', definition: 'Partitioning table rows into disjoint subsets stored on separate shard nodes (`σ_cond(R)`).' },
      { term: 'Two-Phase Commit (2PC)', definition: 'Coordinator protocol ensuring all participant nodes either commit together or abort together.' },
      { term: 'CAP Theorem', definition: 'Under a network partition (P), a distributed system chooses between Consistency (C) and Availability (A).' },
    ],
    learningObjectives: [
      'Design lossless Horizontal and Vertical fragmentations with clear reconstruction rules.',
      'Trace the Prepare and Commit messages of Two-Phase Commit (2PC) and explain its blocking vulnerability.',
      'Apply the CAP and PACELC trade-offs to distributed SQL vs. NoSQL engines.',
    ],
    difficultyLevels: {
      beginner: 'Sharding splits rows across different servers; Replication keeps backup copies on multiple servers.',
      intermediate: 'Verify Fragmentation Correctness rules: Completeness, Reconstruction (union for horizontal, join for vertical), and Disjointness.',
      advanced: 'Understand why 2PC blocks if participants vote YES and the coordinator crashes before broadcasting Decision—and how Paxos/Raft consensus solves coordinator SPOF.',
    },
    keyTakeaways: [
      'Horizontal fragmentation reconstructs via `UNION`; Vertical via `NATURAL JOIN` on PK.',
      'Distributed joins across shards are expensive—co-locate related tables by shard key.',
      'CAP applies strictly during network partitions; PACELC captures latency vs. consistency in normal operation too.',
    ],
    codeOrDiagramTitle: 'Two-Phase Commit (2PC) & Fragmentation Rules',
    codeOrDiagram: `Coordinator                  Participant A        Participant B
    |── Phase 1: PREPARE ───────▶|                   |
    |── Phase 1: PREPARE ───────────────────────────▶|
    |◀─ Vote: READY (WAL flushed)|                   |
    |◀─ Vote: READY (WAL flushed)────────────────────|
    |── Phase 2: COMMIT ────────▶|                   |
    |── Phase 2: COMMIT ────────────────────────────▶|`,
    relatedConceptIds: ['dbms_u4_transactions', 'dbms_u4_hashing', 'dbms_u4_backup_recovery'],
    practiceQuestions: [
      {
        id: 'pq_u4_20_1',
        difficulty: 'advanced',
        prompt: 'During Two-Phase Commit, why can a participant that voted READY not unilaterally abort if the coordinator temporarily goes offline?',
        hint: 'What if the coordinator already told another participant to COMMIT right before crashing?',
        answer: 'Once a participant votes YES/READY, it promises to obey the coordinator’s decision—another participant may have already committed, so unilateral abort would break distributed atomicity.',
      },
    ],
    practicePrompt: 'State the three correctness rules for Database Fragmentation (Completeness, Reconstruction, Disjointness).',
  },
];
