const { execSync } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

console.log('\n======================================================');
console.log('            VYNK SYSTEM & INFRASTRUCTURE DOCTOR        ');
console.log('======================================================\n');

let allHealthy = true;

// 1. Node & pnpm Check
try {
  const nodeVer = process.version;
  const major = parseInt(nodeVer.slice(1).split('.')[0], 10);
  if (major >= 18) {
    console.log('✓ Node.js version: ' + nodeVer + ' (supported)');
  } else {
    console.log('✗ Node.js version: ' + nodeVer + ' (Node 18+ required)');
    allHealthy = false;
  }
} catch (e) {
  console.log('✗ Node.js check failed: ' + e.message);
  allHealthy = false;
}

try {
  const pnpmVer = execSync('pnpm --version', { stdio: 'pipe' }).toString().trim();
  console.log('✓ pnpm version: ' + pnpmVer);
} catch (e) {
  console.log('✗ pnpm is not installed globally or not in PATH.');
  allHealthy = false;
}

// 2. Environment Variables Check
const rootEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
  console.log('✓ Environment: .env file exists in root');
  const envContent = fs.readFileSync(rootEnvPath, 'utf8');
  if (envContent.includes('DATABASE_URL=')) {
    console.log('✓ DATABASE_URL configured');
  } else {
    console.log('✗ DATABASE_URL is missing in .env');
    allHealthy = false;
  }
  if (envContent.includes('JWT_SECRET=')) {
    console.log('✓ JWT_SECRET configured');
  } else {
    console.log('✗ JWT_SECRET is missing in .env');
    allHealthy = false;
  }
} else {
  console.log('✗ Root .env file not found. Create one from .env.example');
  allHealthy = false;
}

// Helper: TCP Socket check
function checkTcpPort(host, port, serviceName) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => {
      socket.destroy();
      console.log('✓ ' + serviceName + ' is reachable on ' + host + ':' + port);
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      console.log('✗ ' + serviceName + ' is NOT reachable on ' + host + ':' + port + ' (Timeout)');
      resolve(false);
    });
    socket.on('error', (err) => {
      socket.destroy();
      console.log('✗ ' + serviceName + ' is NOT reachable on ' + host + ':' + port + ' (' + err.code + ')');
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// 3. Docker Status Check
try {
  const dockerInfo = execSync('docker info', { stdio: 'pipe', timeout: 4000 }).toString();
  console.log('✓ Docker engine is running');
} catch (e) {
  console.log('⚠ Docker daemon is not running. (Start Docker Desktop to use containerized PostgreSQL/Redis)');
}

async function runHealthChecks() {
  console.log('\n--- Checking Network Services ---');
  const pgOk = await checkTcpPort('127.0.0.1', 5432, 'PostgreSQL');
  const redisOk = await checkTcpPort('127.0.0.1', 6379, 'Redis');
  const apiOk = await checkTcpPort('127.0.0.1', 4000, 'VYNK API Server');
  const webOk = await checkTcpPort('127.0.0.1', 5173, 'VYNK Web Client');

  console.log('\n======================================================');
  if (pgOk && apiOk) {
    console.log('✅ SYSTEM STATUS: Full stack is online and operational!');
  } else {
    console.log('ℹ️  NEXT ACTIONS:');
    if (!pgOk) {
      console.log('   1. Start PostgreSQL: "docker compose up -d postgres redis" (or start local Postgres)');
      console.log('   2. Initialize DB: "pnpm db:push && pnpm db:seed"');
    }
    if (!apiOk) {
      console.log('   3. Start servers: "pnpm dev"');
    }
  }
  console.log('======================================================\n');
}

runHealthChecks();
