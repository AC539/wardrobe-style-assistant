# -*- coding: utf-8 -*-
# 1) 把已注入的高清 base64 还原为占位符 2) 压缩图片 3) 重新注入小图
import base64, io, os
from PIL import Image

HTML = os.path.join(os.path.dirname(__file__), "index.html")
IMG_DIR = os.path.join(os.path.dirname(__file__), "style-imgs")

mapping = [
    ("__IMG_cleanfit__", "白色重磅纯棉T恤"),
    ("__IMG_utility__", "军绿色多袋工装裤"),
    ("__IMG_neochinese__", "月白色盘扣立领衬衫"),
    ("__IMG_jeweltone__", "祖母绿宝石色调缎面衬衫"),
    ("__IMG_coastal__", "白色亚麻衬衫"),
    ("__IMG_retroactive__", "藏青色尼龙防风夹克"),
]

html = open(HTML, encoding="utf-8").read()

# Step 1: 还原占位符（原图 base64 唯一，可精确替换回去）
for placeholder, kw in mapping:
    f = [x for x in os.listdir(IMG_DIR) if x.endswith(".png") and kw in x][0]
    b64 = base64.b64encode(open(os.path.join(IMG_DIR, f), "rb").read()).decode()
    html = html.replace('img:"data:image/png;base64,%s"' % b64, 'img:"%s"' % placeholder)

# Step 2: 压缩到 512x768 JPEG q78 并注入
total = 0
for placeholder, kw in mapping:
    f = [x for x in os.listdir(IMG_DIR) if x.endswith(".png") and kw in x][0]
    im = Image.open(os.path.join(IMG_DIR, f)).convert("RGB")
    im.thumbnail((512, 768), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=78, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    total += len(buf.getvalue())
    html = html.replace(placeholder, "data:image/jpeg;base64," + b64)

open(HTML, "w", encoding="utf-8").write(html)
print("压缩后图片合计 %.0fKB" % (total / 1024))
print("注入后 index.html: %.0fKB" % (os.path.getsize(HTML) / 1024))
