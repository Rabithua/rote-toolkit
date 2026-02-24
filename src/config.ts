import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { ToolkitConfig } from './types.js';

const CONFIG_DIR = join(homedir(), '.rote-toolkit');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function saveConfig(config: ToolkitConfig): void {
  if (!config.apiUrl || !config.openKey) {
    throw new Error('apiUrl and openKey are required.');
  }

  const normalized: ToolkitConfig = {
    apiUrl: normalizeApiUrl(config.apiUrl),
    openKey: config.openKey.trim(),
  };

  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(normalized, null, 2), 'utf8');
}

export function loadConfig(): ToolkitConfig {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`Config not found at ${CONFIG_PATH}. Run "rote config" first.`);
  }

  const raw = readFileSync(CONFIG_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Partial<ToolkitConfig>;

  if (!parsed.apiUrl || !parsed.openKey) {
    throw new Error(`Invalid config at ${CONFIG_PATH}. Run "rote config" again.`);
  }

  return {
    apiUrl: normalizeApiUrl(parsed.apiUrl),
    openKey: parsed.openKey.trim(),
  };
}

export function normalizeApiUrl(apiUrl: string): string {
  const trimmed = apiUrl.trim().replace(/\/$/, '');
  return trimmed;
}
