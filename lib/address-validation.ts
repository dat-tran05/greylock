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
    const verdict = data?.result?.verdict;
    if (!verdict) {
      console.warn("Address Validation API returned an unexpected shape; failing open");
      return true;
    }

    if (verdict.addressComplete === true) return true;
    if (verdict.validationGranularity === "PREMISE" || verdict.validationGranularity === "SUB_PREMISE") return true;
    return false;
  } catch (err) {
    console.warn("Address Validation API call failed; failing open", err);
    return true;
  }
}
