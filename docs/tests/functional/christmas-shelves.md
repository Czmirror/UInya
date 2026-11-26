# クリスマス素材棚の機能試験

対象は docs/specs/christmas-shelves.md。
tests/browser/assets.spec.ts の Christmas collection spans all four shelves で実行する。

| ケース | 条件 | 確認 | 結果 |
| --- | --- | --- | --- |
| FT1 | AC1・AC2 | テンプレート、パーツ、シルエット、用途別UIを順に追加する。 | 成功 |
| FT2 | AC2 | 保存データの図形数が1、2、3、6へ増える。 | 成功 |
| FT3 | AC3 | SVGの図形と寸法、PNGの寸法を確認する。 | 成功 |

2026-11-26、CodexがPlaywright付属Chromiumと /UInya/ 配下のローカルHTTPで確認。出力は511 × 129 px。
リース、リボン、サンタ猫はSVGからPNGへ描画して輪郭・配色を目視確認した。
既存の全素材との組み合わせは未確認。次は、組み合わせた見た目の回帰確認を充実させる。
