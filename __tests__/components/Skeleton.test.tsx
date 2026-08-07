import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Skeleton } from "@/components/ui/Skeleton";

describe("Skeleton", () => {
  it("renders as an aria-hidden placeholder, not exposed to screen readers", () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
  });
});
