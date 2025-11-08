import { Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
  _id: ObjectId;
  userName: string;
  passWord: string;
  profile?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;
  };
  bodyWeight?: number;
  height?: number;
  gender?: string;
  sports: string[];
  age?: number;
  coachId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  userName: string;
  passWord: string;
  profile?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;
  };
  bodyWeight?: number;
  height?: number;
  gender?: string;
  sports?: string[];
  age?: number;
  coachId?: string;
}

export interface IUserUpdate {
  userName?: string;
  passWord?: string;
  profile?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;
  };
  bodyWeight?: number;
  height?: number;
  gender?: string;
  sports?: string[];
  age?: number;
  coachId?: string;
}

