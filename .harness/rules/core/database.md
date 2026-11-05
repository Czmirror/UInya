# Database safety

SQL・ORMのqueryを作成・変更する場合は[SQL rules](../stacks/sql.md)も適用します。

migrationファイルの設計・生成と、DBへの適用は別操作です。
AIは承認済み計画に沿ってファイルを作成できますが、適用には人間の明示的承認が必要です。
generatorが自動接続・適用する場合は、生成コマンド自体もASKになります。

以下はASKです: migration適用、CREATE、DROP、ALTER、TRUNCATE、データ削除・大量UPDATE、production DB操作。
接続にcredentialsを使用する場合もSafetyのASK条件を適用します。

承認前に、対象環境・DB・schema・想定件数・lock時間・停止時間・データ損失・復旧方法を確認します。
破壊的変更は段階的なexpand / migrate / contract等の代替を検討してください。
rollback migrationが存在してもデータが復元できるとは限りません。
backupからの復元可否、復旧手順、前進修正の選択肢を説明します。

integration testがschemaを変更する場合も同じルールです。
専用の使い捨てDBは対象・寿命・操作範囲を限定した事前承認を利用できます。
単に環境名が`test`であるだけでは、隔離や破壊許可の証拠になりません。

アプリが起動時に自分専用のローカルファイル（SQLite等）へ`CREATE TABLE IF NOT EXISTS`する場合も、
そのコードを書くことと実行することを分けます。実行もCREATEなのでASKですが、対象ファイル・test用の使い捨てDB・
許可する文（作成のみ、既存データを消さない等）を計画のASK欄に書けば、計画承認と同時に限定した事前承認を受けられます。
共有DBや既存データのあるファイル、DROPや破壊的なALTERを含む初期化は、この事前承認の対象にしません。
