import { Router } from "express"
import { PropertyController } from "./properties.controller";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";

import { createPropertyValidationSchema, updatePropertyValidationSchema, updateRoomValidationSchema } from "./properties.zod";
import { ValidateRequest } from "../../middleware/validate.schema";


const router = Router();

router.post("/create-properties",ValidateRequest(createPropertyValidationSchema),auth(Role.ADMIN,Role.LANDLORD),PropertyController.createProperties)
router.patch(
  "/update-properties/:propertyId",
  ValidateRequest(updatePropertyValidationSchema),
  auth(Role.ADMIN, Role.LANDLORD),
  PropertyController.updateProperties,
);
router.patch(
  "/update-room/:propertyId/:roomId",
  ValidateRequest(updateRoomValidationSchema),
  auth(Role.ADMIN, Role.LANDLORD),
  PropertyController.updateRoom,
);

export const PropertyRoute = router