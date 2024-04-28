import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody {
  name: string;
  email: string;
  photo: string;
  gender: string;
  _id: string;
  dob: Date;
}

export interface  NewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
}

export interface NewCouponRequestBody{
  code:string,
  amount:number,
}

export type ControllerType = (
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

export interface BaseQuery {
  name?: {
    $regex: string; // to find the patterns and options to convert the keyword into lowercase
    $options: string;
  };
  price?: {
    // it will find the product whose price is equal to the given or price or below it
    $lte: number;
  };
  category?: string; // key value pair is same so passed directly and didn't write any query because want exact value
}

export type invalidatesCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?:string; // ?: this is symbol is used for optional 
  orderId?:string;
  productId?:string | string[];
};

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type ShippingInfoType = {
  address:string;
  city:string;
  state:string;
  country:string;
  pinCode:number
};

export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType[];
}
