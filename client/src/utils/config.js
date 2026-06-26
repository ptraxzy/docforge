import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config stored in ~/.docforge/config.json
const CONFIG_DIR = path.join(process.env.HOME || '/root', '.docforge');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_SERVER_URL = 'http://ip.lubu.biz.id:45557';

export function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return fs.readJsonSync(CONFIG_FILE);
    }
  } catch (e) {
    // Ignore
  }
  return {
    serverUrl: DEFAULT_SERVER_URL,
  };
}

export function saveConfig(config) {
  fs.ensureDirSync(CONFIG_DIR);
  fs.writeJsonSync(CONFIG_FILE, config, { spaces: 2 });
}

export function getServerUrl() {
  const config = getConfig();
  return config.serverUrl || DEFAULT_SERVER_URL;
}

export function setServerUrl(url) {
  const config = getConfig();
  config.serverUrl = url;
  saveConfig(config);
}
