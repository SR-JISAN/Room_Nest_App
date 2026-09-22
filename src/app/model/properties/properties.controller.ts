import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import httpStatus from "http-status"
import { PropertiesService } from "./properties.service";
import { SendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import { CreatePropertyZodSchema } from "./properties.zod";


const createProperties = CatchAsync(async (req: Request, res: Response) => {
  const data = JSON.parse(req.body.data);
  const user = req.user as IRequestUser
  const propertyImages = req.files as {
    property_images?: Express.Multer.File[];
    rooms_images?: Express.Multer.File[];
  };
  const propertyImageFiles = propertyImages?.property_images || [];

 const validateData = CreatePropertyZodSchema.parse(data)

 const result = await PropertiesService.createProperties(
   validateData,
   propertyImageFiles,
   user,
 );

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Properties & Room Created Successfully",
    data: result,
  });
});


const uploadRoomImage = CatchAsync(async (req: Request, res: Response) => {

    const propertyId = req.params.propertyId as string;
    const roomId = req.params.roomId as string;
  
  const user = req.user as IRequestUser;
  const files = req.files as{ rooms_images?: Express.Multer.File[];}
  
  

  const roomImageFiles = files.rooms_images || [];
   if (!roomImageFiles.length) {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       "At least one room image is required",
     );
   };

  

  const result = await PropertiesService.uploadRoomImage(
   propertyId,
   roomId,
    roomImageFiles,
    user,
  );

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Room Image Created Successfully",
    data: result,
  });
});

const updateProperties = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user as IRequestUser;
  const propertyId = req.params.propertyId as string;

  const result = await PropertiesService.updateProperties(
    propertyId , payload,
    user,
  );
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property Updated Successfully",
    data: result,
  });
});


const updateRoom = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user as IRequestUser;
  const propertyId = req.params.propertyId as string;
  const  roomId = req.params.roomId as string;

  if (!propertyId || !roomId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Property ID and Room ID are required",
    );
  }

  const result = await PropertiesService.updateRoom(
    propertyId ,roomId, payload,user );
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Room Updated Successfully",
    data: result,
  });
});
const updatePropertyImages = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const propertyId = req.params.propertyId as string;
  const propertyImageId = req.params.propertyImageId as string;

  if (!propertyId || !propertyImageId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Property ID and Room ID are required",
    );
  }

  const result = await PropertiesService.updatePropertyImages(
    propertyId,
    propertyImageId,
    req.file?.buffer,
    user,
  );
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Room Updated Successfully",
    data: result,
  });
});




export const PropertyController = {
  createProperties,
  updateProperties,
  updateRoom,
  uploadRoomImage,
  updatePropertyImages,
};