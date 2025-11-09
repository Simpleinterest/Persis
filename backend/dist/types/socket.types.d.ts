import { Socket } from 'socket.io';
export interface AuthenticatedSocket extends Socket {
    userId?: string;
    userType?: 'user' | 'coach';
    userName?: string;
}
export interface SocketMessage {
    id: string;
    from: string;
    to: string;
    message: string;
    timestamp: Date;
    type: 'text' | 'video' | 'system';
}
export interface ChatRoom {
    id: string;
    participants: string[];
    type: 'user-coach' | 'user-ai';
    createdAt: Date;
}
export interface VideoStreamData {
    userId: string;
    streamId: string;
    timestamp: Date;
}
export interface ClientToServerEvents {
    authenticate: (data: {
        token: string;
    }) => void;
    join_room: (data: {
        roomId: string;
    }) => void;
    leave_room: (data: {
        roomId: string;
    }) => void;
    send_message: (data: {
        roomId: string;
        message: string;
        type?: 'text' | 'video';
    }) => void;
    start_stream: (data: {
        roomId: string;
    }) => void;
    stop_stream: (data: {
        roomId: string;
    }) => void;
    stream_data: (data: {
        roomId: string;
        streamData: any;
    }) => void;
    ai_chat_message: (data: {
        message: string;
        context?: string;
    }) => void;
    ai_video_analysis: (data: {
        videoData: any;
        analysisType: string;
    }) => void;
    coach_message: (data: {
        studentId: string;
        message: string;
    }) => void;
}
export interface ServerToClientEvents {
    authenticated: (data: {
        success: boolean;
        message?: string;
    }) => void;
    authentication_error: (data: {
        error: string;
    }) => void;
    room_joined: (data: {
        roomId: string;
    }) => void;
    room_left: (data: {
        roomId: string;
    }) => void;
    new_message: (data: SocketMessage) => void;
    message_error: (data: {
        error: string;
    }) => void;
    stream_started: (data: {
        roomId: string;
        streamId: string;
    }) => void;
    stream_stopped: (data: {
        roomId: string;
    }) => void;
    stream_data_received: (data: {
        streamId: string;
        data: any;
    }) => void;
    ai_response: (data: {
        message: string;
        analysis?: any;
    }) => void;
    ai_response_start: (data: {
        messageId: string;
        timestamp: Date;
    }) => void;
    ai_response_chunk: (data: {
        messageId: string;
        chunk: string;
        message: string;
    }) => void;
    ai_response_complete: (data: {
        messageId: string;
        message: string;
        timestamp: Date;
    }) => void;
    ai_response_error: (data: {
        messageId: string;
        error: string;
    }) => void;
    ai_analysis_complete: (data: {
        analysis: any;
        type: string;
    }) => void;
    coach_message_received: (data: SocketMessage) => void;
    error: (data: {
        error: string;
    }) => void;
    connection_status: (data: {
        status: string;
        message?: string;
    }) => void;
}
//# sourceMappingURL=socket.types.d.ts.map