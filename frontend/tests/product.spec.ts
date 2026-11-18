import { test, expect } from "@playwright/test";

test("complete portfolio flow: analytics, FAQ retrieval, order and settings", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Всё начинается с диалога." }),
  ).toBeVisible();
  await expect(page.getByText("Всего диалогов", { exact: true })).toBeVisible();
  await page.getByLabel("Период аналитики").selectOption("14");
  await expect(
    page.locator(".subtle-pill").filter({ hasText: "14 дней" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("forma-analytics.csv");
  await page.getByRole("link", { name: "База знаний", exact: true }).click();
  await page
    .getByRole("button", { name: "Добавить вопрос и ответ", exact: false })
    .click();
  const title = "Установка светильников QA " + Date.now();
  await page.getByLabel("Название источника").fill(title);
  await page
    .getByLabel("Ответ или текст материала")
    .fill(
      "Установка светильников стоит 2300 рублей. Электрик приезжает по воскресеньям.",
    );
  await page
    .getByRole("button", { name: "Добавить источник", exact: true })
    .click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "AI-ассистент", exact: false }).click();
  await page
    .getByLabel("Сообщение ассистенту")
    .fill("Сколько стоит установка светильников?");
  await page.getByRole("button", { name: "Отправить сообщение" }).click();
  await expect(
    page
      .locator(".telegram-messages .chat-bubble.assistant")
      .filter({ hasText: "2300" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Сколько стоит доставка?", exact: false })
    .click();
  await expect(
    page.locator(".telegram-messages").getByText(/Москва от 500 рублей/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Хочу оформить заказ", exact: false })
    .click();
  await expect(page.locator(".lead-confirmation")).toBeVisible();
  await expect(
    page
      .locator(".telegram-messages")
      .getByText("Создал заявку. Менеджер получил уведомление.", {
        exact: false,
      }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Диалоги", exact: false }).click();
  await expect(page.locator(".inbox")).toBeVisible();
  await page.getByLabel("Поиск в истории").fill("Александра");
  await expect(page.locator(".conversation-item").first()).toBeVisible();
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByLabel("Название компании").fill("NORD HOME STUDIO");
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page.locator(".workspace")).toContainText("NORD HOME STUDIO");
  await page.reload();
  await expect(page.getByLabel("Название компании")).toHaveValue(
    "NORD HOME STUDIO",
  );
  await page.getByLabel("Название компании").fill("NORD HOME");
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page.locator(".workspace")).toContainText("NORD HOME");
  await page.getByRole("link", { name: "База знаний", exact: true }).click();
  await page
    .getByRole("button", { name: "Удалить " + title, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Удалить источник", exact: true })
    .click();
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("mobile layouts, navigation and landing anchors", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "dashboard",
    "knowledge",
    "playground",
    "settings",
    "conversations",
    "welcome",
  ]) {
    await page.goto("/#" + route);
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(250);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/#welcome");
  await page.getByRole("link", { name: "Возможности", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Сложные технологии/ }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#dashboard");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("link", { name: "База знаний", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Знания, которые помогают." }),
  ).toBeVisible();
});
