# Review: tests

読む条件: 差分でtestを追加・変更した場合、または挙動を変えた場合。[Review](../review.md)の共通項目と併せて使います。
判断の基準は[Quality](../../rules/core/quality.md)と[Workflow](../../rules/core/workflow.md)の試験仕様書の節にあります。

- 試験仕様書の各ケースに対応するtestと実施結果があるか、手動ケースの未実施を成功にしていないか:
- testの妥当性・回帰・coverage:
- 対象stackが実動検証を要求する場合（[Runtime verification](../../rules/core/runtime-verification.md)）、実scene・描画・操作など必要な確認の証拠があるか。隔離test等で代替していないか、未実施なら障害・解除手順とBlockedが示されているか:
- データを表示する画面を変えた場合（[Display states](../../rules/core/display-states.md)）、0件・値の欠け・参照先の削除・読み込みの失敗の表示を確かめたか。Webのエラーページを変えた場合、ステータスコードと本番相当の設定での表示を確かめたか:
