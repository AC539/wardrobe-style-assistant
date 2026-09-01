// 校验：脚本语法 + TREND_RANK 结构 + 占位符检查
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
let fail = 0;
const ok = m => console.log("✅ " + m);
const bad = m => { fail++; console.log("❌ " + m); };

// 1) 提取全部 <script> 内容，new Function 检查语法
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) bad("未找到 <script>");
scripts.forEach((s, i) => {
  try { new Function(s); ok(`script[${i}] 语法检查通过 (${s.length} 字符)`); }
  catch (e) { bad(`script[${i}] 语法错误: ${e.message}`); }
});

// 2) 解析 TREND_RANK
const m = html.match(/const TREND_RANK = \{[\s\S]*?\n\};/);
if (!m) { bad("未找到 TREND_RANK 块"); }
else {
  try {
    const rank = new Function("return " + m[0].slice(m[0].indexOf("=") + 1))();
    const top = rank.top;
    if (top.length !== 18) bad(`TREND_RANK.top 应有 18 条，实际 ${top.length} 条`);
    else ok("TREND_RANK.top 恰好 18 条");
    const ranks = top.map(e => e.rank);
    const dup = ranks.filter((r, i) => ranks.indexOf(r) !== i);
    if (dup.length) bad(`rank 重复: ${dup.join(",")}`);
    else ok("rank 1-18 无重复: " + ranks.join(","));
    if (Math.min(...ranks) !== 1 || Math.max(...ranks) !== 18) bad("rank 范围异常");
    const ids = new Set(top.map(e => e.id));
    if (ids.size !== 18) bad("id 有重复");
    else ok("id 唯一");
    const noImg = top.filter(e => !e.imgs && !e.img);
    if (noImg.length) console.log("⚠️ 无图条目(前端 emoji 兜底): " + noImg.map(e => e.name).join("、"));
    const missingHot = top.filter(e => e.hot == null);
    if (missingHot.length) bad("缺 hot: " + missingHot.map(e => e.name).join("、"));
    else ok("全部条目含 hot 值");
    const badPrev = top.filter(e => e.prevRank == null).map(e => e.name);
    console.log("ℹ️ 新条目(prevRank=null): " + (badPrev.length ? badPrev.join("、") : "无"));
    // 打印完整榜单
    console.log("\n===== 最终榜单 =====");
    top.forEach(e => console.log(`#${e.rank} [${e.hot}] ${e.name} ${e.emoji} prev=${e.prevRank} imgs=${(e.imgs||[]).length}`));
    // 校验 hot 降序
    const sorted = top.every((e, i) => i === 0 || top[i-1].hot >= e.hot);
    sorted ? ok("hot 降序正确") : bad("hot 未按降序");
    // 校验 updatedAt
    const ua = html.match(/updatedAt:"([^"]+)"/);
    if (ua && ua[1] === "2026-09-01") ok("updatedAt = 2026-09-01");
    else bad("updatedAt 未更新: " + (ua && ua[1]));
  } catch (e) { bad("TREND_RANK 解析失败: " + e.message); }
}

// 3) 占位符检查
const ph = html.match(/__IMG_[A-Za-z0-9_]*__|__TREND_[A-Za-z0-9_]*__/g);
if (ph) bad("存在占位符: " + ph.join(","));
else ok("无 __IMG_/__TREND_ 占位符残留");

// 4) DAILY_TREND 检查
const dm = html.match(/const DAILY_TREND = \{[\s\S]*?\n\};/);
if (!dm) bad("未找到 DAILY_TREND");
else {
  const daily = new Function("return " + dm[0].slice(dm[0].indexOf("=") + 1))();
  if (daily.date !== "2026-09-01") bad("DAILY_TREND.date 未更新: " + daily.date);
  else ok("DAILY_TREND.date = 2026-09-01");
  console.log("   hotKeywords(" + daily.hotKeywords.length + "): " + daily.hotKeywords.slice(0, 6).join(" / ") + " …");
  console.log("   notes(" + daily.notes.length + " 条), styleNotes(" + Object.keys(daily.styleNotes).length + " 条)");
}

console.log(fail ? `\n❌ 校验失败 ${fail} 项` : "\n✅ 全部校验通过");
process.exit(fail ? 1 : 0);
