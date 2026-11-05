# Review: data

読む条件: 差分がDB・migration・状態・データ形式に触れる場合、または計画に図（状態遷移・処理の流れ・テーブル）がある場合。
[Review](../review.md)の共通項目と併せて使います。
判断の基準は[Database](../../rules/core/database.md)と[Design boundaries](../../rules/core/design.md)の「図で示す設計」にあります。

- 一覧・検索の問い合わせ（1件と複数件で問い合わせの数が同じか、一覧の上限、使う列のindex。[Server performance](../../rules/core/server-performance.md)）:
- migrationの影響（既存データ、戻せるか、rollback手順）:
- 計画の図の各遷移・禁止遷移に対応するtest（遷移ごとに対応するtest名を挙げる。対応がない遷移は計画に理由があるか）:
