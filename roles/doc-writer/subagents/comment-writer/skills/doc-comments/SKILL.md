---
name: doc-comments
description: Per-language API and doc-comment standards — JSDoc/TSDoc, PEP 257, rustdoc, Javadoc/KDoc, Go doc comments. Load when touching API/exported symbols or doc comments; enforces the contract-only gate.
---

# Doc Comments (API Documentation)

## 1. Doc-comment gate — contract only

A doc comment documents the contract a caller relies on: behavior, params, returns, errors, deprecation.

- Skip getters, trivial one-line wrappers, and anything whose signature already says it.
- Shared kill test from comment-style §1 applies unchanged; run it before writing the contract.
- Linux kernel coding style §8: no boilerplate docs that restate the signature.
- Rust API Guidelines C-FAILURE / C-CRATE-DOC: document failure modes and crate usage, not the obvious.
- Match the project toolchain; update or delete a stale comment — every claim is a promise.
- Prose quality: Google developer documentation style guide and Microsoft Writing Style Guide — plain words, no marketing adjectives; 中文依阮一峰《中文技术文档的写作规范》。

## 2. JavaScript / TypeScript — JSDoc / TSDoc

Provenance: TSDoc/JSDoc convention as used by the project. Format: `/** ... */` with `@param name - desc`, `@returns`, `@throws`, `@deprecated`; the first sentence is the summary. TSDoc omits types — they live in the TS signature; only plain-JS JSDoc writes `{string}`.

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

Provenance: Google Python Style Guide §3.8 — https://google.github.io/styleguide/pyguide.html. Format: `"""triple double quotes"""`. One-line summary ending with a period, phrased as a command ("Return ...", "Parse ..."). Multi-line: summary, blank line, then Args / Returns / Raises sections (Google style accepted). Types live in the signature, never the docstring.

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

Provenance: Rust API Guidelines, Documentation — https://rust-lang.github.io/api-guidelines/documentation.html. Format: `///` lines; the first line is the summary. Sections: `# Panics`, `# Errors`, `# Safety` (required on unsafe fns). Runnable doctests in ``` blocks.

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

Provenance: 阿里巴巴 Java 开发手册（八）注释规约 — https://github.com/alibaba/p3c. Format: `@param`, `@return`, `@throws`; the first sentence is the summary, `@param` descriptions start lowercase with no trailing period. KDoc omits `@return` when the function returns `Unit`.

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

Provenance: Go Doc Comments — https://go.dev/doc/comment. Format: `//` lines above the declaration, starting with the symbol name: `// ParseConfig parses ...`. Every exported name gets one; packages get `// Package name ...`. Booleans use "reports whether". No `@param` tags — parameters are explained in prose. Deprecations start a `Deprecated:` paragraph. Go 1.19+ formatting: headings (`// # Section`), doc links (`[os.File]`), reference links (`[Text]: URL`), lists (`//   - item`).

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
