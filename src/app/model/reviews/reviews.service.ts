import { prisma } from "../../lib/prisma";
import AppError from "../../utils/appError";
import httpStatus from "http-status"
import type{ IReviewRating } from "./reviews.interface";

const addReviews = async (userId: string, roomId: string, payload: IReviewRating) => {
  // 1. Check user
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
      "Your email is not verified. Please verify your email.",
    );
  }

  if (isExistUser.status === "BLOCKED" || isExistUser.status === "DELETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your account is ${isExistUser.status}. Contact with authority.`,
    );
  }

  // 2. Check room
  const isExistRoom = await prisma.rooms.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!isExistRoom) {
    throw new AppError(httpStatus.NOT_FOUND, "Room not found.");
  }

  // 3. Check main booking
  const mainBooking = await prisma.booking.findFirst({
    where: {
      roomId,
      userId,
      status: "CONFIRMED",
    },
  });

  // 4. Check sub-room booking
  const subRoomBooking = await prisma.subRoomBooking.findFirst({
    where: {
      roomId,
      userId,
      status: "ACCEPTED",
    },
  });

  // 5. User must be either main user or accepted sub-room user
  if (!mainBooking && !subRoomBooking) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to review this room.",
    );
  }

  // 6. Prevent duplicate review
  const existingReview = await prisma.reviews.findFirst({
    where: {
      roomId,
      userId,
    },
  });

  if (existingReview) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this room.",
    );
  }

  // 7. Create review
  const result = await prisma.reviews.create({
    data: {
      note: payload.note!,
      reviewRating:payload.reviewRating,
      email: isExistUser.email,
      name: isExistUser.name,
      roomId,
      userId,
    },
  });

  return result;
};


const updateReviews = async(userId:string,roomId:string,payload:IReviewRating)=>{
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

  const isExistRoom = await prisma.rooms.findUnique({
    where: {
      id: roomId,
    },
    include: {
      booking: true,
    },
  });

  if (!isExistRoom) {
    throw new AppError(httpStatus.NOT_FOUND, "Room not found.");
  }

  const findReview = await prisma.reviews.findFirst({
    where:{
        roomId:isExistRoom.id,
        userId:isExistUser.id
    }
  })

  if(!findReview){
    throw new AppError(httpStatus.NOT_FOUND,"Review not found")
}

const result = await prisma.reviews.update({
    where:{id:findReview.id},
    data:{
        note:payload.note ?? findReview.note,
        reviewRating:payload.reviewRating ?? findReview.reviewRating
    }
})
 
  return result;
  
}
const deleteReviews = async(userId:string,roomId:string)=>{
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

  const isExistRoom = await prisma.rooms.findUnique({
    where: {
      id: roomId,
    },
    include: {
      booking: true,
    },
  });

  if (!isExistRoom) {
    throw new AppError(httpStatus.NOT_FOUND, "Room not found.");
  }

  const findReview = await prisma.reviews.findFirst({
    where:{
        roomId:isExistRoom.id,
        userId:isExistUser.id
    }
  })

  if(!findReview){
    throw new AppError(httpStatus.NOT_FOUND,"Review not found")
}

const result = await prisma.reviews.delete({
    where:{id:findReview.id},
})
 
  return result;
  
}

  

  
export const ReviewService ={
    addReviews,
    updateReviews,
    deleteReviews
}
  


