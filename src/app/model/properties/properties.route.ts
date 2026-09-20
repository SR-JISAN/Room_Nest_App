import { Router } from "express"
import { PropertyController } from "./properties.controller";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";

import { createPropertyValidationSchema } from "./properties.zod";
import { ValidateRequest } from "../../middleware/validate.schema";


const router = Router();

router.post("/create-properties",ValidateRequest(createPropertyValidationSchema),auth(Role.ADMIN,Role.LANDLORD),PropertyController.createProperties)

export const PropertyRoute = router