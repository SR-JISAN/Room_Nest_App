import { Request, Response } from "express";
import httpStatus from "http-status"


export const notFound = (req:Request, res: Response)=>{
    res.status(httpStatus.NOT_FOUND).json({
        message:"Requested Rout Not Found",
        path: req.originalUrl,
        date: new Date()
    })
};