/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageReporters: ["text", "json"],
  coveragePathIgnorePatterns: ["node_modules", "cyclicdb.ts"],
}
