import type { AnalyticsEventPayload } from "./types";
import { ANALYTICS_SOURCES, EVENT_SEARCH_MIN_LENGTH } from "./constants";
import type { AnalyticsSource } from "./constants";

export type AnalyticsSortKey = "timestamp" | "eventName" | "source";
export type AnalyticsSortDirection = "asc" | "desc";

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");

  return `${hours}:${minutes}:${seconds}.${ms}`;
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

export const formatValueCompact = (params: Record<string, unknown>) => {
  if (Object.keys(params).length === 0) {
    return "{}";
  }

  try {
    return JSON.stringify(params);
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

export const filterAnalyticsEvents = <T extends AnalyticsEventPayload>(
  events: T[],
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

export const sortAnalyticsEvents = <T extends AnalyticsEventPayload>(
  events: T[],
  sortKey: AnalyticsSortKey | null,
  direction: AnalyticsSortDirection,
) => {
  if (!sortKey) {
    return events;
  }

  const factor = direction === "asc" ? 1 : -1;

  return [...events].sort((left, right) => {
    if (sortKey === "timestamp") {
      return (left.timestamp - right.timestamp) * factor;
    }

    if (sortKey === "source") {
      return (
        (ANALYTICS_SOURCES.indexOf(left.source) -
          ANALYTICS_SOURCES.indexOf(right.source)) *
        factor
      );
    }

    return (
      left.eventName.localeCompare(right.eventName, undefined, {
        sensitivity: "base",
      }) * factor
    );
  });
};

export const selectEventsForExport = (
  events: AnalyticsEventPayload[],
  source: AnalyticsSource | null,
  sortKey: AnalyticsSortKey | null,
  direction: AnalyticsSortDirection,
) => {
  const matching =
    source === null
      ? events
      : events.filter((event) => event.source === source);

  return sortAnalyticsEvents(matching, sortKey, direction).map((event) => ({
    eventName: event.eventName,
    params: event.params,
    source: event.source,
    timestamp: event.timestamp,
  }));
};
