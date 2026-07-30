import { useEffect as p } from "react";
import { useRozeniteDevToolsClient as g } from "@rozenite/plugin-bridge";
const E = "analytics-logger", y = "analytics-event", i = "firebase", a = "clevertap", l = "adjust", T = typeof window < "u" && window.navigator.product !== "ReactNative", b = process.env.NODE_ENV !== "production", h = typeof window > "u", D = b && !T && !h, m = () => {
  try {
    return require("@react-native-firebase/analytics").default;
  } catch {
    return null;
  }
}, P = {
  id: i,
  bind(t) {
    const e = m();
    if (!e)
      return;
    const n = e(), r = n.logEvent.bind(n);
    n.logEvent = (s, o) => (t(
      s,
      o,
      i
    ), r(s, o));
  }
}, I = () => {
  try {
    const t = require("clevertap-react-native");
    return t?.default ?? t;
  } catch {
    return null;
  }
}, k = {
  id: a,
  bind(t) {
    const e = I();
    if (!e?.recordEvent)
      return;
    const n = e.recordEvent;
    e.recordEvent = (r, s) => (t(r, s ?? {}, a), n.call(e, r, s));
  }
}, N = () => {
  try {
    return require("react-native-adjust");
  } catch {
    return null;
  }
}, u = (t = []) => {
  const e = {};
  for (let n = 0; n < t.length; n += 2) {
    const r = t[n], s = t[n + 1];
    r != null && (e[r] = s);
  }
  return e;
}, _ = (t) => {
  const e = u(t.callbackParameters), n = u(t.partnerParameters);
  return {
    eventName: t.eventToken,
    params: {
      eventToken: t.eventToken,
      ...e,
      partnerParameters: n
    }
  };
}, w = {
  id: l,
  bind(t) {
    const e = N();
    if (!e)
      return;
    const { Adjust: n } = e, r = n.trackEvent.bind(n);
    n.trackEvent = (s) => {
      const { eventName: o, params: f } = _(s);
      return t(o, f, l), r(s);
    };
  }
}, R = [
  P,
  k,
  w
], d = /* @__PURE__ */ Symbol.for("rozenite-analytics-logger.devtools");
class c {
  constructor() {
    this.client = null, this.areAdaptersBound = !1, this.sendEvent = (e, n, r) => {
      this.client?.send(y, {
        eventName: e,
        params: n ?? {},
        source: r,
        timestamp: Date.now()
      });
    };
  }
  static getInstance() {
    const e = globalThis, n = e[d] ?? new c();
    return e[d] = n, n;
  }
  connect(e) {
    if (this.client = e, !this.areAdaptersBound) {
      this.areAdaptersBound = !0;
      for (const n of R)
        n.bind(this.sendEvent);
    }
  }
  disconnect(e) {
    this.client === e && (this.client = null);
  }
}
const v = c.getInstance();
let A;
function L(t) {
}
D ? A = () => {
  const t = g({
    pluginId: E
  });
  return p(() => {
    if (t)
      return v.connect(t), () => v.disconnect(t);
  }, [t]), t;
} : A = () => null;
export {
  L as default,
  A as useAnalyticsLoggerDevTools
};
