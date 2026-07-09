"use client";

import { useState } from "react";
import { searchCustomers } from "../lib/customers";
import { NEW_CUSTOMER_VALUE } from "../lib/grading";

export function CustomerDirectory({ onSelect }: { onSelect: (customerId: string) => void }) {
  const [query, setQuery] = useState("");
  const results = searchCustomers(query);

  return (
    <div className="screen">
      <div className="field-row">
        <label htmlFor="customer-search">Search:</label>
        <input
          id="customer-search"
          type="text"
          placeholder="Name, phone, or address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="directory-results">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {results.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.address}</td>
                <td>
                  <button type="button" onClick={() => onSelect(customer.id)}>
                    Select
                  </button>
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={4}>No matches found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="button-row">
        <button type="button" onClick={() => onSelect(NEW_CUSTOMER_VALUE)}>
          New Customer
        </button>
      </div>
    </div>
  );
}
