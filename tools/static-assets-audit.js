// tools/static-assets-audit.js
// 扫描 icons/ 与 src/assets/ 的静态资源引用情况，输出未使用资产报告。

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const iconsDir = path.join(repoRoot, 'icons');
const assetsDir = path.join(repoRoot, 'src', 'assets');
const reportDir = path.join(repoRoot, 'audit_reports');
const reportPath = path.join(reportDir, 'static-assets.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile());
}

function walkAllFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

function findReferences(files, names) {
  const used = new Set();
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    for (const n of names) {
      if (content.includes(n)) used.add(n);
    }
  }
  return used;
}

function main() {
  ensureDir(reportDir);
  const iconFiles = listFiles(iconsDir);
  const assetFiles = listFiles(assetsDir);

  const projectFiles = walkAllFiles(repoRoot);
  const iconUsed = findReferences(projectFiles, iconFiles);
  const assetUsed = findReferences(projectFiles, assetFiles);

  const iconUnused = iconFiles.filter(n => !iconUsed.has(n)).sort();
  const assetUnused = assetFiles.filter(n => !assetUsed.has(n)).sort();

  const lines = [];
  lines.push('# 静态资源审计报告');
  lines.push('');
  lines.push('- 范围: icons/*, src/assets/* 与全库引用');
  lines.push('- 生成时间: ' + new Date().toISOString());
  lines.push('');
  lines.push('## 未使用的 icons');
  lines.push(iconUnused.length ? iconUnused.map(n => `- ${n}`).join('\n') : '- 无');
  lines.push('');
  lines.push('## 未使用的 assets');
  lines.push(assetUnused.length ? assetUnused.map(n => `- ${n}`).join('\n') : '- 无');

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  console.log('静态资源审计报告已生成:', path.relative(repoRoot, reportPath));
}

main();