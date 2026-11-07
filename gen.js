// 防災の判断の問題を作る（ブラウザと node の両方で使う）。
// 1問 = 場面（地震・津波・大雨・備え）か、架空の町のハザードマップ。答え1つと、まちがいの選び肢を作る。
// 中身は公的資料で確かめたことだけ（出典は SRC。README にも同じ一覧）。確かめられない話は入れない。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ種なら、どの端末でも同じ問題になる。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  // 出典（画面の「なぜ」の下に出す）
  const SRC = {
    N: ["内閣府 避難情報に関するガイドライン（令和8年3月）", "https://www.bousai.go.jp/oukyu/hinanjouhou/r3_hinanjouhou_guideline/pdf/hinan_guideline_r8_3.pdf"],
    K: ["首相官邸 地震発生時の行動", "https://www.kantei.go.jp/jp/headline/bousai/jishin.html"],
    KT: ["首相官邸 津波から身を守る", "https://www.kantei.go.jp/jp/headline/bousai/tsunami.html"],
    KH: ["首相官邸 避難の考え方", "https://www.kantei.go.jp/jp/headline/bousai/hinan.html"],
    KS: ["首相官邸 災害に対するご家庭での備え", "https://www.kantei.go.jp/jp/headline/bousai/sonae.html"],
    KR: ["首相官邸 大雨・台風に備える", "https://www.kantei.go.jp/jp/headline/bousai/taifu_ooame.html"],
    J: ["気象庁 キキクル（危険度分布）", "https://www.jma.go.jp/jma/kishou/know/bosai/riskmap.html"],
    JF: ["気象庁 洪水から身を守るには", "https://www.jma.go.jp/jma/kishou/know/ame_chuui/ame_chuui_p8-2.html"],
    M: ["国土交通省 江戸川河川事務所 浸水深の目安", "https://www.ktr.mlit.go.jp/edogawa/edogawa00746_2.html"],
    MS: ["国土交通省 家屋倒壊等氾濫想定区域", "https://www.mlit.go.jp/river/bousai/main/saigai/tisiki/syozaiti/"],
  };

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pickN = (R, arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  const shuffle = (R, arr) => pickN(R, arr, arr.length);
  const one = (R, arr) => arr[Math.floor(R() * arr.length)];
  // 答えと、まちがい（重ならないものを順に）を合わせて n 個にし、並びを混ぜる
  function opts(R, ans, wrongs, n = 4) {
    const out = [];
    for (const w of wrongs) { if (w && w !== ans && !out.includes(w)) out.push(w); if (out.length === n - 1) break; }
    return shuffle(R, [ans, ...out]);
  }

  // ---- 警戒レベル（内閣府ガイドライン 令和8年3月 20頁の表）----
  const HAZ = ["大雨", "河川", "土砂災害", "高潮"];
  const INFO = { // [ハザード][レベル] → 情報の名前
    大雨: { 2: "レベル2 大雨注意報", 3: "レベル3 大雨警報", 4: "レベル4 大雨危険警報", 5: "レベル5 大雨特別警報" },
    河川: { 2: "レベル2 氾濫注意報", 3: "レベル3 氾濫警報", 4: "レベル4 氾濫危険警報", 5: "レベル5 氾濫特別警報" },
    土砂災害: { 2: "レベル2 土砂災害注意報", 3: "レベル3 土砂災害警報", 4: "レベル4 土砂災害危険警報", 5: "レベル5 土砂災害特別警報" },
    高潮: { 2: "レベル2 高潮注意報", 3: "レベル3 高潮警報", 4: "レベル4 高潮危険警報", 5: "レベル5 高潮特別警報" },
  };
  const ACT = {
    2: "ハザードマップで、避難先と逃げ道をたしかめる",
    3: "高齢の人など、逃げるのに時間がかかる人は避難を始める",
    4: "危険な場所から、全員避難する",
    5: "命の危険。すぐに少しでも安全な所で身を守る",
  };
  const LVNAME = { 2: "自分の避難行動を確認", 3: "高齢者等避難", 4: "避難指示", 5: "緊急安全確保" };
  // キキクルの色（気象庁）：黄＝注意（レベル2相当）・赤＝警戒（3）・紫＝危険（4）・黒＝災害切迫（5）
  const KIKI = { 2: ["黄", "注意", "#f2e700"], 3: ["赤", "警戒", "#ff2800"], 4: ["紫", "危険", "#aa00aa"], 5: ["黒", "災害切迫", "#0c000c"] };

  // ---- ハザードマップ（架空の町）----
  // 浸水の深さの区分（国交省の目安：0.5m で1階の床上、3m で2階の床、5m で2階が水につかる）
  const BAND = ["浸水の想定なし", "0.5m未満", "0.5〜3m", "3〜5m", "5m以上"];
  const BANDMEAN = [
    "水につかる想定はありません。",
    "1階の床上までは来ない目安です。",
    "1階の床より上まで水が来ます。0.5mでも大人が歩いて逃げるのは難しくなります。",
    "2階の床まで水が来ます。",
    "2階が水につかります。3階の床まで来ることもあります。",
  ];
  const W = 6, H = 5; // ます目（列×行）。下が川（津波の地図では海）
  // 川からの近さで深さを決める（川に近いほど深い。同じ行でも少しばらつく）
  function floodGrid(R) {
    const top = [ri(R, 3, 4), ri(R, 2, 3), ri(R, 1, 2), ri(R, 0, 1), 0]; // 下の行（川ぞい）から上へ
    const g = [];
    for (let y = 0; y < H; y++) {
      const base = top[H - 1 - y], row = [];
      for (let x = 0; x < W; x++) { let b = base + (R() < 0.25 ? -1 : 0); if (b < 0) b = 0; row.push(b); }
      g.push(row);
    }
    // 上ほど浅く（下の行より深くならない）
    for (let y = H - 2; y >= 0; y--) for (let x = 0; x < W; x++) if (g[y][x] > g[y + 1][x]) g[y][x] = g[y + 1][x];
    return g;
  }
  const cellsWhere = (g, f) => { const out = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (f(g[y][x], x, y)) out.push([x, y]); return out; };
  const at = (g, c) => g[c[1]][c[0]];
  const SCHOOL = ["東小学校", "北中学校", "西小学校", "南中学校", "第二小学校"];
  const PARK = ["中央公園", "さくら公園", "けやき広場", "みどり公園"];
  const HALL = ["川ぞい体育館", "みなと公民館", "駅前ホール", "河原グラウンド"];

  // 1問ずつの作り方：id・難しさ・名前・分野・見るところ（ヒント1）・覚えること（防災ノート）・作り方
  const KINDS = [
    // ===== やさしい =====
    { id: "quake_home", lv: 0, cat: "地震", name: "家でゆれたら", look: "まず自分の体を守ることを考えましょう。",
      note: "ゆれたら、あわてて外へ飛び出さず、丈夫な机の下などで身を守る。火元から離れていたら無理に火を消しに行かない。",
      make(R) {
        const v = one(R, [
          { s: "居間にいたら、大きくゆれ始めた。", a: "丈夫な机の下にかくれて身を守る", x: ["急いで外へ飛び出す", "棚が倒れないよう手で押さえる", "窓を開けて外の様子を見る"], w: "あわてて外に飛び出さず、丈夫な机の下などにかくれて身を守ります。" },
          { s: "大きくゆれた。コンロの火からは離れた所にいる。", a: "無理に火を消しに行かず、身を守る", x: ["走ってコンロの火を消しに行く", "鍋を流しまで運ぶ", "急いで外へ飛び出す"], w: "火元から離れているときは、無理に火を消しに行きません。その場で消せるときだけ火の始末をします。" },
          { s: "大きくゆれた。背の高い家具のそばにいる。", a: "家具から離れ、丈夫な机の下などで身を守る", x: ["家具を両手で押さえる", "家具の横にしゃがむ", "家具の中の物を出す"], w: "大きな家具から離れ、丈夫な机の下などにかくれます。" },
          { s: "家の中でゆれている。逃げ道のことも気になる。", a: "扉を開けて逃げ道を作る", x: ["扉にかぎをかける", "扉の前に荷物を置く", "外へ走り出る"], w: "家の中では、扉を開けて逃げ道を作っておきます。あわてて外へは出ません。" },
        ]);
        return { scene: v.s, ask: "どうする？", ans: v.a, opts: opts(R, v.a, v.x), why: v.w, src: "K" };
      } },
    { id: "level", lv: 0, cat: "大雨", name: "警戒レベルと行動", look: "情報の名前の頭にある「レベル」の数を見ましょう。",
      note: "レベル2で避難先を確認、3で高齢の人などが避難、4で危険な場所から全員避難、5は命の危険。レベル4までに必ず避難。",
      make(R) {
        const h = one(R, HAZ), l = ri(R, 2, 5), name = INFO[h][l];
        return { scene: `「${name}」が出た。`, ask: "このときの行動は？", ans: ACT[l], opts: opts(R, ACT[l], shuffle(R, [2, 3, 4, 5].filter((x) => x !== l).map((x) => ACT[x]))),
          why: `「${name}」は警戒レベル${l}（${LVNAME[l]}）。${ACT[l]}。レベル5を待たず、レベル4までに危険な場所から避難します。`, src: "N" };
      } },
    { id: "kikikuru", lv: 0, cat: "大雨", name: "キキクルの色", look: "黄・赤・紫・黒の順に、危なさが上がります。",
      note: "キキクルは黄（注意）・赤（警戒）・紫（危険）・黒（災害切迫）。遅くとも紫で避難を始める。",
      make(R) {
        const l = ri(R, 2, 5), [c, m, hex] = KIKI[l], where = one(R, ["家のあたり", "通っている学校のあたり", "親の家のあたり"]);
        const a = `警戒レベル${l}に当たる`;
        return { scene: `キキクル（気象庁の地図）で、${where}が「${c}（${m}）」になった。`, swatch: [hex, c], ask: "どのくらい危ない？", ans: a,
          opts: opts(R, a, shuffle(R, [2, 3, 4, 5].filter((x) => x !== l).map((x) => `警戒レベル${x}に当たる`))),
          why: `キキクルの${c}（${m}）は警戒レベル${l}に当たります。${l >= 4 ? "遅くとも紫で避難を始めます。" : "黄・赤・紫・黒の順に危なくなります。"}`, src: "J" };
      } },
    { id: "depth", lv: 0, cat: "地図", name: "浸水の深さを読む", look: "家のますの色と数字を、下の凡例とくらべましょう。",
      note: "ハザードマップは色で浸水の深さを示す。0.5mで1階の床上、3mで2階の床、5mで2階が水につかる目安。",
      make(R) {
        const g = floodGrid(R), home = one(R, cellsWhere(g, () => true)), b = at(g, home);
        const a = BAND[b];
        return { scene: "大雨で川があふれたときの、洪水のハザードマップ。", map: { type: "flood", g, home }, ask: "家のあたりの浸水の深さは？", ans: a,
          opts: opts(R, a, shuffle(R, BAND.filter((x) => x !== a))), why: `家のますは凡例の「${a}」。${BANDMEAN[b]}`, src: "M" };
      } },
    { id: "stock", lv: 0, cat: "備え", name: "飲み水の備え", look: "1人1日3リットルが目安です。人数と日数をかけましょう。",
      note: "飲み水は1人1日3リットルが目安。最低3日分、大きな災害に備えるなら1週間分。",
      make(R) {
        const n = ri(R, 1, 6), d = 3, need = n * d * 3, a = `${need}リットル`;
        const wr = [need - 3, need + 3, n * d, n * 3, need * 2, need + 6].filter((x) => x > 0).map((x) => `${x}リットル`);
        return { scene: `家族は${n}人。飲み水を3日分そろえたい。`, ask: "何リットル要る？", ans: a, opts: opts(R, a, wr), why: `1人1日3リットルが目安。${n}人×3日×3リットル＝${need}リットルです。`, src: "KS" };
      } },
    { id: "tsunami_beach", lv: 0, cat: "津波", name: "海の近くでゆれたら", look: "津波は見てから逃げるのでは間に合いません。",
      note: "海の近くでゆれたら、すぐ海岸から離れて高い所へ。津波は何度も来る。警報や注意報が解除されるまで戻らない。",
      make(R) {
        const v = one(R, [
          { s: "海水浴をしていたら「津波注意報」が出た。", a: "すぐ海から上がり、海岸から離れる", x: ["注意報なので泳ぎ続ける", "波の様子を見てから決める", "浜で警報に変わるのを待つ"], w: "海岸の近くにいる人は、津波注意報でも避難します。" },
          { s: "海の近くにいたら、強いゆれを感じた。", a: "すぐに海岸から離れ、高い所へ逃げる", x: ["津波が見えたら逃げる", "家に荷物を取りに戻る", "海の様子を見に行く"], w: "津波は見てから逃げるのでは間に合いません。いち早く海岸から離れ、高い所へ逃げます。" },
          { s: "高台に逃げた。津波の1回目の波が引いた。", a: "警報や注意報が解除されるまで戻らない", x: ["家の片付けに戻る", "海の様子を見に行く", "もう安全なので家へ帰る"], w: "津波は何度もくり返し来て、あとの波の方が高いこともあります。解除されて安全が確かめられるまで戻りません。" },
          { s: "「大津波警報」が出た。すぐ近くに津波避難ビルがある。", a: "津波避難ビルの、できるだけ上の階へ", x: ["ビルの1階で待つ", "海岸の様子を見てから決める", "家へ荷物を取りに行く"], w: "近くの高台や津波避難タワー・津波避難ビルなど、できるだけ高い所へ逃げます。" },
        ]);
        return { scene: v.s, ask: "どうする？", ans: v.a, opts: opts(R, v.a, v.x), why: v.w, src: "KT" };
      } },

    // ===== ふつう =====
    { id: "quake_out", lv: 1, cat: "地震", name: "外や乗り物でゆれたら", look: "上から落ちてくる物・倒れてくる物から離れることを考えましょう。",
      note: "外ではブロック塀・自動販売機・看板から離れる。エレベーターは最寄りの階で降りる。車はゆるやかに止めて道路の左側へ。",
      make(R) {
        const v = one(R, [
          { s: "道を歩いていたらゆれた。横にブロック塀がある。", a: "ブロック塀や自動販売機のそばから離れる", x: ["塀に手をついて体を支える", "自動販売機のかげにかくれる", "塀のそばでしゃがむ"], w: "ブロック塀や自動販売機は倒れることがあります。そばから離れます。" },
          { s: "ビルの多い通りを歩いていたらゆれた。", a: "看板や窓ガラスが落ちてこないか気をつけ、頭を守る", x: ["ビルの壁ぎわに寄る", "看板の下で待つ", "上を見ずに走る"], w: "ビルの壁・看板・割れた窓ガラスが落ちてくることがあります。頭を守ります。" },
          { s: "エレベーターに乗っていたらゆれた。", a: "最寄りの階で止めて、すぐに降りる", x: ["止まるまで中で待つ", "いちばん上の階まで乗る", "扉を手でこじ開ける"], w: "エレベーターは最寄りの階で止めて、すぐに降ります。" },
          { s: "電車に乗っていたら、大きくゆれた。", a: "つり革や手すりにしっかりつかまる", x: ["窓を開けて外へ出る", "すぐ出口へ走る", "座席の上に立つ"], w: "電車やバスでは、つり革や手すりにしっかりつかまります。" },
          { s: "車を運転していたら、大きくゆれた。", a: "ハザードランプをつけ、ゆるやかに速度を落として道路の左側に止める", x: ["すぐ急ブレーキをかける", "急ハンドルで道ばたへよける", "速度を上げて通りすぎる"], w: "急ハンドル・急ブレーキはさけ、ハザードランプをつけて、ゆるやかに速度を落とし、道路の左側に止めます。" },
          { s: "人の多いお店にいたら、大きくゆれた。", a: "係員の指示に従い、出口や階段に急いで向かわない", x: ["すぐ出口へ走る", "つり下がった照明の下で待つ", "階段へいっせいに急ぐ"], w: "係員の指示に従います。つり下がった照明の下から離れ、出口や階段に人が殺到しないようにします。" },
          { s: "山道を歩いていたら、大きくゆれた。", a: "落石やがけ崩れに気をつけ、その場から離れる", x: ["がけの下で休む", "そのまま山道を登り続ける", "がけの様子を近くで見る"], w: "山やがけの近くでは、落石やがけ崩れに気をつけ、できるだけその場から離れます。" },
        ]);
        return { scene: v.s, ask: "どうする？", ans: v.a, opts: opts(R, v.a, v.x), why: v.w, src: "K" };
      } },
    { id: "stay", lv: 1, cat: "地図", name: "家にとどまれる？", look: "水が来る深さより高い所に、部屋があるかを考えましょう。",
      note: "洪水で家にとどまれるのは、家屋倒壊等氾濫想定区域の外・浸水より高い部屋がある・水が引くまでの備えがある、の全部がそろうとき。",
      make(R) { return stayMake(R, false); } },
    { id: "shelter", lv: 1, cat: "地図", name: "洪水で逃げる先", look: "場所の印（洪水・地震など）と、その場所の浸水の深さを見ましょう。",
      note: "避難場所は災害の種類ごとに決まっている。洪水のときは「洪水」の印がある、浸水しない場所へ。",
      make(R) { return shelterMake(R, "洪水"); } },
    { id: "rain", lv: 1, cat: "大雨", name: "大雨のときの判断", look: "命を守る行動はどれか、危ない所へ近づかない行動はどれかを考えましょう。",
      note: "増水した川や田んぼを見に行かない。忘れ物を取りに戻らない。家を出る前に火の始末。外が危ないときは上の階・崖から離れた部屋へ。",
      make(R) {
        const v = one(R, [
          { s: "大雨で川の水がふえている。家族が「川を見てくる」と言う。", a: "見に行かないよう止める", x: ["いっしょに見に行く", "車で見に行くならよい", "写真をとってきてもらう"], w: "増水した川や田んぼを見に行って流される事故が起きています。見に行きません。", src: "KR" },
          { s: "避難の途中で、家に忘れ物をしたことに気づいた。", a: "取りに戻らず、避難を続ける", x: ["急いで取りに戻る", "家族に取りに行ってもらう", "雨が弱まるまで家で待つ"], w: "忘れ物を取りに戻るのは危険です。やめましょう。", src: "KR" },
          { s: "大雨の中、避難するために家を出る。", a: "火の始末をしてから出る", x: ["火はつけたまま急いで出る", "窓を全部開けてから出る", "家族を家に残して先に出る"], w: "避難する前に、必ず火の始末をします。", src: "KR" },
          { s: "レベル4が出たが、外はもう水があふれ、歩くのは危ない。", a: "家の中の、少しでも浸水しにくい高い所へ移る", x: ["水の中を歩いて避難場所へ向かう", "1階でテレビを見て待つ", "車で一気に走りぬける"], w: "避難場所への立ち退き避難がかえって危ないときは、家や近くの建物の、少しでも浸水しにくい高い所へ移ります。", src: "N" },
          { s: "がけの近くの家。外へ出るのは、もう危ない。", a: "家の中で、がけから離れた部屋や上の階へ移る", x: ["がけ側の部屋で様子を見る", "がけの様子を見に外へ出る", "1階のがけ側でねる"], w: "立ち退き避難ができないときは、家の上の階や、がけから離れた部屋などで命を守ります。", src: "KH" },
          { s: "レベル3が出ないうちに、いきなりレベル4が出た。", a: "レベル4として、危険な場所からすぐ避難する", x: ["レベル3が出るまで待つ", "レベル5が出てから考える", "まちがいだと思って寝る"], w: "警戒レベルは、1から5の順番に出るとは限りません。出たレベルで行動します。", src: "KH" },
          { s: "レベル5（緊急安全確保）はまだ出ていない。避難指示（レベル4）は出ている。", a: "レベル5を待たずに、危険な場所から避難する", x: ["レベル5が出るまで家で待つ", "テレビで様子を見てから決める", "近所の人が逃げるまで待つ"], w: "レベル5は必ず出るとは限りません。レベル5を待たず、レベル4までに必ず避難します。", src: "N" },
        ]);
        return { scene: v.s, ask: "どうする？", ans: v.a, opts: opts(R, v.a, v.x), why: v.w, src: v.src };
      } },
    { id: "tsunami_alert", lv: 1, cat: "津波", name: "津波の情報の種類", look: "1m・3mが区切りです。",
      note: "予想される津波の高さが1mまでは津波注意報、3mまでは津波警報、3mをこえると大津波警報（5m・10m・10m超）。",
      make(R) {
        const v = one(R, [["1m", "津波注意報"], ["3m", "津波警報"], ["5m", "大津波警報"], ["10m", "大津波警報"], ["10m超", "大津波警報"]]);
        const where = one(R, ["海ぞいの町", "港の近く", "海水浴場のある町"]);
        return { scene: `${where}に、予想される津波の高さ「${v[0]}」と発表された。`, ask: "出ている情報は？", ans: v[1],
          opts: opts(R, v[1], ["大津波警報", "津波警報", "津波注意報", "高潮注意報"]),
          why: `高さの数字は、津波注意報が1m、津波警報が3m、大津波警報が5m・10m・10m超です。「${v[0]}」は${v[1]}。`, src: "KT" };
      } },
    { id: "kitaku", lv: 1, cat: "備え", name: "連絡と家の備え", look: "混乱しているときに、自分と家族を守る方法を考えましょう。",
      note: "大きな地震で帰れないときは、むやみに移動を始めない。安否は災害用伝言ダイヤル171。家具は壁に固定する。",
      make(R) {
        const v = one(R, [
          { s: "会社にいたら大きな地震。電車は止まっている。", a: "むやみに移動を始めず、安全な場所にとどまる", x: ["すぐ歩いて家へ帰る", "駅へ行って動くのを待つ", "車で迎えに来てもらう"], w: "大きな都市では、むやみに移動を始めないことが基本です。駅のまわりにも近づきません。", src: "K" },
          { s: "地震のあと、家族の無事を確かめたい。電話がつながりにくい。", a: "災害用伝言ダイヤル「171」に伝言を残す", x: ["つながるまで何度もかけ続ける", "家族の勤め先へ歩いて行く", "知らない番号にかけてたずねる"], w: "局番なしの「171」に電話をかけると、伝言を録音・再生できます。" },
          { s: "災害用伝言ダイヤル「171」を、前もって試してみたい。", a: "毎月1日・15日などの体験日に試す", x: ["災害が起きるまで使えない", "お金を払って申しこむ", "毎日いつでも何回も試せる"], w: "171には体験利用日があります（毎月1日・15日など）。家族で使い方をたしかめておきます。" },
          { s: "寝室に、背の高いたんすがある。", a: "たんすを壁に固定する", x: ["たんすの上に物を積む", "たんすを枕の横に動かす", "何もしなくてよい"], w: "家具は壁に固定します。寝室には、できるだけ家具を置かないようにします。" },
        ]);
        return { scene: v.s, ask: "どうする？", ans: v.a, opts: opts(R, v.a, v.x), why: v.w, src: v.src || "KS" };
      } },

    // ===== むずかしい =====
    { id: "stay2", lv: 2, cat: "地図", name: "家にとどまれる？（くわしく）", look: "3つの条件を1つずつ確かめましょう。1つでも足りなければ立ち退きです。",
      note: "家屋倒壊等氾濫想定区域（激しい流れで家がこわれるおそれ）の中なら、高い階があっても立ち退き避難。水が長く引かず備えが足りないときも立ち退き。",
      make(R) { return stayMake(R, true); } },
    { id: "sand", lv: 2, cat: "地図", name: "土砂災害で逃げる先", look: "「土砂災害」の印と、土砂災害警戒区域（しま模様）の外かを見ましょう。",
      note: "土砂災害のときは、「土砂災害」の印があり、土砂災害警戒区域の外にある場所へ。洪水や地震用の場所が、土砂災害にも安全とは限らない。",
      make(R) { return shelterMake(R, "土砂災害"); } },
    { id: "tsunami_map", lv: 2, cat: "地図", name: "津波で逃げる先", look: "「津波」の印がある場所を探しましょう。標高（数字）も見ましょう。",
      note: "津波のときは、「津波」の印がある高台・津波避難ビルなど、できるだけ高い所へ。地震用の広場が津波に安全とは限らない。",
      make(R) { return tsunamiMapMake(R); } },
    { id: "level_mix", lv: 2, cat: "大雨", name: "2つの情報から判断", look: "2つのうち、危ないほうの情報に合わせて動きましょう。",
      note: "市町村の情報とキキクルが別の段階を示しているときは、危ないほうに合わせる。遅くとも紫（危険）で避難を始める。",
      make(R) {
        let a = ri(R, 2, 4), b = ri(R, 3, 5);
        if (a === b) b = Math.min(5, a + 1);
        const hz = one(R, ["河川", "土砂災害"]), place = hz === "河川" ? "川の近くの家" : "がけの近くの家";
        const lvl = Math.max(a, b), [c, m] = KIKI[b];
        return { scene: `${place}で、2つの情報が届いた。`, info: [`出ている情報：「${INFO[hz][a]}」`, `キキクル：家のあたりが「${c}（${m}）」`], swatch: [KIKI[b][2], c], ask: "どう動く？", ans: ACT[lvl],
          opts: opts(R, ACT[lvl], shuffle(R, [2, 3, 4, 5].filter((x) => x !== lvl).map((x) => ACT[x]))),
          why: `情報はレベル${a}、キキクルの${c}はレベル${b}に当たります。危ないほうのレベル${lvl}に合わせます。${lvl >= 4 ? "遅くとも紫（危険）で避難を始めます。" : ""}`, src: lvl === b ? "J" : "N" };
      } },
    { id: "stock7", lv: 2, cat: "備え", name: "1週間分の備え", look: "1人1日3リットル×人数×7日。そこから今ある分を引きましょう。",
      note: "大きな災害に備えるなら1週間分の備蓄が望ましい。飲み水は1人1日3リットル。",
      make(R) {
        const n = ri(R, 1, 5), need = n * 7 * 3, have = 2 * ri(R, 1, Math.floor((need - 2) / 2)), left = need - have, a = `${left}リットル`;
        const wr = [left + 2, left - 2, need, n * 3 * 3 - have, left + 6, left - 6].filter((x) => x > 0 && x !== left).map((x) => `${x}リットル`);
        return { scene: `家族は${n}人。1週間分の飲み水をそろえたい。いま${have}リットルある。`, ask: "あと何リットル要る？", ans: a, opts: opts(R, a, wr),
          why: `1人1日3リットル×${n}人×7日＝${need}リットル。いまの${have}リットルを引いて、あと${left}リットルです。`, src: "KS" };
      } },
  ];

  // 家にとどまれるか。家の種類と浸水の深さ（くわしくでは区域と備えも）から決める
  const HOUSES = [["平屋（1階建て）", 1], ["2階建ての家", 2], ["マンションの3階", 3], ["マンションの5階", 5]];
  const STAY = "家の上の階など、浸水しない部屋にとどまる";
  const GO = "避難場所や安全な親戚・知人の家へ立ち退き避難する";
  function stayMake(R, hard) {
    const g = floodGrid(R);
    // 家屋倒壊等氾濫想定区域：川ぞいの行の一部（くわしくのときだけ）
    const zone = hard ? [...Array(W).keys()].filter(() => R() < 0.6).map((x) => [x, H - 1]) : [];
    const [hname, fl] = one(R, HOUSES);
    let cands = cellsWhere(g, (b) => b >= 1);
    if (fl === 5) cands = cands.filter((c) => at(g, c) <= 3); // 5m以上の上は分からないので、5階は3〜5mまで
    if (!cands.length) cands = [[0, H - 1]];
    const home = one(R, cands), b = at(g, home), inZone = zone.some((z) => z[0] === home[0] && z[1] === home[1]);
    // 浸水しない部屋：平屋は0.5m未満まで・2階建ては3m未満まで・3階は5m未満まで
    const roomOk = fl === 1 ? b <= 1 : fl === 2 ? b <= 2 : fl === 3 ? b <= 3 : b <= 4;
    const long = hard && R() < 0.5, food = hard ? (R() < 0.5 ? "1日分だけ" : "1週間分") : "1週間分";
    const longFail = long && food === "1日分だけ";
    const ok = roomOk && !inZone && !longFail;
    const ans = ok ? STAY : GO;
    let why;
    if (inZone) why = "家は家屋倒壊等氾濫想定区域（激しい流れで家がこわれるおそれがある区域）の中です。高い階があっても、立ち退き避難します。";
    else if (!roomOk) why = `浸水の深さは「${BAND[b]}」。${BANDMEAN[b]}${hname}では浸水しない部屋がないので、立ち退き避難します。`;
    else if (longFail) why = "浸水しない部屋はありますが、水が引くまで3日以上かかる想定で、備えは1日分だけ。がまんできないので立ち退き避難します。";
    else why = `浸水の深さは「${BAND[b]}」。${hname}なら浸水しない部屋があり、${hard ? "区域の外で、備えも足ります。" : "備えも足ります。"}家にとどまる「屋内安全確保」を選べます。`;
    const info = [`家：${hname}`, `水・食料の備え：${food}`]; if (hard) info.push(`水が引くまで：${long ? "3日以上" : "半日ほど"}`);
    return { scene: "大雨で「レベル4 氾濫危険警報」。洪水のハザードマップで家を見る。", info, map: { type: "flood", g, home, zone }, ask: "どうする？", ans,
      opts: opts(R, ans, [ans === STAY ? GO : STAY, "1階で様子を見て、水が来たら考える", "車で川の様子を見に行ってから決める"]), why, src: inZone ? "MS" : "KH" };
  }

  // 逃げる先を選ぶ（洪水・土砂災害）。場所に「洪水」「土砂災害」「地震」などの印（指定緊急避難場所の災害の種類）
  function shelterMake(R, hz) {
    const g = floodGrid(R), sand = hz === "土砂災害";
    // 土砂災害警戒区域：いちばん上の行（山のふもと）の一部
    const slope = sand ? [...Array(W).keys()].filter((x) => x % 2 === 0 || R() < 0.5).map((x) => [x, 0]) : [];
    const inSlope = (c) => slope.some((z) => z[0] === c[0] && z[1] === c[1]);
    const used = new Set(), take = (list) => { const c = list.filter((c) => !used.has(c.join())); if (!c.length) return null; const p = one(R, c); used.add(p.join()); return p; };
    const dry = cellsWhere(g, (b, x, y) => b === 0), wet = cellsWhere(g, (b) => b >= 2);
    const home = take(sand ? cellsWhere(g, (b, x, y) => y <= 1) : cellsWhere(g, (b, x, y) => y >= 2)) || [0, 2];
    const places = [];
    if (!sand) {
      places.push({ name: one(R, SCHOOL), marks: ["洪水", "地震"], c: take(dry) || [5, 0], ok: true });
      places.push({ name: one(R, PARK), marks: ["地震"], c: take(dry) || [4, 0], why: "地震のときだけの場所で、洪水の印がありません" });
      places.push({ name: one(R, HALL), marks: ["地震"], c: take(wet) || [3, 4], why: "浸水する所にあります" });
    } else {
      const safeDry = dry.filter((c) => !inSlope(c));
      places.push({ name: one(R, SCHOOL), marks: ["土砂災害", "地震"], c: take(safeDry.length ? safeDry : cellsWhere(g, (b, x, y) => y === 1)) || [5, 1], ok: true });
      places.push({ name: "山すその公民館", marks: ["洪水", "地震"], c: take(slope) || [0, 0], why: "土砂災害警戒区域の中にあり、土砂災害の印がありません" });
      places.push({ name: one(R, HALL), marks: ["地震"], c: take(wet) || [3, 4], why: "地震のときだけの場所で、浸水もする所にあります" });
    }
    const L = ["A", "B", "C"], order = shuffle(R, places);
    order.forEach((p, i) => (p.k = L[i]));
    const lab = (p) => `${p.k} ${p.name}`, okp = order.find((p) => p.ok);
    const ans = lab(okp);
    const why = `避難場所は災害の種類ごとに決まっています。${okp.k}は「${hz}」の印があり、${sand ? "土砂災害警戒区域の外です" : "浸水の想定がありません"}。` + order.filter((p) => !p.ok).map((p) => `${p.k}は${p.why}。`).join("");
    const scene = sand ? "大雨で「レベル4 土砂災害危険警報」。家はがけの近く。" : "大雨で「レベル4 氾濫危険警報」。家から立ち退き避難する。";
    return { scene, map: { type: "flood", g, home, slope, places: order.map((p) => ({ k: p.k, c: p.c, marks: p.marks, name: p.name })) }, ask: "どこへ逃げる？", ans,
      opts: opts(R, ans, [...order.filter((p) => !p.ok).map(lab), "家の近くの川の土手"]), why, src: "KH" };
  }

  // 津波の地図：下が海。数字は標高（m）。「津波」の印がある場所は1つだけ
  function tsunamiMapMake(R) {
    const g = [];
    for (let y = 0; y < H; y++) { const row = [], base = [16, 9, 5, 3, 1][y]; for (let x = 0; x < W; x++) row.push(Math.max(1, base + ri(R, -1, 2))); g.push(row); }
    const used = new Set(), take = (f) => { const c = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (f(x, y) && !used.has(x + "," + y)) c.push([x, y]); if (!c.length) return null; const p = one(R, c); used.add(p.join()); return p; };
    const home = take((x, y) => y >= 3);
    const tall = R() < 0.5;
    const places = [
      tall ? { name: "津波避難ビル（7階建て）", marks: ["津波"], c: take((x, y) => y >= 2 && y <= 3), ok: true } : { name: "高台の公園", marks: ["津波", "地震"], c: take((x, y) => y === 0), ok: true },
      { name: "浜辺の広場", marks: ["地震"], c: take((x, y) => y === 4), why: "地震のときだけの場所で、海のすぐそばです" },
      { name: one(R, SCHOOL), marks: ["洪水", "地震"], c: take((x, y) => y === 2 || y === 1), why: "津波の印がありません" },
    ];
    const L = ["A", "B", "C"], order = shuffle(R, places); order.forEach((p, i) => (p.k = L[i]));
    const lab = (p) => `${p.k} ${p.name}`, okp = order.find((p) => p.ok), ans = lab(okp);
    const why = `津波のときは「津波」の印がある場所へ、できるだけ高く逃げます。${okp.k}が「津波」の場所です。` + order.filter((p) => !p.ok).map((p) => `${p.k}は${p.why}。`).join("");
    return { scene: "海の近くで強いゆれ。「津波警報」が出た。", map: { type: "sea", g, home, places: order.map((p) => ({ k: p.k, c: p.c, marks: p.marks, name: p.name })) }, ask: "どこへ逃げる？", ans,
      opts: opts(R, ans, [...order.filter((p) => !p.ok).map(lab), "家にもどって様子を見る"]), why, src: "KT" };
  }

  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1問を作る。tag は「種類|種」（例 "level|2026-11-07:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)));
    return { tag, kind, lv: k.lv, cat: k.cat, name: k.name, look: k.look, note: k.note, ...p };
  }
  // 同じ問題かを見分ける印（場面・地図・答えが同じなら、選び肢の並びがちがっても同じ問題）
  const keyOf = (P) => JSON.stringify([P.kind, P.scene, P.info || null, P.map || null, P.swatch || null, P.ans]);

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const BOUSAI = { KINDS, BY, LV, SRC, BAND, BANDMEAN, INFO, ACT, KIKI, W, H, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = BOUSAI; else root.BOUSAI = BOUSAI;
})(typeof self !== "undefined" ? self : this);
