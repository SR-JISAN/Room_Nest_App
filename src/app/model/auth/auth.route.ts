import { Router } from "express";
import { AuthController } from "./auth.controller";
import { ValidateRequest } from "../../middleware/validate.schema";
import { LoginValidationZodSchema, RegistrationValidationZODSchema, ResetPasswordZodSchema, UpdatePasswordZodSchema, VerifyEmailZodSchema } from "./authUser.validation";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/check.auth";


const router = Router()

router.post("/register",ValidateRequest(RegistrationValidationZODSchema),AuthController.register)
router.post("/email-verify",ValidateRequest(VerifyEmailZodSchema), AuthController.emailVerify)
router.post("/google-login",AuthController.googleLogin)
router.post("/login",ValidateRequest(LoginValidationZodSchema),AuthController.login )

router.patch("/update-password",ValidateRequest(UpdatePasswordZodSchema),auth(Role.USER, Role.ADMIN, Role.LANDLORD),AuthController.updatePassword)
router.patch(
  "/reset-password",
  ValidateRequest(ResetPasswordZodSchema),
  auth(Role.USER, Role.ADMIN, Role.LANDLORD),
  AuthController.resetPassword,
);




export const AuthRoute = router;

