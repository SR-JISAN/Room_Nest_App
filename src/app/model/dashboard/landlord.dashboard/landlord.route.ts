import express from "express";
import { auth } from "../../../middleware/check.auth";
import { Role } from "../../../../generated/prisma/enums";
import { DashboardController } from "./landlord.controller";


const router = express.Router();



router.get(
  "/landlord",
  auth(Role.LANDLORD),
  DashboardController.getLandlordDashboard,
);

export const LandlordDashboardRoutes = router;
