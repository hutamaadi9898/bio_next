import { auditLogs } from "@/drizzle/schema";
import { db } from "@/lib/db";

export type AuditEvent = {
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
};

export async function logAuditSafe(evt: AuditEvent) {
  try {
    await db.insert(auditLogs).values({
      userId: evt.userId ?? null,
      action: evt.action,
      entity: evt.entity ?? null,
      entityId: evt.entityId ?? null,
    });
  } catch (err) {
    // Best-effort only; do not throw
    console.error("audit_log_failed", err);
  }
}

