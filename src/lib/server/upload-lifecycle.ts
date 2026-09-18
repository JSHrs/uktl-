/** Register the private object key before storing bytes, so partial uploads
 * remain traceable even if a later database or provider request fails. */
export async function storeRegisteredCv(operations: {
  register: () => Promise<void>;
  upload: () => Promise<unknown>;
  markFailed: () => Promise<void>;
}): Promise<boolean> {
  try { await operations.register(); }
  catch { throw new Error("CV upload is temporarily unavailable. No file was uploaded."); }
  try { await operations.upload(); return true; }
  catch {
    // The registration remains available for reconciliation even during a DB outage.
    try { await operations.markFailed(); } catch { /* retain registered key */ }
    return false;
  }
}
