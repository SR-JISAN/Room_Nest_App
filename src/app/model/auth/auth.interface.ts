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

export interface IRequestUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface IVerifyEmail {
    email: string
    otp: string
}

export interface ILogin {
    email : string
    password: string
}