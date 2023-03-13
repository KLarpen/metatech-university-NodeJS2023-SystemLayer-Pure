import type { RunningScriptOptions } from 'node:vm';

export const APPLICATION: string;
export const LOG_DIR: string;
export const HASHING: {
  saltLength: number;
  keyLength: number;
};
export const SANDBOX_RUN_OPTIONS: RunningScriptOptions;
