---
name: doc-comments
description: Per-language API and doc-comment standards — JSDoc/TSDoc, PEP 257, rustdoc, Javadoc/KDoc, Go doc comments. Load when touching API/exported symbols or doc comments.
---

# Doc Comments (API Documentation)

## 1. General Rules

- **Document the contract, not the implementation.** Say what callers can rely on — behavior, params, returns, errors — never how it works internally.
- **A stale doc comment is worse than none — update or delete.** Every claim is a promise; a lying promise erodes trust faster than no docs.
- **Match the project language.** Use the repo's established toolchain (JSDoc vs TSDoc, Javadoc vs KDoc, Google vs NumPy style). Never invent a format the repo does not use.
- **Skip doc comments on trivial, self-evident code.** Getters, one-line wrappers — the signature says it. Doc comments belong on public/exported symbols with real contracts.

## 2. JavaScript / TypeScript — JSDoc / TSDoc

Format: `/** ... */` with `@param name - desc`, `@returns`, `@throws`, `@deprecated`. First sentence is the summary. TSDoc omits types — they live in the TS signature; only plain-JS JSDoc writes `{string}`.

❌
```typescript
/**
 * @param {string} userId - the user's id
 * @param {number} limit - max items
 * @returns {Promise<User[]>} the users
 */
export async function fetchUsers(userId: string, limit: number): Promise<User[]> { ... }
```

✅
```typescript
/**
 * Fetches the most recent users created by `userId`.
 * @param userId - owner of the users to fetch
 * @param limit - max number of users (1-100)
 * @returns users sorted by creation date, newest first
 * @throws {ApiError} if the request fails or access is denied
 * @deprecated use {@link listUsers}, which adds pagination
 */
export async function fetchUsers(userId: string, limit: number): Promise<User[]> { ... }
```

## 3. Python — PEP 257

Format: `"""triple double quotes"""`. One-line summary ending with a period, phrased as a command ("Return ...", "Parse ..."). Multi-line: summary, blank line, then Args / Returns / Raises sections (Google style accepted). Types live in the signature, never the docstring.

❌
```python
def parse_config(path: str) -> dict:
    """parse_config(path) -> dict

    Args:
        path (str): the config file path
    Returns:
        dict: the parsed config
    """
```

✅
```python
def parse_config(path: str) -> dict:
    """Parse a config file into a dict of settings.

    Args:
        path: Path to the TOML config file.
    Returns:
        Parsed settings; empty dict if the file has no settings.
    Raises:
        FileNotFoundError: If the file does not exist.
    """
    ...
```

## 4. Rust — rustdoc

Format: `///` lines; first line is the summary. Sections: `# Panics`, `# Errors`, `# Safety` (required on unsafe fns). Runnable doctests in ``` blocks.

❌
```rust
/// Converts a string to a number. Returns a Result. Panics on invalid input.
pub fn parse_num(s: &str) -> Result<i64, ParseIntError> { ... }
```

✅
```rust
/// Parse a string as a base-10 integer.
///
/// ```
/// assert_eq!(parse_num("42").unwrap(), 42);
/// ```
///
/// # Errors
/// Returns [`ParseIntError`] if `s` contains non-digit characters.
pub fn parse_num(s: &str) -> Result<i64, ParseIntError> { ... }
```

## 5. Java / Kotlin — Javadoc / KDoc

Format: `@param`, `@return`, `@throws`; first sentence is the summary, `@param` descriptions start lowercase with no trailing period. KDoc omits `@return` when the function returns `Unit`.

❌
```kotlin
/** Saves the user. @param user The user to save. @return Unit */
fun saveUser(user: User) { ... }
```

✅
```kotlin
/**
 * Persists the user and returns the stored record.
 * @param user the user to save
 * @return the saved user with its generated id
 * @throws DuplicateEmailException if the email is already taken
 */
fun saveUser(user: User): User { ... }
```

## 6. Go — Doc Comments

Format: `//` lines above the declaration, starting with the symbol name: `// ParseConfig parses ...`. Every exported name gets one; packages get `// Package name ...`. Booleans use "reports whether". No `@param` tags — parameters are explained in prose. Deprecations start a `Deprecated:` paragraph. Go 1.19+ doc-comment formatting: headings (`// # Section`), doc links (`[os.File]`), reference links (`[Text]: URL`), lists (`//   - item`).

❌
```go
// Takes a config string and parses it into a Config struct.
// @param s the string to parse
// @return the parsed config
func ParseConfig(s string) (*Config, error) { ... }
```

✅
```go
// ParseConfig parses a TOML-encoded config string.
//
// # Supported features
//   - inline tables and arrays
//   - dotted keys
// It returns the parsed [Config], or an error if the input is malformed.
func ParseConfig(s string) (*Config, error) { ... }
```
