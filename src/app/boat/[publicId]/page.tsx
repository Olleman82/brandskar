import { notFound } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { recordCustomerNote } from "@/app/(admin)/admin/actions";
import { formatCurrency } from "@/lib/format";

function formatDate(value: Date) {
  return format(value, "yyyy-MM-dd HH:mm", { locale: sv });
}

export default async function CustomerBoatPage({
  params,
}: {
  params: { publicId: string };
}) {
  const boat = await prisma.boat.findUnique({
    where: { publicId: params.publicId },
    include: {
      owner: true,
      services: {
        orderBy: { startTime: "desc" },
        take: 10,
      },
      invoices: {
        where: { status: { in: ["SENT", "PAID"] } },
        orderBy: { issuedAt: "desc" },
      },
      customerNotes: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!boat) {
    notFound();
  }

  const submitNote = recordCustomerNote.bind(null, boat.publicId);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/40">
        <h1 className="text-3xl font-semibold text-white">{boat.name}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {boat.model ?? "Båt"} • {boat.year ?? "Årtal saknas"}
        </p>
        {boat.owner && (
          <p className="mt-4 text-xs text-slate-400">
            Kontakt: {boat.owner.name}
            {boat.owner.phone ? ` • ${boat.owner.phone}` : ""}
          </p>
        )}
      </header>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Service & åtgärder</h2>
        {boat.services.length === 0 && (
          <p className="text-sm text-slate-300">
            Inga registrerade åtgärder ännu. Hör av dig om något behöver åtgärdas.
          </p>
        )}
        <ul className="space-y-3">
          {boat.services.map((service) => (
            <li
              key={service.id}
              className="rounded-xl border border-white/5 bg-slate-950/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{service.title}</p>
                  <p className="text-xs text-slate-400">
                    Start {formatDate(service.startTime)}
                    {service.endTime && ` • Klar ${formatDate(service.endTime)}`}
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-200">
                  {service.status}
                </span>
              </div>
              {service.description && (
                <p className="mt-2 text-sm text-slate-300">{service.description}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Fakturor & kostnader</h2>
        {boat.invoices.length === 0 ? (
          <p className="text-sm text-slate-300">
            Inga fakturor har skickats ännu för denna säsong.
          </p>
        ) : (
          <ul className="space-y-3 text-sm text-slate-200">
            {boat.invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-slate-950/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{invoice.reference}</p>
                  <p className="text-xs text-slate-400">
                    Skickad {formatDate(invoice.issuedAt)} • Status {invoice.status}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-300">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Lämna en notering</h2>
          <p className="text-sm text-slate-300">
            Beskriv önskemål eller problem så återkopplar varvet.
          </p>
        </div>
        <form action={submitNote} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="customerName">
                Ditt namn
              </label>
              <input
                id="customerName"
                name="customerName"
                placeholder="Namn"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="contact">
                Kontakt (telefon eller e-post)
              </label>
              <input
                id="contact"
                name="contact"
                placeholder="070-... eller e-post"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="noteType">
              Typ av notering
            </label>
            <select
              id="noteType"
              name="noteType"
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              defaultValue="REQUEST"
            >
              <option value="REQUEST">Önskemål / beställning</option>
              <option value="ISSUE">Fel / problem</option>
              <option value="INFO">Information</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="message">
              Beskrivning
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              placeholder="Berätta vad du vill att vi ska kika på..."
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Skicka notering
          </button>
        </form>
        {boat.customerNotes.length > 0 && (
          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Tidigare noteringar</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              {boat.customerNotes.map((note) => (
                <li key={note.id} className="border-b border-white/5 pb-2 last:border-none">
                  <p className="text-slate-200">{note.message}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide">
                    {formatDate(note.createdAt)} • {note.noteType}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
