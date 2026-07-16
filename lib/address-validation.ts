export async function checkAddressValid(
  address: string,
  apiKey: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  const trimmed = address.trim();
  if (!trimmed) {
    return false;
  }
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY is missing; failing open on address validation");
    return true;
  }

  try {
    const res = await fetchImpl(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: { addressLines: [trimmed] } }),
      }
    );

    if (!res.ok) {
      console.warn(`Address Validation API returned HTTP ${res.status}; failing open`);
      return true;
    }

    const data = await res.json();
    const result = data?.result;
    const verdict = result?.verdict;
    if (!verdict) {
      console.warn("Address Validation API returned an unexpected shape; failing open");
      return true;
    }

    // Only check confirmation on the components that establish WHICH real
    // address this is (number/street/city/state/zip). Google infers things
    // like country or the ZIP+4 suffix on nearly every real request even
    // when the input is fully correct, so a blanket "any inferred component"
    // check would reject almost everything. But if one of the critical
    // components isn't CONFIRMED — or was inferred rather than actually
    // supplied — that's the real duplicate-street-name failure mode: a
    // street-only input can resolve confidently to the wrong city because
    // Google guessed the missing context instead of confirming it.
    const CRITICAL_TYPES = new Set(["street_number", "route", "locality", "administrative_area_level_1", "postal_code"]);
    const components: any[] = result?.address?.addressComponents ?? [];
    const hasUnverifiedCriticalComponent = components.some(
      (c) =>
        CRITICAL_TYPES.has(c?.componentType) &&
        (c?.confirmationLevel !== "CONFIRMED" || c?.inferred === true || c?.replaced === true)
    );
    if (hasUnverifiedCriticalComponent) return false;
    if (Array.isArray(result?.address?.unresolvedTokens) && result.address.unresolvedTokens.length > 0) {
      return false;
    }

    if (verdict.addressComplete === true) return true;
    if (verdict.validationGranularity === "PREMISE" || verdict.validationGranularity === "SUB_PREMISE") return true;
    return false;
  } catch (err) {
    console.warn("Address Validation API call failed; failing open", err);
    return true;
  }
}
