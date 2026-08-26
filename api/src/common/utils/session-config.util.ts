export interface SessionTimeoutConfig {
  idleTimeoutMs: number;
  absoluteTimeoutMs: number;
  persistentTimeoutMs: number;
  persistentTimeoutDays: number;
  lastActiveThrottleMs: number;
}

export function getSessionTimeoutConfig(): SessionTimeoutConfig {
  const idleMinutes = parseInt(process.env.IDLE_SESSION_TIMEOUT_MINUTES || '30', 10);
  const absoluteHours = parseInt(process.env.ABSOLUTE_SESSION_TIMEOUT_HOURS || '24', 10);
  const persistentDays = parseInt(process.env.PERSISTENT_SESSION_DAYS || '30', 10);
  const throttleSeconds = parseInt(process.env.SESSION_ACTIVITY_THROTTLE_SECONDS || '60', 10);

  // Validate configuration strictly — fallback to secure defaults if invalid/negative
  const idleTimeoutMs =
    Number.isFinite(idleMinutes) && idleMinutes > 0
      ? idleMinutes * 60 * 1000
      : 30 * 60 * 1000; // default 30 minutes

  const absoluteTimeoutMs =
    Number.isFinite(absoluteHours) && absoluteHours > 0
      ? absoluteHours * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000; // default 24 hours

  const persistentTimeoutDays =
    Number.isFinite(persistentDays) && persistentDays > 0
      ? persistentDays
      : 30; // default 30 days

  const persistentTimeoutMs = persistentTimeoutDays * 24 * 60 * 60 * 1000;

  const lastActiveThrottleMs =
    Number.isFinite(throttleSeconds) && throttleSeconds > 0
      ? throttleSeconds * 1000
      : 60 * 1000; // default 60 seconds

  return {
    idleTimeoutMs,
    absoluteTimeoutMs,
    persistentTimeoutMs,
    persistentTimeoutDays,
    lastActiveThrottleMs,
  };
}
