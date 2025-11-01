type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown> & { msg: string; level?: LogLevel };

export function log(payload: LogPayload) {
  const { level = "info", ...rest } = payload;
  const entry = { ts: new Date().toISOString(), level, ...rest };
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

