export const PLUGIN_ID = "analytics-logger";

export const ANALYTICS_EVENT = "analytics-event" as const;

export const FIREBASE_ADAPTER_ID = "firebase";
export const CLEVERTAP_ADAPTER_ID = "clevertap";
export const ADJUST_ADAPTER_ID = "adjust";

export const ANALYTICS_SOURCES = [
  FIREBASE_ADAPTER_ID,
  CLEVERTAP_ADAPTER_ID,
  ADJUST_ADAPTER_ID,
] as const;

export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number];

export const EVENT_SEARCH_MIN_LENGTH = 3;
export const EVENT_SEARCH_DEBOUNCE_MS = 300;

export const isWeb =
  typeof window !== "undefined" && window.navigator.product !== "ReactNative";

export const isDev = process.env.NODE_ENV !== "production";

export const isServer = typeof window === "undefined";

export const isNativeDev = isDev && !isWeb && !isServer;
