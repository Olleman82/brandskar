import prisma from "@/lib/prisma";
import { formatCurrency, formatHours } from "@/lib/format";
import { updateInvoiceStatus } from "../actions";

const STATUS_ORDER = ["DRAFT", "SENT", "PAID", "CANCELLED"] as const;

export default async function InvoiceListPage() {
  const invoices = await prisma.invoice.findMany({
    include: {
      boat: true,
      services: {
        orderBy: { startTime: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: invoices.filter((invoice) => invoice.status === status),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Fakturering</h1>
        <p className="text-sm text-slate-300">
          Följ DRAFT/SENT/PAID och markera status allteftersom fakturor skickas.
        </p>
      </header>
      {grouped.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-8 text-sm text-slate-300">
          Inga fakturor skapade ännu.
        </p>
      )}
      <div className="space-y-10">
        {grouped.map((group) => (
          <section key={group.status} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{group.status}</h2>
              <span className="text-xs text-slate-400">
                {group.items.length} st
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {group.items.map((invoice) => (
                <article
                  key={invoice.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {invoice.reference}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {invoice.boat.name} • {new Date(invoice.issuedAt).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                    <form action={updateInvoiceStatus.bind(null, invoice.id, nextStatus(invoice.status))}>
                      <button
                        type="submit"
                        className="rounded-lg bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
                        disabled={!nextStatus(invoice.status)}
                      >
                        {nextStatus(invoice.status) ? `Markera ${nextStatus(invoice.status)}` : "Slutförd"}
                      </button>
                    </form>
                  </header>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div>
                      <dt className="text-slate-400">Arbetstid</dt>
                      <dd className="font-medium text-white">
                        {formatHours(invoice.totalHours)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Arbete</dt>
                      <dd className="font-medium text-white">
                        {formatCurrency(invoice.laborTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Material</dt>
                      <dd className="font-medium text-white">
                        {formatCurrency(invoice.materialsTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Summa</dt>
                      <dd className="font-medium text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </dd>
                    </div>
                  </dl>
                  {invoice.notes && (
                    <p className="mt-3 text-xs text-slate-400">
                      Kundnotering: {invoice.notes}
                    </p>
                  )}
                  {invoice.adminMemo && (
                    <p className="mt-1 text-xs text-slate-500">
                      Internt: {invoice.adminMemo}
                    </p>
                  )}
                  <div className="mt-4 rounded-lg bg-slate-950/40 p-3 text-xs text-slate-300">
                    <p className="font-semibold text-white">Åtgärder i faktura</p>
                    <ul className="mt-2 space-y-1">
                      {invoice.services.map((service) => (
                        <li key={service.id} className="flex justify-between gap-2">
                          <span>{service.title}</span>
                          <span className="text-slate-400">
                            {new Date(service.startTime).toLocaleDateString("sv-SE")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function nextStatus(status: string) {
  switch (status) {
    case "DRAFT":
      return "SENT";
    case "SENT":
      return "PAID";
    case "PAID":
      return "PAID";
    default:
      return undefined;
  }
}
