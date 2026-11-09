"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnalyticsLoggerDevTools = void 0;
exports.default = setupPlugin;
const react_1 = require("react");
const plugin_bridge_1 = require("@rozenite/plugin-bridge");
const analytics_devtools_1 = require("./src/analytics/analytics-devtools");
const constants_1 = require("./src/constants");
function setupPlugin(client) {
    void client;
}
if (constants_1.isNativeDev) {
    exports.useAnalyticsLoggerDevTools = () => {
        const client = (0, plugin_bridge_1.useRozeniteDevToolsClient)({
            pluginId: constants_1.PLUGIN_ID,
        });
        (0, react_1.useEffect)(() => {
            if (!client) {
                return;
            }
            analytics_devtools_1.analyticsDevTools.connect(client);
            return () => analytics_devtools_1.analyticsDevTools.disconnect(client);
        }, [client]);
        return client;
    };
}
else {
    exports.useAnalyticsLoggerDevTools = () => null;
}
