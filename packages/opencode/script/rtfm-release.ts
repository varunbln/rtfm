#!/usr/bin/env bun
// rtfm release. Replaces upstream's publish.ts (which targets opencode's npm
// org, Docker registry, AUR and tap).
//
//   bun run script/rtfm-release.ts                 # build + stage everything in dist/
//   bun run script/rtfm-release.ts --publish       # also npm publish, GitHub release, tap
//
// Version comes from RTFM_VERSION (default: package.json "rtfmVersion").
import { $ } from "bun"
import { fileURLToPath } from "url"
import pkg from "../package.json"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

const NPM_NAME = "rtfm-cli"
const REPO = process.env.RTFM_REPO ?? "varunbln/rtfm"
const TAP = process.env.RTFM_TAP ?? "varunbln/homebrew-tap"
const version = process.env.RTFM_VERSION ?? (pkg as { rtfmVersion?: string }).rtfmVersion
if (!version) throw new Error("set RTFM_VERSION or package.json rtfmVersion")
const publish = process.argv.includes("--publish")

await $`rm -rf dist`
await $`bun run script/build.ts --skip-embed-web-ui ${process.argv.includes("--single") ? ["--single"] : []}`.env({
  ...process.env,
  OPENCODE_VERSION: version,
  OPENCODE_CHANNEL: "latest",
  OPENCODE_RELEASE: "1",
})

const binaries: Record<string, string> = {}
for (const file of new Bun.Glob("*/package.json").scanSync({ cwd: "./dist" })) {
  const meta = await Bun.file(`./dist/${file}`).json()
  binaries[meta.name] = meta.version
}
console.log("binaries", binaries)

// Main package: a postinstall copies the right platform binary into bin/rtfm.exe.
const main = `./dist/${NPM_NAME}`
await $`mkdir -p ${main}/bin`
await $`cp ./script/postinstall.mjs ${main}/postinstall.mjs`
await $`cp ../../LICENSE ${main}/LICENSE`
await $`cp ../../NOTICE ${main}/NOTICE`
await $`cp ../../README.md ${main}/README.md`
await Bun.write(
  `${main}/bin/rtfm.exe`,
  [
    `echo "Error: ${NPM_NAME}'s postinstall script was not run (--ignore-scripts, or pnpm)." >&2`,
    `echo "Fix: cd node_modules/${NPM_NAME} && node postinstall.mjs" >&2`,
    "exit 1",
    "",
  ].join("\n"),
)
await Bun.write(
  `${main}/package.json`,
  JSON.stringify(
    {
      name: NPM_NAME,
      version,
      description: "A coding tutor for your terminal: it explains the next step and links the docs, and you write the code.",
      license: "MIT",
      homepage: `https://github.com/${REPO}`,
      repository: { type: "git", url: `git+https://github.com/${REPO}.git` },
      keywords: ["cli", "ai", "mentor", "learning", "terminal", "opencode"],
      bin: { rtfm: "./bin/rtfm.exe" },
      scripts: { postinstall: "node ./postinstall.mjs" },
      os: ["darwin", "linux", "win32"],
      cpu: ["arm64", "x64"],
      optionalDependencies: binaries,
    },
    null,
    2,
  ),
)

// Archives for GitHub releases + Homebrew.
for (const name of Object.keys(binaries)) {
  if (name.includes("linux")) await $`tar -czf ../../${name}.tar.gz *`.cwd(`dist/${name}/bin`)
  else await $`zip -qr ../../${name}.zip *`.cwd(`dist/${name}/bin`)
}

const sha = async (file: string) => (await $`shasum -a 256 ${file}`.text()).split(" ")[0]
const asset = (file: string) => `https://github.com/${REPO}/releases/download/v${version}/${file}`
const formula = [
  "class Rtfm < Formula",
  '  desc "Coding tutor that helps you write the code yourself"',
  `  homepage "https://github.com/${REPO}"`,
  `  version "${version}"`,
  '  license "MIT"',
  "  on_macos do",
  "    on_arm do",
  `      url "${asset(`${NPM_NAME}-darwin-arm64.zip`)}"`,
  `      sha256 "${await sha(`dist/${NPM_NAME}-darwin-arm64.zip`)}"`,
  "    end",
  "    on_intel do",
  `      url "${asset(`${NPM_NAME}-darwin-x64.zip`)}"`,
  `      sha256 "${await sha(`dist/${NPM_NAME}-darwin-x64.zip`)}"`,
  "    end",
  "  end",
  "  on_linux do",
  "    on_arm do",
  `      url "${asset(`${NPM_NAME}-linux-arm64.tar.gz`)}"`,
  `      sha256 "${await sha(`dist/${NPM_NAME}-linux-arm64.tar.gz`)}"`,
  "    end",
  "    on_intel do",
  `      url "${asset(`${NPM_NAME}-linux-x64.tar.gz`)}"`,
  `      sha256 "${await sha(`dist/${NPM_NAME}-linux-x64.tar.gz`)}"`,
  "    end",
  "  end",
  "  def install",
  '    bin.install "rtfm"',
  "  end",
  "  test do",
  '    assert_match version.to_s, shell_output("#{bin}/rtfm --version")',
  "  end",
  "end",
  "",
].join("\n")
if (!process.argv.includes("--single")) await Bun.write("dist/rtfm.rb", formula)
console.log(`staged rtfm ${version} in dist/`)

if (!publish) process.exit(0)

const published = async (name: string) => (await $`npm view ${name}@${version} version`.nothrow().quiet()).exitCode === 0
for (const name of [...Object.keys(binaries), NPM_NAME]) {
  if (await published(name)) {
    console.log(`already published ${name}@${version}`)
    continue
  }
  await $`chmod -R 755 .`.cwd(`dist/${name}`)
  await $`npm publish --access public`.cwd(`dist/${name}`)
}

const archives = Array.from(new Bun.Glob("*.{zip,tar.gz}").scanSync({ cwd: "dist" })).map((f) => `dist/${f}`)
await $`gh release create v${version} ${archives} --repo ${REPO} --title ${`rtfm ${version}`} --generate-notes`

await $`rm -rf dist/tap && gh repo clone ${TAP} dist/tap`
await $`mkdir -p dist/tap/Formula && cp dist/rtfm.rb dist/tap/Formula/rtfm.rb`
await $`git add Formula/rtfm.rb && git commit -m ${`rtfm ${version}`} && git push`.cwd("dist/tap")
