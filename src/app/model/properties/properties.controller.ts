import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import httpStatus from "http-status"
import { PropertiesService } from "./properties.service";
import { SendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../../middleware/check.auth";


const createProperties = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user as IRequestUser

 const result =  await PropertiesService.createProperties(payload,user);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "An otp sent to your email. please verify it to reset password",
    data: result,
  });
});


export const PropertyController = {
  createProperties,
};