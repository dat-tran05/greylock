import { describe, it, expect, vi } from "vitest";
import { checkAddressValid } from "../address-validation";

function mockFetch(response: { ok: boolean; status?: number; json?: () => Promise<any> }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: response.json ?? (async () => ({})),
  }) as unknown as typeof fetch;
}

describe("checkAddressValid", () => {
  it("returns false for an empty/whitespace address without calling fetch", async () => {
    const fetchImpl = vi.fn();
    const valid = await checkAddressValid("   ", "key", fetchImpl as unknown as typeof fetch);
    expect(valid).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails open when the API key is missing", async () => {
    const fetchImpl = vi.fn();
    const valid = await checkAddressValid("455 Market Street", undefined, fetchImpl as unknown as typeof fetch);
    expect(valid).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns true when Google confirms the address", async () => {
    const fetchImpl = mockFetch({
      ok: true,
      json: async () => ({ result: { verdict: { addressComplete: true } } }),
    });
    const valid = await checkAddressValid("455 Market Street", "key", fetchImpl);
    expect(valid).toBe(true);
  });

  it("returns false when Google marks the address incomplete", async () => {
    const fetchImpl = mockFetch({
      ok: true,
      json: async () => ({ result: { verdict: { addressComplete: false, validationGranularity: "OTHER" } } }),
    });
    const valid = await checkAddressValid("asdkfj", "key", fetchImpl);
    expect(valid).toBe(false);
  });

  it("fails open on a non-OK HTTP response", async () => {
    const fetchImpl = mockFetch({ ok: false, status: 500 });
    const valid = await checkAddressValid("455 Market Street", "key", fetchImpl);
    expect(valid).toBe(true);
  });

  it("fails open when fetch throws (network error/timeout)", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    const valid = await checkAddressValid("455 Market Street", "key", fetchImpl);
    expect(valid).toBe(true);
  });
});
