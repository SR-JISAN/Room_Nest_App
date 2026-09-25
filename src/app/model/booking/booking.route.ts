import { Router } from "express";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";
import { BookingController } from "./booking.controller";


const router = Router();


router.post(
  "/create-booking",
  auth(Role.USER),
  BookingController.createBooking,
);


router.get("/get-booking",auth(Role.LANDLORD, Role.ADMIN, Role.USER),BookingController.getRequest);


router.post(
  "/:bookingId/pay",
  auth(Role.USER),
  BookingController.payExistPayments,
);

router.get(
  "/booked-room/payment/callback",
  BookingController.bookingPaymentCallback,
);

router.post(
  "/refund-payments/:bookingId",
  auth(Role.ADMIN, Role.USER),
  BookingController.refundPayments,
);



export const BookingRoute = router;