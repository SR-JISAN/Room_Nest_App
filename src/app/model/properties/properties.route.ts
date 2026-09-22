import { Router } from "express"
import { PropertyController } from "./properties.controller";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";

import { updatePropertyValidationSchema, updateRoomValidationSchema } from "./properties.zod";
import { ValidateRequest } from "../../middleware/validate.schema";
import { upload } from "../../lib/multer";


const router = Router();

router.post(
  "/create-properties",
  upload.fields([
    { name: "property_images", maxCount: 6 },
    { name: "rooms_images", maxCount: 4 },
  ]),
  auth(Role.ADMIN, Role.LANDLORD),
  PropertyController.createProperties,
);
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