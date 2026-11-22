// トークテーマカード v2：ロジックと画面の制御
// 前半は純粋なロジック（Node.js でテスト可能）、後半はブラウザでの画面制御。
//
// カードの状態遷移:
//   top（山札の一番上・裏向き） --引く--> drawn（手元・裏向き） --めくる--> revealed（表向き）
//   revealed --右へ: 話した / 左へ: パス--> 捨てて、次の top へ
//   「戻す」で直前の操作を取り消す

(function (root) {
  "use strict";

  var LEVEL_LABELS = { 1: "軽め", 2: "中間", 3: "深め" };
  var LEVEL_SYMBOLS = { 1: "○", 2: "△", 3: "◇" };
  var SET_LABELS = { 1: "Set I", 2: "Set II", 3: "Set III" };
  var SETTINGS_KEY = "talkcards.settings.v2";
  var LOG_KEY = "talkcards.log.v1";
  var VALID_SOURCES = ["aron1997", "suzuki"];

  var DEFAULT_SETTINGS = {
    excludeHeavy: true,
    levels: [1, 2, 3],
    sources: ["aron1997", "suzuki"]
  };

  // ================= 純粋ロジック =================

  function filterQuestions(all, settings) {
    return all.filter(function (q) {
      if (settings.excludeHeavy && q.heavy) return false;
      if (settings.levels.indexOf(q.level) === -1) return false;
      if (settings.sources.indexOf(q.source) === -1) return false;
      return true;
    });
  }

  // Fisher-Yates シャッフル（元の配列は変更しない）
  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  // シャッフルバッグ方式の山札：1周するまで同じカードは出ない
  function createDeck(rnd) {
    rnd = rnd || Math.random;
    var pool = [];
    var bag = [];      // これから引くカード（末尾が山札の一番上）
    var history = [];  // 引いた順の履歴（「戻す」用）
    var current = null; // 最後に引いたカード
    var round = 0;
    var shuffled = false;

    function inPool(q) {
      return !!q && pool.some(function (p) { return p.id === q.id; });
    }

    function refill() {
      bag = shuffle(pool, rnd);
      // 作り直した直後に、直前と同じカードが続けて出ないようにする
      if (bag.length > 1 && current && bag[bag.length - 1].id === current.id) {
        var t = bag[bag.length - 1];
        bag[bag.length - 1] = bag[0];
        bag[0] = t;
      }
      round++;
      shuffled = true;
    }

    function peek() {
      if (pool.length === 0) return null;
      if (bag.length === 0) refill();
      return bag[bag.length - 1];
    }

    return {
      // 絞り込み条件が変わったとき。最後に引いたカードが条件に合うなら残す。
      setPool: function (newPool) {
        pool = newPool.slice();
        history = [];
        if (!inPool(current)) current = null;
        bag = shuffle(pool, rnd).filter(function (q) {
          return !current || q.id !== current.id;
        });
        round = 1;
        shuffled = false;
      },
      // 次に引くカードを見る（引かない）。山札が空なら作り直す。
      peek: peek,
      next: function () {
        var q = peek();
        if (!q) return null;
        bag.pop();
        if (current) history.push(current);
        current = q;
        return q;
      },
      // 最後に引いたカードを山札の一番上に戻し、その前のカードを返す
      back: function () {
        if (history.length === 0) return null;
        if (inPool(current)) bag.push(current);
        current = history.pop();
        return current;
      },
      canBack: function () { return history.length > 0; },
      previous: function () { return history.length ? history[history.length - 1] : null; },
      current: function () { return current; },
      remaining: function () { return bag.length; },
      total: function () { return pool.length; },
      round: function () { return round; },
      // 直前の peek で山札を作り直したか（シャッフル演出用）。読むと false に戻る。
      consumeShuffled: function () { var s = shuffled; shuffled = false; return s; }
    };
  }

  // 保存された設定を検証して読み込む（壊れていたら既定値）
  function sanitizeSettings(raw) {
    var s = {
      excludeHeavy: DEFAULT_SETTINGS.excludeHeavy,
      levels: DEFAULT_SETTINGS.levels.slice(),
      sources: DEFAULT_SETTINGS.sources.slice()
    };
    if (!raw || typeof raw !== "object") return s;
    if (typeof raw.excludeHeavy === "boolean") s.excludeHeavy = raw.excludeHeavy;
    if (Array.isArray(raw.levels)) {
      s.levels = raw.levels.filter(function (v) { return v === 1 || v === 2 || v === 3; });
    }
    if (Array.isArray(raw.sources)) {
      s.sources = raw.sources
        .map(function (v) { return v === "aron36" ? "aron1997" : v; }) // v1 の名前を読み替え
        .filter(function (v, i, a) { return VALID_SOURCES.indexOf(v) !== -1 && a.indexOf(v) === i; });
    }
    return s;
  }

  // 「話した／パス」の記録を検証する
  function sanitizeLog(raw, validIds) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (e) {
      return e && typeof e === "object" && validIds.indexOf(e.id) !== -1 && (e.v === "talked" || e.v === "passed");
    }).map(function (e) { return { id: e.id, v: e.v }; });
  }

  // 山札の厚み（重ねて見せる枚数）：残り枚数に比例、最大 maxLayers
  function deckLayers(remaining, total, maxLayers) {
    if (remaining <= 0 || total <= 0) return 0;
    return Math.max(1, Math.min(maxLayers, Math.ceil(remaining / total * maxLayers)));
  }

  function sourceLabel(q) {
    if (q.source === "aron1997") return "Aron et al. (1997)  " + SET_LABELS[q.set] + "・Q" + Number(q.id.slice(1));
    return "ディープトーク定番（『最強のコミュ力の作り方』で紹介）";
  }

  var api = {
    LEVEL_LABELS: LEVEL_LABELS,
    LEVEL_SYMBOLS: LEVEL_SYMBOLS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    filterQuestions: filterQuestions,
    shuffle: shuffle,
    createDeck: createDeck,
    sanitizeSettings: sanitizeSettings,
    sanitizeLog: sanitizeLog,
    deckLayers: deckLayers,
    sourceLabel: sourceLabel
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TalkCards = api;

  // ================= 画面の制御（ブラウザのみ） =================
  if (typeof document === "undefined" || typeof root.QUESTIONS === "undefined") return;

  var QUESTIONS = root.QUESTIONS;
  var Gesture = root.TalkGesture;
  var MAX_LAYERS = 6;

  // テスト時（TALKCARDS_FAST）は待ち時間なし。「動きを減らす」設定なら短く。
  var FAST = !!root.TALKCARDS_FAST;
  var REDUCE = !FAST && typeof root.matchMedia === "function" && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function later(fn, ms) {
    var d = FAST ? 0 : (REDUCE ? Math.min(ms, 60) : ms);
    if (d === 0) fn(); else setTimeout(fn, d);
  }

  function $(id) { return document.getElementById(id); }
  var els = {
    stage: $("stage"),
    deck: $("deck"),
    empty: $("empty-msg"),
    guide: $("guide"),
    status: $("status"),
    undo: $("btn-undo"),
    pass: $("btn-pass"),
    main: $("btn-main"),
    btnSettings: $("btn-settings"),
    btnLog: $("btn-log"),
    logCount: $("log-count"),
    dlgSettings: $("dlg-settings"),
    dlgLog: $("dlg-log"),
    heavy: $("filter-heavy"),
    levels: Array.prototype.slice.call(document.querySelectorAll('input[name="level"]')),
    sources: Array.prototype.slice.call(document.querySelectorAll('input[name="source"]')),
    logSummary: $("log-summary"),
    logTalked: $("log-talked"),
    logPassed: $("log-passed"),
    logPassedCount: $("log-passed-count"),
    resetLog: $("btn-reset-log"),
    toast: $("toast")
  };

  var byId = {};
  QUESTIONS.forEach(function (q) { byId[q.id] = q; });
  var validIds = QUESTIONS.map(function (q) { return q.id; });

  var deck = createDeck();
  var settings = loadJSON(SETTINGS_KEY, sanitizeSettings);
  var log = loadJSON(LOG_KEY, function (raw) { return sanitizeLog(raw, validIds); });

  var state = "empty"; // empty | top | drawn | revealed
  var cardEl = null;
  var cardQ = null;
  var dragging = false;
  var layerCount = -1;

  // ---------- 保存 ----------
  function loadJSON(key, sanitize) {
    try {
      var raw = root.localStorage.getItem(key);
      return sanitize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return sanitize(null);
    }
  }
  function saveJSON(key, value) {
    try { root.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 保存できない環境では無視 */ }
  }

  // ---------- カードの DOM ----------
  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function buildCard(q, cardState) {
    var card = el("div", "card state-" + cardState);
    var inner = el("div", "card-inner");

    var back = el("div", "face back lv" + q.level);
    var emblem = el("div", "back-emblem");
    emblem.appendChild(el("span", "back-symbol", LEVEL_SYMBOLS[q.level]));
    emblem.appendChild(el("span", "back-label", LEVEL_LABELS[q.level]));
    back.appendChild(emblem);

    var front = el("div", "face front");
    var badges = el("div", "badges");
    badges.appendChild(el("span", "badge lv" + q.level, LEVEL_SYMBOLS[q.level] + " " + LEVEL_LABELS[q.level]));
    if (q.heavy) badges.appendChild(el("span", "badge heavy", "重め"));
    if (q.kind === "task") badges.appendChild(el("span", "badge", "作業"));
    if (q.deeptalk) badges.appendChild(el("span", "badge", "ディープトーク定番"));
    front.appendChild(badges);
    front.appendChild(el("p", "q-text" + (q.text.length > 52 ? " long" : ""), q.text));
    if (q.hint) front.appendChild(el("p", "q-hint", q.hint));
    front.appendChild(el("p", "q-source", sourceLabel(q)));

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);
    card.appendChild(el("div", "stamp stamp-talked", "✓ 話した"));
    card.appendChild(el("div", "stamp stamp-passed", "✕ パス"));
    setFaceVisibility(card, cardState === "revealed");
    return card;
  }

  // 読み上げソフトが裏向きのカードの質問を読まないようにする
  function setFaceVisibility(card, revealed) {
    var back = card.querySelector(".back");
    var front = card.querySelector(".front");
    back.setAttribute("aria-hidden", revealed ? "true" : "false");
    front.setAttribute("aria-hidden", revealed ? "false" : "true");
    if (!revealed) back.setAttribute("aria-label", "裏向きのカード（" + LEVEL_LABELS[cardQ ? cardQ.level : 1] + "）");
  }

  function setCardState(s) {
    state = s;
    if (cardEl) {
      cardEl.classList.remove("state-top", "state-drawn", "state-revealed");
      cardEl.classList.add("state-" + s);
      setFaceVisibility(cardEl, s === "revealed");
    }
  }

  function placeCard(q, cardState, animateIn) {
    cardQ = q;
    cardEl = buildCard(q, cardState);
    state = cardState;
    setFaceVisibility(cardEl, cardState === "revealed");
    if (animateIn && !FAST) {
      cardEl.classList.add("entering");
      els.stage.appendChild(cardEl);
      var target = cardEl;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { target.classList.remove("entering"); });
      });
    } else {
      els.stage.appendChild(cardEl);
    }
  }

  function removeCard(target, how) {
    if (!target) return;
    if (target === cardEl) { cardEl = null; cardQ = null; }
    if (how === "now" || FAST) { target.remove(); return; }
    target.classList.add("leaving-sink");
    later(function () { target.remove(); }, 320);
  }

  function setStamps(target, talked, passed) {
    if (!target) return;
    target.querySelector(".stamp-talked").style.opacity = String(talked);
    target.querySelector(".stamp-passed").style.opacity = String(passed);
  }

  // ---------- 山札 ----------
  function renderDeck() {
    var behind = deck.remaining() - (state === "top" ? 1 : 0);
    var n = deckLayers(behind, deck.total(), MAX_LAYERS);
    if (n !== layerCount) {
      els.deck.textContent = "";
      for (var i = n; i >= 1; i--) {
        var layer = el("div", "deck-layer");
        layer.style.setProperty("--i", String(i));
        els.deck.appendChild(layer);
      }
      layerCount = n;
    }
    els.deck.classList.toggle("tucked", state === "drawn" || state === "revealed");
    els.deck.hidden = state === "empty";
  }

  var toastTimer = null;
  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove("visible"); }, 2000);
  }

  function shuffleEffect() {
    toast("山札をシャッフルしました（" + deck.round() + "周目）");
    if (FAST || REDUCE) return;
    els.deck.classList.remove("shuffling");
    void els.deck.offsetWidth; // アニメーションをやり直すため
    els.deck.classList.add("shuffling");
    setTimeout(function () { els.deck.classList.remove("shuffling"); }, 700);
  }

  // ---------- 操作 ----------
  function showTop() {
    var q = deck.peek();
    if (!q) { showEmpty(); return; }
    if (deck.consumeShuffled()) {
      layerCount = -1;
      shuffleEffect();
    }
    placeCard(q, "top", true);
    refresh();
  }

  function showEmpty() {
    removeCard(cardEl, "now");
    state = "empty";
    refresh();
  }

  function draw() {
    if (state !== "top") return;
    var q = deck.next();
    if (!q) return;
    if (!cardQ || q.id !== cardQ.id) {
      // 念のため：表示中のカードと引いたカードが食い違ったら作り直す
      removeCard(cardEl, "now");
      placeCard(q, "drawn", false);
    }
    setCardState("drawn");
    refresh();
  }

  function flip() {
    if (state !== "drawn") return;
    setCardState("revealed");
    refresh();
  }

  function discard(verdict, fromDrag) {
    if (state !== "revealed" || !cardEl) return;
    var dir = verdict === "talked" ? 1 : -1;
    log.push({ id: cardQ.id, v: verdict });
    saveJSON(LOG_KEY, log);

    var flyingEl = cardEl;
    cardEl = null;
    cardQ = null;
    setStamps(flyingEl, verdict === "talked" ? 1 : 0, verdict === "passed" ? 1 : 0);
    flyingEl.classList.remove("dragging");
    flyingEl.classList.add("flying");
    var dy = fromDrag ? fromDrag.dy * 0.3 : 0;
    var w = root.innerWidth || 400;
    flyingEl.style.transform = "translate(" + (dir * (w + 200)) + "px, calc(var(--y) + " + (dy - 40) + "px)) rotate(" + (dir * 28) + "deg)";
    flyingEl.style.opacity = "0.9";
    later(function () { flyingEl.remove(); }, 400);

    state = "top";
    showTop();
  }

  function lastLogIs(id) {
    return log.length > 0 && log[log.length - 1].id === id;
  }

  function canUndo() {
    if (state === "top") {
      var cur = deck.current();
      return !!cur && lastLogIs(cur.id);
    }
    if (state === "drawn" || state === "revealed") {
      var prev = deck.previous();
      return !!prev && lastLogIs(prev.id);
    }
    return false;
  }

  // 直前の操作を取り消す：
  //   top 状態     → 最後に捨てたカードを表向きで手元に戻す
  //   drawn/revealed → 今のカードを山札に戻し、その前のカードを手元に戻す
  function undo() {
    if (!canUndo()) return;
    var restored;
    if (state === "top") {
      restored = deck.current();
    } else {
      restored = deck.back();
    }
    log.pop();
    saveJSON(LOG_KEY, log);
    removeCard(cardEl, "sink");
    placeCard(restored, "revealed", true);
    refresh();
  }

  function mainAction() {
    if (state === "top") draw();
    else if (state === "drawn") flip();
    else if (state === "revealed") discard("talked");
  }

  // ---------- 表示の更新 ----------
  function refresh() {
    renderDeck();
    els.empty.hidden = state !== "empty";

    var labels = { top: "引く", drawn: "めくる", revealed: "✓ 話した", empty: "引く" };
    els.main.textContent = labels[state];
    els.main.disabled = state === "empty";
    els.pass.disabled = state !== "revealed";
    els.undo.disabled = !canUndo();

    var guides = {
      top: "上にスワイプ（またはタップ）して1枚引く",
      drawn: "タップしてめくる",
      revealed: "右へスワイプで「話した」・左へで「パス」",
      empty: ""
    };
    els.guide.textContent = guides[state];

    if (deck.total() > 0) {
      els.status.textContent = "山札 残り " + deck.remaining() + " / " + deck.total() + " 枚 ・ " + deck.round() + "周目";
    } else {
      els.status.textContent = "対象の質問：0枚";
    }
    var talked = log.filter(function (e) { return e.v === "talked"; }).length;
    els.logCount.textContent = String(talked);
  }

  // ---------- フィルター ----------
  function applySettingsToControls() {
    els.heavy.checked = settings.excludeHeavy;
    els.levels.forEach(function (e) { e.checked = settings.levels.indexOf(Number(e.value)) !== -1; });
    els.sources.forEach(function (e) { e.checked = settings.sources.indexOf(e.value) !== -1; });
  }

  function readSettingsFromControls() {
    settings = {
      excludeHeavy: els.heavy.checked,
      levels: els.levels.filter(function (e) { return e.checked; }).map(function (e) { return Number(e.value); }),
      sources: els.sources.filter(function (e) { return e.checked; }).map(function (e) { return e.value; })
    };
  }

  function applyFilters() {
    var pool = filterQuestions(QUESTIONS, settings);
    var activeQ = (state === "drawn" || state === "revealed") ? cardQ : null;
    deck.setPool(pool);
    layerCount = -1;
    if (pool.length === 0) { showEmpty(); return; }
    var cur = deck.current();
    if (activeQ && cur && cur.id === activeQ.id) { refresh(); return; } // 手元のカードは条件内なので残す
    removeCard(cardEl, "now");
    state = "top";
    showTop();
  }

  function onFilterChange() {
    readSettingsFromControls();
    saveJSON(SETTINGS_KEY, settings);
    applyFilters();
  }

  // ---------- 記録シート ----------
  function renderLog() {
    var talked = log.filter(function (e) { return e.v === "talked"; });
    var passed = log.filter(function (e) { return e.v === "passed"; });
    els.logSummary.textContent = "話した " + talked.length + " 枚 ／ パス " + passed.length + " 枚";
    function fill(list, entries) {
      list.textContent = "";
      entries.forEach(function (e) {
        var q = byId[e.id];
        if (q) list.appendChild(el("li", null, q.text));
      });
    }
    fill(els.logTalked, talked);
    fill(els.logPassed, passed);
    els.logPassedCount.textContent = String(passed.length);
    disarmReset();
  }

  function disarmReset() {
    els.resetLog.classList.remove("armed");
    els.resetLog.textContent = "記録を消去";
  }

  els.resetLog.addEventListener("click", function () {
    if (!els.resetLog.classList.contains("armed")) {
      els.resetLog.classList.add("armed");
      els.resetLog.textContent = "もう一度押すと消去します";
      return;
    }
    log = [];
    saveJSON(LOG_KEY, log);
    renderLog();
    refresh();
  });

  // ---------- ダイアログ ----------
  function openDialog(d) {
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  }
  function closeDialog(d) {
    if (typeof d.close === "function") d.close(); else d.removeAttribute("open");
    disarmReset();
  }
  [els.dlgSettings, els.dlgLog].forEach(function (d) {
    d.addEventListener("click", function (e) {
      if (e.target === d || (e.target.closest && e.target.closest("[data-close]"))) closeDialog(d);
    });
  });
  els.btnSettings.addEventListener("click", function () { openDialog(els.dlgSettings); });
  els.btnLog.addEventListener("click", function () { renderLog(); openDialog(els.dlgLog); });

  // ---------- ボタン・キーボード ----------
  els.main.addEventListener("click", mainAction);
  els.pass.addEventListener("click", function () { discard("passed"); });
  els.undo.addEventListener("click", undo);

  document.addEventListener("keydown", function (e) {
    if (document.querySelector("dialog[open]")) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    if (e.key === "ArrowUp" || e.key === " ") { e.preventDefault(); if (state === "top" || state === "drawn") mainAction(); }
    else if (e.key === "ArrowRight") { if (state === "revealed") discard("talked"); }
    else if (e.key === "ArrowLeft") { if (state === "revealed") discard("passed"); }
    else if (e.key === "z" || e.key === "Backspace") { undo(); }
  });

  // ---------- スワイプ ----------
  function resetDragVisual() {
    if (!cardEl) return;
    cardEl.classList.remove("dragging");
    cardEl.style.transform = "";
    setStamps(cardEl, 0, 0);
  }

  if (Gesture) {
    Gesture.attachGesture(els.stage, {
      onStart: function () {
        dragging = !!cardEl && state !== "empty";
      },
      onMove: function (g) {
        if (!dragging || !cardEl) return;
        cardEl.classList.add("dragging");
        if (state === "top") {
          // 上方向にだけ素直に動く（下方向は抵抗をつける）
          var y = g.dy < 0 ? g.dy : g.dy * 0.15;
          var lift = Math.min(0.04, Math.max(0, -y / 2500));
          cardEl.style.transform = "translate(" + (g.dx * 0.1) + "px, calc(var(--y) + " + y + "px)) scale(" + (1 + lift) + ")";
        } else if (state === "revealed") {
          cardEl.style.transform = "translate(" + g.dx + "px, calc(var(--y) + " + (g.dy * 0.3) + "px)) rotate(" + (g.dx / 18) + "deg)";
          setStamps(cardEl, Math.min(1, Math.max(0, g.dx) / 110), Math.min(1, Math.max(0, -g.dx) / 110));
        } else {
          // 裏向きで手元にあるカードは少しだけ揺れる
          cardEl.style.transform = "translate(" + (g.dx * 0.08) + "px, calc(var(--y) + " + (g.dy * 0.08) + "px))";
        }
      },
      onTap: function () {
        if (state === "top") draw();
        else if (state === "drawn") flip();
      },
      onEnd: function (g) {
        if (!dragging) return;
        dragging = false;
        if (g.tap || g.cancelled) { resetDragVisual(); return; }
        if (state === "top" && Gesture.decideSwipe(g, "up") === "up") {
          resetDragVisual();
          draw();
          return;
        }
        if (state === "revealed") {
          var dir = Gesture.decideSwipe(g, "x");
          if (dir) { discard(dir === "right" ? "talked" : "passed", g); return; }
        }
        resetDragVisual();
      }
    });
  }

  // ---------- 起動 ----------
  applySettingsToControls();
  els.heavy.addEventListener("change", onFilterChange);
  els.levels.concat(els.sources).forEach(function (e) { e.addEventListener("change", onFilterChange); });
  applyFilters();
  setTimeout(function () { document.body.classList.add("is-ready"); }, 0);

  // テスト用に内部状態を参照できるようにする（画面の動作には使わない）
  root.TalkCardsApp = {
    state: function () { return state; },
    cardId: function () { return cardQ ? cardQ.id : null; },
    log: function () { return log.slice(); },
    deck: deck
  };
})(typeof window !== "undefined" ? window : globalThis);
