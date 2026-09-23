import { Router } from "express";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";
import { BookingController } from "./booking.controller";
import { ValidateRequest } from "../../middleware/validate.schema";
import { CreateBookingZodSchema } from "./booking.zod";

const router = Router();

router.post("/create-booking",auth(Role.USER), ValidateRequest(CreateBookingZodSchema),BookingController.createBooking);

export const BookingRoute =router;