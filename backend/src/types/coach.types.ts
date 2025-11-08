import { Document, ObjectId } from 'mongoose';

export interface ICoach extends Document {
  _id: ObjectId;
  userName: string;
  passWord: string;
  studentsId: ObjectId[];
  sports: string[];
  aiParameters?: {
    [studentId: string]: string; // Custom AI parameters for each student
  };
  profile?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;
    specialization?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoachCreate {
  userName: string;
  passWord: string;
  studentsId?: string[];
  sports?: string[];
  aiParameters?: {
    [studentId: string]: string;
  };
  profile?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;
    specialization?: string;
  };
}

export interface ICoachUpdate {
  userName?: string;
  passWord?: string;
  studentsId?: string[];
  sports?: string[];
  aiParameters?: {
    [studentId: string]: string;
  };
  profile?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;
    specialization?: string;
  };
}

