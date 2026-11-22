// ドラッグ／フリック／タップの判定
// decideSwipe は純粋な関数（Node.js でテストできる）。attachGesture は Pointer Events でブラウザの入力を拾う。

(function (root) {
  "use strict";

  var DEFAULTS = {
    distance: 80,     // これ以上動かせば、速さに関係なく確定（px）
    velocity: 0.45,   // これ以上の速さなら、短い距離でも確定（px/ms）
    minDistance: 28,  // 速さで確定するときの最低距離（px）
    tapSlop: 10,      // これ以下の移動ならタップとみなす（px）
    tapTime: 500      // これ以下の時間ならタップとみなす（ms）
  };

  // g: { dx, dy, vx, vy } / axis: "x"（左右）または "up"（上）
  // 戻り値: "left" | "right" | "up" | null（null は元の位置に戻す）
  function decideSwipe(g, axis, opt) {
    var o = {};
    var k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    if (opt) for (k in opt) o[k] = opt[k];

    if (axis === "x") {
      var ax = Math.abs(g.dx);
      var sameDir = (g.dx > 0 && g.vx > 0) || (g.dx < 0 && g.vx < 0);
      if (ax >= o.distance || (sameDir && Math.abs(g.vx) >= o.velocity && ax >= o.minDistance)) {
        return g.dx > 0 ? "right" : "left";
      }
      return null;
    }
    if (axis === "up") {
      if (-g.dy >= o.distance || (g.vy <= -o.velocity && -g.dy >= o.minDistance)) return "up";
      return null;
    }
    return null;
  }

  function now() {
    return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
  }

  // el 上のポインター操作を追跡し、handlers の onStart / onMove / onEnd / onTap を呼ぶ
  function attachGesture(el, handlers) {
    var st = null;

    function samePointer(e) {
      return st && (e.pointerId === undefined || st.id === undefined || e.pointerId === st.id);
    }

    el.addEventListener("pointerdown", function (e) {
      if (st) return;
      if (e.button !== undefined && e.button !== 0) return;
      var t = now();
      st = { id: e.pointerId, x: e.clientX, y: e.clientY, t: t, moved: false, samples: [{ x: e.clientX, y: e.clientY, t: t }] };
      if (el.setPointerCapture && e.pointerId !== undefined) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* 無視 */ }
      }
      if (handlers.onStart) handlers.onStart();
    });

    el.addEventListener("pointermove", function (e) {
      if (!samePointer(e)) return;
      var t = now();
      st.samples.push({ x: e.clientX, y: e.clientY, t: t });
      while (st.samples.length > 2 && t - st.samples[0].t > 100) st.samples.shift();
      var dx = e.clientX - st.x;
      var dy = e.clientY - st.y;
      if (!st.moved && Math.sqrt(dx * dx + dy * dy) > DEFAULTS.tapSlop) st.moved = true;
      if (st.moved && handlers.onMove) handlers.onMove({ dx: dx, dy: dy });
    });

    function finish(e, cancelled) {
      if (!samePointer(e)) return;
      var s = st;
      st = null;
      var t = now();
      if (cancelled) {
        if (handlers.onEnd) handlers.onEnd({ dx: 0, dy: 0, vx: 0, vy: 0, cancelled: true });
        return;
      }
      var dx = e.clientX - s.x;
      var dy = e.clientY - s.y;
      if (!s.moved && Math.sqrt(dx * dx + dy * dy) <= DEFAULTS.tapSlop && t - s.t <= DEFAULTS.tapTime) {
        if (handlers.onTap) handlers.onTap();
        if (handlers.onEnd) handlers.onEnd({ dx: 0, dy: 0, vx: 0, vy: 0, tap: true });
        return;
      }
      // 直近 100ms の移動から速さを求める（フリックの勢い）
      var first = s.samples[0];
      var dt = Math.max(1, t - first.t);
      var vx = (e.clientX - first.x) / dt;
      var vy = (e.clientY - first.y) / dt;
      if (handlers.onEnd) handlers.onEnd({ dx: dx, dy: dy, vx: vx, vy: vy });
    }

    el.addEventListener("pointerup", function (e) { finish(e, false); });
    el.addEventListener("pointercancel", function (e) { finish(e, true); });
  }

  var api = { decideSwipe: decideSwipe, attachGesture: attachGesture, DEFAULTS: DEFAULTS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TalkGesture = api;
})(typeof window !== "undefined" ? window : globalThis);
