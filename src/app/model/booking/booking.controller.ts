import type{ Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status"
import { BookingService } from "./booking.service";
import type { ICreateBooking } from "./booking.interface";
import type{ IRequestUser } from "../../middleware/check.auth";



const createBooking =CatchAsync(async(req:Request,res:Response)=>{

    const userId =req.user?.userId as string;
    
    const payload = req.body as ICreateBooking;

const result = await BookingService.creteBooking(payload, userId);
    SendResponse(res,{
        success:true,
        statusCode:httpStatus.CREATED,
        message: "Booking has been created",
        data: result
    })
});


const getRequest = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const userId = user.userId as string;

  const result = await BookingService.getBooking(userId);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Booking requests retrieved successfully",
    data: result,
  });
});


const getSingleBooking = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const userId = user.userId as string;
  const bookingId = req.params.bookingId as string

  const result = await BookingService.getSingleBooking(userId, bookingId);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking requests retrieved successfully",
    data: result,
  });
});
const cancelBooking = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const userId = user.userId as string;
  const bookingId = req.params.bookingId as string

  const result = await BookingService.cancelBooking(userId, bookingId);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking Cancelled successfully",
    data: result,
  });
});
const deleteBooking = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const userId = user.userId as string;
  const bookingId = req.params.bookingId as string;

  const result = await BookingService.deleteBooking(userId, bookingId);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking deleted successfully",
    data: result,
  });
});


const payExistPayments = CatchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;

  const user = req.user as IRequestUser;

  const result = await BookingService.payExistPayments(bookingId, user);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment initiated successfully",
    data: result,
  });
});


const bookingPaymentCallback = CatchAsync(
  async (req: Request, res: Response) => {
    const { redirectURL } = await BookingService.bookingPaymentCallback(
      req.query,
    );
    res.redirect(redirectURL);
  },
);


const refundPayments = CatchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;

  const result = await BookingService.refundBooking(bookingId);
  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Appointment Cancelled & Refunded Successfully",
    data: result,
  });
});

export const BookingController = {
  createBooking,
  payExistPayments,
  bookingPaymentCallback,
  refundPayments,
  getRequest,
  getSingleBooking,
  cancelBooking,
  deleteBooking,
};