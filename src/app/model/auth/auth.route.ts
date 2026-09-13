import { Router } from "express";
import { AuthController } from "./auth.controller";
import { ValidateRequest } from "../../middleware/validate.schema";
import { RegistrationValidationZODSchema, VerifyEmailZodSchema } from "./authUser.validation";


const router = Router()

router.post("/register",ValidateRequest(RegistrationValidationZODSchema),AuthController.register)
router.post("/email-verify",ValidateRequest(VerifyEmailZodSchema), AuthController.emailVerify)
export const AuthRoute = router;