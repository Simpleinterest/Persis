import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userName: string;
  passWord: string;
}

const UserSchema: Schema = new Schema({
  userName: {
    type: String,
    required: true,
    unique: true
  },
  passWord: {
    type: String,
    required: true
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);

