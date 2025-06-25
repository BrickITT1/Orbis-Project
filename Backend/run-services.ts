import { spawn, ChildProcess  } from 'child_process';
import path from 'path';
import fs from 'fs';

const servicesDir = path.join(__dirname, 'services');
const serviceDirs = fs.readdirSync(servicesDir).filter((f) =>
  fs.existsSync(path.join(servicesDir, f, 'package.json'))
);

const childProcesses: ChildProcess [] = [];

function startServices() {
  console.log(serviceDirs)
  serviceDirs.forEach((serviceName) => {

    if (serviceName == 'MediaService') return;
    const servicePath = path.join(servicesDir, serviceName);

    const proc = spawn('npm', ['run', 'start'], {
      cwd: servicePath,
      stdio: 'inherit',
      shell: 'cmd.exe',
      
    });

    childProcesses.push(proc);

    proc.on('close', (code) => {
      console.log(`Сервис ${serviceName} завершился с кодом ${code}`);
    });

    proc.on('error', (err) => {
      console.error(`Ошибка при запуске ${serviceName}:`, err);
    });
  });
}

function shutdownAll() {
  console.log('\n⛔ Завершение всех сервисов...');
  for (const proc of childProcesses) {
    if (proc.pid) {
      try {
        if (process.platform === 'win32') {
          // Завершаем процесс и все дочерние
          spawn('taskkill', ['/PID', `${proc.pid}`, '/T', '/F'], { stdio: 'ignore' });
        } else {
          process.kill(-proc.pid, 'SIGTERM');
        }
      } catch (e) {
        console.error(`Ошибка при завершении процесса ${proc.pid}:`, e);
      }
    }
  }
  // Немного подожди, чтобы процессы успели завершиться
  setTimeout(() => process.exit(), 1000);
}

process.on('SIGINT', shutdownAll);
process.on('SIGTERM', shutdownAll);
process.on('exit', shutdownAll);

startServices();
