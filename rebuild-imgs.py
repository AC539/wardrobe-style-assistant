# -*- coding: utf-8 -*-
# 将 6 个风格的旧男性参考图替换为 style-imgs-f 下的女性参考图（压缩注入）
import base64, io, os, re
from PIL import Image

HTML = os.path.join(os.path.dirname(__file__), "index.html")
IMG_DIR = os.path.join(os.path.dirname(__file__), "style-imgs-f")

# 风格 id -> 新图文件名关键词
mapping_f = [
    ("cleanfit", "白色收腰重磅T恤"),
    ("utility", "军绿色多袋工装裤"),
    ("neochinese", "月白色盘扣改良旗袍上衣"),
    ("jeweltone", "祖母绿宝石色调缎面衬衫裙"),
    ("coastal", "白色亚麻连衣裙"),
    ("retroactive", "藏青色尼龙防风夹克"),
]

html = open(HTML, encoding="utf-8").read()

# Step1: 把旧 dataURL 替换为占位符（按风格 id 定位其 img 字段）
for sid, _ in mapping_f:
    pat = re.compile(r'(id:"%s".*?img:")data:image/(?:png|jpeg);base64,[^"]*(")' % sid, re.S)
    html, n = pat.subn(lambda m: m.group(1) + "__IMGF_%s__" % sid + m.group(2), html)
    if n == 0:
        print("WARN: %s 未找到旧图 dataURL（可能已被替换）" % sid)

# Step2: 压缩新图并注入
total = 0
for sid, kw in mapping_f:
    f = [x for x in os.listdir(IMG_DIR) if x.endswith(".png") and kw in x]
    if not f:
        print("WARN: %s 缺少图片文件（%s）" % (sid, kw)); continue
    im = Image.open(os.path.join(IMG_DIR, f[0])).convert("RGB")
    im.thumbnail((512, 768), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=78, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    total += len(buf.getvalue())
    ph = "__IMGF_%s__" % sid
    if ph not in html:
        print("WARN: %s 占位符不存在" % ph); continue
    html = html.replace(ph, "data:image/jpeg;base64," + b64)

open(HTML, "w", encoding="utf-8").write(html)
print("新图合计 %.0fKB | index.html: %.0fKB" % (total/1024, os.path.getsize(HTML)/1024))
print("残留占位符: %d" % html.count("__IMGF_"))
