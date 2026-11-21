export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { localStore, createModelDelegate } from './local-store';

export { localStore, createModelDelegate } from './local-store';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var vynkDbIsPostgresAvailable: boolean | undefined;
}

const rawPrisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = rawPrisma;
}

// Track whether native PostgreSQL is reachable
let isPostgresHealthy: boolean | null = null;
let lastCheckTime = 0;

async function checkPostgresReachability(): Promise<boolean> {
  const now = Date.now();
  if (isPostgresHealthy !== null && now - lastCheckTime < 15000) {
    return isPostgresHealthy;
  }

  try {
    // Quick probe query with short timeout
    await Promise.race([
      rawPrisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB_PROBE_TIMEOUT')), 1500)),
    ]);
    isPostgresHealthy = true;
    lastCheckTime = now;
    return true;
  } catch {
    isPostgresHealthy = false;
    lastCheckTime = now;
    return false;
  }
}

// Helper to check if an error is a PostgreSQL connection failure
function isConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '') + (err.code || '');
  return (
    msg.includes('P1001') ||
    msg.includes('P1000') ||
    msg.includes('P1002') ||
    msg.includes('P1003') ||
    msg.includes("Can't reach database server") ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('DB_PROBE_TIMEOUT')
  );
}

// Create a local store proxy representing a PrismaClient-compatible client
function createLocalClient(): any {
  const delegates = new Map<string, any>();

  let proxy: any;

  const client: any = {
    $transaction: async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(proxy);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg;
    },
    $queryRaw: async () => [],
    $executeRaw: async () => 0,
    $connect: async () => {},
    $disconnect: async () => {},
  };

  proxy = new Proxy(client, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'symbol') return undefined;
      if (prop in target) return target[prop];

      if (!delegates.has(prop)) {
        delegates.set(prop, createModelDelegate(prop));
      }
      return delegates.get(prop);
    },
  });

  return proxy;
}

const localClient = createLocalClient();

// Resilient Prisma Proxy that executes against PostgreSQL when available,
// and automatically falls back to the persistent LocalStore without crashing.
export const prisma: PrismaClient = new Proxy(rawPrisma as any, {
  get(target, modelProp: string | symbol) {
    if (typeof modelProp === 'symbol') return (target as any)[modelProp];

    // Special client-level methods
    if (modelProp === '$transaction') {
      return async (arg: any) => {
        const canUsePg = await checkPostgresReachability();
        if (canUsePg) {
          try {
            return await target.$transaction(arg);
          } catch (err) {
            if (isConnectionError(err)) {
              isPostgresHealthy = false;
              return localClient.$transaction(arg);
            }
            throw err;
          }
        }
        return localClient.$transaction(arg);
      };
    }

    if (modelProp === '$connect') {
      return async () => {
        try {
          await target.$connect();
        } catch {
          // Graceful fallback
        }
      };
    }

    if (modelProp === '$disconnect') {
      return async () => {
        try {
          await target.$disconnect();
        } catch {
          // Graceful fallback
        }
      };
    }

    if (modelProp === '$queryRaw' || modelProp === '$executeRaw') {
      return async (...args: any[]) => {
        const canUsePg = await checkPostgresReachability();
        if (canUsePg) {
          try {
            return await (target as any)[modelProp](...args);
          } catch (err) {
            if (isConnectionError(err)) {
              isPostgresHealthy = false;
              return [];
            }
            throw err;
          }
        }
        return [];
      };
    }

    // Model delegates (e.g. prisma.user, prisma.post, etc.)
    const realModel = (target as any)[modelProp];
    const localModel = localClient[modelProp];

    if (!localModel) {
      return realModel;
    }

    // Proxy the model methods (findUnique, findMany, create, update, etc.)
    return new Proxy(realModel || {}, {
      get(modelTarget, methodProp: string | symbol) {
        if (typeof methodProp === 'symbol') return (modelTarget as any)[methodProp];

        return async (...args: any[]) => {
          // If we already know PostgreSQL is unreachable, use local store directly
          if (isPostgresHealthy === false) {
            const localMethod = localModel[methodProp];
            if (localMethod) return localMethod(...args);
          }

          // Otherwise attempt PostgreSQL first
          if (realModel && typeof realModel[methodProp] === 'function') {
            try {
              return await realModel[methodProp](...args);
            } catch (err) {
              if (isConnectionError(err)) {
                isPostgresHealthy = false;
                const localMethod = localModel[methodProp];
                if (localMethod) {
                  return await localMethod(...args);
                }
              }
              throw err;
            }
          }

          // Fallback to local store
          const localMethod = localModel[methodProp];
          if (localMethod) {
            return await localMethod(...args);
          }
          throw new Error(`Method ${String(methodProp)} not supported on ${String(modelProp)}`);
        };
      },
    });
  },
});
