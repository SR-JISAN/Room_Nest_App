import { Router } from "express";
import { auth } from "../../../middleware/check.auth";
import { Role } from "../../../../generated/prisma/enums";
import { DashboardController } from "./user.controller";


const router= Router();

router.get("/user", auth(Role.USER), DashboardController.getUserDashboard);


export const UserDashboard = router;