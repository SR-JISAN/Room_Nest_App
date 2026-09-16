import { Request, Response } from "express"
import { CatchAsync } from "../../utils/catchAsync"
import { SendResponse } from "../../utils/sendResponse"
import httpStatus from "http-status";
import { AuthService } from "./auth.service";
import { IRequestUser } from "../../middleware/check.auth";
import { accessTokenCookies, refreshTokenCookies } from "../../utils/cookies";



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
  res.cookie(
      "accessToken",
      result.accessToken,
      accessTokenCookies
      
    );
  res.cookie(
      "refreshToken",
      result.accessToken,
      refreshTokenCookies
    )
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

  res.cookie("accessToken", result.accessToken, accessTokenCookies);
  res.cookie("refreshToken", result.accessToken, refreshTokenCookies);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your have been login successfully",
    data: result,
  });
});

const googleLogin = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.googleLogin(payload);

  res.cookie("accessToken", result.accessToken, accessTokenCookies);
  res.cookie("refreshToken", result.accessToken, refreshTokenCookies);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your have been successfully Login by google",
    data: result,
  });
});
const updatePassword = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user as unknown as IRequestUser

  const result = await AuthService.updatePassword(payload,user);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your password was updated",
    data: result,
  });
});
const resetPassword = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

   await AuthService.resetPassword(payload);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "An otp sent to your email. please verify it to reset password",
    data: null,
  });
});


export const AuthController = {
  register,
  emailVerify,
  login,
  googleLogin,
  updatePassword,
  resetPassword,
};