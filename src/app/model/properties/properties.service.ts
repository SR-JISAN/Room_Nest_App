import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../middleware/check.auth";
import httpStatus from "http-status"
import AppError from "../../utils/appError";
import { Role } from "../../../generated/prisma/enums";
import { IProperty } from "./properties.interface";

 

 const createProperties = async(payload:IProperty,user:IRequestUser)=>{
   const isExistUser = await prisma.users.findUnique({
     where: {
       email: user.email,
     },
   });
   if (!isExistUser) {
     throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
   }

   if (!isExistUser.emailVerified) {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       "your email is not verified please verified with re-registration",
     );
   }

   if (isExistUser.status === "BLOCKED" || isExistUser.status === "DELETED") {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       `your email is ${isExistUser.status}. contact with authority`,
     );
   }
   if (isExistUser.role === Role.USER) {
     throw new AppError(
       httpStatus.UNAUTHORIZED,
       "You are not accessible for this route",
     );
   };


   const result = await prisma.$transaction(async (tx) => {
     const property = await tx.properties.create({
       data: {
         title: payload.title,
         description: payload.description,
         address: payload.address,
         area: payload.area,
         city: payload.city,
         latitude: payload.latitude,
         longitude: payload.longitude,
         propertyType: payload.propertyType,

         users: {
           connect: {
             id: isExistUser.id,
           },
         },

         rooms: {
           create: payload.rooms.map((room) => ({
             title: room.roomTitle,
             description: room.roomDescription,
             rentAmount: room.rentAmount,
             securityDeposit: room.securityDeposit,
             roomType: room.roomType,
           })),
         },
       },

       include: {
         rooms: true,
         propertyImages: true,
         propertyAmenities: true,
       },
     });

     return property;
   });


   return result;
 };

 


 export const PropertiesService = {
    createProperties
 }