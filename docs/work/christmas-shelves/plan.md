# クリスマス素材を各棚に追加する

2026-11-26のユーザー依頼に従い、テンプレート・パーツ・用途別UI・シルエットに各1点以上を追加し、ブラウザー確認後にPRへまとめる。

基点はmainの7ca05fd。作業ブランチは codex/christmas-all-shelves。

1. 既存の配色、配置、SVGの読み込み方法を使い、リース・リボン・ごあいさつ・サンタ猫を追加する。
2. 仕様書と機能試験を記録し、既存のPlaywright試験へ4つの棚の確認を追加する。
3. Harnessの必須検証とブラウザー試験を実行し、描画した素材を目視確認する。
4. PRを作成してCI結果を確認する。

仕様は docs/specs/christmas-shelves.md、結果は docs/tests/functional/christmas-shelves.md。
