const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const IMAGES = {
  python: 'python:3.11-slim',
  javascript: 'node:18-slim',
  cpp: 'gcc:12'
};

const COMMANDS = {
  python: ['sh', '-c', 'echo $CODE | base64 -d > /tmp/code.py && python3 /tmp/code.py'],
  javascript: ['sh', '-c', 'echo $CODE | base64 -d > /tmp/code.js && node /tmp/code.js'],
  cpp: ['sh', '-c', 'echo $CODE | base64 -d > /tmp/code.cpp && g++ /tmp/code.cpp -o /tmp/out && /tmp/out']
};

const runCode = async (language, code, stdin = '') => {
  const startTime = Date.now();
  const encodedCode = Buffer.from(code).toString('base64');

  try {
    const container = await docker.createContainer({
      Image: IMAGES[language],
      Cmd: COMMANDS[language],
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: true,
      OpenStdin: true,
      StdinOnce: true,
      NetworkDisabled: true,
      Env: [`CODE=${encodedCode}`],
      HostConfig: {
        Memory: 50 * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: 50000,
        AutoRemove: false
      }
    });

    const stdinStream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
      hijack: true
    });

    await container.start();

    if (stdin) {
      stdinStream.write(stdin + '\n');
    }
    stdinStream.end();

    const output = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        container.kill().catch(() => {});
        reject(new Error('Execution timed out (5 seconds)'));
      }, 5000);

      let result = '';
      stdinStream.on('data', (chunk) => {
        result += chunk.toString('utf8').slice(8);
      });
      stdinStream.on('end', () => {
        clearTimeout(timeout);
        resolve(result);
      });
      stdinStream.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    await container.remove().catch(() => {});

    return {
      output: output.trim(),
      error: null,
      executionTime: Date.now() - startTime
    };

  } catch (err) {
    return {
      output: null,
      error: err.message,
      executionTime: Date.now() - startTime
    };
  }
};

module.exports = { runCode };