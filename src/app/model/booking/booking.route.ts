import { Router } from "express";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";
import { BookingController } from "./booking.controller";


const router = Router();


router.post("/create-booking",auth(Role.USER),BookingController.createBooking)
router.post("/:bookingId/pay", auth(Role.USER), BookingController.payExistPayments);


export const BookingRoute = router;