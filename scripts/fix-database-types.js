const fs = require('fs');
const path = require('path');

// 1. Update packages/config/tsconfig.base.json
const baseTsConfigPath = path.resolve(__dirname, '../packages/config/tsconfig.base.json');
const baseTsConfig = {
  compilerOptions: {
    target: "ES2022",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    lib: ["ES2022", "DOM"],
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  }
};
fs.writeFileSync(baseTsConfigPath, JSON.stringify(baseTsConfig, null, 2) + '\n', 'utf8');

// 2. Update packages/database/prisma/seed.ts
const seedPath = path.resolve(__dirname, '../packages/database/prisma/seed.ts');
let seedContent = fs.readFileSync(seedPath, 'utf8');

if (!seedContent.includes("category: 'Healthcare'")) {
  seedContent = seedContent.replace(
    "demoUrl: 'https://neurovision-demo.vercel.app',",
    "demoUrl: 'https://neurovision-demo.vercel.app',\n      category: 'Healthcare',"
  );
  fs.writeFileSync(seedPath, seedContent, 'utf8');
}

// 3. Update packages/database/package.json with @types/node
const dbPkgPath = path.resolve(__dirname, '../packages/database/package.json');
const dbPkg = JSON.parse(fs.readFileSync(dbPkgPath, 'utf8'));
dbPkg.devDependencies = dbPkg.devDependencies || {};
dbPkg.devDependencies['@types/node'] = '^22.10.7';
fs.writeFileSync(dbPkgPath, JSON.stringify(dbPkg, null, 2) + '\n', 'utf8');

console.log('Fixed tsconfig.base.json, seed.ts, and database package.json');
