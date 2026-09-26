import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import type{ PaymentWhereInput } from "../../../generated/prisma/models";

import { prisma } from "../../lib/prisma";
import type{ IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import type{ IQuery } from "./payments.interface";



const getMyPayments = async (query: IQuery, user: IRequestUser) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const isUserExist = await prisma.users.findUnique({
    where: {
      id: user.userId,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Profile Not Found");
  }

  const andConditions: PaymentWhereInput[] = [
    {
      OR: [
        {
          booking: {
            userId: isUserExist.id,
          },
        },
        {
          subBooking: {
            userId: isUserExist.id,
          },
        },
        {
          userId: isUserExist.id,
        },
      ],
    },
  ];

  const payments = await prisma.payment.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      booking: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email:true
            },
          },
        },
      },

      subBooking: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          room: true,
        },
      },
    },
  });

  const total = await prisma.payment.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: payments,

    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getAllPayments = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: PaymentWhereInput[] = [];

  if (query.userEmail) {
    andConditions.push({
      booking: {
        user: {
          email: query.userEmail,
        },
      },
    });
  }

  const payments = await prisma.payment.findMany({
    where: { AND: andConditions },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
    include: {
      booking: {
        include: {
          user: { select: { id: true, name: true, email:true } },
          
        },
      },
    },
  });

  const total = await prisma.payment.count({
    where: { AND: andConditions },
  });

  return {
    data: payments,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getSinglePayment = async (paymentId: string, user: IRequestUser) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId: user.userId,
    },
    include: {
      booking: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          room: true,
        },
      },
      subBooking: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          room: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found");
  }

  if (user.role === Role.USER) {
    if (payment.booking?.user.id !== user.userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You Are Not Allowed To View This Payment",
      );
    }
  }

  return payment;
};

export const PaymentServices = {
  getAllPayments,
  getMyPayments,
  getSinglePayment,
};
