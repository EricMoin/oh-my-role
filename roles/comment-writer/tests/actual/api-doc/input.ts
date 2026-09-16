import { AuthError } from "./errors";
import { sessions } from "./sessions";
import { users } from "./users";

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

/**
 * Creates a session for `userId` that expires after `ttlSeconds`.
 *
 * @param userId - owner of the new session
 * @param ttlSeconds - lifetime in seconds, at least 60
 * @returns the stored session, with `expiresAt` as a Unix timestamp in milliseconds
 * @throws {RangeError} if `ttlSeconds` is below 60
 * @throws {AuthError} if the user does not exist or is disabled
 */
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
