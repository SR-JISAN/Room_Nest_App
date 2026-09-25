import { BookingStatus, PaymentStatus, SubBookingStatus } from "../../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";

const getUserDashboard = async (userId: string) => {
  const userFilter = {
    userId,
  };

  const [
    totalBookings,
    activeBookings,
    completedBookings,
    cancelledBookings,

    totalPayments,
    totalSpent,

    pendingBookings,
    confirmedBookings,
    rejectedBookings,

    paidPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
    partiallyRefundedPayments,

    pendingRoommateRequests,
    acceptedRoommateRequests,
    rejectedRoommateRequests,
    cancelledRoommateRequests,

    totalReviews,

    currentStay,
    recentBookings,
    recentPayments,
    recentRoommateRequests,
  ] = await Promise.all([
    // =========================
    // BOOKING OVERVIEW
    // =========================

    prisma.booking.count({
      where: userFilter,
    }),

    prisma.booking.count({
      where: {
        userId,
        status: BookingStatus.CONFIRMED,
      },
    }),

    prisma.booking.count({
      where: {
        userId,
        status: BookingStatus.COMPLETED,
      },
    }),

    prisma.booking.count({
      where: {
        userId,
        status: BookingStatus.CANCELLED,
      },
    }),

    // =========================
    // PAYMENT OVERVIEW
    // =========================

    prisma.payment.count({
      where: {
        userId,
      },
    }),

    prisma.payment.aggregate({
      where: {
        userId,
        paymentStatus: PaymentStatus.PAID,
      },
      _sum: {
        amount: true,
      },
    }),

    // =========================
    // BOOKING STATUS
    // =========================

    prisma.booking.count({
      where: {
        userId,
        status: BookingStatus.PENDING,
      },
    }),

    prisma.booking.count({
      where: {
        userId,
        status: BookingStatus.CONFIRMED,
      },
    }),

    prisma.booking.count({
      where: {
        userId,
        status: BookingStatus.REJECTED,
      },
    }),

    // =========================
    // PAYMENT STATUS
    // =========================

    prisma.payment.count({
      where: {
        userId,
        paymentStatus: PaymentStatus.PAID,
      },
    }),

    prisma.payment.count({
      where: {
        userId,
        paymentStatus: PaymentStatus.PENDING,
      },
    }),

    prisma.payment.count({
      where: {
        userId,
        paymentStatus: PaymentStatus.FAILED,
      },
    }),

    prisma.payment.count({
      where: {
        userId,
        paymentStatus: PaymentStatus.REFUNDED,
      },
    }),

    prisma.payment.count({
      where: {
        userId,
        paymentStatus: PaymentStatus.PARTIALLY_REFUNDED,
      },
    }),

    // =========================
    // ROOMMATE REQUESTS
    // =========================

    prisma.subRoomBooking.count({
      where: {
        userId,
        status: SubBookingStatus.PENDING,
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        userId,
        status: SubBookingStatus.ACCEPTED,
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        userId,
        status: SubBookingStatus.REJECTED,
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        userId,
        status: SubBookingStatus.CANCELLED,
      },
    }),

    // =========================
    // REVIEWS
    // =========================

    prisma.reviews.count({
      where: {
        userId,
      },
    }),

    // =========================
    // CURRENT STAY
    // =========================

    prisma.booking.findFirst({
      where: {
        userId,
        status: BookingStatus.CONFIRMED,
      },
      orderBy: {
        startDate: "desc",
      },
      select: {
        id: true,
        roomId: true,
        occupantCount: true,
        rentAmount: true,
        securityDeposit: true,
        totalAmount: true,
        startDate: true,
        endDate: true,
        status: true,

        room: {
          select: {
            id: true,
            title: true,
            roomStatus: true,

            property: {
              select: {
                id: true,
                title: true,
                city: true,
                address: true,
              },
            },

            roomImages: {
              take: 1,
              select: {
                roomImageURL: true,
              },
            },
          },
        },
      },
    }),

    // =========================
    // RECENT BOOKINGS
    // =========================

    prisma.booking.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        status: true,
        occupantCount: true,
        rentAmount: true,
        securityDeposit: true,
        totalAmount: true,
        startDate: true,
        endDate: true,
        createdAt: true,

        room: {
          select: {
            id: true,
            title: true,
            roomType: true,
            roomStatus: true,

            property: {
              select: {
                id: true,
                title: true,
                city: true,
              },
            },
          },
        },
      },
    }),

    // =========================
    // RECENT PAYMENTS
    // =========================

    prisma.payment.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentType: true,
        merchantInvoiceNumber: true,
        bkashTrxID: true,
        paidAt: true,
        createdAt: true,

        booking: {
          select: {
            id: true,
            room: {
              select: {
                title: true,
              },
            },
          },
        },

        subBooking: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    // =========================
    // RECENT ROOMMATE REQUESTS
    // =========================

    prisma.subRoomBooking.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        status: true,
        occupantCount: true,
        startDate: true,
        endDate: true,
        subRentAmount: true,
        createdAt: true,

        room: {
          select: {
            id: true,
            title: true,

            property: {
              select: {
                id: true,
                title: true,
                city: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    overview: {
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalPayments,
      totalSpent: totalSpent._sum.amount ?? 0,
    },

    currentStay,

    bookings: {
      pending: pendingBookings,
      confirmed: confirmedBookings,
      rejected: rejectedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    },

    payments: {
      paid: paidPayments,
      pending: pendingPayments,
      failed: failedPayments,
      refunded: refundedPayments,
      partiallyRefunded: partiallyRefundedPayments,
    },

    roommateRequests: {
      pending: pendingRoommateRequests,
      accepted: acceptedRoommateRequests,
      rejected: rejectedRoommateRequests,
      cancelled: cancelledRoommateRequests,
    },

    reviews: {
      total: totalReviews,
    },

    recentBookings,
    recentPayments,
    recentRoommateRequests,
  };
};


export const DashboardService= {
    getUserDashboard
}