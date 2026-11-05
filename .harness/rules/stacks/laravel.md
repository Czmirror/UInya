# Laravel

[PHP](php.md)と[Database](../core/database.md)を追加で読みます。

- validationとpolicy / gate等による認可を入口で確認する。
- mass assignment、N+1、transaction境界、tenant境界を点検する。
- 一覧の関連先は`with()`でまとめて読み、件数の数え上げは`->count()`でDBにさせる。一覧のtestでは`expectsDatabaseQueryCount()`等で問い合わせの数が件数で増えないことを確かめ、`Model::preventLazyLoading()`を開発中だけ有効にするかを計画で提案する（[Server performance](../core/server-performance.md)）。
- queue jobの再試行・冪等性と、transaction完了前の外部副作用を確認する。
- 大量データのインポートは`LazyCollection`・`chunk`とqueue jobで処理し、進み具合と結果を記録する（[Data import](../core/data-import.md)）。
- 定期処理はscheduler（`routes/console.php`等）に書き、サーバーのcrontabには`schedule:run`の1行だけを置く。その1行もprovisioningのコードか手順書に残す。複数サーバーでは`onOneServer`（atomic lockに対応したcache driverが必要）、長い処理は`withoutOverlapping`を検討する（[Scheduled jobs](../core/scheduled-jobs.md)）。
- testで使うDBの接続先を確認する。DB初期化traitもmigration適用の承認対象。
- migration生成と適用、seed、cache変更等のartisan操作の副作用を区別する。
- `.env`やAPP_KEYなどの機密をsource・ログへ出さない。

このスタックはルール提供段階で、Laravel環境での実動検証は未実施です。
