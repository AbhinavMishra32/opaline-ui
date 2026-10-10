import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width":1440,"height":1000}, device_scale_factor=2, color_scheme="light")
        await pg.goto("http://localhost:3011/", wait_until="networkidle")
        await pg.evaluate("document.documentElement.classList.remove('dark')")
        win = pg.locator("text=Flaky login test").first
        await pg.evaluate("window.scrollTo(0, 560)")
        for i,t in enumerate([0.6,2.5,4.5,7.0,9.5,13,18]):
            await pg.wait_for_timeout(int((t-( [0,0.6,2.5,4.5,7.0,9.5,13][i]))*1000))
            await pg.screenshot(path=f"ref/home_{i}.png")
        pg2 = await b.new_page(viewport={"width":1440,"height":1000}, device_scale_factor=2, color_scheme="light")
        await pg2.goto("http://localhost:3011/docs/agent-thread/model-picker", wait_until="networkidle")
        await pg2.screenshot(path="ref/mp_0.png")
        btn = pg2.get_by_role("button", name="Model").first
        await btn.click(); await pg2.wait_for_timeout(500)
        await pg2.screenshot(path="ref/mp_1.png")
        await pg2.get_by_role("menuitem", name="Anthropic").first.hover(); await pg2.wait_for_timeout(600)
        await pg2.screenshot(path="ref/mp_2.png")
        await pg2.keyboard.press("Escape"); await pg2.wait_for_timeout(300)
        eff = pg2.get_by_role("button", name="Effort").first
        if await eff.count():
            await eff.click(); await pg2.wait_for_timeout(500); await pg2.screenshot(path="ref/mp_3.png")
        await b.close()
asyncio.run(main())
