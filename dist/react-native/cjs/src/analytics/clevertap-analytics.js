"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleverTapAnalyticsAdapter = void 0;
const constants_1 = require("../constants");
const getCleverTap = () => {
    try {
        const cleverTapModule = require("clevertap-react-native");
        return cleverTapModule?.default ?? cleverTapModule;
    }
    catch {
        return null;
    }
};
exports.cleverTapAnalyticsAdapter = {
    id: constants_1.CLEVERTAP_ADAPTER_ID,
    bind(sendEvent) {
        const cleverTap = getCleverTap();
        if (!cleverTap?.recordEvent) {
            return;
        }
        const originalRecordEvent = cleverTap.recordEvent;
        cleverTap.recordEvent = (eventName, clonedData) => {
            sendEvent(eventName, clonedData ?? {}, constants_1.CLEVERTAP_ADAPTER_ID);
            return originalRecordEvent.call(cleverTap, eventName, clonedData);
        };
    },
};
