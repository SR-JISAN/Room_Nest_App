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

router.get("/get-single-booking/:bookingId",auth(Role.LANDLORD, Role.ADMIN, Role.USER),BookingController.getSingleBooking);

router.patch("/cancel-booking/:bookingId",auth( Role.USER),BookingController.cancelBooking);

router.delete("/delete-booking/:bookingId",auth( Role.USER),BookingController.deleteBooking);


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