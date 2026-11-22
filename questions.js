// トークテーマカードの質問データ（全44枚）
//
// 項目の意味
//   level   : 1=軽め / 2=中間 / 3=深め（36問は原典の Set I / II / III と同じ）
//   set     : 原典の Set 番号（1〜3）。鈴木氏の定番質問は null
//   heavy   : true なら「重めを除く」スイッチの対象
//   kind    : "question"=普通の質問 / "task"=作業型（hint に説明を表示）
//   source  : "aron1997" = Aron et al. (1997) の付録の36問
//             "suzuki"   = 『最強のコミュ力の作り方』が紹介するディープトークの定番質問
//   deeptalk: 後者に付く「ディープトーク定番」バッジ
//
// 36問の原典:
//   Aron, A., Melinat, E., Aron, E. N., Vallone, R. D., & Bator, R. J. (1997).
//   The experimental generation of interpersonal closeness: A procedure and some preliminary findings.
//   Personality and Social Psychology Bulletin, 23(4), 363–377.
// 質問文は英語原文をもとにした独自の日本語訳。作業型の hint は飲み会向けに補足したもの。
//
// ※ const ではなく var：classic script の const は window のプロパティにならず、app.js から参照できないため。
var QUESTIONS = [
  // ---- Aron et al. (1997) Set I ----
  { id: "q01", text: "世界中の誰でも選べるとしたら、誰をディナーのゲストに招きたいですか？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q02", text: "有名になりたいですか？ なりたいなら、どんなふうに？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q03", text: "電話をかける前に、話すことをリハーサルすることはありますか？ それはなぜ？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q04", text: "あなたにとって「完璧な1日」とは、どんな1日ですか？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q05", text: "最後にひとりで歌ったのはいつですか？ 誰かに向けて歌ったのは？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q06", text: "90歳まで生きられるとして、最後の60年を「30歳の心」と「30歳の体」のどちらかで過ごせるなら、どちらを選びますか？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q07", text: "自分がどんなふうに死ぬか、ひそかな予感はありますか？", level: 1, set: 1, heavy: true, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q08", text: "相手と自分の共通点だと思うことを、3つ挙げてみましょう。", level: 1, set: 1, heavy: false, kind: "task", hint: "話しながら、隣の人との共通点を3つ見つけてみましょう。", source: "aron1997", deeptalk: false },
  { id: "q09", text: "人生で、いちばん感謝していることは何ですか？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q10", text: "自分の育てられ方を何か1つ変えられるとしたら、何を変えますか？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q11", text: "これまでの人生を、できるだけ詳しく相手に話してみましょう。", level: 1, set: 1, heavy: false, kind: "task", hint: "原典では4分間。飲み会では1分くらいでざっくりと。", source: "aron1997", deeptalk: false },
  { id: "q12", text: "明日目覚めたら、何か1つ資質や能力が身についているとしたら、何がいいですか？", level: 1, set: 1, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },

  // ---- Aron et al. (1997) Set II ----
  { id: "q13", text: "水晶玉が、自分自身や人生、未来などについて真実を教えてくれるとしたら、何を知りたいですか？", level: 2, set: 2, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q14", text: "ずっと前からやってみたいと思っていることはありますか？ まだやっていないのはなぜですか？", level: 2, set: 2, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q15", text: "人生でいちばん大きな達成は何ですか？", level: 2, set: 2, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q16", text: "友人関係で、いちばん大切にしていることは何ですか？", level: 2, set: 2, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q17", text: "いちばん大切にしている思い出は何ですか？", level: 2, set: 2, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q18", text: "いちばんつらかった思い出は何ですか？", level: 2, set: 2, heavy: true, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q19", text: "1年後に突然死ぬと分かっていたら、今の生き方の何かを変えますか？ それはなぜ？", level: 2, set: 2, heavy: true, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q20", text: "あなたにとって、友情とはどんな意味を持つものですか？", level: 2, set: 2, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q21", text: "あなたの人生で、愛や愛情はどんな役割を果たしていますか？", level: 2, set: 2, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q22", text: "相手のよいところだと思う点を、交互に1つずつ伝え合いましょう。全部で5つ。", level: 2, set: 2, heavy: false, kind: "task", hint: "隣の人と交互に言い合います。2人合わせて5つまで。", source: "aron1997", deeptalk: false },
  { id: "q23", text: "あなたの家族は、どれくらい親密で温かいですか？ 自分の子ども時代は、ほかの多くの人より幸せだったと思いますか？", level: 2, set: 2, heavy: true, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q24", text: "母親との関係について、どう感じていますか？", level: 2, set: 2, heavy: true, kind: "question", hint: null, source: "aron1997", deeptalk: false },

  // ---- Aron et al. (1997) Set III ----
  { id: "q25", text: "「私たちは」で始まる、本当だと思う文をそれぞれ3つ作りましょう。", level: 3, set: 3, heavy: false, kind: "task", hint: "例：「私たちは2人とも、この場所で〇〇と感じている」のように、今この場のことを文にします。", source: "aron1997", deeptalk: false },
  { id: "q26", text: "「〇〇を分かち合える人がいたらいいのに」という文を完成させてください。", level: 3, set: 3, heavy: false, kind: "task", hint: "〇〇を自由に埋めて、そのまま話してみましょう。", source: "aron1997", deeptalk: false },
  { id: "q27", text: "相手と親しい友達になるとしたら、相手に知っておいてほしい大切なことは何ですか？", level: 3, set: 3, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q28", text: "相手の好きなところを伝えましょう。今回はとても正直に、出会ったばかりの人には言わないようなことも含めて。", level: 3, set: 3, heavy: false, kind: "task", hint: "隣の人に向けて伝えます。", source: "aron1997", deeptalk: false },
  { id: "q29", text: "これまでの人生で恥ずかしかった瞬間を、相手に話してみましょう。", level: 3, set: 3, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q30", text: "最後に人前で泣いたのはいつですか？ ひとりで泣いたのは？", level: 3, set: 3, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q31", text: "相手のことを、もうすでに好きだと思っているところを伝えましょう。", level: 3, set: 3, heavy: false, kind: "task", hint: "ここまでのやりとりで感じたことでOKです。", source: "aron1997", deeptalk: false },
  { id: "q32", text: "冗談にしてはいけないほど深刻なことがあるとしたら、それは何ですか？", level: 3, set: 3, heavy: true, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q33", text: "今夜、誰とも連絡を取れないまま死ぬとしたら、誰かに伝えておかなかったことで、いちばん後悔するのは何ですか？ なぜ、まだ伝えていないのですか？", level: 3, set: 3, heavy: true, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q34", text: "持ち物すべてがある家が火事になりました。大切な人とペットを助け出したあと、安全にもう一度だけ戻って、何か1つ持ち出せます。何を選びますか？ それはなぜ？", level: 3, set: 3, heavy: false, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q35", text: "家族の中で、誰が亡くなったらいちばんつらいですか？ それはなぜ？", level: 3, set: 3, heavy: true, kind: "question", hint: null, source: "aron1997", deeptalk: false },
  { id: "q36", text: "個人的な悩みを打ち明けて、相手ならどう対処するか、アドバイスをもらいましょう。", level: 3, set: 3, heavy: true, kind: "task", hint: "あわせて、その悩みについてあなたがどんな気持ちでいるように見えるかを、相手に言葉にしてもらいます。", source: "aron1997", deeptalk: false },

  // ---- 『最強のコミュ力の作り方』：ディープトーク定番質問（8枚） ----
  // ※「恥ずかしかった経験」は q29、「死について」は q07・q19・q33 と内容が近いため統合（カード化しない）
  { id: "s01", text: "本や映画のキャラクターの中で、自分に最も似ている人物は誰ですか？ その人を選んだ理由は？", level: 1, set: null, heavy: false, kind: "question", hint: null, source: "suzuki", deeptalk: true },
  { id: "s02", text: "これまでにもらった（またはあげた）プレゼントの中で、最高のものは何ですか？", level: 1, set: null, heavy: false, kind: "question", hint: null, source: "suzuki", deeptalk: true },
  { id: "s03", text: "これからの人生で1種類の食事しかできないとしたら、何を選びますか？", level: 1, set: null, heavy: false, kind: "question", hint: null, source: "suzuki", deeptalk: true },
  { id: "s04", text: "あなたのロールモデルは誰ですか？", level: 2, set: null, heavy: false, kind: "question", hint: null, source: "suzuki", deeptalk: true },
  { id: "s05", text: "あなたが学びたいこと、もっと上手になりたいことは何ですか？", level: 2, set: null, heavy: false, kind: "question", hint: null, source: "suzuki", deeptalk: true },
  { id: "s06", text: "あなたが最も情熱を注いでいることは何ですか？", level: 2, set: null, heavy: false, kind: "question", hint: null, source: "suzuki", deeptalk: true },
  { id: "s07", text: "人生で最も誇りに思うことは何ですか？", level: 2, set: null, heavy: false, kind: "question", hint: null, source: "suzuki", deeptalk: true },
  { id: "s08", text: "他の人からもらった人生のアドバイスで、一番よかったものは何ですか？", level: 2, set: null, heavy: false, kind: "question", hint: null, source: "suzuki", deeptalk: true },
];

// ローカルでの検証（Node.js）用。ブラウザでは無視される。
if (typeof module !== "undefined" && module.exports) {
  module.exports = QUESTIONS;
}
