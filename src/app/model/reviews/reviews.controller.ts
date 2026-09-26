import type{ Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { ReviewService } from "./reviews.service";


const addReviews = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const roomId = req.params.roomId as string;
  const payload = req.body;

  const result = await ReviewService.addReviews(userId, roomId, payload);

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review created Successfully",
    data: result,
  });
});
const updateReviews = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const roomId = req.params.roomId as string;
  const payload = req.body;

  const result = await ReviewService.updateReviews(userId, roomId, payload);

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review updated Successfully",
    data: result,
  });
});
const deleteReviews = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const roomId = req.params.roomId as string;

  const result = await ReviewService.deleteReviews(userId, roomId);

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review deleted Successfully",
    data: result,
  });
});


export const reviewController = {
    addReviews,
    updateReviews,
    deleteReviews
}