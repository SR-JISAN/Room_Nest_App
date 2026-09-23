import z from "zod";
import { PropertyType, RoomType } from "../../../generated/prisma/enums";

export const CreatePropertyZodSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Property title must be at least 3 characters")
    .max(100, "Property title cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Property description must be at least 10 characters")
    .max(2000, "Property description cannot exceed 2000 characters"),

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address cannot exceed 200 characters"),

  area: z
    .string()
    .trim()
    .min(2, "Area is required")
    .max(100, "Area cannot exceed 100 characters"),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(50, "City cannot exceed 50 characters"),

  latitude: z.string().trim().min(1, "Latitude is required"),

  longitude: z.string().trim().min(1, "Longitude is required"),

  propertyType: z.nativeEnum(PropertyType),

  // Property level amenities
  amenities: z
    .array(z.string().trim().min(1))
    .min(1, "At least one property amenity is required"),

  // Rooms
  rooms: z
    .array(
      z.object({
        roomTitle: z
          .string()
          .trim()
          .min(2, "Room title must be at least 2 characters")
          .max(100, "Room title cannot exceed 100 characters"),

        roomDescription: z
          .string()
          .trim()
          .min(5, "Room description must be at least 5 characters")
          .max(1000, "Room description cannot exceed 1000 characters"),

        rentAmount: z.coerce
          .number()
          .positive("Rent amount must be greater than 0"),

        securityDeposit: z.coerce
          .number()
          .nonnegative("Security deposit cannot be negative"),

        roomType: z.nativeEnum(RoomType),
        maxRoommates:z.number("you have to give minimum one max roommate").int().min(1).max(5),

        // Room level amenities
        amenities: z
          .array(z.string().trim().min(1))
          .min(1, "At least one room amenity is required"),
      }),
    )
    .min(1, "At least one room is required"),
});


export const updatePropertyValidationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Property title must be at least 3 characters")
    .max(50, "Property title cannot exceed 50 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .optional(),

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .optional(),

  area: z
    .string()
    .trim()
    .min(2, "Area is required")
    .max(100, "Area cannot exceed 100 characters")
    .optional(),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(50, "City cannot exceed 50 characters")
    .optional(),

  latitude: z.string().trim().min(1, "Latitude is required").optional(),

  longitude: z.string().trim().min(1, "Longitude is required").optional(),

  propertyType: z.enum(PropertyType).optional(),
});


export const updateRoomValidationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Room title must be at least 3 characters")
    .max(100, "Room title cannot exceed 100 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .min(10, "Room description must be at least 10 characters")
    .max(1000, "Room description cannot exceed 1000 characters")
    .optional(),

  rentAmount: z
    .number()
    .positive("Rent amount must be greater than 0")
    .optional(),

  securityDeposit: z
    .number()
    .nonnegative("Security deposit cannot be negative")
    .optional(),

  roomType: z.enum(RoomType).optional(),
  maxRoommates: z
    .number("you have to give minimum one max roommate")
    .int()
    .min(1)
    .max(5).optional(),
});
