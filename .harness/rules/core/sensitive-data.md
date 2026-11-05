# Sensitive data

秘密・個人情報・決済情報を「どこに置いてよいか」の横断ルールです。
ログの詳細は[Logging](logging.md)、AIによる秘密の読み取り・外部送信の承認は[Safety](safety.md)、
製品の入出力・認証・認可は[Security](security.md)に従います。このファイルはそれらを緩めません。

## 分類

分類によって正しい扱いが違うため、最初に該当する分類を決めます。複数に当たる値は厳しい側で扱います。

| 分類 | 例 | 基本方針 |
| --- | --- | --- |
| 秘密（credentials） | パスワード、API key、access token、秘密鍵、接続文字列、cookie、session ID | source・Git・ログ・AIの文脈に入れない。実行時に環境から注入する |
| 個人情報（PII） | 氏名、メールアドレス、電話番号、住所、生年月日、IPアドレス、政府識別子、健康情報 | 目的に必要な項目だけ扱う。出力先では仮名化・マスクする |
| 決済情報 | カード番号、有効期限、セキュリティコード（CVV）、口座番号 | 原則として自前で受け取らない。決済代行が発行するtokenだけを扱う |

決済代行のAPI key（secret key）は決済情報ではなく秘密として扱います。

## 置き場所

| 置き場所 | 秘密 | 個人情報 | 決済情報 |
| --- | --- | --- | --- |
| source code・Git管理の設定ファイル | 書かない | 実データを書かない | 書かない |
| Git履歴・commit message | 書かない。入ったら「漏えい時」の手順 | 書かない | 書かない |
| Git管理外の`.env`（ローカル開発） | 開発用の値に限り可 | 置かない | API keyのみ可。カード情報は不可 |
| 本番・共有環境の設定 | secret manager・実行環境の秘密設定から注入する | — | 同左 |
| ログ・error・URL・analytics・crash report | 出さない | 原則出さない。必要なら内部IDや仮名に置き換える | 出さない。カード番号の表示は末尾4桁まで |
| DB | パスワードはhashだけ（下記） | 目的・保持期間・アクセス権を決めて保存する | token・末尾4桁・ブランドのみ。CVVは暗号化しても保存しない |
| test・fixture・example・スクリーンショット | ダミー値 | 架空のデータ | 決済代行が公開しているtest用の番号 |
| AIへのprompt・計画・Issue・PR・memory | 書かない | 実データを書かない | 書かない |
| コマンドの引数 | 直接書かない。環境変数・ファイル・対話入力で渡す | — | — |

- `.env`はGit管理外であることを`.gitignore`で確認してから使う。共有用の雛形は値を空にした`.env.example`等にする。
- 本物の値をAIに見せる必要がある場合は、まずダミー値や`<REDACTED>`で足りないか検討する。
  足りない場合はSafetyの「secrets / credentialsの読み取り・利用」としてASKする。
- 外部の要約・翻訳・読み込みサービス（Jina等）へ渡す本文にも、この表を当てはめる。
- 計測（analytics）で送る値・環境の分け方・URLに載る情報の扱いは[Analytics](analytics.md)。
- エラー報告・crash reportで送る内容とsource mapの扱いは[Error reporting](error-reporting.md)。

## 決済情報

- カード番号の入力は、決済代行のhosted field・hosted page・SDK（token化）を使い、自分のserverに通さない設計を優先する。
  カード番号を自前で受け取る・保存する設計はPCI DSSの対象範囲が大きく広がるため、人間の明示的な判断なしに採用しない。
- CVVは認証後に保存しない。有効期限・カード番号を保存する必要がある場合も、決済代行のtokenで代替できないかを先に確認する。
- 決済手段の登録・更新の画面での本人確認・回数制限・拒否理由の扱いは、[Security](security.md)の「重要な情報の更新」に従う。

## パスワードの保存

- 利用者のパスワードは、言語・frameworkの標準実装にある専用のhash関数（Argon2id、scrypt、bcrypt等）で保存する。
- 平文・可逆暗号・汎用hash（SHA-256単体、MD5等）で保存しない。設定値は[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)を参照する。
- パスワードの再表示・メール送信をしない。再設定は期限付きの使い捨てtokenで行う。

## 漏えい時

- 秘密・個人情報・決済情報の混入に気付いたら作業を止め、値を再表示・再送信せずに、場所（file・commit・ログ）だけを人間に報告する。
- 一度commit・pushした秘密は、履歴から消しても漏えいしたものとして扱い、無効化と再発行（rotate）を優先する。
- 履歴の書き換え（rebase、filter等）は[Git safety](git.md)の承認が必要な操作。証拠を隠す目的で行わない。

## 機械的な確認の限界

- [Guard hooks](../../docs/guard.md)は、AIが秘匿ファイル（`.env`、鍵ファイル等）を読む操作を止める補助です。
- Harnessの`scripts/check-secrets.mjs`（導入先では`.harness/scripts/`等。bootstrapが必須checkの`secrets`として生成）は、
  秘密鍵・一部のtoken・カード番号らしき値の限定patternだけを検出します。値は出力せず、fileと種類だけを報告します。
  stageした内容と作業ツリーが違うfileは両方を見ます。5 MiBを超えて読めないfileがあると失敗にします（理由を記録して`--exclude`）。
  Harness自身の`secrets-heuristic`も同じ判定を使います。
  主要な決済代行のtest番号は除外済みです。それ以外の公開test番号（3-D Secure用など）を書く行には`harness:test-card`を書き添えます。
  passedは「限定patternに当たらなかった」という意味で、秘密がないことの証明ではありません。
- 個人情報は形式が多様なため機械的には検出しません。検出されないことを安全の証拠にせず、差分を確認します。

## 一次資料

- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP User Privacy Protection](https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html)
- [PCI Security Standards Council](https://www.pcisecuritystandards.org/)
