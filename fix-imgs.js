// 修复：正确地把 imgs 插入 TREND_RANK（而不是误插到 STYLE_LIBRARY），并清理误插
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const HTML = "index.html";
const REF = path.join(__dirname, "ref-imgs");
let html = fs.readFileSync(HTML, "utf8");

// 1) 定位 TREND_RANK 块
const rankM = html.match(/const TREND_RANK = \{[\s\S]*?\n\};/);
if (!rankM) { console.log("✗ 找不到 TREND_RANK"); process.exit(1); }
const rankSrc = rankM[0];
const rank = vm.runInNewContext(rankSrc + ";TREND_RANK", {});

// 2) 在 TREND_RANK 块内为缺 imgs 的条目插入（块内 id 唯一，安全）
let newRank = rankSrc;
let fixed = 0;
for (const s of rank.top) {
  if (s.imgs && s.imgs.length) continue;
  const dir = path.join(REF, s.id);
  const files = ["1.png", "2.png", "3.png"].filter(f => fs.existsSync(path.join(dir, f)));
  if (!files.length) { console.log("  跳过(无截图): " + s.id); continue; }
  const escId = s.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const imgsStr = 'imgs:["' + files.map(f => "ref-imgs/" + s.id + "/" + f).join('","') + '"]';
  // 有 img 字段 → 插到 img 之后；无 img → 插到 tagline 前
  const reImg = new RegExp('(id:"' + escId + '"[^}]*?)(img:"data:image/[^"]*")');
  const reTag = new RegExp('(id:"' + escId + '"[^}]*?)(tagline:)');
  if (reImg.test(newRank)) {
    newRank = newRank.replace(reImg, "$1" + imgsStr + ", $2");
    fixed++;
  } else if (reTag.test(newRank)) {
    newRank = newRank.replace(reTag, "$1" + imgsStr + ", $2");
    fixed++;
  } else {
    console.log("  跳过(无插入点): " + s.id);
  }
}
console.log("TREND_RANK 插入 imgs: " + fixed + " 条");

// 3) 清理 STYLE_LIBRARY 块内被误插的 imgs（ref-imgs 相对路径）
const libM = html.match(/const STYLE_LIBRARY = \[[\s\S]*?\];/);
if (libM) {
  const cleaned = libM[0].replace(/, imgs:\["ref-imgs\/[^\]]*\]/g, "");
  if (cleaned !== libM[0]) console.log("STYLE_LIBRARY 清理误插 imgs: " + (libM[0].match(/, imgs:\["ref-imgs\/[^\]]*\]/g) || []).length + " 处");
  html = html.replace(libM[0], cleaned);
}

// 4) 替换回 HTML
html = html.replace(rankM[0], newRank);
fs.writeFileSync(HTML, html);

// 5) 验证
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const m2 = src.match(/const TREND_RANK = \{[\s\S]*?\n\};/);
const r2 = vm.runInNewContext(m2[0] + ";TREND_RANK", {});
const withImgs = r2.top.filter(s => s.imgs && s.imgs.length);
console.log("最终: " + withImgs.length + "/18 条有 imgs" + (withImgs.length !== 18 ? " → 缺: " + r2.top.filter(s => !(s.imgs && s.imgs.length)).map(s => s.id).join(",") : " ✓ 全部就绪"));
