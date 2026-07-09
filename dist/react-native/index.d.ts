import { RozeniteDevToolsClient } from '@rozenite/plugin-bridge';

declare const ANALYTICS_EVENT: "analytics-event";

declare const ANALYTICS_SOURCES: readonly ["firebase", "clevertap", "adjust"];

declare interface AnalyticsEventPayload {
    eventName: string;
    params: Record<string, unknown>;
    source: AnalyticsSource;
    timestamp: number;
}

declare interface AnalyticsLoggerEvents extends Record<string, unknown> {
    [ANALYTICS_EVENT]: AnalyticsEventPayload;
}

declare type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number];

declare function setupPlugin(client: RozeniteDevToolsClient<AnalyticsLoggerEvents>): void;
export default setupPlugin;

export declare let useAnalyticsLoggerDevTools: () => RozeniteDevToolsClient<AnalyticsLoggerEvents> | null;

export { }
