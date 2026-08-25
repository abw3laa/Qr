from PIL import Image, ImageDraw

size = 1024
image = Image.new("RGB", (size, size), "#0B1020")
draw = ImageDraw.Draw(image)

# Soft indigo glow behind the symbol.
draw.ellipse((150, 80, 900, 860), fill="#121D44")
# Connected QR-inspired geometric modules.
modules = [
    (190, 190, 385, 385), (639, 190, 834, 385),
    (190, 639, 385, 834), (470, 470, 650, 650),
    (639, 639, 834, 834), (385, 385, 470, 470),
]
for index, box in enumerate(modules):
    color = "#22D3C5" if index in {0, 3, 4} else "#A5B4FC"
    draw.rounded_rectangle(box, radius=38, fill=color)
    x1, y1, x2, y2 = box
    inset = 46 if (x2 - x1) > 120 else 16
    draw.rounded_rectangle((x1 + inset, y1 + inset, x2 - inset, y2 - inset), radius=22 if inset > 20 else 10, fill="#0B1020")

# Small connection strokes create a single recognizable mark.
draw.rounded_rectangle((385, 265, 639, 310), radius=22, fill="#22D3C5")
draw.rounded_rectangle((265, 385, 310, 639), radius=22, fill="#22D3C5")
draw.rounded_rectangle((714, 385, 759, 639), radius=22, fill="#A5B4FC")
draw.rounded_rectangle((385, 714, 639, 759), radius=22, fill="#A5B4FC")

image.save("assets/images/icon.png", format="PNG", optimize=True)
image.save("assets/images/splash-icon.png", format="PNG", optimize=True)
image.save("assets/images/favicon.png", format="PNG", optimize=True)
image.save("assets/images/android-icon-foreground.png", format="PNG", optimize=True)
