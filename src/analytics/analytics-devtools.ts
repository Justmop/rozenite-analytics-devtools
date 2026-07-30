import { ANALYTICS_EVENT } from "../constants";
import type {
  AnalyticsAdapter,
  AnalyticsLoggerClient,
  SendAnalyticsEvent,
} from "../types";
import { firebaseAnalyticsAdapter } from "./firebase-analytics";
import { cleverTapAnalyticsAdapter } from "./clevertap-analytics";
import { adjustAnalyticsAdapter } from "./adjust-analytics";

const analyticsAdapters: AnalyticsAdapter[] = [
  firebaseAnalyticsAdapter,
  cleverTapAnalyticsAdapter,
  adjustAnalyticsAdapter,
];

// Symbol.for + globalThis keeps a single instance alive across Fast Refresh
// cycles and across duplicated copies of this module in the bundle. Without it
// a refreshed module would create a second instance and wrap the already
// wrapped analytics SDK methods again, duplicating every event.
const INSTANCE_KEY = Symbol.for("rozenite-analytics-logger.devtools");

type GlobalScope = typeof globalThis & {
  [INSTANCE_KEY]?: AnalyticsDevTools;
};

class AnalyticsDevTools {
  private client: AnalyticsLoggerClient | null = null;
  private areAdaptersBound = false;

  private constructor() {}

  static getInstance(): AnalyticsDevTools {
    const globalScope = globalThis as GlobalScope;
    const instance = globalScope[INSTANCE_KEY] ?? new AnalyticsDevTools();

    globalScope[INSTANCE_KEY] = instance;

    return instance;
  }

  connect(client: AnalyticsLoggerClient) {
    this.client = client;

    if (this.areAdaptersBound) {
      return;
    }

    this.areAdaptersBound = true;

    for (const adapter of analyticsAdapters) {
      adapter.bind(this.sendEvent);
    }
  }

  disconnect(client: AnalyticsLoggerClient) {
    if (this.client === client) {
      this.client = null;
    }
  }

  // Adapters keep this reference forever, so it reads the client lazily
  // instead of capturing the one that was active at bind time.
  private sendEvent: SendAnalyticsEvent = (eventName, params, source) => {
    this.client?.send(ANALYTICS_EVENT, {
      eventName,
      params: params ?? {},
      source,
      timestamp: Date.now(),
    });
  };
}

export const analyticsDevTools = AnalyticsDevTools.getInstance();
