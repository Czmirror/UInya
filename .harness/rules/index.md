# Rule discovery

## 読み込みの原則

読むものは、毎回読む「ステアリング」と、条件に当たった時点で読む「必要時の文書」に分けます。

- ステアリング: 下の「常に読む」3件と、導入先projectの`.harness/steering/`にある
  `policy.md`（基本方針・言語の運用）、`tech.md`（技術スタック）、`project.md`（案件情報）。作業開始時に毎回読みます。
  `.harness/steering/`がない導入先では、`AGENTS.md`の「Project固有ルール」に書かれた同じ項目をステアリングとして読みます。
- 必要時の文書: 下の条件付きルール、stackのルール、templates、`docs/`・`examples/`・過去の`docs/work/`。

必要時の文書は次のように扱います。

- 作業開始時に先回りして読まない。「念のため」全ルール・全文書を読むことはしない。
- 条件に当たった時点で読む。計画時に分かれば計画時に、実装中に判明したら（例: 途中でDBに触れると分かった）その時点で読む。
  読んだ結果で計画・重要仕様・リスクが変わる場合は、[Workflow](core/workflow.md)の遷移どおりPlanへ戻る。
- 条件に当たるか判断がつかない場合は読む。読み込みを減らすことを、適用すべきルールを省く理由にしない。
- templatesは、そのtemplateを使う工程で読む。`docs/`・`examples/`・`docs/work/`は、ルール・作業対象・人間から参照されたときだけ読む。
- コード・ログ・生成物・大きなファイルは、検索で対象を絞り、必要な範囲を読む。全体の一括出力はしない。
- 新しいsessionや委任先でも、ステアリングは読み直す。読み込みは引き継がれない。

ステアリングは毎回読むので、要点だけを書き、詳細は別の文書に置いて場所を示します。
ステアリングの内容とmanifest・lockfile・実行環境などの実態が食い違う場合は、実態を確認して人間に報告し、ステアリングの更新を提案します。
ステアリングは共通rulesを緩めません。秘密・個人情報・決済情報は書きません（[Sensitive data](core/sensitive-data.md)）。

## 条件と追加ルール

常に読む: [Safety](core/safety.md)、[Workflow](core/workflow.md)、[Quality](core/quality.md)。
Gitを扱う場合: [Git](core/git.md)。DBを扱う場合: [Database](core/database.md)。
ファイルを編集する場合: [Coding conventions](core/coding-style.md)。
コードを設計する場合（実装を伴わない設計依頼を含む）: [Coding principles](core/principles.md)。
コードを書く・変更する場合（新しいファイル・関数の追加、既存ファイルへの機能追加、リファクタリングを含む）: [Coding principles](core/principles.md)と[Comments](core/comments.md)。
アプリケーションの機能・境界を変更する場合: [Security](core/security.md)。
入力・外部データを扱う場合（仕様に記載がなくても）: [Input validation](core/input-validation.md)。
設計・責務・依存関係を変更する場合: [Design boundaries](core/design.md)。
状態（通知済みフラグ、ステータス、リトライ回数など、操作をまたいで保持され挙動を変える値）や、componentや外部I/Oをまたぐ処理の流れ、テーブル・関連を追加・変更する場合（責務の変更がなくても）: [Design boundaries](core/design.md)の「図で示す設計」。
ログ・例外処理・監査記録を変更する場合: [Logging](core/logging.md)。
秘密・個人情報・決済情報を扱う場合、または設定・環境変数・test dataを追加する場合: [Sensitive data](core/sensitive-data.md)。
コード・APIドキュメントを変更する場合: [Comments](core/comments.md)。
PR本文・完了報告・計画・Issue・CHANGELOG・ソースのコメントなど、人が読む文章を書く場合: [Writing for humans](core/writing.md)。
バッチ処理・定期実行（cron、scheduler、Cron Triggers、`schedule`）を追加・変更する場合、定期処理が動かない・二重に動くといった問題を調べる場合、または祝日・営業日・休業日で処理を変える場合（出荷日・納期・支払日の計算など）: [Scheduled jobs](core/scheduled-jobs.md)。
メール（通知・パスワードの再設定・一斉送信・自動返信など）を送る機能を追加・変更する場合、送信の設定（送信サービス・送信元のドメイン）を変える場合、またはメールが届かない・迷惑メールに入るといった問題を調べる場合: [Email](core/email.md)。
CI/CDの設定・release手順を変更する場合、CIの失敗に対応する場合、deployの流れを設計する場合: [CI/CD](core/cicd.md)。
リリース・versionの更新・CHANGELOGやリリースノートの作成・tag付けを頼まれた場合: [Release](core/release.md)。
CHANGELOGを持つprojectで、利用者に見える挙動・公開API・CLI・設定・データ形式を変える場合（CHANGELOGの更新を頼まれていなくても）: [Release](core/release.md)の「普段の変更でのCHANGELOG」。
画像・音声・フォント・3Dモデルなどの素材や静的ファイルを追加・変更・移動・加工・最適化する場合（置き場所・ファイル名・大きなファイル・元データ・使っていない素材、重い・大きいといった相談を含む）: [Assets](core/assets.md)。
画面・UIの見た目を作る・整える場合（プロトタイプ、見た目の案を複数出す場合、デザインツールの成果物の取り込みを含む）、画面を新しく作る・画面の部品や流れ（どのボタンでどの画面へ進むか）を変える計画を立てる場合: [UI visual](core/ui-visual.md)。
管理画面・業務画面・社内ツールなど、担当者がデータの登録・変更・削除・承認・送信を行う画面を作る・変える場合、担当者の権限を付与・変更する機能や統計・集計の画面、データの出力（CSV等）を作る・変える場合: [Admin screens](core/admin-screens.md)。
Unity・Godotなど、stackのルールが実動検証を求める環境で実行時の挙動を変更する場合: [Runtime verification](core/runtime-verification.md)。
Webサイト・Webアプリ・ゲームのWeb出力をbuild・配信する設定、キャッシュ・header・配信先を作る・変える場合、または「直したのに反映されない」を調べる場合: [Web delivery](core/web-delivery.md)。
描画・更新処理・読み込み・素材・依存の変更がフレーム時間・読み込み時間・メモリ・配信サイズに影響しうる場合、遅い・重いという相談を調べる場合、性能の目標を決める場合: [Performance](core/performance.md)。
サーバーの処理・API・DBの問い合わせ（ORM・SQL）・バッチを作る・変える場合、または画面やAPIが遅いという相談を調べる場合: [Server performance](core/server-performance.md)。
ゲームの入力処理・操作説明・キー割り当てを設計・変更する場合、新しい入力デバイス・platform（スマホ、ゲームパッド等）に対応する場合: [Controls](core/controls.md)。
ゲームのセーブデータ（進行状況・設定など）の保存・読込を追加・変更する場合、またはstackのルールがデータ保存の初回確認を求める場合: [Save data](core/save-data.md)。
ゲームのロジック・乱数・入力処理を設計・変更する場合、またはゲームのバグを調べる場合（Unity・Godot、または導入先が対象に加えたstack）: [Game replay](core/game-replay.md)。
利用状況の計測（アクセス解析・イベント計測等）や、ゲームのプレイ記録を追加・変更する場合: [Analytics](core/analytics.md)。
広告・アフィリエイトのリンクや紹介記事・寄付のリンク・有料機能・販売・ゲーム内課金を追加・変更する場合、または公開するWebサイト・アプリ・ゲームを新しく作る場合: [Monetization](core/monetization.md)。
エラー・crashの捕捉や報告（エラー監視サービス、crashログ、エラーの通知）を追加・変更する場合、または公開後のエラーを調べて直す場合: [Error reporting](core/error-reporting.md)。
依存・外部コードを追加・更新・取り込む場合、ライブラリ化の調査・切り出しを頼まれた場合、または自作ライブラリの保守の状態・CI・依存の更新・保守終了を扱う場合: [Libraries and dependencies](core/libraries.md)。
利用者が入力した内容（投稿・コメント・ユーザー名・プロフィール・チャット・ランキングの名前など）を他の利用者に表示する機能を追加・変更する場合、またはNGワード・予約語の判定を作る・直す場合: [User content](core/user-content.md)。
データを一覧・詳細・集計・グラフとして表示する画面を作る・変える場合、Webのエラーページ（404・500等）・メンテナンス表示を作る・変える場合、または画面が真っ白になる・「undefined」が出る・エラー画面がおかしいといった問題を調べる場合: [Display states](core/display-states.md)。
アプリやツールがPDFを作る機能（請求書・帳票・レポート・PDFでの保存等）を追加・変更する場合、またはPDFの崩れ・文字化けを調べる場合: [PDF output](core/pdf-output.md)。
ファイル（CSV・Excel・JSON等）やAPIでデータをまとめて取り込む機能、または別システムからのデータ移行を作る・変える場合、取り込みが遅い・メモリやtimeoutで落ちるといった問題を調べる場合: [Data import](core/data-import.md)。
projectのライセンス・著作権表示を追加・変更する場合、クレジット画面やライセンス文の表示を作る・更新する場合、配布物・公開物を作る場合（クレジット表記・ライセンス文が必要な素材・依存を追加・削除した場合を含む）: [Credits](core/credits.md)。

`.harness/project.json`の`stacks`はパス単位の適用情報です。
検出ツールは候補を示すだけなので、manifest・対象version・既存慣習を調べて確定してください。

| 対象 | 追加ルール |
| --- | --- |
| HTML / CSS / ブラウザJavaScript | [web](stacks/web.md) |
| TypeScript | [typescript](stacks/typescript.md) |
| Next.js | [nextjs](stacks/nextjs.md) + Web + 使用言語 |
| PHP | [php](stacks/php.md) |
| Laravel | [laravel](stacks/laravel.md) + PHP + Database |
| Go | [go](stacks/go.md) |
| Python | [python](stacks/python.md) |
| Rust | [rust](stacks/rust.md) |
| SQL（埋め込みSQL・ORMのqueryも含む） | [sql](stacks/sql.md) + Database |
| C# | [csharp](stacks/csharp.md) |
| Unity | [unity](stacks/unity.md) + C# |
| Godot | [godot](stacks/godot.md) + C#使用時はC# |
| GitHub Actions（`.github/workflows/`） | [github-actions](stacks/github-actions.md) + CI/CD |
| その他 | Core + プロジェクト固有の承認済み設定 |

Frameworkのルールは言語ルールを補足します。Project固有制約はCoreを緩めずに追加します。
矛盾がある場合は危険側へ解釈せず停止し、人間と解決します。
製品側のsystem policyや実行環境の制限を、このリポジトリで上書きすることはできません。
