import { prisma } from "../../lib/prisma";
import AppError from "../../utils/appError";
import type { IUser } from "./auth.interface";
import httpStatus from "http-status"
import crypto from "crypto"
import { redisClient } from "../../lib/redis";

const register = async (payload:IUser)=>{
     const {email,name,password,imageURL,profile} = payload

     const isExistUser = await prisma.users.findUnique(
      {
        where:{email}
    })

    if(isExistUser){
        throw new AppError(httpStatus.CONFLICT,"this email already exist. Try with another email")
    }

    const otp = crypto.randomInt(100000,1000000).toString();

    const key = `verify-register-email: ${email}`

    await redisClient.set(key,otp,{
        expiration:{
            type:"EX",
            value: 2*60
        }
    });
    

    const result = await prisma.users.create({
      data: {
        name,
        email,
        password,
        imageURL,
        profiles: {
          create: { 
            contactNumber: profile?.contactNumber,
        },
        },
      },
      include: {
        profiles: true,
      },
    });

    console.log(result)

    return result


};


export const AuthService = {
    register
}