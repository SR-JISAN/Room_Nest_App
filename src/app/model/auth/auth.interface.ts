import { Role } from "../../../generated/prisma/enums";

export interface IUser {
  name: string;
  email: string;
  password: string;
  imageURL?: string;
  profile?: IProfile;
}

interface IProfile {
  bio?: String;
  address?: String;
  occupation?: String;
  contactNumber?: string;
  dateOfBirth?: string;
}


export interface IVerifyEmail {
    email: string
    otp: string
}

export interface ILogin {
    email : string
    password: string
}

export interface IGoogleLogin{
    idToken:string
}

export interface IUpdatePassword{
  currentPassword: string
  newPassword:string
  confirmPassword:string
};

export interface IResetPassword {
  email: string
};
export interface IResetPasswordVerified {
  otp: string
  newPassword : string
};
