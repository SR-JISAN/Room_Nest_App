import type { Request, Response } from "express";
import httpStatus from "http-status";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import { PaymentServices } from "./payments.service";
import type{ IRequestUser } from "../../middleware/check.auth";

const getMyPayments = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const { data, meta } = await PaymentServices.getMyPayments(req.query, user);
  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payments Retrieved Successfully",
    data,
    meta,
  });
});

const getAllPayments = CatchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await PaymentServices.getAllPayments(req.query);
  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payments Retrieved Successfully",
    data,
    meta,
  });
});

const getSinglePayment = CatchAsync(async (req: Request, res: Response) => {
  const paymentId = req.params.paymentId as string;
  const user = req.user as IRequestUser;

  const result = await PaymentServices.getSinglePayment(paymentId, user);
  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment Retrieved Successfully",
    data: result,
  });
});

export const PaymentController = {
  getMyPayments,
  getAllPayments,
  getSinglePayment,
};
