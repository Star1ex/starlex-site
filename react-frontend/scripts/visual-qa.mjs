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
 * Exit:   1 if contrast check fails (any sampled cell < 4.5:1)
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

// ─── WCAG helpers ─────────────────────────────────────────────────────────────
function parseColor(str) {
  const rgb = str.match(/rgba?\(\s*([\d.]+)(?:,|\s)+([\d.]+)(?:,|\s)+([\d.]+)(?:(?:\s*\/\s*|,\s*)([\d.]+%?))?\s*\)/);
  if (rgb) {
    const alpha = rgb[4]?.endsWith('%') ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4] ?? 1);
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: alpha };
  }

  const srgb = str.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/);
  if (srgb) {
    const alpha = srgb[4]?.endsWith('%') ? Number(srgb[4].slice(0, -1)) / 100 : Number(srgb[4] ?? 1);
    return {
      r: Number(srgb[1]) * 255,
      g: Number(srgb[2]) * 255,
      b: Number(srgb[3]) * 255,
      a: alpha,
    };
  }

  throw new Error(`Unsupported color format in contrast check: ${str}`);
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
    .map(c => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}

function wcag(a, b) {
  const l1 = lum(a);
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function averagePngSwatch(page, png) {
  return page.evaluate(async (base64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${base64}`;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    const size = Math.max(8, Math.floor(Math.min(canvas.width, canvas.height) * 0.08));
    const startX = Math.min(canvas.width - size, Math.floor(canvas.width * 0.74));
    const startY = Math.min(canvas.height - size, Math.floor(canvas.height * 0.18));
    const { data } = ctx.getImageData(startX, startY, size, size);

    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    const count = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      a += data[i + 3] / 255;
    }

    return { r: r / count, g: g / count, b: b / count, a: a / count };
  }, png.toString('base64'));
}

async function runContrastCheck(page) {
  const targets = await page.locator('[data-contrast-cell]').evaluateAll(cells => cells.map(cell => {
    const textEl = cell.querySelector('[data-fg]') ?? cell;
    return {
      label: cell.getAttribute('data-contrast-cell'),
      textColor: getComputedStyle(textEl).color,
    };
  }));

  const results = [];
  for (let i = 0; i < targets.length; i += 1) {
    const png = await page.locator('[data-contrast-cell]').nth(i).screenshot();
    const bg = await averagePngSwatch(page, png);
    const rawText = parseColor(targets[i].textColor);
    const text = rawText.a < 1 ? compose(rawText, bg) : rawText;
    results.push({
      label: targets[i].label,
      ratio: Math.round(wcag(text, bg) * 100) / 100,
    });
  }

  return results;
}

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
    const cells = await runContrastCheck(page);
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
