import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import httpStatus from "http-status"
import { PropertiesService } from "./properties.service";
import { SendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../../middleware/check.auth";


const createProperties = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user as IRequestUser

 const result =  await PropertiesService.createProperties(payload,user);
  SendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Properties & Room Created Successfully",
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


export const PropertyController = {
  createProperties,
  updateProperties,
};