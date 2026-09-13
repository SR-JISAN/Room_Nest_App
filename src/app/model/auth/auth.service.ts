import { prisma } from "../../lib/prisma";
import AppError from "../../utils/appError";
import type { IUser } from "./auth.interface";
import httpStatus from "http-status"

const register = async (payload:IUser)=>{
     const {email,name,password,imageURL,profile} = payload

     const isExistUser = await prisma.users.findUnique(
      {
        where:{email}
    })

    if(isExistUser){
        throw new AppError(httpStatus.CONFLICT,"this email already exist. Try with another email")
    }

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