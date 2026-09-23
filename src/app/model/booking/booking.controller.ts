import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import httpStatus from "http-status"
import { SendResponse } from "../../utils/sendResponse";
import { BookingService } from "./booking.service";
import { IRequestUser } from "../../middleware/check.auth";

const createBooking = CatchAsync(async(req:Request,res:Response)=>{
    const user =req.user as IRequestUser;
    const payload = req.body
    const result = await BookingService.createBooking(user,payload);
    SendResponse(res,{
        success:true,
        statusCode:httpStatus.CREATED,
        message:"Booking Created successfully",
        data:result
    })
});


export const BookingController = {
    createBooking
}