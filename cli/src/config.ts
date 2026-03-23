import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.openemr-ts');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface CliConfig {
  apiUrl: string;
  apiKey: string | null;
}

const DEFAULT_CONFIG: CliConfig = {
  apiUrl: 'http://localhost:3000',
  apiKey: null,
};

export function loadConfig(): CliConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // Fall through to default
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: Partial<CliConfig>): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const existing = loadConfig();
  const merged = { ...existing, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
}

export function getApiUrl(): string {
  return process.env.OPENEMR_API_URL || loadConfig().apiUrl;
}

export function getApiKey(): string {
  const key = process.env.OPENEMR_API_KEY || loadConfig().apiKey;
  if (!key) {
    console.error('No API key configured. Run: openemr-ts login --api-key <key>');
    console.error('Or set OPENEMR_API_KEY environment variable.');
    process.exit(1);
  }
  return key;
}
