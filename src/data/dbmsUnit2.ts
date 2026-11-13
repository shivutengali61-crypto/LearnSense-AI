import type { DbmsChapter } from './dbmsCurriculumTypes';

export const DBMS_UNIT_2_CHAPTERS: DbmsChapter[] = [
  {
    id: 'dbms_u2_intro_sql',
    unitNumber: 2,
    code: '2.1',
    title: 'Introduction to SQL',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'SQL (Structured Query Language) is the standard declarative language used to create schemas, query tables, manage permissions, and control transactions in relational databases.',
    detailedExplanation:
      'Originally developed as SEQUEL at IBM System R and standardized by ANSI/ISO, SQL is a declarative (non-procedural) language: users state WHAT rows they need, and the DBMS query optimizer determines the fastest physical access path. SQL encompasses DDL (CREATE, ALTER, DROP), DML (SELECT, INSERT, UPDATE, DELETE), DCL (GRANT, REVOKE), and TCL (COMMIT, ROLLBACK, SAVEPOINT).',
    summaryEn:
      'Declarative relational language standardized across DDL, DML, DCL, and TCL subsets for schema management and querying.',
    summaryKn:
      'SQL ಎಂಬುದು ಕೋಷ್ಟಕಗಳನ್ನು ನಿರ್ಮಿಸಲು, ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಲು (SELECT) ಮತ್ತು ಡೇಟಾವನ್ನು ನಿರ್ವಹಿಸಲು ಬಳಸುವ ಪ್ರಮಾಣಿತ ರಿಲೇಶನಲ್ ಭಾಷೆಯಾಗಿದೆ.',
    realWorldExample:
      'A single SQL query retrieves top-performing DBMS students across PostgreSQL, MySQL, or SQLite without manually writing loops or pointer-chasing code.',
    definitions: [
      { term: 'Declarative Language', definition: 'Specifies desired result conditions rather than step-by-step procedural loops.' },
      { term: 'ANSI/ISO SQL', definition: 'International standard ensuring portable core syntax across RDBMS vendors.' },
      { term: 'Multiset (Bag) Semantics', definition: 'SQL tables permit duplicate rows unless constrained by PRIMARY KEY, UNIQUE, or DISTINCT.' },
    ],
    learningObjectives: [
      'Explain why SQL is declarative rather than procedural.',
      'Categorize SQL keywords into DDL, DML, DCL, and TCL.',
      'Recognize SQL clause processing order vs. written syntax order.',
    ],
    difficultyLevels: {
      beginner: 'SQL reads like structured English: SELECT columns FROM table WHERE condition.',
      intermediate: 'Know SQL logical execution order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT.',
      advanced: 'Compare ANSI SQL-92/2016 extensions (CTEs, window functions, JSONB operators) across PostgreSQL and Oracle.',
    },
    keyTakeaways: [
      'Optimizer chooses index vs. sequential scans automatically.',
      'Logical execution order explains why column aliases from SELECT cannot be used in WHERE.',
      'Nulls obey SQL three-valued logic.',
    ],
    codeOrDiagramTitle: 'SQL Logical Execution Order',
    codeOrDiagram: `-- Written order: SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ...
-- Engine logical evaluation order:
1. FROM / JOIN   (combine source tables)
2. WHERE         (filter individual rows)
3. GROUP BY      (partition into groups)
4. HAVING        (filter aggregated groups)
5. SELECT        (compute expressions & aliases)
6. ORDER BY      (sort final output)
7. LIMIT         (restrict returned rows)`,
    relatedConceptIds: ['dbms_u1_db_languages', 'dbms_u2_ddl', 'dbms_u2_select'],
    practiceQuestions: [
      {
        id: 'pq_u2_1_1',
        difficulty: 'intermediate',
        prompt: 'Why does `SELECT score * 2 AS doubled FROM submissions WHERE doubled > 10` fail in standard SQL?',
        hint: 'Check when SELECT runs relative to WHERE.',
        answer: 'Because WHERE is logically evaluated BEFORE SELECT, so the alias `doubled` does not exist yet during WHERE filtering.',
      },
    ],
    practicePrompt: 'Explain what makes SQL a declarative language and why that improves physical data independence.',
  },
  {
    id: 'dbms_u2_ddl',
    unitNumber: 2,
    code: '2.2',
    title: 'CREATE, ALTER, DROP',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'DDL commands—CREATE, ALTER, DROP, and TRUNCATE—build, modify, and remove database tables, columns, indexes, and constraints.',
    detailedExplanation:
      'Data Definition Language updates the DBMS System Catalog. CREATE TABLE defines columns, domains, and inline/table-level constraints. ALTER TABLE evolves live schemas (ADD COLUMN, ALTER COLUMN TYPE, ADD CONSTRAINT, DROP COLUMN). DROP TABLE permanently removes both rows and catalog metadata (often blocked if child foreign keys reference it unless CASCADE is specified), whereas TRUNCATE TABLE quickly empties all rows while keeping table definition intact.',
    summaryEn:
      'CREATE builds catalog objects, ALTER evolves existing schemas, and DROP/TRUNCATE remove structures or bulk-clear storage pages.',
    summaryKn:
      'CREATE ಕೋಷ್ಟಕಗಳನ್ನು ರಚಿಸುತ್ತದೆ, ALTER ರಚನೆಯನ್ನು ಬದಲಾಯಿಸುತ್ತದೆ ಮತ್ತು DROP/TRUNCATE ಕೋಷ್ಟಕ ಅಥವಾ ಎಲ್ಲಾ ಸಾಲುಗಳನ್ನು ಅಳಿಸುತ್ತವೆ.',
    realWorldExample:
      'When adding a `semester` column to `classrooms` mid-year, engineers run `ALTER TABLE classrooms ADD COLUMN semester VARCHAR(40)` rather than dropping and recreating production tables.',
    definitions: [
      { term: 'CREATE TABLE', definition: 'Defines a new base relation schema and registers it in the System Catalog.' },
      { term: 'ALTER TABLE', definition: 'Adds, modifies, or drops columns and constraints on an existing table.' },
      { term: 'DROP vs. TRUNCATE', definition: 'DROP deletes table structure + data; TRUNCATE deallocates all rows while keeping the empty table.' },
    ],
    learningObjectives: [
      'Write CREATE TABLE DDL with typed columns and named constraints.',
      'Safely evolve tables with ALTER TABLE without losing existing records.',
      'Compare DROP TABLE, TRUNCATE TABLE, and DELETE FROM.',
    ],
    difficultyLevels: {
      beginner: 'CREATE = build a table; ALTER = renovate columns; DROP = demolish the table.',
      intermediate: 'Distinguish DROP TABLE RESTRICT (default safe mode) vs. DROP TABLE CASCADE (drops dependent views/FKs).',
      advanced: 'Understand lock acquisition during ALTER TABLE in production (AccessExclusiveLock) and online schema migration strategies.',
    },
    keyTakeaways: [
      'DDL updates metadata in the System Catalog.',
      'TRUNCATE is much faster than DELETE for full-table clearing because it avoids per-row undo logging.',
      'Use named constraints (`CONSTRAINT chk_score CHECK (...)`) for clean future ALTERs.',
    ],
    codeOrDiagramTitle: 'Schema Evolution with CREATE, ALTER, DROP',
    codeOrDiagram: `CREATE TABLE courses (
  id         VARCHAR(32) PRIMARY KEY,
  title      VARCHAR(120) NOT NULL,
  credits    INT NOT NULL DEFAULT 4
);

ALTER TABLE courses ADD COLUMN course_code VARCHAR(16) UNIQUE;
ALTER TABLE courses ADD CONSTRAINT chk_credits CHECK (credits BETWEEN 1 AND 8);
-- DROP TABLE courses RESTRICT;`,
    relatedConceptIds: ['dbms_u2_dml', 'dbms_u2_sql_constraints', 'dbms_u1_integrity_constraints'],
    practiceQuestions: [
      {
        id: 'pq_u2_2_1',
        difficulty: 'beginner',
        prompt: 'What remains after executing `TRUNCATE TABLE logs` versus `DROP TABLE logs`?',
        hint: 'Think about whether you can immediately INSERT a new row afterward.',
        answer: 'After TRUNCATE, the empty table structure, columns, and constraints still exist; after DROP, the table definition itself is removed from the catalog.',
      },
    ],
    practicePrompt: 'Write DDL statements to create a `departments` table and later add a NOT NULL `hod_name` column.',
  },
  {
    id: 'dbms_u2_dml',
    unitNumber: 2,
    code: '2.3',
    title: 'INSERT, UPDATE, DELETE',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'DML write commands—INSERT, UPDATE, and DELETE—add new rows, modify existing column values, and remove targeted rows under transaction and constraint protection.',
    detailedExplanation:
      'INSERT INTO adds single tuples, multi-row value lists, or query results (`INSERT INTO ... SELECT ...`). UPDATE modifies selected attributes on rows matching a WHERE predicate (omitting WHERE updates EVERY row!). DELETE FROM removes matching rows while firing triggers and checking Referential Integrity constraints on child tables. All DML mutations remain isolated and reversible until COMMIT.',
    summaryEn:
      'Manages row-level insertions, conditional updates, and safe deletions while enforcing constraints and ACID rollbacks.',
    summaryKn:
      'INSERT ಹೊಸ ಸಾಲುಗಳನ್ನು ಸೇರಿಸುತ್ತದೆ, UPDATE ಮೌಲ್ಯಗಳನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡುತ್ತದೆ ಮತ್ತು DELETE ಆಯ್ದ ಸಾಲುಗಳನ್ನು ಅಳಿಸುತ್ತದೆ.',
    realWorldExample:
      'When a student drops a course before the deadline, `DELETE FROM enrollments WHERE student_uid = $1 AND course_id = $2` removes only that single enrollment row inside a transaction.',
    definitions: [
      { term: 'INSERT INTO ... VALUES', definition: 'Adds explicit row(s) matching column order and domain types.' },
      { term: 'UPDATE ... SET ... WHERE', definition: 'Modifies targeted rows; omitting WHERE mutates the entire table.' },
      { term: 'DELETE FROM ... WHERE', definition: 'Deletes matching rows with full WAL logging and rollback capability.' },
    ],
    learningObjectives: [
      'Insert single rows, batch rows, and subquery-derived rows cleanly.',
      'Write safe UPDATE and DELETE statements scoped by primary key or precise WHERE clauses.',
      'Use RETURNING / transactions to inspect or undo accidental modifications.',
    ],
    difficultyLevels: {
      beginner: 'Always double-check your WHERE clause before hitting run on UPDATE or DELETE!',
      intermediate: 'Use `INSERT INTO archive SELECT * FROM submissions WHERE ...` and `ON CONFLICT DO UPDATE` (UPSERT) patterns.',
      advanced: 'Analyze MVCC row versioning on PostgreSQL UPDATE/DELETE (dead tuples requiring VACUUM) vs. undo-segment in-place updates.',
    },
    keyTakeaways: [
      'Every DML write validates Primary Key, Foreign Key, NOT NULL, and CHECK constraints.',
      'Always wrap multi-table DML updates inside BEGIN ... COMMIT transactions.',
      'UPSERT handles idempotent record synchronization.',
    ],
    codeOrDiagramTitle: 'Safe Transactional DML Operations',
    codeOrDiagram: `BEGIN;
  INSERT INTO enrollments (id, student_uid, course_id)
  VALUES ('enr_901', 'stu_12', 'CS-304');

  UPDATE assessments
  SET status = 'published'
  WHERE id = 'assess_1' AND status = 'draft';

  DELETE FROM draft_notes WHERE created_at < '2025-01-01';
COMMIT;`,
    relatedConceptIds: ['dbms_u2_ddl', 'dbms_u2_select', 'dbms_u4_transactions'],
    practiceQuestions: [
      {
        id: 'pq_u2_3_1',
        difficulty: 'beginner',
        prompt: 'What happens if you run `UPDATE students SET grade = "A"` without a WHERE clause?',
        hint: 'What rows match when no filter is given?',
        answer: 'Every single row in the `students` table is updated to grade "A" unless rolled back inside an open transaction.',
      },
    ],
    practicePrompt: 'Explain how transactions protect multi-statement INSERT + UPDATE sequences.',
  },
  {
    id: 'dbms_u2_select',
    unitNumber: 2,
    code: '2.4',
    title: 'SELECT Queries',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    simpleExplanation:
      'SELECT retrieves columns, computed expressions, deduplicated rows (DISTINCT), and paginated results from one or more tables without altering stored data.',
    detailedExplanation:
      'The SELECT statement is the workhorse of relational querying. Its projection list selects specific columns (preferring explicit columns over `SELECT *` for performance and stability), applies expressions and aliases (`AS`), deduplicates identical output rows with `DISTINCT`, handles NULL defaults cleanly via `COALESCE`, and caps output size with `LIMIT / OFFSET` (or `FETCH FIRST N ROWS ONLY`).',
    summaryEn:
      'Covers projection lists, aliases, DISTINCT deduplication, COALESCE null-handling, pattern matching (LIKE), and pagination.',
    summaryKn:
      'SELECT ಪ್ರಶ್ನೆಗಳು ಅಗತ್ಯವಿರುವ ಕಾಲಮ್‌ಗಳು, DISTINCT ಮೌಲ್ಯಗಳು, COALESCE ಮತ್ತು LIMIT ಫಲಿತಾಂಶಗಳನ್ನು ಪಡೆಯಲು ಬಳಸಲ್ಪಡುತ್ತವೆ.',
    realWorldExample:
      'A student dashboard runs `SELECT id, title, due_date FROM published_assessments WHERE classroom_id = $1 LIMIT 10` to fetch only lightweight metadata without downloading answer keys.',
    definitions: [
      { term: 'Projection List', definition: 'The comma-separated expressions/columns requested immediately after SELECT.' },
      { term: 'DISTINCT', definition: 'Eliminates duplicate rows from the final result set.' },
      { term: 'COALESCE(a, b)', definition: 'Returns the first non-NULL expression in its argument list.' },
    ],
    learningObjectives: [
      'Write clean SELECT projections using aliases, expressions, and COALESCE.',
      'Use DISTINCT accurately and understand its sorting/hashing cost.',
      'Apply LIKE / ILIKE / BETWEEN / IN predicates cleanly.',
    ],
    difficultyLevels: {
      beginner: 'SELECT chooses which columns to show; FROM chooses which table to inspect.',
      intermediate: 'Avoid `SELECT *` in production APIs to preserve network bandwidth and covering-index scans.',
      advanced: 'Understand keyset (cursor) pagination (`WHERE id > last_seen_id LIMIT 20`) vs. slow `OFFSET 10000` scans.',
    },
    keyTakeaways: [
      'Explicit column lists enable Index-Only Scans.',
      'Use `IS NULL` / `IS NOT NULL` instead of `= NULL`.',
      'DISTINCT applies across the entire projected tuple, not just one column.',
    ],
    codeOrDiagramTitle: 'Clean Production SELECT Projection',
    codeOrDiagram: `SELECT DISTINCT
  s.student_uid,
  COALESCE(s.roll_number, 'UNASSIGNED') AS roll_no,
  ROUND((sub.score * 100.0) / sub.max_score, 1) AS pct
FROM classroom_roster s
LEFT JOIN assessment_submissions sub ON sub.student_uid = s.student_uid
ORDER BY pct DESC NULLS LAST
LIMIT 25;`,
    relatedConceptIds: ['dbms_u2_where_order_group', 'dbms_u2_aggregates', 'dbms_u2_joins'],
    practiceQuestions: [
      {
        id: 'pq_u2_4_1',
        difficulty: 'beginner',
        prompt: 'Why should production applications list exact column names instead of `SELECT *`?',
        hint: 'Consider network payload, schema changes, and index-only scans.',
        answer: 'Explicit column lists transfer less data, avoid breaking when columns are added/reordered, and allow the DBMS to satisfy queries directly from covering indexes.',
      },
    ],
    practicePrompt: 'Write a SELECT query displaying unique subjects and safe fallback text for missing course codes.',
  },
  {
    id: 'dbms_u2_where_order_group',
    unitNumber: 2,
    code: '2.5',
    title: 'WHERE, ORDER BY, GROUP BY',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'WHERE filters rows before grouping, GROUP BY partitions rows into summary buckets, HAVING filters those groups, and ORDER BY sorts the final output.',
    detailedExplanation:
      'Mastering SQL grouping hinges on distinguishing row-level vs. group-level filtering. `WHERE` evaluates predicates on individual raw tuples before any grouping occurs (cannot reference aggregate functions like AVG). `GROUP BY` collapses rows sharing identical grouping keys into one summary row per group. `HAVING` then filters those summary buckets using aggregate predicates (e.g., `HAVING COUNT(*) >= 3`). Finally, `ORDER BY` sorts output rows.',
    summaryEn:
      'Separates pre-group row filtering (WHERE), bucket partitioning (GROUP BY), post-group filtering (HAVING), and sorting (ORDER BY).',
    summaryKn:
      'WHERE ಪ್ರತ್ಯೇಕ ಸಾಲುಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡುತ್ತದೆ, GROUP BY ಗುಂಪುಗಳನ್ನು ರಚಿಸುತ್ತದೆ, HAVING ಗುಂಪುಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡುತ್ತದೆ ಮತ್ತು ORDER BY ವಿಂಗಡಿಸುತ್ತದೆ.',
    realWorldExample:
      'To list DBMS concepts where a class averaged under 65% across at least 5 question attempts, `WHERE classroom_id = $1` filters the class first, `GROUP BY concept_id` groups answers, `HAVING AVG(...) < 65 AND COUNT(*) >= 5` flags weak concepts, and `ORDER BY avg_pct ASC` ranks worst first.',
    definitions: [
      { term: 'WHERE Clause', definition: 'Row-level predicate executed prior to grouping and aggregation.' },
      { term: 'GROUP BY', definition: 'Partitions tuples into equivalence classes sharing identical grouping column values.' },
      { term: 'HAVING Clause', definition: 'Group-level predicate applied after GROUP BY and aggregate computation.' },
    ],
    learningObjectives: [
      'Choose correctly between WHERE and HAVING in analytical queries.',
      'Apply SQL’s single-value grouping rule: every non-aggregated SELECT column must be in GROUP BY.',
      'Sort multi-column outputs using ASC/DESC and NULLS FIRST/LAST.',
    ],
    difficultyLevels: {
      beginner: 'Remember: WHERE filters rows BEFORE grouping; HAVING filters groups AFTER grouping.',
      intermediate: 'Push non-aggregate conditions from HAVING into WHERE whenever possible so the optimizer filters fewer rows earlier.',
      advanced: 'Use GROUPING SETS, ROLLUP, and CUBE for multi-level hierarchical subtotals in a single table scan.',
    },
    keyTakeaways: [
      'WHERE cannot contain aggregate functions like SUM() or COUNT().',
      'Non-aggregated columns in SELECT must appear in GROUP BY.',
      'Sorting (`ORDER BY`) executes near the very end before LIMIT.',
    ],
    codeOrDiagramTitle: 'WHERE + GROUP BY + HAVING + ORDER BY',
    codeOrDiagram: `SELECT concept_name,
       COUNT(*) AS attempts,
       ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 1) AS mastery_pct
FROM question_responses
WHERE classroom_id = 'cls_cs304_dbms'
GROUP BY concept_id, concept_name
HAVING COUNT(*) >= 3 AND AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) < 65
ORDER BY mastery_pct ASC;`,
    relatedConceptIds: ['dbms_u2_aggregates', 'dbms_u2_select', 'dbms_u2_views'],
    practiceQuestions: [
      {
        id: 'pq_u2_5_1',
        difficulty: 'intermediate',
        prompt: 'Why is `WHERE subject = "DBMS"` faster than putting `HAVING subject = "DBMS"` after `GROUP BY subject`?',
        hint: 'When does each filter reduce the row count?',
        answer: 'WHERE discards non-DBMS rows BEFORE building hash/sort groups, reducing memory and CPU; HAVING would needlessly group every subject first.',
      },
    ],
    practicePrompt: 'Write a query showing classrooms with more than 20 enrolled students ordered by enrollment descending.',
  },
  {
    id: 'dbms_u2_aggregates',
    unitNumber: 2,
    code: '2.6',
    title: 'Aggregate Functions',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Aggregate functions—COUNT, SUM, AVG, MIN, and MAX—collapse multiple rows into single summary metrics while carefully ignoring NULLs (except COUNT(*)).',
    detailedExplanation:
      'SQL’s five standard aggregate functions summarize numeric and ordered columns: `COUNT(*)` counts all rows including NULLs, whereas `COUNT(col)`, `SUM(col)`, `AVG(col)`, `MIN(col)`, and `MAX(col)` ignore NULL values! Mixing `AVG(score)` on nullable scores divides only by non-NULL rows, not total students. Combining `DISTINCT` inside aggregates (`COUNT(DISTINCT student_uid)`) counts unique entities cleanly.',
    summaryEn:
      'Computes COUNT, SUM, AVG, MIN, MAX across groups with explicit NULL-skipping rules and COUNT(DISTINCT) deduplication.',
    summaryKn:
      'COUNT, SUM, AVG, MIN ಮತ್ತು MAX ಫಂಕ್ಷನ್‌ಗಳು ಹಲವು ಸಾಲುಗಳಿಂದ ಸಾರಾಂಶ ಅಂಕಿಅಂಶಗಳನ್ನು ಲೆಕ್ಕಹಾಕುತ್ತವೆ (COUNT(*) ಹೊರತುಪಡಿಸಿ ಉಳಿದವು NULL ಅನ್ನು ಬಿಡುತ್ತವೆ).',
    realWorldExample:
      'If 10 students are enrolled and 2 missed an assessment (`score IS NULL`), `AVG(score)` averages the 8 submitted scores, while `AVG(COALESCE(score, 0))` averages across all 10 enrolled students.',
    definitions: [
      { term: 'COUNT(*) vs. COUNT(col)', definition: 'COUNT(*) counts every row; COUNT(col) counts only rows where col is NOT NULL.' },
      { term: 'COUNT(DISTINCT col)', definition: 'Counts the number of unique non-NULL values.' },
      { term: 'Conditional Aggregation', definition: 'Pattern using `SUM(CASE WHEN cond THEN 1 ELSE 0 END)` or PostgreSQL `FILTER (WHERE ...)`.' },
    ],
    learningObjectives: [
      'Predict exact results of COUNT(*), COUNT(col), SUM, and AVG when NULLs exist.',
      'Compute unique counts using COUNT(DISTINCT ...).',
      'Write conditional aggregations to pivot counts in a single scan.',
    ],
    difficultyLevels: {
      beginner: 'COUNT(*) counts every row; AVG/SUM/COUNT(col) skip blank (NULL) cells automatically.',
      intermediate: 'Use `SUM(CASE WHEN ... END)` to compute pass/fail counts side-by-side without multiple subqueries.',
      advanced: 'Contrast GROUP BY aggregates (which collapse rows) with Window Functions (`AVG(score) OVER (PARTITION BY classroom_id)`) which preserve every row.',
    },
    keyTakeaways: [
      'SUM and AVG return NULL (not 0) on empty input sets; COUNT returns 0.',
      'Be explicit with COALESCE if missed tests should count as 0.',
      'Conditional aggregation reduces multi-query dashboards into one table pass.',
    ],
    codeOrDiagramTitle: 'NULL-Safe Conditional Aggregation',
    codeOrDiagram: `SELECT
  COUNT(*) AS total_rows,
  COUNT(score) AS graded_count,
  COUNT(DISTINCT student_uid) AS unique_students,
  ROUND(AVG(score), 1) AS avg_graded_only,
  SUM(CASE WHEN percentage >= 65 THEN 1 ELSE 0 END) AS passed_attempts
FROM assessment_submissions;`,
    relatedConceptIds: ['dbms_u2_where_order_group', 'dbms_u2_nested_queries', 'dbms_u2_views'],
    practiceQuestions: [
      {
        id: 'pq_u2_6_1',
        difficulty: 'intermediate',
        prompt: 'A column `bonus` has values {10, 20, NULL, NULL}. What do `COUNT(*)`, `COUNT(bonus)`, and `AVG(bonus)` return?',
        hint: 'COUNT(col) and AVG(col) skip NULLs.',
        answer: 'COUNT(*) = 4, COUNT(bonus) = 2, and AVG(bonus) = (10 + 20) / 2 = 15.',
      },
    ],
    practicePrompt: 'Show how to count how many students scored >= 80% vs. < 65% in a single SQL query.',
  },
  {
    id: 'dbms_u2_joins',
    unitNumber: 2,
    code: '2.7',
    title: 'Joins',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'Joins combine rows from two or more normalized tables horizontally by matching related key columns (usually a Foreign Key to a Primary Key).',
    detailedExplanation:
      'Because normalization splits attributes across separate tables to avoid redundancy, Joins reassemble connected entities at query time. SQL supports CROSS JOIN (Cartesian product), THETA JOIN (arbitrary condition), EQUI-JOIN (equality condition), NATURAL JOIN (auto-matching identically named columns—often avoided in production due to accidental schema fragility), and OUTER/SELF joins. Physically, engines execute joins via Nested Loop, Sort-Merge, or Hash Join algorithms.',
    summaryEn:
      'Recombines normalized relations using key-matching conditions via explicit JOIN ... ON syntax and physical Hash/Merge/Loop algorithms.',
    summaryKn:
      'Join ಕಾರ್ಯಾಚರಣೆಯು ಸಾಮಾನ್ಯ ಕೀ ಕಾಲಮ್‌ಗಳ (PK-FK) ಆಧಾರದ ಮೇಲೆ ವಿಭಜಿತ ಕೋಷ್ಟಕಗಳನ್ನು ಮತ್ತೆ ಜೋಡಿಸುತ್ತದೆ.',
    realWorldExample:
      'Joining `submissions`, `assessments`, and `classrooms` on their IDs displays the student score alongside the assessment title and course code in one unified report.',
    definitions: [
      { term: 'Equi-Join', definition: 'Join whose condition tests equality (`=`) between columns of two tables.' },
      { term: 'Cartesian Product (CROSS JOIN)', definition: 'Pairs every row of table A with every row of table B (|A| × |B| rows).' },
      { term: 'Hash Join', definition: 'Builds an in-memory hash table on the smaller relation and probes it with the larger relation in O(|R| + |S|).' },
    ],
    learningObjectives: [
      'Write explicit ANSI `JOIN ... ON` syntax instead of legacy comma-separated FROM lists.',
      'Avoid accidental Cartesian explosions caused by missing join predicates.',
      'Understand when the optimizer selects Nested Loop vs. Hash Join vs. Sort-Merge Join.',
    ],
    difficultyLevels: {
      beginner: 'Always specify `JOIN table2 ON table1.fk = table2.pk` so rows pair only with their true match.',
      intermediate: 'Prefer explicit `ON` over `NATURAL JOIN` so adding an `updated_at` column later never silently breaks queries.',
      advanced: 'Estimate join I/O cost for Block Nested Loop vs. Grace Hash Join when relations exceed buffer pool RAM.',
    },
    keyTakeaways: [
      'Missing a join condition turns a join into a massive Cartesian product.',
      'Index foreign keys to accelerate index-nested-loop joins.',
      'Explicit `JOIN ... ON` separates join logic cleanly from `WHERE` filtering.',
    ],
    codeOrDiagramTitle: 'Multi-Table Normalized Join',
    codeOrDiagram: `SELECT c.course_code, a.title AS assessment_title, sub.student_name, sub.percentage
FROM assessment_submissions sub
JOIN assessments a ON a.id = sub.assessment_id
JOIN classrooms c  ON c.id = sub.classroom_id
WHERE c.teacher_uid = 'tea_kavitha';`,
    relatedConceptIds: ['dbms_u2_inner_outer_join', 'dbms_u2_self_join', 'dbms_u1_pk_fk'],
    practiceQuestions: [
      {
        id: 'pq_u2_7_1',
        difficulty: 'intermediate',
        prompt: 'Why do production SQL style guides discourage `NATURAL JOIN`?',
        hint: 'What happens if both tables gain a column named `created_at` later?',
        answer: 'NATURAL JOIN automatically joins on ALL identically named columns; adding a common audit column like `created_at` or `status` silently alters join semantics and breaks queries.',
      },
    ],
    practicePrompt: 'Explain how a Hash Join processes two large unindexed tables efficiently.',
  },
  {
    id: 'dbms_u2_inner_outer_join',
    unitNumber: 2,
    code: '2.8',
    title: 'Inner Join and Outer Join',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'INNER JOIN returns only rows with matches in both tables, while LEFT, RIGHT, and FULL OUTER JOIN keep unmatched rows from one or both sides padded with NULLs.',
    detailedExplanation:
      'Choosing INNER vs. OUTER join depends on whether unmatched records matter. INNER JOIN drops students who never took a quiz. `LEFT OUTER JOIN` keeps EVERY row from the left table (`enrollments`) and attaches matching right rows (`submissions`)—filling right columns with NULL when no submission exists. `RIGHT OUTER JOIN` preserves the right table; `FULL OUTER JOIN` preserves unmatched rows from both sides.',
    summaryEn:
      'Contrasts INNER JOIN (matched intersection) with LEFT, RIGHT, and FULL OUTER JOINs for preserving unmatched entities.',
    summaryKn:
      'INNER JOIN ಹೊಂದಾಣಿಕೆಯಾಗುವ ಸಾಲುಗಳನ್ನು ಮಾತ್ರ ನೀಡುತ್ತದೆ; OUTER JOIN ಹೊಂದಾಣಿಕೆಯಾಗದ ಸಾಲುಗಳನ್ನೂ NULL ಮೌಲ್ಯಗಳೊಂದಿಗೆ ಉಳಿಸಿಕೊಳ್ಳುತ್ತದೆ.',
    realWorldExample:
      'To generate an attendance or pending-quiz sheet showing ALL enrolled students—including those with 0 submissions—use `enrollments LEFT JOIN submissions` rather than `INNER JOIN`.',
    definitions: [
      { term: 'INNER JOIN', definition: 'Outputs only pairs where the join condition evaluates to TRUE.' },
      { term: 'LEFT OUTER JOIN', definition: 'Retains all left-table rows; unmatched left rows get NULL for right-table attributes.' },
      { term: 'FULL OUTER JOIN', definition: 'Retains unmatched rows from both left and right tables.' },
    ],
    learningObjectives: [
      'Select INNER, LEFT, RIGHT, or FULL OUTER JOIN based on reporting requirements.',
      'Avoid accidentally turning a LEFT JOIN into an INNER JOIN by filtering right-table columns in WHERE.',
      'Use `LEFT JOIN ... WHERE right.pk IS NULL` to find missing/unsubmitted records.',
    ],
    difficultyLevels: {
      beginner: 'INNER = overlap only; LEFT = everything on left + matching right; FULL = everything from both.',
      intermediate: 'Put right-table filters inside the `ON` clause of a LEFT JOIN, not in `WHERE`, if you want to keep unmatched left rows!',
      advanced: 'Compare anti-join execution plans (`LEFT JOIN ... IS NULL` vs. `NOT EXISTS`) across PostgreSQL/MySQL optimizers.',
    },
    keyTakeaways: [
      'Putting `WHERE right.status = "submitted"` after a LEFT JOIN silently drops NULL rows, turning it into an INNER JOIN!',
      'Put optional right-side predicates in `ON` (`ON s.student_uid = e.uid AND s.assessment_id = "a1"`).',
      'Anti-join pattern (`WHERE right.id IS NULL`) spots missing submissions cleanly.',
    ],
    codeOrDiagramTitle: 'Finding Unsubmitted Students via LEFT JOIN',
    codeOrDiagram: `-- Correct: keep all enrolled students, show NULL if Assessment 'a1' not submitted
SELECT e.student_uid, e.student_name, s.percentage
FROM enrollments e
LEFT JOIN assessment_submissions s
  ON s.student_uid = e.student_uid
 AND s.assessment_id = 'a1'
WHERE e.classroom_id = 'cls_cs304_dbms';`,
    relatedConceptIds: ['dbms_u2_joins', 'dbms_u2_in_exists', 'dbms_u2_self_join'],
    practiceQuestions: [
      {
        id: 'pq_u2_8_1',
        difficulty: 'intermediate',
        prompt: 'Why does moving `AND s.assessment_id = "a1"` from ON to WHERE break a LEFT JOIN query?',
        hint: 'What is `s.assessment_id` for a student who never submitted?',
        answer: 'For unsubmitted students, `s.assessment_id` is NULL. Checking `WHERE s.assessment_id = "a1"` rejects NULL rows, eliminating all unsubmitted students!',
      },
    ],
    practicePrompt: 'Illustrate with two small 3-row tables the exact row count difference between INNER, LEFT, RIGHT, and FULL OUTER JOIN.',
  },
  {
    id: 'dbms_u2_self_join',
    unitNumber: 2,
    code: '2.9',
    title: 'Self Join',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'A Self Join joins a table with itself using two distinct table aliases to model hierarchies or compare pairs of rows within the same table.',
    detailedExplanation:
      'When a relation contains a recursive foreign key—such as `employees(emp_id, name, manager_id)` or `courses(course_id, title, prereq_course_id)`—a Self Join aliases the same table twice (e.g., `c` for Course and `p` for Prerequisite) to link parent and child records in one query. Self joins are also useful for pairing rows in the same table (finding classmates in the same course or detecting duplicate records).',
    summaryEn:
      'Aliases a single relation twice to traverse parent-child hierarchies, course prerequisites, or intra-table comparisons.',
    summaryKn:
      'Self Join ಒಂದು ಕೋಷ್ಟಕಕ್ಕೆ ಎರಡು ಬೇರೆ ಹೆಸರುಗಳನ್ನು (Aliases) ನೀಡಿ ಅದೇ ಕೋಷ್ಟಕದೊಳಗಿನ ಸಂಬಂಧಗಳನ್ನು (ಉದಾ: Manager, Prerequisite) ಪಡೆಯುತ್ತದೆ.',
    realWorldExample:
      'In a university `courses` table storing `prereq_id`, a Self Join lists every course title alongside its prerequisite course title—or pairs `mentor_uid` to `student_uid` in a peer-mentoring table.',
    definitions: [
      { term: 'Table Alias', definition: 'Mandatory distinct temporary names (`e` and `m`) required to disambiguate columns in a Self Join.' },
      { term: 'Recursive FK', definition: 'A foreign key column referencing the Primary Key of the same table.' },
    ],
    learningObjectives: [
      'Write a Self Join using clear table aliases for hierarchical tables.',
      'Use LEFT SELF JOIN so root rows (without a manager/prerequisite) are not dropped.',
      'Recognize when deep multi-level trees require recursive CTEs (`WITH RECURSIVE`).',
    ],
    difficultyLevels: {
      beginner: 'Pretend you have two photocopies of the same table (`emp` and `mgr`) and join `emp.manager_id = mgr.id`.',
      intermediate: 'Always use LEFT JOIN in hierarchical self joins if top-level items have NULL parent pointers.',
      advanced: 'Extend 1-hop self joins to arbitrary-depth transitive closure graphs using SQL `WITH RECURSIVE` Common Table Expressions.',
    },
    keyTakeaways: [
      'Aliases are mandatory; otherwise column references are ambiguous.',
      'Self join handles fixed-depth (1-hop or 2-hop) hierarchies.',
      'Use `e1.id < e2.id` when finding unique pairs to avoid `(A, B)` and `(B, A)` duplicates.',
    ],
    codeOrDiagramTitle: 'Course Prerequisite Self Join',
    codeOrDiagram: `SELECT c.course_code AS course,
       c.title       AS course_title,
       COALESCE(p.course_code, 'None') AS prerequisite_code
FROM courses c
LEFT JOIN courses p ON c.prereq_course_id = p.id;`,
    relatedConceptIds: ['dbms_u2_joins', 'dbms_u1_relationships_cardinality', 'dbms_u2_nested_queries'],
    practiceQuestions: [
      {
        id: 'pq_u2_9_1',
        difficulty: 'intermediate',
        prompt: 'Why should an employee-manager self join usually use `LEFT JOIN` instead of `INNER JOIN`?',
        hint: 'Who manages the CEO / Dean?',
        answer: 'The top-level leader has `manager_id IS NULL`; an INNER JOIN would exclude them from the report, whereas LEFT JOIN retains them with NULL manager.',
      },
    ],
    practicePrompt: 'Write a self-join query to find pairs of students enrolled in the same classroom without listing `(A,B)` and `(B,A)` twice.',
  },
  {
    id: 'dbms_u2_nested_queries',
    unitNumber: 2,
    code: '2.10',
    title: 'Nested Queries',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'A nested query (subquery) places a SELECT statement inside another SELECT, INSERT, UPDATE, or DELETE statement to compute intermediate filters, scalars, or derived tables.',
    detailedExplanation:
      'Subqueries appear in three positions: (1) Scalar subqueries in SELECT/WHERE returning a single value (e.g., comparing each score against overall class `AVG(score)`); (2) Row/Multi-row subqueries in WHERE with `IN`, `ANY`, `ALL`, or `EXISTS`; (3) Derived tables (inline views) or Common Table Expressions (`WITH cte AS (...)`) in `FROM`. Subqueries may be Uncorrelated (executed once independently) or Correlated (referencing outer-query columns per candidate row).',
    summaryEn:
      'Covers scalar, multi-row, inline derived-table, CTE, uncorrelated, and correlated subqueries.',
    summaryKn:
      'Nested Query (Subquery) ಒಂದು SQL ಪ್ರಶ್ನೆಯೊಳಗೆ ಮತ್ತೊಂದು SELECT ಪ್ರಶ್ನೆಯನ್ನು ಬಳಸಿ ಸಂಕೀರ್ಣ ಫಿಲ್ಟರ್ ಮತ್ತು ಲೆಕ್ಕಾಚಾರಗಳನ್ನು ಮಾಡುತ್ತದೆ.',
    realWorldExample:
      'Finding all students who scored above the CS-304 class average uses a scalar subquery: `WHERE percentage > (SELECT AVG(percentage) FROM assessment_submissions WHERE classroom_id = "cls_cs304_dbms")`.',
    definitions: [
      { term: 'Uncorrelated Subquery', definition: 'Inner query runs independently once before feeding its result to the outer query.' },
      { term: 'Correlated Subquery', definition: 'Inner query references an outer column and logically re-evaluates for each outer row.' },
      { term: 'CTE (WITH clause)', definition: 'Named temporary result set improving readability and modularity over deeply nested FROM subqueries.' },
    ],
    learningObjectives: [
      'Differentiate scalar, multi-row, and derived-table subqueries.',
      'Trace correlated subquery execution row-by-row.',
      'Refactor deeply nested subqueries into clean `WITH` CTEs or Joins.',
    ],
    difficultyLevels: {
      beginner: 'An uncorrelated subquery works like parentheses in math: solve the inside query first, then plug the answer into the outside query.',
      intermediate: 'Know that a scalar subquery returning >1 row throws a runtime error (`cardinality violation`).',
      advanced: 'Analyze query decorrelation: how optimizers rewrite correlated subqueries into hash/semi-joins to eliminate O(N^2) loops.',
    },
    keyTakeaways: [
      'Uncorrelated subqueries evaluate once; correlated subqueries depend on outer tuples.',
      'Scalar subqueries must return at most 1 row and 1 column.',
      'CTEs (`WITH`) make complex multi-step queries self-documenting.',
    ],
    codeOrDiagramTitle: 'Uncorrelated Scalar vs. Correlated Subquery',
    codeOrDiagram: `-- Uncorrelated: students scoring above global assessment average
SELECT student_name, percentage
FROM assessment_submissions
WHERE percentage > (SELECT AVG(percentage) FROM assessment_submissions);

-- Correlated: students scoring above THEIR OWN historical average
SELECT s1.student_name, s1.assessment_id, s1.percentage
FROM assessment_submissions s1
WHERE s1.percentage > (
  SELECT AVG(s2.percentage)
  FROM assessment_submissions s2
  WHERE s2.student_uid = s1.student_uid
);`,
    relatedConceptIds: ['dbms_u2_in_exists', 'dbms_u2_joins', 'dbms_u2_aggregates'],
    practiceQuestions: [
      {
        id: 'pq_u2_10_1',
        difficulty: 'intermediate',
        prompt: 'What runtime error occurs if `WHERE score = (SELECT score FROM submissions)` returns 3 rows?',
        hint: 'The `=` operator expects a single scalar.',
        answer: 'A subquery cardinality error ("more than one row returned by a subquery used as an expression"). Use `IN`, `ANY`, or `LIMIT 1` / aggregate instead.',
      },
    ],
    practicePrompt: 'Rewrite a nested derived-table query using a clean `WITH` Common Table Expression.',
  },
  {
    id: 'dbms_u2_in_exists',
    unitNumber: 2,
    code: '2.11',
    title: 'Subqueries with IN and EXISTS',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    simpleExplanation:
      'IN compares a column against a list of inner values, whereas EXISTS returns TRUE as soon as the inner correlated query finds at least one matching row—and handles NULLs safely.',
    detailedExplanation:
      'While `IN` and `EXISTS` often express identical positive membership queries, their behavior diverges sharply on negation and NULLs. `x NOT IN (1, 2, NULL)` evaluates `x != 1 AND x != 2 AND x != NULL` -> `UNKNOWN`, returning ZERO rows! By contrast, `NOT EXISTS (SELECT 1 FROM ...)` tests boolean emptiness cleanly even when NULLs exist, and `EXISTS` short-circuits immediately on the first matching index entry.',
    summaryEn:
      'Compares IN/NOT IN value-set matching vs. EXISTS/NOT EXISTS semi-join emptiness checks and NULL safety.',
    summaryKn:
      'IN ಪಟ್ಟಿಯಲ್ಲಿನ ಮೌಲ್ಯಗಳನ್ನು ಹೋಲಿಸುತ್ತದೆ; EXISTS ಕನಿಷ್ಠ ಒಂದು ಹೊಂದಾಣಿಕೆಯ ಸಾಲು ಇದೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸುತ್ತದೆ ಮತ್ತು NULL ದೋಷಗಳಿಂದ ಸುರಕ್ಷಿತವಾಗಿದೆ.',
    realWorldExample:
      'To list students who have NOT attempted Assessment A1 even if nullable columns exist in submissions, `WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.student_uid = e.student_uid AND s.assessment_id = "a1")` never falls into the `NOT IN (NULL)` trap.',
    definitions: [
      { term: 'Semi-Join (EXISTS)', definition: 'Returns outer rows that have >= 1 match in the inner query without multiplying outer rows.' },
      { term: 'Anti-Join (NOT EXISTS)', definition: 'Returns outer rows with zero matches in the inner query, immune to NULL contamination.' },
      { term: 'NOT IN NULL Trap', definition: 'If ANY inner value is NULL, `x NOT IN (...)` evaluates to UNKNOWN for every row.' },
    ],
    learningObjectives: [
      'Choose EXISTS over IN for correlated multi-column or large inner tables.',
      'Explain and prevent the `NOT IN` NULL trap.',
      'Express universal quantification ("students who passed ALL quizzes") using double `NOT EXISTS`.',
    ],
    difficultyLevels: {
      beginner: 'Use EXISTS / NOT EXISTS whenever checking "has at least one" or "has none"—it never breaks on NULLs.',
      intermediate: 'Know how `NOT EXISTS` translates directly into Relational Division ("for all X, there does not exist an X not completed").',
      advanced: 'Understand physical Hash Semi-Join vs. Materialized IN list execution plans in PostgreSQL.',
    },
    keyTakeaways: [
      'Always prefer `NOT EXISTS` over `NOT IN` on nullable columns.',
      'EXISTS stops scanning as soon as 1 matching row is found (short-circuit).',
      'Unlike JOIN, EXISTS never duplicates outer rows when multiple inner matches exist.',
    ],
    codeOrDiagramTitle: 'NULL-Safe NOT EXISTS vs. Dangerous NOT IN',
    codeOrDiagram: `-- SAFE: returns students with no submission even if other rows contain NULL
SELECT e.student_uid, e.student_name
FROM enrollments e
WHERE NOT EXISTS (
  SELECT 1
  FROM assessment_submissions s
  WHERE s.student_uid = e.student_uid
    AND s.assessment_id = 'a1'
);

-- TRAP: if any row has student_uid IS NULL, this returns 0 rows!
-- SELECT student_uid FROM enrollments WHERE student_uid NOT IN (SELECT student_uid FROM assessment_submissions);`,
    relatedConceptIds: ['dbms_u2_nested_queries', 'dbms_u2_inner_outer_join', 'dbms_u2_relational_algebra'],
    practiceQuestions: [
      {
        id: 'pq_u2_11_1',
        difficulty: 'intermediate',
        prompt: 'Evaluate `5 NOT IN (1, 3, NULL)` in SQL three-valued logic.',
        hint: 'Expand it as `(5 != 1) AND (5 != 3) AND (5 != NULL)`.',
        answer: 'TRUE AND TRUE AND UNKNOWN = UNKNOWN, so the WHERE clause filters the row OUT!',
      },
    ],
    practicePrompt: 'Write a double `NOT EXISTS` query to find students who submitted EVERY published assessment in CS-304.',
  },
  {
    id: 'dbms_u2_views',
    unitNumber: 2,
    code: '2.12',
    title: 'Views',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'A View is a saved virtual table defined by a SELECT query that simplifies complex joins, hides sensitive columns, and preserves logical data independence.',
    detailedExplanation:
      'Standard (virtual) views store only their defining SQL query in the System Catalog and re-evaluate dynamically on read, always reflecting fresh base-table updates. Materialized Views physically cache query results on disk for fast analytics and refresh periodically. A view is updatable (INSERT/UPDATE/DELETE pass through) only when derived from a single base table preserving its Primary Key without DISTINCT, GROUP BY, aggregates, or set operations.',
    summaryEn:
      'Explains virtual vs. materialized views, security projection hiding, logical independence, and updatable view restrictions.',
    summaryKn:
      'View ಎಂಬುದು SELECT ಪ್ರಶ್ನೆಯ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಮಿಸಲಾದ ವರ್ಚುವಲ್ ಕೋಷ್ಟಕವಾಗಿದ್ದು ಗೌಪ್ಯತೆ ಕಾಪಾಡಲು ಮತ್ತು ಸಂಕೀರ್ಣ ಪ್ರಶ್ನೆಗಳನ್ನು ಸರಳಗೊಳಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ.',
    realWorldExample:
      'A `published_assessments_public` view projects `(id, title, questions_without_answers)` for students while hiding `correct_answer` columns—just like LearnSense’s protected projection.',
    definitions: [
      { term: 'Virtual View', definition: 'Stored query definition expanded at runtime; consumes zero duplicate row storage.' },
      { term: 'Materialized View', definition: 'Physically persisted query snapshot refreshed on demand or schedule.' },
      { term: 'WITH CHECK OPTION', definition: 'Rejects INSERT/UPDATE through a view if the resulting row would vanish from the view’s WHERE filter.' },
    ],
    learningObjectives: [
      'Create views to encapsulate multi-table analytics and restrict column visibility.',
      'Determine whether a given view definition is SQL-updatable.',
      'Compare Virtual Views vs. Materialized Views on freshness vs. latency.',
    ],
    difficultyLevels: {
      beginner: 'A View is like a saved bookmark of a SELECT query that behaves like a read-only table.',
      intermediate: 'Explain why a view using `GROUP BY` or `JOIN` cannot cleanly translate an `UPDATE` back to a unique base row.',
      advanced: 'Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` with a unique index for lock-free analytics caching.',
    },
    keyTakeaways: [
      'Views enforce row/column security without copying data.',
      'Aggregated or DISTINCT views are read-only.',
      'Views provide Logical Data Independence during schema refactoring.',
    ],
    codeOrDiagramTitle: 'Secure Updatable & Read-Only Views',
    codeOrDiagram: `CREATE VIEW cs304_active_students AS
SELECT uid, name, roll_number
FROM classroom_roster
WHERE classroom_id = 'cls_cs304_dbms'
WITH CHECK OPTION;

CREATE MATERIALIZED VIEW class_mastery_cache AS
SELECT concept_id, AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) AS mastery_pct
FROM question_responses
GROUP BY concept_id;`,
    relatedConceptIds: ['dbms_u1_three_schema', 'dbms_u1_data_independence', 'dbms_u4_security'],
    practiceQuestions: [
      {
        id: 'pq_u2_12_1',
        difficulty: 'intermediate',
        prompt: 'Why does SQL forbid `UPDATE` on a view containing `GROUP BY concept_id`?',
        hint: 'Each output row summarizes many underlying rows.',
        answer: 'Each summary row maps ambiguously to multiple base tuples, so the DBMS cannot determine which individual base rows to modify.',
      },
    ],
    practicePrompt: 'Explain what `WITH CHECK OPTION` prevents when updating rows through a filtered view.',
  },
  {
    id: 'dbms_u2_indexes',
    unitNumber: 2,
    code: '2.13',
    title: 'Indexes',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'An Index is an auxiliary lookup structure (typically a B+-Tree) that lets the DBMS jump straight to matching rows in milliseconds instead of scanning every page.',
    detailedExplanation:
      'Indexes trade modest disk space and slightly slower INSERT/UPDATE/DELETE writes (because every index must also be updated) for dramatic speedups on SELECT, JOIN, WHERE, and ORDER BY queries. Key concepts include Single-column vs. Composite indexes (where leftmost-prefix order matters: an index on `(a, b)` accelerates `WHERE a = 1 AND b = 2` and `WHERE a = 1`, but not `WHERE b = 2` alone), Unique indexes, and Covering indexes (Index-Only Scans).',
    summaryEn:
      'Speeds up SQL reads using B+-Tree/Hash access paths, composite leftmost-prefix rules, covering indexes, and write trade-offs.',
    summaryKn:
      'Index ಎಂಬುದು ಕೋಷ್ಟಕದ ಹುಡುಕಾಟವನ್ನು ವೇಗಗೊಳಿಸುವ ರಚನೆಯಾಗಿದೆ; ಇದು ಓದುವ ವೇಗವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ ಆದರೆ ಬರೆಯುವಾಗ ಸ್ವಲ್ಪ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.',
    realWorldExample:
      'Indexing `assessment_submissions(classroom_id, submitted_at DESC)` turns a 400ms full-table scan across 1 million attempts into a 2ms dashboard lookup.',
    definitions: [
      { term: 'Composite Index', definition: 'Index spanning multiple ordered columns `(col1, col2)` obeying the leftmost prefix rule.' },
      { term: 'Covering Index', definition: 'Index containing all columns needed by a query so the engine skips heap table fetches.' },
      { term: 'Selectivity', definition: 'Ratio of distinct values to total rows; high-selectivity columns benefit most from indexing.' },
    ],
    learningObjectives: [
      'Create single-column, unique, and composite indexes using SQL DDL.',
      'Apply the leftmost-prefix rule when designing composite indexes.',
      'Evaluate read speedup vs. write amplification and storage overhead.',
    ],
    difficultyLevels: {
      beginner: 'An index works like a textbook’s back index: jump directly to page 312 instead of reading pages 1 to 311.',
      intermediate: 'Avoid indexing low-selectivity boolean columns alone, and watch out for functions on indexed columns (`WHERE LOWER(email) = ...`) breaking index usage.',
      advanced: 'Use `EXPLAIN ANALYZE`, partial indexes (`WHERE status = "published"`), and GIN/GiST indexes for JSONB/full-text queries.',
    },
    keyTakeaways: [
      'Primary Keys and UNIQUE constraints automatically create indexes.',
      'Column order in composite indexes `(classroom_id, student_uid)` matters.',
      'Over-indexing slows down bulk INSERT and UPDATE workloads.',
    ],
    codeOrDiagramTitle: 'Composite & Partial Index DDL',
    codeOrDiagram: `CREATE INDEX idx_submissions_class_time
  ON assessment_submissions (classroom_id, submitted_at DESC);

-- Partial index shrinks index size for hot pending items only:
CREATE INDEX idx_active_published_tests
  ON assessments (classroom_id, due_date)
  WHERE status = 'published';`,
    relatedConceptIds: ['dbms_u4_indexing', 'dbms_u4_btree', 'dbms_u2_select'],
    practiceQuestions: [
      {
        id: 'pq_u2_13_1',
        difficulty: 'intermediate',
        prompt: 'Given index `(classroom_id, student_uid)`, will a query filtering ONLY `WHERE student_uid = "u1"` efficiently use this B+-Tree index?',
        hint: 'Think of a phonebook sorted by (LastName, FirstName) when searching only by FirstName.',
        answer: 'Usually no—unless it performs a slow index skip-scan, because entries are sorted first by `classroom_id`, violating the leftmost-prefix rule.',
      },
    ],
    practicePrompt: 'Explain why wrapping an indexed column in `UPPER(name)` prevents standard B+-Tree lookup unless an expression index exists.',
  },
  {
    id: 'dbms_u2_relational_algebra',
    unitNumber: 2,
    code: '2.14',
    title: 'Relational Algebra',
    estimatedMinutes: 35,
    difficulty: 'advanced',
    simpleExplanation:
      'Relational Algebra is a formal procedural query language using mathematical operators—Selection (σ), Projection (π), Join (⋈), Union (∪), Difference (−), and Division (÷)—to transform relations.',
    detailedExplanation:
      'Every SQL SELECT query is compiled internally into a Relational Algebra expression tree before cost-based optimization. Fundamental operators are Selection `σ_p(R)` (horizontal row filter), Projection `π_L(R)` (vertical column selection + duplicate elimination), Union `R ∪ S`, Set Difference `R − S`, Cartesian Product `R × S`, and Rename `ρ`. Derived operators include Intersection `R ∩ S`, Theta/Natural Join `R ⋈ S`, and Division `R ÷ S` (universal "for all" queries).',
    summaryEn:
      'Formal operator algebra (σ, π, ×, ⋈, ∪, −, ÷) serving as the mathematical engine behind SQL query optimization.',
    summaryKn:
      'Relational Algebra ಎಂಬುದು σ (Selection), π (Projection), ⋈ (Join) ಮತ್ತು ÷ (Division) ಚಿಹ್ನೆಗಳನ್ನು ಬಳಸುವ ಗಣಿತ ಆಧಾರಿತ ಪ್ರಶ್ನೆ ಭಾಷೆಯಾಗಿದೆ.',
    realWorldExample:
      'Query optimizers apply algebraic equivalence `σ_c(R ⋈ S) ≡ σ_c(R) ⋈ S` (pushing Selection down before Join) to shrink intermediate memory usage by 100x.',
    definitions: [
      { term: 'Selection (σ)', definition: 'Unary operator selecting tuples satisfying predicate p (`σ_{credits >= 4}(Course)`).' },
      { term: 'Projection (π)', definition: 'Unary operator keeping specified attributes and removing duplicate tuples.' },
      { term: 'Division (R ÷ S)', definition: 'Finds entities in R paired with EVERY tuple in S (e.g., students who completed all units).' },
    ],
    learningObjectives: [
      'Translate SQL queries into Relational Algebra expressions and vice versa.',
      'Apply Selection pushdown and Projection pushdown equivalence rules.',
      'Formulate Relational Division (`÷`) using basic `π`, `×`, and `−` operators.',
    ],
    difficultyLevels: {
      beginner: 'σ filters rows (like WHERE); π picks columns (like SELECT DISTINCT); ⋈ combines matching tables (like JOIN).',
      intermediate: 'Know the 5 primitive complete operators `{σ, π, ×, ∪, −}` from which Join, Intersection, and Division are derived.',
      advanced: 'Derive `R(A,B) ÷ S(B) = π_A(R) − π_A( (π_A(R) × S) − R )` and verify algebraic commutativity/associativity rules.',
    },
    keyTakeaways: [
      'Relational Algebra is closed: every operator inputs and outputs a relation.',
      'Push Selections (`σ`) and Projections (`π`) as close to base tables as possible.',
      'Division expresses "for ALL" queries cleanly.',
    ],
    codeOrDiagramTitle: 'Core Operators & Query Optimization Pushdown',
    codeOrDiagram: `-- High-scoring CS-304 students:
π_{student_name}( σ_{course_code='CS-304' ∧ percentage >= 85}( Classrooms ⋈ Submissions ) )

-- Algebraic Optimization (Push σ past ⋈):
( σ_{course_code='CS-304'}(Classrooms) ) ⋈ ( σ_{percentage >= 85}(Submissions) )`,
    relatedConceptIds: ['dbms_u2_set_ops', 'dbms_u1_relational_model', 'dbms_u2_in_exists'],
    practiceQuestions: [
      {
        id: 'pq_u2_14_1',
        difficulty: 'advanced',
        prompt: 'Why is Relational Algebra closed, and why does closure matter for composing queries?',
        hint: 'Look at the return type of every operator.',
        answer: 'Every operator takes relation(s) and produces a new relation, allowing arbitrary nesting of expressions (e.g., `π(σ(R ⋈ S))`).',
      },
    ],
    practicePrompt: 'Convert `SELECT name FROM students JOIN enrollments ... WHERE grade = "A"` into a Relational Algebra expression.',
  },
  {
    id: 'dbms_u2_set_ops',
    unitNumber: 2,
    code: '2.15',
    title: 'Union, Intersection and Difference',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    simpleExplanation:
      'Set operations—UNION, INTERSECT, and EXCEPT (MINUS)—combine the row outputs of two SELECT queries vertically when both share matching column counts and compatible types.',
    detailedExplanation:
      'To apply UNION, INTERSECT, or EXCEPT, both queries must be Union-Compatible: equal number of columns and pairwise compatible data types. `UNION` merges both result sets and deduplicates rows, whereas `UNION ALL` preserves all duplicates in O(N) time without a sort/hash deduplication pass. `INTERSECT` keeps rows appearing in both queries; `EXCEPT` (or `MINUS` in Oracle) keeps rows present in the first query but absent from the second.',
    summaryEn:
      'Combines union-compatible query outputs vertically via UNION, UNION ALL, INTERSECT, and EXCEPT/MINUS.',
    summaryKn:
      'UNION, INTERSECT ಮತ್ತು EXCEPT ಕಾರ್ಯಾಚರಣೆಗಳು ಒಂದೇ ರಚನೆಯ ಎರಡು SELECT ಫಲಿತಾಂಶಗಳನ್ನು ಲಂಬವಾಗಿ ಸಂಯೋಜಿಸುತ್ತವೆ.',
    realWorldExample:
      'Finding students enrolled in CS-304 who have NOT yet joined the lab clinic uses `SELECT student_uid FROM cs304_roster EXCEPT SELECT student_uid FROM lab_signups`.',
    definitions: [
      { term: 'Union Compatibility', definition: 'Both SELECT queries have the same column count and compatible types in corresponding positions.' },
      { term: 'UNION vs. UNION ALL', definition: 'UNION eliminates duplicate rows; UNION ALL retains duplicates and avoids sort/hash overhead.' },
      { term: 'EXCEPT / MINUS', definition: 'Returns tuples from query A that do not appear in query B.' },
    ],
    learningObjectives: [
      'Verify union compatibility before combining queries.',
      'Choose UNION ALL over UNION when duplicates are impossible or desired for speed.',
      'Express set difference (`R − S`) in SQL via EXCEPT or NOT EXISTS.',
    ],
    difficultyLevels: {
      beginner: 'UNION = A or B; INTERSECT = both A and B; EXCEPT = in A but not B.',
      intermediate: 'Know that output column names always come from the FIRST SELECT query in a set operation.',
      advanced: 'Recall set-algebra identity `R ∩ S ≡ R − (R − S)` and evaluate `EXCEPT ALL` multiset counting.',
    },
    keyTakeaways: [
      'Use `UNION ALL` by default when disjoint sets are guaranteed—it skips sorting.',
      'ORDER BY applies once at the end of the combined set expression.',
      'Both sides must project identical column counts.',
    ],
    codeOrDiagramTitle: 'SQL Set Operations Example',
    codeOrDiagram: `-- Students enrolled in DBMS OR OS (deduplicated)
SELECT student_uid FROM enrollments WHERE classroom_id = 'cls_dbms'
UNION
SELECT student_uid FROM enrollments WHERE classroom_id = 'cls_os';

-- Students enrolled in DBMS who have NOT submitted Quiz 1
SELECT student_uid FROM enrollments WHERE classroom_id = 'cls_dbms'
EXCEPT
SELECT student_uid FROM assessment_submissions WHERE assessment_id = 'quiz_1';`,
    relatedConceptIds: ['dbms_u2_relational_algebra', 'dbms_u2_in_exists', 'dbms_u2_select'],
    practiceQuestions: [
      {
        id: 'pq_u2_15_1',
        difficulty: 'beginner',
        prompt: 'Why is `UNION ALL` generally faster than `UNION`?',
        hint: 'What extra step does `UNION` perform on duplicates?',
        answer: '`UNION` must sort or hash all combined rows to eliminate duplicates, whereas `UNION ALL` streams rows directly without deduplication.',
      },
    ],
    practicePrompt: 'How do you express `R ∩ S` using only Set Difference (`−`)?',
  },
  {
    id: 'dbms_u2_sql_constraints',
    unitNumber: 2,
    code: '2.16',
    title: 'SQL Constraints',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    simpleExplanation:
      'SQL Constraints—NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, and DEFAULT—declare invariants directly inside CREATE/ALTER TABLE so bad data is rejected automatically.',
    detailedExplanation:
      'Column-level and table-level SQL constraints shift validation guarantees into the database engine itself. `NOT NULL` bans missing values; `UNIQUE` enforces uniqueness while permitting multiple NULLs in ANSI SQL; `PRIMARY KEY` combines `NOT NULL + UNIQUE`; `FOREIGN KEY` links parent keys with `ON DELETE/UPDATE` policies; `CHECK` validates boolean expressions per row; and `DEFAULT` supplies fallback values on INSERT.',
    summaryEn:
      'Practical SQL implementation of NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, and DEFAULT constraints.',
    summaryKn:
      'SQL ನಲ್ಲಿ NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK ಮತ್ತು DEFAULT ನಿಯಮಗಳನ್ನು ಕೋಷ್ಟಕ ಮಟ್ಟದಲ್ಲೇ ಜಾರಿಗೊಳಿಸಬಹುದು.',
    realWorldExample:
      'Naming constraints explicitly (`CONSTRAINT uq_enrollment UNIQUE (student_uid, classroom_id)`) lets applications catch exact violation names and return helpful messages instead of crashing.',
    definitions: [
      { term: 'Table-Level Constraint', definition: 'Constraint declared after column definitions, required for multi-column PKs, UNIQUEs, or cross-column CHECKs.' },
      { term: 'CHECK Constraint', definition: 'Boolean predicate that must NOT evaluate to FALSE on INSERT or UPDATE (note: UNKNOWN passes!).' },
    ],
    learningObjectives: [
      'Write both column-level and composite table-level SQL constraints.',
      'Predict how CHECK constraints treat NULL (UNKNOWN passes unless paired with NOT NULL).',
      'Name constraints cleanly for maintainable migrations and error handling.',
    ],
    difficultyLevels: {
      beginner: 'NOT NULL = required; UNIQUE = no duplicates; CHECK = passes a rule; DEFAULT = auto-fill if omitted.',
      intermediate: 'Watch out for the subtle SQL quirk: `CHECK (age >= 18)` ALLOWS `age = NULL` unless `NOT NULL` is also specified!',
      advanced: 'Use PostgreSQL Exclusion Constraints (`EXCLUDE USING gist`) to prevent overlapping classroom booking time ranges.',
    },
    keyTakeaways: [
      'A `CHECK` constraint fails ONLY when its expression evaluates to `FALSE` (not `UNKNOWN`).',
      'Composite `UNIQUE (a, b)` enforces pair uniqueness.',
      'Always name constraints so `ALTER TABLE ... DROP CONSTRAINT` is effortless.',
    ],
    codeOrDiagramTitle: 'Composite & Named Table Constraints',
    codeOrDiagram: `CREATE TABLE enrollments (
  id            VARCHAR(64) PRIMARY KEY,
  classroom_id  VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_uid   VARCHAR(64) NOT NULL REFERENCES users(uid),
  status        VARCHAR(16) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'dropped')),
  CONSTRAINT uq_student_class UNIQUE (classroom_id, student_uid)
);`,
    relatedConceptIds: ['dbms_u1_integrity_constraints', 'dbms_u2_ddl', 'dbms_u1_pk_fk'],
    practiceQuestions: [
      {
        id: 'pq_u2_16_1',
        difficulty: 'intermediate',
        prompt: 'If a column is defined as `credits INT CHECK (credits > 0)` without `NOT NULL`, will inserting `credits = NULL` succeed?',
        hint: 'Evaluate `NULL > 0` in three-valued logic.',
        answer: 'Yes! `NULL > 0` evaluates to `UNKNOWN` (not `FALSE`), and SQL CHECK constraints only reject `FALSE`. Add `NOT NULL` to block NULL.',
      },
    ],
    practicePrompt: 'Design a table `exam_bookings` with constraints preventing negative duration and duplicate student-exam pairs.',
  },
  {
    id: 'dbms_u2_procedures_triggers',
    unitNumber: 2,
    code: '2.17',
    title: 'Stored Procedures and Triggers',
    estimatedMinutes: 30,
    difficulty: 'advanced',
    simpleExplanation:
      'Stored Procedures are reusable server-side SQL routines invoked explicitly, while Triggers are event-driven routines fired automatically BEFORE or AFTER INSERT, UPDATE, or DELETE.',
    detailedExplanation:
      'Stored Procedures and Functions encapsulate multi-step database logic inside the DBMS engine (reducing network round-trips and centralizing business routines like batch grade finalization). Triggers implement Event-Condition-Action (ECA) rules attached to a table: e.g., `AFTER INSERT OR UPDATE` or `BEFORE DELETE` (`FOR EACH ROW` or `FOR EACH STATEMENT`), accessing `NEW` and `OLD` row images to maintain audit logs, validate complex multi-table invariants, or auto-update summary timestamps.',
    summaryEn:
      'Server-side Stored Procedures/Functions and Event-Condition-Action (ECA) Triggers with BEFORE/AFTER and OLD/NEW row images.',
    summaryKn:
      'Stored Procedures ಕರೆಯಲ್ಪಟ್ಟಾಗ ಮಾತ್ರ ಚಲಿಸುವ SQL ವಿಧಾನಗಳು; Triggers INSERT/UPDATE/DELETE ಘಟನೆಗಳ ಮೇಲೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಚಲಿಸುತ್ತವೆ.',
    realWorldExample:
      'An `AFTER INSERT ON assessment_submissions` trigger automatically writes an immutable audit trail entry and updates the classroom’s submission counter even if an admin script inserts directly.',
    definitions: [
      { term: 'Stored Procedure', definition: 'Precompiled SQL/procedural block stored in the catalog and executed via CALL.' },
      { term: 'Database Trigger', definition: 'ECA routine executed automatically BEFORE/AFTER/INSTEAD OF DML events on a table.' },
      { term: 'NEW / OLD Pseudorecords', definition: 'Row-level trigger bindings exposing incoming and pre-modification column values.' },
    ],
    learningObjectives: [
      'Distinguish Stored Procedures, User-Defined Functions, and Triggers.',
      'Choose BEFORE vs. AFTER triggers and FOR EACH ROW vs. FOR EACH STATEMENT.',
      'Prevent infinite recursive trigger cascades and hidden side-effect pitfalls.',
    ],
    difficultyLevels: {
      beginner: 'Procedure = saved recipe you run on demand; Trigger = automatic motion-sensor alarm whenever a row changes.',
      intermediate: 'Use `BEFORE` triggers to normalize or reject incoming `NEW` values; use `AFTER` triggers for audit logging and side effects.',
      advanced: 'Understand why Triggers share the caller’s transaction (a trigger failure rolls back the triggering DML) and avoid mutating-table errors.',
    },
    keyTakeaways: [
      'Triggers execute inside the same ACID transaction as the triggering DML.',
      'Use `BEFORE` for validation/mutation of `NEW`, `AFTER` for audit tables.',
      'Prefer declarative constraints over triggers whenever possible for clarity and optimizer visibility.',
    ],
    codeOrDiagramTitle: 'Audit Trigger & Stored Procedure Pattern',
    codeOrDiagram: `CREATE OR REPLACE FUNCTION log_grade_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO grade_audit(submission_id, old_score, new_score, changed_at)
  VALUES (OLD.id, OLD.score, NEW.score, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_submission_score_audit
AFTER UPDATE OF score ON assessment_submissions
FOR EACH ROW
WHEN (OLD.score IS DISTINCT FROM NEW.score)
EXECUTE FUNCTION log_grade_change();`,
    relatedConceptIds: ['dbms_u2_sql_constraints', 'dbms_u2_dml', 'dbms_u4_security'],
    practiceQuestions: [
      {
        id: 'pq_u2_17_1',
        difficulty: 'intermediate',
        prompt: 'Should you use a `BEFORE INSERT` or `AFTER INSERT` trigger to auto-populate `NEW.updated_at = NOW()`?',
        hint: 'When can `NEW` still be modified before hitting disk?',
        answer: 'A `BEFORE INSERT` trigger, because you can modify `NEW` fields cleanly before the row is written to storage.',
      },
    ],
    practicePrompt: 'Explain what happens to the triggering `UPDATE` statement if an `AFTER UPDATE` trigger raises an exception.',
  },
];
