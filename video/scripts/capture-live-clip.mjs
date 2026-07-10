/*
  Records the live-proof clip against production: a full round driven in a
  real browser, ending on the matcher's active-contracts query in raw JSON.
  The tail of this recording (matcher view) is what the video embeds as
  on-chain proof. Output: public/clips/live-raw.webm + trimmed live-proof.mp4.

  Run: node scripts/capture-live-clip.mjs
*/

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/home/allen/.nvm/versions/node/v23.11.0/lib/node_modules/playwright/index.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLIPS = path.resolve(HERE, "..", "public", "clips");
const RAW_DIR = path.join(CLIPS, "raw");
mkdirSync(RAW_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: RAW_DIR, size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();

const log = (m) => console.log(`[clip] ${m}`);

log("loading /demo");
await page.goto("https://hushrenewal.allensaji.dev/demo", {
  waitUntil: "networkidle",
  timeout: 60000,
});

log("opening round");
await page.getByRole("button", { name: "Open round" }).click();
await page.getByRole("button", { name: "Run the negotiation" }).waitFor({
  timeout: 30000,
});

log("running negotiation (waits for both seals)");
await page.getByRole("button", { name: "Run the negotiation" }).click();
await page
  .getByRole("button", { name: "Clear round" })
  .waitFor({ timeout: 180000 });

log("clearing");
await page.getByRole("button", { name: "Clear round" }).click();
await page.waitForTimeout(4000);

log("matcher raw projection");
await page.getByRole("button", { name: "Matcher", exact: true }).click();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: "raw", exact: true }).click();
await page.waitForTimeout(1000);
// Frame the projection band: request line + privacy banner + raw JSON.
await page.evaluate(() => {
  const pre = document.querySelector("pre");
  pre?.scrollIntoView({ block: "center", behavior: "instant" });
  window.scrollBy(0, -120);
});
await page.waitForTimeout(8000);

await context.close();
await browser.close();

// Playwright names the webm randomly; grab the newest.
const webm = readdirSync(RAW_DIR)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => path.join(RAW_DIR, f))
  .sort()
  .pop();
const rawOut = path.join(CLIPS, "live-raw.webm");
renameSync(webm, rawOut);
log(`raw recording: ${rawOut}`);

// Trim: keep the last 14s (matcher raw JSON segment) as H.264 for OffthreadVideo.
const finalOut = path.join(CLIPS, "live-proof.mp4");
execFileSync("ffmpeg", [
  "-y",
  "-sseof",
  "-14",
  "-i",
  rawOut,
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-an",
  finalOut,
]);
log(`trimmed clip: ${finalOut}`);
