// Must match the npm package name: since Rozenite 2.2 the DevTools shell only
// forwards a message to the panels of the plugin whose id equals its
// `pluginId`, and a plugin's id is its package name.
export const PLUGIN_ID = "rozenite-analytics-devtools";
export const ANALYTICS_EVENT = "analytics-event";
export const FIREBASE_ADAPTER_ID = "firebase";
export const CLEVERTAP_ADAPTER_ID = "clevertap";
export const ADJUST_ADAPTER_ID = "adjust";
export const ANALYTICS_SOURCES = [
    FIREBASE_ADAPTER_ID,
    CLEVERTAP_ADAPTER_ID,
    ADJUST_ADAPTER_ID,
];
export const EVENT_SEARCH_MIN_LENGTH = 3;
export const EVENT_SEARCH_DEBOUNCE_MS = 300;
export const isWeb = typeof window !== "undefined" && window.navigator.product !== "ReactNative";
export const isDev = process.env.NODE_ENV !== "production";
export const isServer = typeof window === "undefined";
export const isNativeDev = isDev && !isWeb && !isServer;
