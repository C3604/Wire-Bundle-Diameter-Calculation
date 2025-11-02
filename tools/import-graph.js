// tools/import-graph.js
// 构建 src 下的相对导入引用图，识别可能未引用的 JS 模块，并输出报告。

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const srcDir = path.join(repoRoot, 'src');
const reportDir = path.join(repoRoot, 'audit_reports');
const reportPath = path.join(reportDir, 'import-graph.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function walkJsFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (path.extname(ent.name) === '.js') out.push(full);
    }
  }
  return out;
}

function parseImports(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const re = /import\s+[^;]*?from\s+["']([^"']+)["'];/g;
  const out = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    const spec = m[1];
    if (spec.startsWith('.') || spec.startsWith('..')) out.push(spec);
  }
  return out;
}

function resolveImport(fromFile, spec) {
  const base = path.dirname(fromFile);
  let target = path.resolve(base, spec);
  // 补 .js 后缀
  if (fs.existsSync(target)) return target;
  if (fs.existsSync(target + '.js')) return target + '.js';
  return null; // 未解析到，可能是非 js 资源或构建路径，此处忽略
}

function main() {
  ensureDir(reportDir);
  const files = walkJsFiles(srcDir);
  const importsMap = new Map(); // file -> [resolved]

  for (const f of files) {
    const specs = parseImports(f);
    const resolved = specs.map(s => resolveImport(f, s)).filter(Boolean);
    importsMap.set(f, resolved);
  }

  // 定义根入口
  const roots = [
    path.join(srcDir, 'pages', 'Popup.js'),
    path.join(srcDir, 'pages', 'Help.js'),
    path.join(srcDir, 'background', 'openWindow.js'),
  ].filter(f => fs.existsSync(f));

  const reachable = new Set(roots);
  const queue = [...roots];
  while (queue.length) {
    const cur = queue.shift();
    const nexts = importsMap.get(cur) || [];
    for (const n of nexts) {
      if (!reachable.has(n)) {
        reachable.add(n);
        queue.push(n);
      }
    }
  }

  const all = new Set(files);
  const unreachable = Array.from(all).filter(f => !reachable.has(f)).sort();
  const lines = [];
  lines.push('# 导入引用图审计报告');
  lines.push('');
  lines.push('- 范围: src/**/*.js（仅相对导入）');
  lines.push('- 根入口: src/pages/Popup.js, src/pages/Help.js, src/background/openWindow.js');
  lines.push('- 生成时间: ' + new Date().toISOString());
  lines.push('');
  lines.push('## 可能未引用模块（不可达）');
  lines.push(unreachable.length ? unreachable.map(f => `- ${path.relative(repoRoot, f)}`).join('\n') : '- 无');
  lines.push('');
  lines.push('## 入口可达模块计数');
  lines.push(`- 可达: ${reachable.size}`);
  lines.push(`- 总数: ${files.length}`);

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  console.log('导入图审计报告已生成:', path.relative(repoRoot, reportPath));
}

main();