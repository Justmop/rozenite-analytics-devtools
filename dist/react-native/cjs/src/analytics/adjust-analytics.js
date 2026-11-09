"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustAnalyticsAdapter = void 0;
const constants_1 = require("../constants");
const getAdjustModule = () => {
    try {
        return require("react-native-adjust");
    }
    catch {
        return null;
    }
};
const parseParameterArray = (parameters = []) => {
    const result = {};
    for (let index = 0; index < parameters.length; index += 2) {
        const key = parameters[index];
        const value = parameters[index + 1];
        if (key != null) {
            result[key] = value;
        }
    }
    return result;
};
const getAdjustEventPayload = (adjustEvent) => {
    const callbackParameters = parseParameterArray(adjustEvent.callbackParameters);
    const partnerParameters = parseParameterArray(adjustEvent.partnerParameters);
    return {
        eventName: adjustEvent.eventToken,
        params: {
            eventToken: adjustEvent.eventToken,
            ...callbackParameters,
            partnerParameters,
        },
    };
};
exports.adjustAnalyticsAdapter = {
    id: constants_1.ADJUST_ADAPTER_ID,
    bind(sendEvent) {
        const adjustModule = getAdjustModule();
        if (!adjustModule) {
            return;
        }
        const { Adjust } = adjustModule;
        const originalTrackEvent = Adjust.trackEvent.bind(Adjust);
        Adjust.trackEvent = (adjustEvent) => {
            const { eventName, params } = getAdjustEventPayload(adjustEvent);
            sendEvent(eventName, params, constants_1.ADJUST_ADAPTER_ID);
            return originalTrackEvent(adjustEvent);
        };
    },
};
