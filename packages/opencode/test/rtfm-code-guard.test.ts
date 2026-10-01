import { describe, expect, test } from "bun:test"
import { CodeGuard, FENCE_NOTICE, INLINE_NOTICE, inlineAllowed } from "../src/rtfm/code-guard"

function run(chunks: string[]) {
  const guard = new CodeGuard()
  return chunks.map((c) => guard.push(c)).join("") + guard.flush()
}

describe("CodeGuard", () => {
  test("passes prose through untouched", () => {
    expect(run(["Read the MDN page on ", "the Fetch API.\nThen try it.\n"])).toBe(
      "Read the MDN page on the Fetch API.\nThen try it.\n",
    )
  })

  test("withholds a fenced block, even when the fence is split across deltas", () => {
    const out = run(["Here:\n``", "`ts\nconst x = 1\nconsole.log(x)\n`", "``\nNow you.\n"])
    expect(out).toBe(`Here:\n${FENCE_NOTICE}\nNow you.\n`)
    expect(out).not.toContain("const")
  })

  test("withholds an unclosed fence through to the end of the part", () => {
    expect(run(["~~~\nrm -rf node_modules\nmore"])).toBe(`${FENCE_NOTICE}\n`)
  })

  test("a fence of the other kind does not close the block", () => {
    expect(run(["```\n~~~\nsecret()\n```\nafter\n"])).toBe(`${FENCE_NOTICE}\nafter\n`)
  })

  test("never releases a partial line", () => {
    const guard = new CodeGuard()
    expect(guard.push("Use `const a")).toBe("")
    expect(guard.push(" = 1` here\n")).toBe(`Use ${INLINE_NOTICE} here\n`)
  })

  test("keeps names, paths, commands and doc signatures", () => {
    for (const ok of [
      "useEffect",
      "src/index.ts",
      "npm i zod",
      "npm i --save-dev zod",
      "fetch(input, init?)",
      "Array.prototype.map(callbackFn, thisArg)",
      "Promise<Response>",
    ])
      expect(inlineAllowed(ok)).toBe(true)
  })

  test("withholds pasteable statements and expressions", () => {
    for (const bad of [
      "const x = 1",
      "x = 1",
      "items.map((i) => i.id)",
      "if (a) { b() }",
      "foo(); bar()",
      "a === b",
      "a == b",
      "a != b",
      "a && b",
      "return res",
      "new Map()",
      "i++",
    ])
      expect(inlineAllowed(bad)).toBe(false)
  })

  test("counts what it withheld", () => {
    const guard = new CodeGuard()
    guard.push("`x = 1` and ```\nfoo\n```\n")
    expect(guard.withheld).toBe(2)
  })
})
