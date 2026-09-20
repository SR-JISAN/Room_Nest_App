import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../middleware/check.auth";
import httpStatus from "http-status"
import AppError from "../../utils/appError";
import { Role } from "../../../generated/prisma/enums";
import { IProperty, IUpdateProperty, IUpdateRoom } from "./properties.interface";

 

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
    const amenities = await tx.amenities.findMany({
      where: {
        amenityName: {
          in: payload.amenities,
        },
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    if (amenities.length !== payload.amenities.length) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "One or more amenities are invalid",
      );
    }
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

         propertyAmenities: {
           create: payload.amenities.map((amenityName) => ({
             amenity: {
               connect: {
                 amenityName: amenityName,
               },
             },
           })),
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
         propertyAmenities: true,
       },
     });

     return property;
   });


   return result;
 };

 const updateProperties = async (
   propertyId: string,
   payload: IUpdateProperty,
   user: IRequestUser,
 ) => {
   const isExistUser = await prisma.users.findUnique({
     where: {
       email: user.email,
     },
   });

   if (!isExistUser) {
     throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
   }

   if (!isExistUser.emailVerified) {
     throw new AppError(httpStatus.BAD_REQUEST, "Your email is not verified");
   }

   if (isExistUser.status === "BLOCKED" || isExistUser.status === "DELETED") {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       `Your account is ${isExistUser.status}. Contact with authority.`,
     );
   }

   if (isExistUser.role === Role.USER) {
     throw new AppError(
       httpStatus.UNAUTHORIZED,
       "You are not authorized to update a property",
     );
   }

   const isExistProperty = await prisma.properties.findFirst({
     where: {
       id: propertyId,
       usersId: isExistUser.id,
       isDeleted: false,
     },
   });

   if (!isExistProperty) {
     throw new AppError(
       httpStatus.NOT_FOUND,
       "Property not found or you are not the owner",
     );
   }

   const result = await prisma.properties.update({
     where: {
       id: propertyId,
     },
     data: {
       ...payload,
     },
   });

   return result;
 };


 const updateRoom = async (
   propertyId: string,
   roomId: string,
   payload: IUpdateRoom,
   user: IRequestUser,
 ) => {
   const isExistUser = await prisma.users.findUnique({
     where: {
       email: user.email,
     },
   });

   if (!isExistUser) {
     throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
   }

   if (!isExistUser.emailVerified) {
     throw new AppError(httpStatus.BAD_REQUEST, "Your email is not verified");
   }

   if (isExistUser.status === "BLOCKED" || isExistUser.status === "DELETED") {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       `Your account is ${isExistUser.status}. Contact with authority.`,
     );
   }

   if (isExistUser.role === Role.USER) {
     throw new AppError(
       httpStatus.UNAUTHORIZED,
       "You are not authorized to update a room",
     );
   }

   // Check property ownership
   const isExistProperty = await prisma.properties.findFirst({
     where: {
       id: propertyId,
       usersId: isExistUser.id,
       isDeleted: false,
     },
   });

   if (!isExistProperty) {
     throw new AppError(
       httpStatus.NOT_FOUND,
       "Property not found or you are not the owner",
     );
   }

   // Check room belongs to this property
   const isExistRoom = await prisma.rooms.findFirst({
     where: {
       id: roomId,
       propertyId: propertyId,
       isDeleted: false,
     },
   });

   if (!isExistRoom) {
     throw new AppError(
       httpStatus.NOT_FOUND,
       "Room not found in this property",
     );
   }

   // Partial update
   const result = await prisma.rooms.update({
     where: {
       id: roomId,
     },
     data: {
       ...payload,
     },
   });

   return result;
 };




 export const PropertiesService = {
   createProperties,
   updateProperties,
   updateRoom,
 };