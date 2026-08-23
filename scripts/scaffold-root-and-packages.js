const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log('Created:', filePath);
}

const root = path.resolve(__dirname, '..');

// 1. Root package.json
writeFile(path.join(root, 'package.json'), JSON.stringify({
  name: 'vynk-monorepo',
  version: '1.0.0',
  private: true,
  description: 'VYNK — Find your people. Learn. Build. Rise. Student-first social & collaboration platform.',
  packageManager: 'pnpm@11.22.0',
  scripts: {
    'dev': 'turbo run dev --parallel',
    'build': 'turbo run build',
    'test': 'turbo run test',
    'lint': 'turbo run lint',
    'typecheck': 'turbo run typecheck',
    'db:generate': 'pnpm --filter @vynk/database db:generate',
    'db:push': 'pnpm --filter @vynk/database db:push',
    'db:seed': 'pnpm --filter @vynk/database db:seed'
  },
  devDependencies: {
    'turbo': '^2.4.4',
    'typescript': '^5.7.3',
    'rimraf': '^6.0.1'
  }
}, null, 2));

// 2. turbo.json
writeFile(path.join(root, 'turbo.json'), JSON.stringify({
  '$schema': 'https://turbo.build/schema.json',
  tasks: {
    build: {
      dependsOn: ['^build'],
      outputs: ['dist/**']
    },
    test: {
      dependsOn: ['^build']
    },
    lint: {},
    typecheck: {
      dependsOn: ['^build']
    },
    dev: {
      cache: false,
      persistent: true
    }
  }
}, null, 2));

// 3. .gitignore
writeFile(path.join(root, '.gitignore'), `
node_modules
dist
build
.turbo
.env
.env.local
coverage
.DS_Store
*.log
`);

// 4. .env.example
writeFile(path.join(root, '.env.example'), `
# Server Environment
PORT=4000
NODE_ENV=development
API_URL=http://localhost:4000
WEB_URL=http://localhost:3000

# Database & Cache
DATABASE_URL=postgresql://vynk_admin:vynk_secret_password@localhost:5432/vynk_db?schema=public
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=vynk_super_secret_jwt_access_key_2026_change_in_production
JWT_REFRESH_SECRET=vynk_super_secret_jwt_refresh_key_2026_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Providers
GOOGLE_CLIENT_ID=mock_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=mock_google_client_secret
GITHUB_CLIENT_ID=mock_github_client_id
GITHUB_CLIENT_SECRET=mock_github_client_secret

# Object Storage (S3 / Cloudflare R2)
S3_ENDPOINT=https://mock.r2.cloudflarestorage.com
S3_ACCESS_KEY=mock_s3_access_key
S3_SECRET_KEY=mock_s3_secret_key
S3_BUCKET_NAME=vynk-assets

# AI Recommendation Engine
LLM_API_KEY=mock_llm_api_key_for_embeddings
`);

// 5. docker-compose.yml
writeFile(path.join(root, 'docker-compose.yml'), `
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: vynk-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: vynk_admin
      POSTGRES_PASSWORD: vynk_secret_password
      POSTGRES_DB: vynk_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vynk_admin -d vynk_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: vynk-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: vynk-api
    restart: unless-stopped
    environment:
      PORT: 4000
      NODE_ENV: production
      DATABASE_URL: postgresql://vynk_admin:vynk_secret_password@postgres:5432/vynk_db?schema=public
      REDIS_URL: redis://redis:6379
      JWT_SECRET: vynk_super_secret_jwt_access_key_2026_change_in_production
      JWT_REFRESH_SECRET: vynk_super_secret_jwt_refresh_key_2026_change_in_production
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: vynk-web
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
`);

// 6. GitHub Workflows
writeFile(path.join(root, '.github/workflows/ci.yml'), `
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.22.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
`);

writeFile(path.join(root, '.github/workflows/test.yml'), `
name: Integration Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: vynk_admin
          POSTGRES_PASSWORD: vynk_secret_password
          POSTGRES_DB: vynk_test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.22.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
`);

writeFile(path.join(root, '.github/workflows/build.yml'), `
name: Build Verification

on:
  push:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.22.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
`);

// 7. packages/config
writeFile(path.join(root, 'packages/config/package.json'), JSON.stringify({
  name: '@vynk/config',
  version: '1.0.0',
  private: true,
  main: 'index.js'
}, null, 2));

writeFile(path.join(root, 'packages/config/tsconfig.base.json'), JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    lib: ['ES2022'],
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  }
}, null, 2));

console.log('Root and config packages created successfully!');
