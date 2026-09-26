import type{ Request, Response } from "express"
import { CatchAsync } from "../../utils/catchAsync"
import { SendResponse } from "../../utils/sendResponse"
import httpStatus from "http-status";
import { AuthService } from "./auth.service";
import type{ IRequestUser } from "../../middleware/check.auth";
import { accessTokenCookies, refreshTokenCookies } from "../../utils/cookies";
import AppError from "../../utils/appError";
import config from "../../config";



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
      result.refreshToken,
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
  res.cookie("refreshToken", result.refreshToken, refreshTokenCookies);
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
  res.cookie("refreshToken", result.refreshToken, refreshTokenCookies);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your have been successfully Login by google",
    data: result,
  });
});


const refreshToken = CatchAsync(async (req: Request, res: Response) => {
  if (!req.cookies.refreshToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is missing");
  }
   
  const token = req.cookies.refreshToken;

  const result = await AuthService.refreshToken(token);

   const {accessToken, refreshToken: newRefreshToken} =result;

  res.cookie("accessToken", accessToken, accessTokenCookies);

  res.cookie("refreshToken", newRefreshToken, refreshTokenCookies);

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "New tokens generated successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
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
const resetPasswordVerified = CatchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user as IRequestUser

  const result =  await AuthService.resetPasswordVerified(payload,user);
    SendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "You updated your password successfully",
      data: result,
    });
  },
);
const myProfile = CatchAsync(async (req: Request, res: Response) => {
 
  const user = req.user as IRequestUser;

  const result = await AuthService.myProfile(user);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully get your profile",
    data: result,
  });
});

const logout = CatchAsync(async (req: Request, res: Response) => {
   const user = req.user as IRequestUser
  const result = await AuthService.logout(user);

res.clearCookie("accessToken", {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: config.node_env === "production" ? "none" : "lax",
  path: "/",
});

res.clearCookie("refreshToken", {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: config.node_env === "production" ? "none" : "lax",
  path: "/",
});

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "logout successful",
    data: result,
  });
});


export const AuthController = {
  register,
  emailVerify,
  login,
  googleLogin,
  updatePassword,
  resetPassword,
  resetPasswordVerified,
  refreshToken,
  myProfile,
  logout,
};