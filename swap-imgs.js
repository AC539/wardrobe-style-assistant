// 把新中式 imgs 改为本地截图相对路径
const fs = require("fs");
const HTML = "index.html";
let html = fs.readFileSync(HTML, "utf8");

const oldImgs = [
  '"https://img1.baidu.com/it/u=4119005020,3100216068&fm=253&fmt=auto&app=138&f=JPEG?w=800"',
  '"https://img0.baidu.com/it/u=4255951488,4287927332&fm=253&fmt=auto&app=138&f=JPEG?w=800"',
  '"https://img2.baidu.com/it/u=1953933509,3970326347&fm=253&fmt=auto&app=138&f=JPEG?w=800"'
].join(", ");

const newImgs = [
  '"ref-imgs/neochinese/1.png"',
  '"ref-imgs/neochinese/2.png"',
  '"ref-imgs/neochinese/3.png"'
].join(", ");

const re = new RegExp('(rank:6, id:"neochinese", name:"新中式", emoji:"🀄", img:"data:image\\/jpeg;base64,[^"]+", imgs:\\[)' + oldImgs + '(\\])');
if (!re.test(html)) {
  console.log("✗ 未匹配到新中式 imgs 数组");
  console.log("尝试用更宽松的正则...");
  // 宽松匹配：在 neochinese 行里把 imgs:[...] 整段替换
  const re2 = new RegExp('(rank:6, id:"neochinese"[^\\[]*imgs:\\[)[^\\]]*(\\])');
  if (re2.test(html)) {
    html = html.replace(re2, "$1" + newImgs + "$2");
    console.log("✓ 用宽松正则替换成功");
  } else {
    console.log("✗ 宽松正则也未匹配");
    process.exit(1);
  }
} else {
  html = html.replace(re, "$1" + newImgs + "$2");
  console.log("✓ 精确正则替换成功");
}

fs.writeFileSync(HTML, html);