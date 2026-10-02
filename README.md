<p align="center">
<pre align="center">
      ▄    ▄▀▀
█▀▀▀ ▀█▀▀ ▀█▀▀ █▀▄▀█
█     █    █   █ ▀ █
▀     ▀▀▀  ▀   ▀   ▀
</pre>
</p>

<p align="center"><b>A coding tutor for your terminal that helps you write the code yourself.</b></p>

rtfm is a terminal coding assistant built for learning. You tell it what you're working on, and it explains the next step, why it works, and links the exact section of the docs, or the one Stack Overflow answer you needed. You write the code.

It's for the times you want to understand what you're building: picking up programming, a new language or framework, a course project, or an unfamiliar codebase. AI that writes code for you is great when you just need something built. rtfm is for when you'd like to build it yourself, with a patient helper next to you.

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

## How it keeps the code in your hands

Asking a model not to write code works most of the time. rtfm makes sure of it, so you never get handed the answer by accident.

- **The output is filtered.** Every token the model streams passes through a filter before it is saved or drawn on screen. Fenced code blocks are withheld. Inline code survives only if it's a name, a path, a shell command or a signature quoted from the docs (`useEffect`, `fetch(resource, options)`, `npm i zod`). Anything you could paste as a statement (`x = 1`, `items.map((i) => i.id)`) is replaced with `✎ yours to write`. Text is checked a line at a time, so code doesn't flash up mid-stream either. See [`code-guard.ts`](packages/opencode/src/rtfm/code-guard.ts).
- **Its tools are read-only.** It can read your project, search it, fetch docs and search the web. It has no edit, write or patch tools, and its shell is limited to read-only git (`git diff`, `git log`, `git show`, `git status`, `git blame`). That setting is applied last, so it stays consistent whatever is in your config.

## Two modes, Tab to switch

| | `mentor` (default) | `review` |
|---|---|---|
| Reads your code | yes, for context | yes, plus your `git diff` |
| Feedback | concepts and next steps; room to find the spot yourself | `path:line` pointers, ranked by importance |
| Writes the fix | no, that's yours | no, that's yours |

## Install

```sh
npm i -g rtfm-cli            # or: bun add -g rtfm-cli
brew install varunbln/tap/rtfm
```

Then run `rtfm` in your project. Bring a key for any provider (`/connect` inside the app, or `rtfm providers login`): Anthropic, OpenAI, Google, OpenRouter, DeepSeek, Groq, a local Ollama, and the 75+ others opencode supports.

## How it helps

- **Next step, not the whole road.** One to three things you can do in the next ten minutes. Come back when they're done.
- **Always the source.** Every API it mentions comes with a link it has fetched and checked: the official docs section, the spec, the library's README, or the canonical Stack Overflow answer. If it couldn't verify a link, it tells you what to search for instead.
- **Hints get more specific when you need them.** Concept, then the API, then the doc section that matters, then a precise description in words of what the line should do.
- **Debugging together.** It explains what the error message means, what to log or where to set a breakpoint, and what each result would tell you.

## Config

rtfm reads `~/.config/rtfm/rtfm.json` and `rtfm.json` or `.rtfm/` in your project, using the same schema as opencode. It reads your `AGENTS.md`. Model, theme, keybinds and providers are all configurable. Edit tools and the shell lock are not.

## Credits

rtfm is a fork of [opencode](https://github.com/anomalyco/opencode) (MIT), which does the hard parts: the TUI, the provider layer and the session engine. rtfm adds the mentor agents, the streaming code filter and the lockdown. It is not affiliated with the opencode team; please file rtfm issues [here](https://github.com/varunbln/rtfm/issues). See [NOTICE](NOTICE).

MIT licensed.
