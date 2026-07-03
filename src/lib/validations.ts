import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

const optionalTrimmed = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")).transform((v) => (v ? v : null)),
  phone: optionalTrimmed,
  company: optionalTrimmed,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"] as const;

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  clientId: z.string().min(1, "Client is required"),
  status: z.enum(PROJECT_STATUSES),
  budget: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "" || v === null) return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : NaN;
    })
    .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), "Budget must be a positive number"),
  deadline: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? new Date(v) : null))
    .refine((v) => v === null || !Number.isNaN(v.getTime()), "Invalid date"),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  projectId: z.string().min(1, "Project is required"),
  status: z.enum(TASK_STATUSES).default("TODO"),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
});

// Explicit (not taskSchema.partial()) — .partial() keeps .default() values,
// which would reset status/priority on partial updates like drag-and-drop.
export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  projectId: z.string().min(1).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
