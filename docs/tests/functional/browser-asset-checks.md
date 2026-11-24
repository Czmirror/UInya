# 自動試験の確認結果

対象仕様は [素材のブラウザー回帰試験](../../specs/browser-asset-checks.md)。
対応する実行コードは tests/browser/assets.spec.ts。

| ケース | 受け入れ条件 | 自動試験 | 結果 |
| --- | --- | --- | --- |
| FT1 | AC1・AC2 | all twelve categories place parts and export at the requested dimensions | 成功 |
| FT2 | AC3・AC4・AC5 | 両試験のダウンロード確認と共通エラー監視。試験中のHTTP配信は /UInya/ 固定。 | 成功 |
| FT3 | AC6 | Christmas accessories can be placed and exported | 成功 |

2026-11-24、CodexがmacOS・Node.js 24・Playwright付属Chromiumで実行。2件成功。512 × 512の既定値とは異なる511 × 129を使い、指定寸法の反映を確認した。新しい季節素材は別途PNGに描画して目視確認した。

GitHub ActionsのLinux・Node.js 22での実行は未実施。pushと公開操作を行わない今回の依頼に従い、ワークフローはローカル差分に留める。既存のSvelteKitとSvelteの互換性警告は残る。
