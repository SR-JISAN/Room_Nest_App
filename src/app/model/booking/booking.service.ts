import { Role, RoomStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import httpStatus  from "http-status";
import { ICreateBooking } from "./booking.interface";

const createBooking =async(user:IRequestUser, payload:ICreateBooking)=>{
     const isUserExist = await prisma.users.findUnique({
       where: {
         email:user.email,
       },
     });

     if (!isUserExist) {
       throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
     }
     if (!isUserExist.emailVerified) {
       throw new AppError(
         httpStatus.BAD_REQUEST,
         "your email is not verified please verified with re-registration",
       );
     }

     if (isUserExist.status === "BLOCKED" || isUserExist.status === "DELETED") {
       throw new AppError(
         httpStatus.BAD_REQUEST,
         `your email is ${isUserExist.status}. contact with authority`,
       );
     };

     if(isUserExist.isDeleted){
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "User is Deleted",
        );
     };
     if(isUserExist.role !== Role.USER){
         throw new AppError(httpStatus.BAD_REQUEST, "Only user can booked room");
     };

     const isExistRoom = await prisma.rooms.findUnique({
        where:{
            id:payload.roomId
        }
     });

     if(!isExistRoom){
        throw new AppError(httpStatus.NOT_FOUND,"Room Not Found")
     };
     if(isExistRoom.isDeleted){
        throw new AppError(httpStatus.BAD_REQUEST,"Room is deleted")
     }
     if (
       isExistRoom.roomStatus === RoomStatus.BOOKED ||
       isExistRoom.roomStatus === RoomStatus.UNAVAILABLE
     ) {
       throw new AppError(httpStatus.BAD_REQUEST, `Room is ${isExistRoom.roomStatus}`);
     };

     const availableSlots =
       isExistRoom.maxRoommates - isExistRoom.currentRoommates;

     if (payload.occupantCount > availableSlots) {
       throw new AppError(
         httpStatus.BAD_REQUEST,
         `Only ${availableSlots} space(s) available in this room`,
       );
     };


     const result = await prisma.booking.create({
       data: {
         userId: isUserExist.id,

         roomId: isExistRoom.id,

         occupantCount: payload.occupantCount,

         startDate: payload.startDate,

         endDate: payload.endDate,

         rentAmount: isExistRoom.rentAmount,

         securityDeposit: isExistRoom.securityDeposit,

         totalAmount: isExistRoom.securityDeposit,

         note: payload.note,

       },
     });

     return result;
};


export const BookingService ={
    createBooking
}