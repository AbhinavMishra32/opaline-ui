import * as React from "react"
import { Check, Code2, Copy } from "lucide-react"
import { cn } from "../lib/utils"
import { httpsImages, useThreadConfig } from "./config"
import { CodeLines, InlineTokens } from "./colorized"
import { parse, type Block } from "./markdownBlocks"
import { parseReference, ReferenceLink } from "./references"
import { plainMath } from "./tex"

/**
 * The thread's markdown: the subset a model actually writes, drawn at the
 * thread's one size with the `op-prose` scale.
 *
 * Parsed per block and memoised per block, so a streaming reply re-renders
 * only its last paragraph per token rather than the whole answer.
 */
export function Markdown({
  source,
  className,
  streaming = false,
  images,
}: {
  source: string
  className?: string
  streaming?: boolean
  /** Which images may load (see `ThreadConfig.images`). Overrides the thread's policy. */
  images?: (src: string) => string | null
}) {
  const blocks = React.useMemo(() => parse(source), [source])
  const config = useThreadConfig()
  const policy = images ?? config.images ?? httpsImages
  return (
    <ImagePolicy.Provider value={policy}>
      <div className={cn("op-prose min-w-0", className)} data-streaming={streaming || undefined}>
        {blocks.map((block, index) => (
          <MarkdownBlock block={block} key={index} />
        ))}
      </div>
    </ImagePolicy.Provider>
  )
}

const ImagePolicy = React.createContext<(src: string) => string | null>(httpsImages)

const MarkdownBlock = React.memo(
  function MarkdownBlock({ block }: { block: Block }) {
    const { renderCodeBlock } = useThreadConfig()
    switch (block.kind) {
      case "code": {
        const custom = renderCodeBlock?.({ code: block.body, language: block.language })
        if (custom !== undefined) return <>{custom}</>
        return <CodeBlock code={block.body} language={block.language} />
      }
      case "heading": {
        /* A real heading element: the scale keys off the tag. */
        const Tag = `h${Math.min(6, Math.max(1, block.level))}` as "h2"
        return <Tag>{inline(block.body)}</Tag>
      }
      case "list": {
        const Tag = block.ordered ? "ol" : "ul"
        return (
          <Tag>
            {block.items.map((item, index) => (
              <li key={index}>{inline(item)}</li>
            ))}
          </Tag>
        )
      }
      case "quote":
        return <blockquote>{inline(block.body)}</blockquote>
      case "table":
        /* Scrolls inside its own box rather than widening the column. */
        return (
          <div className="op-scroll -mx-1 my-2 overflow-x-auto px-1">
            <table className="w-full min-w-max border-collapse text-left">
              <thead>
                <tr>
                  {block.header.map((cell, index) => (
                    <th className="whitespace-nowrap" key={index} scope="col">
                      {inline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, index) => (
                      <td className={cn("align-top", rowIndex === block.rows.length - 1 && "border-b-0")} key={index}>
                        {inline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case "rule":
        return <hr />
      case "image":
        return <MarkdownImage alt={block.alt} src={block.src} />
      default:
        return <p>{inline(block.body)}</p>
    }
  },
  (previous, next) => JSON.stringify(previous.block) === JSON.stringify(next.block),
)

/* Its own size up to the column, never stretched. No referrer, so the host
   serving the image is not told which app is showing it. A source the policy
   refuses prints as the markdown it was. */
function MarkdownImage({ alt, src }: { alt: string; src: string }) {
  const resolved = React.useContext(ImagePolicy)(src)
  if (!resolved) return <p>{inline(`![${alt}](${src})`)}</p>
  return <img alt={alt} className="my-3 block h-auto max-w-full rounded-md" decoding="async" loading="lazy" referrerPolicy="no-referrer" src={resolved} />
}

/* References first, so `[[file:a_b.c|x]]` is not torn apart by the emphasis
   rule looking at its underscores; then `[label](url)` before emphasis, so a
   title with an asterisk survives; bare URLs last. Only http(s), mailto and
   relative links are made live — a `javascript:` href stays text. */
const INLINE =
  /(\[\[[a-z][\w-]*:[^\]]+\]\])|(\[[^\]\n]*\]\((?:https?:\/\/|mailto:|\/|\.{1,2}\/|#)[^\s)]*\))|(`+)([^`]+?)\3|\*\*([^*]+?)\*\*|__([^_]+?)__|\*([^*\s][^*]*?)\*|(?<![\w])_([^_\s][^_]*?)_(?![\w])|~~([^~]+?)~~|(https?:\/\/[^\s<>()[\]"']+[^\s<>()[\]"'.,;:!?])/g

/**
 * Inline spans: references, links, code, bold, italic, strike and bare URLs.
 * TeX in plain prose (`\(O(n^2)\)`) is drawn as characters; a backslash inside
 * a code span stays a backslash.
 */
export function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0
    if (index > cursor) nodes.push(plainMath(text.slice(cursor, index)))
    const [whole, ref, link, , code, bold, boldAlt, em, emAlt, strike, bare] = match
    const reference = ref ? parseReference(ref) : null
    if (reference) nodes.push(<ReferenceLink key={key++} {...reference} />)
    else if (link) {
      const split = link.indexOf("](")
      const href = link.slice(split + 2, -1)
      nodes.push(<Hyperlink href={href} key={key++} label={link.slice(1, split) || linkText(href)} />)
    } else if (code !== undefined) nodes.push(<InlineCode body={code} key={key++} />)
    else if (bold ?? boldAlt) nodes.push(<strong key={key++}>{inline(bold ?? boldAlt!)}</strong>)
    else if (em ?? emAlt) nodes.push(<em key={key++}>{inline(em ?? emAlt!)}</em>)
    else if (strike) nodes.push(<del key={key++}>{inline(strike)}</del>)
    else if (bare) nodes.push(<Hyperlink href={bare} key={key++} label={linkText(bare)} />)
    else nodes.push(whole)
    cursor = index + whole.length
  }
  if (cursor < text.length) nodes.push(plainMath(text.slice(cursor)))
  return nodes
}

/** `inline` as a component, for agent prose outside a `Markdown` block. */
export function Inline({ text }: { text: string }) {
  return <>{inline(text)}</>
}

/** A URL as a person would read it: host and path, no scheme, no query. */
export function linkText(href: string): string {
  try {
    const url = new URL(href)
    const shown = `${url.host.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`
    return shown.length > 48 ? `${shown.slice(0, 47)}…` : shown
  } catch {
    return href
  }
}

/**
 * A web link in agent prose. A button through `onOpenUrl` when the host
 * handles navigation itself (a desktop shell that refuses to navigate); an
 * anchor that opens a new tab otherwise.
 */
function Hyperlink({ href, label }: { href: string; label: string }) {
  const { onOpenUrl } = useThreadConfig()
  const className =
    "cursor-pointer rounded-[3px] text-foreground underline decoration-foreground/30 decoration-1 underline-offset-[3px] transition-colors outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
  if (onOpenUrl) {
    return (
      <button className={className} onClick={() => onOpenUrl(href)} title={href} type="button">
        {label}
      </button>
    )
  }
  return (
    <a className={cn(className, "!text-foreground hover:!underline")} href={href} rel="noreferrer" target="_blank" title={href}>
      {label}
    </a>
  )
}

/** Inline code, coloured as `codeLanguage` when the thread names one. */
function InlineCode({ body }: { body: string }) {
  const { codeLanguage } = useThreadConfig()
  if (!codeLanguage) return <code>{body}</code>
  return (
    <code>
      <InlineTokens code={body} language={codeLanguage} />
    </code>
  )
}

function useCopy(text: string) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle")
  React.useEffect(() => {
    if (state !== "copied") return
    const timer = window.setTimeout(() => setState("idle"), 2000)
    return () => window.clearTimeout(timer)
  }, [state])
  const copy = () => {
    const write = navigator.clipboard?.writeText(text)
    if (!write) return setState("failed")
    void write.then(
      () => setState("copied"),
      () => setState("failed"),
    )
  }
  return [state, copy] as const
}

/**
 * A fenced block: language and copy in a quiet header, highlighted body, one
 * material with every other block in the thread.
 */
export function CodeBlock({
  code,
  language = "text",
  title,
  lineNumbers = true,
  className,
}: {
  code: string
  language?: string
  /** Shown in the header instead of the language — a file name, usually. */
  title?: React.ReactNode
  /** Default true, as Spar draws them. */
  lineNumbers?: boolean
  className?: string
}) {
  const config = useThreadConfig()
  const [state, copy] = useCopy(code)
  const named = language && language !== "text" ? language : ""

  return (
    <div className={cn("op-code op-block", className)} data-line-numbers={lineNumbers}>
      <div className="op-code-header">
        <span className="op-code-language" title={named || "Plain text"}>
          <Code2 aria-hidden className="size-3.5 shrink-0" />
          {title ?? (named ? <span className="min-w-0 truncate">{named}</span> : null)}
        </span>
        <div className="op-code-actions flex items-center">
          <button
            aria-label={state === "copied" ? config.labels.copied : config.labels.copy}
            className="grid shrink-0 place-items-center transition-colors hover:bg-accent hover:text-foreground"
            onClick={copy}
            title={state === "failed" ? config.labels.copyFailed : state === "copied" ? config.labels.copied : config.labels.copy}
            type="button"
          >
            {state === "copied" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>
      <span className="sr-only" role="status">
        {state === "failed" ? config.labels.copyFailed : state === "copied" ? config.labels.copied : ""}
      </span>
      <CodeBody code={code} language={language} />
    </div>
  )
}

/**
 * A block's body: the host's own renderer when it gave one (`highlight`),
 * the thread's coloured lines otherwise.
 */
function CodeBody({ code, language, follow = false, className }: { code: string; language: string; follow?: boolean; className?: string }) {
  const config = useThreadConfig()
  if (config.highlight) {
    return (
      <pre className={cn("op-code-body op-scroll", className)} tabIndex={0}>
        {config.highlight(code, language)}
      </pre>
    )
  }
  return <CodeLines className={className} code={code} follow={follow} language={language} />
}

/**
 * A file, in the thread's own code block: its path in the header, line
 * numbers, and — while `live` — a body that follows the newest line.
 */
export function FileCodeBlock({
  path,
  code,
  language = "text",
  live = false,
  className,
}: {
  path: string
  code: string
  language?: string
  live?: boolean
  className?: string
}) {
  const lines = code.replace(/\n$/, "").split("\n").length
  return (
    <div className={cn("op-code op-block !my-1", className)} data-line-numbers>
      <div className="op-code-header !h-7 !py-1">
        <span className="op-code-language">
          <Code2 aria-hidden className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate text-thread-tool">{path}</span>
        </span>
        <span className={cn("shrink-0 pr-1 text-thread-tool tabular-nums", live && "op-shimmer")}>{live ? "writing" : `${lines} lines`}</span>
      </div>
      <CodeBody className={live ? "!max-h-[15rem]" : "!max-h-[20rem]"} code={code} follow={live} language={language} />
    </div>
  )
}
