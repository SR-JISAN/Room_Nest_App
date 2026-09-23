import { z } from "zod";

export const CreateBookingZodSchema = z
  .object({
    roomId: z.string().uuid("Invalid room ID"),

    occupantCount: z
      .number()
      .int("Occupant count must be an integer")
      .min(1, "At least 1 occupant is required")
      .max(5, "Maximum 5 occupants are allowed"),

    startDate: z.coerce
      .date()
      .refine((date) => date > new Date(), "Start date must be in the future"),

    endDate: z.coerce.date().optional(),

    note: z
      .string()
      .trim()
      .max(500, "Note cannot exceed 500 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;

      return data.endDate > data.startDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );
