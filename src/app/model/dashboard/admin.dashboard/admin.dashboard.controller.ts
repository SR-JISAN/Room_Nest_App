import type{ Request, Response } from "express";
import httpStatus from "http-status";
import { CatchAsync } from "../../../utils/catchAsync";
import { DashboardService } from "./admin.dashboard.service";
import { SendResponse } from "../../../utils/sendResponse";


const getAdminDashboard = CatchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getAdminDashboard();

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin dashboard retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  getAdminDashboard,
};
