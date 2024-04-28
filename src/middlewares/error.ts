import { NextFunction, Request, Response } from "express";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //err.message = err.message || " "; //below line is the short form of this line
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  if(err.name==="CastError") err.message = "Invalid ID"


  return res.status(400).json({
    success: false,
    message: err.message,
  });
};

export const TryCatch =
  (func: ControllerType) =>
  (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(func(req,res,next)).catch(next);
  };


  
