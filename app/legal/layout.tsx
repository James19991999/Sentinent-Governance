import { StandaloneHeader } from "@/components/layout/StandaloneHeader";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StandaloneHeader />
      <main className="max-w-2xl mx-auto px-6 py-16 prose-body">{children}</main>
    </>
  );
}
