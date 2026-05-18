from PIL import Image
import os

SRC  = "turquoise-auto-logo.png"
DEST = "favicon"
os.makedirs(DEST, exist_ok=True)

print(f"Opening {SRC}...")
img = Image.open(SRC).convert("RGBA")

SIZES = {
    "favicon-16x16.png":   16,
    "favicon-32x32.png":   32,
    "favicon-48x48.png":   48,
    "apple-touch-icon.png":180,
    "android-192.png":     192,
    "android-512.png":     512,
}

for filename, size in SIZES.items():
    out = img.resize((size, size), Image.LANCZOS)
    out.save(os.path.join(DEST, filename), "PNG", optimize=True)
    print(f"  Saved {DEST}/{filename}  ({size}x{size})")

ico_path = os.path.join(DEST, "favicon.ico")
ico_imgs = [img.resize((s, s), Image.LANCZOS) for s in (16, 32, 48)]
ico_imgs[0].save(
    ico_path,
    format="ICO",
    sizes=[(s, s) for s in (16, 32, 48)],
    append_images=ico_imgs[1:],
)
print(f"  Saved {DEST}/favicon.ico  (16, 32, 48 px)")

manifest = """{
  "name": "Turquoise Auto Centre Ltd",
  "short_name": "Turquoise Auto",
  "description": "Full-spectrum auto care in Juja, Kiambu County",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#00bcd4",
  "icons": [
    { "src": "/favicon/android-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon/android-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
"""
with open("site.webmanifest", "w") as f:
    f.write(manifest)
print("  Saved site.webmanifest")
print("\nAll done!")