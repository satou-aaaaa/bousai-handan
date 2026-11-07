// アプリのアイコン（icon-192.png・icon-512.png）を作る。生成りの地に、ハザードマップの色の帯と家、朱の「！」。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#f5efe2"/>
      <rect x="10" y="22" width="80" height="14" fill="#fff3a8"/><rect x="10" y="36" width="80" height="14" fill="#ffd2a6"/><rect x="10" y="50" width="80" height="14" fill="#ffa8a8"/>
      <rect x="10" y="64" width="80" height="10" fill="#a9d4f5"/>
      <rect x="10" y="22" width="80" height="52" fill="none" stroke="#1f2a44" stroke-width="2.5" rx="3"/>
      <path d="M26 44 L38 32 L50 44 L46 44 L46 56 L30 56 L30 44 Z" fill="#1f2a44"/>
      <circle cx="70" cy="42" r="13" fill="#b8402a"/><text x="70" y="49" font-size="20" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="900">!</text>
      <text x="50" y="92" font-size="14" text-anchor="middle" fill="#1f2a44" font-family="'Noto Sans CJK JP',sans-serif" font-weight="900">防災</text></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
