import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utility-class";
import { Controller } from "../types/types";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message ||= "Internal error";
  err.statusCode ||= 500;

  if (err.name === "CastError") err.message = "Invalid ID";

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export const tryCatch =
  (func: Controller) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(func(req, res, next)).catch(next);
  };
