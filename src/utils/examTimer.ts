export type TimerSeverity = 'normal' | 'warning' | 'critical';

export function clampDurationSeconds(durationMinutes: number): number {
  const mins = Number.isFinite(durationMinutes) ? Math.max(1, Math.min(240, Math.round(durationMinutes))) : 15;
  return mins * 60;
}

export function formatCountdown(remainingSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(remainingSeconds) ? remainingSeconds : 0));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function getTimerSeverity(remainingSeconds: number, totalSeconds: number): TimerSeverity {
  if (remainingSeconds <= 120) {
    return 'critical';
  }
  if (totalSeconds > 0 && remainingSeconds <= Math.ceil(totalSeconds * 0.25)) {
    return 'warning';
  }
  return 'normal';
}

export function computeElapsedSeconds(totalSeconds: number, remainingSeconds: number): number {
  const safeTotal = Math.max(0, Math.round(totalSeconds));
  const safeRemaining = Math.max(0, Math.round(remainingSeconds));
  return Math.max(0, Math.min(safeTotal, safeTotal - safeRemaining));
}
