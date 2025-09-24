import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { toggleNoteResolved } from "../actions";

export default async function NotesPage() {
  const notes = await prisma.customerNote.findMany({
    include: { boat: true },
    orderBy: { createdAt: "desc" },
  });

  const open = notes.filter((note) => !note.isResolved);
  const closed = notes.filter((note) => note.isResolved);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-white">Kundnoteringar</h1>
        <p className="text-sm text-slate-300">
          Noteringar som inkommit via QR-koden eller kundens portal.
        </p>
      </header>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Öppna noteringar ({open.length})
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {open.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-6 text-sm text-slate-300">
              Inga öppna noteringar.
            </p>
          )}
          {open.map((note) => (
            <article
              key={note.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{note.boat.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(note.createdAt, {
                      locale: sv,
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <form action={toggleNoteResolved.bind(null, note.id, true)}>
                  <button className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30">
                    Markera löst
                  </button>
                </form>
              </div>
              <p className="mt-3 text-sm text-slate-200">{note.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {note.customerName ?? "Anonym"} • {note.noteType}
              </p>
              {note.contact && (
                <p className="text-xs text-slate-500">Kontakt: {note.contact}</p>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Avslutade noteringar ({closed.length})
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {closed.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-6 text-sm text-slate-300">
              Inga avslutade noteringar ännu.
            </p>
          )}
          {closed.map((note) => (
            <article
              key={note.id}
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{note.boat.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(note.createdAt, {
                      locale: sv,
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <form action={toggleNoteResolved.bind(null, note.id, false)}>
                  <button className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/30">
                    Återöppna
                  </button>
                </form>
              </div>
              <p className="mt-3 text-sm text-slate-200">{note.message}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
