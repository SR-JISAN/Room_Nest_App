import { prisma } from "../../lib/prisma";
import AppError from "../../utils/appError";
import type { IGoogleLogin, ILogin, IResetPassword, IResetPasswordVerified, IUpdatePassword, IUser, IVerifyEmail } from "./auth.interface";
import httpStatus from "http-status"
import crypto from "crypto"
import { redisClient } from "../../lib/redis";

import config from "../../config";
import path from "path";
import ejs from "ejs"
import { AuthProvider, Role, UserStatus } from "../../../generated/prisma/enums";
import { JwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TokenPayload } from "google-auth-library";
import { GoogleClient } from "../../lib/google.client";
import { IRequestUser } from "../../middleware/check.auth";
import { Result } from "pg";
import { transporter } from "../../lib/nodemailer";

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
    const expiresAt = expiration / 60;

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

    
    
    const html = await ejs.renderFile(templatePath, {
      name,
      otp,
      expiresAt: expiresAt,
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
   name: verifiedUser.name,
   email: verifiedUser.email,
   frontendUrl: config.frontend_url,
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


    if (!isExistUser.password) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have to set a password",
      );
    }

    const isPasswordMatched = await bcrypt.compare(
      password,
      isExistUser.password,
    );
    if (!isPasswordMatched) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Current password is incorrect",
      );
    }

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

const googleLogin = async (payload:IGoogleLogin) => {

    let googleTokenPayload : TokenPayload | undefined | null = null
    try {
        const ticket = await GoogleClient.verifyIdToken({
            idToken: payload.idToken,
            audience: config.client_id
        });

        googleTokenPayload = ticket.getPayload();

    } catch (error:any) {
        console.log(error);
        throw new AppError(httpStatus.BAD_REQUEST,"Invalid or Expired Your Token")
    };

    if(!googleTokenPayload){
        throw new AppError(httpStatus.NOT_FOUND,"Token not found")
    };

    const isExistUserWithGoogleAuth = await prisma.users.findUnique({
        where:{
            email: googleTokenPayload.email,
            role:Role.USER,
            googleID:googleTokenPayload.sub
        }
    });

    let googleUser = isExistUserWithGoogleAuth;
    if (!googleTokenPayload.name) {
      throw new AppError(httpStatus.NOT_FOUND,"User Name Not Found");
    }
    if (!googleTokenPayload.email) {
      throw new AppError(httpStatus.NOT_FOUND, "User Email Not Found");
    };
    if(!googleUser){
        const UserIsCredentials = await prisma.users.findUnique({
            where:{
                email: googleTokenPayload.email,
                role: Role.USER,
                authProvider:AuthProvider.CREDENTIALS
            }
        });

        if(UserIsCredentials){
            if(!UserIsCredentials.emailVerified){
                throw new AppError(
                  httpStatus.BAD_REQUEST,
                  "email is not verified. Please verify it.",
                );
            };
            if(UserIsCredentials.isDeleted || UserIsCredentials.status === UserStatus.DELETED){
                throw new AppError(
                  httpStatus.BAD_REQUEST,
                  "You are deleted from Room Nest.",
                );
            };
            if(UserIsCredentials.status === UserStatus.BLOCKED){
                throw new AppError(
                  httpStatus.BAD_REQUEST,
                  "You are blocked by authority",
                );
            };

          googleUser =  await prisma.users.update({
                where:{
                    id: UserIsCredentials.id
                },
                data:{
                    googleID: googleTokenPayload.sub
                }
            });
        }
        else {
            googleUser = await prisma.users.create({
              data: {
                name: googleTokenPayload.name,
                email: googleTokenPayload.email,
                role: Role.USER,
                emailVerified: true,
                authProvider: AuthProvider.GOOGLE,
                googleID: googleTokenPayload.sub,
                imageURL: googleTokenPayload.picture,
                needPasswordChange:true,
                profiles:{
                    create:{
                        address:""
                    }
                }
              }
            });
        }
    };
 
    if (!googleUser) {
      throw new AppError(httpStatus.NOT_FOUND,"User Not Found");
    }

    if (googleUser.status === UserStatus.BLOCKED) {
      throw new AppError(httpStatus.BAD_REQUEST,"User Blocked By Authority. Contact Us");
    }

    if (googleUser.isDeleted || googleUser.status === UserStatus.DELETED) {
      throw new AppError(httpStatus.BAD_REQUEST,"User Deleted Re-Register");
    }

    if (googleUser.password !== null && googleUser.googleID !== null) {
      throw new AppError(httpStatus.BAD_REQUEST,"Password Incorrect Log In With Google");
    }

    const jwtPayload = {
      userId: googleUser.id,
      name: googleUser.name,
      email: googleUser.email,
      role: googleUser.role,
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
     "/src/app/template/welcome.email.ejs",
   );

   const html = await ejs.renderFile(templatePath, {
     name: googleUser.name,
     email: googleUser.email,
     frontendUrl: config.frontend_url
   });

   await transporter.sendMail({
     from: config.sender_email,
     to: googleUser.email,
     subject: "Welcome To Room_Nest",
     html,
   });

    return {
      accessToken,
      refreshToken,
    };
};

const updatePassword = async(payload:IUpdatePassword, user:IRequestUser)=>{
  const {currentPassword,newPassword,confirmPassword}= payload;
  const isUserExist = await prisma.users.findUnique({
    where: {
      id: user.userId,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (!isUserExist.emailVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "your email is not verified please verified with re-registration",
    );
  }

  if (isUserExist.status === "BLOCKED" || isUserExist.status === "DELETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `your email is ${isUserExist.status}. contact with authority`,
    );
  };

  if(isUserExist.password === null || !isUserExist.password ){
    throw new AppError(httpStatus.BAD_REQUEST,"You didn't set password yet.")
  };

  const isPasswordMatched = await bcrypt.compare(currentPassword,isUserExist.password);

  if(!isPasswordMatched){
    throw new AppError(httpStatus.BAD_REQUEST, "Current password is incorrect");
  };

  if(newPassword.length !== confirmPassword.length || newPassword !== confirmPassword){
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password and confirm password do not match",
    );
  };

  const hashPassword =await bcrypt.hash(confirmPassword,Number(config.bcrypt_salt_rounds))

  const result = await prisma.users.update({
    where: {
      id: isUserExist.id,
    },
    data: {
      password: hashPassword,
      needPasswordChange:false
    },
    omit:{
      password:true
    }
  });

   const templatePath = path.join(
     process.cwd(),
     "/src/app/template/password-updated.email.ejs",
   );

   const html = await ejs.renderFile(templatePath, {
     name: isUserExist.name,
     email: isUserExist.email,
     frontendUrl: config.frontend_url,
   });

   await transporter.sendMail({
     from: config.sender_email,
     to: isUserExist.email,
     subject: "Your password was updated successfully.",
     html,
   });

  return result

}

const resetPassword = async(payload:IResetPassword)=>{


  const { email } = payload;

  const isUserExist = await prisma.users.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (!isUserExist.emailVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "your email is not verified please verified with re-registration",
    );
  }

  if (isUserExist.status === "BLOCKED"  || isUserExist.status === "DELETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `your email is ${isUserExist.status}. contact with authority`,
    );
  }

  if (isUserExist.password !== null || isUserExist.password || !isUserExist.needPasswordChange) {
    throw new AppError(httpStatus.BAD_REQUEST, "You already set password.");
  };

  if(isUserExist.authProvider === AuthProvider.CREDENTIALS){
    throw new AppError(httpStatus.BAD_REQUEST,"You are a credentials user so you can't reset password")
  }

  const key = `reset-user-password ${isUserExist.email}`;
  
  const generateOtp = ()=>{
    const cleanUUid = crypto.randomUUID().replace("/-/g", "");

    const base6 = cleanUUid.slice(0, 6);

    const otp = base6
      .split("")
      .map((char) => {
        return Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase();
      })
      .join("")
      .toString();

      return  otp
  }

  const otp = generateOtp()
    


  const expired = 2*60;
  const expiredAt = expired/60
  

   await redisClient.set(key,otp,{
    expiration:{
      type:"EX",
      value:expired
    }
  });

  const templatePath = path.join(process.cwd(),"/src/app/template/email.verify.ejs")

  const html = await ejs.renderFile(templatePath, {
    name: isUserExist.name,
    otp,
    expiresAt: expiredAt,
  });


  await transporter.sendMail({
    from:config.sender_email,
    to: isUserExist.email,
    subject: "Reset your password",
    html
  })
};

const resetPasswordVerified = async(payload:IResetPasswordVerified, user: IRequestUser)=>{
   const {otp,newPassword} = payload
  
  const isExistUser = await prisma.users.findUnique({
    where: {
      email: user.email,
    },
  });
  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (!isExistUser.emailVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "your email is not verified please verified with re-registration",
    );
  }

  if (isExistUser.status === "BLOCKED" || isExistUser.status === "DELETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `your email is ${isExistUser.status}. contact with authority`,
    );
  }

  if (
    isExistUser.password !== null ||
    isExistUser.password ||
    !isExistUser.needPasswordChange
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "You already set password.");
  };
 const key = `reset-user-password ${isExistUser.email}`;

const redisOtp =await redisClient.get(key);


if (!redisOtp) {
  throw new AppError(
    httpStatus.BAD_REQUEST,
    "OTP expired. Please request a new OTP.",
  );
};

if(redisOtp !== otp){
  throw new AppError(httpStatus.BAD_REQUEST,"OTP doesn't matched. please give a valid OTP!!")
}

const hashPassword = await bcrypt.hash(newPassword,Number(config.bcrypt_salt_rounds))

const templatePath = path.join(
  process.cwd(),
  "/src/app/template/reset.password.ejs",
);

const html = await ejs.renderFile(templatePath, {
  name: isExistUser.name,
  frontendUrl: config.frontend_url,
});

const updatePassword = await prisma.users.update({
  where:{
    email:isExistUser.email
  },
  data:{
    password:hashPassword,
    needPasswordChange:false
  },
  omit:{
    password:true
  }
})



 await transporter.sendMail({
  from: config.sender_email,
  to:isExistUser.email,
  subject:"You have successfully Reset your Password",
  html
})

return updatePassword;
}




export const AuthService = {
  register,
  emailVerify,
  login,
  googleLogin,
  updatePassword,
  resetPassword,
  resetPasswordVerified,
};