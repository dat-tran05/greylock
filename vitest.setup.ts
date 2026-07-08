import "@testing-library/jest-dom/vitest";

if (!process.env.GOOGLE_MAPS_API_KEY) {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
}
