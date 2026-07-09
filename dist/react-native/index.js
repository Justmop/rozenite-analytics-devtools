import { useRozeniteDevToolsClient as A } from "@rozenite/plugin-bridge";
const p = "analytics-logger", f = "analytics-event", a = "firebase", i = "clevertap", l = "adjust", y = typeof window < "u" && window.navigator.product !== "ReactNative", E = process.env.NODE_ENV !== "production", g = typeof window > "u", T = E && !y && !g, b = () => {
  try {
    return require("@react-native-firebase/analytics").default;
  } catch {
    return null;
  }
}, D = {
  id: a,
  bind(e, n) {
    const t = b();
    if (!t)
      return;
    const r = t(), o = r.logEvent.bind(r);
    r.logEvent = (c, s) => (n(
      e,
      c,
      s,
      a
    ), o(c, s));
  }
}, P = () => {
  try {
    const e = require("clevertap-react-native");
    return e?.default ?? e;
  } catch {
    return null;
  }
}, k = {
  id: i,
  bind(e, n) {
    const t = P();
    if (!t?.recordEvent)
      return;
    const r = t.recordEvent;
    t.recordEvent = (o, c) => (n(e, o, c ?? {}, i), r.call(t, o, c));
  }
}, _ = () => {
  try {
    return require("react-native-adjust");
  } catch {
    return null;
  }
}, u = (e = []) => {
  const n = {};
  for (let t = 0; t < e.length; t += 2) {
    const r = e[t], o = e[t + 1];
    r != null && (n[r] = o);
  }
  return n;
}, m = (e) => {
  const n = u(e.callbackParameters), t = u(e.partnerParameters);
  return {
    eventName: e.eventToken,
    params: {
      eventToken: e.eventToken,
      ...n,
      partnerParameters: t
    }
  };
}, I = {
  id: l,
  bind(e, n) {
    const t = _();
    if (!t)
      return;
    const { Adjust: r } = t, o = r.trackEvent.bind(r);
    r.trackEvent = (c) => {
      const { eventName: s, params: v } = m(c);
      return n(e, s, v, l), o(c);
    };
  }
};
let d;
function L(e) {
}
const R = (e, n, t = {}, r) => {
  e.send(f, {
    eventName: n,
    params: t,
    source: r,
    timestamp: Date.now()
  });
}, w = [
  D,
  k,
  I
];
T ? d = () => {
  const e = A({
    pluginId: p
  });
  if (!e)
    return null;
  for (const n of w)
    n.bind(e, R);
  return e;
} : d = () => null;
export {
  L as default,
  d as useAnalyticsLoggerDevTools
};
