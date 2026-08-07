import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

expect.extend(toHaveNoViolations);

describe("AUDIT: jest-axe accessibility smoke test (never actually run in original delivery)", () => {
  it("Button has no violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Card with title has no violations", async () => {
    const { container } = render(<Card title="Test Card">Content</Card>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Chip has no violations", async () => {
    const { container } = render(<Chip tone="success">Active</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("EmptyState has no violations", async () => {
    const { container } = render(<EmptyState title="Nothing here" description="Try again later." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Modal (open) has no violations", async () => {
    const { container } = render(
      <Modal open title="Confirm" onClose={() => {}} onConfirm={() => {}}>
        Are you sure?
      </Modal>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
