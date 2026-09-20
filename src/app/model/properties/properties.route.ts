import { Router } from "express"
import { PropertyController } from "./properties.controller";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";


const router = Router();

router.post("/create-properties",auth(Role.ADMIN,Role.LANDLORD),PropertyController.createProperties)

export const PropertyRoute = router