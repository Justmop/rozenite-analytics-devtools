import { FIREBASE_ADAPTER_ID } from "../constants";
const getFirebaseAnalytics = () => {
    try {
        return require("@react-native-firebase/analytics").default;
    }
    catch {
        return null;
    }
};
export const firebaseAnalyticsAdapter = {
    id: FIREBASE_ADAPTER_ID,
    bind(sendEvent) {
        const analytics = getFirebaseAnalytics();
        if (!analytics) {
            return;
        }
        const firebaseAnalytics = analytics();
        const originalLogEvent = firebaseAnalytics.logEvent.bind(firebaseAnalytics);
        firebaseAnalytics.logEvent = (eventName, params) => {
            sendEvent(eventName, params, FIREBASE_ADAPTER_ID);
            return originalLogEvent(eventName, params);
        };
    },
};
