import { prisma } from "../../../lib/prisma";


const getLandlordDashboard = async (userId: string) => {
 

  const [
    totalProperties,
    pendingProperties,
    approvedProperties,
    rejectedProperties,

    totalRooms,
    availableRooms,
    bookedRooms,
    unavailableRooms,

    pendingBookings,
    confirmedBookings,
    rejectedBookings,
    cancelledBookings,
    completedBookings,

    pendingRoommateRequests,
    acceptedRoommateRequests,
    rejectedRoommateRequests,
    cancelledRoommateRequests,

    paidPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
  ] = await Promise.all([
    // Properties
    prisma.properties.count({
      where: {
        usersId: userId,
        isDeleted: false,
      },
    }),

    prisma.properties.count({
      where: {
        usersId: userId,
        propertyStatus: "PENDING",
        isDeleted: false,
      },
    }),

    prisma.properties.count({
      where: {
        usersId: userId,
        propertyStatus: "APPROVED",
        isDeleted: false,
      },
    }),

    prisma.properties.count({
      where: {
        usersId: userId,
        propertyStatus: "REJECTED",
        isDeleted: false,
      },
    }),

    // Rooms
    prisma.rooms.count({
      where: {
        property: {
          usersId: userId,
          isDeleted: false,
        },
        isDeleted: false,
      },
    }),

    prisma.rooms.count({
      where: {
        property: {
          usersId: userId,
          isDeleted: false,
        },
        roomStatus: "AVAILABLE",
        isDeleted: false,
      },
    }),

    prisma.rooms.count({
      where: {
        property: {
          usersId: userId,
          isDeleted: false,
        },
        roomStatus: "BOOKED",
        isDeleted: false,
      },
    }),

    prisma.rooms.count({
      where: {
        property: {
          usersId: userId,
          isDeleted: false,
        },
        roomStatus: "UNAVAILABLE",
        isDeleted: false,
      },
    }),

    // Main Booking
    prisma.booking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "PENDING",
      },
    }),

    prisma.booking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "CONFIRMED",
      },
    }),

    prisma.booking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "REJECTED",
      },
    }),

    prisma.booking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "CANCELLED",
      },
    }),

    prisma.booking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "COMPLETED",
      },
    }),

    // Roommate requests
    prisma.subRoomBooking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "PENDING",
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "ACCEPTED",
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "REJECTED",
      },
    }),

    prisma.subRoomBooking.count({
      where: {
        room: {
          property: {
            usersId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
        status: "CANCELLED",
      },
    }),

    // Payments
    prisma.payment.count({
      where: {
        paymentStatus: "PAID",
        OR: [
          {
            booking: {
              room: {
                property: {
                  usersId: userId,
                },
              },
            },
          },
          {
            subBooking: {
              room: {
                property: {
                  usersId: userId,
                },
              },
            },
          },
        ],
      },
    }),

    prisma.payment.count({
      where: {
        paymentStatus: "PENDING",
        OR: [
          {
            booking: {
              room: {
                property: {
                  usersId: userId,
                },
              },
            },
          },
          {
            subBooking: {
              room: {
                property: {
                  usersId: userId,
                },
              },
            },
          },
        ],
      },
    }),

    prisma.payment.count({
      where: {
        paymentStatus: "FAILED",
        OR: [
          {
            booking: {
              room: {
                property: {
                  usersId: userId,
                },
              },
            },
          },
          {
            subBooking: {
              room: {
                property: {
                  usersId: userId,
                },
              },
            },
          },
        ],
      },
    }),

    prisma.payment.count({
      where: {
        paymentStatus: "REFUNDED",
        OR: [
          {
            booking: {
              room: {
                property: {
                  usersId: userId,
                },
              },
            },
          },
          {
            subBooking: {
              room: {
                property: {
                  usersId: userId,
                },
              },
            },
          },
        ],
      },
    }),
  ]);

  /*
   * ============================================================
   * 2. TOTAL EARNINGS
   * ============================================================
   */

  const earnings = await prisma.payment.aggregate({
    where: {
      paymentStatus: "PAID",
      OR: [
        {
          booking: {
            room: {
              property: {
                usersId: userId,
              },
            },
          },
        },
        {
          subBooking: {
            room: {
              property: {
                usersId: userId,
              },
            },
          },
        },
      ],
    },
    _sum: {
      amount: true,
    },
  });

 

  const confirmedBooking = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      room: {
        property: {
          usersId: userId,
        },
      },
    },
    select: {
      userId: true,
    },
  });

  const acceptedSubBookings = await prisma.subRoomBooking.findMany({
    where: {
      status: "ACCEPTED",
      room: {
        property: {
          usersId: userId,
        },
      },
    },
    select: {
      userId: true,
    },
  });

  const tenantIds = new Set([
    ...confirmedBooking.map((booking) => booking.userId),
    ...acceptedSubBookings.map((booking) => booking.userId),
  ]);

 

  const recentBookings = await prisma.booking.findMany({
    where: {
      room: {
        property: {
          usersId: userId,
        },
      },
    },

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
      startDate: true,
      endDate: true,
      createdAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageURL: true,
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

  

  const recentRoommateRequests = await prisma.subRoomBooking.findMany({
    where: {
      room: {
        property: {
          usersId: userId,
        },
      },
    },

    take: 5,

    orderBy: {
      createdAt: "desc",
    },

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

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageURL: true,
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
            },
          },
        },
      },
    },
  });

  /*
   * ============================================================
   * 6. RECENT PAYMENTS
   * ============================================================
   */

  const recentPayments = await prisma.payment.findMany({
    where: {
      OR: [
        {
          booking: {
            room: {
              property: {
                usersId: userId,
              },
            },
          },
        },
        {
          subBooking: {
            room: {
              property: {
                usersId: userId,
              },
            },
          },
        },
      ],
    },

    take: 5,

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      amount: true,
      currency: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentType: true,
      paidAt: true,
      createdAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageURL: true,
        },
      },
    },
  });

  /*
   * ============================================================
   * 7. RETURN DASHBOARD
   * ============================================================
   */

  return {
    overview: {
      totalProperties,
      totalRooms,
      availableRooms,
      bookedRooms,
      unavailableRooms,
      activeTenants: tenantIds.size,
      totalEarnings: earnings._sum.amount ?? 0,
    },

    properties: {
      pending: pendingProperties,
      approved: approvedProperties,
      rejected: rejectedProperties,
    },

    bookings: {
      pending: pendingBookings,
      confirmed: confirmedBookings,
      rejected: rejectedBookings,
      cancelled: cancelledBookings,
      completed: completedBookings,
    },

    roommateRequests: {
      pending: pendingRoommateRequests,
      accepted: acceptedRoommateRequests,
      rejected: rejectedRoommateRequests,
      cancelled: cancelledRoommateRequests,
    },

    payments: {
      paid: paidPayments,
      pending: pendingPayments,
      failed: failedPayments,
      refunded: refundedPayments,
    },

    recentBookings,
    recentRoommateRequests,
    recentPayments,
  };
};

export const DashboardService = {
  getLandlordDashboard,
};
