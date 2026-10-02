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
    title: "A tutor that helps you write it yourself",
    lines: [
      { text: "rtfm is for when you want to learn how something works, not just get it" },
      { text: "done. Tell it what you're working on and it explains the next step, why" },
      { text: "it works, and where the docs cover it." },
      { text: "" },
      { text: "You write the code, at your own pace, with help whenever you need it." },
    ],
  },
  {
    title: "How it keeps the code in your hands",
    lines: [
      { text: "It describes each step in words instead of writing the code for you.", key: "✎" },
      { text: "It names the APIs to use and points at the lines in your own code.", key: "`" },
      { text: "It can read your project to help, but it doesn't edit your files.", key: "⊘" },
      { text: "" },
      { text: "Ask for the full solution and it'll help you build it one step at a time.", muted: true },
    ],
  },
  {
    title: "Two modes. Press tab to switch",
    lines: [
      { text: "Hints and next steps. Reads your code for context and", key: "mentor" },
      { text: "leaves room for you to work out the details.", key: "" },
      { text: "" },
      { text: "Looks over your changes and points to the lines worth", key: "review" },
      { text: "a second look, and why. The fix is still yours to write.", key: "" },
      { text: "" },
      { text: "The current mode is shown under the prompt.", muted: true },
    ],
  },
  {
    title: "Getting the most out of it",
    lines: [
      { text: "Share what you're working on and what you've tried so far.", key: "1" },
      { text: "Paste the exact error and it'll walk you through what it means.", key: "2" },
      { text: "If a hint isn't enough, just say so. The next one will be more specific.", key: "3" },
      { text: "Ask \"where is this documented?\" any time.", key: "4" },
      { text: "Run it in your editor app's terminal (e.g. VS Code) to cmd+click file:line links.", key: "5" },
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
