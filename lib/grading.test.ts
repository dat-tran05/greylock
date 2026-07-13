import { describe, expect, test } from "vitest";
import { FieldType, gradeField, normalize, type TextFieldDef } from "./grading";
import type { CustomerRecord } from "./customers";

const datTran: CustomerRecord = {
  id: "dat-tran",
  name: "Dat Tran",
  phone: "(469) 767-1349",
  address: "2 Jackson Street, San Francisco, CA 94111",
};

const addressField: TextFieldDef = {
  key: "officeAddress",
  label: "Service Address",
  type: FieldType.Text,
  correctTokens: ["2 jackson", "san francisco", "94111"],
  correctDisplay: "2 Jackson Street, San Francisco, CA 94111",
  deriveFromCustomer: "address",
};

const gradeAddress = (value: string) => gradeField(value, addressField, datTran);

describe("address grading leniency (derived from customer record)", () => {
  test("accepts the canonical address verbatim", () => {
    expect(gradeAddress("2 Jackson Street, San Francisco, CA 94111")).toBe(true);
  });

  test("accepts 'St' abbreviation for 'Street'", () => {
    expect(gradeAddress("2 Jackson St, San Francisco, CA 94111")).toBe(true);
  });

  test("accepts 'St.' with trailing period", () => {
    expect(gradeAddress("2 Jackson St., San Francisco, CA 94111")).toBe(true);
  });

  test("accepts 'California' spelled out in place of 'CA'", () => {
    expect(gradeAddress("2 Jackson Street, San Francisco, California 94111")).toBe(true);
  });

  test("accepts commas without a following space", () => {
    expect(gradeAddress("2 Jackson Street,San Francisco,CA 94111")).toBe(true);
  });

  test("accepts doubled-up spaces", () => {
    expect(gradeAddress("2  Jackson Street,  San Francisco, CA 94111")).toBe(true);
  });

  test("accepts abbreviation typed against a spelled-out record (Ave)", () => {
    const maria: CustomerRecord = {
      id: "maria-lopez",
      name: "Maria Lopez",
      phone: "(415) 555-0163",
      address: "1200 Van Ness Avenue, San Francisco, CA 94109",
    };
    expect(gradeField("1200 Van Ness Ave, San Francisco, CA 94109", addressField, maria)).toBe(true);
  });

  test("accepts spelled-out word typed against an abbreviated record (Blvd)", () => {
    const davin: CustomerRecord = {
      id: "davin-jeong",
      name: "Davin Jeong",
      phone: "(415) 555-0193",
      address: "500 Terry A Francois Blvd, San Francisco, CA 94158",
    };
    expect(gradeField("500 Terry A Francois Boulevard, San Francisco, CA 94158", addressField, davin)).toBe(true);
  });

  test("still rejects a wrong street number", () => {
    expect(gradeAddress("3 Jackson Street, San Francisco, CA 94111")).toBe(false);
  });

  test("still rejects a missing city", () => {
    expect(gradeAddress("2 Jackson Street, CA 94111")).toBe(false);
  });

  test("still rejects a missing state", () => {
    expect(gradeAddress("2 Jackson Street, San Francisco 94111")).toBe(false);
  });

  test("still rejects 'SF' for 'San Francisco'", () => {
    expect(gradeAddress("2 Jackson St, SF, CA 94111")).toBe(false);
  });

  test("still rejects a unit wedged into the middle of the address", () => {
    expect(gradeAddress("2 Jackson Street Apt 3, San Francisco, CA 94111")).toBe(false);
  });
});

describe("token-based grading still works under canonicalization", () => {
  test("accepts token matches without a customer record", () => {
    expect(gradeField("2 Jackson St, San Francisco, CA 94111", addressField, undefined)).toBe(true);
  });

  test("rejects when a token is missing", () => {
    expect(gradeField("2 Jackson St, Oakland, CA 94111", addressField, undefined)).toBe(false);
  });
});

describe("normalize", () => {
  test("treats punctuation as a separator, not a deletion", () => {
    expect(normalize("Street,San")).toBe("street san");
  });

  test("collapses runs of whitespace", () => {
    expect(normalize("2  Jackson   Street")).toBe("2 jackson street");
  });

  test("canonicalizes street-suffix abbreviations and state names", () => {
    expect(normalize("2 Jackson St., San Francisco, California 94111")).toBe(
      normalize("2 Jackson Street, San Francisco, CA 94111")
    );
  });
});
