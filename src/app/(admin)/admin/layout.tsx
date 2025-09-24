import Link from "next/link";
import type { ReactNode } from "react";

const navLinks = [
  { href: "/admin", label: "Översikt" },
  { href: "/admin/boats", label: "Båtar" },
  { href: "/admin/invoices", label: "Fakturering" },
  { href: "/admin/notes", label: "Notiser" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-lg font-semibold text-sky-300">
            Brandskär Serviceportal
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
