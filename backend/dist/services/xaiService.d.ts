import { XAIChatRequest, XAIChatResponse } from '../types/ai.types';
declare class XAIService {
    private apiKey;
    private apiUrl;
    private axiosInstance;
    constructor();
    chatCompletion(request: XAIChatRequest): Promise<XAIChatResponse>;
    streamChatCompletion(request: XAIChatRequest): AsyncGenerator<string, void, unknown>;
    analyzeVideo(description: string, context: string, aiContext?: any): Promise<string>;
}
export declare const xaiService: XAIService;
export default xaiService;
//# sourceMappingURL=xaiService.d.ts.map