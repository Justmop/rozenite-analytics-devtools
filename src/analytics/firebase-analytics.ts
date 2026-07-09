import type { AnalyticsAdapter, FirebaseAnalytics } from "../types";
import { FIREBASE_ADAPTER_ID } from "../constants";

const getFirebaseAnalytics = (): (() => FirebaseAnalytics) | null => {
  try {
    return require("@react-native-firebase/analytics").default;
  } catch {
    return null;
  }
};

export const firebaseAnalyticsAdapter: AnalyticsAdapter = {
  id: FIREBASE_ADAPTER_ID,
  bind(client, sendEvent) {
    const analytics = getFirebaseAnalytics();
    if (!analytics) {
      return;
    }

    const firebaseAnalytics = analytics();
    const originalLogEvent = firebaseAnalytics.logEvent.bind(firebaseAnalytics);

    firebaseAnalytics.logEvent = (eventName, params) => {
      sendEvent(
        client,
        eventName,
        params as Record<string, unknown>,
        FIREBASE_ADAPTER_ID,
      );
      return originalLogEvent(eventName, params);
    };
  },
};
