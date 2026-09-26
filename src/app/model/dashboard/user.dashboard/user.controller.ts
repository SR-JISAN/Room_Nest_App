import type{ Request, Response } from "express";
import { CatchAsync } from "../../../utils/catchAsync";
import { DashboardService } from "./user.service";
import { SendResponse } from "../../../utils/sendResponse";
import httpStatus from "http-status"

const getUserDashboard = CatchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string
  const result = await DashboardService.getUserDashboard(userId);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User dashboard retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  getUserDashboard,
};
