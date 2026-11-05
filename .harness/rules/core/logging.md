# Logging policy

## 目的

ログは運用・障害対応・セキュリティ検知に必要な事実を、後から安全に相関できる形で残す。
製品固有の監視製品、保存先、法的保持期間はこの共通規約で決めず、projectで定義する。
外部サービスへの送信、credentials利用、本番設定の変更は[Safety](safety.md)の承認条件に従う。
拾った例外をエラー監視サービスやcrashログで開発者へ届ける流れは[Error reporting](error-reporting.md)に従う。

## 実装

- 既存のloggerと構造化イベント形式を使い、同じprojectで新しい形式や独自loggerを増やさない。
- 構造化はイベントの表現方針であり、JSON loggerや新しいlogging frameworkの導入を共通規約から要求しない。
- levelは既存慣習に合わせて`debug`、`info`、`warn`、`error`を使う。level名の意味を途中で変更しない。
- イベントには目的に必要な時刻、イベント名、結果、コンポーネント、相関識別子などをallowlistで渡す。
- 文字列を連結してログ行を組み立てず、loggerの構造化フィールドと安全なエンコードを使う。
- CLIなどでstdoutが機械可読出力の契約になっている場合、ログをstdoutへ混ぜず、既存のstderr・logger経路に従う。
- 外部入力、相関ID、ユーザー名、URLなどは未信頼の識別子として扱い、秘密として使わない。
- CR、LF、区切り文字、制御文字をサニタイズし、各フィールドとイベント全体に妥当なサイズ上限を設ける。
- ログ出力前にallowlistのフィールドだけを残し、redact・mask・hashが必要な値は必ずその処理を通す。

## 出力しないデータ

秘密・個人情報・決済情報の分類と、ログ以外の置き場所は[Sensitive data](sensitive-data.md)に従う。

- credential、password、access token、refresh token、cookie、session ID、秘密鍵、接続文字列を出力しない。
- PII、健康情報、政府識別子、認証情報を含む個人データは原則出力しない。必要性が明示された場合も最小化する。
- request・responseのraw body、Authorization等の秘密を含み得るheader、SQL文のbind値を出力しない。
- error payload、例外の外部向け本文、入力値を丸ごと記録して秘密や個人情報を漏らさない。

## levelと失敗

- `debug`は開発・診断に限定し、本番では既定で無効にする。短期的に有効化する場合は範囲と終了条件を記録する。
- `info`は通常の重要な状態、`warn`は回復可能な異常や要注意状態、`error`は処理失敗を表す。
- 同じ失敗を各層で重複して`error`にせず、責任を持って処理する境界で一度記録する。
- `error`では内部のstack traceを保護されたログに必要最小限で残し、利用者や外部応答へ漏らさない。例外message・cause・stack trace内の秘密も記録前に除去する。
- セキュリティ・監査上記録が必須の失敗は、実装時に対象イベント、必須フィールド、欠落時の扱いを明示する。
- ログ失敗で機密値をfallback出力しない。出力できない場合は業務継続・停止の方針を定義し、再帰的なログ出力を避けて安全に運用通知する。

## 量・保持・検証

- 高頻度イベントはbounded rate、集約、samplingを設計する。ただし監査必須イベントを無条件にsamplingしない。
- retention、アクセス制御、暗号化、削除時期はデータ分類とprojectの契約・法令要件に基づき定義する。
- ロガーのテストでは、allowlist、redaction、CR/LF、サイズ上限、level、重複しない失敗経路を確認する。
- 自動検査が意味上の秘密漏えいを完全には判定できないため、テストやheuristicを実施した事実だけで安全性を保証しない。
- 実運用で検知・相関に使うイベントは、projectの運用手順と受け入れ条件にも記録する。

## 参照

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
