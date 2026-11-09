import type { AnalyticsLoggerClient } from "../types";
declare class AnalyticsDevTools {
    private client;
    private areAdaptersBound;
    private constructor();
    static getInstance(): AnalyticsDevTools;
    connect(client: AnalyticsLoggerClient): void;
    disconnect(client: AnalyticsLoggerClient): void;
    private sendEvent;
}
export declare const analyticsDevTools: AnalyticsDevTools;
export {};
