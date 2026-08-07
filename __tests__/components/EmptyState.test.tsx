import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No workflows yet" description="Create one to get started." />);
    expect(screen.getByText("No workflows yet")).toBeInTheDocument();
    expect(screen.getByText("Create one to get started.")).toBeInTheDocument();
  });

  it("renders an action node when provided", () => {
    render(
      <EmptyState title="No workflows yet" description="Create one." action={<button>Create workflow</button>} />
    );
    expect(screen.getByText("Create workflow")).toBeInTheDocument();
  });

  it("renders without an action when none is provided", () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
