import { Prisma } from "@/generated/prisma";

type Decimalish = Prisma.Decimal | number | null | undefined;

export function formatCurrency(value: Decimalish) {
  if (value == null) {
    return "-";
  }
  const numeric = value instanceof Prisma.Decimal ? value.toNumber() : value;
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 2,
  }).format(numeric ?? 0);
}

export function formatHours(value: Decimalish) {
  if (value == null) {
    return "-";
  }
  const numeric = value instanceof Prisma.Decimal ? value.toNumber() : value;
  return `${numeric.toFixed(1)} h`;
}

export function durationMinutes(start: Date, end?: Date | null) {
  if (!end) {
    return 0;
  }
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diff / 60000));
}

export function minutesToHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)} h`;
}
