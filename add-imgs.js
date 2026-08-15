// 给 TREND_RANK 的 neochinese 条目插入 imgs（3张百度CDN真实穿搭图）
const fs = require("fs");
const HTML = "index.html";
let html = fs.readFileSync(HTML, "utf8");

const imgs = [
  "https://img1.baidu.com/it/u=4119005020,3100216068&fm=253&fmt=auto&app=138&f=JPEG?w=800",
  "https://img0.baidu.com/it/u=4255951488,4287927332&fm=253&fmt=auto&app=138&f=JPEG?w=800",
  "https://img2.baidu.com/it/u=1953933509,3970326347&fm=253&fmt=auto&app=138&f=JPEG?w=800"
];
const imgsStr = 'imgs:["' + imgs.join('","') + '"], ';

// 匹配 TREND_RANK 里的 neochinese（带 rank:6 前缀），在 img 字段前插入 imgs
const re = /(rank:6, id:"neochinese", name:"新中式", emoji:"🀄", )(img:"data:image\/jpeg;base64,)/;
if (re.test(html)) {
  html = html.replace(re, "$1" + imgsStr + "$2");
  console.log("✓ 已给 neochinese 插入 3 张真实图 URL");
} else {
  console.log("✗ 未找到匹配，检查特征串");
  process.exit(1);
}

fs.writeFileSync(HTML, html);
