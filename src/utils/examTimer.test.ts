import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampDurationSeconds,
  computeElapsedSeconds,
  formatCountdown,
  getTimerSeverity,
} from './examTimer';

test('clampDurationSeconds bounds duration between 1 and 240 minutes', () => {
  assert.equal(clampDurationSeconds(0), 60);
  assert.equal(clampDurationSeconds(25), 1500);
  assert.equal(clampDurationSeconds(500), 14400);
});

test('formatCountdown formats MM:SS and HH:MM:SS reliably', () => {
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(5), '00:05');
  assert.equal(formatCountdown(125), '02:05');
  assert.equal(formatCountdown(1500), '25:00');
  assert.equal(formatCountdown(3665), '01:01:05');
  assert.equal(formatCountdown(-12), '00:00');
});

test('getTimerSeverity transitions cleanly from normal to warning to critical', () => {
  assert.equal(getTimerSeverity(1200, 1500), 'normal');
  assert.equal(getTimerSeverity(300, 1500), 'warning');
  assert.equal(getTimerSeverity(120, 1500), 'critical');
  assert.equal(getTimerSeverity(45, 1500), 'critical');
});

test('computeElapsedSeconds computes bounded elapsed exam duration', () => {
  assert.equal(computeElapsedSeconds(1500, 1180), 320);
  assert.equal(computeElapsedSeconds(1500, 0), 1500);
  assert.equal(computeElapsedSeconds(1500, 1600), 0);
});
