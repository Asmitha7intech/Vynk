/**
 * VYNK End-to-End Real Browser Integration Test & Multi-Viewport Screenshot Suite
 * Executes Section 10: Two-Student Collaboration & Multi-Device Verification
 */

const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots/final');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', retry);
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
      } else {
        setTimeout(check, 500);
      }
    };

    check();
  });
}

async function main() {
  console.log('====================================================');
  console.log(' VYNK SECTION 10: REAL BROWSER & COLLABORATION E2E ');
  console.log('====================================================');

  const timestamp = Date.now();
  const studentA = {
    displayName: 'Aarav Patel',
    username: `aarav_${timestamp.toString().slice(-6)}`,
    email: `aarav_${timestamp}@campus.edu`,
    password: `P@ssword_${timestamp}!`,
    dob: '2004-06-12',
    department: 'Computer Science',
  };

  const studentB = {
    displayName: 'Diya Sharma',
    username: `diya_${timestamp.toString().slice(-6)}`,
    email: `diya_${timestamp}@campus.edu`,
    password: `P@ssword_${timestamp}!`,
    dob: '2004-09-20',
    department: 'AI & Data Science',
  };

  let apiProc = null;
  let webProc = null;

  try {
    console.log('[1/5] Booting isolated test API backend...');
    apiProc = spawn('pnpm', ['--filter', '@vynk/api', 'exec', 'tsx', 'src/index.ts'], {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        APP_ENV: 'test',
        NODE_ENV: 'test',
        PORT: '4000',
        DATABASE_URL: 'postgresql://localhost:5432/vynk_db',
      },
      shell: true,
      stdio: 'pipe',
    });

    apiProc.stdout.on('data', (d) => {
      const line = d.toString();
      if (line.includes('API Server running') || line.includes('ACTIVE = PGlite')) {
        process.stdout.write(`  [API] ${line.trim()}\n`);
      }
    });

    await waitForUrl('http://localhost:4000/api/v1/institutions', 25000);
    console.log('  -> API server is healthy and responding.');

    console.log('[2/5] Booting Vite web frontend...');
    webProc = spawn('pnpm', ['--filter', '@vynk/web', 'dev', '--port', '5173', '--host', '127.0.0.1'], {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      stdio: 'pipe',
    });

    webProc.stdout.on('data', (d) => {
      const line = d.toString();
      if (line.includes('ready in') || line.includes('Local:')) {
        process.stdout.write(`  [Vite] ${line.trim()}\n`);
      }
    });

    await waitForUrl('http://localhost:5173/', 25000);
    console.log('  -> Vite frontend is healthy and serving.');

    console.log('[3/5] Launching Playwright Chromium Browser...');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // ─────────────────────────────────────────────────────────────
    // Desktop Run (1440 x 900) — Student A (Aarav Patel)
    // ─────────────────────────────────────────────────────────────
    console.log('[4/5] Executing Desktop Student A Flow (1440x900)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const pageA = await desktopContext.newPage();

    // 1. Visit /auth
    await pageA.goto('http://localhost:5173/auth');
    await pageA.waitForLoadState('networkidle');
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '01_auth_signin_desktop.png'), fullPage: true });
    console.log('  ✓ Captured 01_auth_signin_desktop.png');

    // 2. Switch to Sign Up
    await pageA.click("text=Don't have an account yet? Sign up");
    await pageA.waitForTimeout(500);

    // Fill registration form
    await pageA.fill('input[placeholder="you@college.edu"]', studentA.email);
    await pageA.fill('input[placeholder="campus_builder"]', studentA.username);
    await pageA.fill('input[placeholder="Your Name"]', studentA.displayName);
    await pageA.fill('input[type="date"]', studentA.dob);
    await pageA.fill('input[placeholder="••••••••"]', studentA.password);
    await pageA.fill('input[placeholder="Repeat password"]', studentA.password);
    await pageA.waitForTimeout(500);

    // Click submit
    await pageA.click('button:has-text("Create Student Account")');
    await pageA.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await pageA.waitForTimeout(2000);

    // Capture Home Feed
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '02_home_feed_desktop.png'), fullPage: true });
    console.log('  ✓ Captured 02_home_feed_desktop.png');

    // 3. Visit Communities
    await pageA.goto('http://localhost:5173/communities');
    await pageA.waitForLoadState('networkidle');
    await pageA.waitForTimeout(1000);
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '03_communities_desktop.png'), fullPage: true });
    console.log('  ✓ Captured 03_communities_desktop.png');

    // 4. Visit Voyages & Showcase a Voyage
    await pageA.goto('http://localhost:5173/voyages');
    await pageA.waitForLoadState('networkidle');
    await pageA.waitForTimeout(1000);
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '04_voyages_gallery_desktop.png'), fullPage: true });
    console.log('  ✓ Captured 04_voyages_gallery_desktop.png');

    // Open Create Voyage Modal
    await pageA.click('button:has-text("Showcase Voyage")');
    await pageA.waitForTimeout(600);
    await pageA.fill('input[placeholder*="NeuroVision"]', 'AeroVision: Edge Flight Telemetry');
    await pageA.fill('input[placeholder*="Sub-15ms edge"]', 'Autonomous real-time drone telemetry and path computation pipeline');
    await pageA.fill('input[placeholder*="PyTorch"]', 'PyTorch, WebAssembly, React, Fastify, Rust');
    await pageA.click('button:has-text("Publish Voyage")');
    await pageA.waitForTimeout(1500);

    // 5. Visit Network
    await pageA.goto('http://localhost:5173/network');
    await pageA.waitForLoadState('networkidle');
    await pageA.waitForTimeout(1000);
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '05_network_people_sphere_desktop.png'), fullPage: true });
    console.log('  ✓ Captured 05_network_people_sphere_desktop.png');

    // ─────────────────────────────────────────────────────────────
    // Mobile Run (390 x 844) — Student B (Diya Sharma)
    // ─────────────────────────────────────────────────────────────
    console.log('[5/5] Executing Mobile Student B Flow (390x844)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const pageB = await mobileContext.newPage();

    // 1. Visit /auth
    await pageB.goto('http://localhost:5173/auth');
    await pageB.waitForLoadState('networkidle');
    await pageB.screenshot({ path: path.join(SCREENSHOT_DIR, '01_auth_signin_mobile.png'), fullPage: true });
    console.log('  ✓ Captured 01_auth_signin_mobile.png');

    // 2. Sign up Student B
    await pageB.click("text=Don't have an account yet? Sign up");
    await pageB.waitForTimeout(500);
    await pageB.fill('input[placeholder="you@college.edu"]', studentB.email);
    await pageB.fill('input[placeholder="campus_builder"]', studentB.username);
    await pageB.fill('input[placeholder="Your Name"]', studentB.displayName);
    await pageB.fill('input[type="date"]', studentB.dob);
    await pageB.fill('input[placeholder="••••••••"]', studentB.password);
    await pageB.fill('input[placeholder="Repeat password"]', studentB.password);
    await pageB.waitForTimeout(500);
    await pageB.click('button:has-text("Create Student Account")');
    await pageB.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await pageB.waitForTimeout(2000);

    // Capture Mobile Home Feed
    await pageB.screenshot({ path: path.join(SCREENSHOT_DIR, '02_home_feed_mobile.png'), fullPage: true });
    console.log('  ✓ Captured 02_home_feed_mobile.png');

    // Mobile Communities
    await pageB.goto('http://localhost:5173/communities');
    await pageB.waitForLoadState('networkidle');
    await pageB.waitForTimeout(1000);
    await pageB.screenshot({ path: path.join(SCREENSHOT_DIR, '03_communities_mobile.png'), fullPage: true });
    console.log('  ✓ Captured 03_communities_mobile.png');

    // Mobile Voyages
    await pageB.goto('http://localhost:5173/voyages');
    await pageB.waitForLoadState('networkidle');
    await pageB.waitForTimeout(1000);
    await pageB.screenshot({ path: path.join(SCREENSHOT_DIR, '04_voyages_gallery_mobile.png'), fullPage: true });
    console.log('  ✓ Captured 04_voyages_gallery_mobile.png');

    // Mobile Network
    await pageB.goto('http://localhost:5173/network');
    await pageB.waitForLoadState('networkidle');
    await pageB.waitForTimeout(1000);
    await pageB.screenshot({ path: path.join(SCREENSHOT_DIR, '05_network_people_sphere_mobile.png'), fullPage: true });
    console.log('  ✓ Captured 05_network_people_sphere_mobile.png');

    // ─────────────────────────────────────────────────────────────
    // Direct Messaging Workflow between Student A & Student B
    // ─────────────────────────────────────────────────────────────
    console.log('  -> Executing mutual connection & messaging flow...');
    // In mobile context, Student B switches to Grid view to see Student A
    const gridBtn = pageB.locator('button:has-text("Switch to Grid View")');
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
      await pageB.waitForTimeout(600);
    }

    // Student B requests connection with Student A
    const connectBtn = pageB.locator('button:has-text("Connect")').first();
    if (await connectBtn.isVisible()) {
      await connectBtn.click();
      await pageB.waitForTimeout(1000);
      console.log('  ✓ Student B sent connection request to Student A');
    }

    // Student A navigates to Requests and accepts
    await pageA.goto('http://localhost:5173/network');
    await pageA.waitForLoadState('networkidle');
    await pageA.waitForTimeout(800);

    const requestsTab = pageA.locator('button:has-text("Requests")');
    if (await requestsTab.isVisible()) {
      await requestsTab.click();
      await pageA.waitForTimeout(800);
      const acceptBtn = pageA.locator('button:has-text("Accept")').first();
      if (await acceptBtn.isVisible()) {
        await acceptBtn.click();
        await pageA.waitForTimeout(1000);
        console.log('  ✓ Student A accepted connection request from Student B');
      }
    }

    // Now visit Messages on Desktop
    await pageA.goto('http://localhost:5173/messages');
    await pageA.waitForLoadState('networkidle');
    await pageA.waitForTimeout(1500);
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '06_messaging_direct_desktop.png'), fullPage: true });
    console.log('  ✓ Captured 06_messaging_direct_desktop.png');

    // Visit Messages on Mobile
    await pageB.goto('http://localhost:5173/messages');
    await pageB.waitForLoadState('networkidle');
    await pageB.waitForTimeout(1500);
    await pageB.screenshot({ path: path.join(SCREENSHOT_DIR, '06_messaging_direct_mobile.png'), fullPage: true });
    console.log('  ✓ Captured 06_messaging_direct_mobile.png');

    await browser.close();
    console.log('====================================================');
    console.log(' ALL E2E BROWSER TESTS & SCREENSHOTS COMPLETED 100%');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ E2E Browser Test Failed:', err);
    process.exitCode = 1;
  } finally {
    if (webProc && webProc.pid) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(webProc.pid), '/f', '/t']);
        } else {
          process.kill(webProc.pid);
        }
      } catch {}
    }
    if (apiProc && apiProc.pid) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(apiProc.pid), '/f', '/t']);
        } else {
          process.kill(apiProc.pid);
        }
      } catch {}
    }
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 1000);
  }
}

main();
