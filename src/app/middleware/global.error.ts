import type { NextFunction, Request, Response } from "express";
import config from "../config";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import AppError from "../utils/appError";

export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (config.node_env === "development") {
    console.log("Error from Global Error Handler", error);
  }

  let statusCode: Number = httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage: String = error.message || "Internal Server Error";

  let errorName = error.name || "Internal Server Error";

  if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "You have provided incorrect field type or missing fields";
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "Duplicate Key Error";
  } else if (error.code === "P2003") {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage =
      "An operation failed because it depends on one or more records that were required but not found.";
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMessage =
        "Authentication failed against database server. Please Check Your Credentials";
    }
  } else if (error.errorCode === "P1001") {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "Can't reach database server";
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMessage = "Error occurred during query execution";
  } else if (error instanceof AppError) {
    statusCode = error.statusCode
    errorMessage = error.message;
  }

  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode: statusCode || httpStatus.INTERNAL_SERVER_ERROR,
    name:
      config.node_env === "development" ? errorName : "Internal Server Error",
    message:
      config.node_env === "development"
        ? errorMessage
        : "Internal Server Error",
    error: config.node_env === "development" ? error : undefined,
    stack: config.node_env === "development" ? error.stack : undefined,
  });
};
