#!/usr/bin/env node
/**
 * visual-qa.mjs — glass lab screenshot harness
 *
 * Usage:
 *   node scripts/visual-qa.mjs               # starts Vite, shoots both themes
 *   node scripts/visual-qa.mjs --url http://localhost:5173
 *   node scripts/visual-qa.mjs --url http://localhost:5173 --routes /sign-in,/sign-up
 *
 * Output: docs/plans/liquid-glass-v2/shots/<git-sha>/lab-{dark,light}.png
 * Exit:   1 if contrast check fails (any cell < 4.5:1)
 */

import { chromium } from 'playwright-core';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const PLAN_DIR  = path.resolve(ROOT, '../docs/plans/liquid-glass-v2/shots');

// ─── Chrome resolution ────────────────────────────────────────────────────────
function findChrome() {
  if (process.env.CHROME_EXE && existsSync(process.env.CHROME_EXE)) {
    return process.env.CHROME_EXE;
  }
  const pwDir = path.join(homedir(), '.cache', 'ms-playwright');
  if (existsSync(pwDir)) {
    const found = readdirSync(pwDir)
      .filter(e => e.startsWith('chromium-'))
      .map(e => path.join(pwDir, e, 'chrome-linux64', 'chrome'))
      .filter(existsSync)
      .sort()
      .reverse();
    if (found.length) return found[0];
  }
  for (const p of ['/usr/bin/chromium', '/usr/bin/google-chrome']) {
    if (existsSync(p)) return p;
  }
  throw new Error('Chrome not found. Set CHROME_EXE env var or install playwright via `npx playwright install chromium`.');
}

// ─── Free port ────────────────────────────────────────────────────────────────
function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

// ─── Start Vite ───────────────────────────────────────────────────────────────
async function startVite(port) {
  const proc = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vite did not start within 30 s')), 30_000);
    const onData = (d) => {
      if (d.toString().includes('Local:') || d.toString().includes('localhost')) {
        clearTimeout(timer);
        proc.stdout.off('data', onData);
        resolve();
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', err => { clearTimeout(timer); reject(err); });
    proc.on('close', code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); });
  });
  return proc;
}

// ─── WCAG helpers (runs inside page.evaluate) ─────────────────────────────────
const CONTRAST_SCRIPT = /* js */ `
(function() {
  function parseRgba(str) {
    const m = str.match(/rgba?\\((\\d+\\.?\\d*)[,\\s]+(\\d+\\.?\\d*)[,\\s]+(\\d+\\.?\\d*)(?:[,\\s\\/]+(\\d+\\.?\\d*))?\\)/);
    if (!m) return { r: 0, g: 0, b: 0, a: 1 };
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
  }
  function compose(fg, bg) {
    return {
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    };
  }
  function lum({ r, g, b }) {
    return [r, g, b]
      .map(c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
      .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
  }
  function wcag(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  const htmlBg = parseRgba(getComputedStyle(document.documentElement).backgroundColor);

  return [...document.querySelectorAll('[data-contrast-cell]')].map(cell => {
    const label = cell.dataset.contrastCell;
    const textEl = cell.querySelector('[data-fg]');
    const rawText = parseRgba(getComputedStyle(textEl).color);
    const rawBg   = parseRgba(getComputedStyle(cell).backgroundColor);

    const bg   = rawBg.a < 1 ? compose(rawBg, htmlBg) : rawBg;
    const text = rawText.a < 1 ? compose(rawText, bg) : rawText;

    return { label, ratio: Math.round(wcag(text, bg) * 100) / 100 };
  });
})()
`;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const urlIdx = args.indexOf('--url');
  const extraRoutesIdx = args.indexOf('--routes');

  let baseUrl = urlIdx !== -1 ? args[urlIdx + 1] : null;
  const extraRoutes = extraRoutesIdx !== -1
    ? args[extraRoutesIdx + 1].split(',').map(r => r.trim())
    : [];

  let viteProc = null;
  if (!baseUrl) {
    const port = await freePort();
    console.log(`Starting Vite on port ${port}…`);
    viteProc = await startVite(port);
    baseUrl = `http://localhost:${port}`;
    console.log(`Vite ready at ${baseUrl}`);
  }

  const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  const outDir = path.join(PLAN_DIR, sha);
  mkdirSync(outDir, { recursive: true });

  const chrome = findChrome();
  console.log(`Using Chrome: ${chrome}`);

  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  const themes = ['dark', 'light'];
  const results = {};
  let contrastFailed = false;

  for (const theme of themes) {
    const themeParam = theme === 'dark' ? 'ultra-dark' : 'light';
    const url = `${baseUrl}/glass-lab?theme=${themeParam}`;
    console.log(`\nShooting ${theme} theme → ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(500); // let transitions settle

    const shotPath = path.join(outDir, `lab-${theme}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`  → ${shotPath}`);

    // Contrast check
    const cells = await page.evaluate(CONTRAST_SCRIPT);
    results[theme] = cells;
    console.log(`\n  Contrast (${theme}):`);
    for (const { label, ratio } of cells) {
      const pass = ratio >= 4.5;
      const mark = pass ? '✓' : '✗';
      console.log(`    ${mark} ${label.padEnd(20)} ${ratio.toFixed(2)} : 1${pass ? '' : '  ← FAIL'}`);
      if (!pass) contrastFailed = true;
    }
  }

  // Extra routes (informational screenshots only)
  for (const route of extraRoutes) {
    const url = `${baseUrl}${route}`;
    console.log(`\nExtra route: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    const name = route.replace(/\//g, '-').replace(/^-/, '');
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  }

  await browser.close();

  if (viteProc) {
    viteProc.kill('SIGTERM');
  }

  console.log(`\nShots in: ${outDir}`);
  if (contrastFailed) {
    console.error('\nContrast check FAILED — some cells < 4.5 : 1');
    process.exit(1);
  }
  console.log('\nContrast check passed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
