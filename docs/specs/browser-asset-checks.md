# 素材のブラウザー回帰試験とクリスマス素材

## 目的と範囲

素材選択から配置、SVG・PNG出力までを再実行できるようにする。Playwrightはビルド済みアプリのブラウザー操作を担当し、Harnessのtestsにも同じ npm run test:browser を必須検証として登録する。独立したCIジョブでも同じ試験コマンドを実行する。アプリにテスト専用の公開APIを追加せず、保存ボタンが生成するローカル保存データで配置数を確かめる。

- AC1 パーツの12カテゴリから各1点の代表素材を選べ、サムネイルと日英名が表示される。
- AC2 クリックごとに配置数が1個増え、最後に12個になる。
- AC3 SVGが解析でき図形を含む。SVG・PNGの寸法は指定した511 × 129 pxになる。
- AC4 ページ例外、console.error、ローカルHTTPエラー、通信失敗で試験が失敗する。
- AC5 GitHub Pagesと同じ /UInya/ 配下から実際のHTTPでビルド成果物を読み込む。
- AC6 クリスマス素材のサンタ帽とプレゼント箱も表示・配置・出力できる。

Google FontsのCSS応答だけを試験内で空のCSSに置き換える。アプリと素材のリクエストは実サーバーへ送る。外部フォントの描画品質はこの試験に含めない。

## 季節素材

| 素材ID | 日本語 | 英語 | 配置 |
| --- | --- | --- | --- |
| accent-cat-santa-hat | ねこのサンタ帽 | Cat Santa Hat | パーツ → アクセント |
| accent-paw-gift-box | 肉球のプレゼント箱 | Paw Gift Box | パーツ → アクセント |

100 × 100のviewBoxで、既存の暖色と輪郭に合わせた。CodexがSVGのパスと図形を記述し、第三者素材の取り込みや加工はない。配布はリポジトリのMITライセンスに従う。

## 実行

依存追加は固定した @playwright/test のみ。Playwright本体とcoreが推移依存に入る。

```sh
npm ci --ignore-scripts --no-audit --no-fund
npx playwright install chromium
npm run test:browser
```

試験コマンドが /UInya/ を指定してビルドし、127.0.0.1:4187でプレビューを起動・停止する。既存サーバーの再利用はしない。Linux CIではブラウザーのOS依存も入れるため install --with-deps chromium を使う。

失敗時の画面・トレースは test-results/、HTMLレポートは playwright-report/ に保存し、Git対象から除外する。
