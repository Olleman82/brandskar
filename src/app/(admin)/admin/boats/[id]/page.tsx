/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import {
  createServiceEntry,
  updateBoat,
  updateServiceStatus,
  deleteServiceEntry,
  createInvoice,
  toggleNoteResolved,
} from "../../actions";
import { formatCurrency, formatHours, minutesToHours } from "@/lib/format";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return format(value, "yyyy-MM-dd HH:mm", { locale: sv });
}

export default async function BoatDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const boatId = params.id;

  const boat = await prisma.boat
    .findUnique({
      where: { id: boatId },
      include: {
        owner: true,
        services: { orderBy: { startTime: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        customerNotes: { orderBy: { createdAt: "desc" } },
      },
    })
    .catch(() => null);

  if (!boat) {
    notFound();
  }

  const allOwners = await prisma.owner.findMany({ orderBy: { name: "asc" } });
  const eligibleServices = boat.services.filter(
    (service) => service.status === "COMPLETED" && service.invoiceId == null,
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const qrPayload = `${appUrl}/boat/${boat.publicId}`;
  const qrCode = await QRCode.toDataURL(qrPayload);

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 lg:w-2/3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">{boat.name}</h1>
              <p className="text-sm text-slate-300">
                {boat.model ?? "Modell saknas"} • {boat.year ?? "Årtal saknas"}
              </p>
              {boat.hullId && (
                <p className="text-xs text-slate-400">Hull ID: {boat.hullId}</p>
              )}
            </div>
            <Link
              href={`/boat/${boat.publicId}`}
              className="rounded-lg border border-sky-400/40 px-3 py-1 text-xs font-medium text-sky-200 transition hover:border-sky-200 hover:text-white"
              target="_blank"
            >
              Kundvy
            </Link>
          </div>
          {boat.coverImageUrl && (
            <div className="overflow-hidden rounded-xl border border-white/5">
              <img
                src={boat.coverImageUrl}
                alt={boat.name}
                className="aspect-video w-full object-cover"
              />
            </div>
          )}
          <div className="rounded-xl border border-white/5 bg-slate-950/50 p-4 text-sm text-slate-200">
            <h2 className="font-semibold text-white">Ägare</h2>
            {boat.owner ? (
              <ul className="mt-2 space-y-1 text-sm">
                <li>{boat.owner.name}</li>
                {boat.owner.email && <li className="text-slate-300">{boat.owner.email}</li>}
                {boat.owner.phone && <li className="text-slate-300">{boat.owner.phone}</li>}
                {boat.owner.address && (
                  <li className="text-slate-400">{boat.owner.address}</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Ingen ägare kopplad.</p>
            )}
          </div>
          {boat.notes && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Interna noteringar</h2>
              <p className="mt-2 whitespace-pre-wrap">{boat.notes}</p>
            </div>
          )}
        </div>
        <div className="w-full space-y-6 lg:w-1/3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              QR-kod för kundvy
            </h2>
            <div className="mt-4 flex flex-col items-center gap-2">
              <img src={qrCode} alt="QR-kod" className="w-40" />
              <code className="rounded bg-slate-950/60 px-2 py-1 text-xs text-slate-300">
                {qrPayload}
              </code>
            </div>
          </div>
          <form
            action={updateBoat.bind(null, boat.id)}
            className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Uppdatera båtinfo
            </h2>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="name">
                Namn
              </label>
              <input
                id="name"
                name="name"
                defaultValue={boat.name}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="model">
                Modell
              </label>
              <input
                id="model"
                name="model"
                defaultValue={boat.model ?? ""}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="year">
                Årsmodell
              </label>
              <input
                id="year"
                name="year"
                type="number"
                defaultValue={boat.year ?? ""}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="hullId">
                Skrov-/serienummer
              </label>
              <input
                id="hullId"
                name="hullId"
                defaultValue={boat.hullId ?? ""}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="coverImageUrl">
                Bild-URL
              </label>
              <input
                id="coverImageUrl"
                name="coverImageUrl"
                defaultValue={boat.coverImageUrl ?? ""}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="notes">
                Noteringar
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={boat.notes ?? ""}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="ownerId">
                Byt ägare
              </label>
              <select
                id="ownerId"
                name="ownerId"
                defaultValue={boat.ownerId?.toString() ?? ""}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              >
                <option value="">- Ingen ägare -</option>
                {allOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400">
              Alternativt kan du lägga till en ny ägare genom att fylla i fälten nedan.
            </p>
            <input
              type="text"
              name="ownerName"
              placeholder="Namn"
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
            <input
              type="email"
              name="ownerEmail"
              placeholder="E-post"
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              name="ownerPhone"
              placeholder="Telefon"
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
            <textarea
              name="ownerAddress"
              placeholder="Adress"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Spara ändringar
            </button>
          </form>
        </div>
      </div>

      <section id="services" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Serviceåtgärder</h2>
          <span className="text-xs text-slate-400">
            {boat.services.length} registrerade
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            {boat.services.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-6 text-sm text-slate-300">
                Ingen service registrerad ännu.
              </p>
            )}
            {boat.services.map((service) => {
              const durationMinutes = service.endTime
                ? Math.max(
                    0,
                    (service.endTime.getTime() - service.startTime.getTime()) /
                      60000,
                  )
                : 0;
              const duration = durationMinutes
                ? minutesToHours(durationMinutes)
                : "Pågående";
              return (
                <div
                  key={service.id}
                  className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {service.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(service.startTime)} →
                        {service.endTime
                          ? ` ${formatDate(service.endTime)}`
                          : " ej avslutad"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-200">
                      {service.status}
                    </span>
                  </div>
                  {service.description && (
                    <p className="mt-2 text-sm text-slate-300">{service.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <span>Tid: {duration}</span>
                    <span>Debitering: {formatCurrency(service.hourlyRate)}</span>
                    <span>Material: {formatCurrency(service.materialsCost)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {service.status !== "COMPLETED" && service.status !== "INVOICED" && (
                      <form action={updateServiceStatus.bind(null, service.id, "COMPLETED")}>
                        <button className="rounded-lg bg-emerald-500/20 px-3 py-1 font-medium text-emerald-200 hover:bg-emerald-500/30">
                          Markera avslutad
                        </button>
                      </form>
                    )}
                    {service.status === "COMPLETED" && (
                      <form action={updateServiceStatus.bind(null, service.id, "IN_PROGRESS")}>
                        <button className="rounded-lg bg-amber-500/20 px-3 py-1 font-medium text-amber-200 hover:bg-amber-500/30">
                          Återöppna
                        </button>
                      </form>
                    )}
                    <form action={deleteServiceEntry.bind(null, service.id)}>
                      <button className="rounded-lg bg-red-500/20 px-3 py-1 font-medium text-red-200 hover:bg-red-500/30">
                        Ta bort
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
          <form
            action={createServiceEntry.bind(null, boat.id)}
            className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Lägg till serviceåtgärd
            </h3>
            <input type="hidden" name="status" value="PLANNED" />
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="title">
                Titel
              </label>
              <input
                id="title"
                name="title"
                required
                placeholder="Motorservice"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="description">
                Beskrivning
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Oljebyte, filter och genomgång av kylsystem"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="startTime">
                Starttid
              </label>
              <input
                id="startTime"
                name="startTime"
                type="datetime-local"
                required
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="endTime">
                Sluttid
              </label>
              <input
                id="endTime"
                name="endTime"
                type="datetime-local"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="hourlyRate">
                Timpris (SEK)
              </label>
              <input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="materialsCost">
                Materialkostnad (SEK)
              </label>
              <input
                id="materialsCost"
                name="materialsCost"
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="internalNote">
                Intern notering
              </label>
              <textarea
                id="internalNote"
                name="internalNote"
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400"
            >
              Lägg till åtgärd
            </button>
          </form>
        </div>
      </section>

      <section id="invoices" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Fakturering</h2>
          <span className="text-xs text-slate-400">
            {boat.invoices.length} fakturor
          </span>
        </div>
        <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            {boat.invoices.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-6 text-sm text-slate-300">
                Inga fakturor skapade ännu.
              </p>
            )}
            {boat.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {invoice.reference}
                    </p>
                    <p className="text-xs text-slate-400">
                      Utfärdad {formatDate(invoice.issuedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-200">
                    {invoice.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span>Arbetstid: {formatHours(invoice.totalHours)}</span>
                  <span>Arbete: {formatCurrency(invoice.laborTotal)}</span>
                  <span>Material: {formatCurrency(invoice.materialsTotal)}</span>
                  <span>Total: {formatCurrency(invoice.totalAmount)}</span>
                </div>
                {invoice.notes && (
                  <p className="mt-2 text-xs text-slate-400">Notering: {invoice.notes}</p>
                )}
              </div>
            ))}
          </div>
          <form
            action={createInvoice.bind(null, boat.id)}
            className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Skapa fakturaunderlag
            </h3>
            {eligibleServices.length === 0 ? (
              <p className="text-sm text-slate-400">
                Inga avslutade åtgärder utan faktura.
              </p>
            ) : (
              <div className="space-y-2 text-sm text-slate-200">
                {eligibleServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-start gap-2 rounded-lg bg-slate-950/40 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      name="serviceIds"
                      value={service.id}
                      defaultChecked
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{service.title}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(service.startTime)} • {formatCurrency(service.hourlyRate)} / h
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="dueAt">
                Förfallodatum
              </label>
              <input
                id="dueAt"
                name="dueAt"
                type="date"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="notes">
                Kundnotering
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300" htmlFor="adminMemo">
                Internt memo
              </label>
              <textarea
                id="adminMemo"
                name="adminMemo"
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={eligibleServices.length === 0}
              className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              Generera faktura
            </button>
          </form>
        </div>
      </section>

      <section id="notes" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Kundnoteringar</h2>
          <Link
            href={`/boat/${boat.publicId}`}
            className="text-xs text-sky-300 hover:text-sky-100"
            target="_blank"
          >
            Visa kundens vy
          </Link>
        </div>
        <div className="space-y-3">
          {boat.customerNotes.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-6 text-sm text-slate-300">
              Inga noteringar registrerade.
            </p>
          )}
          {boat.customerNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs uppercase tracking-wide text-slate-300">
                  {note.noteType}
                </div>
                <form action={toggleNoteResolved.bind(null, note.id, !note.isResolved)}>
                  <button className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30">
                    {note.isResolved ? "Återöppna" : "Markera löst"}
                  </button>
                </form>
              </div>
              <p className="mt-2 text-sm text-slate-200">{note.message}</p>
              <div className="mt-2 text-xs text-slate-400">
                {note.customerName && <span>{note.customerName} • </span>}
                {formatDate(note.createdAt)}
              </div>
              {note.contact && (
                <p className="text-xs text-slate-500">Kontakt: {note.contact}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}






