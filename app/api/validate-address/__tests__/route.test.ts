import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../route";
import * as addressValidation from "../../../../lib/address-validation";

describe("POST /api/validate-address", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns { valid: true } when checkAddressValid resolves true", async () => {
    vi.spyOn(addressValidation, "checkAddressValid").mockResolvedValue(true);
    const request = new Request("http://localhost/api/validate-address", {
      method: "POST",
      body: JSON.stringify({ address: "455 Market Street" }),
    });
    const response = await POST(request as any);
    const body = await response.json();
    expect(body).toEqual({ valid: true });
  });

  it("returns { valid: false } when checkAddressValid resolves false", async () => {
    vi.spyOn(addressValidation, "checkAddressValid").mockResolvedValue(false);
    const request = new Request("http://localhost/api/validate-address", {
      method: "POST",
      body: JSON.stringify({ address: "asdkfj" }),
    });
    const response = await POST(request as any);
    const body = await response.json();
    expect(body).toEqual({ valid: false });
  });

  it("treats a missing/malformed body as an empty address", async () => {
    const spy = vi.spyOn(addressValidation, "checkAddressValid").mockResolvedValue(false);
    const request = new Request("http://localhost/api/validate-address", {
      method: "POST",
      body: "not json",
    });
    await POST(request as any);
    expect(spy).toHaveBeenCalledWith("", expect.anything());
  });
});
