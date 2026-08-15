# -*- coding: utf-8 -*-
# 处理 TREND_RANK 图片：复用 STYLE_LIBRARY 已有图 + 注入针织衫新图
import base64, io, os, re
from PIL import Image

HTML = os.path.join(os.path.dirname(__file__), "index.html")
IMG_DIR = os.path.join(os.path.dirname(__file__), "style-imgs-f")

html = open(HTML, encoding="utf-8").read()

# 1) 从 STYLE_LIBRARY 提取已有 6 张女性图 dataURL
for sid in ["cleanfit","utility","neochinese","jeweltone","coastal","retroactive"]:
    m = re.search(r'id:"%s".*?img:"(data:image/[^"]+)"' % sid, html, re.S)
    if m:
        ph = "__IMGF_%s__" % sid
        if ph in html:
            html = html.replace(ph, m.group(1))
            print("复用 %s 图片 ✓" % sid)
        else:
            print("WARN: %s 占位符不存在" % ph)
    else:
        print("WARN: STYLE_LIBRARY 中 %s 无图" % sid)

# 2) 注入针织衫+半身裙新图（压缩）
f = [x for x in os.listdir(IMG_DIR) if "鹅黄色修身针织开衫" in x]
if f:
    im = Image.open(os.path.join(IMG_DIR, f[0])).convert("RGB")
    im.thumbnail((512, 768), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=78, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    html = html.replace("__TREND_knit__", "data:image/jpeg;base64," + b64)
    print("注入针织衫新图 ✓")
else:
    print("WARN: 未找到针织衫图片文件")

open(HTML, "w", encoding="utf-8").write(html)
print("残留占位符: %d" % (html.count("__IMGF_") + html.count("__TREND_")))
print("index.html: %.0fKB" % (os.path.getsize(HTML) / 1024))
