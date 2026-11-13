import {
  DBMS_CURRICULUM_LABEL,
  DBMS_CURRICULUM_NOTICE,
  type DbmsChapter,
  type DbmsUnit,
  type DifficultyLevel,
  type DifficultyTierNotes,
  type TopicDefinition,
  type TopicPracticeQuestion,
} from './dbmsCurriculumTypes';
import { DBMS_UNIT_1_CHAPTERS } from './dbmsUnit1';
import { DBMS_UNIT_2_CHAPTERS } from './dbmsUnit2';
import { DBMS_UNIT_3_CHAPTERS } from './dbmsUnit3';
import { DBMS_UNIT_4_CHAPTERS } from './dbmsUnit4';

export {
  DBMS_CURRICULUM_LABEL,
  DBMS_CURRICULUM_NOTICE,
  type DbmsChapter,
  type DbmsUnit,
  type DifficultyLevel,
  type DifficultyTierNotes,
  type TopicDefinition,
  type TopicPracticeQuestion,
};

export const DBMS_UNITS: DbmsUnit[] = [
  {
    unitNumber: 1,
    title: 'Unit 1 · Database Fundamentals',
    subtitle:
      'Introduction to Database Systems, DBMS Architecture, Three-Schema, Data Models, ER Diagrams, Relational Model, Keys and Integrity Constraints',
    attributionLabel: DBMS_CURRICULUM_LABEL,
    noticeText: DBMS_CURRICULUM_NOTICE,
    overviewEn:
      'Establishes why managed database systems replace flat files, how the ANSI/SPARC three-schema architecture achieves logical and physical data independence, and how real-world domains translate into ER diagrams and constrained relational tables.',
    overviewKn:
      'ಫೈಲ್ ಆಧಾರಿತ ವ್ಯವಸ್ಥೆಗಳ ಮಿತಿಗಳನ್ನು ಮೀರಿ DBMS ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ, ಮೂರು-ಸ್ತರಗಳ (3-Schema) ವಾಸ್ತುಶಿಲ್ಪ ಮತ್ತು ER ಹಾಗೂ Relational ಮಾದರಿಗಳಲ್ಲಿ Keys ಮತ್ತು Constraints ಹೇಗೆ ಬಳಸಲಾಗುತ್ತದೆ ಎಂಬುದನ್ನು ಈ ಘಟಕವು ವಿವರಿಸುತ್ತದೆ.',
    chapters: DBMS_UNIT_1_CHAPTERS,
  },
  {
    unitNumber: 2,
    title: 'Unit 2 · SQL and Relational Operations',
    subtitle:
      'SQL, DDL, DML, SELECT, GROUP BY, Aggregates, Joins, Self Join, Nested Queries, IN/EXISTS, Views, Indexes, Relational Algebra, Set Ops, Constraints & Triggers',
    attributionLabel: DBMS_CURRICULUM_LABEL,
    noticeText: DBMS_CURRICULUM_NOTICE,
    overviewEn:
      'Covers the complete SQL command taxonomy (DDL, DML, DCL, TCL), joins, correlated subqueries with IN/EXISTS, views, indexes, relational algebra & set operations, SQL constraints, and server-side stored procedures and triggers.',
    overviewKn:
      'ಈ ಘಟಕದಲ್ಲಿ SQL (DDL, DML), SELECT ಪ್ರಶ್ನೆಗಳು, Joins, Subqueries (IN/EXISTS), Views, Indexes, Relational Algebra, Constraints ಮತ್ತು Triggers ಅನ್ನು ಉದಾಹರಣೆಗಳೊಂದಿಗೆ ಕಲಿಯಲಾಗುತ್ತದೆ.',
    chapters: DBMS_UNIT_2_CHAPTERS,
  },
  {
    unitNumber: 3,
    title: 'Unit 3 · Database Design and Normalization',
    subtitle:
      "Functional Dependencies, Attribute Closure, Candidate Keys, Armstrong's Axioms, Anomalies, 1NF, 2NF, 3NF, BCNF, 4NF, 5NF, Lossless & Dependency-Preserving Decomposition",
    attributionLabel: DBMS_CURRICULUM_LABEL,
    noticeText: DBMS_CURRICULUM_NOTICE,
    overviewEn:
      "Teaches formal schema refinement using Functional Dependencies, Attribute Closure (X+), Candidate Key identification, Armstrong's Axioms, normal forms from 1NF through 5NF (including BCNF), Lossless-Join and Dependency-Preserving decompositions.",
    overviewKn:
      'ಈ ಘಟಕವು Functional Dependencies, Attribute Closure, Armstrong ನಿಯಮಗಳು, 1NF ನಿಂದ 5NF (BCNF ಸೇರಿ) ಹಂತಗಳು ಮತ್ತು Lossless-Join ಹಾಗೂ Dependency-Preserving ವಿಭಜನೆಯನ್ನು ವಿವರಿಸುತ್ತದೆ.',
    chapters: DBMS_UNIT_3_CHAPTERS,
  },
  {
    unitNumber: 4,
    title: 'Unit 4 · Transactions and Advanced Databases',
    subtitle:
      'Transactions, ACID, States, Serializability, Recoverability, Concurrency Control, 2PL, Deadlocks, Timestamp Ordering, WAL Recovery, Checkpoints, B+-Trees, Hashing, Security & Distributed DBs',
    attributionLabel: DBMS_CURRICULUM_LABEL,
    noticeText: DBMS_CURRICULUM_NOTICE,
    overviewEn:
      'Explores internal DBMS runtime guarantees: ACID transaction lifecycles, conflict serializability, recoverability, Two-Phase Locking, deadlocks, timestamp ordering, WAL/ARIES recovery & checkpoints, B+-Tree/Hash indexing, security, backups, and distributed databases.',
    overviewKn:
      'ಈ ಘಟಕವು ACID ಗುಣಲಕ್ಷಣಗಳು, Serializability, 2PL ಲಾಕಿಂಗ್, Deadlocks, Timestamp Ordering, WAL Recovery, Checkpoints, B+-Tree/Hash Indexing, ಭದ್ರತೆ ಮತ್ತು Distributed Databases ಅನ್ನು ವಿವರಿಸುತ್ತದೆ.',
    chapters: DBMS_UNIT_4_CHAPTERS,
  },
];

const LEGACY_CHAPTER_ALIASES: Record<string, string> = {
  dbms_u1_fundamentals: 'dbms_u1_intro_db_systems',
  dbms_u1_architecture: 'dbms_u1_architecture',
  dbms_u1_er_model: 'dbms_u1_er_model',
  dbms_u1_relational_model: 'dbms_u1_relational_model',
  dbms_u1_keys_constraints: 'dbms_u1_pk_fk',
  dbms_u2_sql_subsets: 'dbms_u2_intro_sql',
  dbms_u2_joins_subqueries: 'dbms_u2_joins',
  dbms_u2_views_aggregation: 'dbms_u2_views',
  dbms_u3_fd_closure: 'dbms_u3_functional_dependencies',
  dbms_u3_1nf_2nf_3nf: 'dbms_u3_3nf',
  dbms_u3_decomposition: 'dbms_u3_lossless_decomposition',
  dbms_u4_transactions_acid: 'dbms_u4_acid',
  dbms_u4_concurrency_locking: 'dbms_u4_2pl',
  dbms_u4_deadlocks_recovery: 'dbms_u4_deadlocks',
  dbms_u4_indexing_security: 'dbms_u4_security',
};

export function getAllDbmsChapters(): DbmsChapter[] {
  return DBMS_UNITS.flatMap((u) => u.chapters);
}

export function findDbmsChapterById(chapterId: string): DbmsChapter | undefined {
  const all = getAllDbmsChapters();
  const direct = all.find((c) => c.id === chapterId);
  if (direct) return direct;
  const alias = LEGACY_CHAPTER_ALIASES[chapterId];
  return alias ? all.find((c) => c.id === alias) : undefined;
}

export function getDbmsUnit(unitNumber: 1 | 2 | 3 | 4): DbmsUnit | undefined {
  return DBMS_UNITS.find((u) => u.unitNumber === unitNumber);
}

export function findRelatedDbmsChapters(chapter: DbmsChapter): DbmsChapter[] {
  return chapter.relatedConceptIds
    .map((id) => findDbmsChapterById(id))
    .filter((item): item is DbmsChapter => Boolean(item));
}
