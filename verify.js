const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
if (html.includes("__IMG")) { console.error("残留占位符!"); process.exit(1); }
const m = html.match(/<script>([\s\S]*?)<\/script>/);
try { new Function(m[1]); } catch (e) { console.error("语法错误: " + e.message); process.exit(1); }
console.log("JS 语法通过 ✓ 无残留占位符 ✓");
const src = m[1];
const libStart = src.indexOf("const STYLE_LIBRARY");
const libEnd = src.indexOf("];", libStart) + 2;
const lib = require("vm").runInNewContext(src.slice(libStart, libEnd) + ";STYLE_LIBRARY", {});
const withImg = lib.filter(s => s.img && s.img.startsWith("data:image/jpeg"));
const cats = [...new Set(lib.map(s => s.cat))];
console.log("风格数: " + lib.length + " | 参考图: " + withImg.length + " | 分类: " + cats.length + " 类");
const femaleNew = lib.filter(s => ["frenchchic","officesiren","preppy","coquette"].includes(s.id)).map(s => s.name);
console.log("新增女性风格: " + femaleNew.join(", "));
console.log("趋势函数: " + (src.includes("loadTrending") && src.includes("fetchSuggestions") && src.includes("jsonp") ? "OK" : "缺失!"));
const p = src.match(/aiPersona:"([^"]+)/);
console.log("aiPersona 默认: " + (p ? p[1] : "未找到"));
// TREND_RANK 校验
const rankM = src.match(/const TREND_RANK = \{[\s\S]*?\n\};/);
if (rankM) {
  const rank = require("vm").runInNewContext(rankM[0] + ";TREND_RANK", {});
  const top = rank.top || [];
  const ranks = top.map(x => x.rank);
  const dup = ranks.filter((r, i) => ranks.indexOf(r) !== i);
  const need = ["rank","id","name","emoji","cat","trend","hot","tagline","desc","items","colors","scenes","tags","searchKw","formula"];
  let bad = 0;
  top.forEach(s => need.forEach(k => { if (s[k] === undefined || (Array.isArray(s[k]) && !s[k].length)) { console.log("  WARN " + s.id + " 缺 " + k); bad++; } }));
  const withImg = top.filter(s => s.img && s.img.startsWith("data:image")).length;
  console.log("趋势榜: " + top.length + " 条 | 排名重复: " + (dup.length ? dup.join(",") : "无") + " | 配图: " + withImg + " 张 | 更新日期: " + rank.updatedAt);
  if (top.length !== 18) console.log("  WARN 榜单应为 18 条，当前 " + top.length);
  if (bad) process.exit(1);
} else {
  console.log("趋势榜: 未找到 TREND_RANK");
}
console.log("文件大小: " + (fs.statSync("index.html").size / 1024).toFixed(0) + "KB");
