import type { AdjustEventInstance, AdjustModule, AnalyticsAdapter } from "../types";
import { ADJUST_ADAPTER_ID } from "../constants";

const getAdjustModule = (): AdjustModule | null => {
  try {
    return require("react-native-adjust");
  } catch {
    return null;
  }
};

const parseParameterArray = (parameters: string[] = []) => {
  const result: Record<string, string> = {};

  for (let index = 0; index < parameters.length; index += 2) {
    const key = parameters[index];
    const value = parameters[index + 1];

    if (key != null) {
      result[key] = value;
    }
  }

  return result;
};

const getAdjustEventPayload = (adjustEvent: AdjustEventInstance) => {
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

export const adjustAnalyticsAdapter: AnalyticsAdapter = {
  id: ADJUST_ADAPTER_ID,
  bind(sendEvent) {
    const adjustModule = getAdjustModule();
    if (!adjustModule) {
      return;
    }

    const { Adjust } = adjustModule;
    const originalTrackEvent = Adjust.trackEvent.bind(Adjust);

    Adjust.trackEvent = (adjustEvent) => {
      const { eventName, params } = getAdjustEventPayload(adjustEvent);

      sendEvent(eventName, params, ADJUST_ADAPTER_ID);
      return originalTrackEvent(adjustEvent);
    };
  },
};
