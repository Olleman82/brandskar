import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import prisma from "@/lib/prisma";

async function getDashboardData() {
  const [boatCount, openServices, pendingInvoices, latestNotes] = await Promise.all([
    prisma.boat.count(),
    prisma.serviceEntry.findMany({
      where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
      orderBy: { startTime: "asc" },
      take: 5,
      include: { boat: true },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["DRAFT", "SENT"] } },
      orderBy: { issuedAt: "desc" },
      take: 5,
      include: { boat: true },
    }),
    prisma.customerNote.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { boat: true },
    }),
  ]);

  return { boatCount, openServices, pendingInvoices, latestNotes };
}

export default async function AdminPage() {
  const { boatCount, openServices, pendingInvoices, latestNotes } =
    await getDashboardData();

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-300">Aktiva båtar</p>
          <p className="mt-2 text-3xl font-semibold text-white">{boatCount}</p>
          <Link
            href="/admin/boats"
            className="mt-4 inline-block text-sm text-sky-300 hover:text-sky-200"
          >
            Hantera båtregister →
          </Link>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-300">Öppna serviceärenden</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {openServices.length}
          </p>
          <Link
            href="/admin/boats"
            className="mt-4 inline-block text-sm text-sky-300 hover:text-sky-200"
          >
            Planera åtgärder →
          </Link>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-300">Fakturor i arbete</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {pendingInvoices.length}
          </p>
          <Link
            href="/admin/invoices"
            className="mt-4 inline-block text-sm text-sky-300 hover:text-sky-200"
          >
            Skapa underlag →
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Planerade serviceåtgärder</h2>
            <Link href="/admin/boats" className="text-sm text-sky-300">
              Se alla
            </Link>
          </div>
          <div className="space-y-3">
            {openServices.length === 0 && (
              <p className="text-sm text-slate-400">
                Ingen planerad service just nu.
              </p>
            )}
            {openServices.map((service) => (
              <Link
                key={service.id}
                href={`/admin/boats/${service.boatId}`}
                className="block rounded-lg border border-white/5 bg-slate-950/40 p-4 transition hover:border-sky-400/40"
              >
                <p className="text-sm font-medium text-white">
                  {service.title}
                </p>
                <p className="text-xs text-slate-400">
                  {service.boat.name} • Start {new Date(service.startTime).toLocaleString("sv-SE")}
                </p>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Olösta kundnotiser</h2>
            <Link href="/admin/notes" className="text-sm text-sky-300">
              Hantera
            </Link>
          </div>
          <div className="space-y-3">
            {latestNotes.length === 0 && (
              <p className="text-sm text-slate-400">
                Inga öppna kundnotiser just nu.
              </p>
            )}
            {latestNotes.map((note) => (
              <Link
                key={note.id}
                href={`/admin/boats/${note.boatId}?section=notes`}
                className="block rounded-lg border border-white/5 bg-slate-950/40 p-4 transition hover:border-amber-400/40"
              >
                <p className="text-sm font-medium text-white">
                  {note.boat.name}
                </p>
                <p className="text-xs text-slate-300 line-clamp-2">{note.message}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                  {formatDistanceToNow(note.createdAt, {
                    locale: sv,
                    addSuffix: true,
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Fakturaunderlag</h2>
          <Link href="/admin/invoices" className="text-sm text-sky-300">
            Visa fakturor
          </Link>
        </div>
        <div className="space-y-3">
          {pendingInvoices.length === 0 && (
            <p className="text-sm text-slate-400">Inga fakturor i arbete.</p>
          )}
          {pendingInvoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/admin/invoices/${invoice.id}`}
              className="block rounded-lg border border-white/5 bg-slate-950/40 p-4 transition hover:border-emerald-400/40"
            >
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>{invoice.reference}</span>
                <span>{invoice.status}</span>
              </div>
              <p className="text-xs text-slate-400">
                {invoice.boat.name} • Utfärdad {invoice.issuedAt.toLocaleDateString("sv-SE")}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
