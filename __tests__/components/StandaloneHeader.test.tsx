import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StandaloneHeader } from "@/components/layout/StandaloneHeader";

describe("StandaloneHeader", () => {
  it("renders a link back to the homepage", () => {
    render(<StandaloneHeader />);
    const link = screen.getByRole("link", { name: /Sentient Governance/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
