import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = 3307;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(currentDirectory, '../..');
const configPath = path.join(backendDirectory, 'mysql.local.ini');
const executable = 'C:\\xampp\\mysql\\bin\\mysqld.exe';

function canConnect() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(1_000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

if (await canConnect()) {
  console.log(`Local database is already running at ${host}:${port}`);
  process.exit(0);
}

const child = spawn(executable, [`--defaults-file=${configPath}`, '--console'], {
  detached: true,
  windowsHide: true,
  stdio: 'ignore'
});
child.unref();

let ready = false;
for (let attempt = 0; attempt < 20; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (await canConnect()) {
    ready = true;
    break;
  }
}

if (!ready) {
  throw new Error('Local database did not start. Check .mysql-data/chrisea-mysql.log.');
}

console.log(`Local database started at ${host}:${port}`);
