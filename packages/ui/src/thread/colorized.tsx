/**
 * Coloured code inside the thread: the body of a fenced block, a file being
 * written, an inline code span.
 *
 * Colours come from the thread's `highlighter` when the host gives one (the
 * Tree-sitter one, say) and from the built-in `tokenize` otherwise. A
 * highlighter may answer later than the render — a grammar still loading — so
 * the plain text draws first and the colours land when they are ready. While
 * code streams in, the colours already worked out are kept and only the new
 * tail is plain (`carryHighlight`), so a block being written never flashes grey.
 */
import * as React from "react"
import { cn } from "../lib/utils"
import { useThreadConfig } from "./config"
import { carryHighlight, tokenize, tokenLines, type HighlightedCode, type Token } from "./highlight"

/**
 * The tokens to draw for `code`, kept up to date as it changes. Never empty:
 * before any colouring is known it is the code as one plain token.
 */
export function useCodeTokens(code: string, language: string): Token[] {
  const { highlighter } = useThreadConfig()
  const [highlighted, setHighlighted] = React.useState<HighlightedCode | null>(null)

  React.useEffect(() => {
    if (!highlighter) return
    let current = true
    const run = async () => {
      try {
        const tokens = await highlighter(code, language)
        if (current) setHighlighted({ code, tokens })
      } catch {
        /* A highlighter that fails leaves the code plain. Plain code is still readable. */
      }
    }
    void run()
    return () => {
      current = false
    }
  }, [code, language, highlighter])

  const builtIn = React.useMemo(() => (highlighter ? null : tokenize(code, language)), [code, language, highlighter])
  if (builtIn) return builtIn

  const carried = carryHighlight(highlighted, code)
  if (carried) return carried
  return [{ text: code, slot: null }]
}

/** One token, coloured by its slot's `op-tok-*` class. */
function TokenText({ token }: { token: Token }) {
  if (!token.slot) return <>{token.text}</>
  return <span className={`op-tok-${token.slot}`}>{token.text}</span>
}

/**
 * A block's body: one span per line (numbered by CSS when the block asks for
 * it). With `follow`, the box glides to the newest line as the code grows, so
 * the eye can stay on the line being written instead of refinding it.
 */
export function CodeLines({ code, language, follow = false, className }: { code: string; language: string; follow?: boolean; className?: string }) {
  const { reduced } = useThreadConfig()
  const pre = React.useRef<HTMLPreElement>(null)
  const tokens = useCodeTokens(code, language)
  const lines = React.useMemo(() => tokenLines(tokens), [tokens])

  React.useLayoutEffect(() => {
    const node = pre.current
    if (!follow || !node) return
    const behavior = reduced ? "auto" : "smooth"
    node.scrollTo({ top: node.scrollHeight, behavior })
  }, [code, follow, reduced])

  return (
    <pre aria-label={`${language || "Plain text"} code`} className={cn("op-code-body op-scroll", className)} ref={pre} tabIndex={0}>
      <code>
        {lines.map((line, lineIndex) => (
          <span className="op-code-line" key={lineIndex}>
            {line.map((token, tokenIndex) => (
              <TokenText key={tokenIndex} token={token} />
            ))}
            {line.length === 0 ? "​" : null}
          </span>
        ))}
      </code>
    </pre>
  )
}

/** An inline code span, coloured as `language`. */
export function InlineTokens({ code, language }: { code: string; language: string }) {
  const tokens = useCodeTokens(code, language)
  return (
    <>
      {tokens.map((token, index) => (
        <TokenText key={index} token={token} />
      ))}
    </>
  )
}
