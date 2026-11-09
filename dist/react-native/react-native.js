import { useEffect } from "react";
import { useRozeniteDevToolsClient, } from "@rozenite/plugin-bridge";
import { analyticsDevTools } from "./src/analytics/analytics-devtools";
import { isNativeDev, PLUGIN_ID } from "./src/constants";
export let useAnalyticsLoggerDevTools;
export default function setupPlugin(client) {
    void client;
}
if (isNativeDev) {
    useAnalyticsLoggerDevTools = () => {
        const client = useRozeniteDevToolsClient({
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
}
else {
    useAnalyticsLoggerDevTools = () => null;
}
