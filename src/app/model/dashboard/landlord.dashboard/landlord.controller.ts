import type{ Request, Response } from "express";
import httpStatus from "http-status";
import { CatchAsync } from "../../../utils/catchAsync";
import { DashboardService } from "./landlord.service";
import { SendResponse } from "../../../utils/sendResponse";



const getLandlordDashboard = CatchAsync(async (req: Request, res: Response) => {
  
    const userId = req.user?.userId as string;
  
    const result = await DashboardService.getLandlordDashboard(userId);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Landlord dashboard retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  getLandlordDashboard,
};
