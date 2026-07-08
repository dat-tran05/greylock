import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Fireworks } from "../Fireworks";

describe("Fireworks", () => {
  it("renders no sparks when inactive", () => {
    const { container } = render(<Fireworks active={false} />);
    expect(container.querySelectorAll(".spark").length).toBe(0);
  });

  it("renders a dense burst (at least 40 sparks across multiple burst points) when active", () => {
    const { container } = render(<Fireworks active={true} />);
    expect(container.querySelectorAll(".spark").length).toBeGreaterThanOrEqual(40);
  });
});
