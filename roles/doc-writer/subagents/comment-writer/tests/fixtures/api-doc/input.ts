import { AuthError } from "./errors";
import { sessions } from "./sessions";
import { users } from "./users";

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

export async function createSession(userId: string, ttlSeconds: number): Promise<Session> {
  if (ttlSeconds < 60) {
    throw new RangeError("ttlSeconds must be at least 60");
  }
  const user = await users.find(userId);
  if (!user || user.disabled) {
    throw new AuthError(`cannot create session for ${userId}`);
  }
  return sessions.insert({
    userId,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function getSessionId(session: Session): string {
  return session.id;
}
