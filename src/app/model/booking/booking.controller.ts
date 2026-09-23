import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status"
import { BookingService } from "./booking.service";
import { ICreateBooking } from "./booking.interface";


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



export const BookingController ={
    createBooking
};