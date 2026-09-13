import { Request, Response } from "express"
import { CatchAsync } from "../../utils/catchAsync"
import { SendResponse } from "../../utils/sendResponse"
import httpStatus from "http-status";
import { AuthService } from "./auth.service";


const register = CatchAsync(async(req:Request,res:Response)=>{
   const payload =req.body;
    await AuthService.register(payload)
    SendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Send email verification otp successfully",
      data: null,
    });
});


const emailVerify = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.emailVerify(payload);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Your email verification is successful",
    data: result,
  });
});

export const AuthController = {
  register,
  emailVerify,
};