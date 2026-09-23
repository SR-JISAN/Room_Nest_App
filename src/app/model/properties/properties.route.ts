import { Router } from "express"
import { PropertyController } from "./properties.controller";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";

import { updatePropertyValidationSchema, updateRoomValidationSchema } from "./properties.zod";
import { ValidateRequest } from "../../middleware/validate.schema";
import { upload } from "../../lib/multer";


const router = Router();


router.get("/all-properties",PropertyController.getAllProperties);
router.get("/:propertyId", PropertyController.getSingleProperty);
router.get("/:propertyId/:roomId", PropertyController.getSingleRoom);

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
router.post(
  "/create-room-images/:propertyId/:roomId",
  upload.fields([{ name: "rooms_images", maxCount: 4 }]),
  auth(Role.ADMIN, Role.LANDLORD),
  PropertyController.uploadRoomImage,
);

router.patch(
  "/update-property-images/:propertyId/:propertyImageId",
  upload.single("property_images"),
  auth(Role.ADMIN, Role.LANDLORD),
  PropertyController.updatePropertyImages,
);


router.patch(
  "/update-room-images/:propertyId/:roomId/:roomImageId",
  upload.single("rooms_images"),
  auth(Role.ADMIN, Role.LANDLORD),
  PropertyController.updateRoomImage,
);

router.delete("/delete-property/:propertyId",auth(Role.ADMIN,Role.LANDLORD),PropertyController.deleteProperty)
router.delete("/delete-room/:propertyId/:roomId",auth(Role.ADMIN,Role.LANDLORD),PropertyController.deleteRoom)

export const PropertyRoute = router