import { PropertyType, RoomType } from "../../../generated/prisma/enums";



export interface IRooms {
  roomTitle: string;
  roomDescription: string;
  rentAmount: number;
  securityDeposit: number;
  roomType: RoomType;
}

export interface IProperty {
  title: string;
  description: string;
  address: string;
  area: string;
  city: string;
  latitude: string;
  longitude: string;
  propertyType: PropertyType;
  rooms: IRooms[];
  amenities: string[];
}

export interface IUpdateProperty {
  title?: string;
  description?: string;
  address?: string;
  area?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  propertyType?: PropertyType;
}

export interface IUpdateRoom {
  title?: string;
  description?: string;
  rentAmount?: number;
  securityDeposit?: number;
  roomType?: RoomType;
}

