import { BookingStatus, PaymentMethod, PaymentStatus, PaymentType, Role, RoomStatus, UserStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import type { ICreateBooking } from "./booking.interface";
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

    if (isExistRoom.roomStatus !== RoomStatus.AVAILABLE) {
      throw new AppError(httpStatus.CONFLICT, "This room is not currently available for booking.");
    }

  
    if (
      payload.occupantCount > isExistRoom.maxRoommates ||
      isExistRoom.currentRoommates + payload.occupantCount >
        isExistRoom.maxRoommates
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Room capacity exceeded. You can't book this room.",
      );
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
        // Serialize reservations for this room so simultaneous requests cannot overbook its remaining capacity.
        await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${isExistRoom.id} FOR UPDATE`;
        const lockedRoom = await tx.rooms.findUnique({ where: { id: isExistRoom.id } });
        if (!lockedRoom || lockedRoom.isDeleted || lockedRoom.roomStatus !== RoomStatus.AVAILABLE) {
          throw new AppError(httpStatus.CONFLICT, "This room is no longer available.");
        }
        const pendingOccupants = await tx.booking.aggregate({
          where: { roomId: lockedRoom.id, status: BookingStatus.PENDING },
          _sum: { occupantCount: true },
        });
        const reserved = pendingOccupants._sum.occupantCount ?? 0;
        if (lockedRoom.currentRoommates + reserved + payload.occupantCount > lockedRoom.maxRoommates) {
          throw new AppError(httpStatus.CONFLICT, "Room capacity is reserved by other booking requests.");
        }

        const createBooking = await tx.booking.create({
          data: {
            startDate: new Date(`${payload.startDate}T00:00:00.000Z`),
            endDate: payload.endDate
              ? new Date(`${payload.endDate}T00:00:00.000Z`)
              : null,
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
            subBookingId:null,
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

const getBooking = async (userId: string) => {
  const isExistUser = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isExistUser.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (!isExistUser.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
  }

  if (isExistUser.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is ${isExistUser.status}`);
  };
  if(isExistUser.role === Role.LANDLORD){
    return prisma.booking.findMany({
      where: {
        room: { property: { usersId: isExistUser.id, isDeleted: false } },
      },
      include: {
        room: { include: { property: { select: { id: true, title: true, city: true } } } },
        payments: {
          select: { id: true, amount: true, paymentStatus: true, paymentType: true, paidAt: true },
        },
        user: { select: { id: true, name: true, imageURL: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    
  }

  



  if(isExistUser.role === Role.USER){
    const bookings = await prisma.booking.findMany({
      where: {
        userId: isExistUser.id,
      },

      include: {
        room: {
          include: {
            property: true,
          },
        },
        payments: true
      },

      orderBy: {
        createdAt: "desc",
      },
    });
    return bookings
  };
  

  const bookings = await prisma.booking.findMany({
    include: {
      room: {
        include: {
          property: true,
        },
      },
      payments: {
        select: { id: true, amount: true, paymentStatus: true, paymentType: true, paidAt: true },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageURL: true,
          role: true,
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });


  return bookings;
};

const getSingleBooking = async (userId:string,bookingId:string)=>{
  const isExistUser = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isExistUser.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (!isExistUser.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
  }

  if (isExistUser.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is ${isExistUser.status}`);
  };

const isExistBooking = await prisma.booking.findUnique({
  where: {
    id: bookingId,
  },
});

if(!isExistBooking){
  throw new AppError(httpStatus.NOT_FOUND,"Booking not found")
}

if(isExistUser.role === Role.USER){
  if(isExistUser.id !== isExistBooking.userId){
    throw new AppError(httpStatus.UNAUTHORIZED,"You are not authorized for see this booking.")
  }

  const Booking =await prisma.booking.findUnique({
    where:{
      id:isExistBooking.id,
      userId:isExistUser.id
    }
  })

  return Booking


}

if (isExistUser.role === Role.LANDLORD) {
  const landlordBooking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      room: { property: { usersId: isExistUser.id, isDeleted: false } },
    },
    include: {
      room: { include: { property: { select: { id: true, title: true, city: true } } } },
      payments: true,
      user: { select: { id: true, name: true, imageURL: true } },
    },
  });
  if (!landlordBooking) throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  return landlordBooking;
}

return isExistBooking



};

const rejectBooking = async (userId: string, bookingId: string) => {
  const actor = await prisma.users.findUnique({ where: { id: userId } });
  if (!actor || actor.status !== UserStatus.ACTIVE || !actor.emailVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "An active verified account is required");
  }
  if (actor.role !== Role.ADMIN && actor.role !== Role.LANDLORD) {
    throw new AppError(httpStatus.FORBIDDEN, "Only a landlord or admin can reject a booking");
  }
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...(actor.role === Role.LANDLORD ? { room: { property: { usersId: actor.id } } } : {}),
    },
    include: { payments: true },
  });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  if (booking.status !== BookingStatus.PENDING) {
    throw new AppError(httpStatus.CONFLICT, `Booking is already ${booking.status.toLowerCase()}`);
  }
  if (booking.payments.some((payment) => payment.paymentStatus === PaymentStatus.PAID)) {
    throw new AppError(httpStatus.CONFLICT, "A paid booking cannot be rejected; use the refund process instead.");
  }
  if (booking.payments.some((payment) => payment.bkashPaymentID && payment.paymentStatus === PaymentStatus.PENDING)) {
    throw new AppError(httpStatus.CONFLICT, "A payment checkout is already in progress. Wait for its result before rejecting.");
  }
  return prisma.$transaction(async (tx) => {
    const paymentUpdate = await tx.payment.updateMany({
      where: {
        bookingId: booking.id,
        paymentStatus: PaymentStatus.PENDING,
        bkashPaymentID: null,
      },
      data: { paymentStatus: PaymentStatus.CANCELLED },
    });
    if (paymentUpdate.count === 0) {
      throw new AppError(httpStatus.CONFLICT, "The payment state changed. Refresh and try again.");
    }
    const bookingUpdate = await tx.booking.updateMany({
      where: { id: booking.id, status: BookingStatus.PENDING },
      data: { status: BookingStatus.REJECTED },
    });
    if (bookingUpdate.count !== 1) {
      throw new AppError(httpStatus.CONFLICT, "The booking state changed. Refresh and try again.");
    }
    return tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
  });
};


const cancelBooking = async (userId: string, bookingId: string) => {
  const isExistUser = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isExistUser.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (!isExistUser.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
  }

  if (isExistUser.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is ${isExistUser.status}`);
  }

  const isExistBooking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
      userId: isExistUser.id,
    },
  });
  if (!isExistBooking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

 const cancellableStatuses: BookingStatus[] = [
   BookingStatus.PENDING,
   BookingStatus.REJECTED,
 ];

 if (!cancellableStatuses.includes(isExistBooking.status)) {
   throw new AppError(
     httpStatus.CONFLICT,
     `A ${isExistBooking.status.toLowerCase()} booking cannot be cancelled here.`,
   );
 }

  const activeCheckout = await prisma.payment.findFirst({
    where: {
      bookingId: isExistBooking.id,
      paymentStatus: PaymentStatus.PENDING,
      bkashPaymentID: { not: null },
    },
  });
  if (activeCheckout) {
    throw new AppError(httpStatus.CONFLICT, "A payment checkout is active. Wait for its result before cancelling.");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { bookingId: isExistBooking.id, paymentStatus: PaymentStatus.PENDING },
      data: { paymentStatus: PaymentStatus.CANCELLED },
    });
    const changed = await tx.booking.updateMany({
      where: {
        id: bookingId,
        userId: isExistUser.id,
        status: { in: [BookingStatus.PENDING, BookingStatus.REJECTED] },
      },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
    });
    if (changed.count !== 1) {
      throw new AppError(httpStatus.CONFLICT, "The booking state changed. Refresh and try again.");
    }
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
  });

  return result;
};
const deleteBooking = async (userId: string, bookingId: string) => {
  const isExistUser = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isExistUser.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (!isExistUser.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
  }

  if (isExistUser.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is ${isExistUser.status}`);
  }

  const isExistBooking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
      userId: isExistUser.id,
    },
  });
  if (!isExistBooking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const removableStatuses: BookingStatus[] = [
    BookingStatus.CANCELLED,
    BookingStatus.REJECTED,
  ];

  if (!removableStatuses.includes(isExistBooking.status)) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Only cancelled or rejected bookings can be removed.",
    );
  }

  const payments = await prisma.payment.findMany({ where: { bookingId } });
  if (payments.some((payment) => payment.paymentStatus === PaymentStatus.PAID || payment.paymentStatus === PaymentStatus.PROCESSING || payment.bkashPaymentID)) {
    throw new AppError(httpStatus.CONFLICT, "A booking with a gateway transaction cannot be removed from its audit history.");
  }

  const result = await prisma.booking.delete({
    where: {
      id: bookingId,
      userId: isExistUser.id,
    }
  });
  return result;
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
    include:{
        room:true
    }
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

  // Reuse an unstarted payment record; preserve failed/cancelled attempts for audit.
  const payments = await prisma.payment.findMany({
    where: {
      bookingId: findBooking.id,
      userId: user.userId,
      paymentType: PaymentType.SECURITY_DEPOSIT,
    },
    orderBy: { createdAt: "desc" },
  });

  const activePayment = payments.find(
    (item) => item.paymentStatus === PaymentStatus.PENDING && item.bkashPaymentID,
  );
  if (activePayment) {
    throw new AppError(httpStatus.CONFLICT, "A bKash checkout is already active for this deposit.");
  }

  let payment = payments.find(
    (item) => item.paymentStatus === PaymentStatus.PENDING && !item.bkashPaymentID,
  );

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        bookingId: findBooking.id,
        userId: user.userId,
        amount: findBooking.securityDeposit,
        currency: "BDT",
        paymentMethod: PaymentMethod.BKASH,
        paymentStatus: PaymentStatus.PENDING,
        paymentType: PaymentType.SECURITY_DEPOSIT,
        merchantInvoiceNumber: `SECURITY-${findBooking.id}-${Date.now()}`,
        payerReference: isExistUser.email,
      },
    });
  }

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


const bookingPaymentCallback = async (query: Record<string, any>) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const paymentId = query.paymentID;
    const paymentStatus = query.status;

    if (!paymentId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment ID not found");
    }

    if (!paymentStatus) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment status not found");
    }

    const payment = await tx.payment.findUnique({
      where: { bkashPaymentID: paymentId },
    });
    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
    }
    if (payment.paymentStatus === PaymentStatus.PAID) {
      return { redirectURL: `${config.frontend_url}/dashboard/my-bookings?status=payment-success` };
    }
    if (payment.paymentStatus !== PaymentStatus.PENDING) {
      const terminalStatus = payment.paymentStatus === PaymentStatus.CANCELLED ? "cancel" : "failure";
      return { redirectURL: `${config.frontend_url}/dashboard/my-bookings?status=${terminalStatus}` };
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

    // =========================
    // SUCCESS
    // =========================
    if (
      paymentStatus === "success" &&
      result?.transactionStatus === "Completed"
    ) {
      // Update payment
      const paymentUpdate = await tx.payment.updateMany({
        where: { id: payment.id, paymentStatus: PaymentStatus.PENDING },
        data: {
          paymentStatus: PaymentStatus.PAID,
          bkashTrxID: result?.trxID,
          paidAt: new Date(),
          gatewayResponse: result,
        },
      });
      if (paymentUpdate.count !== 1) {
        return { redirectURL: `${config.frontend_url}/dashboard/my-bookings?status=success` };
      }

      // Update booking
      const bookingUpdate = await tx.booking.updateMany({
        where: { id: payment.bookingId!, status: BookingStatus.PENDING },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      });
      if (bookingUpdate.count !== 1) {
        throw new AppError(httpStatus.CONFLICT, "The booking is no longer pending; contact support to reconcile the payment.");
      }

      const booking = await tx.booking.findUnique({
        where: {
          id: payment.bookingId!,
        },
        select: {
          roomId: true,
          occupantCount: true,
        },
      });

      if (!booking) {
        throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
      }

      await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${booking.roomId} FOR UPDATE`;
      const lockedRoom = await tx.rooms.findUnique({ where: { id: booking.roomId } });
      if (!lockedRoom || lockedRoom.currentRoommates + booking.occupantCount > lockedRoom.maxRoommates) {
        throw new AppError(httpStatus.CONFLICT, "Room capacity changed; contact support to reconcile the payment.");
      }
      const nextRoommates = lockedRoom.currentRoommates + booking.occupantCount;

      await tx.rooms.update({
        where: {
          id: booking.roomId,
        },
        data: {
          currentRoommates: nextRoommates,
          roomStatus: nextRoommates >= lockedRoom.maxRoommates ? RoomStatus.BOOKED : RoomStatus.AVAILABLE,
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





const refundBooking = async (bookingId: string, user: IRequestUser) => {
  const result = await prisma.$transaction(async (tx) => {

    if (!bookingId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Please provide booking ID");
    }

    // 1. Find booking
    const booking = await tx.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        payments: true,
        room: true,
      },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    const actor = await tx.users.findUnique({ where: { id: user.userId } });
    if (!actor || actor.status !== UserStatus.ACTIVE || !actor.emailVerified) {
      throw new AppError(httpStatus.FORBIDDEN, "An active verified account is required");
    }
    if (actor.role !== Role.ADMIN && booking.userId !== actor.id) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to refund this booking");
    }

    // 2. Booking status check
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Booking already ${booking.status.toLowerCase()}`,
      );
    }

    // 3. Payment check
    if (!booking.payments) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
    }

    const payments = await tx.payment.findFirst({
      where: {
        bookingId: booking.id,
        paymentType: PaymentType.SECURITY_DEPOSIT,
        paymentStatus: PaymentStatus.PAID,
      },
    });

    if (!payments) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
    }
    if (!payments.paidAt) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment date not found");
    }
    if (!payments.bkashPaymentID || !payments.bkashTrxID) {
      throw new AppError(httpStatus.BAD_REQUEST, "The paid transaction cannot be refunded through bKash");
    }

    // 4. Check 15 days refund policy
    const refundDeadline = new Date(payments.paidAt);
    refundDeadline.setDate(refundDeadline.getDate() + 15);

    const currentDate = new Date();

    if (currentDate > refundDeadline) {
      throw new AppError(httpStatus.BAD_REQUEST, "Refund period has expired. Refund is only available within 15 days of payment.");
    }

    // 5. Get bKash token
    const bkashIdToken = await getBkashIdToken();

    if (!bkashIdToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Failed to get Bkash ID Token",
      );
    }

    // 6. Refund amount
    const refundAmount = Number(payments.amount);

    // 7. bKash refund
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
          paymentID: payments.bkashPaymentID,
          trxID: payments.bkashTrxID,
          amount: refundAmount.toString(),
          sku: "Room Booking Cancellation",
          reason: "User cancelled booking within 15 days",
        }),
      },
    );

    const refundResult = await bkashRefundRes.json();

    // 8. Check refund response
    if (!bkashRefundRes.ok || !refundResult.refundTrxID) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        refundResult.statusMessage || "bKash refund failed",
      );
    }

    // 9. Cancel booking
    const updatedBooking = await tx.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    // 10. Update payment
    const updatedPayment = await tx.payment.update({
      where: {
        id: payments.id,
      },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        refundTrxID: refundResult.refundTrxID,
        refundAmount: refundResult.amount,
        refundReason: "Room booking cancelled within 15 days",
        refundAt: refundResult.completedTime,
        gatewayResponse: refundResult,
      },
    });

    // 11. Update room
    if (booking.roomId) {
      const room = await tx.rooms.findUnique({
        where: {
          id: booking.roomId,
        },
      });

      if (!room) {
        throw new AppError(httpStatus.NOT_FOUND, "Room not found");
      }

      const currentRoommates = Math.max(0, room.currentRoommates - booking.occupantCount);

      const updatedRoom = await tx.rooms.update({
        where: {
          id: room.id,
        },
        data: {
          currentRoommates,
          roomStatus: currentRoommates >= room.maxRoommates ? RoomStatus.BOOKED : RoomStatus.AVAILABLE,
        },
      });

      return {
        updatedBooking,
        updatedPayment,
        updatedRoom,
        refund: refundResult,
      };
    }

    return {
      updatedBooking,
      updatedPayment,
      refund: refundResult,
    };
  });

  return result;
};


export const BookingService = {
  creteBooking,
  payExistPayments,
  bookingPaymentCallback,
  refundBooking,
  getBooking,
  getSingleBooking,
  rejectBooking,
  cancelBooking,
  deleteBooking,
};
