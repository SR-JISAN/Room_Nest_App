import express from "express";
import { auth } from "../../../middleware/check.auth";
import { Role } from "../../../../generated/prisma/enums";
import { DashboardController } from "./admin.dashboard.controller";



const router = express.Router();

router.get("/admin", auth(Role.ADMIN), DashboardController.getAdminDashboard);

export const AdminDashboardRoutes = router;
