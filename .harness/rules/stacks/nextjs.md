# Next.js

使用言語のルールに追加します。対象version、App / Pages Router、runtime、hostingを調査してください。
UIを扱う場合は[Web共通ルール](web.md)も適用します。

- server / client境界を保ち、server用secretsやDB accessをclient bundleに入れない。
- 公開環境変数へ秘密情報を置かない。ログ、error response、serialized propsも確認する。
- Route Handler / Server Action等の入口ごとに認証・認可・入力検証を行う。
- cacheがユーザーやtenant間で共有されないか、更新後の無効化が適切か確認する。
- Server Component・Route Handler等からDBを読む場合は、一覧の問い合わせの数と上限を[Server performance](../core/server-performance.md)に従って確かめる（Prismaの`include`等でまとめて読む）。
- loading / error / empty状態と、重要な利用者操作をtestする。状態の見せ方と`not-found`・`error`の画面は[Display states](../core/display-states.md)に従う。
- build時のネットワーク取得、DBアクセス、telemetryを調べ、必要なASK承認や隔離を設定する。
- buildが通ってもlintやtypecheckを代替したと決めつけず、必要な独立チェックを設定する。
- 特定versionのCLI動作を推測せず、既存package scriptsと公式文書を確認する。

配布元の`examples/nextjs/`は契約例です。アプリへの導入・実行確認は別途必要です。
