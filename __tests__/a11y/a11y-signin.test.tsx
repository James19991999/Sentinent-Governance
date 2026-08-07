import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/lib/firebase/client", () => ({ auth: {}, db: {} }));

import SignInPage from "@/app/(auth)/sign-in/page";

describe("AUDIT: jest-axe on the actual Sign In page", () => {
  it("has no automatically detectable violations in the default (Sign In tab) state", async () => {
    const { container } = render(<SignInPage />);
    const results = await axe(container);
    expect(results.violations.map((v: any) => ({ id: v.id, nodes: v.nodes.length }))).toEqual([]);
  });
});
