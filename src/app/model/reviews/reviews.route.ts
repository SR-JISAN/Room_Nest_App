import { Router } from "express";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";
import { reviewController } from "./reviews.controller";

const router = Router();


router.post("/add-review/:roomId",auth(Role.USER),reviewController.addReviews);
router.patch(
  "/update-review/:roomId",
  auth(Role.USER),
  reviewController.updateReviews,
);
router.delete(
  "/add-review/:roomId",
  auth(Role.USER),
  reviewController.deleteReviews,
);


export const ReviewRoute =router;