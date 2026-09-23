import { BookingStatus, PaymentMethod, PaymentStatus, PaymentType, Role } from "../../../generated/prisma/enums";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../middleware/check.auth";
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
          data: {
            startDate: payload.startDate,
            endDate: payload.endDate,
            userId: isExistUser.id,
            roomId: isExistRoom.id,
            occupantCount: payload.occupantCount,
            securityDeposit: isExistRoom.securityDeposit,
            rentAmount: isExistRoom.rentAmount,
            totalAmount: isExistRoom.securityDeposit,
            note: payload.note,
          },
        });

        await tx.payment.create({
          data: {
            bookingId: createBooking.id,
            userId: isExistUser.id,

            amount: isExistRoom.securityDeposit,
            currency: "BDT",

            paymentMethod: PaymentMethod.BKASH,
            paymentStatus: PaymentStatus.PENDING,
            paymentType: PaymentType.SECURITY_DEPOSIT,

            merchantInvoiceNumber: `SECURITY-${createBooking.id}-${Date.now()}`,

            payerReference: isExistUser.email,
          },
        });
        return createBooking;
    });

    return transactionResult

};





const payExistPayments = async (bookingId: string, user: IRequestUser) => {
  if (!bookingId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Booking Id is Required");
  }

  // User
  const isExistUser = await prisma.users.findUnique({
    where: {
      id: user.userId,
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

  // Booking
  const findBooking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!findBooking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // Important: booking belongs to current user
  if (findBooking.userId !== user.userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to pay for this booking",
    );
  }

  if (findBooking.status !== BookingStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Booking already ${findBooking.status}`,
    );
  }

  // Find pending security deposit payment
  const payment = await prisma.payment.findFirst({
    where: {
      bookingId: findBooking.id,
      userId: user.userId,
      paymentType: PaymentType.SECURITY_DEPOSIT,
      paymentStatus: PaymentStatus.PENDING,
    },
  });

  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Pending security deposit payment not found",
    );
  }

  // Get bKash token
  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get bKash ID Token",
    );
  }

  const merchantInvoiceNumber = payment.merchantInvoiceNumber;

  // Create bKash payment
  const bkashCreatePaymentRes = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-Key": config.bkash_app_key,
      },

      body: JSON.stringify({
        mode: "0011",
        payerReference: isExistUser.email,

        callbackURL: `${config.bkash_callback_url}/booking/booked-room/payment/callback`,

        amount: String(payment.amount),

        currency: "BDT",
        intent: "sale",

        merchantInvoiceNumber,
      }),
    },
  );

  const bkashCreatePaymentResult = await bkashCreatePaymentRes.json();

  if (!bkashCreatePaymentRes.ok) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      bkashCreatePaymentResult?.statusMessage ||
        "Failed to create bKash payment",
    );
  }

  if (!bkashCreatePaymentResult?.paymentID) {
    throw new AppError(httpStatus.BAD_REQUEST, "bKash payment ID not found");
  }

  // Update existing payment
  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id,
    },

    data: {
      bkashPaymentID: bkashCreatePaymentResult.paymentID,

      gatewayResponse: bkashCreatePaymentResult,

      payerReference: isExistUser.email,
    },
  });

  return {
    paymentId: updatedPayment.id,
    bkashPaymentID: bkashCreatePaymentResult.paymentID,

    bkashURL: bkashCreatePaymentResult.bkashURL,
  };
};


export const BookingService = {
  creteBooking,
  payExistPayments,
};