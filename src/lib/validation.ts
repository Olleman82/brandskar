import { z } from "zod";

export const boatFormSchema = z.object({
  name: z.string().min(2, "Ange ett namn"),
  model: z.string().optional(),
  year: z.string().optional(),
  hullId: z.string().optional(),
  coverImageUrl: z.string().optional(),
  notes: z.string().optional(),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  ownerEmail: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerAddress: z.string().optional(),
});

export const serviceFormSchema = z.object({
  title: z.string().min(2, "Ange ett namn"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Ange starttid"),
  endTime: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "INVOICED"]),
  hourlyRate: z.string().optional(),
  materialsCost: z.string().optional(),
  internalNote: z.string().optional(),
});

export const invoiceFormSchema = z.object({
  serviceIds: z.array(z.string().min(1)).min(1, "Välj minst en åtgärd"),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
  adminMemo: z.string().optional(),
});

export const noteFormSchema = z.object({
  message: z.string().min(3, "Beskriv noteringen"),
  noteType: z.enum(["ISSUE", "REQUEST", "INFO"]).default("INFO"),
  customerName: z.string().optional(),
  contact: z.string().optional(),
});
