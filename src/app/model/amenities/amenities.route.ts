import { Router } from "express";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";
import { AmenitiesController } from "./amenities.controller";


const router = Router();

router.get(
  "/get-amenities",
  auth(Role.ADMIN, Role.LANDLORD),
  AmenitiesController.getAmenities,
);
router.post("/add-amenities",auth(Role.ADMIN),AmenitiesController.addAmenities)
router.delete("/delete-amenities",auth(Role.ADMIN),AmenitiesController.deleteAmenities)


export const AmenitiesRouter = router