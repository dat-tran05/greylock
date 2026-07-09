import rawCustomers from "../data/customers.json";

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
}

function parseCustomer(raw: any): CustomerRecord | null {
  if (
    typeof raw?.id !== "string" ||
    typeof raw?.name !== "string" ||
    typeof raw?.phone !== "string" ||
    typeof raw?.address !== "string"
  ) {
    console.warn("Skipping invalid customer record:", raw);
    return null;
  }
  return { id: raw.id, name: raw.name, phone: raw.phone, address: raw.address };
}

function buildCustomerDirectory(rawList: unknown[]): CustomerRecord[] {
  if (!Array.isArray(rawList)) return [];
  const records: CustomerRecord[] = [];
  for (const raw of rawList) {
    const parsed = parseCustomer(raw);
    if (parsed) records.push(parsed);
  }
  return records;
}

export const CUSTOMERS: CustomerRecord[] = buildCustomerDirectory(rawCustomers);

export function findCustomer(id: string): CustomerRecord | undefined {
  return CUSTOMERS.find((c) => c.id === id);
}

export function searchCustomers(query: string): CustomerRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return CUSTOMERS;
  return CUSTOMERS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
  );
}
