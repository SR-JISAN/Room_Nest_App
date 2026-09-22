import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../middleware/check.auth";
import httpStatus from "http-status"
import AppError from "../../utils/appError";
import { Role } from "../../../generated/prisma/enums";
import { IProperty, IUpdateProperty, IUpdateRoom } from "./properties.interface";
import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";

 

 const createProperties = async (
   payload: IProperty,
   propertyImageFiles:Express.Multer.File[],
   
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

   const propertyImageCloudinaryResult = await Promise.all(propertyImageFiles.map(async(image)=>{
    return   new Promise<UploadApiResponse>((resolve,reject)=>{
        cloudinary.uploader.upload_stream({
            "resource_type": "auto"
        },
        async(error,result)=>{
            if(error){
                return reject(error)
            };
            
            if(!result){
                return reject(
                  new AppError(
                    httpStatus.BAD_REQUEST,
                    "No result returned from Cloudinary",
                  ),
                );
            };

            resolve(result)
        }
    
    ).end(image.buffer)
    })
   }));




   

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
     };
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
         propertyImages: {
           create: propertyImageCloudinaryResult.map((image) => ({
             propertyImageURL: image.secure_url,
             propertyImagePublicId: image.public_id,
           })),
         },

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
             roomAmenities: {
               create: payload.amenities.map((amenityName) => ({
                 amenity: {
                   connect: {
                     amenityName: amenityName,
                   },
                 },
               })),
             },
           })),
         },
       },

       include: {
         rooms: {
           include: {
             roomImages: true,
           },
         },
         propertyAmenities: true,
         propertyImages: true,
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

 const uploadRoomImage = async (
   propertyId:string,
   roomId:string,
   roomImageFiles: Express.Multer.File[],
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

      

     const isExistProperty = await prisma.properties.findFirst({
        where:{
            id:propertyId,
            isDeleted:false,
            usersId:isExistUser.id
        }
     });
     if(!isExistProperty){
        throw new AppError(httpStatus.NOT_FOUND,"Property Not Found")
     }

     const isExistRoom = await prisma.rooms.findFirst({
        where:{
            id:roomId,
            propertyId:isExistProperty?.id,
            isDeleted:false
        }
     })

     if (!isExistRoom) {
       throw new AppError(httpStatus.NOT_FOUND, "Property Not Found");
     }

     const roomImageCloudinaryResult = await Promise.all(
       roomImageFiles.map(async (image) => {
         return new Promise<UploadApiResponse>((resolve, reject) => {
           cloudinary.uploader
             .upload_stream(
               {
                 resource_type: "auto",
               },
               async (error, result) => {
                 if (error) {
                   return reject(error);
                 }

                 if (!result) {
                   return reject(
                     new AppError(
                       httpStatus.BAD_REQUEST,
                       "No result returned from Cloudinary",
                     ),
                   );
                 }

                 resolve(result);
               },
             )
             .end(image.buffer);
         });
       }),
     );

     await prisma.roomImage.createMany({
       data: roomImageCloudinaryResult.map((image) => ({
         roomId: roomId,
         roomImageURL: image.secure_url,
         roomImagePublicId : image.public_id
       })),
     });

     const result = await prisma.roomImage.findMany({
       where: {
         roomId,
       },
     });

     return result
 };

 const updatePropertyImages = async (
   propertyId: string,
   propertyImageId: string,
   buffer: Buffer | undefined,
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
   }

   const isExistProperty = await prisma.properties.findFirst({
     where: {
       id: propertyId,
       usersId: isExistUser.id,
       isDeleted: false,
     },
   });

   if (!isExistProperty) {
     throw new AppError(httpStatus.NOT_FOUND, "Property Doesn't exist.");
   }

   const isPropertyImageExist = await prisma.propertyImage.findFirst({
     where: {
       id: propertyImageId,
       propertyId: isExistProperty.id,
       isDeleted: false,
     },
   });
   if (!isPropertyImageExist) {
     throw new AppError(httpStatus.NOT_FOUND, "Property Doesn't exist.");
   };


   const uploadUpdatedPropertyImage = await  new Promise<UploadApiResponse>((resolve,reject)=>{
            cloudinary.uploader.upload_stream({
                "resource_type":"auto"
            },
            (error,result)=>{
                if(error){
                    reject(error)
                }
                if(!result){
                    throw new AppError(httpStatus.BAD_REQUEST,"Cloudinary Result not found")
                }
                resolve(result)
            }
        
        ).end(buffer)
    })
   


   const result = await prisma.propertyImage.update({
    where:{id:isPropertyImageExist.id},
    data:{
        propertyImageURL:uploadUpdatedPropertyImage.secure_url,
        propertyImagePublicId: uploadUpdatedPropertyImage.public_id
    }
   })

   if(uploadUpdatedPropertyImage && isPropertyImageExist.propertyImagePublicId){
    await cloudinary.uploader.destroy(isPropertyImageExist.propertyImagePublicId);
   }
return result;
 };




 export const PropertiesService = {
   createProperties,
   updateProperties,
   updateRoom,
   uploadRoomImage,
   updatePropertyImages,
 };