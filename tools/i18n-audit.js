// tools/i18n-audit.js
// 扫描代码中的 i18n 使用键，和 _locales 消息键对比，生成审计报告。

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const srcDir = path.join(repoRoot, 'src');
const localesDir = path.join(repoRoot, '_locales');
const reportDir = path.join(repoRoot, 'audit_reports');
const reportPath = path.join(reportDir, 'i18n-audit.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function walkFiles(dir, exts = ['.js', '.html']) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
      } else {
        if (exts.includes(path.extname(ent.name))) out.push(full);
      }
    }
  }
  return out;
}

function collectUsedKeys(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const used = new Set();
  // JS: i18n.getMessage("key")
  const reGet = /i18n\.getMessage\(["']([^"'\)]+)["']\)/g;
  let m;
  while ((m = reGet.exec(content)) !== null) {
    used.add(m[1]);
  }
  // HTML: data-i18n / data-i18n-key / data-i18n-title / data-i18n-ph-key
  const reAttr = /data-(?:i18n|i18n-key|i18n-title|i18n-ph-key)=["']([^"']+)["']/g;
  while ((m = reAttr.exec(content)) !== null) {
    used.add(m[1]);
  }
  return used;
}

function main() {
  ensureDir(reportDir);
  const zh = readJson(path.join(localesDir, 'zh_CN', 'messages.json')) || {};
  const en = readJson(path.join(localesDir, 'en', 'messages.json')) || {};
  const zhKeys = new Set(Object.keys(zh));
  const enKeys = new Set(Object.keys(en));

  const files = walkFiles(srcDir, ['.js', '.html']);
  const usedKeys = new Set();
  for (const f of files) {
    for (const k of collectUsedKeys(f)) usedKeys.add(k);
  }

  // messages.json 结构为 { key: { message, description } }，需按键名比对
  // 已知项目 messages.json 使用的键在对象顶层，直接比对键名
  const used = Array.from(usedKeys).sort();
  const zhOnly = used.filter(k => !zhKeys.has(k));
  const enOnly = used.filter(k => !enKeys.has(k));

  const unusedZh = Array.from(zhKeys).filter(k => !usedKeys.has(k)).sort();
  const unusedEn = Array.from(enKeys).filter(k => !usedKeys.has(k)).sort();

  const lines = [];
  lines.push('# i18n 键审计报告');
  lines.push('');
  lines.push('- 范围: src/**/*.js, src/**/*.html 与 _locales/*/messages.json');
  lines.push('- 生成时间: ' + new Date().toISOString());
  lines.push('');
  lines.push('## 代码中使用到的键');
  lines.push(used.length ? used.map(k => `- ${k}`).join('\n') : '- 无');
  lines.push('');
  lines.push('## 缺失的键');
  lines.push('### zh_CN 缺失');
  lines.push(zhOnly.length ? zhOnly.map(k => `- ${k}`).join('\n') : '- 无');
  lines.push('');
  lines.push('### en 缺失');
  lines.push(enOnly.length ? enOnly.map(k => `- ${k}`).join('\n') : '- 无');
  lines.push('');
  lines.push('## 未使用的键');
  lines.push('### zh_CN 未使用');
  lines.push(unusedZh.length ? unusedZh.map(k => `- ${k}`).join('\n') : '- 无');
  lines.push('');
  lines.push('### en 未使用');
  lines.push(unusedEn.length ? unusedEn.map(k => `- ${k}`).join('\n') : '- 无');

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  console.log('i18n 审计报告已生成:', path.relative(repoRoot, reportPath));
}

main();