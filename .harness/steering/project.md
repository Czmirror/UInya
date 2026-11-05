# 案件情報

UInyaは猫モチーフのゲームUI素材を作るSVGエディター。主な利用者は、UnityやGodotなどでゲームを作るクリエイター。

## ソースの地図

- `src/routes/+page.svelte` はエディター画面の入口。
- `src/lib/components/` は素材選択、キャンバス、プロパティ、ツールバー、書き出しのUIを担当する。
- `src/lib/stores/` は編集状態と言語設定を保持する。
- `src/lib/templates/` と `static/` はテンプレート定義とSVG素材を保持する。
- `static/templates/collections/` は素材棚で切り替えられる3つのSVGコレクションを保持する。
- `static/brand/` はエディターのマスコット画像を保持する。
- `.harness/` は開発ルールと検証設定を保持する。

製品の説明は `README.md`、既存の仕様とデザイン方針は `CLAUDE.md` にある。既知の問題はGitHub Issueで管理する。
