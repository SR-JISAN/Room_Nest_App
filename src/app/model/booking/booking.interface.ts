import { PaymentStatus } from "../../../generated/prisma/enums";

export interface ICreateBooking {
  roomId: string;
  occupantCount: number;
  startDate: Date;
  endDate?: Date;
  note?: string;
}


