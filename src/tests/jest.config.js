const path = require("node:path");

module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // Set rootDir to the project root (2 levels up from src/tests)
  rootDir: path.resolve(__dirname, "../../"),
  // Explicitly match tests in src/tests to avoid running Playwright tests in src/playwrite
  testMatch: ["<rootDir>/src/tests/**/*.test.(ts|tsx)"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],
  moduleNameMapper: {
    "\\.css$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tailuge/messaging$":
      "<rootDir>/src/tests/__mocks__/@tailuge/messaging.ts",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  transformIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/tests/**", // Exclude test files and mocks in tests dir
    "!src/**/*.d.ts", // Exclude type definitions
    "!**/node_modules/**",
    "!src/playwright/**", // explicitly exclude playwright folder from coverage too
  ],
};
