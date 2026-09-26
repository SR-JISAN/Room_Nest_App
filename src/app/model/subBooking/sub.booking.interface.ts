import type{ Gender } from "../../../generated/prisma/enums";


export interface ICreateSubRoomBooking {
  name: string;
  age: number;
  gender: Gender;
  imageURL?: string;
  roomId: string;
  note?: string;
  occupantCount: number;
  startDate: Date;
  endDate?: Date;
};