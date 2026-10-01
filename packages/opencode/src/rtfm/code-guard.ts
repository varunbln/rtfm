// rtfm's hard guarantee: the model never puts code on your screen.
//
// The mentor prompt asks for this, but prompts are suggestions. CodeGuard sits
// on the streaming path (session/processor.ts) and rewrites every text and
// reasoning delta before it is persisted or rendered, so a leaked snippet is
// never shown, not even for the few hundred milliseconds before a reply ends.
//
// Policy ("docs quotes OK"):
//   - fenced code blocks (``` / ~~~) are always withheld, whatever is inside
//   - inline `code` survives only if it is a name, a path, a shell command, or
//     a call signature quoted from docs. Anything that looks like a statement
//     or an expression you could paste (assignment, braces, semicolons,
//     arrows, operators) is withheld.
//
// Text is released a line at a time: a partial line is held until its newline
// arrives (or the part ends) so a fence or backtick span split across deltas
// is classified as a whole.

export const FENCE_NOTICE = "> ✎ rtfm withheld a code block. That part is yours to write."
export const INLINE_NOTICE = "`✎ yours to write`"

const FENCE = /^ {0,3}(`{3,}|~{3,})/
const INLINE_SPAN = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g
// A statement or expression someone could paste. Signatures like
// `fetch(input, init?)` or `Array.prototype.map(callbackFn, thisArg)` contain
// none of these.
const CODE_TOKENS = /[;{}]|=>|[^=!<>]=[^=]|[!=]=|\+\+|&&|\|\||\breturn\b|\bconst\b|\blet\b|\bvar\b|\bimport\b|\bdef\b|\bclass\b|\bnew\b/
const MAX_INLINE = 80

export function inlineAllowed(code: string) {
  const body = code.trim()
  if (!body) return true
  if (body.length > MAX_INLINE) return false
  if (body.includes("\n")) return false
  return !CODE_TOKENS.test(body)
}

export class CodeGuard {
  private pending = ""
  private fence: string | undefined
  withheld = 0

  push(delta: string) {
    this.pending += delta
    const cut = this.pending.lastIndexOf("\n")
    if (cut === -1) return ""
    const ready = this.pending.slice(0, cut + 1)
    this.pending = this.pending.slice(cut + 1)
    return ready
      .split("\n")
      .slice(0, -1)
      .map((line) => this.line(line))
      .filter((line) => line !== undefined)
      .map((line) => line + "\n")
      .join("")
  }

  flush() {
    const rest = this.pending
    this.pending = ""
    if (!rest) return ""
    return this.line(rest) ?? ""
  }

  private line(line: string): string | undefined {
    const fence = FENCE.exec(line)
    if (this.fence) {
      if (fence && fence[1][0] === this.fence[0] && fence[1].length >= this.fence.length && !line.slice(fence[0].length).trim())
        this.fence = undefined
      return undefined
    }
    if (fence) {
      this.fence = fence[1]
      this.withheld++
      return FENCE_NOTICE
    }
    return line.replace(INLINE_SPAN, (span, _ticks, code) => {
      if (inlineAllowed(code)) return span
      this.withheld++
      return INLINE_NOTICE
    })
  }
}
