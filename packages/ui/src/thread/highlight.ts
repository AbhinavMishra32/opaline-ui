/**
 * Code colouring for the thread: the token shape every highlighter speaks, and
 * a small, dependency-free one used by default.
 *
 * The default classifies by shape — comments, strings, numbers, keywords, a
 * capitalised word as a type, a word before `(` as a call — which is right
 * often enough for the snippets a reply quotes, at zero bytes of grammar. A
 * real parse (Tree-sitter, Shiki…) plugs in through `highlighter` in the
 * thread config: any function returning tokens. Each slot is drawn with the
 * `op-tok-<slot>` class.
 */

export type TokenSlot = "comment" | "keyword" | "type" | "function" | "string" | "number" | "constant" | "variable" | "operator" | "punctuation"
export type Token = { text: string; slot: TokenSlot | null }

/**
 * Colours code. May answer at once or later (a grammar still loading); the
 * tokens joined back together must be exactly `code`. Return a single
 * uncoloured token for anything it cannot colour.
 */
export type Highlighter = (code: string, language: string) => Token[] | Promise<Token[]>

/** Colouring that was worked out for an earlier version of the same code. */
export type HighlightedCode = { code: string; tokens: Token[] }

/**
 * The tokens to draw for `code` while a fresh pass is still running.
 *
 * Code that is streaming in only ever grows at the end, so the colours worked
 * out for the earlier text still hold: keep them, and draw the new tail plain
 * until the next pass lands. That is what stops a block flashing grey on every
 * delta. Anything else (an edit in the middle) has no colours to keep.
 */
export function carryHighlight(previous: HighlightedCode | null, code: string): Token[] | null {
  if (!previous) return null
  if (previous.code === code) return previous.tokens
  if (!code.startsWith(previous.code)) return null
  const tail = code.slice(previous.code.length)
  return [...previous.tokens, { text: tail, slot: null }]
}

const KEYWORDS = new Set(
  (
    "abstract as async await break case catch class const continue def default defer del do elif else enum export extends " +
    "false final finally fn for from func function go if impl implements import in instanceof interface is lambda let loop " +
    "match mod module mut new nil none null of package pass private protected pub public raise readonly return satisfies " +
    "self static struct super switch this throw throws trait true try type typeof undefined unsafe use var void where while with yield"
  ).split(" "),
)

const HASH_COMMENT = new Set(["python", "py", "ruby", "rb", "bash", "sh", "shell", "zsh", "yaml", "yml", "toml", "r", "perl"])

const PATTERN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b|\b0x[\da-f]+\b)|([A-Za-z_$][\w$]*)|([{}()[\];,.:<>=+\-*/%!&|^~?@]+)/gi

export function tokenize(code: string, language = ""): Token[] {
  const lang = language.toLowerCase()
  const hashComments = HASH_COMMENT.has(lang)
  const tokens: Token[] = []
  let cursor = 0
  for (const match of code.matchAll(PATTERN)) {
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ text: code.slice(cursor, index), slot: null })
    const [text, slash, hash, string, number, word, punctuation] = match
    let slot: TokenSlot | null = null
    if (slash) slot = "comment"
    else if (hash) slot = hashComments ? "comment" : null
    else if (string) slot = "string"
    else if (number) slot = "number"
    else if (word) {
      if (KEYWORDS.has(word)) slot = "keyword"
      else if (code[index + word.length] === "(") slot = "function"
      else if (/^[A-Z][a-z0-9]/.test(word)) slot = "type"
    } else if (punctuation) slot = "punctuation"
    if (hash && !hashComments) {
      // Not a comment here (a CSS colour, a C directive): retokenise the rest of it.
      tokens.push({ text: "#", slot: "punctuation" })
      tokens.push(...tokenize(text.slice(1), language))
    } else {
      tokens.push({ text, slot })
    }
    cursor = index + text.length
  }
  if (cursor < code.length) tokens.push({ text: code.slice(cursor), slot: null })
  return tokens
}

/**
 * Split tokens into lines, carrying a token that spans a newline onto both.
 * A trailing newline (a closing fence's) is not an extra, empty line.
 */
export function tokenLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]]
  for (const token of tokens) {
    const pieces = token.text.split("\n")
    for (let index = 0; index < pieces.length; index += 1) {
      if (index > 0) lines.push([])
      const piece = pieces[index]!
      if (piece) lines[lines.length - 1]!.push({ text: piece, slot: token.slot })
    }
  }
  const last = lines[lines.length - 1]!
  if (lines.length > 1 && last.length === 0) lines.pop()
  return lines
}
