import { Router } from "express";
import { AuthController } from "./auth.controller";
import { ValidateRequest } from "../../middleware/validate.schema";
import { LoginValidationZodSchema, RegistrationValidationZODSchema, VerifyEmailZodSchema } from "./authUser.validation";


const router = Router()

router.post("/register",ValidateRequest(RegistrationValidationZODSchema),AuthController.register)
router.post("/email-verify",ValidateRequest(VerifyEmailZodSchema), AuthController.emailVerify)

router.post("/login",ValidateRequest(LoginValidationZodSchema),AuthController.login )




export const AuthRoute = router;

