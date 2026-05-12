import { spawnSync } from 'child_process';
const commands = [['npm','run','data:validate'], ['npm','run','demo:readiness-validate'], ['npm','run','smoke:batch67']];
for (const cmd of commands) {
  const res = spawnSync(cmd[0], cmd.slice(1), { stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) process.exit(res.status || 1);
}
