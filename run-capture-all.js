// 批量截图：为每个风格打开 B 站搜索并截 3 张参考图（复用 agent-browser daemon）
const { spawnSync } = require("child_process");
const path = require("path");

const NODE = "C:/Users/AC539/.workbuddy/binaries/node/versions/22.22.2/node.exe";
const AB = "C:/Users/AC539/.workbuddy/binaries/node/versions/22.22.2/node_modules/agent-browser/bin/agent-browser.js";
const BASE = "C:/Users/AC539/WorkBuddy/2026-08-15-16-35-17/wardrobe-app/ref-imgs";

const styles = [
  ["knit-skirt", "针织衫半身裙穿搭"],
  ["retroactive", "复古运动风穿搭"],
  ["utility", "工装机能风穿搭"],
  ["jeweltone", "宝石色调穿搭"],
  ["coastal", "海岸度假风穿搭"],
  ["frenchchic", "法式穿搭"],
  ["officesiren", "职场穿搭 通勤"],
  ["y2k", "Y2K穿搭"],
  ["preppy", "学院风穿搭"],
  ["coquette", "碎花裙穿搭"],
  ["dopamine", "多巴胺穿搭"],
  ["balletcore", "芭蕾风穿搭"],
  ["cleanfit", "Clean Fit 穿搭"],
  ["quietluxury", "静奢风穿搭"],
  ["oldmoney", "老钱风穿搭"],
  ["greycore", "格雷系穿搭"],
  ["wasteland", "废土风穿搭"]
];

function ab(args) {
  const r = spawnSync(NODE, [AB, ...args], { encoding: "utf8", timeout: 30000 });
  return (r.stdout || "") + (r.stderr || "");
}
function wait(ms) {
  spawnSync(NODE, ["-e", `setTimeout(()=>{},${ms})`], { timeout: ms + 5000 });
}
function mkdir(p) {
  const fs = require("fs");
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

let ok = 0, fail = [];
for (const [id, kw] of styles) {
  const dir = path.join(BASE, id);
  mkdir(dir);
  const url = "https://search.bilibili.com/all?keyword=" + encodeURIComponent(kw);
  console.log(`▶ ${id} (${kw})`);
  try {
    ab(["open", url]);
    wait(4000);
    // 移除可能的登录浮层（尽力而为，不影响主流程）
    ab(["eval", `document.querySelectorAll('div').forEach(d=>{const c=(d.className||'')+' '+(d.id||'');if(/login-tip|login-card|guide|popup|float-window/i.test(c)&&d.children.length<8)d.remove();}); 'ok'`]);
    wait(800);
    ab(["eval", "window.scrollTo(0,0)"]);
    wait(1200);
    ab(["screenshot", "", path.join(dir, "1.png")]);
    ab(["eval", "window.scrollTo(0,900)"]);
    wait(1400);
    ab(["screenshot", "", path.join(dir, "2.png")]);
    ab(["eval", "window.scrollTo(0,1800)"]);
    wait(1400);
    ab(["screenshot", "", path.join(dir, "3.png")]);
    console.log(`  ✓ 3 张截图完成`);
    ok++;
  } catch (e) {
    console.log(`  ✗ 失败: ${e.message.slice(0, 60)}`);
    fail.push(id);
  }
}
ab(["close"]);
console.log(`\n完成: ${ok}/${styles.length} 成功${fail.length ? "，失败: " + fail.join(",") : ""}`);
