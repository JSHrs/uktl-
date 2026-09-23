import { getEnv } from "./env";
import { createPostgresDatabase } from "./postgres";
import { getCandidateSession } from "../supabase";
// Attribution is derived only from the server-verified session, never input/metadata.
// This helper is not an authorization boundary; each handler must still authorize.
export async function getRequestEnv() {
  const env = await getEnv();
  if (env.DATA_BACKEND !== "supabase" || !env.DATABASE_URL) return env;
  const session = await getCandidateSession();
  return Object.create(env, {
    DB: { value: createPostgresDatabase(env.DATABASE_URL, session.userId), enumerable: true },
  }) as typeof env;
}
