// Install remocn components straight from the registry JSON (no shadcn CLI needed).
// Usage: node scripts/remocn-add.mjs caption-active-pop handwrite ink-arrow ...
// Writes each file to src/<target>, follows registryDependencies, then npm-installs
// the npm dependencies it collected. Re-running overwrites files (you own them).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

const BASE = "https://remocn.dev/r/";
const seen = new Set();
const npmDeps = new Set();

async function add(name) {
  name = name.replace(/^@remocn\//, "");
  if (seen.has(name)) return;
  seen.add(name);
  const res = await fetch(`${BASE}${name}.json`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const item = await res.json();
  for (const d of item.dependencies ?? []) npmDeps.add(d);
  for (const f of item.files ?? []) {
    const out = join("src", f.target ?? f.path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, f.content);
    console.log("wrote", out);
  }
  for (const dep of item.registryDependencies ?? []) await add(dep);
}

for (const n of process.argv.slice(2)) await add(n);
if (npmDeps.size) {
  const list = [...npmDeps].join(" ");
  console.log("npm install", list);
  execSync(`npm install --no-fund --no-audit ${list}`, { stdio: "inherit" });
}
