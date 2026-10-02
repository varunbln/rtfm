import { TextAttributes } from "@opentui/core"
import { createSignal, For, onMount, Show } from "solid-js"
import { useTheme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { useBindings } from "../keymap"

// rtfm's first-launch walkthrough. Shown once (kv "rtfm_onboarded"), and again
// on demand with /welcome.

export const ONBOARDED_KEY = "rtfm_onboarded"

type Line = { text: string; key?: string; muted?: boolean }
type Step = { title: string; lines: Line[] }

export const STEPS: Step[] = [
  {
    title: "rtfm never writes your code",
    lines: [
      { text: "You tell it what you're building. It tells you what to write next," },
      { text: "explains why, and links the exact section of the docs." },
      { text: "" },
      { text: "You do the typing. That's the whole point: you stay a programmer," },
      { text: "and you learn the thing instead of just shipping it." },
    ],
  },
  {
    title: "It can't, even if it tries",
    lines: [
      { text: "Code blocks are filtered out before they reach your screen.", key: "✎" },
      { text: "Inline code survives only as names, paths, commands and doc signatures.", key: "`" },
      { text: "It has no edit or write tools. Its shell is read-only git.", key: "⊘" },
      { text: "" },
      { text: "So \"just give me the code\" gets you the next step, not the answer.", muted: true },
    ],
  },
  {
    title: "Two modes. Press tab to switch",
    lines: [
      { text: "Hints and next steps. Reads your code for context, but", key: "mentor" },
      { text: "lets you find the exact spot yourself.", key: "" },
      { text: "" },
      { text: "Reads your git diff and points at file:line, ranked by", key: "review" },
      { text: "severity, with the why. Still never writes the fix.", key: "" },
      { text: "" },
      { text: "The current mode is shown under the prompt.", muted: true },
    ],
  },
  {
    title: "Getting good answers",
    lines: [
      { text: "Say what you're building and what you've tried.", key: "1" },
      { text: "Paste the exact error. It'll explain what it literally says.", key: "2" },
      { text: "Stuck after a hint? Say so. The next one gets more specific.", key: "3" },
      { text: "Ask \"where is this documented?\" for the source.", key: "4" },
      { text: "" },
      { text: "/connect adds a model key  ·  /welcome shows this again", muted: true },
    ],
  },
]

export function DialogOnboarding(props: { onDone?: () => void }) {
  const dialog = useDialog()
  const { theme } = useTheme()
  const [index, setIndex] = createSignal(0)
  const last = () => index() === STEPS.length - 1
  const step = () => STEPS[index()]

  onMount(() => dialog.setSize("large"))

  const finish = () => {
    dialog.clear()
    props.onDone?.()
  }
  const next = () => (last() ? finish() : setIndex(index() + 1))
  const back = () => setIndex(Math.max(0, index() - 1))

  useBindings(() => ({
    bindings: [
      { key: "return", desc: "Next", group: "Welcome", cmd: next },
      { key: "right", desc: "Next", group: "Welcome", cmd: next },
      { key: "left", desc: "Back", group: "Welcome", cmd: back },
    ],
  }))

  const keyWidth = () => Math.max(...step().lines.map((line) => line.key?.length ?? 0))

  return (
    <box paddingLeft={3} paddingRight={3} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.textMuted}>
          welcome to rtfm · {index() + 1}/{STEPS.length}
        </text>
        <text fg={theme.textMuted} onMouseUp={finish}>
          esc to skip
        </text>
      </box>
      <text attributes={TextAttributes.BOLD} fg={theme.text}>
        {step().title}
      </text>
      <box>
        <For each={step().lines}>
          {(line) => (
            <box flexDirection="row" gap={keyWidth() ? 2 : 0}>
              <Show when={keyWidth() > 0}>
                <text flexShrink={0} width={keyWidth()} fg={theme.primary} attributes={TextAttributes.BOLD}>
                  {line.key ?? ""}
                </text>
              </Show>
              <text fg={line.muted ? theme.textMuted : theme.text} wrapMode="word">
                {line.text || " "}
              </text>
            </box>
          )}
        </For>
      </box>
      <box flexDirection="row" justifyContent="space-between" paddingBottom={1}>
        <box flexDirection="row" gap={1}>
          <For each={STEPS}>
            {(_, i) => <text fg={i() === index() ? theme.primary : theme.textMuted}>{i() === index() ? "●" : "○"}</text>}
          </For>
        </box>
        <box flexDirection="row" gap={2}>
          <Show when={index() > 0}>
            <text fg={theme.textMuted} onMouseUp={back}>
              ← back
            </text>
          </Show>
          <box paddingLeft={2} paddingRight={2} backgroundColor={theme.primary} onMouseUp={next}>
            <text fg={theme.selectedListItemText}>{last() ? "start  ↵" : "next  ↵"}</text>
          </box>
        </box>
      </box>
    </box>
  )
}
