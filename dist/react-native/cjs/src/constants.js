"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNativeDev = exports.isServer = exports.isDev = exports.isWeb = exports.EVENT_SEARCH_DEBOUNCE_MS = exports.EVENT_SEARCH_MIN_LENGTH = exports.ANALYTICS_SOURCES = exports.ADJUST_ADAPTER_ID = exports.CLEVERTAP_ADAPTER_ID = exports.FIREBASE_ADAPTER_ID = exports.ANALYTICS_EVENT = exports.PLUGIN_ID = void 0;
// Must match the npm package name: since Rozenite 2.2 the DevTools shell only
// forwards a message to the panels of the plugin whose id equals its
// `pluginId`, and a plugin's id is its package name.
exports.PLUGIN_ID = "rozenite-analytics-devtools";
exports.ANALYTICS_EVENT = "analytics-event";
exports.FIREBASE_ADAPTER_ID = "firebase";
exports.CLEVERTAP_ADAPTER_ID = "clevertap";
exports.ADJUST_ADAPTER_ID = "adjust";
exports.ANALYTICS_SOURCES = [
    exports.FIREBASE_ADAPTER_ID,
    exports.CLEVERTAP_ADAPTER_ID,
    exports.ADJUST_ADAPTER_ID,
];
exports.EVENT_SEARCH_MIN_LENGTH = 3;
exports.EVENT_SEARCH_DEBOUNCE_MS = 300;
exports.isWeb = typeof window !== "undefined" && window.navigator.product !== "ReactNative";
exports.isDev = process.env.NODE_ENV !== "production";
exports.isServer = typeof window === "undefined";
exports.isNativeDev = exports.isDev && !exports.isWeb && !exports.isServer;
