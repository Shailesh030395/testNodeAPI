import { Request } from "express";

export interface DefaultResponseInterface {
  message: string;
  statusCode: number;
  data: any;
  total?: number;
  page?: number;
}

export interface RequestExtended extends Request {
  user?: any;
}

export interface UserInfo {
  id?: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  isVerified?: boolean;
  forgotPasswordToken?: string;
  forgotPasswordTokenExpiresAt?: string;
  status?: boolean;
  profileImg?: string;
  createdAt?: Date;
  updatedAt?: Date;
  roleId?: string;
  companyId?: string;
}

export interface CreateRuleRequestBody {
  userId: number;
  effectiveDate?: Date;
  productCategory?: string;
  countryISOCode?: string;
  customer?: string;
  product?: string;
  warrantyMonth?: string;
  comments?: string;
}
