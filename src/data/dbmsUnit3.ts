import type { DbmsChapter } from './dbmsCurriculumTypes';

export const DBMS_UNIT_3_CHAPTERS: DbmsChapter[] = [
  {
    id: 'dbms_u3_functional_dependencies',
    unitNumber: 3,
    code: '3.1',
    title: 'Functional Dependencies',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'A Functional Dependency (X → Y) means that knowing the value of attribute(s) X uniquely determines the value of attribute(s) Y across every valid row.',
    detailedExplanation:
      'Functional Dependencies (FDs) formalize semantic constraints of a domain rather than relying on sample row guesses. Formally, X → Y holds on relation R iff for every pair of tuples t1, t2 in any legal instance r(R), t1[X] = t2[X] implies t1[Y] = t2[Y]. An FD is Trivial when Y ⊆ X (always holds), and Non-Trivial otherwise. FDs form the mathematical foundation for finding Candidate Keys, Canonical Covers, and proving 2NF, 3NF, and BCNF.',
    summaryEn:
      'Formalizes determinant-to-dependent relationships (X → Y), distinguishing trivial vs. non-trivial and full vs. partial dependencies.',
    summaryKn:
      'X ಮೌಲ್ಯವು ತಿಳಿದಿದ್ದರೆ Y ಮೌಲ್ಯವನ್ನು ನಿಖರವಾಗಿ ನಿರ್ಧರಿಸಬಹುದಾದರೆ ಅದನ್ನು X → Y (Functional Dependency) ಎನ್ನುತ್ತೇವೆ.',
    realWorldExample:
      'In a university schema, `student_uid → student_name, dob` holds because every student UID belongs to one person; conversely, `student_name → student_uid` does NOT hold because two students can share the same name.',
    definitions: [
      { term: 'Determinant (LHS)', definition: 'The left-hand attribute set X in X → Y.' },
      { term: 'Trivial FD', definition: 'X → Y where Y ⊆ X (e.g., `{A, B} → A`), which holds trivially in every relation.' },
      { term: 'Full vs. Partial FD', definition: 'X → Y is full if removing any attribute from X breaks the dependency; otherwise partial.' },
    ],
    learningObjectives: [
      'Identify valid vs. invalid Functional Dependencies from domain specifications.',
      'Differentiate trivial, non-trivial, completely non-trivial, partial, and transitive FDs.',
      'Explain why an FD is a schema property across all possible future states, not just current rows.',
    ],
    difficultyLevels: {
      beginner: 'Read `A → B` as "If two rows have the same A, they MUST have the same B".',
      intermediate: 'Spot partial FDs (`AB → C` when `A → C` already holds) and transitive FDs (`A → B` and `B → C` for non-prime B, C).',
      advanced: 'Compute minimal/canonical cover `Fc` by decomposing RHS to singletons, eliminating extraneous LHS attributes, and removing redundant FDs.',
    },
    keyTakeaways: [
      'FDs come from real-world domain rules, never solely from a sample snapshot.',
      'Every Candidate Key K implies K → R.',
      'Unwanted FDs whose LHS is not a Super Key cause redundancy and anomalies.',
    ],
    codeOrDiagramTitle: 'Testing FDs Against Sample vs. Domain Rules',
    codeOrDiagram: `Relation: Enrollment(student_uid, course_id, course_title, grade)
Domain FDs:
  {student_uid, course_id} → grade        [Full FD on Candidate Key]
  course_id → course_title                [Partial FD -> violates 2NF!]
  {student_uid, course_id} → course_id    [Trivial FD]`,
    relatedConceptIds: ['dbms_u3_attribute_closure', 'dbms_u3_armstrong_axioms', 'dbms_u3_2nf'],
    practiceQuestions: [
      {
        id: 'pq_u3_1_1',
        difficulty: 'intermediate',
        prompt: 'If `A → B` holds on R, does `B → A` automatically hold?',
        hint: 'Think of `student_uid → birth_year`.',
        answer: 'No! Multiple distinct A values can map to the same B value (e.g., many students born in 2005).',
      },
    ],
    practicePrompt: 'Explain the difference between a Trivial FD and a Partial FD with an exam example.',
  },
  {
    id: 'dbms_u3_attribute_closure',
    unitNumber: 3,
    code: '3.2',
    title: 'Attribute Closure',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'Attribute Closure (X+) is the complete set of all attributes whose values can be logically deduced starting from X using the given Functional Dependencies F.',
    detailedExplanation:
      'Rather than computing the exponentially huge closure F+ of all FDs, DBMS algorithms compute X+ in polynomial time: initialize `result := X`, then repeatedly scan every FD `L → R` in F; whenever `L ⊆ result`, add `R` into `result` until no new attributes appear. Attribute closure solves three core problems instantly: (1) testing whether `X → Y` is implied by F (check if `Y ⊆ X+`), (2) testing if X is a Super Key (`X+ == R`), and (3) validating Dependency Preservation.',
    summaryEn:
      'Iterative linear-time algorithm to compute X+ from F, powering FD entailment tests and Super Key / Candidate Key verification.',
    summaryKn:
      'Attribute Closure (X+) ಎಂದರೆ ಕೊಟ್ಟಿರುವ FDs ಸಹಾಯದಿಂದ X ಗುಣಲಕ್ಷಣಗಳಿಂದ ನಿರ್ಧರಿಸಬಹುದಾದ ಎಲ್ಲಾ ಗುಣಲಕ್ಷಣಗಳ ಪೂರ್ಣ ಗಣವಾಗಿದೆ.',
    realWorldExample:
      'During database schema verification, a linter computes `X+` for every table FD to verify whether `X` covers all columns (BCNF compliance) in milliseconds.',
    definitions: [
      { term: 'Attribute Closure (X+)', definition: 'All attributes functionally determined by attribute set X under F.' },
      { term: 'Entailment Test', definition: 'X → Y belongs to F+ if and only if Y ⊆ X+.' },
    ],
    learningObjectives: [
      'Execute the iterative Attribute Closure algorithm accurately by hand.',
      'Use X+ to verify whether an unseen FD `X → Y` follows from F.',
      'Detect extraneous attributes on the LHS of an FD via closure checks.',
    ],
    difficultyLevels: {
      beginner: 'Start with X in your basket, then keep tossing in the right-hand side of any rule whose left-hand side is already in your basket.',
      intermediate: 'Prove an attribute A in `XA → B` is extraneous iff `B ⊆ X+` under F.',
      advanced: 'Understand why computing X+ takes O(|F| · |R|) time whereas materializing full F+ is exponential in |R|.',
    },
    keyTakeaways: [
      'Always iterate until a full pass adds zero new attributes (fixed point).',
      'X is a Super Key iff `X+ = all attributes of R`.',
      'X+ avoids computing the full F+ set.',
    ],
    codeOrDiagramTitle: 'Step-by-Step Closure Trace',
    codeOrDiagram: `R(A, B, C, D, E),  F = { A → B, BC → D, D → E }
Compute (AC)+:
  Pass 0: {A, C}
  Pass 1: A ⊆ {A,C}   -> add B  => {A, B, C}
  Pass 2: BC ⊆ {A,B,C}-> add D  => {A, B, C, D}
  Pass 3: D ⊆ {A..D}  -> add E  => {A, B, C, D, E} = R
Conclusion: (AC)+ = R, so AC is a Super Key!`,
    relatedConceptIds: ['dbms_u3_functional_dependencies', 'dbms_u3_candidate_key_id', 'dbms_u3_bcnf'],
    practiceQuestions: [
      {
        id: 'pq_u3_2_1',
        difficulty: 'intermediate',
        prompt: 'Given R(A,B,C,D) and F = {A → B, B → C, C → D}, compute (B)+ and check if B → D is implied.',
        hint: 'Start with {B} and apply FDs step by step.',
        answer: '(B)+ = {B, C, D}. Since D ∈ {B, C, D}, B → D is implied (though B is not a Super Key because A is missing).',
      },
    ],
    practicePrompt: 'Compute (AB)+ for F = { A → C, B → D, CD → E } over R(A,B,C,D,E).',
  },
  {
    id: 'dbms_u3_candidate_key_id',
    unitNumber: 3,
    code: '3.3',
    title: 'Candidate Key Identification',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'Candidate Key Identification finds every minimal attribute set K whose closure K+ equals all attributes of R, using Essential, Middle, and Redundant attribute grouping.',
    detailedExplanation:
      'To find ALL Candidate Keys systematically without missing hidden alternate keys: classify attributes of R into (1) Essential (appear on NO RHS of any FD in F — MUST be inside EVERY Candidate Key!), (2) RHS-only (appear on RHS but never LHS — cannot help expand closure except trivially), and (3) Both LHS & RHS (optional candidates to combine with Essential attributes). First check `Essential+`; if `Essential+ == R`, then `Essential` is the ONLY Candidate Key! Otherwise expand `Essential` with subsets of Both-side attributes until minimal sets cover R.',
    summaryEn:
      'Systematic algorithm categorizing essential vs. optional attributes to find all minimal Candidate Keys and Prime Attributes.',
    summaryKn:
      'ಕೋಷ್ಟಕದ ಎಲ್ಲಾ ಕನಿಷ್ಠ Candidate Key ಗಳನ್ನು ಮತ್ತು Prime Attribute ಗಳನ್ನು ವ್ಯವಸ್ಥಿತವಾಗಿ ಪತ್ತೆಹಚ್ಚುವ ವಿಧಾನ.',
    realWorldExample:
      'Identifying that `{Student, Subject}` and `{Student, Faculty}` are both Candidate Keys prevents mistakenly thinking a schema has only one key during 3NF/BCNF checks.',
    definitions: [
      { term: 'Essential Attribute', definition: 'Attribute never appearing on any RHS of F; guaranteed to belong to every Candidate Key.' },
      { term: 'Prime Attribute', definition: 'Attribute present in at least one discovered Candidate Key.' },
    ],
    learningObjectives: [
      'Identify Essential attributes immediately from any FD set F.',
      'Discover all Candidate Keys systematically—not just the first one.',
      'Derive the exact set of Prime vs. Non-Prime attributes for normal form classification.',
    ],
    difficultyLevels: {
      beginner: 'Any column that never appears on the right side of an arrow MUST be inside every key.',
      intermediate: 'When an FD swaps a prime attribute (e.g., `AB → C` and `C → A`), remember to replace `A` with `C` to find the second Candidate Key `{BC}`!',
      advanced: 'Recognize that a relation with N attributes can theoretically have exponentially many Candidate Keys (up to C(N, N/2)), making complete enumeration NP-hard in worst cases.',
    },
    keyTakeaways: [
      'If `Essential+ = R`, there is a single unique Candidate Key.',
      'Look at RHS → Prime LHS swaps to catch alternate Candidate Keys.',
      'Never stop after finding one Candidate Key when testing 2NF/3NF.',
    ],
    codeOrDiagramTitle: 'Finding Multiple Candidate Keys via Closure',
    codeOrDiagram: `R(A, B, C),  F = { AB → C, C → A }
1. RHS attributes: {C, A}  |  Never on RHS (Essential): {B}
2. Check (B)+ = {B} != R
3. Try {B} + 1 attribute:
   - (AB)+ = {A, B, C} = R  ==> Candidate Key 1: AB
   - (BC)+ = {B, C, A} = R  ==> Candidate Key 2: BC
Prime Attributes = {A, B, C} (every attribute is prime!).`,
    relatedConceptIds: ['dbms_u3_attribute_closure', 'dbms_u1_candidate_super_keys', 'dbms_u3_3nf'],
    practiceQuestions: [
      {
        id: 'pq_u3_3_1',
        difficulty: 'intermediate',
        prompt: 'Find all Candidate Keys of R(A,B,C,D) with F = { A → B, B → C, C → A }.',
        hint: 'Which attribute never appears on any RHS?',
        answer: 'D is Essential (never on RHS). Checking {AD}+ = R, {BD}+ = R, {CD}+ = R -> Candidate Keys are {AD, BD, CD}.',
      },
    ],
    practicePrompt: 'Determine all Candidate Keys and Non-Prime attributes of R(P,Q,R,S) with F = { P → Q, QR → S }.',
  },
  {
    id: 'dbms_u3_armstrong_axioms',
    unitNumber: 3,
    code: '3.4',
    title: "Armstrong's Axioms",
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      "Armstrong's Axioms are three sound and complete inference rules—Reflexivity, Augmentation, and Transitivity—used to derive every implied Functional Dependency.",
    detailedExplanation:
      'William Armstrong proved in 1974 that three simple axioms are both Sound (never infer a false FD) and Complete (generate ALL FDs in F+): (IR1) Reflexivity: if Y ⊆ X, then X → Y; (IR2) Augmentation: if X → Y, then XZ → YZ; (IR3) Transitivity: if X → Y and Y → Z, then X → Z. Three handy derived rules follow immediately: Union (`X → Y, X → Z ⟹ X → YZ`), Decomposition (`X → YZ ⟹ X → Y`), and Pseudotransitivity (`X → Y, WY → Z ⟹ WX → Z`).',
    summaryEn:
      'Sound and complete inference system (Reflexivity, Augmentation, Transitivity + Union/Decomposition) generating the closure F+.',
    summaryKn:
      'Armstrong ಅವರ Reflexivity, Augmentation ಮತ್ತು Transitivity ನಿಯಮಗಳು ಎಲ್ಲಾ ಅಂತರ್ಗತ Functional Dependencies ಗಳನ್ನು ಸಾಬೀತುಪಡಿಸಲು ಬಳಕೆಯಾಗುತ್ತವೆ.',
    realWorldExample:
      'If `course_id → dept_id` and `dept_id → dean_uid`, Transitivity proves `course_id → dean_uid`, exposing a transitive 3NF violation.',
    definitions: [
      { term: 'Soundness', definition: 'Every FD derived by Armstrong’s Axioms genuinely holds in every legal relation instance.' },
      { term: 'Completeness', definition: 'Repeated application of the three axioms derives every single FD in F+.' },
      { term: 'Decomposition Rule', definition: 'Allows splitting multi-attribute RHS (`X → AB`) into singletons (`X → A`, `X → B`).' },
    ],
    learningObjectives: [
      'State and apply Reflexivity, Augmentation, and Transitivity.',
      'Derive Union, Decomposition, and Pseudotransitivity from the three base axioms.',
      'Prove an unseen FD formally via step-by-step axiom derivations.',
    ],
    difficultyLevels: {
      beginner: 'Reflexivity = you determine yourself; Augmentation = tack the same extra column onto both sides; Transitivity = A→B and B→C means A→C.',
      intermediate: 'Note carefully: you CAN decompose the RIGHT side (`X → AB` gives `X → A`), but NEVER decompose the LEFT side (`AB → C` does NOT imply `A → C`)!',
      advanced: 'Prove soundness and completeness of Armstrong’s Axioms using counterexample two-tuple relation construction.',
    },
    keyTakeaways: [
      'Right-hand side splits freely; Left-hand side CANNOT be split arbitrarily.',
      'Augmentation lets us match LHS attributes before applying Transitivity.',
      'Forms the logical proof engine behind canonical covers.',
    ],
    codeOrDiagramTitle: 'Formal Derivation Proof Example',
    codeOrDiagram: `Given: A → B  and  BC → D.   Prove: AC → D
1. A → B        (Given)
2. AC → BC      (Augmentation of 1 with C)
3. BC → D       (Given)
4. AC → D       (Transitivity of 2 and 3)   Q.E.D.`,
    relatedConceptIds: ['dbms_u3_functional_dependencies', 'dbms_u3_attribute_closure', 'dbms_u3_dependency_preservation'],
    practiceQuestions: [
      {
        id: 'pq_u3_4_1',
        difficulty: 'intermediate',
        prompt: 'Does `AB → C` imply `A → C` by Decomposition?',
        hint: 'Which side of an arrow can be decomposed?',
        answer: 'No! Decomposition applies ONLY to the right-hand side (`X → YZ` implies `X → Y`). Splitting the LHS is a classic fallacy.',
      },
    ],
    practicePrompt: 'Using Armstrong’s Axioms, derive the Union rule from Reflexivity, Augmentation, and Transitivity.',
  },
  {
    id: 'dbms_u3_anomalies',
    unitNumber: 3,
    code: '3.5',
    title: 'Database Anomalies',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'Poorly designed unnormalized tables suffer from redundant data, causing Insertion, Deletion, and Update Anomalies when facts are mixed into one table.',
    detailedExplanation:
      'When two independent entities (like `Student` and `Course` or `Department`) are combined into one wide flat table `Enroll_Flat(student_uid, student_name, course_id, course_title, instructor_office)`, three severe anomalies emerge: (1) Insertion Anomaly—you cannot register a brand-new Course until at least one Student enrolls (or you leave `student_uid` NULL, violating Entity Integrity); (2) Deletion Anomaly—removing the last student in a course accidentally erases the course’s title and office info; (3) Update Anomaly—moving `instructor_office` requires updating 200 duplicate rows, risking partial inconsistency.',
    summaryEn:
      'Demonstrates Insertion, Deletion, and Update anomalies caused by mixing unrelated entity facts in one unnormalized table.',
    summaryKn:
      'ಸರಿಯಾಗಿ ವಿಭಜಿಸದ ಕೋಷ್ಟಕಗಳಲ್ಲಿ ಡೇಟಾ ಪುನರಾವರ್ತನೆಯಿಂದಾಗಿ Insertion, Deletion ಮತ್ತು Update ದೋಷಗಳು (Anomalies) ಉಂಟಾಗುತ್ತವೆ.',
    realWorldExample:
      'If `classroom_name` and `teacher_email` are duplicated in every `assessment_submissions` row, changing a teacher’s email requires updating thousands of submission records or risking split data.',
    definitions: [
      { term: 'Insertion Anomaly', definition: 'Inability to store an independent fact without fabricating another unrelated entity’s key.' },
      { term: 'Deletion Anomaly', definition: 'Unintended loss of valuable independent facts when deleting an unrelated record.' },
      { term: 'Update Anomaly', definition: 'Having to update duplicated attribute copies across many rows, risking partial stale values.' },
    ],
    learningObjectives: [
      'Spot Insertion, Deletion, and Update anomalies in denormalized tables.',
      'Trace each anomaly back to an underlying partial or transitive FD.',
      'Eliminate anomalies via principled lossless decomposition into normal forms.',
    ],
    difficultyLevels: {
      beginner: 'One fact in one place: stop storing Course details inside every Student row!',
      intermediate: 'Map Partial FDs and Transitive FDs directly to concrete Insertion/Deletion/Update failure scenarios.',
      advanced: 'Balance normalization benefits against controlled analytical denormalization (star schemas) where read-only OLAP tables are derived via ETL.',
    },
    keyTakeaways: [
      'Redundancy is the root cause of all three update anomalies.',
      'NULL-heavy wide tables often signal mixed entity types.',
      'Normalization resolves anomalies systematically.',
    ],
    codeOrDiagramTitle: 'Anomalies in Mixed Flat Table',
    codeOrDiagram: `Bad Table: Enrollment(student_uid, course_id, course_title, credits)
- Insert Anomaly: Cannot add new course ('CS-401', 'Distributed DB', 4) with 0 students!
- Delete Anomaly: Drop last student in 'CS-401' -> course_title & credits vanish!
- Update Anomaly: Change 'CS-401' credits in row 1 only -> contradictory credits!`,
    relatedConceptIds: ['dbms_u1_file_vs_dbms', 'dbms_u3_1nf', 'dbms_u3_2nf'],
    practiceQuestions: [
      {
        id: 'pq_u3_5_1',
        difficulty: 'beginner',
        prompt: 'Which anomaly occurs if deleting the final employee assigned to Project X erases Project X’s budget and location?',
        hint: 'An unintended side effect of DELETE.',
        answer: 'A Deletion Anomaly.',
      },
    ],
    practicePrompt: 'Give an Insertion, Deletion, and Update anomaly example for `Order(order_id, product_id, product_price, qty)`.',
  },
  {
    id: 'dbms_u3_1nf',
    unitNumber: 3,
    code: '3.6',
    title: 'First Normal Form',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'First Normal Form (1NF) requires every table column to hold only single atomic (indivisible) values—with no repeating groups, arrays, or comma-separated lists.',
    detailedExplanation:
      'Formally defined by Codd’s relational model, a relation is in 1NF iff the domain of every attribute contains only atomic values and every tuple holds a single value from that domain for each attribute (no nested relations or multi-valued sets). Repeating column groups like `skill1, skill2, skill3` or comma-packed strings `"SQL,ER,BCNF"` violate 1NF because SQL joins, indexing, and aggregates cannot operate cleanly inside string lists. Fix 1NF violations by moving multi-valued attributes into a separate child table.',
    summaryEn:
      'Enforces atomic single-valued attributes, eliminates repeating groups/comma lists, and guarantees a well-defined primary key.',
    summaryKn:
      'First Normal Form (1NF) ಪ್ರಕಾರ ಕೋಷ್ಟಕದ ಪ್ರತಿಯೊಂದು ಸೆಲ್‌ನಲ್ಲಿಯೂ ಕೇವಲ ಒಂದೇ ಅವಿಭಾಜ್ಯ (Atomic) ಮೌಲ್ಯವಿರಬೇಕು; ಪಟ್ಟಿಗಳಿಗೆ ಅವಕಾಶವಿಲ್ಲ.',
    realWorldExample:
      'Instead of storing `"DBMS,OS,CN"` in a single `subjects` string column on a teacher row, normalize into `teacher_subjects(teacher_uid, subject_code)` so queries can index and join cleanly.',
    definitions: [
      { term: 'Atomic Value', definition: 'An indivisible scalar domain value from the relational query engine’s perspective.' },
      { term: 'Repeating Group', definition: 'Multiple numbered columns (`phone1, phone2`) or packed arrays inside one attribute.' },
    ],
    learningObjectives: [
      'Identify non-atomic cells and repeating groups in unnormalized tables.',
      'Decompose multi-valued attributes into separate normalized child relations.',
      'Recognize why 1NF is the entry ticket to the relational model.',
    ],
    difficultyLevels: {
      beginner: 'One cell = one single value (no comma-separated lists or `phone1, phone2, phone3`).',
      intermediate: 'Determine composite primary keys for newly extracted 1NF child tables.',
      advanced: 'Evaluate when modern PostgreSQL `JSONB` or `TEXT[]` columns are intentionally chosen vs. strict 1NF relational decomposition.',
    },
    keyTakeaways: [
      'Every relational table in standard SQL theory starts at 1NF.',
      'Atomicity depends on how the application queries the value (e.g., full timestamp vs. parsed components).',
      'Separate tables with composite PKs solve repeating groups cleanly.',
    ],
    codeOrDiagramTitle: 'Converting Unnormalized Table to 1NF',
    codeOrDiagram: `-- Unnormalized: Student(uid, name, phones='9811...,9822...')
-- 1NF Normalized:
Student(uid PK, name)
Student_Phones(uid FK, phone_number, PRIMARY KEY (uid, phone_number))`,
    relatedConceptIds: ['dbms_u1_entities_attributes', 'dbms_u3_2nf', 'dbms_u3_anomalies'],
    practiceQuestions: [
      {
        id: 'pq_u3_6_1',
        difficulty: 'beginner',
        prompt: 'Does a table with columns `(student_uid, course1, course2, course3)` satisfy 1NF?',
        hint: 'What happens if a student takes 4 courses?',
        answer: 'No. `course1, course2, course3` is a repeating group. Move courses into `enrollments(student_uid, course_id)`.',
      },
    ],
    practicePrompt: 'Convert `Course(course_id, title, textbooks="Elmasri,Korth")` into 1NF tables.',
  },
  {
    id: 'dbms_u3_2nf',
    unitNumber: 3,
    code: '3.7',
    title: 'Second Normal Form',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Second Normal Form (2NF) requires 1NF plus zero Partial Dependencies: every non-prime attribute must depend on the ENTIRE Candidate Key, never just part of a composite key.',
    detailedExplanation:
      'A relation R is in 2NF iff it is in 1NF and no non-prime attribute is partially dependent on any Candidate Key of R. Formally, there is no non-prime attribute A and proper subset X ⊂ K of some Candidate Key K such that X → A holds. Crucially: (1) if every Candidate Key of R is a single attribute, R is AUTOMATICALLY in 2NF! (2) 2NF still allows partial dependencies whose RHS is a prime attribute, and still permits transitive dependencies.',
    summaryEn:
      'Eliminates partial functional dependencies of non-prime attributes on proper subsets of composite candidate keys.',
    summaryKn:
      'Second Normal Form (2NF) ನಲ್ಲಿ ಪ್ರತಿ non-prime attribute ಪೂರ್ಣ Candidate Key ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿರಬೇಕು (Partial Dependency ಇರಬಾರದು).',
    realWorldExample:
      'In `Enrollment(student_uid, course_id, course_title, grade)` with key `(student_uid, course_id)`, `course_title` depends only on `course_id` (a proper subset of the key), violating 2NF. Splitting out `Course(course_id, course_title)` fixes it.',
    definitions: [
      { term: 'Partial Dependency', definition: 'FD X → A where A is non-prime and X is a proper subset of some Candidate Key K.' },
      { term: 'Full Functional Dependency', definition: 'X → Y where removing any single attribute from X breaks the dependency.' },
    ],
    learningObjectives: [
      'Test a relation with composite candidate keys for 2NF compliance.',
      'Explain why single-attribute-key relations automatically satisfy 2NF.',
      'Decompose partial dependencies cleanly into separate tables.',
    ],
    difficultyLevels: {
      beginner: 'If a table has a two-column Primary Key `(A, B)`, make sure no regular column depends on just `A` alone or `B` alone.',
      intermediate: 'Remember to check ALL Candidate Keys—not just the Primary Key—when checking for partial dependencies!',
      advanced: 'Prove why decomposing R(A,B,C) on partial FD `A → C` into `R1(A,C)` and `R2(A,B)` is guaranteed Lossless-Join.',
    },
    keyTakeaways: [
      'Single-column Candidate Keys can never have proper non-empty subsets -> always in 2NF.',
      'Check every Candidate Key, not only the chosen Primary Key.',
      '2NF eliminates redundancy caused by partial dependencies.',
    ],
    codeOrDiagramTitle: 'Resolving a 2NF Partial Dependency',
    codeOrDiagram: `Relation: Enrollment(student_uid, course_id, grade, course_credits)
Candidate Key: {student_uid, course_id}
FD violating 2NF: course_id → course_credits  (partial dependency!)

2NF Decomposition:
  Enrollment(student_uid, course_id, grade)   [PK: (student_uid, course_id)]
  Course(course_id, course_credits)           [PK: course_id]`,
    relatedConceptIds: ['dbms_u3_1nf', 'dbms_u3_3nf', 'dbms_u3_functional_dependencies'],
    practiceQuestions: [
      {
        id: 'pq_u3_7_1',
        difficulty: 'intermediate',
        prompt: 'In R(A,B,C,D) with Candidate Key {A,B} and FDs `{AB → C, B → D}`, which FD violates 2NF?',
        hint: 'Look for a non-prime attribute depending on part of {A,B}.',
        answer: '`B → D` violates 2NF because D is non-prime and depends only on proper subset {B} of key {A,B}.',
      },
    ],
    practicePrompt: 'Explain why a table with Candidate Keys {email} and {roll_no} can never fail 2NF (assuming 1NF).',
  },
  {
    id: 'dbms_u3_3nf',
    unitNumber: 3,
    code: '3.8',
    title: 'Third Normal Form',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'Third Normal Form (3NF) eliminates Transitive Dependencies: every non-trivial FD X → A must either have X as a Super Key OR have A be a Prime Attribute.',
    detailedExplanation:
      'Intuitively, 3NF forbids non-prime attributes from depending on other non-prime attributes ("every non-key column must depend on the key, the whole key, and nothing but the key"). Formally, relation R is in 3NF iff for every non-trivial FD X → A in F+, EITHER (a) X is a Super Key of R, OR (b) A is a Prime Attribute (part of some Candidate Key). Notice that 3NF allows Prime Attributes on the RHS even when X is not a Super Key—which preserves dependencies but leaves rare overlapping-key anomalies fixed only by BCNF.',
    summaryEn:
      'Removes transitive dependencies of non-prime attributes while allowing prime-RHS dependencies for dependency preservation.',
    summaryKn:
      'Third Normal Form (3NF) ನಲ್ಲಿ ಪ್ರತಿಯೊಂದು non-trivial X → A ನಿಯಮಕ್ಕೂ X ಸೂಪರ್ ಕೀ ಆಗಿರಬೇಕು ಅಥವಾ A ಪ್ರೈಮ್ ಗುಣಲಕ್ಷಣವಾಗಿರಬೇಕು (Transitive Dependency ಇರಬಾರದು).',
    realWorldExample:
      'In `Course(course_id, title, dept_id, dept_building)`, `course_id → dept_id → dept_building` is a transitive dependency. Extracting `Department(dept_id, dept_building)` achieves 3NF.',
    definitions: [
      { term: 'Transitive Dependency', definition: 'X → Y and Y → A where Y is not a Candidate Key subset and A is non-prime.' },
      { term: '3NF Prime Exception', definition: 'Permits X → A even when X is not a Super Key provided A is part of a Candidate Key.' },
    ],
    learningObjectives: [
      'Apply the exact formal 3NF rule (`X is Super Key OR A is Prime`) to any FD set.',
      'Eliminate transitive dependencies by splitting determinant-dependent tables.',
      'Execute Bernstein’s 3NF Synthesis algorithm to guarantee Lossless + Dependency-Preserving tables.',
    ],
    difficultyLevels: {
      beginner: 'Non-key columns should not determine other non-key columns (like `zip_code → city` inside a `Student` table).',
      intermediate: 'Test every FD `X → A` cleanly: check `X+ = R` first; if false, check whether `A` belongs to ANY Candidate Key.',
      advanced: 'Run 3NF Synthesis: find Minimal Cover `Fc`, create one relation per LHS group `(X, Y)`, and add a relation for a Candidate Key if none is contained.',
    },
    keyTakeaways: [
      'Every relation in 3NF is automatically in 2NF and 1NF.',
      '3NF ALWAYS admits a Lossless-Join AND Dependency-Preserving decomposition.',
      'The "A is Prime" clause is the exact difference between 3NF and BCNF.',
    ],
    codeOrDiagramTitle: 'Fixing a 3NF Transitive Dependency',
    codeOrDiagram: `Before (2NF, fails 3NF):
  Classroom(id PK, name, teacher_uid, teacher_email)
  FD: id → teacher_uid → teacher_email   [teacher_uid is NOT a Super Key, teacher_email is non-prime!]

After (3NF):
  Classroom(id PK, name, teacher_uid FK)
  Teacher(teacher_uid PK, teacher_email)`,
    relatedConceptIds: ['dbms_u3_2nf', 'dbms_u3_bcnf', 'dbms_u3_dependency_preservation'],
    practiceQuestions: [
      {
        id: 'pq_u3_8_1',
        difficulty: 'intermediate',
        prompt: 'In R(A,B,C) with Candidate Keys {AB} and {BC} and FDs `{AB → C, C → A}`, is R in 3NF?',
        hint: 'Check `C → A`: is `C` a Super Key, or is `A` Prime?',
        answer: 'Yes! For `AB → C`, `AB` is a Super Key. For `C → A`, even though `C` is not a Super Key, `A` is a Prime Attribute (in key `{AB}`), satisfying 3NF.',
      },
    ],
    practicePrompt: 'Apply 3NF rules to `Invoice(inv_id, cust_id, cust_city, amount)` and produce normalized tables.',
  },
  {
    id: 'dbms_u3_bcnf',
    unitNumber: 3,
    code: '3.9',
    title: 'Boyce-Codd Normal Form',
    estimatedMinutes: 30,
    difficulty: 'advanced',
    simpleExplanation:
      'Boyce-Codd Normal Form (BCNF) strengthens 3NF by requiring that for EVERY non-trivial functional dependency X → Y, X MUST be a Super Key—no exceptions for prime attributes.',
    detailedExplanation:
      'Even when a table is in 3NF, multiple overlapping Candidate Keys can leave subtle redundancy if a prime attribute depends on a determinant that is not a Super Key. BCNF eliminates that loophole completely: R is in BCNF iff for every non-trivial FD X → Y in F+, X is a Super Key of R. BCNF always guarantees Lossless-Join decomposition, though in rare cyclic FD cases BCNF cannot simultaneously preserve all FDs (forcing engineers to choose between BCNF zero-redundancy and 3NF dependency preservation).',
    summaryEn:
      'Strict normal form requiring every non-trivial FD determinant X to be a Super Key, eliminating overlapping-key anomalies.',
    summaryKn:
      'BCNF ನಲ್ಲಿ ಪ್ರತಿಯೊಂದು non-trivial X → Y ನಿಯಮಕ್ಕೂ X ಕಡ್ಡಾಯವಾಗಿ Super Key ಆಗಿರಲೇಬೇಕು. ಇದು 3NF ಗಿಂತ ಕಠಿಣವಾದ ರೂಪವಾಗಿದೆ.',
    realWorldExample:
      'In `Advisory(Student, Subject, Faculty)` where `{Student, Subject} → Faculty` and `Faculty → Subject` (each professor teaches only one subject), the table is 3NF (Subject is prime) yet fails BCNF because Faculty is not a Super Key—duplicating `(Faculty, Subject)` per student!',
    definitions: [
      { term: 'BCNF Condition', definition: 'For every non-trivial FD X → Y, X+ must equal all attributes of R (X is a Super Key).' },
      { term: '3NF vs. BCNF Gap', definition: 'Occurs when a table has >= 2 overlapping composite Candidate Keys and an FD into a prime attribute from a non-superkey.' },
    ],
    learningObjectives: [
      'Test any relation schema and FD set for BCNF violations.',
      'Construct classic examples that satisfy 3NF yet violate BCNF.',
      'Decompose any BCNF-violating relation iteratively into Lossless BCNF tables.',
    ],
    difficultyLevels: {
      beginner: 'In BCNF, every arrow’s left side MUST be a unique key of the table—no exceptions.',
      intermediate: 'Know the invariant: ANY 2-attribute relation R(A, B) is ALWAYS in BCNF!',
      advanced: 'Contrast BCNF decomposition algorithm (always lossless, sometimes loses cyclic FDs) against 3NF synthesis (always lossless + dependency preserving).',
    },
    keyTakeaways: [
      'Every BCNF schema is guaranteed to be in 3NF, 2NF, and 1NF.',
      'Any two-column relation R(A, B) is trivially in BCNF.',
      'BCNF eliminates 100% of FD-driven redundancy.',
    ],
    codeOrDiagramTitle: 'Classic 3NF-but-not-BCNF Decomposition',
    codeOrDiagram: `R(Student, Subject, Faculty)
Candidate Keys: {Student, Subject} and {Student, Faculty}
FDs:
  {Student, Subject} → Faculty   [LHS is Super Key -> OK]
  Faculty → Subject              [Faculty is NOT a Super Key -> BCNF Violation!]

BCNF Lossless Split:
  R1(Faculty, Subject)   [PK: Faculty;  FD: Faculty → Subject]
  R2(Student, Faculty)   [PK: (Student, Faculty)]
(Note: R1 ⋈ R2 is Lossless, though checking {Student, Subject} → Faculty now requires joining R1 & R2!)`,
    relatedConceptIds: ['dbms_u3_3nf', 'dbms_u3_lossless_decomposition', 'dbms_u3_4nf'],
    practiceQuestions: [
      {
        id: 'pq_u3_9_1',
        difficulty: 'advanced',
        prompt: 'Why is every two-attribute relation R(A, B) guaranteed to be in BCNF regardless of FDs?',
        hint: 'List all possible non-trivial FDs on {A, B}.',
        answer: 'The only possible non-trivial FDs are `A → B` (making A a Super Key), `B → A` (making B a Super Key), or neither—so every non-trivial LHS is automatically a Super Key.',
      },
    ],
    practicePrompt: 'Decompose R(A, B, C, D) with F = { AB → C, C → D } into BCNF step by step.',
  },
  {
    id: 'dbms_u3_4nf',
    unitNumber: 3,
    code: '3.10',
    title: 'Fourth Normal Form',
    estimatedMinutes: 25,
    difficulty: 'advanced',
    simpleExplanation:
      'Fourth Normal Form (4NF) eliminates Multi-Valued Dependencies (MVDs) so two unrelated many-to-many lists for the same entity are never multiplied together into one table.',
    detailedExplanation:
      'A table in BCNF can have zero non-trivial FDs yet suffer massive Cartesian redundancy! When one entity independently has multiple values for attribute B and multiple unrelated values for attribute C—expressed as a Multi-Valued Dependency `A ↠ B` and `A ↠ C`—storing `(A, B, C)` forces storing every `B × C` combination (e.g., `Course ↠ Instructor` and `Course ↠ Textbook`). Relation R is in 4NF iff for every non-trivial MVD `X ↠ Y`, X is a Super Key.',
    summaryEn:
      'Handles Multi-Valued Dependencies (X ↠ Y) to prevent Cartesian-product redundancy inside all-key BCNF tables.',
    summaryKn:
      'Fourth Normal Form (4NF) ಒಂದೇ ಕೋಷ್ಟಕದಲ್ಲಿ ಎರಡು ಸ್ವತಂತ್ರ ಬಹು-ಮೌಲ್ಯದ ಪಟ್ಟಿಗಳ (Multi-Valued Dependencies) ಅನಗತ್ಯ ಗುಣಾಕಾರವನ್ನು ತಡೆಯುತ್ತದೆ.',
    realWorldExample:
      'If Course CS-304 has 3 instructors and 2 independent reference books, keeping `(course, instructor, book)` in one table forces 6 redundant rows; 4NF splits them into `Course_Instructors(course, instructor)` and `Course_Books(course, book)` (5 rows total).',
    definitions: [
      { term: 'Multi-Valued Dependency (X ↠ Y)', definition: 'Given X, the set of Y values is independent of all other attributes Z = R - X - Y.' },
      { term: '4NF Condition', definition: 'Every non-trivial MVD X ↠ Y has X as a Super Key.' },
    ],
    learningObjectives: [
      'Recognize independent multi-valued attributes causing Cartesian explosion inside all-key tables.',
      'Formalize MVDs (`X ↠ Y | Z`) and understand why FDs are a special case of MVDs.',
      'Decompose BCNF tables violating 4NF into independent 2-column relations.',
    ],
    difficultyLevels: {
      beginner: 'Never put two unrelated lists (like a student’s Hobbies AND Programming Languages) into the same table!',
      intermediate: 'Remember: an all-key table `R(A, B, C)` with no FDs is automatically in BCNF, yet fails 4NF if `A ↠ B | C`.',
      advanced: 'Apply Fagin’s MVD axioms (complementation `X ↠ Y ⟹ X ↠ (R − X − Y)`) during 4NF lossless verification.',
    },
    keyTakeaways: [
      'Every 4NF relation is automatically in BCNF.',
      'Every FD `X → Y` implies the MVD `X ↠ Y`.',
      'Splits independent 1:N lists cleanly before data explodes multiplicatively.',
    ],
    codeOrDiagramTitle: '4NF MVD Split Example',
    codeOrDiagram: `-- Fails 4NF (All-key BCNF, MVD: course ↠ faculty | textbook):
Course_Info(course_id, faculty_name, textbook)
  ('CS304', 'Dr. Rao', 'Elmasri'), ('CS304', 'Dr. Rao', 'Korth'),
  ('CS304', 'Prof. Bhat', 'Elmasri'), ('CS304', 'Prof. Bhat', 'Korth')

-- 4NF Normalized:
Course_Faculty(course_id, faculty_name)
Course_Textbooks(course_id, textbook)`,
    relatedConceptIds: ['dbms_u3_bcnf', 'dbms_u3_5nf', 'dbms_u3_schema_refinement'],
    practiceQuestions: [
      {
        id: 'pq_u3_10_1',
        difficulty: 'advanced',
        prompt: 'Why is `R(Student, Language, Sport)` with all 3 attributes in the Primary Key already in BCNF, yet still flawed?',
        hint: 'What happens if a student knows 3 languages and plays 4 sports?',
        answer: 'It has no non-trivial FDs (so BCNF holds), but `Student ↠ Language` and `Student ↠ Sport` force 3 × 4 = 12 redundant rows—violating 4NF.',
      },
    ],
    practicePrompt: 'Explain how an MVD `A ↠ B` differs from a standard FD `A → B`.',
  },
  {
    id: 'dbms_u3_5nf',
    unitNumber: 3,
    code: '3.11',
    title: 'Fifth Normal Form',
    estimatedMinutes: 25,
    difficulty: 'advanced',
    simpleExplanation:
      'Fifth Normal Form (5NF / Project-Join Normal Form) eliminates Join Dependencies so a table cannot be losslessly broken into three or more smaller tables unless joined on Super Keys.',
    detailedExplanation:
      'While 4NF splits a table into two projections via MVDs, rare 3-way cyclic constraints—called Join Dependencies `*(R1, R2, ..., Rn)`—only break cleanly into three or more tables! Specifically, if `R(Supplier, Part, Project)` obeys a symmetric constraint ("if Supplier S supplies Part P, Part P is used in Project J, and Supplier S supplies Project J, then `(S, P, J)` must appear"), it can be decomposed losslessly into `SP`, `PJ`, and `SJ`, even though NO 2-way split is lossless. A relation is in 5NF (PJNF) iff every non-trivial Join Dependency is implied by Candidate Keys.',
    summaryEn:
      'Project-Join Normal Form (PJNF) addressing n-way Join Dependencies that cannot be captured by FDs or 2-way MVDs.',
    summaryKn:
      'Fifth Normal Form (5NF) ಎಂಬುದು 3 ಅಥವಾ ಹೆಚ್ಚು ಕೋಷ್ಟಕಗಳ ನಡುವಿನ Join Dependencies ಗಳನ್ನು ನಿವಾರಿಸಿ ಡೇಟಾ ಪುನರಾವರ್ತನೆಯನ್ನು ತಡೆಯುತ್ತದೆ.',
    realWorldExample:
      'In an institutional procurement system where `(Vendor, Item, Lab)` records follow independent pairwise contracts `(Vendor-Item)`, `(Item-Lab)`, and `(Vendor-Lab)`, 5NF stores those 3 pairwise tables to avoid cyclic insert/delete anomalies.',
    definitions: [
      { term: 'Join Dependency *(R1..Rn)', definition: 'Holds on R iff R always equals the natural join `R1 ⋈ R2 ⋈ ... ⋈ Rn` of its projections.' },
      { term: '5NF (PJNF)', definition: 'Ultimate projection-join normal form where every Join Dependency is implied by Candidate Keys.' },
    ],
    learningObjectives: [
      'Define Join Dependencies and contrast them with 2-way MVDs.',
      'Recognize when a ternary relation CAN vs. CANNOT be decomposed into three binary projections.',
      'Understand why 5NF is the final normal form achievable solely through projection and natural join.',
    ],
    difficultyLevels: {
      beginner: '5NF checks whether a 3-way table really needs all 3 columns together or can split cleanly into 3 pairwise tables.',
      intermediate: 'Be careful: only split a ternary table `(A, B, C)` into `(A,B)`, `(B,C)`, `(A,C)` if the domain enforces the cyclic Join Dependency; otherwise joining creates spurious rows!',
      advanced: 'Apply Fagin’s Theorem proving 5NF/PJNF is implied by Candidate Keys when every binary/n-ary JD component contains a Candidate Key.',
    },
    keyTakeaways: [
      '5NF is strictly stronger than 4NF, BCNF, 3NF, 2NF, and 1NF.',
      'Do NOT blindly split ternary relationships unless the Join Dependency truly holds in domain rules.',
      'Beyond 5NF lies Domain-Key Normal Form (DKNF).',
    ],
    codeOrDiagramTitle: '5NF Ternary Projection-Join Structure',
    codeOrDiagram: `Ternary Relation: Supplies(Supplier, Part, Project)
If domain rule enforces JD *( {S,P}, {P,J}, {S,J} ):
  R1(Supplier, Part)
  R2(Part, Project)
  R3(Supplier, Project)
Lossless Reconstruction:  R1 ⋈ R2 ⋈ R3 = Supplies  (0 spurious tuples)`,
    relatedConceptIds: ['dbms_u3_4nf', 'dbms_u3_lossless_decomposition', 'dbms_u3_schema_refinement'],
    practiceQuestions: [
      {
        id: 'pq_u3_11_1',
        difficulty: 'advanced',
        prompt: 'What dangerous bug happens if you split a ternary relation `(Student, Course, Grade)` into 3 binary tables when no Join Dependency holds?',
        hint: 'What happens when you natural-join the 3 binary tables back together?',
        answer: 'A lossy decomposition: joining them creates spurious (phantom) `(Student, Course, Grade)` combinations that never existed.',
      },
    ],
    practicePrompt: 'Explain the relationship along the normal form hierarchy: 1NF ⊇ 2NF ⊇ 3NF ⊇ BCNF ⊇ 4NF ⊇ 5NF.',
  },
  {
    id: 'dbms_u3_lossless_decomposition',
    unitNumber: 3,
    code: '3.12',
    title: 'Lossless Decomposition',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'A decomposition of table R into R1 and R2 is Lossless-Join if joining R1 and R2 back together reconstructs the EXACT original rows with zero fake extra tuples.',
    detailedExplanation:
      'Decomposing a table into smaller tables must never lose information or invent spurious ("phantom") rows on natural join (`R1 ⋈ R2 = R` for every legal state). By Heath’s Theorem, splitting R into `{R1, R2}` is guaranteed Lossless-Join iff their common intersection `(R1 ∩ R2)` is a Super Key of at least ONE of `R1` or `R2`—formally `(R1 ∩ R2) → R1` or `(R1 ∩ R2) → R2` in `F+`. For multi-way splits `{R1..Rk}`, the Chase (Tableau) matrix algorithm verifies lossless join.',
    summaryEn:
      'Ensures decomposed relations recombine via natural join with zero spurious tuples using the shared-key intersection test.',
    summaryKn:
      'Lossless Decomposition ಕೋಷ್ಟಕಗಳನ್ನು ವಿಭಜಿಸಿದ ನಂತರ Natural Join ಮಾಡಿದಾಗ ಮೂಲ ಸಾಲುಗಳು ಯಾವುದೇ ತಪ್ಪು/ಹೆಚ್ಚುವರಿ ಸಾಲುಗಳಿಲ್ಲದೆ ಮರಳಿ ಸಿಗುವಂತೆ ಖಚಿತಪಡಿಸುತ್ತದೆ.',
    realWorldExample:
      'Splitting `R(student, course, credits)` into `R1(student, credits)` and `R2(course, credits)` is LOSSY because `credits` is not unique—joining on `credits` pairs every 4-credit student with every 4-credit course!',
    definitions: [
      { term: 'Spurious Tuples', definition: 'Fake non-existent combinations produced when joining a lossy decomposition.' },
      { term: 'Lossless Test (Binary)', definition: '`(R1 ∩ R2)+ ⊇ R1` OR `(R1 ∩ R2)+ ⊇ R2` under F.' },
    ],
    learningObjectives: [
      'Test any binary decomposition for the Lossless-Join property using Attribute Closure.',
      'Spot lossy decompositions that produce spurious tuples on natural join.',
      'Apply the Chase algorithm conceptually for n-way decompositions.',
    ],
    difficultyLevels: {
      beginner: 'The overlapping column(s) between the two split tables MUST uniquely identify rows in at least one of the two tables.',
      intermediate: 'Always treat Lossless-Join as non-negotiable; you may trade off Dependency Preservation in BCNF, but NEVER Losslessness.',
      advanced: 'Execute the Chase tableau test for 3+ sub-relations where binary sequential joins fail to reveal losslessness directly.',
    },
    keyTakeaways: [
      'Intersection `(R1 ∩ R2)` cannot be empty unless R is a single-row or trivial domain.',
      'Intersection must functionally determine all attributes of `R1` or `R2`.',
      'Lossy splits corrupt database query truth permanently.',
    ],
    codeOrDiagramTitle: 'Binary Lossless-Join Proof Formula',
    codeOrDiagram: `R(A, B, C),  F = { A → B }
Split 1: R1(A, B), R2(A, C)
  R1 ∩ R2 = {A}.   (A)+ = {A, B} ⊇ R1  ==> LOSSLESS!

Split 2 (BAD): R1(A, B), R2(B, C)
  R1 ∩ R2 = {B}.   (B)+ = {B} (neither R1 nor R2) ==> LOSSY (spurious rows)!`,
    relatedConceptIds: ['dbms_u3_dependency_preservation', 'dbms_u3_bcnf', 'dbms_u3_attribute_closure'],
    practiceQuestions: [
      {
        id: 'pq_u3_12_1',
        difficulty: 'intermediate',
        prompt: 'Given R(A,B,C,D) and F = {A → B, C → D}, is splitting into R1(A,B) and R2(C,D) lossless?',
        hint: 'What is `R1 ∩ R2`?',
        answer: 'No! `R1 ∩ R2 = ∅`, so joining R1 and R2 yields a Cartesian product full of spurious tuples.',
      },
    ],
    practicePrompt: 'Demonstrate with a 2-row counterexample how a lossy split creates spurious rows upon natural join.',
  },
  {
    id: 'dbms_u3_dependency_preservation',
    unitNumber: 3,
    code: '3.13',
    title: 'Dependency Preservation',
    estimatedMinutes: 30,
    difficulty: 'advanced',
    simpleExplanation:
      'A decomposition is Dependency Preserving if every Functional Dependency rule in F can be checked inside a single decomposed table without having to join tables on every write.',
    detailedExplanation:
      'Formally, let `F_i` be the projection of `F+` onto sub-relation `R_i` (all FDs whose attributes all lie inside `R_i`). Decomposition `{R1..Rk}` is Dependency Preserving iff `(F1 ∪ F2 ∪ ... ∪ Fk)+ == F+`. Practically, this means every constraint can be enforced cheaply via local UNIQUE / PRIMARY KEY indexes on individual tables rather than expensive cross-table joins or triggers during INSERT/UPDATE.',
    summaryEn:
      'Verifies whether `(F1 ∪ ... ∪ Fk)+ = F+` so constraints remain locally enforceable without cross-table joins.',
    summaryKn:
      'Dependency Preservation ಎಂದರೆ ವಿಭಜಿತ ಕೋಷ್ಟಕಗಳಲ್ಲೇ ಎಲ್ಲಾ ನಿಯಮಗಳನ್ನು (FDs) ಇತರ ಕೋಷ್ಟಕಗಳೊಂದಿಗೆ Join ಮಾಡದೆ ಸ್ಥಳೀಯವಾಗಿ ಪರಿಶೀಲಿಸಬಹುದಾಗಿದೆ.',
    realWorldExample:
      'In the classic BCNF split of `R(Student, Subject, Faculty)` into `R1(Faculty, Subject)` and `R2(Student, Faculty)`, the FD `{Student, Subject} → Faculty` spans BOTH tables—losing dependency preservation!',
    definitions: [
      { term: 'Projected FDs (F_Ri)', definition: 'Subset of F+ containing only attributes belonging to sub-relation Ri.' },
      { term: 'Dependency Preservation Test', definition: 'Checking whether `X → Y ∈ F` still holds in `(F_R1 ∪ ... ∪ F_Rk)+` via projected closure.' },
    ],
    learningObjectives: [
      'Verify Dependency Preservation cleanly without enumerating exponential F+ sets.',
      'Understand the engineering trade-off between 3NF (always preserves FDs) and BCNF (may lose FDs).',
      'Use projected closure algorithm on each FD `X → Y` in F.',
    ],
    difficultyLevels: {
      beginner: 'Dependency preservation means you don’t need to glue two tables back together just to check a uniqueness rule when inserting a row.',
      intermediate: 'To test whether `X → Y` is preserved, iteratively expand `result := X` by computing `(result ∩ R_i)+ ∩ R_i` across each sub-table.',
      advanced: 'Understand why 3NF synthesis always preserves all FDs while guaranteeing lossless join, making 3NF preferable when multi-table constraint triggers are too costly.',
    },
    keyTakeaways: [
      'A non-preserved FD forces cross-table joins or triggers on INSERT/UPDATE.',
      '3NF ALWAYS achieves both Lossless-Join and Dependency Preservation.',
      'BCNF ALWAYS achieves Lossless-Join, but may break Dependency Preservation.',
    ],
    codeOrDiagramTitle: 'Testing Dependency Preservation via Projected Closure',
    codeOrDiagram: `Check if X → Y is preserved in {R1, R2, ...}:
  result = X
  repeat until no change:
    for each sub-table R_i:
      t = (result ∩ R_i)+  [closure under F]
      result = result ∪ (t ∩ R_i)
  Preserved iff Y ⊆ result!`,
    relatedConceptIds: ['dbms_u3_lossless_decomposition', 'dbms_u3_3nf', 'dbms_u3_bcnf'],
    practiceQuestions: [
      {
        id: 'pq_u3_13_1',
        difficulty: 'advanced',
        prompt: 'Why is 3NF sometimes chosen over BCNF in high-throughput OLTP databases?',
        hint: 'Consider the write cost of enforcing a split multi-table FD.',
        answer: 'When BCNF breaks Dependency Preservation, enforcing the lost FD requires slow cross-table triggers/locks on every INSERT/UPDATE; 3NF preserves every FD via fast local UNIQUE indexes.',
      },
    ],
    practicePrompt: 'Test whether `R(A,B,C,D)` with `F = {AB → C, C → D, D → A}` split into `R1(A,B,C)` and `R2(C,D)` preserves `D → A`.',
  },
  {
    id: 'dbms_u3_schema_refinement',
    unitNumber: 3,
    code: '3.14',
    title: 'Schema Refinement',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'Schema Refinement is the end-to-end engineering workflow that validates an ER-derived schema using Functional Dependencies, normalization, and controlled denormalization for performance.',
    detailedExplanation:
      'Good database design combines top-down ER modeling with bottom-up Schema Refinement. After mapping ER diagrams into initial tables, architects verify Minimal Covers, audit each table against 3NF/BCNF/4NF, verify Lossless-Join and Dependency Preservation, and finally evaluate physical workload patterns: keeping OLTP transactional tables strictly normalized (3NF/BCNF) while selectively adding materialized views, summary caches, or star-schema fact/dimension denormalizations only where read benchmarks prove a bottleneck.',
    summaryEn:
      'End-to-end design workflow uniting ER mapping, canonical cover minimization, 3NF/BCNF verification, and measured denormalization.',
    summaryKn:
      'Schema Refinement ಎಂಬುದು ER ವಿನ್ಯಾಸ, Normalization ಮತ್ತು ನೈಜ ವೇಗದ ಅಗತ್ಯತೆಗಳ ನಡುವೆ ಸಮತೋಲನ ಸಾಧಿಸುವ ಪೂರ್ಣ ಡೇಟಾಬೇಸ್ ವಿನ್ಯಾಸ ಪ್ರಕ್ರಿಯೆಯಾಗಿದೆ.',
    realWorldExample:
      'In LearnSense AI, transactional tables (`classrooms`, `assessments`, `submissions`) stay strictly normalized, while `Conversation.lastMessageText` is deliberately cached for fast inbox sorting.',
    definitions: [
      { term: 'Canonical (Minimal) Cover Fc', definition: 'Minimal equivalent FD set with singleton RHS, no extraneous LHS attributes, and no redundant FDs.' },
      { term: 'Controlled Denormalization', definition: 'Intentional duplication (e.g., cached counters or materialized views) justified by measured read bottlenecks.' },
    ],
    learningObjectives: [
      'Compute a Minimal Cover Fc from a raw FD set.',
      'Choose intentionally between 3NF synthesis and BCNF decomposition.',
      'Justify when controlled denormalization is safe versus hazardous.',
    ],
    difficultyLevels: {
      beginner: 'Normalize first until every fact has one clean home; only cache duplicates later if profiling proves reads are too slow.',
      intermediate: 'Apply the 3-step Minimal Cover algorithm cleanly before running 3NF synthesis.',
      advanced: 'Pair controlled denormalization with transactional triggers, event streams, or materialized views so cached fields never drift silently.',
    },
    keyTakeaways: [
      'Normalize first for correctness; denormalize selectively only after benchmarking.',
      'Minimal Cover eliminates redundant FDs before table synthesis.',
      'Document every deliberate denormalization invariant clearly.',
    ],
    codeOrDiagramTitle: 'Complete Schema Refinement Pipeline',
    codeOrDiagram: `1. Requirements & ER Diagram ─▶ Initial Relational Tables
2. Collect FDs & MVDs ─▶ Compute Canonical Cover Fc
3. Find All Candidate Keys ─▶ Audit 1NF / 2NF / 3NF / BCNF / 4NF
4. Run 3NF Synthesis or BCNF Split ─▶ Verify Lossless + Preserved
5. Benchmark Workload ─▶ Add Indexes / Materialized Views if needed`,
    relatedConceptIds: ['dbms_u3_3nf', 'dbms_u3_bcnf', 'dbms_u1_data_independence'],
    practiceQuestions: [
      {
        id: 'pq_u3_14_1',
        difficulty: 'intermediate',
        prompt: 'Why should database designers always normalize to 3NF/BCNF BEFORE considering denormalization?',
        hint: 'Think of knowing what invariants you are trading off.',
        answer: 'Normalizing first exposes true domain keys and dependencies; denormalizing blindly from the start bakes hidden anomalies into APIs that become painful to fix later.',
      },
    ],
    practicePrompt: 'Compute the Minimal Cover of F = { A → BC, B → C, A → B, AB → C }.',
  },
];
