import { PaymentMethod, PaymentStatus, PaymentType, Role } from "../../../generated/prisma/enums";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/appError";
import { ICreateBooking } from "./booking.interface";
import httpStatus from "http-status"

const creteBooking = async (payload: ICreateBooking, userId: string) => {
    const isExistUser = await prisma.users.findUnique({
      where: {
        id:userId
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

    if (isExistUser.role !== Role.USER) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not authorized to update a room",
      );
    };


    const isExistRoom = await prisma.rooms.findUnique({
        where:{
            id:payload.roomId
        }
    });

    if(!isExistRoom){
        throw new AppError(httpStatus.NOT_FOUND,"Room Not Found")
    }

    if(isExistRoom.isDeleted){
        throw new AppError(httpStatus.BAD_REQUEST,"Room is deleted")
    };

    const transactionResult =await prisma.$transaction(async(tx)=>{

        const createBooking = await tx.booking.create({
            data:{
                startDate:payload.startDate,
                endDate:payload.endDate,
                userId:isExistUser.id,
                roomId:isExistRoom.id,
                occupantCount: payload.occupantCount,
                securityDeposit: isExistRoom.securityDeposit,
                rentAmount: isExistRoom.rentAmount,
                totalAmount: isExistRoom.securityDeposit,
                note: payload.note
            }
        });

        const bkashIdToken = await getBkashIdToken();

        if (!bkashIdToken) {
          throw new Error("bKash ID token not found");
        }

        const bkashCreatePaymentRes = await fetch(
          `${config.bkash_base_url}/tokenized/checkout/create`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              Accept: "application/json",
              Authorization: bkashIdToken,
              "X-App-Key": config.bkash_app_key,
            },
            body: JSON.stringify({
              mode: "0011",
              payerReference: isExistUser?.email,
              callbackURL: `${config.bkash_callback_url}/booking/book-room/payment/callback`,
              amount: isExistRoom.securityDeposit,
              currency: "BDT",
              intent: "sale",
              merchantInvoiceNumber: `SECURITY-${createBooking.id}-${Date.now()}`,
            }),
          },
        );

        const bkashCreatePaymentsResult= await bkashCreatePaymentRes.json();

        await tx.payment.create({
          data: {
            bookingId: createBooking.id,
            userId: isExistUser.id,

            amount: isExistRoom.securityDeposit,
            currency: "BDT",

            paymentMethod: PaymentMethod.BKASH,
            paymentStatus: PaymentStatus.PENDING,
            paymentType: PaymentType.SECURITY_DEPOSIT,

            transactionId: bkashCreatePaymentsResult.paymentID,

            invoiceId: `SECURITY-${createBooking.id}-${Date.now()}`,

            gatewayResponse: bkashCreatePaymentsResult,
          },
        });
        return bkashCreatePaymentsResult.bkashURL;
    });

    return transactionResult

};


export const BookingService = {
    creteBooking
}