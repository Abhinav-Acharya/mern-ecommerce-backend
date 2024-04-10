import { NextFunction, Request, Response } from "express";
import { Document } from "mongoose";

export interface INewUserRequestBody {
  _id: string;
  name: string;
  email: string;
  photo: string;
  gender: string;
  dob: Date;
}

export interface INewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
  photo: string;
}

export type Controller = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export interface IBaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $lte: number;
  };
  category?: string;
}

export type InvalidateCacheProps = {
  userId?: string;
  admin?: boolean;
  product?: boolean;
  productId?: string | string[];
  order?: boolean;
  orderId?: string;
};

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
};

export interface INewOrderReqBody {
  shippingInfo: ShippingInfoType;
  user: string;
  subTotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType[];
}

export interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}

export type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};
