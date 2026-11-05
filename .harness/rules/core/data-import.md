# Data import

利用者や管理者がファイル（CSV・Excel・JSON等）やAPIでまとめてデータを取り込む機能（インポート）を作る・変える場合と、
別のシステムからの一回限りのデータ移行のscriptを作る・変える場合に適用します。取り込みが遅い・メモリやtimeoutで落ちるといった問題を調べる場合にも読みます。
件数が少ないと決まっている入力欄（数件の一括登録など）は対象外です。

目的は、少ない件数のデータでしか試さず、本番の大きなファイルで初めて`memory_limit`（PHPが1回の処理で使えるメモリの上限）やtimeoutに当たる事故と、
途中で止まったときに「どこまで入ったか分からない」「やり直したら二重に入った」という事故を防ぐことです。

既存ルールとの分担:

- 各行の型・必須・上限などのチェックの中身は[Input validation](input-validation.md)。
- アップロードされたファイルそのものの安全（size・content type・保存先）は[Security](security.md)。
- 裏で動かす処理の多重実行・timeoutは[Scheduled jobs](scheduled-jobs.md)とstackのルール（例: [Laravel](../stacks/laravel.md)のqueue）。
- 実行前に件数と影響を示す画面、データの出力（エクスポート）は[Admin screens](admin-screens.md)。
- AIが本番でインポート・データ移行を実行する操作の承認は[Database](database.md)と[Safety](safety.md)。
- メモリ・時間の測り方の考え方は[Performance](performance.md)。

## 上限を決める

- 1ファイルの大きさと件数の上限を決める。数値は業務の値なので人間が決め、AIは候補と根拠（今あるデータの件数、使う環境の制限）を示す。決まるまでは計画と完了報告に「仮」と書く。
- 使う環境の制限を確かめて計画に書く。
  例: PHPの`upload_max_filesize`・`post_max_size`・`memory_limit`・`max_execution_time`、Webサーバーやロードバランサーのリクエストの大きさとtimeout、Cloudflare Workers・Vercel Functions等のリクエストの大きさ・実行時間・メモリの上限。
- 上限を超えたら、処理を始める前に「何MB・何件まで」と分かるメッセージで断る。

## 全件をメモリに載せない

- ファイルは1行ずつ・一定件数ずつ読みながら処理する。全行を配列にしてから処理しない。
  例: PHPの`SplFileObject`・generator、Laravelの`LazyCollection`、Node.jsのstream、Pythonの`csv`をiteratorとして使う。
- Excelは、少しずつ読めるlibraryの読み方を使う。展開後の大きさにも上限を付ける（xlsxはzipなので、小さなファイルが巨大に展開されることがある）。
- ブラウザーから送る場合は、1回に送る量に上限を決める。大きいデータは、ファイルのままアップロードしてserverで少しずつ読むか、一定件数ずつ分けて送る。
  分けて送る場合は、全部届いたことをserverで確かめてから「完了」にする。
- `memory_limit`・timeoutを上げて解決しない。次のもっと大きいファイルで同じように落ちるため。
  上げるしかない場合は、理由・値・同じserverの他の処理への影響を計画に書き、人間の承認を受ける。

## 長い処理は裏で動かす

- 画面のリクエストの中で終わらない件数は、queue・バッチで裏で動かす。どの件数から裏に回すかは、測った時間とtimeoutから決める。
- 画面には、受け付けたこと、進み具合（処理済みの件数と全体の件数）、結果（成功・失敗・エラーの行の数）を出す。終わったら知らせる。
- 同じファイルの取り込みを、二重に始められないようにする（ボタンの連打、画面の再読み込み）。

## 途中で止まっても続きから

- インポート1回ごとに記録を作る: 誰が・いつ・どのファイル・状態（受付・処理中・完了・失敗）・処理済みの件数・エラーの件数。
- transaction（全部成功か全部取り消しかをまとめる仕組み）は一定件数ごとに区切る。全件を1つのtransactionにしない（lockが長く続き、他の画面が止まるため）。
- 再開・やり直しで同じ行が二重に入らないようにする。方法は、業務上の一意な値（社員番号・商品コード等）での「あれば更新・なければ追加」、一意制約、インポートのIDと行番号の記録から選ぶ。
  どの値を一意とみなすかは業務の判断なので、提案する仕様として人間が決める。
- 全件を取り消せるようにしたい場合（全部入るか、何も入らないか）は、仮のtableに入れてから切り替える等の方法を計画で選ぶ。

## チェックとエラーの返し方

- エラーは、行番号・列・理由を一覧で返す。最初の1件で止めず、全件をチェックしてからまとめて返す。
  一覧が多すぎる場合は、画面に出す件数の上限を決め、残りはエラーの行だけのファイルで返す等にする。
- 一部の行にエラーがあったときの扱い（何も入れない・正しい行だけ入れる）は、仕様として人間が決める。
  AIが提案するときの既定は「何も入れず、エラーの一覧を返す」とする（半端に入った状態が残らず、直して同じファイルを入れ直せばよいため）。
  「正しい行だけ入れる」を選ぶ場合は、入れ直しで正しかった行が二重に入らない仕組み（上の節）を必ず作る。
- 文字コード・区切り文字・改行・見出しの行を仕様で決める。日本ではExcelで保存したCSVがShift_JIS（CP932）やBOM付きUTF-8のことが多い。
  想定外の文字コードを推測で変換せず、エラーにするか、受け付ける文字コードを決めて変換する。

## 本番規模で確かめる

- 決めた上限ちょうどの大きさのデータ（件数・ファイルサイズ）を作ってtestし、使ったメモリの最大値と所要時間を測る。
  数値と測った環境を完了報告に書く。測っていなければ「未検証」と書き、少ない件数のtestの結果で「大きなファイルでも動く」と報告しない。
- testに含める: 0件、1件、上限ちょうど、上限の1つ外、エラーの行が混ざる、途中で止めてから再開、同じファイルを2回取り込む、想定外の文字コード。
- 本番のデータをtestに使わない。大きなデータは生成する（[Sensitive data](sensitive-data.md)）。
- AIが本番環境でインポートを実行する操作と、データ移行のscriptを本番で動かす操作は、[Database](database.md)と[Safety](safety.md)のASKとする。

## 一次資料

- [PHP: Description of core php.ini directives](https://www.php.net/manual/en/ini.core.php)（`memory_limit`・`upload_max_filesize`・`post_max_size`）
- [PHP: Runtime Configuration（`max_execution_time`）](https://www.php.net/manual/en/info.configuration.php)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Cloudflare Workers: Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Vercel Functions: Limits](https://vercel.com/docs/functions/limitations)
