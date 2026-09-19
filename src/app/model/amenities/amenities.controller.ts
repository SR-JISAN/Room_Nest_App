import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { SendResponse } from "../../utils/sendResponse";
import  httpStatus  from "http-status";
import { AmenitiesService } from "./amenities.service";
import { IRequestUser } from "../../middleware/check.auth";

const getAmenities = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await AmenitiesService.getAmenities( user);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Amenities found all Successfully",
    data: result,
  });
});
const addAmenities = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const user = req.user as IRequestUser

 const result = await AmenitiesService.addAmenities(payload,user);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Amenities Created Successfully",
    data: result,
  });
});


const deleteAmenities = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const user = req.user as IRequestUser

 const result = await AmenitiesService.deleteAmenities(payload,user);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Amenities Deleted Successfully",
    data: result,
  });
});


export const AmenitiesController = {
  addAmenities,
  deleteAmenities,
  getAmenities,
};