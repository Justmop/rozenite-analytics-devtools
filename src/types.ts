import type { RozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import { ANALYTICS_EVENT } from "./constants";
import type { AnalyticsSource } from "./constants";

export interface AnalyticsEventPayload {
  eventName: string;
  params: Record<string, unknown>;
  source: AnalyticsSource;
  timestamp: number;
}

export interface AnalyticsLoggerEvents extends Record<string, unknown> {
  [ANALYTICS_EVENT]: AnalyticsEventPayload;
}

export type AnalyticsLoggerClient =
  RozeniteDevToolsClient<AnalyticsLoggerEvents>;

export type SendAnalyticsEvent = (
  eventName: string,
  params: Record<string, unknown> | undefined,
  source: AnalyticsSource,
) => void;

export type AnalyticsAdapter = {
  id: string;
  bind: (sendEvent: SendAnalyticsEvent) => void;
};

export type FirebaseAnalytics = {
  logEvent: (
    eventName: string,
    params?: Record<string, unknown>,
  ) => Promise<void>;
};

export type CleverTap = {
  recordEvent: (
    eventName: string,
    params?: Record<string, unknown>,
  ) => void;
};

export type AdjustEventInstance = {
  eventToken: string;
  callbackParameters?: string[];
  partnerParameters?: string[];
};

export type AdjustSDK = {
  trackEvent: (event: AdjustEventInstance) => void;
};

export type AdjustModule = {
  Adjust: AdjustSDK;
  AdjustEvent: new (eventToken: string) => AdjustEventInstance;
};
