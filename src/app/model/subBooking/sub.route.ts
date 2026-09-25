import { Router } from "express";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";
import { ValidateRequest } from "../../middleware/validate.schema";
import { CreateSubRoomBookingZodSchema } from "./sub.room.zod";
import { SubRoomBookingController } from "./sub.booking.controller";

const router = Router();

router.post(
  "/request-sub-room-booking",
  auth(Role.USER),
  ValidateRequest(CreateSubRoomBookingZodSchema),
  SubRoomBookingController.createBooking,
);

router.post(
  "/pay/:subBookingId",
  auth(Role.USER),
  SubRoomBookingController.paySubBooking,
);

router.get(
  "/payment/callback",
  SubRoomBookingController.subBookingPaymentCallback,
);

router.get("/get-request",auth(Role.USER),SubRoomBookingController.getRoommatesRequest)
router.get("/get-my-request",auth(Role.USER),SubRoomBookingController.getMyRequest)


router.patch(
  "/update-request/:subBookingId",
  auth(Role.USER),
  SubRoomBookingController.updateRoommatesRequest,
);
router.patch(
  "/cancel-request/:subBookingId",
  auth(Role.USER),
  SubRoomBookingController.cancelSubRoomBooking,
);


export const SubBookingRoute = router;