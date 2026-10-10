"""Render the film frame by frame.

  python render.py probe t1 t2 ...      -> out/probe/sheet.png (+ single frames)
  python render.py full [a b]           -> out/frames/*.png (60 fps, motion-blur subframes)
  python render.py encode               -> out/opaline-launch.mp4 (with music)
"""
import asyncio, http.server, os, subprocess, sys, threading, functools, shutil
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1920, 1080, 60
DUR = 11.50
SUB = 4  # subframes per frame (shutter 50%)
PORT = int(os.environ.get('PORT', '8765'))


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=HERE)
    handler.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def page_for(p):
    b = await p.chromium.launch(args=["--force-color-profile=srgb", "--disable-lcd-text"])
    pg = await b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    await pg.goto(f"http://127.0.0.1:{PORT}/film.html")
    await pg.wait_for_function("window.ready === true")
    return b, pg


async def shot(pg, t):
    await pg.evaluate(f"window.seek({t})")
    return Image.open(__import__("io").BytesIO(await pg.screenshot(type="png"))).convert("RGB")


async def probe(times):
    d = os.path.join(HERE, "out/probe"); os.makedirs(d, exist_ok=True)
    async with async_playwright() as p:
        b, pg = await page_for(p)
        ims = []
        for t in times:
            im = await shot(pg, t); im.save(f"{d}/t{t:06.3f}.png"); ims.append(im)
        await b.close()
    cols = min(4, len(ims)); rows = (len(ims) + cols - 1) // cols
    tw = 480; th = int(tw * H / W)
    sheet = Image.new("RGB", (cols * tw, rows * th), "white")
    for i, im in enumerate(ims):
        sheet.paste(im.resize((tw, th), Image.LANCZOS), ((i % cols) * tw, (i // cols) * th))
    sheet.save(f"{d}/sheet.png")


async def full(a, b_):
    d = os.path.join(HERE, "out/frames"); os.makedirs(d, exist_ok=True)
    n0, n1 = int(round(a * FPS)), int(round(b_ * FPS))
    async with async_playwright() as p:
        b, pg = await page_for(p)
        for n in range(n0, n1):
            acc = None
            for s in range(SUB):
                t = (n + 0.5 * s / SUB) / FPS
                arr = np.asarray(await shot(pg, t), np.float32)
                acc = arr if acc is None else acc + arr
            Image.fromarray((acc / SUB + 0.5).astype(np.uint8)).save(f"{d}/f{n:05d}.png")
            if n % 30 == 0: print("frame", n, flush=True)
        await b.close()


def encode():
    out = os.path.join(HERE, "out")
    music = os.path.join(HERE, "../../launch-music-trimmed.mov")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{out}/frames/f%05d.png",
        "-ss", "0", "-t", f"{DUR}", "-i", music,
        "-filter_complex", f"[1:a]afade=t=out:st={DUR - 0.06}:d=0.06[a]",
        "-map", "0:v", "-map", "[a]",
        "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p",
        "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-c:a", "aac", "-b:a", "256k",
        "-shortest", "-movflags", "+faststart", f"{out}/opaline-launch.mp4"], check=True)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "encode":
        encode(); sys.exit()
    srv = serve()
    if cmd == "probe":
        asyncio.run(probe([float(x) for x in sys.argv[2:]]))
    elif cmd == "full":
        a = float(sys.argv[2]) if len(sys.argv) > 2 else 0
        b = float(sys.argv[3]) if len(sys.argv) > 3 else DUR
        asyncio.run(full(a, b))
