import { BookingStatus, PaymentMethod, PaymentStatus, PaymentType, Role, RoomStatus, SubBookingStatus, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import httpStatus from "http-status";
import { ICreateSubRoomBooking } from "./sub.booking.interface";
import { getBkashIdToken } from "../../lib/bkash";
import config from "../../config";

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
    },
    include:{
      booking:{
        include:{
          user:true
        }
      }
    },

  });

  const findRentedUser = applyRoomExist?.booking[0]?.user;

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
if (findRentedUser?.id ===isExistSubUser.id){
  throw new AppError(
    httpStatus.UNAUTHORIZED,
    "You can not booked this room for sub rent",
  );
}
  const result = await prisma.$transaction(async (tx) => {
    const subBooking = await tx.subRoomBooking.create({
      data: {
        name: payload.name,
        age: payload.age,
        gender: payload.gender,
        occupantCount,
        roomId: applyRoomExist.id,
        startDate: payload.startDate,
        endDate: payload.endDate,
        userId: isExistSubUser.id,
        subRentAmount: applyRoomExist.subRentAmount,
      },
    });

    await tx.payment.create({
      data: {
        userId: isExistSubUser.id,
        subBookingId: subBooking.id,
        amount: applyRoomExist.subRentAmount!,
        currency: "BDT",
        paymentMethod: PaymentMethod.BKASH,
        paymentStatus: PaymentStatus.PENDING,
        paymentType: PaymentType.SUB_ROOM_RENT,

        merchantInvoiceNumber: `SUB-ROOM-${subBooking.id}-${Date.now()}`,

        payerReference: isExistSubUser.email,
      },
    });

    return subBooking;
  });

  return result
};


const paySubBooking = async(subBookingId:string ,user:IRequestUser)=>{
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
};


const findBooking = await prisma.subRoomBooking.findUnique({
  where:{
    id:subBookingId
  }
})
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

if (findBooking.status !== SubBookingStatus.PENDING) {
  throw new AppError(
    httpStatus.BAD_REQUEST,
    `Booking already ${findBooking.status}`,
  );
}

// Find pending sub room  payment
const payment = await prisma.payment.findFirst({
  where: {
    subBookingId: findBooking.id,
    userId: user.userId,
    paymentType: PaymentType.SUB_ROOM_RENT,
    paymentStatus: PaymentStatus.PENDING,
  },
});

if (!payment) {
  throw new AppError(
    httpStatus.NOT_FOUND,
    "Pending Sub Room payment not found",
  );
};

const bkashIdToken = await getBkashIdToken();

if (!bkashIdToken) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get bKash ID Token",
    );
  }
 const merchantInvoiceNumber = payment.merchantInvoiceNumber;

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

       callbackURL: `${config.bkash_callback_url}/sub/booking/payment/callback`,

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
 };

 if (!bkashCreatePaymentResult?.paymentID) {
   throw new AppError(httpStatus.BAD_REQUEST, "bKash payment ID not found");
 }

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



const subBookingPaymentCallback = async (query: Record<string, any>) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const paymentId = query.paymentID;
    const paymentStatus = query.status;

    if (!paymentId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment ID not found");
    }

    if (!paymentStatus) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment status not found");
    }

    // Get bKash ID Token
    const bkashIdToken = await getBkashIdToken();

    if (!bkashIdToken) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "bKash ID Token not found",
      );
    }

    // Execute bKash payment
    const paymentExecutedResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-App-Key": config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID: paymentId,
        }),
      },
    );

    const result = await paymentExecutedResponse.json();

    // Find payment
    const payment = await tx.payment.findUnique({
      where: {
        bkashPaymentID: paymentId,
      },
    });

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
    }

    // =========================
    // SUCCESS
    // =========================
    if (
      paymentStatus === "success" &&
      result?.transactionStatus === "Completed"
    ) {
      // Update payment
      await tx.payment.update({
        where: {
          bkashPaymentID: paymentId,
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
          bkashTrxID: result?.trxID,
          paidAt: new Date(),
          gatewayResponse: result,
        },
      });

      // Update booking
      await tx.subRoomBooking.update({
        where: {
          id: payment.subBookingId!,
        },
        data: {
          status: SubBookingStatus.CONFIRMED,
        },
      });

      return {
        redirectURL: `${config.frontend_url}/dashboard/my-bookings?status=success`,
      };
    }

    // =========================
    // FAILURE
    // =========================
    else if (paymentStatus === "failure") {
      await tx.payment.update({
        where: {
          bkashPaymentID: paymentId,
        },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: result?.statusMessage || "bKash payment failed",
          gatewayResponse: result,
        },
      });

      return {
        redirectURL: `${config.frontend_url}/dashboard/my-bookings?status=failure`,
      };
    }

    // =========================
    // CANCEL
    // =========================
    else if (paymentStatus === "cancel") {
      await tx.payment.update({
        where: {
          bkashPaymentID: paymentId,
        },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          gatewayResponse: result,
        },
      });

      return {
        redirectURL: `${config.frontend_url}/dashboard/my-bookings?status=cancel`,
      };
    }

    // =========================
    // UNKNOWN STATUS
    // =========================
    else {
      return {
        redirectURL: `${config.frontend_url}/dashboard/my-bookings?error=having-issue-with-payment`,
      };
    }
  });

  return transactionResult;
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

  if (isExistSubUser.role === Role.LANDLORD) {
    throw new AppError(httpStatus.UNAUTHORIZED, "you are not authorized");
  }


  const bookings = await prisma.booking.findMany({
    include: {
      room: {
        include: {
          subBooking: true,
        },
      },

      payments: true
    },
  });



  const result = bookings.map((booking) => ({
    bookingId: booking.id,

    room: booking.room,

    requests: booking.room.subBooking,
  }));

  return result;
};


const getSingleRoommatesRequest = async(userId:string, subBookingId:string )=>{


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

    const isExistSubBooking = await prisma.subRoomBooking.findUnique({
      where: {
        id: subBookingId,
      },
    });

    if (!isExistSubBooking) {
      throw new AppError(httpStatus.NOT_FOUND, "Sub Booking not found");
    }

   if (isExistSubUser.role === Role.USER) {

    if (isExistSubBooking.userId !== isExistSubUser.id) {
      throw new AppError(httpStatus.NOT_FOUND, "You can not get this booking");
    }
     const subBooking =await prisma.subRoomBooking.findUnique({
      where:{
        id:subBookingId,
        userId:isExistSubUser.id
      }
     })
     return subBooking
   }

   const subBooking = await prisma.subRoomBooking.findUnique({
     where: {
       id: subBookingId,
     },
   });
   return subBooking;


};


const deleteRoommatesRequest = async(userId:string, subBookingId:string )=>{


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


   const isExistSubBooking = await prisma.subRoomBooking.findUnique({
     where: {
       id: subBookingId,
     },
   });

   if(!isExistSubBooking){
    throw new AppError(httpStatus.NOT_FOUND,"Sub Booking not found")
   }
   if (
     isExistSubBooking.status === SubBookingStatus.ACCEPTED ||
     isExistSubBooking.status === SubBookingStatus.CONFIRMED
   ){
    throw new AppError(httpStatus.BAD_REQUEST, `Booking Is ${isExistSubBooking.status}`);
   };


     if (isExistSubUser.role === Role.USER) {

      if(isExistSubBooking.userId !== isExistSubUser.id){
        throw new AppError(httpStatus.NOT_FOUND, "You can not delete");
      }
       const subBooking = await prisma.subRoomBooking.delete({
         where: {
           id: isExistSubBooking.id,
           userId: isExistSubUser.id,
         },
       });
       return subBooking;
     }
   

   const subBooking = await prisma.subRoomBooking.delete({
     where: {
       id: isExistSubBooking.id,
     },
   });
   return subBooking;


}








const getMyRequest = async (userId: string) => {
  const isExistSubUser = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExistSubUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Sub user not found");
  }

  if (isExistSubUser.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "Sub user is deleted");
  }

  if (!isExistSubUser.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Sub user is not verified");
  }

  if (isExistSubUser.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Sub user is ${isExistSubUser.status}`,
    );
  }

  if (isExistSubUser.role !== Role.USER) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
  }

  const getMyBooking = await prisma.subRoomBooking.findMany({
    where: {
      userId: isExistSubUser.id,
    },

    include: {
      payments: true,
      room: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  if (getMyBooking.length === 0) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "You don't have any roommate booking request",
    );
  }

  const result = getMyBooking.map((booking) => ({
    id: booking.id,
    name: booking.name,
    age: booking.age,
    gender: booking.gender,
    occupantCount: booking.occupantCount,
    startDate: booking.startDate,
    endDate: booking.endDate,
    subRentAmount: booking.subRentAmount,
    status: booking.status,

    room: booking.room,

    payments: booking.payments,
  }));

  return result;
};



const updateRoommatesRequest = async (
  userId: string,
  subBookingId: string,
  status: SubBookingStatus,
) => {
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (!user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User email is not verified");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is ${user.status}`);
  }

  if (user.role !== Role.USER) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
  }

  
  const subBooking = await prisma.subRoomBooking.findUnique({
    where: {
      id: subBookingId,
    },
    include: {
      room: true,
      payments: true,
    },
  });

  if (!subBooking) {
    throw new AppError(httpStatus.NOT_FOUND, "Roommate request not found");
  }

 
  const mainBooking = await prisma.booking.findFirst({
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

 
  if (!mainBooking) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to manage this roommate request",
    );
  }

  // 4. Request must be pending
  if (subBooking.status === SubBookingStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Request is already ${subBooking.status}`,
    );
  }

 
  if (
    status !== SubBookingStatus.ACCEPTED &&
    status !== SubBookingStatus.REJECTED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid roommate request status",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
   

    if (status === SubBookingStatus.REJECTED) {
      const payment = await tx.payment.findFirst({
        where: {
          subBookingId: subBooking.id,
          paymentStatus: PaymentStatus.PAID,
        },
      });

      if (!payment) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Paid payment record not found",
        );
      }

      if (!payment.bkashPaymentID || !payment.bkashTrxID) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "bKash payment information not found",
        );
      }

      const bkashIdToken = await getBkashIdToken();

      if (!bkashIdToken) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to get bKash ID Token",
        );
      }

      const refundAmount = Number(payment.amount);

  
      const bkashRefundRes = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/payment/refund`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Accept: "application/json",
            Authorization: bkashIdToken,
            "X-App-Key": config.bkash_app_key,
          },
          body: JSON.stringify({
            paymentID: payment.bkashPaymentID,
            trxID: payment.bkashTrxID,
            amount: refundAmount.toString(),
            sku: "Roommate Booking Rejection",
            reason: "Main room renter rejected roommate request",
          }),
        },
      );

      const refundResult = await bkashRefundRes.json();

      if (!bkashRefundRes.ok || !refundResult.refundTrxID) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          refundResult.statusMessage || "bKash refund failed",
        );
      }

      // Update payment
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          refundTrxID: refundResult.refundTrxID,
          refundAmount: refundAmount,
          refundReason: "Main room renter rejected roommate request",
          refundAt: new Date(),
          gatewayResponse: refundResult,
        },
      });

      // Update roommate request
      const updatedRequest = await tx.subRoomBooking.update({
        where: {
          id: subBooking.id,
        },
        data: {
          status: SubBookingStatus.REJECTED,
        },
      });

      return updatedRequest;
    }


    if (status === SubBookingStatus.ACCEPTED) {
      const updatedRequest = await tx.subRoomBooking.update({
        where: {
          id: subBooking.id,
        },
        data: {
          status: SubBookingStatus.ACCEPTED,
        },
      });

      await tx.rooms.update({
        where: {
          id: subBooking.roomId,
        },
        data: {
          currentRoommates: {
            increment: subBooking.occupantCount,
          },
        },
      });

      return updatedRequest;
    }

    throw new AppError(httpStatus.BAD_REQUEST, "Invalid request status");
  });

  return result;
};



const cancelSubRoomBooking = async (userId: string, subBookingId: string) => {
  const subBooking = await prisma.subRoomBooking.findUnique({
    where: {
      id: subBookingId,
    },
    include: {
      payments: true,
    },
  });

  if (!subBooking) {
    throw new AppError(httpStatus.NOT_FOUND, "Roommate booking not found");
  }

  // Only booking owner can cancel
  if (subBooking.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to cancel this booking",
    );
  }

  if (subBooking.status === SubBookingStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Booking is already ${subBooking.status}`,
    );
  };

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        subBookingId: subBooking.id,
        paymentStatus: PaymentStatus.PAID,
      },
    });

   
    if (!payment) {
      return await tx.subRoomBooking.update({
        where: {
          id: subBooking.id,
        },
        data: {
          status: SubBookingStatus.CANCELLED,
        },
      });
    }

    if (!payment.paidAt) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment date not found");
    }

    // 15 days calculation
    const refundDeadline = new Date(payment.paidAt);
    refundDeadline.setDate(refundDeadline.getDate() + 15);

    const currentDate = new Date();

    /*
     * ==========================================
     * WITHIN 15 DAYS → REFUND
     * ==========================================
     */

    if (currentDate <= refundDeadline) {
      if (!payment.bkashPaymentID || !payment.bkashTrxID) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "bKash payment information not found",
        );
      }

      const bkashIdToken = await getBkashIdToken();

      if (!bkashIdToken) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to get bKash ID Token",
        );
      }

      const refundAmount = Number(payment.amount);

      const bkashRefundRes = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/payment/refund`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Accept: "application/json",
            Authorization: bkashIdToken,
            "X-App-Key": config.bkash_app_key,
          },
          body: JSON.stringify({
            paymentID: payment.bkashPaymentID,
            trxID: payment.bkashTrxID,
            amount: refundAmount.toString(),
            sku: "Roommate Booking Cancellation",
            reason: "Roommate cancelled booking within 15 days",
          }),
        },
      );

      const refundResult = await bkashRefundRes.json();

      if (!bkashRefundRes.ok || !refundResult.refundTrxID) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          refundResult.statusMessage || "bKash refund failed",
        );
      }

      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          refundTrxID: refundResult.refundTrxID,
          refundAmount,
          refundReason: "Roommate cancelled booking within 15 days",
          refundAt: new Date(),
          gatewayResponse: refundResult,
        },
      });

      return await tx.subRoomBooking.update({
        where: {
          id: subBooking.id,
        },
        data: {
          status: SubBookingStatus.CANCELLED,
        },
      });
    }


    return await tx.subRoomBooking.update({
      where: {
        id: subBooking.id,
      },
      data: {
        status: SubBookingStatus.CANCELLED,
      },
    });
  });

  return result;
};


export const SubRoomBookingService = {
  createBooking,
  getRoommatesRequest,
  updateRoommatesRequest,
  paySubBooking,
  subBookingPaymentCallback,
  cancelSubRoomBooking,
  getMyRequest,
  getSingleRoommatesRequest,
  deleteRoommatesRequest,
};

