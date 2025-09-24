"use server";

import type { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { $Enums } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import {
  boatFormSchema,
  serviceFormSchema,
  invoiceFormSchema,
  noteFormSchema,
} from "@/lib/validation";

type BoatFormInput = z.infer<typeof boatFormSchema>;
type ServiceStatusValue = $Enums.ServiceStatus;
type InvoiceStatusValue = $Enums.InvoiceStatus;

function sanitize(value?: string | null) {
  if (value == null) return undefined;
  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNumber(value?: string | null) {
  const trimmed = sanitize(value);
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toDate(value?: string | null) {
  const trimmed = sanitize(value);
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

function toObjectId(value?: string | null) {
  const id = sanitize(value);
  return id && objectIdPattern.test(id) ? id : undefined;
}

export async function createBoat(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = boatFormSchema.safeParse(raw);

  if (!result.success) {
    throw new Error("Ogiltiga fält");
  }

  const data = result.data;
  const ownerId = await resolveOwner(data);

  const boat = await prisma.boat.create({
    data: {
      name: sanitize(data.name) ?? data.name,
      model: sanitize(data.model),
      year: toNumber(data.year),
      hullId: sanitize(data.hullId),
      coverImageUrl: sanitize(data.coverImageUrl),
      notes: sanitize(data.notes),
      ownerId,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/boats");
  redirect(`/admin/boats/${boat.id}`);
}

export async function updateBoat(boatId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = boatFormSchema.safeParse(raw);

  if (!result.success) {
    throw new Error("Ogiltiga fält");
  }

  const data = result.data;
  const ownerId = await resolveOwner(data);

  await prisma.boat.update({
    where: { id: boatId },
    data: {
      name: sanitize(data.name) ?? data.name,
      model: sanitize(data.model),
      year: toNumber(data.year),
      hullId: sanitize(data.hullId),
      coverImageUrl: sanitize(data.coverImageUrl),
      notes: sanitize(data.notes),
      ownerId: ownerId ?? null,
    },
  });

  revalidatePath(`/admin/boats/${boatId}`);
  revalidatePath("/admin/boats");
}

async function resolveOwner(data: BoatFormInput) {
  const existingId = toObjectId(data.ownerId);
  if (existingId) {
    return existingId;
  }

  const ownerName = sanitize(data.ownerName);
  if (!ownerName) {
    return undefined;
  }

  const owner = await prisma.owner.create({
    data: {
      name: ownerName,
      email: sanitize(data.ownerEmail),
      phone: sanitize(data.ownerPhone),
      address: sanitize(data.ownerAddress),
    },
  });

  return owner.id;
}

export async function createServiceEntry(boatId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = serviceFormSchema.safeParse(raw);

  if (!result.success) {
    throw new Error("Ogiltiga fält");
  }

  const data = result.data;
  const startTime = toDate(data.startTime);
  if (!startTime) {
    throw new Error("Starttid saknas");
  }

  const endTime = toDate(data.endTime);

  await prisma.serviceEntry.create({
    data: {
      boatId,
      title: sanitize(data.title) ?? data.title,
      description: sanitize(data.description),
      startTime,
      endTime,
      status: data.status as ServiceStatusValue,
      hourlyRate: toNumber(data.hourlyRate),
      materialsCost: toNumber(data.materialsCost),
      internalNote: sanitize(data.internalNote),
    },
  });

  revalidatePath(`/admin/boats/${boatId}`);
  revalidatePath("/admin");
}

export async function updateServiceStatus(
  serviceId: string,
  status: ServiceStatusValue,
) {
  const service = await prisma.serviceEntry.update({
    where: { id: serviceId },
    data: { status },
    select: { boatId: true },
  });

  revalidatePath(`/admin/boats/${service.boatId}`);
  revalidatePath("/admin");
}

export async function createInvoice(boatId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const serviceIds = formData.getAll("serviceIds").map(String);
  const result = invoiceFormSchema.safeParse({ ...raw, serviceIds });

  if (!result.success) {
    throw new Error("Ogiltiga fält");
  }

  const data = result.data;
  const validServiceIds = data.serviceIds
    .map((id) => toObjectId(id))
    .filter((id): id is string => Boolean(id));

  if (validServiceIds.length === 0) {
    throw new Error("Inga åtgärder valda");
  }

  const services = await prisma.serviceEntry.findMany({
    where: { id: { in: validServiceIds } },
  });

  const totals = services.reduce(
    (acc, service) => {
      if (service.endTime) {
        const minutes =
          (service.endTime.getTime() - service.startTime.getTime()) / 60000;
        if (minutes > 0) {
          acc.minutes += minutes;
          if (service.hourlyRate) {
            acc.labor += (minutes / 60) * Number(service.hourlyRate);
          }
        }
      }
      if (service.materialsCost) {
        acc.materials += Number(service.materialsCost);
      }
      return acc;
    },
    { minutes: 0, labor: 0, materials: 0 },
  );

  const hours = totals.minutes / 60;
  const laborTotal = Number(totals.labor.toFixed(2));
  const materialsTotal = Number(totals.materials.toFixed(2));
  const totalAmount = Number((laborTotal + materialsTotal).toFixed(2));

  const invoice = await prisma.invoice.create({
    data: {
      boatId,
      reference: await nextInvoiceReference(),
      issuedAt: new Date(),
      dueAt: toDate(data.dueAt),
      status: $Enums.InvoiceStatus.DRAFT,
      notes: sanitize(data.notes),
      adminMemo: sanitize(data.adminMemo),
      totalHours: Number(hours.toFixed(2)),
      laborTotal,
      materialsTotal,
      totalAmount,
      services: {
        connect: services.map((service) => ({ id: service.id })),
      },
    },
  });

  if (services.length > 0) {
    await prisma.serviceEntry.updateMany({
      where: { id: { in: services.map((service) => service.id) } },
      data: { status: "INVOICED" as ServiceStatusValue, invoiceId: invoice.id },
    });
  }

  revalidatePath(`/admin/boats/${boatId}`);
  revalidatePath("/admin/invoices");
}

async function nextInvoiceReference() {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const latest = await prisma.invoice.findFirst({
    where: { createdAt: { gte: startOfYear } },
    orderBy: { createdAt: "desc" },
  });

  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  if (!latest) {
    return `${prefix}0001`;
  }

  const match = latest.reference.match(/(\d{4})$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status?: InvoiceStatusValue,
) {
  if (!status) {
    throw new Error("Status saknas");
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
    select: { boatId: true },
  });

  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  if (invoice.boatId) {
    revalidatePath(`/admin/boats/${invoice.boatId}`);
  }
}

export async function recordCustomerNote(publicId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = noteFormSchema.safeParse(raw);

  if (!result.success) {
    throw new Error("Ogiltiga fält");
  }

  const boat = await prisma.boat.findUnique({ where: { publicId } });
  if (!boat) {
    throw new Error("Båt saknas");
  }

  await prisma.customerNote.create({
    data: {
      boatId: boat.id,
      noteType: result.data.noteType,
      message: result.data.message.trim(),
      customerName: sanitize(result.data.customerName),
      contact: sanitize(result.data.contact),
    },
  });

  revalidatePath(`/admin/boats/${boat.id}`);
  revalidatePath(`/boat/${publicId}`);
  revalidatePath("/admin/notes");
}

export async function toggleNoteResolved(noteId: string, isResolved: boolean) {
  const note = await prisma.customerNote.update({
    where: { id: noteId },
    data: { isResolved },
  });

  revalidatePath(`/admin/boats/${note.boatId}`);
  revalidatePath("/admin/notes");
}

export async function deleteServiceEntry(serviceId: string) {
  const service = await prisma.serviceEntry.delete({
    where: { id: serviceId },
    select: { boatId: true },
  });

  revalidatePath(`/admin/boats/${service.boatId}`);
  revalidatePath("/admin");
}







