import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status"
import { UserService } from "./user.service";
import { IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import config from "../../config";



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


export const UserController = {
  updateProfile,
  updateProfileImage,
};