import z from "zod";

export const updateProfileValidationZODSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(1, "Bio cannot be empty")
    .max(500, "Bio cannot exceed 500 characters")
    .optional(),

  address: z
    .string()
    .trim()
    .min(1, "Address cannot be empty")
    .max(255, "Address cannot exceed 255 characters")
    .optional(),

  occupation: z
    .string()
    .trim()
    .min(1, "Occupation cannot be empty")
    .max(100, "Occupation cannot exceed 100 characters")
    .optional(),

  contactNumber: z
    .string()
    .trim()
    .regex(
      /^(?:\+8801|01)[3-9]\d{8}$/,
      "Please provide a valid Bangladesh mobile number",
    )
    .optional(),

  dateOfBirth: z
    .string()
    .datetime({
      message: "Please provide a valid date of birth",
    })
    .optional(),
});