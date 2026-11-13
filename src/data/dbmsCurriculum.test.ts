import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DBMS_CURRICULUM_LABEL,
  DBMS_CURRICULUM_NOTICE,
  DBMS_UNITS,
  findDbmsChapterById,
  findRelatedDbmsChapters,
  getAllDbmsChapters,
  getDbmsUnit,
} from './dbmsCurriculum';

test('DBMS starter curriculum contains all 4 units, 67 total topics, and explicit Starter Curriculum attribution', () => {
  assert.equal(DBMS_CURRICULUM_LABEL, 'Starter Curriculum');
  assert.ok(DBMS_CURRICULUM_NOTICE.includes('Pending Official Syllabus Verification'));
  assert.equal(DBMS_UNITS.length, 4);

  assert.equal(DBMS_UNITS[0].chapters.length, 16);
  assert.equal(DBMS_UNITS[1].chapters.length, 17);
  assert.equal(DBMS_UNITS[2].chapters.length, 14);
  assert.equal(DBMS_UNITS[3].chapters.length, 20);

  const all = getAllDbmsChapters();
  assert.equal(all.length, 67);

  for (const unit of DBMS_UNITS) {
    assert.equal(unit.attributionLabel, 'Starter Curriculum');
    assert.ok(unit.overviewEn.length > 40);
    assert.ok(unit.overviewKn.length > 20);
  }
});

test('DBMS curriculum includes every required topic across Units 1 to 4', () => {
  const titles = new Set(getAllDbmsChapters().map((c) => c.title.toLowerCase()));

  const requiredTitles = [
    // Unit 1 (16)
    'introduction to database systems',
    'characteristics of dbms',
    'file system vs dbms',
    'database architecture',
    'three-schema architecture',
    'data independence',
    'database languages',
    'data models',
    'entity relationship model',
    'entities and attributes',
    'relationships and cardinality',
    'er diagrams',
    'relational data model',
    'primary keys and foreign keys',
    'candidate keys and super keys',
    'integrity constraints',
    // Unit 2 (17)
    'introduction to sql',
    'create, alter, drop',
    'insert, update, delete',
    'select queries',
    'where, order by, group by',
    'aggregate functions',
    'joins',
    'inner join and outer join',
    'self join',
    'nested queries',
    'subqueries with in and exists',
    'views',
    'indexes',
    'relational algebra',
    'union, intersection and difference',
    'sql constraints',
    'stored procedures and triggers',
    // Unit 3 (14)
    'functional dependencies',
    'attribute closure',
    'candidate key identification',
    "armstrong's axioms",
    'database anomalies',
    'first normal form',
    'second normal form',
    'third normal form',
    'boyce-codd normal form',
    'fourth normal form',
    'fifth normal form',
    'lossless decomposition',
    'dependency preservation',
    'schema refinement',
    // Unit 4 (20)
    'transaction concepts',
    'acid properties',
    'transaction states',
    'serializability',
    'conflict serializability',
    'recoverability',
    'concurrency control',
    'lock-based protocols',
    'two-phase locking',
    'deadlocks',
    'timestamp ordering',
    'database recovery',
    'log-based recovery',
    'checkpoints',
    'database indexing',
    'b-tree and b+ tree',
    'hashing',
    'database security',
    'backup and recovery',
    'distributed databases',
  ];

  assert.equal(requiredTitles.length, 67);
  for (const title of requiredTitles) {
    assert.ok(titles.has(title), `Missing required DBMS topic: ${title}`);
  }
});

test('Every DBMS topic includes explanations, real-world example, definitions, objectives, 3 difficulty levels, related concepts, and practice questions', () => {
  const all = getAllDbmsChapters();
  const idSet = new Set(all.map((c) => c.id));
  assert.equal(idSet.size, all.length, 'Topic IDs must be unique');

  for (const ch of all) {
    assert.ok(ch.simpleExplanation.length > 25, `${ch.id} simpleExplanation`);
    assert.ok(ch.detailedExplanation.length > 60, `${ch.id} detailedExplanation`);
    assert.ok(ch.summaryKn.length > 15, `${ch.id} summaryKn`);
    assert.ok(ch.realWorldExample.length > 25, `${ch.id} realWorldExample`);
    assert.ok(ch.definitions.length >= 2, `${ch.id} definitions`);
    assert.ok(ch.learningObjectives.length >= 3, `${ch.id} learningObjectives`);
    assert.ok(['beginner', 'intermediate', 'advanced'].includes(ch.difficulty), `${ch.id} difficulty`);
    assert.ok(ch.difficultyLevels.beginner.length > 15, `${ch.id} beginner note`);
    assert.ok(ch.difficultyLevels.intermediate.length > 15, `${ch.id} intermediate note`);
    assert.ok(ch.difficultyLevels.advanced.length > 15, `${ch.id} advanced note`);
    assert.ok(ch.estimatedMinutes >= 15, `${ch.id} estimatedMinutes`);
    assert.ok(ch.relatedConceptIds.length >= 2, `${ch.id} relatedConceptIds`);
    for (const relId of ch.relatedConceptIds) {
      assert.ok(idSet.has(relId), `${ch.id} broken relatedConceptId: ${relId}`);
    }
    assert.ok(ch.practiceQuestions.length >= 1, `${ch.id} practiceQuestions`);
  }
});

test('DBMS lookup helpers return matching unit, chapter, legacy aliases, and related chapters', () => {
  const unit3 = getDbmsUnit(3);
  assert.ok(unit3);
  assert.equal(unit3.unitNumber, 3);

  const bcnf = findDbmsChapterById('dbms_u3_bcnf');
  assert.ok(bcnf);
  assert.equal(bcnf.unitNumber, 3);
  assert.equal(bcnf.title, 'Boyce-Codd Normal Form');
  assert.ok(findRelatedDbmsChapters(bcnf).length >= 2);

  // Legacy ID compatibility check
  const legacyIntro = findDbmsChapterById('dbms_u1_fundamentals');
  assert.ok(legacyIntro);
  assert.equal(legacyIntro.id, 'dbms_u1_intro_db_systems');
});
