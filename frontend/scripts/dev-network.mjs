import { spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptFile = fileURLToPath(import.meta.url);
const frontendDir = path.resolve(path.dirname(scriptFile), '..');
const rootDir = path.resolve(frontendDir, '..');
const networkConfigPath = path.join(rootDir, '.network.json');
const defaultFrontendPort = 3000;
const defaultBackendPort = 8000;

function isLanAddress(address) {
  return (
    address.startsWith('192.168.') ||
    address.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

function findLanHost() {
  if (process.env.NETWORK_HOST) {
    return process.env.NETWORK_HOST;
  }

  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter(Boolean)
    .filter((address) => address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);

  return addresses.find(isLanAddress) ?? addresses[0] ?? '127.0.0.1';
}

function isPortFree(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function findFreePort(host, startPort) {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (await isPortFree(host, port)) {
      return port;
    }
  }

  throw new Error('Nije pronadjen slobodan frontend port.');
}

function readNetworkConfig() {
  if (!fs.existsSync(networkConfigPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(networkConfigPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveNetworkConfig(config) {
  fs.writeFileSync(networkConfigPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function main() {
  const host = findLanHost();
  const startPort = Number(process.env.FRONTEND_PORT ?? defaultFrontendPort);
  const port = await findFreePort(host, startPort);
  const config = readNetworkConfig();
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    config.backend?.url ??
    `http://${host}:${process.env.NEXT_PUBLIC_API_PORT ?? defaultBackendPort}`;

  const nextBin = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  const env = {
    ...process.env,
    NETWORK_HOST: host,
    NEXT_PUBLIC_API_URL: backendUrl,
    NEXT_PUBLIC_API_PORT: new URL(backendUrl).port || String(defaultBackendPort),
  };

  saveNetworkConfig({
    ...config,
    frontend: {
      host,
      port,
      url: `http://${host}:${port}`,
    },
  });

  console.log(`Frontend network URL: http://${host}:${port}`);
  console.log(`Backend API URL: ${backendUrl}`);

  const child = spawn(process.execPath, [nextBin, 'dev', '-H', host, '-p', String(port)], {
    cwd: frontendDir,
    env,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
