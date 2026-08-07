import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ErrorState } from "@/components/ui/ErrorState";

describe("ErrorState", () => {
  it("renders default title and description when none provided", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(<ErrorState title="Failed to load audits" description="Check your connection." />);
    expect(screen.getByText("Failed to load audits")).toBeInTheDocument();
    expect(screen.getByText("Check your connection.")).toBeInTheDocument();
  });

  it("does not render a retry button when onRetry is not provided", () => {
    render(<ErrorState />);
    expect(screen.queryByText("Try again")).not.toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("has an alert role for screen readers", () => {
    render(<ErrorState />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
