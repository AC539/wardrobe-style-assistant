// 批量把 TREND_RANK 各条目 imgs 指向 ref-imgs/<id>/N.png（截图存在时）
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const HTML = "index.html";
const REF = path.join(__dirname, "ref-imgs");
let html = fs.readFileSync(HTML, "utf8");
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// 提取 TREND_RANK 当前内容（对象结构）
const rankM = src.match(/const TREND_RANK = \{[\s\S]*?\n\};/);
if (!rankM) { console.log("✗ 找不到 TREND_RANK"); process.exit(1); }
const rank = vm.runInNewContext(rankM[0] + ";TREND_RANK", {});

let updated = 0, skipped = [];
for (const s of rank.top) {
  const dir = path.join(REF, s.id);
  const files = ["1.png", "2.png", "3.png"].filter(f => fs.existsSync(path.join(dir, f)));
  if (!files.length) { skipped.push(s.id + "(无截图)"); continue; }
  const imgs = files.map(f => `"ref-imgs/${s.id}/${f}"`).join(", ");
  // 替换该条目 imgs:[...]（若存在）或在其 rank 行插入
  const escId = s.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp('(id:"' + escId + '"[^\\[]*?imgs:\\[)[^\\]]*(\\])');
  if (re.test(html)) {
    html = html.replace(re, "$1" + imgs + "$2");
    updated++;
  } else {
    // 无 imgs 字段：在 img:"..." 之后插入（如果没有 img 字段，在 tagline 前插入）
    const re2 = new RegExp('(id:"' + escId + '"[^}]*?)(tagline:)');
    if (re2.test(html)) {
      html = html.replace(re2, "$1imgs:[" + imgs + "], $2");
      updated++;
    } else {
      skipped.push(s.id + "(无插入点)");
    }
  }
}
fs.writeFileSync(HTML, html);
console.log(`更新 ${updated} 条 imgs 指向截图`);
if (skipped.length) console.log("跳过: " + skipped.join(", "));
