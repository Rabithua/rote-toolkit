import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
