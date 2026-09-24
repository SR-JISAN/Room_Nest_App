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
router.get("/get-request",auth(Role.USER),SubRoomBookingController.getRoommatesRequest)
router.patch(
  "/update-request/:subBookingId",
  auth(Role.USER),
  SubRoomBookingController.updateRoommatesRequest,
);
export const SubBookingRoute = router;