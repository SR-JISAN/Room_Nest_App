import { z } from "zod";

export const CreateSubRoomBookingZodSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),

    age: z
      .number()
      .int("Age must be an integer")
      .min(1, "Age must be at least 1")
      .max(120, "Age must not exceed 120"),

    gender: z.enum(["MALE", "FEMALE", "OTHER"]),

    imageURL: z.string().url("Invalid image URL").optional(),

    roomId: z.string().uuid("Invalid room ID"),

    note: z.string().max(500, "Note must not exceed 500 characters").optional(),

    occupantCount: z
      .number()
      .int("Occupant count must be an integer")
      .min(1, "Occupant count must be at least 1")
      .default(1),

    startDate: z.coerce.date({
      message: "Invalid start date",
    }),

    endDate: z.coerce
      .date({
        message: "Invalid end date",
      })
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
