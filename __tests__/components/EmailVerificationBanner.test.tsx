import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EmailVerificationBanner } from "@/components/layout/EmailVerificationBanner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resendVerificationEmail } from "@/lib/auth/session";

jest.mock("@/lib/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ resendVerificationEmail: jest.fn() }));

const mockUseAuth = useAuth as jest.Mock;
const mockResend = resendVerificationEmail as jest.Mock;

describe("EmailVerificationBanner", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockResend.mockReset();
  });

  it("renders nothing when there is no signed-in user", () => {
    mockUseAuth.mockReturnValue({ firebaseUser: null, emailVerified: false, refreshEmailVerification: jest.fn() });
    const { container } = render(<EmailVerificationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the email is already verified", () => {
    mockUseAuth.mockReturnValue({
      firebaseUser: { email: "a@b.com" },
      emailVerified: true,
      refreshEmailVerification: jest.fn(),
    });
    const { container } = render(<EmailVerificationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the nudge when signed in but unverified", () => {
    mockUseAuth.mockReturnValue({
      firebaseUser: { email: "a@b.com" },
      emailVerified: false,
      refreshEmailVerification: jest.fn(),
    });
    render(<EmailVerificationBanner />);
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
  });

  it("calls resendVerificationEmail and shows confirmation when Resend is clicked", async () => {
    mockResend.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      firebaseUser: { email: "a@b.com" },
      emailVerified: false,
      refreshEmailVerification: jest.fn(),
    });
    render(<EmailVerificationBanner />);
    fireEvent.click(screen.getByText("Resend email"));
    await waitFor(() => expect(mockResend).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText(/Verification email sent to a@b.com/)).toBeInTheDocument());
  });

  it("calls refreshEmailVerification when 'I've verified' is clicked", async () => {
    const refresh = jest.fn().mockResolvedValue(true);
    mockUseAuth.mockReturnValue({ firebaseUser: { email: "a@b.com" }, emailVerified: false, refreshEmailVerification: refresh });
    render(<EmailVerificationBanner />);
    fireEvent.click(screen.getByText("I've verified"));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
});
