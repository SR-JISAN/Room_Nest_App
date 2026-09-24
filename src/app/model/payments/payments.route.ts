import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/check.auth";
import { PaymentController } from "./payments.controller";


const router = Router();

router.get("/my-payments", auth(Role.USER), PaymentController.getMyPayments);

router.get(
  "/all-payments",
  auth(Role.ADMIN, Role.LANDLORD),
  PaymentController.getAllPayments,
);

router.get(
  "/:paymentId",
  auth(Role.USER, Role.ADMIN, Role.LANDLORD),
  PaymentController.getSinglePayment,
);

export const PaymentRoutes = router;
