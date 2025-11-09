import mongoose, { Schema } from 'mongoose';
import { ICoach } from '../types/coach.types';
declare const Coach: mongoose.Model<ICoach, {}, {}, {}, mongoose.Document<unknown, {}, ICoach, {}, {}> & ICoach & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Coach;
//# sourceMappingURL=Coach.d.ts.map