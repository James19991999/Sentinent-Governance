import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Chip } from "@/components/ui/Chip";

describe("Chip", () => {
  it("renders children text", () => {
    render(<Chip tone="success">CERTIFIED</Chip>);
    expect(screen.getByText("CERTIFIED")).toBeInTheDocument();
  });

  it("defaults to neutral tone when none specified", () => {
    render(<Chip>Default</Chip>);
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it.each(["success", "warning", "error", "neutral", "ai"] as const)("renders with tone=%s without crashing", (tone) => {
    render(<Chip tone={tone}>{tone}</Chip>);
    expect(screen.getByText(tone)).toBeInTheDocument();
  });
});
