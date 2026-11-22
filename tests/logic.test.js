// ロジックのテスト：node tests/logic.test.js
const assert = require("assert");
const Q = require("../questions.js");
const T = require("../app.js");
const G = require("../gesture.js");

// ---- データ ----
assert.strictEqual(Q.length, 44);
assert.strictEqual(new Set(Q.map(q => q.id)).size, 44, "ID の重複");
const aron = Q.filter(q => q.source === "aron1997");
assert.strictEqual(aron.length, 36);
[1, 2, 3].forEach(s => {
  const inSet = aron.filter(q => q.set === s);
  assert.strictEqual(inSet.length, 12, "Set " + s + " は12問");
  assert(inSet.every(q => q.level === s), "36問の段階は Set と一致");
});
assert(Q.filter(q => q.source === "suzuki").every(q => q.set === null && q.deeptalk));
assert(Q.filter(q => q.kind === "task").every(q => q.hint), "作業型には説明がある");

// ---- フィルター ----
const ALL = { excludeHeavy: false, levels: [1, 2, 3], sources: ["aron1997", "suzuki"] };
const all = T.filterQuestions(Q, ALL);
assert.strictEqual(all.length, 44);
const noHeavy = T.filterQuestions(Q, T.DEFAULT_SETTINGS);
assert.strictEqual(noHeavy.length, 35);
assert.strictEqual(T.filterQuestions(Q, { ...ALL, levels: [3] }).length, 12);
assert.strictEqual(T.filterQuestions(Q, { ...T.DEFAULT_SETTINGS, sources: ["suzuki"] }).length, 8);
assert.strictEqual(T.filterQuestions(Q, { ...T.DEFAULT_SETTINGS, levels: [] }).length, 0);

// ---- 山札：peek と next は一致し、1周は重複なし、周の境目で連続しない ----
const deck = T.createDeck();
deck.setPool(noHeavy);
assert.strictEqual(deck.round(), 1);
let last = null;
for (let round = 1; round <= 40; round++) {
  const seen = new Set();
  for (let i = 0; i < noHeavy.length; i++) {
    const p = deck.peek();
    if (i === 0 && round > 1) assert.strictEqual(deck.consumeShuffled(), true, "周の始めはシャッフル");
    else assert.strictEqual(deck.consumeShuffled(), false);
    const q = deck.next();
    assert.strictEqual(q.id, p.id, "peek と next が一致");
    assert(!seen.has(q.id), "1周内の重複");
    if (i === 0 && last) assert.notStrictEqual(q.id, last, "周の境目で連続");
    seen.add(q.id);
  }
  last = deck.current().id;
  assert.strictEqual(deck.round(), round);
  assert.strictEqual(deck.remaining(), 0);
}

// ---- 戻す：今のカードは山札の一番上に戻る ----
const d2 = T.createDeck();
d2.setPool(noHeavy);
assert.strictEqual(d2.back(), null);
const a = d2.next(), b = d2.next();
assert.strictEqual(d2.previous().id, a.id);
assert.strictEqual(d2.back().id, a.id);
assert.strictEqual(d2.current().id, a.id);
assert.strictEqual(d2.canBack(), false);
assert.strictEqual(d2.peek().id, b.id, "戻したカードが次に出る");

// ---- フィルター変更：最後に引いたカードが条件内なら残る ----
const d3 = T.createDeck();
d3.setPool(all);
let h; do { h = d3.next(); } while (!h.heavy);
d3.setPool(noHeavy);
assert.strictEqual(d3.current(), null);
const d4 = T.createDeck(); d4.setPool(noHeavy);
const k = d4.next(); d4.setPool(noHeavy);
assert.strictEqual(d4.current().id, k.id);
assert.strictEqual(d4.remaining(), noHeavy.length - 1);

// ---- 空・1枚 ----
const e = T.createDeck(); e.setPool([]);
assert.strictEqual(e.peek(), null); assert.strictEqual(e.next(), null);
const one = T.createDeck(); one.setPool([Q[0]]);
assert.strictEqual(one.next().id, Q[0].id); assert.strictEqual(one.next().id, Q[0].id);

// ---- 山札の厚み ----
assert.strictEqual(T.deckLayers(0, 35, 6), 0);
assert.strictEqual(T.deckLayers(1, 35, 6), 1);
assert.strictEqual(T.deckLayers(35, 35, 6), 6);
assert.strictEqual(T.deckLayers(18, 35, 6), 4);

// ---- 設定・記録の検証 ----
assert.deepStrictEqual(T.sanitizeSettings(null), T.DEFAULT_SETTINGS);
const s = T.sanitizeSettings({ excludeHeavy: "x", levels: [1, 9, "2"], sources: ["aron36", "zzz", "aron1997"] });
assert.strictEqual(s.excludeHeavy, true);
assert.deepStrictEqual(s.levels, [1]);
assert.deepStrictEqual(s.sources, ["aron1997"], "v1 の aron36 を読み替え、重複を除く");
const ids = Q.map(q => q.id);
assert.deepStrictEqual(T.sanitizeLog([{ id: "q01", v: "talked" }, { id: "zz", v: "talked" }, { id: "q02", v: "x" }, null], ids), [{ id: "q01", v: "talked" }]);
assert.deepStrictEqual(T.sanitizeLog("broken", ids), []);

// ---- 出典の表示 ----
assert.strictEqual(T.sourceLabel(Q.find(q => q.id === "q14")), "Aron et al. (1997)  Set II・Q14");

// ---- スワイプ判定 ----
assert.strictEqual(G.decideSwipe({ dx: 100, dy: 0, vx: 0, vy: 0 }, "x"), "right");
assert.strictEqual(G.decideSwipe({ dx: -100, dy: 0, vx: 0, vy: 0 }, "x"), "left");
assert.strictEqual(G.decideSwipe({ dx: 40, dy: 0, vx: 0.8, vy: 0 }, "x"), "right", "短くても速ければ確定");
assert.strictEqual(G.decideSwipe({ dx: 40, dy: 0, vx: -0.8, vy: 0 }, "x"), null, "逆向きの勢いは無効");
assert.strictEqual(G.decideSwipe({ dx: 20, dy: 0, vx: 2, vy: 0 }, "x"), null, "距離が短すぎる");
assert.strictEqual(G.decideSwipe({ dx: 60, dy: 0, vx: 0.1, vy: 0 }, "x"), null, "ゆっくり少しだけ");
assert.strictEqual(G.decideSwipe({ dx: 0, dy: -90, vx: 0, vy: 0 }, "up"), "up");
assert.strictEqual(G.decideSwipe({ dx: 0, dy: -35, vx: 0, vy: -0.9 }, "up"), "up");
assert.strictEqual(G.decideSwipe({ dx: 0, dy: 90, vx: 0, vy: 0.9 }, "up"), null, "下方向では引かない");

console.log("logic tests passed");
