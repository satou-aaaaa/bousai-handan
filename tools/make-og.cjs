// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、架空のハザードマップの見本だけ。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const col = ["#ffffff", "#fff3a8", "#ffd2a6", "#ffa8a8", "#e9a3e0"], rows = [[0, 0, 0, 0, 0], [1, 0, 1, 1, 0], [2, 1, 2, 2, 1], [3, 2, 3, 3, 2], [4, 3, 4, 4, 3]];
  const grid = rows.map((r) => r.map((v) => `<div style="width:64px;height:64px;background:${col[v]};border:1px solid #1f2a4433;box-sizing:border-box"></div>`).join("")).join("");
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:64px 80px;background:#f5efe2;background-image:linear-gradient(#dbe4ef 2px,transparent 2px),linear-gradient(90deg,#dbe4ef 2px,transparent 2px);background-size:40px 40px;color:#1f2a44;display:flex;gap:60px;align-items:center">
    <div style="flex:1">
      <div style="font-size:34px;color:#86291a;letter-spacing:.06em">地震・津波・大雨・ハザードマップ</div>
      <div style="font-size:112px;font-weight:900;margin-top:10px;letter-spacing:.08em;color:#142a52">防災の<span style="color:#b8402a">判断</span></div>
      <div style="font-size:44px;margin-top:10px;font-weight:700">そのとき、どう動く？</div>
      <div style="font-size:28px;margin-top:24px;color:#4f566a">内閣府・気象庁などの資料から・1日5問</div>
    </div>
    <div style="border:5px solid #1f2a44;border-radius:14px;overflow:hidden;background:#fff">
      <div style="display:grid;grid-template-columns:repeat(5,64px)">${grid}</div>
      <div style="height:40px;background:#a9d4f5;text-align:center;font-size:26px;font-weight:700;color:#0b2e4f;line-height:40px">〜 川 〜</div>
    </div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
