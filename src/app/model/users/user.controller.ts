import type{ Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status"
import { UserService } from "./user.service";
import type{ IRequestUser } from "../../middleware/check.auth";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../utils/appError";




const updateProfile = CatchAsync(async(req:Request, res:Response)=>{
  
    const payload = req.body;
    const user = req.user as IRequestUser
  
    const result = await UserService.updateProfile(
      payload,
      user,
    );

    SendResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"profile updated successfully",
    data:result
  })
});
const updateProfileImage = CatchAsync(async(req:Request, res:Response)=>{
  
    const user = req.user as IRequestUser
  
    const result = await UserService.updateProfileImage(
      req.file?.buffer,
      user,
    );

    SendResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"profile updated successfully",
    data:result
  })
});

const getAdminUsers = CatchAsync(async (req: Request, res: Response) => {
  const pageInput = Number(req.query.page ?? 1);
  const limitInput = Number(req.query.limit ?? 20);
  const page = Number.isFinite(pageInput) ? Math.max(1, Math.floor(pageInput)) : 1;
  const limit = Number.isFinite(limitInput) ? Math.min(50, Math.max(1, Math.floor(limitInput))) : 20;
  const roleInput = req.query.role?.toString();
  const statusInput = req.query.status?.toString();
  const roles = Object.values(Role) as string[];
  const statuses = Object.values(UserStatus) as string[];
  if (roleInput && !roles.includes(roleInput)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid role filter");
  if (statusInput && !statuses.includes(statusInput)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid status filter");
  const result = await UserService.getAdminUsers(page, limit, roleInput as Role | undefined, statusInput as UserStatus | undefined);
  SendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Users retrieved successfully", data: result });
});

const updateAdminUserStatus = CatchAsync(async (req: Request, res: Response) => {
  const status = req.body?.status as UserStatus;
  if (!Object.values(UserStatus).includes(status)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid user status");
  const user = req.user as IRequestUser;
  const result = await UserService.updateAdminUserStatus(req.params.userId as string, status, user.userId);
  SendResponse(res, { success: true, statusCode: httpStatus.OK, message: "User status updated successfully", data: result });
});


export const UserController = {
  updateProfile,
  updateProfileImage,
  getAdminUsers,
  updateAdminUserStatus,
};
