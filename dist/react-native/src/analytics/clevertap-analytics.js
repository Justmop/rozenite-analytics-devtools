import { CLEVERTAP_ADAPTER_ID } from "../constants";
const getCleverTap = () => {
    try {
        const cleverTapModule = require("clevertap-react-native");
        return cleverTapModule?.default ?? cleverTapModule;
    }
    catch {
        return null;
    }
};
export const cleverTapAnalyticsAdapter = {
    id: CLEVERTAP_ADAPTER_ID,
    bind(sendEvent) {
        const cleverTap = getCleverTap();
        if (!cleverTap?.recordEvent) {
            return;
        }
        const originalRecordEvent = cleverTap.recordEvent;
        cleverTap.recordEvent = (eventName, clonedData) => {
            sendEvent(eventName, clonedData ?? {}, CLEVERTAP_ADAPTER_ID);
            return originalRecordEvent.call(cleverTap, eventName, clonedData);
        };
    },
};
