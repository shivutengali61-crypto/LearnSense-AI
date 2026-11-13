import test from 'node:test';
import assert from 'node:assert/strict';
import { DBMS_UNITS, getAllDbmsChapters } from '../data/dbmsCurriculum';
import {
  computeOverallCurriculumProgress,
  computeUnitProgress,
  filterCurriculumUnits,
  getAdjacentCurriculumTopics,
  toggleTopicIdInList,
} from './curriculumProgress';

test('toggleTopicIdInList toggles topic IDs deterministically and filters invalid IDs', () => {
  const validIds = new Set(getAllDbmsChapters().map((c) => c.id));
  const added = toggleTopicIdInList([], 'dbms_u3_bcnf', validIds);
  assert.deepEqual(added, ['dbms_u3_bcnf']);

  const addedTwo = toggleTopicIdInList(added, 'dbms_u1_intro_db_systems', validIds);
  assert.deepEqual(addedTwo, ['dbms_u1_intro_db_systems', 'dbms_u3_bcnf']);

  const removed = toggleTopicIdInList(addedTwo, 'dbms_u3_bcnf', validIds);
  assert.deepEqual(removed, ['dbms_u1_intro_db_systems']);

  const ignoredInvalid = toggleTopicIdInList(removed, 'non_existent_topic', validIds);
  assert.deepEqual(ignoredInvalid, ['dbms_u1_intro_db_systems']);
});

test('computeUnitProgress and computeOverallCurriculumProgress compute accurate percentages and minutes', () => {
  const unit1 = DBMS_UNITS[0];
  const halfUnit1Ids = unit1.chapters.slice(0, 8).map((c) => c.id);
  const u1Summary = computeUnitProgress(unit1, halfUnit1Ids);
  assert.equal(u1Summary.totalCount, 16);
  assert.equal(u1Summary.completedCount, 8);
  assert.equal(u1Summary.percentage, 50);
  assert.equal(u1Summary.remainingMinutes, u1Summary.totalMinutes - u1Summary.completedMinutes);

  const overall = computeOverallCurriculumProgress(DBMS_UNITS, halfUnit1Ids);
  assert.equal(overall.totalCount, 67);
  assert.equal(overall.completedCount, 8);
  assert.equal(overall.percentage, Math.round((8 / 67) * 100));
  assert.equal(overall.unitBreakdown.length, 4);
});

test('filterCurriculumUnits filters accurately by search query, difficulty, and completion status', () => {
  const completed = ['dbms_u3_bcnf', 'dbms_u1_intro_db_systems'];
  const searchBcnf = filterCurriculumUnits(DBMS_UNITS, { query: 'Boyce-Codd' });
  const matchedTitles = searchBcnf.flatMap((entry) => entry.matchingChapters.map((c) => c.title));
  assert.ok(matchedTitles.includes('Boyce-Codd Normal Form'));
  assert.equal(matchedTitles.length, 1);

  const onlyCompleted = filterCurriculumUnits(DBMS_UNITS, {
    status: 'completed',
    completedTopicIds: completed,
  });
  const completedIds = onlyCompleted.flatMap((entry) => entry.matchingChapters.map((c) => c.id));
  assert.deepEqual(completedIds.sort(), completed.sort());

  const advancedOnly = filterCurriculumUnits(DBMS_UNITS, { difficulty: 'advanced' });
  const allAdvanced = advancedOnly.flatMap((entry) => entry.matchingChapters);
  assert.ok(allAdvanced.length > 0);
  for (const ch of allAdvanced) {
    assert.equal(ch.difficulty, 'advanced');
  }
});

test('getAdjacentCurriculumTopics walks sequentially across unit boundaries', () => {
  const all = getAllDbmsChapters();
  const first = all[0];
  const lastUnit1 = DBMS_UNITS[0].chapters[DBMS_UNITS[0].chapters.length - 1];
  const firstUnit2 = DBMS_UNITS[1].chapters[0];

  assert.equal(getAdjacentCurriculumTopics(DBMS_UNITS, first.id).prevTopic, null);
  assert.equal(getAdjacentCurriculumTopics(DBMS_UNITS, lastUnit1.id).nextTopic?.id, firstUnit2.id);
  assert.equal(getAdjacentCurriculumTopics(DBMS_UNITS, firstUnit2.id).prevTopic?.id, lastUnit1.id);
});
