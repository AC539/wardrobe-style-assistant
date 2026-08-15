// 将 style-imgs 下的 6 张风格参考图转 base64 注入 index.html 的占位符
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "style-imgs");
const htmlPath = path.join(__dirname, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");

const files = fs.readdirSync(dir).filter(f => f.endsWith(".png"));
const mapping = [
  ["__IMG_cleanfit__", "白色重磅纯棉T恤"],
  ["__IMG_utility__", "军绿色多袋工装裤"],
  ["__IMG_neochinese__", "月白色盘扣立领衬衫"],
  ["__IMG_jeweltone__", "祖母绿宝石色调缎面衬衫"],
  ["__IMG_coastal__", "白色亚麻衬衫"],
  ["__IMG_retroactive__", "藏青色尼龙防风夹克"]
];

let replaced = 0, missing = [];
for (const [placeholder, keyword] of mapping) {
  const f = files.find(fn => fn.includes(keyword));
  if (!f) { missing.push(keyword); continue; }
  const b64 = fs.readFileSync(path.join(dir, f)).toString("base64");
  const dataUrl = "data:image/png;base64," + b64;
  if (!html.includes(placeholder)) { missing.push(placeholder + "(占位符不存在)"); continue; }
  html = html.split(placeholder).join(dataUrl);
  replaced++;
}
fs.writeFileSync(htmlPath, html);
console.log(`已注入 ${replaced}/6 张图片，原始图片总大小: ${files.reduce((a,f)=>a+fs.statSync(path.join(dir,f)).size,0/1024/1024)||""}`);
const kb = files.reduce((a,f)=>a+fs.statSync(path.join(dir,f)).size,0)/1024;
console.log(`图片合计 ${kb.toFixed(0)}KB，注入后文件大小: ${(fs.statSync(htmlPath).size/1024).toFixed(0)}KB`);
if (missing.length) console.log("未处理:", missing.join(", "));
process.exit(missing.length ? 1 : 0);
