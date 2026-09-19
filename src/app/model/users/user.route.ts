import { Router } from "express";
import { UserController } from "./user.controller";
import { auth } from "../../middleware/check.auth";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";


const router =Router();

router.patch("/update-profile",auth(Role.ADMIN,Role.LANDLORD,Role.USER), UserController.updateProfile);
router.patch("/update-profile-image",upload.single("profile_image"),auth(Role.ADMIN,Role.LANDLORD,Role.USER), UserController.updateProfileImage);


export const UserRouter = router