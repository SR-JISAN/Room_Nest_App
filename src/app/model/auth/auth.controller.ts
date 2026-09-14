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
      statusCode: httpStatus.OK,
      message: "Send email verification otp successfully",
      data: "verify the email with otp",
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

const login = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.login(payload);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your have been login successfully",
    data: result,
  });
});
const googleLogin = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.googleLogin();
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your have been successfully Login by google",
    data: result,
  });
});

export const AuthController = {
  register,
  emailVerify,
  login
};