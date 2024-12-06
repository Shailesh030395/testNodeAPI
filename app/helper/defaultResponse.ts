import { Response } from "express";
import { DefaultResponseInterface } from "../interfaces/global";

export const DefaultResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any,
  total?: number,
  page?: number
) => {
  let response: DefaultResponseInterface = {
    message: message,
    statusCode: statusCode,
    data: data,
  };
  if (total) {
    response = { ...response, total };
  }
  if (page) {
    response = { ...response, page };
  }

  return res.status(statusCode).json(response);
};
