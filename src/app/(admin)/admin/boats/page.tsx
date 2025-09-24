import Link from "next/link";
import prisma from "@/lib/prisma";

async function getBoats() {
  return prisma.boat.findMany({
    orderBy: { name: "asc" },
    include: {
      owner: true,
      services: {
        orderBy: { startTime: "desc" },
        take: 1,
      },
      invoices: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export default async function BoatListPage() {
  const boats = await getBoats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Båtregister</h1>
          <p className="text-sm text-slate-300">
            Lägg till nya båtar, uppdatera ägare och följ servicehistorik.
          </p>
        </div>
        <Link
          href="/admin/boats/new"
          className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
        >
          + Ny båt
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {boats.map((boat) => {
          const latestService = boat.services[0];
          const latestInvoice = boat.invoices[0];
          return (
            <Link
              key={boat.id}
              href={`/admin/boats/${boat.id}`}
              className="group rounded-xl border border-white/5 bg-slate-950/40 p-5 transition hover:border-sky-400/50 hover:bg-slate-900/60"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-white group-hover:text-sky-100">
                  {boat.name}
                </h2>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-300">
                  {boat.model ?? "Okänd modell"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                {boat.owner?.name ?? "Ingen ägare registrerad"}
              </p>
              {latestService ? (
                <p className="mt-3 text-xs text-slate-400">
                  Senast: {latestService.title} • {new Date(latestService.startTime).toLocaleDateString("sv-SE")}
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Ingen service registrerad ännu.</p>
              )}
              {latestInvoice && (
                <p className="mt-2 text-[11px] uppercase tracking-wide text-emerald-300/80">
                  Senaste faktura: {latestInvoice.reference} ({latestInvoice.status})
                </p>
              )}
            </Link>
          );
        })}
      </div>
      {boats.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/20 bg-slate-900/40 p-10 text-center text-sm text-slate-300">
          Inga båtar registrerade ännu. Klicka på &quot;Ny båt&quot; för att komma igång.
        </div>
      )}
    </div>
  );
}
