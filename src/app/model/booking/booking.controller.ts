import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status"
import { BookingService } from "./booking.service";
import { ICreateBooking } from "./booking.interface";
import { IRequestUser } from "../../middleware/check.auth";


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


export const BookingController = {
  createBooking,
  payExistPayments,
  bookingPaymentCallback,
};