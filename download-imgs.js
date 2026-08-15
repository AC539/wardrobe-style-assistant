// 从百度图片搜索下载单张穿搭照（竖版真人图），替换旧的界面截图
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const HTML = "index.html";
const REF = path.join(__dirname, "ref-imgs");

const styles = [
  ["knit-skirt", "针织衫半身裙 穿搭 女生"],
  ["retroactive", "复古运动风 穿搭 女生"],
  ["utility", "工装机能风 穿搭 女生"],
  ["jeweltone", "宝石色 连衣裙 穿搭 女生"],
  ["coastal", "度假风 穿搭 女生"],
  ["neochinese", "新中式 穿搭 女生"],
  ["frenchchic", "法式 穿搭 女生"],
  ["officesiren", "通勤 穿搭 女生 职场"],
  ["y2k", "Y2K 穿搭 女生"],
  ["preppy", "学院风 穿搭 女生"],
  ["coquette", "碎花裙 穿搭 女生"],
  ["dopamine", "多巴胺 穿搭 女生"],
  ["balletcore", "芭蕾风 穿搭 女生"],
  ["cleanfit", "Clean Fit 穿搭 女生"],
  ["quietluxury", "静奢风 穿搭 女生"],
  ["oldmoney", "老钱风 穿搭 女生"],
  ["greycore", "格雷系 穿搭 女生"],
  ["wasteland", "废土风 穿搭"]
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchBaiduImgs(kw, n) {
  const url = "https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&ct=201326592&fp=result&word=" +
    encodeURIComponent(kw) + "&pn=0&rn=" + n + "&ie=utf-8";
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA } });
  clearTimeout(t);
  const j = await r.json();
  return (j.data || [])
    .filter(x => x && x.middleURL && x.height && x.width && (x.height / x.width) >= 1.1)
    .map(x => x.middleURL);
}

async function download(url, file) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA } });
  clearTimeout(t);
  if (!r.ok) throw new Error("HTTP " + r.status);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}

(async () => {
  let ok = 0, fail = [];
  for (const [id, kw] of styles) {
    const dir = path.join(REF, id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.readdirSync(dir).forEach(f => { if (f.endsWith(".png")) { try { fs.unlinkSync(path.join(dir, f)); } catch (e) {} } });
    try {
      const urls = await fetchBaiduImgs(kw, 6);
      if (urls.length < 3) { fail.push(id + "(只拿到" + urls.length + "张)"); console.log("✗ " + id + " 图不足"); continue; }
      for (let i = 0; i < 3; i++) await download(urls[i], path.join(dir, (i + 1) + ".jpg"));
      console.log("✓ " + id + ": 3 张下载完成");
      ok++;
    } catch (e) {
      fail.push(id + "(" + e.message.slice(0, 30) + ")");
      console.log("✗ " + id + ": " + e.message.slice(0, 50));
    }
    await sleep(300);
  }

  let html = fs.readFileSync(HTML, "utf8");
  const rankM = html.match(/const TREND_RANK = \{[\s\S]*?\n\};/);
  let rankSrc = rankM[0];
  const rank = vm.runInNewContext(rankSrc + ";TREND_RANK", {});
  let updated = 0;
  for (const s of rank.top) {
    const dir = path.join(REF, s.id);
    const files = ["1.jpg", "2.jpg", "3.jpg"].filter(f => fs.existsSync(path.join(dir, f)));
    if (!files.length) continue;
    const imgs = files.map(f => '"ref-imgs/' + s.id + '/' + f + '"').join(", ");
    const escId = s.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re1 = new RegExp('(id:"' + escId + '"[^}]*?imgs:\\[)[^\\]]*(\\])');
    const re2 = new RegExp('(id:"' + escId + '"[^}]*?)(img:"data:image/[^"]*")');
    const re3 = new RegExp('(id:"' + escId + '"[^}]*?)(tagline:)');
    if (re1.test(rankSrc)) rankSrc = rankSrc.replace(re1, "$1" + imgs + "$2");
    else if (re2.test(rankSrc)) rankSrc = rankSrc.replace(re2, "$1" + imgs + ", $2");
    else if (re3.test(rankSrc)) rankSrc = rankSrc.replace(re3, "$1" + imgs + ", $2");
    updated++;
  }
  fs.writeFileSync(HTML, html.replace(rankM[0], rankSrc));
  console.log("\n下载完成: " + ok + "/18 | imgs 更新 " + updated + " 条 | 失败: " + (fail.join("; ") || "无"));
})();
