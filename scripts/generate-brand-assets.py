"""
VYNK Official Brand Asset Generation Pipeline
Processes the source image containing the official three-interlocking-hands logo
(Green, Yellow, Red) and generates production-ready assets for web, PWA, favicons,
and social sharing.
"""

import os
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SOURCE_IMAGE_PATH = r"C:/Users/Asmitha/.gemini/antigravity/brain/075eebcb-c67d-45ba-b353-d801cb4236ab/.user_uploaded/media_1795366898581_308846dc.png"
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT_DIR, "apps", "web", "public")
ASSETS_DIR = os.path.join(ROOT_DIR, "apps", "web", "src", "assets")

os.makedirs(PUBLIC_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

print("==================================================")
print(" VYNK OFFICIAL BRAND ASSET GENERATION")
print("==================================================")

# 1. Preserve original source artwork
shutil.copyfile(SOURCE_IMAGE_PATH, os.path.join(PUBLIC_DIR, "vynk-logo-source.png"))
shutil.copyfile(SOURCE_IMAGE_PATH, os.path.join(ASSETS_DIR, "vynk-logo-source.png"))
print("[1/8] Preserved original source image -> vynk-logo-source.png")

# 2. Open source image and analyze
src_im = Image.open(SOURCE_IMAGE_PATH).convert("RGBA")
src_w, src_h = src_im.size
arr = np.array(src_im, dtype=np.float32)

# Source background color is dark navy: rgb(23, 29, 41)
bg = np.array([23.0, 29.0, 41.0])
dist = np.sqrt(np.sum((arr[:, :, :3] - bg)**2, axis=2))

# 3. Create transparent version with un-premultiplied anti-aliased edges
t_low = 14.0
t_high = 55.0
alpha = np.clip((dist - t_low) / (t_high - t_low), 0.0, 1.0) * 255.0

a_norm = alpha / 255.0
fg_rgb = np.zeros_like(arr[:, :, :3])
mask = a_norm > 0.01

for c in range(3):
    fg_rgb[:, :, c] = np.where(
        mask,
        np.clip((arr[:, :, c] - (1.0 - a_norm) * bg[c]) / np.maximum(a_norm, 0.05), 0, 255),
        arr[:, :, c]
    )

transparent_arr = np.dstack([fg_rgb, alpha]).astype(np.uint8)
transparent_im = Image.fromarray(transparent_arr, "RGBA")

# Crop to tight bounding box of the hands
bbox = transparent_im.getbbox()
hands_cropped = transparent_im.crop(bbox)
hands_w, hands_h = hands_cropped.size
print(f"[2/8] Extracted hands symbol with clean transparency: {hands_w}x{hands_h}")

# 4. Create Master 512x512 Transparent Icon
master_512 = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
# Scale hands to fit nicely with ~48px padding (target height ~420px)
target_h = 424
scale_ratio = target_h / hands_h
target_w = int(hands_w * scale_ratio)
scaled_hands = hands_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
offset_x = (512 - target_w) // 2
offset_y = (512 - target_h) // 2
master_512.paste(scaled_hands, (offset_x, offset_y), scaled_hands)

# Save primary logo and symbol assets
master_512.save(os.path.join(PUBLIC_DIR, "vynk-logo.png"), format="PNG", optimize=True)
master_512.save(os.path.join(PUBLIC_DIR, "vynk-symbol.png"), format="PNG", optimize=True)
master_512.save(os.path.join(ASSETS_DIR, "logo.png"), format="PNG", optimize=True)
master_512.save(os.path.join(ASSETS_DIR, "vynk-symbol.png"), format="PNG", optimize=True)
print("[3/8] Created master 512x512 transparent logo -> vynk-logo.png & vynk-symbol.png")

# 5. Create Dark-Navy Original Background Master (512x512)
master_dark_512 = Image.new("RGBA", (512, 512), (23, 29, 41, 255))
master_dark_512.paste(scaled_hands, (offset_x, offset_y), scaled_hands)
master_dark_512.save(os.path.join(PUBLIC_DIR, "vynk-logo-dark.png"), format="PNG", optimize=True)
master_dark_512.save(os.path.join(ASSETS_DIR, "vynk-logo-dark.png"), format="PNG", optimize=True)
print("[4/8] Created master 512x512 original dark background logo -> vynk-logo-dark.png")

# 6. Create Favicons and App Icons
# 16x16, 32x32, 48x48, 64x64, 180x180, 192x192
fav_16 = master_512.resize((16, 16), Image.Resampling.LANCZOS)
fav_32 = master_512.resize((32, 32), Image.Resampling.LANCZOS)
fav_48 = master_512.resize((48, 48), Image.Resampling.LANCZOS)
fav_64 = master_512.resize((64, 64), Image.Resampling.LANCZOS)

# Save multi-size favicon.ico
fav_64.save(
    os.path.join(PUBLIC_DIR, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
)
fav_32.save(os.path.join(PUBLIC_DIR, "favicon.png"), format="PNG")
fav_32.save(os.path.join(PUBLIC_DIR, "favicon-32x32.png"), format="PNG")
fav_16.save(os.path.join(PUBLIC_DIR, "favicon-16x16.png"), format="PNG")
print("[5/8] Created multi-size favicon.ico and PNG favicons (16x16, 32x32)")

# 192x192 PWA Icon
icon_192 = master_512.resize((192, 192), Image.Resampling.LANCZOS)
icon_192.save(os.path.join(PUBLIC_DIR, "icon-192.png"), format="PNG", optimize=True)

# 512x512 PWA Icon
master_512.save(os.path.join(PUBLIC_DIR, "icon-512.png"), format="PNG", optimize=True)

# Apple Touch Icon (180x180 with clean container padding)
apple_icon = Image.new("RGBA", (180, 180), (10, 10, 15, 255))
scaled_hands_apple = hands_cropped.resize((140, int(140 * hands_h / hands_w)), Image.Resampling.LANCZOS)
ay = (180 - scaled_hands_apple.size[1]) // 2
ax = (180 - 140) // 2
apple_icon.paste(scaled_hands_apple, (ax, ay), scaled_hands_apple)
apple_icon.save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), format="PNG", optimize=True)
print("[6/8] Created PWA & Apple Touch Icons -> icon-192.png, icon-512.png, apple-touch-icon.png")

# 7. Create Social Sharing Card (og-image.png: 1200 x 630)
og_im = Image.new("RGBA", (1200, 630), (10, 10, 15, 255))
draw = ImageDraw.Draw(og_im)

# Draw subtle ambient background glow
for r in range(300, 50, -20):
    alpha_glow = int(18 * (1.0 - r / 300.0))
    draw.ellipse(
        [(600 - r, 250 - r), (600 + r, 250 + r)],
        fill=(124, 92, 255, alpha_glow)
    )

# Paste hands symbol on left side of lockup
symbol_og_h = 240
symbol_og_w = int(hands_w * (symbol_og_h / hands_h))
symbol_og = hands_cropped.resize((symbol_og_w, symbol_og_h), Image.Resampling.LANCZOS)

# Center the lockup: symbol + wordmark
# Symbol width ~ 216, Wordmark width ~ 420, gap ~ 48 => Total width ~ 684
lockup_total_w = symbol_og_w + 48 + 380
start_x = (1200 - lockup_total_w) // 2
symbol_y = 150

og_im.paste(symbol_og, (start_x, symbol_y), symbol_og)

# Fonts
font_title = None
font_sub = None
font_tagline = None
try:
    font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 96)
    font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 26)
    font_tagline = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 30)
except Exception:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_tagline = ImageFont.load_default()

text_x = start_x + symbol_og_w + 48
draw.text((text_x, symbol_y + 20), "VYNK", font=font_title, fill=(255, 255, 255, 255))
draw.text((text_x + 6, symbol_y + 130), "STUDENT COLLABORATION PLATFORM", font=font_sub, fill=(16, 229, 153, 230))
draw.text((text_x + 6, symbol_y + 175), "Campus OS • Coimbatore", font=font_sub, fill=(160, 160, 185, 200))

# Bottom tagline banner
tagline = "Find your people. Learn. Build. Rise."
draw.text((600, 480), tagline, font=font_tagline, fill=(253, 186, 75, 255), anchor="mm")
sub_tagline = "Connecting ambitious students across engineering, technology & arts colleges"
draw.text((600, 525), sub_tagline, font=font_sub, fill=(140, 140, 160, 220), anchor="mm")

og_im.convert("RGB").save(os.path.join(PUBLIC_DIR, "og-image.png"), format="PNG", quality=95)
print("[7/8] Created OpenGraph / Social Sharing Card (1200x630) -> og-image.png")

# 8. Verification summary
print("[8/8] Asset verification:")
for fname in ["vynk-logo.png", "vynk-symbol.png", "vynk-logo-dark.png", "vynk-logo-source.png",
              "favicon.ico", "favicon.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "og-image.png"]:
    p = os.path.join(PUBLIC_DIR, fname)
    if os.path.exists(p):
        print(f"  [PASS] {fname}: {os.path.getsize(p):,} bytes")
    else:
        print(f"  [FAIL] {fname}: MISSING")

print("==================================================")
print(" ASSET GENERATION COMPLETED SUCCESSFULLY")
print("==================================================")
