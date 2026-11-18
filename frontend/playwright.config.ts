import { defineConfig } from "@playwright/test";

const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: ci ? undefined : "chrome",
    headless: true,
    viewport: { width: 1440, height: 1050 },
  },
  webServer: ci
    ? [
        {
          command: "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000",
          cwd: "../backend",
          url: "http://127.0.0.1:8000/api/health",
          env: {
            DEMO_MODE: "true",
            DATABASE_URL: "sqlite:///./ci-demo.db",
            LLM_API_KEY: "",
            TELEGRAM_BOT_TOKEN: "",
          },
        },
        {
          command: "npm run dev",
          url: "http://127.0.0.1:5173",
        },
      ]
    : undefined,
  reporter: "list",
});
