import { useEffect } from "react";
import {
  RozeniteDevToolsClient,
  useRozeniteDevToolsClient,
} from "@rozenite/plugin-bridge";
import { analyticsDevTools } from "./src/analytics/analytics-devtools";
import type { AnalyticsLoggerEvents } from "./src/types";
import { isNativeDev, PLUGIN_ID } from "./src/constants";

export let useAnalyticsLoggerDevTools: () => RozeniteDevToolsClient<AnalyticsLoggerEvents> | null;

export default function setupPlugin(
  client: RozeniteDevToolsClient<AnalyticsLoggerEvents>,
) {
  void client;
}

if (isNativeDev) {
  useAnalyticsLoggerDevTools = () => {
    const client = useRozeniteDevToolsClient<AnalyticsLoggerEvents>({
      pluginId: PLUGIN_ID,
    });

    useEffect(() => {
      if (!client) {
        return;
      }

      analyticsDevTools.connect(client);

      return () => analyticsDevTools.disconnect(client);
    }, [client]);

    return client;
  };
} else {
  useAnalyticsLoggerDevTools = () => null;
}
