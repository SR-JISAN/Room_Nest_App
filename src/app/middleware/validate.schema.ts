import type z from "zod";
import { CatchAsync } from "../utils/catchAsync";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import httpStatus from "http-status"


export const ValidateRequest = (zodSchema:z.ZodObject )=>{
    return CatchAsync((req:Request,res:Response,next:NextFunction)=>{
        const payload = req.body||{}
        const result = zodSchema.safeParse(payload)
        if (!result.success) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            result.error.issues[0]?.message || "Validation failed",
          );
        }

        req.body = result.data;
        next();
    })
}