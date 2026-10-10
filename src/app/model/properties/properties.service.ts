import { prisma } from "../../lib/prisma";
import type{ IRequestUser } from "../../middleware/check.auth";
import httpStatus from "http-status"
import AppError from "../../utils/appError";
import type{ PropertyType } from "../../../generated/prisma/enums";
import { PropertyStatus, Role } from "../../../generated/prisma/enums";
import type{ IGetProperties, IProperty, IUpdateProperty, IUpdateRoom } from "./properties.interface";
import type{ UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import type{ PropertiesWhereInput } from "../../../generated/prisma/models";

 

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

   const propertyImageCloudinaryResult = await Promise.all(propertyImageFiles.map((image)=>{
    return   new Promise<UploadApiResponse>((resolve,reject)=>{
        cloudinary.uploader.upload_stream({
            "resource_type": "auto"
        },
        (error,result)=>{
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


   const results = await prisma.$transaction(async (tx) => {
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
             maxRoommates:room.maxRoommates,
             subRentAmount:room.subRentAmount,
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

   return results;
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

   if (payload.maxRoommates !== undefined && payload.maxRoommates < isExistRoom.currentRoommates) {
     throw new AppError(httpStatus.CONFLICT, "Maximum occupants cannot be lower than the current resident count.");
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
       roomImageFiles.map( (image) => {
         return new Promise<UploadApiResponse>((resolve, reject) => {
           cloudinary.uploader
             .upload_stream(
               {
                 resource_type: "auto",
               },
                (error, result) => {
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

     const results = await prisma.roomImage.findMany({
       where: {
         roomId,
       },
     });

     return results;
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
     throw new AppError(httpStatus.NOT_FOUND, "Property Image Doesn't exist.");
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
   


   const results = await prisma.propertyImage.update({
    where:{id:isPropertyImageExist.id},
    data:{
        propertyImageURL:uploadUpdatedPropertyImage.secure_url,
        propertyImagePublicId: uploadUpdatedPropertyImage.public_id
    }
   })

   if(uploadUpdatedPropertyImage && isPropertyImageExist.propertyImagePublicId){
    await cloudinary.uploader.destroy(isPropertyImageExist.propertyImagePublicId);
   }
return results;
 };


 const updateRoomImage = async (
   propertyId: string,
   roomId:string,
   roomImageId: string,
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
   };

   const isExistRoom = await prisma.rooms.findFirst({
     where: {
       id: roomId,
       propertyId:propertyId,
       isDeleted: false,
     },
   });

   if (!isExistRoom) {
     throw new AppError(httpStatus.NOT_FOUND, "Room Doesn't exist.");
   };

   const isRoomImageExist = await prisma.roomImage.findFirst({
     where: {
       id: roomImageId,
       roomId: isExistRoom.id,
       isDeleted: false,
     },
   });
   if (!isRoomImageExist) {
     throw new AppError(httpStatus.NOT_FOUND, "Room Image Doesn't exist.");
   }

   const uploadUpdatedRoomImage = await new Promise<UploadApiResponse>(
     (resolve, reject) => {
       cloudinary.uploader
         .upload_stream(
           {
             resource_type: "auto",
           },
           (error, result) => {
             if (error) {
               reject(error);
             }
             if (!result) {
               throw new AppError(
                 httpStatus.BAD_REQUEST,
                 "Cloudinary Result not found",
               );
             }
             resolve(result);
           },
         )
         .end(buffer);
     },
   );

   const results = await prisma.roomImage.update({
     where: { id: isRoomImageExist.id },
     data: {
       roomImageURL: uploadUpdatedRoomImage.secure_url,
       roomImagePublicId: uploadUpdatedRoomImage.public_id,
     },
   });

   if (uploadUpdatedRoomImage && isRoomImageExist.roomImagePublicId) {
     await cloudinary.uploader.destroy(
       isRoomImageExist.roomImagePublicId,
     );
   }
   return results;
 };


 const deleteProperty = async (userId: string, propertyId:string )=>{
    const isExistUser = await prisma.users.findUnique({
      where: {
        id:userId
      },
    });
    if (!isExistUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
    };

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
        where:{
            id:propertyId,
            isDeleted: false,
            ...(isExistUser.role === Role.LANDLORD ? { usersId: isExistUser.id } : {}),
        }
    });

    if(!isExistProperty){
        throw new AppError(httpStatus.NOT_FOUND,"Property not found")
    };

    const result = await prisma.properties.update({
        where:{
            id:isExistProperty.id
        },
        data: { isDeleted: true, deletedAt: new Date() },
    });

    return result;

 };



 const deleteRoom = async (userId: string, propertyId: string,roomId:string) => {
   const isExistUser = await prisma.users.findUnique({
     where: {
       id: userId,
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
       isDeleted: false,
       ...(isExistUser.role === Role.LANDLORD ? { usersId: isExistUser.id } : {}),
     },
   });

   if (!isExistProperty) {
     throw new AppError(httpStatus.NOT_FOUND, "Property not found");
   }

   const isExistRoom = await prisma.rooms.findFirst({
     where: {
       id: roomId,
       propertyId: isExistProperty.id,
       isDeleted: false,
     },
   });

   if (!isExistRoom) {
     throw new AppError(httpStatus.NOT_FOUND, "Room not found");
   }

   const result = await prisma.rooms.update({
     where: {
       id: isExistRoom.id,
     },
     data: { isDeleted: true, deletedAt: new Date() },
   });

   return result;
 };


const getAllProperties = async (query: IGetProperties) => {
  const parsedLimit = Number(query.limit);
  const parsedPage = Number(query.page);

  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(50, Math.floor(parsedLimit))
      : 10;

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const skip = (page - 1) * limit;

  const sortBy =
    query.sortBy && ["createdAt", "title"].includes(query.sortBy)
      ? query.sortBy
      : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: PropertiesWhereInput[] = [
    {
      isDeleted: false,
    },
  ];

  // Search by title, address, area, or city
  if (query.searchTerm?.trim()) {
    const searchTerm = query.searchTerm.trim();

    andConditions.push({
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          address: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          area: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // Filter by title
  if (query.title?.trim()) {
    andConditions.push({
      title: {
        contains: query.title.trim(),
        mode: "insensitive",
      },
    });
  }

  // Filter by property type
  if (query.propertyType) {
    andConditions.push({
      propertyType: query.propertyType as PropertyType,
    });
  }

  // Filter by amenities
  if (query.propertyAmenities?.trim()) {
    const amenities = query.propertyAmenities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (amenities.length > 0) {
      andConditions.push({
        propertyAmenities: {
          some: {
            amenity: {
              amenityName: {
                in: amenities,
              },
            },
          },
        },
      });
    }
  }

  const where: PropertiesWhereInput = {
    AND: andConditions,
  };

  const [result, totalCount] = await Promise.all([
    prisma.properties.findMany({
      where,
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        rooms: {
          where: {
            isDeleted: false,
          },
        },
        propertyImages: {
          where: {
            isDeleted: false,
          },
        },
        propertyAmenities: {
          include: {
            amenity: true,
          },
        },
      },
    }),

    prisma.properties.count({
      where,
    }),
  ]);

  return {
    result,
    Meta: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};



const getSingleProperty = async(propertyId:string)=>{
  const isExistProperty =await prisma.properties.findUnique({
    where:{id:propertyId},
    include:{
      propertyAmenities:true,
      propertyImages: { where: { isDeleted: false } },
      rooms:{
        where: { isDeleted: false },
        include:{
          roomImages: { where: { isDeleted: false } },
          roomAmenities:true
        }
      }
    }
  });
  if(!isExistProperty){
    throw new AppError(httpStatus.NOT_FOUND,"Property not found.")
  };
  if(isExistProperty.isDeleted){
    throw new AppError(httpStatus.NOT_FOUND,"Property not found.")
  };

return isExistProperty
};

const getMyProperty = async (userId: string, propertyId: string) => {
  const property = await prisma.properties.findFirst({
    where: { id: propertyId, usersId: userId, isDeleted: false },
    include: {
      propertyAmenities: true,
      propertyImages: { where: { isDeleted: false } },
      rooms: {
        where: { isDeleted: false },
        include: {
          roomImages: { where: { isDeleted: false } },
          roomAmenities: true,
        },
      },
    },
  });
  if (!property) throw new AppError(httpStatus.NOT_FOUND, "Property not found.");
  return property;
};

const getAdminProperties = async (page: number, limit: number, status?: PropertyStatus) => {
  const where = { isDeleted: false, ...(status ? { propertyStatus: status } : {}) };
  const [result, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      include: {
        propertyImages: { where: { isDeleted: false } },
        propertyAmenities: true,
        users: { select: { id: true, name: true, email: true } },
        rooms: { where: { isDeleted: false }, select: { id: true, title: true, roomStatus: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.properties.count({ where }),
  ]);
  return { result, Meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const updatePropertyStatus = async (propertyId: string, status: PropertyStatus) => {
  const property = await prisma.properties.findFirst({ where: { id: propertyId, isDeleted: false } });
  if (!property) throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  return prisma.properties.update({
    where: { id: property.id },
    data: { propertyStatus: status, verified: status === PropertyStatus.APPROVED },
  });
};

const getMyProperties = async (userId: string, page = 1, limit = 20) => {
  const where = { usersId: userId, isDeleted: false };
  const [result, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      include: {
        propertyImages: true,
        propertyAmenities: true,
        rooms: { where: { isDeleted: false }, include: { roomImages: true, roomAmenities: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.properties.count({ where }),
  ]);
  return { result, Meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getSingleRoom = async (propertyId: string,roomId:string) => {
  const isExistProperty = await prisma.properties.findUnique({
    where: { id: propertyId },
  });
  if (!isExistProperty) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found.");
  }
  if (isExistProperty.isDeleted || isExistProperty.propertyStatus !== "APPROVED") {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found.");
  }

  const isRoomExist = await prisma.rooms.findFirst({
    where: {
      id: roomId,
      propertyId,
      isDeleted: false,
    },
    include: {
      roomAmenities: true,
      roomImages: true,
    },
  });

  if (!isRoomExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Room not found.");
  };
  return isRoomExist;
};



 export const PropertiesService = {
   createProperties,
   updateProperties,
   updateRoom,
   uploadRoomImage,
   updatePropertyImages,
   updateRoomImage,
   deleteProperty,
   deleteRoom,
   getAllProperties,
   getMyProperties,
   getSingleProperty,
   getMyProperty,
   getAdminProperties,
   updatePropertyStatus,
   getSingleRoom,
 };
