import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const stack = fs.existsSync(dataDir) ? [dataDir] : [];
const files = [];
while (stack.length) {
  const dir = stack.pop();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) stack.push(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(fullPath);
  }
}
let checked = 0;
let failed = 0;
const failures = [];
for (const file of files.sort()) {
  checked += 1;
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failed += 1;
    failures.push({ file: path.relative(root, file), error: error instanceof Error ? error.message : String(error) });
  }
}
const result = { ok: failed === 0, checked, failed, failures };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
