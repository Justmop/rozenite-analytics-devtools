"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsDevTools = void 0;
const constants_1 = require("../constants");
const firebase_analytics_1 = require("./firebase-analytics");
const clevertap_analytics_1 = require("./clevertap-analytics");
const adjust_analytics_1 = require("./adjust-analytics");
const analyticsAdapters = [
    firebase_analytics_1.firebaseAnalyticsAdapter,
    clevertap_analytics_1.cleverTapAnalyticsAdapter,
    adjust_analytics_1.adjustAnalyticsAdapter,
];
// Symbol.for + globalThis keeps a single instance alive across Fast Refresh
// cycles and across duplicated copies of this module in the bundle. Without it
// a refreshed module would create a second instance and wrap the already
// wrapped analytics SDK methods again, duplicating every event.
const INSTANCE_KEY = Symbol.for("rozenite-analytics-logger.devtools");
class AnalyticsDevTools {
    constructor() {
        this.client = null;
        this.areAdaptersBound = false;
        // Adapters keep this reference forever, so it reads the client lazily
        // instead of capturing the one that was active at bind time.
        this.sendEvent = (eventName, params, source) => {
            this.client?.send(constants_1.ANALYTICS_EVENT, {
                eventName,
                params: params ?? {},
                source,
                timestamp: Date.now(),
            });
        };
    }
    static getInstance() {
        const globalScope = globalThis;
        const instance = globalScope[INSTANCE_KEY] ?? new AnalyticsDevTools();
        globalScope[INSTANCE_KEY] = instance;
        return instance;
    }
    connect(client) {
        this.client = client;
        if (this.areAdaptersBound) {
            return;
        }
        this.areAdaptersBound = true;
        for (const adapter of analyticsAdapters) {
            adapter.bind(this.sendEvent);
        }
    }
    disconnect(client) {
        if (this.client === client) {
            this.client = null;
        }
    }
}
exports.analyticsDevTools = AnalyticsDevTools.getInstance();
