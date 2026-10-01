import { afterEach, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Cause, Effect, Exit, Layer } from "effect"
import path from "path"
import { disposeAllInstances, TestInstance } from "../fixture/fixture"
import { testEffect } from "../lib/effect"
import { Agent } from "../../src/agent/agent"
import { Auth } from "../../src/auth"
import { Config } from "../../src/config/config"
import { RuntimeFlags } from "../../src/effect/runtime-flags"
import { Global } from "@opencode-ai/core/global"
import { Permission } from "../../src/permission"
import { PermissionV1 } from "@opencode-ai/core/v1/permission"
import { Plugin } from "../../src/plugin"
import { Provider } from "../../src/provider/provider"
import { Skill } from "../../src/skill"
import { Truncate } from "../../src/tool/truncate"

const agentLayer = (flags: Partial<RuntimeFlags.Info> = {}) =>
  LayerNode.compile(
    LayerNode.group([Agent.node, Plugin.node, Provider.node, Auth.node, Config.node, Skill.node, RuntimeFlags.node]),
    [[RuntimeFlags.node, RuntimeFlags.layer(flags)]],
  )

const it = testEffect(agentLayer())

// Helper to evaluate permission for a tool with wildcard pattern
function load<A>(fn: (svc: Agent.Interface) => Effect.Effect<A>) {
  return Agent.Service.use(fn)
}

function bash(agent: Agent.Info | undefined, command: string) {
  return Permission.evaluate("bash", command, agent!.permission).action
}

afterEach(async () => {
  await disposeAllInstances()
})

it.instance("ships mentor and review as the only visible primary agents, mentor by default", () =>
  Effect.gen(function* () {
    const agents = yield* load((svc) => svc.list())
    const primary = agents.filter((a) => a.mode !== "subagent" && !a.hidden).map((a) => a.name)
    expect(primary.sort()).toEqual(["mentor", "review"])
    expect(yield* load((svc) => svc.defaultAgent())).toBe("mentor")
    expect(agents.map((a) => a.name)).not.toContain("build")
    expect(agents.map((a) => a.name)).not.toContain("general")
  }),
)

it.instance("mentor and review get different mode prompts on the same base", () =>
  Effect.gen(function* () {
    const mentor = yield* load((svc) => svc.get("mentor"))
    const review = yield* load((svc) => svc.get("review"))
    expect(mentor?.prompt).toContain("You never write code")
    expect(review?.prompt).toContain("You never write code")
    expect(mentor?.prompt).toContain("Review mode is OFF")
    expect(review?.prompt).toContain("Review mode is ON")
  }),
)

it.instance("no agent can edit, write, patch or run code-mode", () =>
  Effect.gen(function* () {
    const agents = yield* load((svc) => svc.list())
    for (const agent of agents) {
      const disabled = Permission.disabled(["edit", "write", "apply_patch", "execute"], agent.permission)
      expect(disabled.size).toBe(4)
    }
  }),
)

it.instance("shell is limited to read-only git", () =>
  Effect.gen(function* () {
    const review = yield* load((svc) => svc.get("review"))
    expect(bash(review, "git diff")).toBe("allow")
    expect(bash(review, "git diff --staged")).toBe("allow")
    expect(bash(review, "git status")).toBe("allow")
    expect(bash(review, "git log -5")).toBe("allow")
    expect(bash(review, "git diff > patch.ts")).toBe("deny")
    expect(bash(review, "git diff --output=x.ts")).toBe("deny")
    expect(bash(review, "git commit -am wip")).toBe("deny")
    expect(bash(review, "echo hi")).toBe("deny")
    expect(bash(review, "cat > a.ts")).toBe("deny")
    expect(bash(review, "rm -rf src")).toBe("deny")
  }),
)

it.instance(
  "user config cannot re-enable edits or add a code-writing agent",
  () =>
    Effect.gen(function* () {
      const agents = yield* load((svc) => svc.list())
      for (const agent of agents) {
        expect(Permission.disabled(["edit", "write"], agent.permission).size).toBe(2)
        expect(bash(agent, "npm test")).toBe("deny")
      }
      const sneaky = yield* load((svc) => svc.get("builder"))
      expect(Permission.evaluate("edit", "*", sneaky!.permission).action).toBe("deny")
    }),
  {
    config: {
      permission: { "*": "allow", edit: "allow", bash: "allow" },
      agent: {
        mentor: { permission: { edit: "allow", bash: { "*": "allow" } } },
        builder: { mode: "primary", permission: { "*": "allow" } },
      },
    },
  },
)

it.instance("reading .env still asks", () =>
  Effect.gen(function* () {
    const mentor = yield* load((svc) => svc.get("mentor"))
    expect(Permission.evaluate("read", "/repo/.env", mentor!.permission).action).toBe("ask")
    expect(Permission.evaluate("read", "/repo/src/a.ts", mentor!.permission).action).toBe("allow")
  }),
)
