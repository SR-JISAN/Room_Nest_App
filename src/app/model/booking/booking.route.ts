import { Router } from "express";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";
import { BookingController } from "./booking.controller";


const router = Router();


router.post("/create-booking",auth(Role.USER),BookingController.createBooking)



export const BookingRoute = router;