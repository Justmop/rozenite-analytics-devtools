import type { AnalyticsEventPayload } from "./types";
import { EVENT_SEARCH_MIN_LENGTH } from "./constants";

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const ms = String(date.getMilliseconds()).padStart(3, "0");

  return `${time}.${ms}`;
};

export const formatValue = (params: Record<string, unknown>) => {
  if (Object.keys(params).length === 0) {
    return "{}";
  }

  try {
    return JSON.stringify(params, null, 2);
  } catch {
    return String(params);
  }
};

export const formatSourceLabel = (source: string) => {
  switch (source) {
    case "firebase":
      return "Firebase";
    case "clevertap":
      return "CleverTap";
    case "adjust":
      return "Adjust";
    default:
      return source;
  }
};

export const filterAnalyticsEvents = (
  events: AnalyticsEventPayload[],
  enabledSources: Set<string>,
  searchQuery: string,
) => {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const shouldFilterByName =
    normalizedSearch.length >= EVENT_SEARCH_MIN_LENGTH;

  return events.filter((event) => {
    if (!enabledSources.has(event.source)) {
      return false;
    }

    if (!shouldFilterByName) {
      return true;
    }

    return event.eventName.toLowerCase().includes(normalizedSearch);
  });
};
