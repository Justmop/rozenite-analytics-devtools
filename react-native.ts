import {
  RozeniteDevToolsClient,
  useRozeniteDevToolsClient,
} from "@rozenite/plugin-bridge";
import { firebaseAnalyticsAdapter } from "./src/analytics/firebase-analytics";
import { cleverTapAnalyticsAdapter } from "./src/analytics/clevertap-analytics";
import { adjustAnalyticsAdapter } from "./src/analytics/adjust-analytics";
import type { AnalyticsLoggerEvents } from "./src/types";
import type { AnalyticsSource } from "./src/constants";
import { isNativeDev, ANALYTICS_EVENT, PLUGIN_ID } from "./src/constants";

export let useAnalyticsLoggerDevTools: () => RozeniteDevToolsClient<AnalyticsLoggerEvents> | null;

export default function setupPlugin(
  client: RozeniteDevToolsClient<AnalyticsLoggerEvents>,
) {
  void client;
}

const sendAnalyticsEvent = (
  client: RozeniteDevToolsClient<AnalyticsLoggerEvents>,
  eventName: string,
  params: Record<string, unknown> = {},
  source: AnalyticsSource,
) => {
  client.send(ANALYTICS_EVENT, {
    eventName,
    params,
    source,
    timestamp: Date.now(),
  });
};

const analyticsAdapters = [
  firebaseAnalyticsAdapter,
  cleverTapAnalyticsAdapter,
  adjustAnalyticsAdapter,
];

if (isNativeDev) {
  useAnalyticsLoggerDevTools = () => {
    const client = useRozeniteDevToolsClient<AnalyticsLoggerEvents>({
      pluginId: PLUGIN_ID,
    });

    if (!client) {
      return null;
    }

    for (const adapter of analyticsAdapters) {
      adapter.bind(client, sendAnalyticsEvent);
    }

    return client;
  };
} else {
  useAnalyticsLoggerDevTools = () => null;
}
