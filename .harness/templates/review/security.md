# Review: security

読む条件: 差分が入力・認可・外部送信・秘密情報・依存に触れる場合。[Review](../review.md)の共通項目と併せて使います。
判断の基準は[Security](../../rules/core/security.md)、[Input validation](../../rules/core/input-validation.md)、
[Sensitive data](../../rules/core/sensitive-data.md)、[Libraries](../../rules/core/libraries.md)にあります。ここでは照合する項目だけを挙げます。

- XSS / CSRF / SQL injection等の適用対策、入力検証のサーバー側実行、境界値・拒否・権限違いのtest:
- ログイン・外部ログイン・重要な情報の更新・webhookの受信（[Security](../../rules/core/security.md)の該当節。回数制限、state・nonce、本人の再確認、署名検証と重複処理）:
- 権限の付与・データの出力（[Admin screens](../../rules/core/admin-screens.md)の該当節。自己昇格・自分より上の付与・最後の管理者の拒否、付与・剥奪の記録、出力のserver側認可、CSVの数式対策。PDFは[PDF output](../../rules/core/pdf-output.md)の保存先・HTMLからPDFを作るときの通信の制限とescape）:
- secrets、外部送信、依存の影響:
- メール送信（[Email](../../rules/core/email.md)の対象なら、本番以外で本物の宛先へ送らないこと / ヘッダに改行を入れさせないこと / 自動返信が踏み台にならないこと / 二重送信の防止）:
- 利用者の投稿の表示（[User content](../../rules/core/user-content.md)の対象なら、判定がserver側であること / NGワードがコードとブラウザに無いこと / 表記ゆれと誤判定しやすい語のtest / 投稿内のリンクが`http`・`https`だけであること）:
- 計測（[Analytics](../../rules/core/analytics.md)の対象なら、本番以外で送らないこと / 送る値が許可リストだけであること / URLに載る情報 / 告知・同意の判断の出典）:
- 収益化（[Monetization](../../rules/core/monetization.md)の対象なら、広告・PRの表示が内容の近くにあること / `rel="sponsored"` / 本番以外で本番の広告を読み込まないこと / 広告がボタン・操作部分の近くにないこと / 紹介文に作った体験・根拠のない強調がないこと）:
- エラー報告（[Error reporting](../../rules/core/error-reporting.md)の対象なら、送る内容に利用者の情報・入力値・cookieがないこと / 本番以外で送らないこと / source mapを公開しないこと / upload用tokenの置き場所）:
