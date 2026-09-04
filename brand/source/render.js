const { chromium } = require('playwright');
const path = require('path');

async function shot(page, file, width, height, outPath, transparent) {
  await page.setViewportSize({ width, height });
  await page.goto('file://' + path.resolve(__dirname, file));
  await page.waitForTimeout(150);
  await page.screenshot({ path: outPath, omitBackground: !!transparent });
  console.log('wrote', outPath);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await shot(page, 'wordmark.html', 1400, 400, path.resolve(__dirname, 'wordmark.png'), true);
  await shot(page, 'feature-graphic.html', 1024, 500, path.resolve(__dirname, 'feature-graphic.png'), false);

  await browser.close();
})();
