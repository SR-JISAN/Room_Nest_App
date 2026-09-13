export interface IUser {
    name: string
    email:string
    password: string
    imageURL?: string
    profile?: IProfile
}

interface IProfile {
  bio?: String;
  address?: String;
  occupation?: String;
  contactNumber?: string,
  dateOfBirth?: string;
}