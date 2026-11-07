# 防災の判断

地震・津波・大雨の場面で「次にどう動くか」を選び、架空の町のハザードマップを読む1日5問のゲーム。押すだけ、時間制限なし。

- 遊ぶ: https://satou-aaaaa.github.io/bousai-handan/
- 今日の5問（やさしい2・ふつう2・むずかしい1）はだれでも同じで1日1回。上級（むずかしい3問・ヒントなし）、練習（何度でも）、とことん（まちがえても続く・好きなだけ）、解いた種類の「覚えること」が集まる「防災ノート」があります。
- まちがえても選び直せます。正解すると「なぜ」と出典が出ます。ヒントは「見るところ」→「選び肢を2つにしぼる」の2段です。
- ハザードマップの問題は毎回つくり変えるので、同じ問題が続きません（浸水の深さを読む・家にとどまれるか・どこへ逃げるか）。
- 見やすさの設定（読みやすい文字・色の見分け・動きを減らす・読み上げ）と、記録を別の端末へ移す「引き継ぎ」があります。

## 中身の出どころ

場面と答えは、次の公的な資料で確かめた内容だけで作っています。地図の町・学校・公園の名前は架空です。

- [内閣府 避難情報に関するガイドライン（令和8年3月）](https://www.bousai.go.jp/oukyu/hinanjouhou/r3_hinanjouhou_guideline/pdf/hinan_guideline_r8_3.pdf)：警戒レベル1〜5と行動、情報の名前（レベル4 氾濫危険警報など）、レベル5は必ず出るとは限らない
- [首相官邸 地震発生時の行動](https://www.kantei.go.jp/jp/headline/bousai/jishin.html)：場所ごとの身の守り方
- [首相官邸 津波から身を守る](https://www.kantei.go.jp/jp/headline/bousai/tsunami.html)：津波注意報・警報・大津波警報、海岸から離れ高い所へ
- [首相官邸 避難の考え方](https://www.kantei.go.jp/jp/headline/bousai/hinan.html)：避難場所は災害の種類ごと、家にとどまれる3つの条件
- [首相官邸 災害に対するご家庭での備え](https://www.kantei.go.jp/jp/headline/bousai/sonae.html)：飲み水は1人1日3リットル・3日分（大きな災害は1週間分）、171、家具の固定
- [首相官邸 大雨・台風に備える](https://www.kantei.go.jp/jp/headline/bousai/taifu_ooame.html)：川や田んぼを見に行かない、忘れ物を取りに戻らない
- [気象庁 キキクル（危険度分布）](https://www.jma.go.jp/jma/kishou/know/bosai/riskmap.html)：黄・赤・紫・黒と警戒レベル
- [気象庁 洪水から身を守るには](https://www.jma.go.jp/jma/kishou/know/ame_chuui/ame_chuui_p8-2.html)：レベル4までに避難を終える
- [国土交通省 江戸川河川事務所 浸水深の目安](https://www.ktr.mlit.go.jp/edogawa/edogawa00746_2.html)：0.5m で1階床上・3m で2階床・5m で2階が水につかる
- [国土交通省 家屋倒壊等氾濫想定区域](https://www.mlit.go.jp/river/bousai/main/saigai/tisiki/syozaiti/)

本当の災害のときは、住んでいる市町村の避難情報と、その地域のハザードマップに従ってください。自分の家のまわりは [重ねるハザードマップ](https://disaportal.gsi.go.jp/) で見られます。

## 記録と通信

記録は遊ぶ人のブラウザにだけ残り、ゲームから自動で外へ送ることはありません。例外は2つ：文字（Google Fonts）を読み込むとき、まだ端末に保存が無ければ Google に IP アドレスが届きます。「Xで投稿」「LINEで送る」「結果をシェア」を押したときだけ、結果の文が選んだ先に渡ります（問題と答えは入りません）。

## 開発

```bash
bash scripts/setup.sh   # 最初に一度
node qa/run.mjs         # 検査（CI と同じ）
```

問題の作り方は `gen.js`（決まりは AGENTS.md）。

感想は [Issue のフォーム](https://github.com/satou-aaaaa/bousai-handan/issues/new?template=feedback.yml) からどうぞ。
