import { Role } from "../../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";


const getAdminDashboard = async () => {
  const [
    totalUsers,
    totalLandlords,
    totalProperties,
    totalRooms,
    totalBookings,

    activeUsers,
    blockedUsers,
    deletedUsers,

    pendingProperties,
    approvedProperties,
    rejectedProperties,

    availableRooms,
    bookedRooms,
    unavailableRooms,

    pendingBookings,
    confirmedBookings,
    rejectedBookings,
    cancelledBookings,
    completedBookings,

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
  ] = await Promise.all([
    // Users
    prisma.users.count({
      where: {
        isDeleted: false,
      },
    }),

    prisma.users.count({
      where: {
        role: Role.LANDLORD,
        isDeleted: false,
      },
    }),

    // Properties
    prisma.properties.count({
      where: {
        isDeleted: false,
      },
    }),

    // Rooms
    prisma.rooms.count({
      where: {
        isDeleted: false,
      },
    }),

    // Bookings
    prisma.booking.count(),

    // User Status
    prisma.users.count({
      where: {
        status: "ACTIVE",
        isDeleted: false,
      },
    }),

    prisma.users.count({
      where: {
        status: "BLOCKED",
        isDeleted: false,
      },
    }),

    prisma.users.count({
      where: {
        status: "DELETED",
      },
    }),

    // Property Status
    prisma.properties.count({
      where: {
        propertyStatus: "PENDING",
        isDeleted: false,
      },
    }),

    prisma.properties.count({
      where: {
        propertyStatus: "APPROVED",
        isDeleted: false,
      },
    }),

    prisma.properties.count({
      where: {
        propertyStatus: "REJECTED",
        isDeleted: false,
      },
    }),

    // Room Status
    prisma.rooms.count({
      where: {
        roomStatus: "AVAILABLE",
        isDeleted: false,
      },
    }),

    prisma.rooms.count({
      where: {
        roomStatus: "BOOKED",
        isDeleted: false,
      },
    }),

    prisma.rooms.count({
      where: {
        roomStatus: "UNAVAILABLE",
        isDeleted: false,
      },
    }),

    // Booking Status
    prisma.booking.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.booking.count({
      where: {
        status: "CONFIRMED",
      },
    }),

    prisma.booking.count({
      where: {
        status: "REJECTED",
      },
    }),

    prisma.booking.count({
      where: {
        status: "CANCELLED",
      },
    }),

    prisma.booking.count({
      where: {
        status: "COMPLETED",
      },
    }),

    // Payment Status
    prisma.payment.count({
      where: {
        paymentStatus: "PAID",
      },
    }),

    prisma.payment.count({
      where: {
        paymentStatus: "PENDING",
      },
    }),

    prisma.payment.count({
      where: {
        paymentStatus: "FAILED",
      },
    }),

    prisma.payment.count({
      where: {
        paymentStatus: "REFUNDED",
      },
    }),

    prisma.payment.count({
      where: {
        paymentStatus: "PARTIALLY_REFUNDED",
      },
    }),

    // Roommate Requests
    prisma.subRoomBooking.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        status: "ACCEPTED",
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        status: "REJECTED",
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        status: "CANCELLED",
      },
    }),

    // Reviews
    prisma.reviews.count(),
  ]);

  // Revenue
  const revenue = await prisma.payment.aggregate({
    where: {
      paymentStatus: "PAID",
    },
    _sum: {
      amount: true,
    },
  });

  // Recent bookings
  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      occupantCount: true,
      rentAmount: true,
      securityDeposit: true,
      totalAmount: true,
      createdAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

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
  });

  // Recent users
  const recentUsers = await prisma.users.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      imageURL: true,
      createdAt: true,
    },
  });

  return {
    overview: {
      totalUsers,
      totalLandlords,
      totalProperties,
      totalRooms,
      totalBookings,
      totalRevenue: revenue._sum.amount ?? 0,
    },

    users: {
      active: activeUsers,
      blocked: blockedUsers,
      deleted: deletedUsers,
    },

    properties: {
      pending: pendingProperties,
      approved: approvedProperties,
      rejected: rejectedProperties,
    },

    rooms: {
      available: availableRooms,
      booked: bookedRooms,
      unavailable: unavailableRooms,
    },

    bookings: {
      pending: pendingBookings,
      confirmed: confirmedBookings,
      rejected: rejectedBookings,
      cancelled: cancelledBookings,
      completed: completedBookings,
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
    recentUsers,
  };
};

export const DashboardService = {
  getAdminDashboard,
};
