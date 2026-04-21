// const Docker = require('dockerode');
// const { v4: uuidv4 } = require('uuid');
// const fs = require('fs');
// const path = require('path');

// const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// const IMAGES = {
//   python: 'python:3.11-slim',
//   javascript: 'node:18-slim',
//   cpp: 'gcc:12'
// };

// const EXTENSIONS = {
//   python: 'py',
//   javascript: 'js',
//   cpp: 'cpp'
// };

// const COMMANDS = {
//   python: (filepath) => ['python3', filepath],
//   javascript: (filepath) => ['node', filepath],
//   cpp: (filepath) => ['sh', '-c', `g++ ${filepath} -o /tmp/out && /tmp/out`]
// };

// const runCode = async (language, code) => {
//   const startTime = Date.now();
//   const id = uuidv4();
//   const filename = `code_${id}.${EXTENSIONS[language]}`;
//   const hostPath = `/tmp/code/${filename}`;
//   const containerPath = `/tmp/code/${filename}`;

//   fs.writeFileSync(hostPath, code);

//   try {
//     const container = await docker.createContainer({
//       Image: IMAGES[language],
//       Cmd: COMMANDS[language](containerPath),
//       AttachStdout: true,
//       AttachStderr: true,
//       NetworkDisabled: true,
//       HostConfig: {
//         Memory: 50 * 1024 * 1024,
//         CpuPeriod: 100000,
//         CpuQuota: 50000,
//         AutoRemove: true,
//         Binds: [`${hostPath}:${containerPath}:ro`]
//       }
//     });

//     await container.start();

//     const stream = await container.logs({
//       follow: true,
//       stdout: true,
//       stderr: true
//     });

//     const output = await new Promise((resolve, reject) => {
//       const timeout = setTimeout(() => {
//         container.kill().catch(() => {});
//         reject(new Error('Execution timed out (5 seconds)'));
//       }, 5000);

//       let result = '';
//       stream.on('data', (chunk) => {
//         result += chunk.toString('utf8').slice(8);
//       });
//       stream.on('end', () => {
//         clearTimeout(timeout);
//         resolve(result);
//       });
//       stream.on('error', (err) => {
//         clearTimeout(timeout);
//         reject(err);
//       });
//     });

//     return {
//       output: output.trim(),
//       error: null,
//       executionTime: Date.now() - startTime
//     };

//   } catch (err) {
//     return {
//       output: null,
//       error: err.message,
//       executionTime: Date.now() - startTime
//     };
//   } finally {
//     fs.unlink(hostPath, () => {});
//   }
// };

// module.exports = { runCode };
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

const runCode = async (language, code) => {
  const startTime = Date.now();
  const encoded = Buffer.from(code).toString('base64');

  try {
    const container = await docker.createContainer({
      Image: IMAGES[language],
      Cmd: COMMANDS[language],
      AttachStdout: true,
      AttachStderr: true,
      NetworkDisabled: true,
      Env: [`CODE=${encoded}`],
      HostConfig: {
        Memory: 50 * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: 50000,
        AutoRemove: false
      }
    });

    await container.start();

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true
    });

    const output = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        container.kill().catch(() => {});
        reject(new Error('Execution timed out (5 seconds)'));
      }, 5000);

      let result = '';
      stream.on('data', (chunk) => {
        result += chunk.toString('utf8').slice(8);
      });
      stream.on('end', () => {
        clearTimeout(timeout);
        resolve(result);
      });
      stream.on('error', (err) => {
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