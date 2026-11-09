"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAnalyticsAdapter = void 0;
const constants_1 = require("../constants");
const getFirebaseAnalytics = () => {
    try {
        return require("@react-native-firebase/analytics").default;
    }
    catch {
        return null;
    }
};
exports.firebaseAnalyticsAdapter = {
    id: constants_1.FIREBASE_ADAPTER_ID,
    bind(sendEvent) {
        const analytics = getFirebaseAnalytics();
        if (!analytics) {
            return;
        }
        const firebaseAnalytics = analytics();
        const originalLogEvent = firebaseAnalytics.logEvent.bind(firebaseAnalytics);
        firebaseAnalytics.logEvent = (eventName, params) => {
            sendEvent(eventName, params, constants_1.FIREBASE_ADAPTER_ID);
            return originalLogEvent(eventName, params);
        };
    },
};
