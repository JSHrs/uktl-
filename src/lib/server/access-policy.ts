export type Viewer = { isAdmin: boolean; userId: string | null };

// Admin sees everything; a signed-in candidate only their own linked record.
export function canAccessCandidate(viewer: Viewer, ownerId: string | null | undefined): boolean {
  if (viewer.isAdmin) return true;
  return !!viewer.userId && ownerId === viewer.userId;
}

