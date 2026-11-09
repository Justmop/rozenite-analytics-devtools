import { RozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import type { AnalyticsLoggerEvents } from "./src/types";
export declare let useAnalyticsLoggerDevTools: () => RozeniteDevToolsClient<AnalyticsLoggerEvents> | null;
export default function setupPlugin(client: RozeniteDevToolsClient<AnalyticsLoggerEvents>): void;
