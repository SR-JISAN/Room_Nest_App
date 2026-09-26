import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import type { IAddAmenities } from "./amenities.interface";

const getAmenities = async (user: IRequestUser) => {
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
      "You are not authorized to add amenities",
    );
  }

  const result = await prisma.amenities.findMany({
    select: {
        id:true,
        amenityName:true
    },
    orderBy:[
        {
        amenityName:"asc"
        },
        {
            createdAt:"desc"
         }
     ]
  })

  return result;
};


const addAmenities =async (payload:IAddAmenities,user:IRequestUser)=>{
  const isExistUser = await prisma.users.findUnique({
    where: {
      email: user.email,
      role: Role.ADMIN
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

  if (isExistUser.role !== Role.ADMIN) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to add amenities",
    );
  };

  const findDuplicate = await prisma.amenities.findUnique({
    where:{
        amenityName:payload.amenityName
    }
  });

  if(findDuplicate){
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "you are trying to duplicate amenities"
    );
  };

  const result = await prisma.amenities.create({
    data:{
        amenityName: payload.amenityName
    }
  });

  return result
};


const deleteAmenities =async (payload:IAddAmenities,user:IRequestUser)=>{
  const isExistUser = await prisma.users.findUnique({
    where: {
      email: user.email,
      role: Role.ADMIN
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

  if (isExistUser.role !== Role.ADMIN) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to add amenities",
    );
  };

  const isExistAmenities = await prisma.amenities.findUnique({
    where:{
        amenityName:payload.amenityName
    }
  });

  if(!isExistAmenities){
    throw new AppError(
      httpStatus.NOT_FOUND,
      "This amenity not found",
    );
  };

  const deleteAmenities = await prisma.amenities.delete({
    where:{
        amenityName:payload.amenityName
    }
  })


}

export const AmenitiesService = {
  addAmenities,
  deleteAmenities,
  getAmenities,
};