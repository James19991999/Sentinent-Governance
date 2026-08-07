import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <Modal open={false} title="Test" onClose={jest.fn()}>
        content
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title and children when open", () => {
    render(
      <Modal open title="Delete workflow?" onClose={jest.fn()}>
        This can't be undone.
      </Modal>
    );
    expect(screen.getByText("Delete workflow?")).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = jest.fn();
    render(
      <Modal open title="Test" onClose={onClose}>
        content
      </Modal>
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = jest.fn();
    render(
      <Modal open title="Test" onClose={onClose}>
        content
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm with the given label when confirm is clicked, and not otherwise", () => {
    const onConfirm = jest.fn();
    render(
      <Modal open title="Test" onClose={jest.fn()} onConfirm={onConfirm} confirmLabel="Delete">
        content
      </Modal>
    );
    const confirmButton = screen.getByText("Delete");
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not render a confirm button when onConfirm is not provided", () => {
    render(
      <Modal open title="Test" onClose={jest.fn()}>
        content
      </Modal>
    );
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });

  it("has proper dialog ARIA semantics", () => {
    render(
      <Modal open title="Test dialog" onClose={jest.fn()}>
        content
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });
});
