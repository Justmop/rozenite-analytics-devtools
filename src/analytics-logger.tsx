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
  formatValueCompact,
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

const getEventKey = (event: AnalyticsEventPayload, index: number) =>
  `${event.timestamp}-${event.source}-${index}`;

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
  const [selectedEventKey, setSelectedEventKey] = useState<string | null>(null);
  const [hoveredEventKey, setHoveredEventKey] = useState<string | null>(null);

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

  const selectedEvent = useMemo(() => {
    if (!selectedEventKey) return null;

    const index = filteredEvents.findIndex(
      (event, eventIndex) =>
        getEventKey(event, eventIndex) === selectedEventKey,
    );

    if (index === -1) return null;

    return filteredEvents[index];
  }, [filteredEvents, selectedEventKey]);

  useEffect(() => {
    if (
      selectedEventKey &&
      !filteredEvents.some(
        (event, index) => getEventKey(event, index) === selectedEventKey,
      )
    ) {
      setSelectedEventKey(null);
    }
  }, [filteredEvents, selectedEventKey]);

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
            onClick={() => {
              setEvents([]);
              setSelectedEventKey(null);
            }}
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
        <div style={styles.contentArea}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "120px" }}>Time</th>
                  <th style={{ ...styles.th, width: "28%" }}>Event Name</th>
                  <th style={{ ...styles.th, width: "110px" }}>Source</th>
                  <th style={styles.th}>Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, index) => {
                  const eventKey = getEventKey(event, index);
                  const isSelected = selectedEventKey === eventKey;
                  const isHovered = hoveredEventKey === eventKey;

                  return (
                    <tr
                      key={eventKey}
                      style={{
                        ...styles.row,
                        ...(isSelected ? styles.rowSelected : {}),
                        ...(isHovered && !isSelected ? styles.rowHover : {}),
                      }}
                      onClick={() => setSelectedEventKey(eventKey)}
                      onMouseEnter={() => setHoveredEventKey(eventKey)}
                      onMouseLeave={() => setHoveredEventKey(null)}
                    >
                      <td style={{ ...styles.td, ...styles.time }}>
                        {event.timestamp
                          ? formatTimestamp(event.timestamp)
                          : "N/A"}
                      </td>
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
                        <span style={styles.valueCompact}>
                          {formatValueCompact(event.params ?? {})}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedEvent && (
            <aside style={styles.detailPanel}>
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>Event Details</h3>
                <button
                  type="button"
                  style={styles.closeButton}
                  onClick={() => setSelectedEventKey(null)}
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>

              <div style={styles.detailBody}>
                <DetailField
                  label="Event Name"
                  value={selectedEvent.eventName ?? "N/A"}
                />
                <DetailField
                  label="Source"
                  value={formatSourceLabel(selectedEvent.source)}
                />
                <DetailField
                  label="Time"
                  value={
                    selectedEvent.timestamp
                      ? formatTimestamp(selectedEvent.timestamp)
                      : "N/A"
                  }
                  mono
                />
                <DetailField
                  label="Value"
                  value={formatValue(selectedEvent.params ?? {})}
                  mono
                  pre
                />
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  value,
  mono = false,
  pre = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  pre?: boolean;
}) {
  return (
    <div style={styles.detailField}>
      <span style={styles.detailLabel}>{label}</span>
      {pre ? (
        <pre style={styles.detailValuePre}>{value}</pre>
      ) : (
        <span
          style={{
            ...styles.detailValue,
            ...(mono ? styles.detailValueMono : {}),
          }}
        >
          {value}
        </span>
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
  contentArea: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    gap: "12px",
    overflow: "hidden",
  },
  tableWrapper: {
    flex: 1,
    minWidth: 0,
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
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  rowHover: {
    background: "#27272a",
  },
  rowSelected: {
    background: "#3f3f46",
  },
  td: {
    padding: "12px",
    verticalAlign: "middle",
    fontSize: "13px",
  },
  eventName: {
    display: "inline-block",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    color: "#93c5fd",
    wordBreak: "break-word",
  },
  valueCompact: {
    display: "block",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12px",
    color: "#d4d4d8",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  time: {
    color: "#71717a",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  detailPanel: {
    width: "360px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    border: "1px solid #3f3f46",
    borderRadius: "8px",
    background: "#27272a",
    overflow: "hidden",
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: "1px solid #3f3f46",
    flexShrink: 0,
  },
  detailTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#e4e4e7",
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    border: "none",
    borderRadius: "6px",
    background: "transparent",
    color: "#a1a1aa",
    fontSize: "20px",
    lineHeight: 1,
    cursor: "pointer",
    padding: 0,
  },
  detailBody: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  detailField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  detailLabel: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#71717a",
  },
  detailValue: {
    fontSize: "13px",
    color: "#e4e4e7",
    wordBreak: "break-word",
  },
  detailValueMono: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    color: "#93c5fd",
  },
  detailValuePre: {
    margin: 0,
    padding: "10px 12px",
    borderRadius: "6px",
    background: "#18181b",
    border: "1px solid #3f3f46",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#d4d4d8",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflow: "auto",
  },
};
