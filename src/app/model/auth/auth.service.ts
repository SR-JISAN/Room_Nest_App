import { prisma } from "../../lib/prisma";
import AppError from "../../utils/appError";
import type { ILogin, IUser, IVerifyEmail } from "./auth.interface";
import httpStatus from "http-status"
import crypto from "crypto"
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import config from "../../config";
import path from "path";
import ejs from "ejs"
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { JwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";

const register = async (payload:IUser)=>{
     const {name,password,imageURL,profile} = payload
     const email = payload.email.trim().toLowerCase();
     const isExistUser = await prisma.users.findUnique(
      {
        where:{email}
    })

    if(isExistUser){
        throw new AppError(httpStatus.CONFLICT,"this email already exist. Try with another email")
    }

    const profileData = {
      contactNumber: profile?.contactNumber,
    };

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

    const otp = crypto.randomInt(100000,1000000).toString();

    const key = `verify-register-email:${email}`

    const expiration = 2*60;
    const expiresAt = new Date(Date.now() + expiration * 1000);

    await redisClient.set(key,otp,{
        expiration:{
            type:"EX",
            value: expiration
        }
    });

     const userRegistrationKey = `user-registration-data:${email}`;
     const redisClientPayload = {
       name,
       email,
       password: hashedPassword,
       profile: profileData,
     };
     await redisClient.set(
       userRegistrationKey,
       JSON.stringify(redisClientPayload),
       {
         expiration: {
           type: "EX",
           value: expiration,
         },
       },
     );
    const templatePath = path.join(process.cwd(),"/src/app/template/email.verify.ejs")

    const formattedExpiresAt = expiresAt.toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        dateStyle: "medium",
        timeStyle: "short",
    });
    
    const html = await ejs.renderFile(templatePath, {
      name,
      otp,
      expiresAt: formattedExpiresAt,
    });


    await transporter.sendMail({
        from:config.sender_email,
        to:email,
        subject:"Verify Your Email -Room_Nest",
        html
    })

};

const emailVerify = async(payload:IVerifyEmail)=>{
   const {email,otp}= payload;

   const isExistUser = await prisma.users.findUnique({
     where: { email },
   });

   if (isExistUser?.emailVerified) {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       "this email already verified. Try with another email",
     );
   }

   if(isExistUser?.isDeleted){
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "this email already deleted. Try with another email",
        );
   }
   if(isExistUser?.status === "BLOCKED"){
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "this email is blocked. contact with authority",
        );
   }
   if(isExistUser?.status === "DELETED"){
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "this email is deleted. contact with authority",
        );
   }
   if(isExistUser?.googleID || isExistUser?.authProvider === "GOOGLE"){
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Your are google user. Please set a password",
        );
   };

   const key = `verify-register-email:${email}`;

   const redisOtp = await redisClient.get(key)

   if(redisOtp !== otp){
    throw new AppError(httpStatus.BAD_REQUEST,"Otp doesn't matched.")
   };

   const verifyKey = `user-registration-data:${email}`;

   const redisUserData = await redisClient.get(verifyKey);

   if(!redisUserData){
    throw new AppError(httpStatus.BAD_REQUEST,"Registration data expired. Try again")
   }

   await redisClient.del(key);

   const verifiedUser: IUser = JSON.parse(redisUserData);
   console.log(verifiedUser)

 const result = await prisma.users.create({
   data: {
     name:verifiedUser.name,
     email:verifiedUser.email,
     password:verifiedUser.password,
     imageURL:verifiedUser.imageURL,
     role: Role.USER,
     status:UserStatus.ACTIVE,
     emailVerified : true,
     profiles: {
       create: {
         contactNumber: verifiedUser.profile?.contactNumber,
       },
     },
   },
   omit:{
    password:true
   },
   include: {
     profiles: true,
   },
 });

 await redisClient.del(verifyKey);

const {profiles, ...user} = result

const jwtPayload = {
    userId: user.id,
    name:user.name,
    email:user.email,
    role:user.role,
}


const accessToken = JwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions
);

const refreshToken = JwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions
);

 const templatePath = path.join(
   process.cwd(),
   "/src/app/template/welcome.email.ejs",
 );

 const html = await ejs.renderFile(templatePath, {
   name : verifiedUser.name,
   email : verifiedUser.email
 });

 await transporter.sendMail({
   from: config.sender_email,
   to: email,
   subject: "Welcome To Room_Nest",
   html,
 });




 return  {
 accessToken,
 refreshToken
 };



}

const login =async(payload : ILogin)=>{
    
    const {password}= payload;
    const email = payload.email.trim().toLowerCase()

    const isExistUser = await prisma.users.findUnique({
        where: {
            email
        }
    });

    if(!isExistUser){
        throw new AppError(httpStatus.BAD_REQUEST,"user not found")
    };

    if(!isExistUser.emailVerified){
        throw new AppError(httpStatus.BAD_REQUEST,"your email is not verified please verified with re-registration");
    };

    if(isExistUser.status === "BLOCKED" || isExistUser.status === "DELETED"){
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `your email is ${isExistUser.status}. contact with authority`,
        );
    };

    const jwtPayload = {
      userId: isExistUser.id,
      name: isExistUser.name,
      email: isExistUser.email,
      role: isExistUser.role,
    };

    const accessToken = JwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

    const refreshToken = JwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );

    const templatePath = path.join(
      process.cwd(),
      "/src/app/template/welcome.back.email.ejs",
    );

    const html = await ejs.renderFile(templatePath, {
      name: isExistUser.name,
      email: isExistUser.email,
      frontendUrl: config.frontend_url
    });

    await transporter.sendMail({
      from: config.sender_email,
      to: email,
      subject: "Welcome Back To Room_Nest",
      html,
    });

    return {
      accessToken,
      refreshToken,
    };



    
} 

const googleLogin = async ()=>{

}


export const AuthService = {
  register,
  emailVerify,
  login,
  googleLogin
};