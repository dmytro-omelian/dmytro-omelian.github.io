const { spawn } = require('child_process');
const path = require('path');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const viewsServerPath = path.resolve(__dirname, '../server/views-server.js');

const viewsServer = spawn(process.execPath, [viewsServerPath], {
  stdio: 'inherit',
});

const webApp = spawn(npmCommand, ['run', 'start:react'], {
  stdio: 'inherit',
});

function terminateChild(childProcess, signal = 'SIGTERM') {
  if (childProcess && childProcess.exitCode === null) {
    childProcess.kill(signal);
  }
}

function shutdown(signal = 'SIGTERM') {
  terminateChild(webApp, signal);
  terminateChild(viewsServer, signal);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

viewsServer.on('exit', (code) => {
  if (code !== 0) {
    terminateChild(webApp, 'SIGTERM');
    process.exit(code || 1);
  }
});

webApp.on('exit', (code) => {
  terminateChild(viewsServer, 'SIGTERM');
  process.exit(code || 0);
});
