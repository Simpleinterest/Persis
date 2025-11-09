import { Server } from 'socket.io';
import './models/User';
import './models/Coach';
declare const app: import("express-serve-static-core").Express;
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, io };
//# sourceMappingURL=server.d.ts.map