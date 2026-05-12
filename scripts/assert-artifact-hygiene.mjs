import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const forbiddenDirs = new Set(['node_modules', '.next', '.turbo', 'dist', 'coverage']);
const forbiddenFiles = new Set(['.env', '.env.local', '.env.production', '.env.development']);
const forbiddenPatterns = [
  /packages\.applied-caas-gateway1\.internal\.api\.openai\.org/i,
  /https:\/\/[^/\s"']+:[^@\s"']+@/i,
  /OPENAI_API_KEY\s*=/i,
  /GEMINI_API_KEY\s*=/i,
  /ANTHROPIC_API_KEY\s*=/i
];
const allowTextExt = new Set(['.json', '.js', '.mjs', '.ts', '.tsx', '.md', '.txt', '.yml', '.yaml', '.toml', '.prisma', '.example', '.gitignore', '.npmrc']);
const issues = [];
let scannedFiles = 0;

function shouldSkipDir(name) {
  return name === '.git' || name === '.cache';
}

function walk(dir, rel = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryRel = path.join(rel, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (forbiddenDirs.has(entry.name)) {
        issues.push({ code: 'forbidden_directory_present', path: entryRel, severity: 'blocker' });
        continue;
      }
      if (!shouldSkipDir(entry.name)) walk(full, entryRel);
      continue;
    }
    if (!entry.isFile()) continue;
    scannedFiles += 1;
    if (forbiddenFiles.has(entry.name)) {
      issues.push({ code: 'forbidden_env_file_present', path: entryRel, severity: 'blocker' });
    }
    const ext = path.extname(entry.name);
    if (entry.name === 'package-lock.json' || allowTextExt.has(ext) || entry.name.includes('.env.example')) {
      let text = '';
      try { text = fs.readFileSync(full, 'utf8'); } catch { text = ''; }
      forbiddenPatterns.forEach((pattern, index) => {
        // The normalizer and this hygiene script intentionally contain the marker patterns as detection rules.
        // Do not flag those rule definitions as leaked credentials/internal lockfile content.
        const isDetectorRuleFile = entryRel === 'scripts/normalize-package-lock-registry.mjs' || entryRel === 'scripts/assert-artifact-hygiene.mjs';
        if (pattern.test(text) && !isDetectorRuleFile) {
          issues.push({ code: 'forbidden_secret_or_internal_registry_marker', patternIndex: index, path: entryRel, severity: 'blocker' });
        }
      });
    }
  }
}

walk(root);
const ok = issues.every((issue) => issue.severity !== 'blocker');
console.log(JSON.stringify({
  ok,
  root,
  scannedFiles,
  issues,
  note: 'Artifact hygiene check blocks node_modules/.next/env secrets/internal credentialed registry markers. Run before zipping or sharing the repo.'
}, null, 2));
process.exit(ok ? 0 : 1);
