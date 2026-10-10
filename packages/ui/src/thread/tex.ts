/**
 * The TeX a model writes in prose, in notation the thread can draw without a
 * maths engine. `\(O(n^2)\)` becomes `O(n²)`; a command this does not know is
 * left as its own name rather than dropped.
 */

/** Commands that have a character. Everything else keeps its name. */
const SYMBOL: Record<string, string> = {
  cdot: "·", times: "×", div: "÷", pm: "±",
  le: "≤", leq: "≤", ge: "≥", geq: "≥", neq: "≠", approx: "≈", sim: "~",
  ldots: "…", dots: "…", cdots: "…", infty: "∞", sqrt: "√",
  alpha: "α", beta: "β", theta: "θ", lambda: "λ", mu: "μ", pi: "π", sigma: "σ", epsilon: "ε",
  Theta: "Θ", Omega: "Ω", omega: "ω", Delta: "Δ", Sigma: "Σ",
  in: "∈", subset: "⊂", cup: "∪", cap: "∩", to: "→", rightarrow: "→", leftarrow: "←", implies: "⇒",
  lfloor: "⌊", rfloor: "⌋", lceil: "⌈", rceil: "⌉", quad: " ", qquad: "  ",
}

const SUPERSCRIPT: Record<string, string> = {
  0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹",
  "+": "⁺", "-": "⁻", n: "ⁿ", i: "ⁱ",
}

const SUBSCRIPT: Record<string, string> = {
  0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉",
  "+": "₊", "-": "₋", i: "ᵢ", j: "ⱼ", k: "ₖ", n: "ₙ",
}

/** `^2` and `^{10}` become real superscripts when every character has one;
 *  `O(n^k)` keeps its caret rather than losing the exponent to a lookup miss. */
const script = (table: Record<string, string>, mark: string) => (text: string) =>
  text.replace(new RegExp(`\\${mark}(?:\\{([^{}]*)\\}|(\\S))`, "g"), (whole, braced?: string, single?: string) => {
    const mapped = [...(braced ?? single ?? "")].map((character) => table[character])
    return mapped.length > 0 && mapped.every(Boolean) ? mapped.join("") : whole
  })

const superscripts = script(SUPERSCRIPT, "^")
const subscripts = script(SUBSCRIPT, "_")

function body(source: string): string {
  const named = source
    .replace(/\\(?:text|mathrm|mathit|mathbf|operatorname)\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\([a-zA-Z]+)/g, (_, name: string) => SYMBOL[name] ?? name)
    .replace(/\\([^a-zA-Z])/g, "$1")
  return subscripts(superscripts(named)).replace(/[{}]/g, "").replace(/\s+/g, " ").trim()
}

/** Unwraps `\( … \)` and `\[ … \]`. Text with no backslash passes untouched. */
export function plainMath(text: string): string {
  if (!text.includes("\\")) return text
  return text
    .replace(/\\\((.+?)\\\)/gs, (_, inner: string) => body(inner))
    .replace(/\\\[(.+?)\\\]/gs, (_, inner: string) => body(inner))
}
