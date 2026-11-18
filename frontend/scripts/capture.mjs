import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const output = fileURLToPath(
  new URL("../../docs/screenshots/", import.meta.url),
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  deviceScaleFactor: 1,
});
try {
  for (const route of ["welcome", "dashboard", "knowledge"]) {
    await page.goto("http://127.0.0.1:5173/#" + route);
    await page.locator("h1").waitFor();
    await page.waitForTimeout(1300);
    await page.screenshot({ path: output + route + ".png", fullPage: true });
  }
  await page.goto("http://127.0.0.1:5173/#playground");
  await page
    .getByRole("button", { name: "Сколько стоит доставка?", exact: false })
    .click();
  await page
    .locator(".telegram-messages .chat-bubble.assistant")
    .filter({ hasText: "Москва от 500 рублей" })
    .waitFor();
  await page
    .getByRole("button", { name: "Хочу оформить заказ", exact: false })
    .click();
  await page.locator(".lead-confirmation").waitFor();
  await page.screenshot({ path: output + "playground.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:5173/#dashboard");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: output + "mobile.png", fullPage: true });
  console.log("Portfolio screenshots saved in docs/screenshots");
} finally {
  await browser.close();
}
