import type{ UploadApiResponse } from "cloudinary";
import { prisma } from "../../lib/prisma";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import type { IRequestUser } from "../../middleware/check.auth";
import AppError from "../../utils/appError";
import type { IUpdateProfile } from "./user.interface";
import httpStatus from "http-status"
import { cloudinary } from "../../lib/cloudinary";

const updateProfile = async (
  payload: IUpdateProfile,
  user: IRequestUser,
) => {
  
  const isExistUser = await prisma.users.findUnique({
    where: {
      email: user.email,
    },
    include: {
      profiles: true,
    },
    omit: {
      password: true,
    },
  });

  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (!isExistUser.emailVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Your email is not verified. Please verify your email.",
    );
  }

  if (isExistUser.status === "BLOCKED" || isExistUser.status === "DELETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your account is ${isExistUser.status}. Contact with authority.`,
    );
  }


  // Update profile information
  const updateUserProfile = await prisma.profiles.update({
    where: {
      userId: isExistUser.id,
    },
    data: {
      ...(payload.bio !== undefined && {
        bio: payload.bio,
      }),

      ...(payload.address !== undefined && {
        address: payload.address,
      }),

      ...(payload.contactNumber !== undefined && {
        contactNumber: payload.contactNumber,
      }),

      ...(payload.dateOfBirth !== undefined && {
        dateOfBirth: payload.dateOfBirth,
      }),

      ...(payload.occupation !== undefined && {
        occupation: payload.occupation,
      }),
    },
  });

 

  return {
    profile: updateUserProfile,
  };
};


const updateProfileImage = async (
  buffer: Buffer | undefined,
  user: IRequestUser,
) => {
  const isExistUser = await prisma.users.findUnique({
    where: {
      email: user.email,
    },
    include: {
      profiles: true,
    },
    omit: {
      password: true,
    },
  });

  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (!isExistUser.emailVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Your email is not verified. Please verify your email.",
    );
  }

  if (isExistUser.status === "BLOCKED" || isExistUser.status === "DELETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your account is ${isExistUser.status}. Contact with authority.`,
    );
  }

  // Existing image information
  const currentUser = await prisma.users.findUnique({
    where: {
      id: isExistUser.id,
    },
    select: {
      imageURL: true,
      imagePublicId: true,
    },
  });

  let cloudinaryResult: UploadApiResponse | null = null;

  // Upload only if user selected a new image
  if (buffer) {
    cloudinaryResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }

              if (!result) {
                return reject(
                  new AppError(
                    httpStatus.BAD_REQUEST,
                    "No result returned from Cloudinary",
                  ),
                );
              }

              resolve(result);
            },
          )
          .end(buffer);
      },
    );
  }

  let updatedUser = null;

  if (cloudinaryResult) {
    updatedUser = await prisma.users.update({
      where: {
        id: isExistUser.id,
      },
      data: {
        imageURL: cloudinaryResult.secure_url,
        imagePublicId: cloudinaryResult.public_id,
      },
      omit: {
        password: true,
      },
    });
  }

  // Delete old Cloudinary image
  if (cloudinaryResult && currentUser?.imagePublicId) {
    await cloudinary.uploader.destroy(currentUser.imagePublicId);
  }

  return {
    user: updatedUser,
  };
};

const getAdminUsers = async (page: number, limit: number, role?: Role, status?: UserStatus) => {
  const where = {
    isDeleted: false,
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, status: true, emailVerified: true, imageURL: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.users.count({ where }),
  ]);
  return { result: users, Meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const updateAdminUserStatus = async (userId: string, status: UserStatus, adminId: string) => {
  if (userId === adminId) {
    throw new AppError(httpStatus.BAD_REQUEST, "You cannot change your own account status.");
  }
  const target = await prisma.users.findFirst({ where: { id: userId, isDeleted: false } });
  if (!target) throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  return prisma.users.update({
    where: { id: target.id },
    data: { status, ...(status === UserStatus.DELETED ? { isDeleted: true, deletedAt: new Date() } : {}) },
    select: { id: true, name: true, email: true, role: true, status: true, emailVerified: true, imageURL: true },
  });
};


 
export const UserService = {
  updateProfile,
  updateProfileImage,
  getAdminUsers,
  updateAdminUserStatus,
};
