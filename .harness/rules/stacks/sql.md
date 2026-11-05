# SQL

## 適用範囲と方言

インデントはスペース2、UTF-8・BOMなし・LFは[共通規約](../core/coding-style.md)に従います。
.sqlファイルのほか、アプリ内の埋め込みSQL・ORMのqueryにも適用します。
候補検出は.sqlファイル名のみを確認し、DBへ接続しません。埋め込みSQLのみの場合は
Project Profileで使用言語と併せて`sql`を手動指定します。

- 対象DB、vendor・dialect、version、driver、schema、timezone、文字コード、既存のmigration・query builder設定を先に確認する。SQL標準だけで判断せず、採用DBの仕様と既存projectのformatter・命名規約を優先する。
- dialect固有の構文、型、予約語、NULLの挙動、transaction・lock・timeoutの既定値を明示し、別DBへの移植可能性を必要以上に仮定しない。
- SQL専用の新規依存やformatterを追加せず、既存のdialect-aware formatter / style checkをcheck modeで使う。適用対象とdialectを設定に記録する。

## クエリの組み立て

- 実行時に渡す値は、保存済みデータ由来も含め、必ずdriverのprepared statementまたはparameterized query APIでバインドする。1回限りの問い合わせでも、driverが提供するparameterized query呼び出しを使えばよく、手動でprepare objectを再利用することまでは要求しない。値を文字列補間、連結、手動の引用・エスケープでSQLへ埋め込まない。固定SQL内の定数リテラルは許容する。入力検証やエスケープはparameterizationの代替ではない。

  ```text
  sql = "SELECT id FROM users WHERE email = ?"  // placeholder style is driver/dialect-specific
  rows = db.query(sql, [email])                // values stay outside the SQL text
  ```
- 値placeholderでtable名、column名、SQL keyword、演算子、`ASC` / `DESC`などの識別子・構文を置き換えられない。動的な識別子やsort方向は、固定値からの明示的なallow-list・enum mappingで選び、可能ならdriverのidentifier-quoting APIを使う。未登録値は拒否する。
- ORM / query builderでもparameter bindingを使い、raw SQL、raw where、identifier fragment、order fragmentのAPIはSQL injection境界としてレビューする。ORMを使ったことだけを安全の根拠にしない。
- 可変長の`IN`は、要素ごとにplaceholderを生成して値を個別にbindするか、driver / DBが対応する配列・list bindingを使う。空配列のSQL文法と意味を先に定義し、未検証のカンマ区切り文字列を1個のplaceholderに渡さない。
- `LIKE` の検索語と検索パターンを別の意味として扱う。literal検索ではdialectの`ESCAPE`規則に従って`%`、`_`、escape文字をパターンとして処理し、前方・部分一致のwildcard付与は仕様として明示する。SQL文字列のエスケープとLIKE wildcardのエスケープを混同しない。

## NULL・transaction・実行制御

- `NULL`は通常の等価比較で判定せず、意図に応じて`IS NULL` / `IS NOT NULL`と三値論理を使う。任意のnullable値を値placeholderに渡すだけで条件が成立すると仮定しない。
- 複数文で一つの不変条件を更新する場合は明示的なtransaction境界を設け、成功時だけcommitし、例外・cancel・timeout時はrollbackまたは接続を安全に破棄する。transactionを長時間保持しない。
- 「検索して、なければ作る」処理は、同時に動くと両方が「なし」と判断して作成に進む前提で作る。重複してはいけない値は一意制約で守り、関連するレコード（例: 利用者と外部ログインの紐付け）は一括の作成かtransactionで不可分に保存する。一意制約違反のときだけ既存のレコードを読み直し、それ以外の失敗は握りつぶさない。testでは、2つの処理が同時に「なし」を読む場合と、関連レコードの保存だけが失敗する場合を再現する。
- isolation level、lock順序、競合時のretry条件をdialectに合わせて設計する。deadlock・serialization failureの再試行は上限・backoff・idempotencyを備え、重複書込みを起こさない。
- connection、statement、lock、transactionのtimeoutとcancel伝播を設定する。timeoutは失敗を検知するだけで整合性を保証しないため、rollback・再試行・利用者向けエラーを確認する。

## 権限・検証

- application roleは必要なschema・table・column・操作だけに限定し、read-only処理には書込み権限を与えない。`SELECT`であってもtenant境界、認可条件、機微列の公開範囲を検証する。関数呼び出し・lock・高負荷などの副作用も調べ、SELECTだから安全とはみなさない。EXPLAIN ANALYZE等はqueryを実行するため、実行対象に応じた承認を確認する。
- 管理画面の統計・集計・CSV出力のqueryは、本番の主DBへの負荷の避け方（読み取り専用の複製、事前の集計、上限、timeout）を[Admin screens](../core/admin-screens.md)の「統計・集計・データの出力」に従って計画に書く。
- unit testではparameterに引用符、改行、Unicode、NULL、wildcardを含む値を使い、SQL構文変更が起きないことと期待する検索意味を検証する。可変`IN`の0件・1件・複数件、identifier / sort allow-list外、transaction失敗、timeout、競合retryも確認する。
- integration testを行う場合は対象vendor・version・driverを固定し、隔離した専用DBと寿命を明記する。migration適用やDDL、データ削除・大量更新などの承認は[Database safety](../core/database.md)に従い、このstack規則では重複させない。
- このstackはSQL parserやDB runtimeを提供しない。静的な規則確認だけでSQLの構文・実行計画・権限・競合・性能が検証済みとは報告せず、実DB検証を省略した理由を記録する。N+1・一覧の上限・indexの確かめ方は[Server performance](../core/server-performance.md)に従う。

## 一次資料

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html)
- [PHP PDO::prepare](https://www.php.net/manual/en/pdo.prepare.php)
- [PostgreSQL Pattern Matching](https://www.postgresql.org/docs/current/functions-matching.html)
- [PostgreSQL Client Connection Defaults](https://www.postgresql.org/docs/current/runtime-config-client.html)
