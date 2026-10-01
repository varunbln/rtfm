<p align="center">
<pre align="center">
      ▄    ▄▀▀
█▀▀▀ ▀█▀▀ ▀█▀▀ █▀▄▀█
█     █    █   █ ▀ █
▀     ▀▀▀  ▀   ▀   ▀
</pre>
</p>

<p align="center"><b>A coding agent that refuses to write your code.</b></p>

rtfm is a terminal coding agent with one rule: **it never writes a line of code.** You tell it what you're building. It tells you what to write next, explains why, and links the exact section of the docs, or the one Stack Overflow answer you needed. You type the code.

It's for programmers who want to stay programmers. You get the speed of having a senior engineer next to you, and you keep the part where you actually learn the thing.

```
you   › how do I cancel an in-flight fetch when the component unmounts?

rtfm  › You want an AbortController. Three steps:
        1. Create one per request, inside the effect, and pass its `signal` in
           the options you give `fetch(resource, options)`.
           MDN: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
        2. Return a cleanup function from the effect that calls `abort()` on it.
           React docs, "Fetching data": https://react.dev/reference/react/useEffect#fetching-data-with-effects
        3. An aborted fetch rejects with an AbortError. Decide whether your
           catch should ignore that one specifically; check its `name`.
        Trap: if you create the controller outside the effect, every render
        shares one, and the second request is born already aborted.
```

## It actually can't write code

Telling a model "don't write code" is a suggestion. rtfm enforces it.

- **The output is filtered.** Every token the model streams passes through a filter before it is saved or drawn on screen. Fenced code blocks are withheld. Inline code survives only if it's a name, a path, a shell command or a signature quoted from the docs (`useEffect`, `fetch(resource, options)`, `npm i zod`). Anything you could paste as a statement (`x = 1`, `items.map((i) => i.id)`) is replaced with `✎ yours to write`. Code is held back a line at a time, so it never shows up even briefly mid-stream. See [`code-guard.ts`](packages/opencode/src/rtfm/code-guard.ts).
- **Its tools are read-only.** It can read your project, search it, fetch docs and search the web. It has no edit, write or patch tools, and its shell is limited to read-only git (`git diff`, `git log`, `git show`, `git status`, `git blame`). That lock is applied last, so a config file can't turn editing back on.

## Two modes, Tab to switch

| | `mentor` (default) | `review` |
|---|---|---|
| Reads your code | yes, for context | yes, plus your `git diff` |
| Feedback | concepts and next steps; you find the exact spot | `path:line` pointers, ranked by severity |
| Writes the fix | never | never |

## Install

```sh
npm i -g rtfm-cli            # or: bun add -g rtfm-cli
brew install varunbln/tap/rtfm
```

Then run `rtfm` in your project. Bring a key for any provider (`/connect` inside the app, or `rtfm providers login`): Anthropic, OpenAI, Google, OpenRouter, DeepSeek, Groq, a local Ollama, and the 75+ others opencode supports.

## How it helps

- **Next step, not the whole road.** One to three things you can do in the next ten minutes. Come back when they're done.
- **Always the source.** Every API it mentions comes with a link it has fetched and checked: the official docs section, the spec, the library's README, or the canonical Stack Overflow answer. If it couldn't verify a link, it tells you what to search for instead.
- **Hints get more specific.** Concept, then the API, then the doc section that matters, then a precise description in words of what the line must do. It never crosses into writing the line.
- **Debugging is shared detective work.** It tells you what to log, where to break and what each result would mean, and what the error message is literally saying.

## Config

rtfm reads `~/.config/rtfm/rtfm.json` and `rtfm.json` or `.rtfm/` in your project, using the same schema as opencode. It reads your `AGENTS.md`. Model, theme, keybinds and providers are all configurable. Edit tools and the shell lock are not.

## Credits

rtfm is a fork of [opencode](https://github.com/anomalyco/opencode) (MIT), which does the hard parts: the TUI, the provider layer and the session engine. rtfm adds the mentor agents, the streaming code filter and the lockdown. It is not affiliated with the opencode team; please file rtfm issues [here](https://github.com/varunbln/rtfm/issues). See [NOTICE](NOTICE).

MIT licensed.
