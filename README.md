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

- **It explains in words.** rtfm is instructed to describe each step rather than write it: it names the functions and APIs to use, quotes signatures from the docs, and points at lines in your own code, but leaves the code you'd paste for you to write. See the [mentor prompt](packages/opencode/src/agent/prompt/mentor.txt).
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

Then run `rtfm` in your project. It works best in the built-in terminal of your editor app of choice (e.g. VS Code): the file references rtfm gives you (`src/cart.ts:42`) become cmd/ctrl+click links that open that line in your editor. Bring a key for any provider (`/connect` inside the app, or `rtfm providers login`): Anthropic, OpenAI, Google, OpenRouter, DeepSeek, Groq, a local Ollama, and the 75+ others opencode supports.

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
