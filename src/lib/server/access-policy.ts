export type Viewer = { isAdmin: boolean; isStaff?: boolean; staffRole?: "admin" | "consultant" | null; userId: string | null };

// Admin sees everything; a signed-in candidate only their own linked record.
export function canAccessCandidate(viewer: Viewer, ownerId: string | null | undefined): boolean {
  if (viewer.isAdmin || viewer.isStaff) return true;
  return !!viewer.userId && ownerId === viewer.userId;
}

