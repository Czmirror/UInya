# Quality gate

コード・設定・ドキュメントの編集では[Coding conventions](coding-style.md)も適用します。

完了報告前に以下を検証し、結果・根拠・未実行理由を記録してください。

- lint、formatting、typecheck、既存test、buildの成功。
- 重要な新規・変更ロジックへのtest。境界値、失敗経路、認可・データ境界を含める。
- 既存coverageを悪化させない。固定率は設けず、比較できない場合はその理由を記録。
- 明らかなsecurity問題、source codeやログへのsecrets混入がないか点検。
- [アプリケーションのsecurity](security.md)と[入力検証](input-validation.md)について、適用する対策・異常系test・未決定事項を確認。
- dependency追加理由（[Libraries and dependencies](libraries.md)）、public API変更、DB schema変更を明示。
- 文書の不整合を修正し、受け入れ条件を確認。
- 試験仕様書（[Workflow](workflow.md)の「試験仕様書」）がある場合、各ケースと実施結果・対応するtestを照合。
- 変更に伴う[コメント・API説明](comments.md)の更新と、[ログ](logging.md)の機密情報・level・調査可能性を確認。
- 対象stackが要求する実動検証（[Runtime verification](runtime-verification.md)）を実施し、コンパイルや隔離testと別に証拠・残件を確認。必須検証が残る場合は[Workflow](workflow.md)のBlockedとして扱う。
- AIによるfinal diff reviewを実施し、指摘を修正・再検証。

適用しないチェックは理由を示して`skipped`にします。
必須チェックの失敗・実行不能を成功として報告しません。
重要な新規ロジック以外の単純な文言変更などに、形式だけのtestを追加する必要はありません。

Project Profileは必要なチェックを明示します。既存のlint・test設定を無断で弱めないでください。
必須checkを削除・skip化する変更も品質基準の変更として計画に示し、人間レビューを受けます。

Runnerの`passed`は「設定された実行チェックが成功」の意味に限ります。
skip項目、人間レビュー、受け入れ条件、未設定のsecurity scannerまで成功した意味ではありません。
実行したrevision・差分、コマンド、結果を残し、検証後に変更した場合は影響する検証を再実行します。
testログや生成artifactに秘密情報がないことも確認してください。

## 検証の穴

設定されていない検証は、Runnerが`passed`でも実行されていません。
Investigateで、今回の作業に関係する範囲について次を確認します。

- `.harness/project.json`が無い、または`validate-config.mjs`が失敗・警告する。
- skipの理由が雛形のまま（`Example only:`で始まる）、または導入済みのtoolがあるのにskipしている（例: `package.json`に`lint`のscriptがあるのにlintをskip）。
- 文字コード・改行の検査（[Coding conventions](coding-style.md)）がformatの段に無い。
- 変更する機能に機能試験の仕様があるのに、それを実行するE2E・browser testがProfileに無い。
- CIが無い、またはCIがProfileと別のコマンドを実行している（[CI/CD](cicd.md)）。CIの雛形は`templates/ci/github-actions.yml`。
- securityの段が秘密の検査だけで、依存の既知の脆弱性を調べる検査が無い。

見つけたら、計画の検証手順の後に「検証の穴」として、足りない段、具体的なコマンド案、必要な依存追加やCIの変更、実行時間の目安を示します。
今回の作業はそのまま進めます。提案の実装は品質基準の変更なので、人間の承認を得てから行います。依存追加とCIの変更は[Safety](safety.md)のASKに従います。

人間が見送った提案は、[Workflow](workflow.md)の「範囲外で見つけたこと」の置き場所に1行で記録します。
次の作業では記録を確認し、状況が変わらない限り同じ提案を繰り返しません。

## 証拠の種類と未確認の扱い

[Workflow](workflow.md)で選んだ確認対象を、計画からレビュー・完了報告まで参照します。
自動検証のコマンド・結果、AIレビューの対象・判断根拠、人間の承認対象・出典を分けて報告します。
Runner連携、コメントの意味確認、仕様承認、新規sessionでのルール発見・承認前停止は別の確認です。
ある種類の成功を他の種類の証明に流用せず、AIの自己レビューと独立レビューも区別します。

- 適用外: 今回不要な理由を示す。成功とは数えない。
- 未実施: 必要な確認を行っていない理由と残る範囲を示す。
- 未確定・未確認: 決定事項または証拠が足りない。承認済み・達成済みと扱わない。
- 問題あり: 不一致や失敗の根拠と対応を示す。未実施や適用外へ置き換えない。

上記は運用報告の区別であり、Runnerのstatusやschemaを拡張するものではありません。

## コメント・責務の意味レビューの結果

[Workflow](workflow.md)の責務・コメント確認は、Runnerの実行結果と分けて記録します。
不足が見つかった場合は、場所・根拠・修正または分割延期の理由と承認の出典を示します。
未確認・未解決を「テストが通った」「動く試作だから」という理由で準拠済みに変えません。
承認された分割延期は、未実施の分割と残る影響として報告し、全体を無条件に準拠済みと表現しません。
観察できていない新規sessionでの実装遵守も、自己レビューや検査成功から推定しません。
