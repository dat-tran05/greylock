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

    // Unconfirmed/inferred components mean Google had to guess at parts it
    // couldn't verify (e.g. a city it assumed because none was given) rather
    // than confirming what was actually typed. This is exactly the
    // duplicate-street-name failure mode — a street-only input can otherwise
    // resolve confidently to the wrong city. Same for unresolved tokens:
    // input Google couldn't place anywhere at all.
    if (verdict.hasUnconfirmedComponents === true) return false;
    if (verdict.hasInferredComponents === true) return false;
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
