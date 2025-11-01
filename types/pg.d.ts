// Minimal type declarations for 'pg' to satisfy TypeScript during builds.
// This is a lightweight subset used by our codebase and can be replaced
// by installing '@types/pg' when network access is available.

declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    end(): Promise<void>;
  }
}

