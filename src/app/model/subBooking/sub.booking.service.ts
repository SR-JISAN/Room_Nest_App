import { BookingStatus, PaymentStatus, Role, RoomStatus, SubBookingStatus, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import httpStatus from "http-status";
import { ICreateSubRoomBooking } from "./sub.booking.interface";

const createBooking = async (
  user: IRequestUser,
  payload: ICreateSubRoomBooking,
) => {
  const isExistSubUser = await prisma.users.findUnique({
    where: {
      id: user.userId,
    },
  });

  if (!isExistSubUser) {
    throw new AppError(httpStatus.NOT_FOUND, "sub user not found");
  }

  if (isExistSubUser.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "sub user is deleted");
  }

  if (!isExistSubUser.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "sub user is not verified");
  }

  if (isExistSubUser.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `sub user is ${isExistSubUser.status}`,
    );
  }

  if (isExistSubUser.role !== Role.USER) {
    throw new AppError(httpStatus.UNAUTHORIZED, "you are not authorized");
  }

  const applyRoomExist = await prisma.rooms.findUnique({
    where: {
      id: payload.roomId,
    }
  });

  if (!applyRoomExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Room not found.");
  }

  if (applyRoomExist.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "Room is deleted.");
  }

  if (applyRoomExist.roomStatus === RoomStatus.UNAVAILABLE) {
    throw new AppError(httpStatus.BAD_REQUEST, "Room is unavailable.");
  }

  if (
    applyRoomExist.maxRoommates === applyRoomExist.currentRoommates ||
    applyRoomExist.maxRoommates < applyRoomExist.currentRoommates
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "This Room is Full.");
  };

  const occupantCount = payload.occupantCount ?? 1;


  if (
    applyRoomExist.maxRoommates <
    applyRoomExist.currentRoommates + occupantCount
  ) {
    if (payload.endDate) {
      if (payload.startDate < payload.endDate) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "This room does not have enough space",
        );
      }
    }
  }

 if(payload.endDate){
     if (payload.startDate >= payload.endDate) {
       throw new AppError(httpStatus.BAD_REQUEST, "select a valid end date");
     }
 }

 if(applyRoomExist.currentRoommates === 0){
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "There are no existing roommates in this room. You cannot send a roommate booking request",
    );
 }

  const result = await prisma.subRoomBooking.create({
    data:{
        name:payload.name,
        age:payload.age,
        gender:payload.gender,
        occupantCount:payload.occupantCount ?? occupantCount,
        roomId:applyRoomExist.id,
        startDate:payload.startDate,
        userId:isExistSubUser.id,
        subRentAmount:applyRoomExist.subRentAmount
    }
  });

  return result
};

const getRoommatesRequest = async (userId: string) => {
 
  const isExistSubUser = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExistSubUser) {
    throw new AppError(httpStatus.NOT_FOUND, "sub user not found");
  }

  if (isExistSubUser.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "sub user is deleted");
  }

  if (!isExistSubUser.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "sub user is not verified");
  }

  if (isExistSubUser.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `sub user is ${isExistSubUser.status}`,
    );
  }

  if (isExistSubUser.role !== Role.USER) {
    throw new AppError(httpStatus.UNAUTHORIZED, "you are not authorized");
  }


  const bookings = await prisma.booking.findMany({
    where: {
      userId: userId,

      status: BookingStatus.CONFIRMED,

      payments: {
        some: {
          paymentStatus: PaymentStatus.PAID,
        },
      },
    },

    include: {
      room: {
        include: {
          subBooking: true,
        },
      },

      payments: {
        where: {
          paymentStatus: PaymentStatus.PAID,
        },
      },
    },
  });

 
  if (bookings.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "you don't have any paid room");
  }

  const result = bookings.map((booking) => ({
    bookingId: booking.id,

    room: booking.room,

    requests: booking.room.subBooking,
  }));

  return result;
};

const updateRoommatesRequest = async (
  userId: string,
  subBookingId: string,
  status: SubBookingStatus,
) => {
  // 1. Check user
  const isExistSubUser = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExistSubUser) {
    throw new AppError(httpStatus.NOT_FOUND, "sub user not found");
  }

  if (isExistSubUser.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "sub user is deleted");
  }

  if (!isExistSubUser.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "sub user is not verified");
  }

  if (isExistSubUser.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `sub user is ${isExistSubUser.status}`,
    );
  }

  if (isExistSubUser.role !== Role.USER) {
    throw new AppError(httpStatus.UNAUTHORIZED, "you are not authorized");
  }

  // 2. Find the request
  const subBooking = await prisma.subRoomBooking.findUnique({
    where: {
      id: subBookingId,
    },
    include: {
      room: true,
    },
  });

  if (!subBooking) {
    throw new AppError(httpStatus.NOT_FOUND, "roommate request not found");
  }

  // 3. Verify that this room belongs to this user
  const booking = await prisma.booking.findFirst({
    where: {
      userId: userId,

      roomId: subBooking.roomId,

      status: BookingStatus.CONFIRMED,

      payments: {
        some: {
          paymentStatus: PaymentStatus.PAID,
        },
      },
    },
  });

  if (!booking) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "you are not authorized to manage this roommate request",
    );
  }

  // 4. Check current request status
  if (subBooking.status !== SubBookingStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `request is already ${subBooking.status}`,
    );
  }

  
  
  const result = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.subRoomBooking.update({
      where: {
        id: subBookingId,
      },
      data: {
        status,
      },
    });

    if(updatedRequest.status ===  SubBookingStatus.ACCEPTED){
      await tx.rooms.update({
        where: {
          id: booking.roomId,
        },
        data: {
          currentRoommates: {
            increment: subBooking.occupantCount,
          },
        },
      });
    }

    

    return updatedRequest;
  });

  return result;
};





export const SubRoomBookingService = {
  createBooking,
  getRoommatesRequest,
  updateRoommatesRequest
};

