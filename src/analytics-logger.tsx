import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import type { AnalyticsEventPayload, AnalyticsLoggerEvents } from "./types";
import {
  ANALYTICS_EVENT,
  ANALYTICS_SOURCES,
  EVENT_SEARCH_DEBOUNCE_MS,
  EVENT_SEARCH_MIN_LENGTH,
  PLUGIN_ID,
} from "./constants";
import type { AnalyticsSource } from "./constants";
import {
  filterAnalyticsEvents,
  formatSourceLabel,
  formatTimestamp,
  formatValue,
  formatValueCompact,
  selectEventsForExport,
  sortAnalyticsEvents,
} from "./helper";
import type { AnalyticsSortDirection, AnalyticsSortKey } from "./helper";

type LoggedAnalyticsEvent = AnalyticsEventPayload & { id: number };
type ColumnKey = "time" | "eventName" | "source" | "value";

const MIN_COLUMN_WIDTHS: Record<ColumnKey, number> = {
  time: 128,
  eventName: 140,
  source: 120,
  value: 160,
};

const MAX_COLUMN_WIDTH = 2400;

const DEFAULT_COLUMN_WIDTHS: Record<ColumnKey, number> = {
  time: 140,
  eventName: 280,
  source: 120,
  value: 360,
};

const clampColumnWidth = (key: ColumnKey, width: number) =>
  Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTHS[key], Math.round(width)));

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

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
  const [events, setEvents] = useState<LoggedAnalyticsEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [enabledSources, setEnabledSources] = useState<Set<string>>(
    () => new Set(ANALYTICS_SOURCES),
  );
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<AnalyticsSortKey | null>(null);
  const [sortDirection, setSortDirection] =
    useState<AnalyticsSortDirection>("asc");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [columnWidths, setColumnWidths] = useState(DEFAULT_COLUMN_WIDTHS);
  const nextEventId = useRef(1);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const resizeCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!client) return;

    const subscription = client.onMessage(ANALYTICS_EVENT, (data) => {
      const id = nextEventId.current;
      nextEventId.current += 1;
      setEvents((prev) => [{ ...data, id }, ...prev]);
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

  const sortedEvents = useMemo(
    () => sortAnalyticsEvents(filteredEvents, sortKey, sortDirection),
    [filteredEvents, sortKey, sortDirection],
  );

  const sourceCounts = useMemo(() => {
    const counts = new Map<AnalyticsSource, number>();

    for (const source of ANALYTICS_SOURCES) {
      counts.set(source, 0);
    }

    for (const event of events) {
      counts.set(event.source, (counts.get(event.source) ?? 0) + 1);
    }

    return counts;
  }, [events]);

  const selectedEvent = useMemo(
    () => sortedEvents.find((event) => event.id === selectedEventId) ?? null,
    [sortedEvents, selectedEventId],
  );

  const isTableVisible = Boolean(client) && sortedEvents.length > 0;

  useEffect(() => {
    if (
      selectedEventId !== null &&
      !filteredEvents.some((event) => event.id === selectedEventId)
    ) {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  useEffect(() => {
    if (!isExportMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExportMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isExportMenuOpen]);

  useEffect(() => {
    return () => resizeCleanup.current?.();
  }, []);

  useEffect(() => {
    const wrapper = tableWrapperRef.current;

    if (!isTableVisible || !wrapper) return;

    const fitValueColumn = () => {
      const available = wrapper.clientWidth;

      if (available < 200) return;

      setColumnWidths((prev) => {
        const nextValue = Math.max(
          MIN_COLUMN_WIDTHS.value,
          available - prev.time - prev.eventName - prev.source - 1,
        );

        if (Math.abs(nextValue - prev.value) < 2) return prev;

        return { ...prev, value: nextValue };
      });
    };

    fitValueColumn();
    const observer = new ResizeObserver(fitValueColumn);
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, [isTableVisible]);

  const toggleSort = (key: AnalyticsSortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  };

  const beginResize = (
    key: Exclude<ColumnKey, "value">,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    resizeCleanup.current?.();

    const startX = event.clientX;
    const startWidths = columnWidths;

    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;

      setColumnWidths(() => {
        const next = { ...startWidths };
        const resized = clampColumnWidth(key, startWidths[key] + delta);
        const applied = resized - startWidths[key];
        const valueAfter = startWidths.value - applied;

        if (applied > 0 && valueAfter < MIN_COLUMN_WIDTHS.value) {
          next[key] = resized;
          next.value = MIN_COLUMN_WIDTHS.value;
          return next;
        }

        next[key] = resized;
        next.value = Math.max(MIN_COLUMN_WIDTHS.value, Math.round(valueAfter));
        return next;
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      resizeCleanup.current = null;
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    resizeCleanup.current = onUp;
  };

  const exportEvents = (source: AnalyticsSource | null) => {
    const payload = selectEventsForExport(
      events,
      source,
      sortKey,
      sortDirection,
    );
    const filename = source
      ? `analytics-events-${source}.json`
      : "analytics-events.json";

    downloadJson(filename, payload);
    setIsExportMenuOpen(false);
  };

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
          <div style={styles.headerActions}>
            <div ref={exportMenuRef} style={styles.exportMenuAnchor}>
              <button
                type="button"
                style={{
                  ...styles.clearButton,
                  ...(isExportMenuOpen ? styles.exportButtonOpen : {}),
                }}
                aria-haspopup="menu"
                aria-expanded={isExportMenuOpen}
                onClick={() => setIsExportMenuOpen((open) => !open)}
              >
                Export
              </button>
              {isExportMenuOpen && (
                <div role="menu" style={styles.exportMenu}>
                  <ExportMenuItem
                    label="All events"
                    count={events.length}
                    onClick={() => exportEvents(null)}
                  />
                  {ANALYTICS_SOURCES.map((source) => (
                    <ExportMenuItem
                      key={source}
                      label={formatSourceLabel(source)}
                      count={sourceCounts.get(source) ?? 0}
                      onClick={() => exportEvents(source)}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              style={styles.clearButton}
              onClick={() => {
                setEvents([]);
                setSelectedEventId(null);
                setIsExportMenuOpen(false);
              }}
            >
              Clear
            </button>
          </div>
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
          <div ref={tableWrapperRef} style={styles.tableWrapper}>
            <table
              style={{
                ...styles.table,
                width:
                  columnWidths.time +
                  columnWidths.eventName +
                  columnWidths.source +
                  columnWidths.value,
              }}
            >
              <colgroup>
                <col style={{ width: columnWidths.time }} />
                <col style={{ width: columnWidths.eventName }} />
                <col style={{ width: columnWidths.source }} />
                <col style={{ width: columnWidths.value }} />
              </colgroup>
              <thead>
                <tr>
                  <th
                    style={styles.th}
                    aria-sort={ariaSort("timestamp", sortKey, sortDirection)}
                  >
                    <ColumnHeader
                      label="Time"
                      isActive={sortKey === "timestamp"}
                      direction={sortDirection}
                      onSort={() => toggleSort("timestamp")}
                      onResizeStart={(event) => beginResize("time", event)}
                    />
                  </th>
                  <th
                    style={styles.th}
                    aria-sort={ariaSort("eventName", sortKey, sortDirection)}
                  >
                    <ColumnHeader
                      label="Event Name"
                      isActive={sortKey === "eventName"}
                      direction={sortDirection}
                      onSort={() => toggleSort("eventName")}
                      onResizeStart={(event) => beginResize("eventName", event)}
                    />
                  </th>
                  <th
                    style={styles.th}
                    aria-sort={ariaSort("source", sortKey, sortDirection)}
                  >
                    <ColumnHeader
                      label="Source"
                      isActive={sortKey === "source"}
                      direction={sortDirection}
                      onSort={() => toggleSort("source")}
                      onResizeStart={(event) => beginResize("source", event)}
                    />
                  </th>
                  <th style={styles.th}>Value</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((event) => {
                  const isSelected = selectedEventId === event.id;
                  const isHovered = hoveredEventId === event.id;

                  return (
                    <tr
                      key={event.id}
                      style={{
                        ...styles.row,
                        ...(isSelected ? styles.rowSelected : {}),
                        ...(isHovered && !isSelected ? styles.rowHover : {}),
                      }}
                      onClick={() => setSelectedEventId(event.id)}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
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
                  onClick={() => setSelectedEventId(null)}
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

function ariaSort(
  key: AnalyticsSortKey,
  activeKey: AnalyticsSortKey | null,
  direction: AnalyticsSortDirection,
): "ascending" | "descending" | "none" {
  if (activeKey !== key) return "none";
  return direction === "asc" ? "ascending" : "descending";
}

function ColumnHeader({
  label,
  isActive,
  direction,
  onSort,
  onResizeStart,
}: {
  label: string;
  isActive: boolean;
  direction: AnalyticsSortDirection;
  onSort?: () => void;
  onResizeStart: (event: React.MouseEvent<HTMLSpanElement>) => void;
}) {
  return (
    <div style={styles.headerCell}>
      {onSort ? (
        <button type="button" style={styles.sortButton} onClick={onSort}>
          {label}
          {isActive && (
            <span style={styles.sortIndicator}>
              {direction === "asc" ? "↑" : "↓"}
            </span>
          )}
        </button>
      ) : (
        <span>{label}</span>
      )}
      <span
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${label} column`}
        style={styles.resizeHandle}
        onMouseDown={onResizeStart}
      >
        <span style={styles.resizeHandleLine} />
      </span>
    </div>
  );
}

function ExportMenuItem({
  label,
  count,
  onClick,
}: {
  label: string;
  count: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const disabled = count === 0;

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.exportMenuItem,
        ...(disabled ? styles.exportMenuItemDisabled : {}),
        ...(hovered && !disabled ? styles.exportMenuItemHover : {}),
      }}
    >
      <span>{label}</span>
      <span style={styles.exportMenuCount}>{count}</span>
    </button>
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
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  exportMenuAnchor: {
    position: "relative",
  },
  exportButtonOpen: {
    background: "#3f3f46",
  },
  exportMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    zIndex: 5,
    minWidth: "190px",
    padding: "4px",
    borderRadius: "8px",
    border: "1px solid #3f3f46",
    background: "#27272a",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
    display: "flex",
    flexDirection: "column",
  },
  exportMenuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#e4e4e7",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
  },
  exportMenuItemHover: {
    background: "#3f3f46",
  },
  exportMenuItemDisabled: {
    color: "#71717a",
    cursor: "default",
  },
  exportMenuCount: {
    color: "#a1a1aa",
    fontVariantNumeric: "tabular-nums",
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
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  th: {
    textAlign: "left",
    padding: "10px 0 10px 12px",
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
  headerCell: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    paddingRight: "8px",
  },
  sortButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    margin: 0,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    letterSpacing: "inherit",
    textTransform: "inherit",
    cursor: "pointer",
    textAlign: "left",
  },
  sortIndicator: {
    color: "#e4e4e7",
    fontSize: "11px",
  },
  resizeHandle: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "8px",
    cursor: "col-resize",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  resizeHandleLine: {
    width: "2px",
    height: "16px",
    borderRadius: "1px",
    background: "#52525b",
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
    overflow: "hidden",
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
