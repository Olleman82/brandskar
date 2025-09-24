# Repository Guidelines

## Project Structure & Module Organization
- `src/app/(admin)/**` innehåller administrationsgränssnittet (översikt, båtregister, fakturor, kundnotiser).
- `src/app/boat/[publicId]` är kundportalen som nås via QR-kod.
- `src/lib` samlar Prisma-klient (`prisma.ts`), formatterings- och valideringslogik.
- `prisma/schema.prisma` definierar datamodellen (båt, ägare, service, faktura, kundnotiser). Kör `npx prisma generate` efter schemaändringar.

## Build, Test, and Development Commands
- `npm run dev` startar Next.js lokalt (Turbopack) med App Router + server actions.
- `npm run lint` kör ESLint enligt `next/core-web-vitals` och ignorerar genererad Prisma-klient.
- `npx prisma migrate dev --name <change>` skapar en ny migration mot din Postgres-databas.

## Coding Style & Naming Conventions
- TypeScript i strict-läge; server actions ligger i `src/app/(admin)/admin/actions.ts` och återanvänds via form-bindningar.
- Funktioner och filer namnges efter ansvar (`boats/page.tsx`, `notes/page.tsx`).
- UI byggs med Tailwind v4-klasser; använd utility-klasser och undvik inline-stilar. Föredra `sanitize`- och hjälpmetoder när du utökar affärslogiken.

## Testing Guidelines
- Ingen automatiserad testsvit ännu. Kör `npm run lint` innan PR.
- Vid komplexa schemaändringar: skapa tillfälliga seed-skript under `prisma/` och rensa dem innan merge.
- Efter nya server actions: verifiera manuellt i adminvyn och kundportalen (`/boat/[publicId]`) samt kontrollera Prisma-loggar för queryfel.

## Commit & Pull Request Guidelines
- Använd koncisa commit-meddelanden i imperativ form (ex. `Add customer note portal`).
- PR ska inkludera: syfte, risker, migrationsstatus samt skärmdumpar/GIF vid UI-ändringar.
- Länka relaterade ärenden och lista manuella teststeg (t.ex. "Skapade båt", "Genererade faktura").

## Deployment & Configuration
- Miljövariabler: `DATABASE_URL` (Postgres) och `NEXT_PUBLIC_APP_URL` (bas-URL för QR-kod). Vercel kräver extern Postgres (Neon/Planetscale).
- Server actions körs i Vercel Functions; håll kod sans stateful singletons. Prisma-klienten återanvänds via `src/lib/prisma.ts`.
- Efter deploy: kör `prisma migrate deploy` via CI eller Vercel job och regenerera QR-koder om bas-URL ändras.
