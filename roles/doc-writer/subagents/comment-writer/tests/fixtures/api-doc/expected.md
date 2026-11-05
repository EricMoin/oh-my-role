# api-doc — expected

Input: `input.ts`, with one exported function and one trivial getter.

Requirement:

1. `createSession` carries a doc comment that states the caller contract:
   - one summary line;
   - `@param userId` and `@param ttlSeconds` with the lower bound;
   - `@returns` the stored session, saying `expiresAt` is a Unix timestamp in milliseconds;
   - `@throws` for both failure modes the body actually has.
2. `getSessionId` stays undocumented. Its signature and one-line body already say everything; a doc comment there fails the gate.
3. No other comments are added.

The required doc comment:

```typescript
/**
 * Creates a session for `userId` that expires after `ttlSeconds`.
 *
 * @param userId - owner of the new session
 * @param ttlSeconds - lifetime in seconds, at least 60
 * @returns the stored session, with `expiresAt` as a Unix timestamp in milliseconds
 * @throws {RangeError} if `ttlSeconds` is below 60
 * @throws {AuthError} if the user does not exist or is disabled
 */
```
