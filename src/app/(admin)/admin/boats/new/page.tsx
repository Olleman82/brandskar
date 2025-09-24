import Link from "next/link";
import prisma from "@/lib/prisma";
import { createBoat } from "../../actions";

export default async function NewBoatPage() {
  const owners = await prisma.owner.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Ny båt</h1>
        <p className="text-sm text-slate-300">
          Registrera grunddata och koppla båt till ägare.
        </p>
      </div>
      <form
        action={createBoat}
        className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-xl shadow-black/30"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="name">
              Båtens namn
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Brandskär 27"
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="model">
              Modell
            </label>
            <input
              id="model"
              name="model"
              placeholder="Coupé 27"
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="year">
              Årsmodell
            </label>
            <input
              id="year"
              name="year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="2024"
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="hullId">
              Skrov-/serienummer
            </label>
            <input
              id="hullId"
              name="hullId"
              placeholder="SE-BRK12345G324"
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="coverImageUrl">
            Bild-URL
          </label>
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            placeholder="https://..."
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="notes">
            Internt notat
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Specifikationer, utrustning eller avtalade paket"
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-6">
          <h2 className="text-base font-semibold text-white">Ägare</h2>
          <p className="text-xs text-slate-400">
            Välj en befintlig ägare eller fyll i uppgifter för en ny kontakt.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="ownerId">
                Befintlig ägare
              </label>
              <select
                id="ownerId"
                name="ownerId"
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                defaultValue=""
              >
                <option value="">- Välj ägare -</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="ownerName">
                Ny ägare
              </label>
              <input
                id="ownerName"
                name="ownerName"
                placeholder="Namn"
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="ownerEmail">
                E-post
              </label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                placeholder="kund@exempel.se"
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="ownerPhone">
                Telefon
              </label>
              <input
                id="ownerPhone"
                name="ownerPhone"
                placeholder="070-123 45 67"
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="ownerAddress">
                Adress
              </label>
              <textarea
                id="ownerAddress"
                name="ownerAddress"
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/admin/boats"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Spara båt
          </button>
        </div>
      </form>
    </div>
  );
}
