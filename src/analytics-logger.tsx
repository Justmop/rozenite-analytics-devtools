import React, { useEffect, useMemo, useState } from "react";
import { useRozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import type { AnalyticsEventPayload, AnalyticsLoggerEvents } from "./types";
import {
  ANALYTICS_EVENT,
  ANALYTICS_SOURCES,
  EVENT_SEARCH_DEBOUNCE_MS,
  EVENT_SEARCH_MIN_LENGTH,
  PLUGIN_ID,
} from "./constants";
import {
  filterAnalyticsEvents,
  formatSourceLabel,
  formatTimestamp,
  formatValue,
} from "./helper";

const SOURCE_BADGE_STYLES: Record<string, React.CSSProperties> = {
  firebase: {
    background: "#422006",
    color: "#fdba74",
    border: "1px solid #9a3412",
  },
  clevertap: {
    background: "#2e1065",
    color: "#c4b5fd",
    border: "1px solid #6d28d9",
  },
  adjust: {
    background: "#052e16",
    color: "#86efac",
    border: "1px solid #166534",
  },
};

export default function AnalyticsLoggerPanel() {
  const client = useRozeniteDevToolsClient<AnalyticsLoggerEvents>({
    pluginId: PLUGIN_ID,
  });
  const [events, setEvents] = useState<AnalyticsEventPayload[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [enabledSources, setEnabledSources] = useState<Set<string>>(
    () => new Set(ANALYTICS_SOURCES),
  );

  useEffect(() => {
    if (!client) return;

    const subscription = client.onMessage(ANALYTICS_EVENT, (data) => {
      setEvents((prev) => [data, ...prev]);
    });

    return () => subscription.remove();
  }, [client]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, EVENT_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredEvents = useMemo(
    () => filterAnalyticsEvents(events, enabledSources, debouncedSearch),
    [events, enabledSources, debouncedSearch],
  );

  const toggleSource = (source: string) => {
    setEnabledSources((prev) => {
      const next = new Set(prev);

      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }

      return next;
    });
  };

  if (!client) {
    return (
      <div style={styles.container}>
        <p style={styles.muted}>Connecting to React Native...</p>
      </div>
    );
  }

  const hasActiveFilters =
    enabledSources.size < ANALYTICS_SOURCES.length ||
    debouncedSearch.trim().length >= EVENT_SEARCH_MIN_LENGTH;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Analytics Logger</h2>
          <p style={styles.subtitle}>
            {hasActiveFilters
              ? `Showing ${filteredEvents.length} of ${events.length} event${events.length === 1 ? "" : "s"}`
              : `${events.length} event${events.length === 1 ? "" : "s"} logged`}
          </p>
        </div>
        {events.length > 0 && (
          <button
            type="button"
            style={styles.clearButton}
            onClick={() => setEvents([])}
          >
            Clear
          </button>
        )}
      </div>

      <div style={styles.filters}>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={`Search event name (min ${EVENT_SEARCH_MIN_LENGTH} chars)`}
          style={styles.searchInput}
        />

        <div style={styles.sourceFilters}>
          {ANALYTICS_SOURCES.map((source) => (
            <label key={source} style={styles.sourceFilter}>
              <input
                type="checkbox"
                checked={enabledSources.has(source)}
                onChange={() => toggleSource(source)}
              />
              <span
                style={{
                  ...styles.sourceBadge,
                  ...SOURCE_BADGE_STYLES[source],
                }}
              >
                {formatSourceLabel(source)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.muted}>Waiting for analytics events...</p>
          <p style={styles.hint}>
            Events from Firebase, CleverTap and Adjust will appear here
            automatically.
          </p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.muted}>No events match the current filters.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "22%" }}>Event Name</th>
                <th style={{ ...styles.th, width: "110px" }}>Source</th>
                <th style={styles.th}>Value</th>
                <th style={{ ...styles.th, width: "96px" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => (
                <tr key={`${event.timestamp}-${event.source}-${index}`} style={styles.row}>
                  <td style={styles.td}>
                    <span style={styles.eventName}>
                      {event.eventName ?? "N/A"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.sourceBadge,
                        ...SOURCE_BADGE_STYLES[event.source],
                      }}
                    >
                      {formatSourceLabel(event.source)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <pre style={styles.value}>
                      {formatValue(event.params ?? {})}
                    </pre>
                  </td>
                  <td style={{ ...styles.td, ...styles.time }}>
                    {event.timestamp
                      ? formatTimestamp(event.timestamp)
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#e4e4e7",
    background: "#18181b",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "12px",
    gap: "12px",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#a1a1aa",
  },
  clearButton: {
    border: "1px solid #3f3f46",
    background: "#27272a",
    color: "#e4e4e7",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "13px",
    cursor: "pointer",
    flexShrink: 0,
  },
  filters: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "12px",
    flexShrink: 0,
  },
  searchInput: {
    width: "100%",
    border: "1px solid #3f3f46",
    background: "#27272a",
    color: "#e4e4e7",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  sourceFilters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  sourceFilter: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  sourceBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  emptyState: {
    border: "1px dashed #3f3f46",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    flexShrink: 0,
  },
  muted: {
    margin: 0,
    color: "#a1a1aa",
  },
  hint: {
    margin: "8px 0 0",
    fontSize: "13px",
    color: "#71717a",
  },
  tableWrapper: {
    flex: 1,
    minHeight: 0,
    border: "1px solid #3f3f46",
    borderRadius: "8px",
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#a1a1aa",
    background: "#27272a",
    borderBottom: "1px solid #3f3f46",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  row: {
    borderBottom: "1px solid #27272a",
  },
  td: {
    padding: "12px",
    verticalAlign: "top",
    fontSize: "13px",
  },
  eventName: {
    display: "inline-block",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    color: "#93c5fd",
    wordBreak: "break-word",
  },
  value: {
    margin: 0,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#d4d4d8",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: "240px",
    overflow: "auto",
  },
  time: {
    color: "#71717a",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
};
