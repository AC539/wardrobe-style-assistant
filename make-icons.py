# 生成 PWA 图标：玫瑰渐变 + 白色"衣"字（apple-touch-icon 180 / 192 / 512）
from PIL import Image, ImageDraw, ImageFont

def make_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 圆角矩形背景（径向渐变简化：对角线渐变）
    r = int(size * 0.22)
    top, bottom = (181, 112, 110), (217, 164, 154)
    for y in range(size):
        t = y / size
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (size, y)], fill=c + (255,))
    # 用遮罩裁圆角
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    img.putalpha(mask)
    # 白字"衣"（衬线感）
    for font_path in ["C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/simkai.ttf", "C:/Windows/Fonts/simsun.ttc"]:
        try:
            font = ImageFont.truetype(font_path, int(size * 0.55))
            break
        except Exception:
            font = None
    if font:
        bbox = d.textbbox((0, 0), "衣", font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (size - w) / 2 - bbox[0]
        y = (size - h) / 2 - bbox[1] - int(size * 0.02)
        d.text((x, y), "衣", font=font, fill=(255, 255, 255, 255))
    else:
        d.text((size * 0.28, size * 0.2), "衣", fill=(255, 255, 255, 255))
    return img

import os
base = os.path.dirname(os.path.abspath(__file__))
make_icon(180).save(os.path.join(base, "apple-touch-icon.png"))
make_icon(192).save(os.path.join(base, "icon-192.png"))
make_icon(512).save(os.path.join(base, "icon-512.png"))
print("图标生成完成: apple-touch-icon.png(180) / icon-192.png / icon-512.png")
