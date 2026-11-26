// Exercises shelf selection, persisted placement counts, and real SVG/PNG downloads.
import { test, expect, type Page, type Download } from '@playwright/test';

const representatives = [
  ['顔', 'もも色の子猫', 'Peach Kitten'],
  ['胴体', 'ぽてっと抱っこ胴体', 'Cuddly Body'],
  ['毛柄・頬', 'もも色そばかす', 'Peach Freckles'],
  ['耳', 'もも色の折れ耳', 'Folded Peach Ear'],
  ['目', 'やさしいまつげ目', 'Gentle Lashes'],
  ['鼻', 'もも色ハート鼻', 'Peach Heart Nose'],
  ['口', 'ぺろっと小さな舌', 'Tiny Tongue'],
  ['肉球', 'ふわふわ前足セット', 'Soft Paw Pair'],
  ['しっぽ', 'ふんわり輪っかしっぽ', 'Soft Loop Tail'],
  ['ひげ', 'ぴんと上向きひげ', 'Upturned Whiskers'],
  ['表情', 'てれちゃう頬マーク', 'Shy Blush'],
  ['アクセント', 'もも色のふんわりマフラー', 'Cat Scarf']
] as const;

async function objectCount(page: Page) {
  await page.getByRole('button', { name: '保存', exact: true }).click();
  return page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('uinya:canvas:v1') ?? 'null');
    return saved?.canvas.fabricJson.objects.length ?? 0;
  });
}

async function addPart(page: Page, name: string, expectedCount: number) {
  const card = page.getByRole('button', { name, exact: true });
  await expect(card).toBeVisible();
  const image = card.locator('img');
  await expect.poll(() => image.evaluate((img: HTMLImageElement) =>
    img.complete && img.naturalWidth > 0)).toBe(true);
  await card.click();
  await expect.poll(() => objectCount(page)).toBe(expectedCount);
}

async function downloadBytes(download: Download): Promise<Uint8Array> {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Download stream was unavailable');
  const bytes: number[] = [];
  for await (const chunk of stream) bytes.push(...(chunk as Uint8Array));
  return new Uint8Array(bytes);
}

async function checkDownloads(page: Page) {
  await page.getByRole('spinbutton', { name: '書き出し幅（px）' }).fill('511');
  await page.getByRole('spinbutton', { name: '書き出し高さ（px）' }).fill('129');
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  const svg = new TextDecoder().decode(await downloadBytes(await svgDownload));
  const dimensions = await page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
    return {
      error: Boolean(doc.querySelector('parsererror')),
      width: doc.documentElement.getAttribute('width'),
      height: doc.documentElement.getAttribute('height'),
      shapes: doc.querySelectorAll('path,rect,ellipse,circle').length
    };
  }, svg);
  expect(dimensions.error).toBe(false);
  expect(dimensions.width).toBe('511');
  expect(dimensions.height).toBe('129');
  expect(dimensions.shapes).toBeGreaterThan(0);

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const png = await downloadBytes(await pngDownload);
  expect(Array.from(png.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = new DataView(png.buffer, png.byteOffset, png.byteLength);
  expect(header.getUint32(16)).toBe(511);
  expect(header.getUint32(20)).toBe(129);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4187/') && response.status() >= 400) {
      errors.push(response.status() + ' ' + response.url());
    }
  });
  page.on('requestfailed', request => {
    errors.push('Request failed: ' + request.url());
  });
  // Fonts are external to the editor flow and should not make tests network-dependent.
  await page.route('https://fonts.googleapis.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto('./');
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'パーツ', exact: true }).click();
  // Register before test actions so errors are checked even when a later assertion fails.
  test.info().annotations.push({ type: 'base-path', description: '/UInya/' });
  browserErrors.set(page, errors);
});

const browserErrors = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

test('all twelve categories place parts and export at the requested dimensions', async ({ page }) => {
  for (const [index, [category, ja, en]] of representatives.entries()) {
    await page.getByRole('button', { name: category, exact: true }).click();
    await addPart(page, ja, index + 1);
    await page.getByRole('button', { name: 'JA EN', exact: true }).click();
    await expect(page.getByRole('button', { name: en, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'JA EN', exact: true }).click();
  }
  await checkDownloads(page);
});

test('Christmas accessories can be placed and exported', async ({ page }) => {
  await page.getByRole('button', { name: 'アクセント', exact: true }).click();
  await addPart(page, 'ねこのサンタ帽', 1);
  await addPart(page, '肉球のプレゼント箱', 2);
  await checkDownloads(page);
});

test('Christmas collection spans all four shelves', async ({ page }) => {
  await page.getByRole('button', { name: 'テンプレート', exact: true }).click();
  const template = page.getByRole('button', { name: 'ねこ耳のクリスマスリース', exact: true }).first();
  await expect.poll(() => template.locator('img').evaluate((img: HTMLImageElement) =>
    img.complete && img.naturalWidth > 0)).toBe(true);
  await template.click();
  await expect.poll(() => objectCount(page)).toBe(1);

  await page.getByRole('button', { name: 'パーツ', exact: true }).click();
  await page.getByRole('button', { name: 'アクセント', exact: true }).click();
  await addPart(page, 'ひいらぎリボン', 2);

  await page.getByRole('button', { name: 'シルエット', exact: true }).click();
  await page.getByRole('button', { name: 'クラシック', exact: true }).click();
  await addPart(page, 'サンタ帽のおすわり猫', 3);

  await page.getByRole('button', { name: '用途別UI', exact: true }).click();
  await page.getByRole('button', { name: /^クリスマスのごあいさつ/ }).click();
  await expect.poll(() => objectCount(page)).toBe(6);
  await test.info().attach('Christmas assets on canvas', {
    body: await page.screenshot(), contentType: 'image/png'
  });
  await checkDownloads(page);
});
