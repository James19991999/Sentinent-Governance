import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/** Minimal header for standalone/public pages (legal, contact, help) that
 * sit outside the authenticated app shell — gives every page a way back
 * to the site instead of a dead end. */
export function StandaloneHeader() {
  return (
    <header className="border-b border-outline-variant">
      <div className="max-w-2xl mx-auto px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-body-lg">
          <span className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center" aria-hidden="true">
            <ShieldCheck size={18} />
          </span>
          Sentient Governance
        </Link>
      </div>
    </header>
  );
}
