export type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; errors: Record<string, string> };
