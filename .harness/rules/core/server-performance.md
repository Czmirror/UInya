# Server performance

サーバーの処理・API・DBの問い合わせ（ORM・SQL）・バッチを作る・変える場合と、画面やAPIが遅いという相談を調べる場合に適用します。
目的は、開発用の数件のデータで動いたことを完成とみなし、本番でデータが増えてから初めて遅くなる事故を防ぐことです。
ORMは、DBの行をプログラムのobjectとして扱う仕組みです（例: LaravelのEloquent、DjangoのORM、Prisma）。

既存ルールとの分担:

- ブラウザー・ゲーム側の描画・読み込みと、測り方・報告の基本は[Performance](performance.md)。
- SQLの組み立ての安全、transaction、timeoutは[SQL](../stacks/sql.md)。migrationの適用の承認は[Database](database.md)。
- 大量データの取り込みは[Data import](data-import.md)、管理画面の重い集計と出力は[Admin screens](admin-screens.md)、定期処理の分割は[Scheduled jobs](scheduled-jobs.md)。

## 想定する件数と目標

- 計画に、主なテーブルの想定件数（今と1〜3年後の目安）と、主な画面・APIの応答時間の目標を書く。数値は人間が決め、AIは候補と根拠を示す。決まるまでは計画と完了報告に「仮」と書く。
- 決めた値は、ステアリング`.harness/steering/tech.md`の「性能の目標」に書く。ステアリングがない導入先では`AGENTS.md`に書く。

## 問い合わせの数を件数に比例させない

N+1は、一覧の1回の問い合わせのあと、行ごとに関連先を1回ずつ問い合わせて、合計が「1＋件数」回になる問題です。
ORMは関連先を使った時点で自動で問い合わせるため、コードを読んだだけでは気づきにくくなります。

- 一覧で関連先を使うときは、まとめて読み込む（eager loading）。例: Laravelの`with()`、Djangoの`select_related()`・`prefetch_related()`、Prismaの`include`。
- 一覧の画面・APIを作る・変えるときは、1件のときと複数件（例: 10件）のときで問い合わせの数が同じことをtestで確かめる。数が件数と一緒に増えたらN+1。
  例: Laravelの`expectsDatabaseQueryCount()`、Djangoの`assertNumQueries()`。用意がない場合は、DBの問い合わせのログを数えるtest用の小さな仕組みで構わない。
  test用のDBがないprojectでは、理由を書いて「未検証」と報告する。
- 関連先の自動読み込みを開発中だけ例外にする機能がframeworkにあれば、有効にするかを計画で提案する。例: Laravelの`Model::preventLazyLoading(! $this->app->isProduction())`。
  既存のprojectでは今あるN+1が一斉に例外になるため、入れるか・直す範囲は人間が決める。
- ループの中から外部API・DBを1件ずつ呼ばない。まとめて取得するAPI、`IN`でまとめた問い合わせ、上限付きの並行実行を使う。外部APIにもtimeoutを付ける。

## 一覧に上限を付ける

- 画面・APIの一覧は、ページ分けか件数の上限を付ける。全件を返すのは、件数が少ないまま増えないと仕様で決まっている場合だけにし、理由を計画に書く。
- 利用者が1ページの件数を指定できる場合も、上限を決める。
- 深いページまで送る一覧では、`OFFSET`が後ろのページほど遅くなる。必要なら、前のページの最後の値から続きを取る方式（keyset方式）を検討する。
- 絞り込み・並べ替え・件数の数え上げはDBにさせる。全件を取ってからプログラムで絞らない（例: Laravelの`->get()->count()`ではなく`->count()`）。使わない大きな列（本文・バイナリ等）は取らない。

## indexを確かめる

indexは、本の索引のように、DBが該当する行をすぐ見つけるための仕組みです。

- 新しい検索条件・結合・並べ替えを作ったら、使う列にindexがあるかを確かめる。
- 想定件数が多いテーブルへの新しい問い合わせは、開発DBで実行計画（`EXPLAIN`で見られる、DBがどのindexでどう読むかの予定）を確かめ、全行を読んでいないかを見る。`EXPLAIN ANALYZE`等は実際に実行するため、[SQL](../stacks/sql.md)のとおり対象に応じた承認を確認する。
- indexの追加はmigrationなので、作成と適用は[Database](database.md)に従う。大きなテーブルへの追加は書き込みを止めることがあるため、lockの時間も計画に書く。
- indexは書き込みを遅くし容量も使う。使う問い合わせがないindexは足さない。

## 重い処理は応答の外へ

- メール送信、画像・動画の加工、PDF作成、外部への通知、大きな集計など、応答を待たせる処理はqueue（後で順に処理する仕組み）や非同期の処理に回し、画面には受け付けたことと結果の確かめ方を出す。
- どこから裏に回すかは、測った時間と、配信先のtimeout（Webサーバー、Vercel Functions・Cloudflare Workersの実行時間の上限等）から決める。

## キャッシュは最後の手段

- まず問い合わせとindexを直し、それでも目標に届かない場合にキャッシュを検討する。
- 入れるときは、何を、どの鍵（利用者・tenantを含める）で、どのくらいの時間覚えるかと、更新したときにいつ消すかを計画に書く。個人のデータを共有のキャッシュに入れない。

## 確かめ方と報告

- 一覧・検索・集計は、想定件数に近い件数のデータで確かめる。全部を用意できない場合は、件数を2〜3段階に増やし、時間と問い合わせの数がどう伸びるかを見る。開発用の数件だけで「速い」と判断しない。
- 完了報告に、確かめた件数、問い合わせの数、かかった時間、測った環境を書く。測っていなければ「未検証」と書く（[Performance](performance.md)の「報告」）。
- 本番で遅い問い合わせを見つける仕組み（DBの遅い問い合わせの記録、APM＝処理時間を計測するサービス）があれば、リリース後の確認で前の版と比べる。新しく入れるかは計画で提案し、人間が決める。
- DBサーバーの設定の調整、サーバーの台数・性能の選択、負荷試験（大量のアクセスを作って試すこと）は、このルールでは決めない。負荷試験が必要なら、対象環境と影響を示して別途承認を受ける。

## 一次資料

- [Laravel: Eager Loading / Preventing Lazy Loading](https://laravel.com/docs/12.x/eloquent-relationships#eager-loading)
- [Laravel: Database Testing（`expectsDatabaseQueryCount`）](https://laravel.com/docs/12.x/database-testing)
- [Django: Testing tools（`assertNumQueries`）](https://docs.djangoproject.com/en/5.2/topics/testing/tools/)
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
