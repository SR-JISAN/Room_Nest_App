import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status"
import { SubRoomBookingService } from "./sub.booking.service";
import { IRequestUser } from "../../middleware/check.auth";


const createBooking  = CatchAsync(async(req:Request,res:Response)=>{
  
    const user = req.user as IRequestUser
    const payload = req.body

    const result =await SubRoomBookingService.createBooking(user,payload)

    SendResponse(res,{
    success:true,
    statusCode:httpStatus.CREATED,
    message:"Your Sub Room Booking Created",
    data:result
  })
});


const getRoommatesRequest = CatchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const userId = user.userId as string;

    const result = await SubRoomBookingService.getRoommatesRequest(userId);

    SendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Roommate requests retrieved successfully",
      data: result,
    });
  },
);

const updateRoommatesRequest = CatchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const subBookingId = req.params.subBookingId as string;
    const  {status} = req.body;

    const result = await SubRoomBookingService.updateRoommatesRequest(userId, subBookingId, status);

    SendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Roommate request updated successfully",
      data: result,
    });
  },
);



export const SubRoomBookingController = {
  createBooking,
  getRoommatesRequest,
  updateRoommatesRequest,
};