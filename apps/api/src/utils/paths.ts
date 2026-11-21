import path from 'path';
import fs from 'fs';

let cachedWorkspaceRoot: string | null = null;

export function getWorkspaceRoot(): string {
  if (cachedWorkspaceRoot) return cachedWorkspaceRoot;

  let curr = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(curr, 'pnpm-workspace.yaml'))) {
      cachedWorkspaceRoot = curr;
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }

  curr = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(curr, 'pnpm-workspace.yaml'))) {
      cachedWorkspaceRoot = curr;
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }

  cachedWorkspaceRoot = process.cwd();
  return cachedWorkspaceRoot;
}

export function getUploadsDir(): string {
  const root = getWorkspaceRoot();
  const isTest = process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'test' || typeof process.env.VITEST !== 'undefined';
  const subDir = isTest ? 'test_uploads' : 'uploads';
  const uploadsDir = path.resolve(root, 'data', subDir);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}
