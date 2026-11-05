# Application security

これは製品を守るためのアプリケーションセキュリティ規則であり、[AI agentの操作安全](safety.md)や承認手順を置き換えない。SafetyはAIの行為・外部送信・環境を扱い、この規則は製品の入力、出力、認証、認可、ネットワーク、データ境界を扱う。

## 脅威境界とレビュー

- セキュリティの判定（受け付けるファイルの種類、リダイレクト先、取りに行くURL、実行する操作、更新できる属性など）は許可リスト（allowlist）で決め、禁止リスト（denylist）は補助にとどめる。禁止リストは、想定していない書き方や新しい値で抜けられるため。利用者の投稿を表示してよいかの判断（NGワード等）は[User content](user-content.md)。
- 入口（HTTP、UI、file、CLI、job、queue、webhook）、信頼境界、資産、攻撃者能力、出口（browser、DB、OS、外部URL）を図（[Design](design.md)の図の扱い）または表で特定する。保存済みデータ、依存ライブラリ、別tenantの値も未信頼として扱う。
- 認証済みであることと、そのresource・tenant・操作を許可されることを分ける。server側で各resourceの認可を毎回確認し、clientの表示制御を根拠にしない。
- update入力は受け付ける属性をallowlistし、mass assignmentを避ける。tenant、owner、role、価格、監査列などをclient入力から決めず、resourceの所有・共有範囲を照合する。
- 失敗時は安全側に倒し、機密情報・token・個人情報をerror、log、URL、HTMLに混ぜない。security scannerの不在やlint成功だけを安全の証拠としない。
- 秘密・個人情報・決済情報の置き場所、パスワードの保存、決済情報のtoken化は[Sensitive data](sensitive-data.md)に従う。

## ブラウザとWeb API

- XSSは文脈に応じた出力encodingとframeworkの既定保護を使い、通常の文字列はtextContent等のsafe sinkへ入れる。HTML、attribute、URL、JavaScript、CSSを同じescapeで済ませない。
- rich HTMLが要件なら、既存の実績あるsanitizerを許可タグ・属性・URL scheme付きで設定し、sanitize後に再加工しない。正規表現だけの除去や任意HTMLの一律stripを防御策にしない。
- `innerHTML`等の危険sinkを使う場合は理由、入力境界、sanitizer設定、回帰testを記録する。CSP、Trusted Types、cookie属性はXSSの主防御ではなくdefense in depthとする。
- session cookieを使う状態変更には、trusted frameworkのCSRF token（statefulならsynchronizer、statelessならsessionに結び付けた署名付きdouble-submit等）を適用し、必要に応じOrigin/RefererまたはFetch Metadataを検証する。SameSite単独を一般解とせず、CORSを認証・CSRF対策の代用にしない。
- Origin/Refererの検証は、ブラウザが実際に送る値を前提にする。`Referrer-Policy: no-referrer`の下では、フォーム送信の`Origin`が`null`になるブラウザがあり、Origin必須の検証と組み合わせると正規の操作も拒否される。正規の送信を通すために`Origin: null`をallowlistに入れない。sandbox属性つきiframe（`allow-same-origin`なし）からの送信も`null`になり、許可するとCSRFが通る。`null`の要求は、独立したCSRF token等の検証に成功しない限り拒否し、正規の送信が`null`になる場合は`Referrer-Policy`を`same-origin`等に変えて解決する。security headerは組み合わせで正規の要求を壊していないかも確認する。
- GET、HEAD等のsafe methodで状態を変更しない。CORSは許可origin、credentials、preflightを明示し、`*`とcredentialsを組み合わせない。
- 開発用・ローカル用のserverも境界として扱う。127.0.0.1へのbindだけではDNS rebindingを防げないため、`Host`ヘッダを許可する名前とportのallowlistで検証し、状態変更では`Origin`も確認する。cookieのsiteにportは含まれないため、同じhostの別port（例: `127.0.0.1:9090`の別アプリ）からの送信には`SameSite=Strict`のcookieも付く。ローカルの別serverを攻撃元として想定し、Originをscheme・host・portまで一致で確かめる。`0.0.0.0`等へ広げる場合は理由と認証を計画に示す。
- ファイルを配信する開発サーバー（Viteの`/@fs/`、静的配信など）は、project rootにある秘密ファイルも配信しうる。toolが使う秘密ファイル（`.env*`、Cloudflare Wranglerの`.dev.vars*`、鍵）を配信の拒否リストに入れる。Gitの対象外であることやファイルの権限は、開発サーバーのprocessが読める以上、防御の根拠にしない。ダミーの秘密値を置き、通常のURLと開発サーバー固有の経路の両方からHTTPで取得を試み、拒否されて本文に値が含まれないことを回帰testで確かめる。

## ログインとセッション

- セッションの有効期限は、署名する内容かサーバー側の記録に含め、要求のたびにサーバーで確かめる。ブラウザのcookie寿命（`Max-Age`・`Expires`）だけに頼らない。cookie寿命はサーバーの期限と同じ値にそろえる。
- 期限の長さとログアウトの意味は、提案する仕様として計画に書き、人間が決める。cookieを消すだけのログアウトでは、コピーされた値が期限まで使えることを計画とPRに書く。すぐに無効にする必要があるなら、サーバー側の記録か失効の仕組みを提案する。
- セッションの形式を変えるときは、旧形式を拒否する。旧形式を再び通す差し戻しはせず、前に進めて直す。形式の変更で利用者全員が再ログインになる影響をPRに書く。
- ログイン後と権限が変わった後は、session IDを作り直す（session fixationの防止）。パスワードの変更・再設定のときに他の端末のセッションを無効にするかは、提案する仕様として計画に書く。
- ログイン、パスワードの再設定、確認コードの入力、新規登録には試行の回数制限を設け、アカウント単位と送信元単位の両方で数える。制限値は仮の調整値として示し、人間が決める。アカウントのロックはその利用者を締め出す攻撃にも使えるため、一時的な遅延や追加の確認との選択肢を示す。
- ログインの失敗、再設定、登録の応答から、アカウントの有無が分からないようにする（文言、status code、目立つ応答時間の差）。「登録済みです」と表示したい等の業務上の理由があれば、人間が決める。
- ログイン後の戻り先（`next`、`returnTo`等）は、同じoriginの相対pathかallowlistだけを許可する。`//evil.example`、`/\evil.example`、`https:`等で始まる絶対URL、`javascript:`は拒否する。
- testは時刻を固定し、期限の直前・ちょうど・経過後、期限の書き換え、旧形式を含める。回数制限の境界、存在するアカウントと存在しないアカウントの応答の比較、戻り先の悪用パターンも含める。

### 外部ログイン（OAuth 2.0・OpenID Connect）

- 提供元のSDKか実績あるlibraryを使い、手順を自作しない（[Libraries and dependencies](libraries.md)）。
- 認可コードフローにPKCE（`S256`）を使う。implicit flowは使わない。
- `state`を要求ごとに作ってセッションに結び付け、callbackで一致を確かめてから1回で捨てる。
- OpenID Connectでは`nonce`を送り、ID tokenの`nonce`と照合する。ID tokenは署名、`iss`、`aud`（自分のclient ID）、`exp`を検証する。提供元の検証APIを使う場合も、`aud`と`nonce`の一致を確かめる。
- `redirect_uri`は事前に登録したURLと完全一致させる。client secretはserverだけに置く。
- 利用者は提供元の`iss`と`sub`で識別する。メールアドレスが一致するだけで既存のアカウントに自動で連携しない。未確認のメールアドレスで乗っ取られるため。
- testは、`state`・`nonce`の不一致と再利用、別のclient向けのID token、期限切れのID tokenを含める。

### JWT

自分でJWTを発行・検証する場合に適用する。

- 検証側で`alg`を固定する。`none`や、公開鍵をHMACの鍵として使わせる切り替えを拒否する。`iss`・`aud`・`exp`を検証する。
- payloadは暗号化されていないため、秘密・個人情報を入れない。
- すぐに無効にする必要があれば、上の「サーバー側の記録か失効の仕組み」に従う。ブラウザでの保存先は、XSSで読まれる`localStorage`より`HttpOnly`のcookieを優先する。

## 重要な情報の更新

決済手段の登録・更新、メールアドレス・電話番号・パスワード・二要素認証の変更、送金先・配送先の変更など、乗っ取りや金銭被害につながる更新に適用する。

- 最後のログインから時間が経っている場合は、パスワードの再入力や二要素認証で本人を確かめてから更新する。メールアドレスの変更は、新しいアドレスの確認が済むまで切り替えない。
- 試行と失敗の両方に回数制限を設け、アカウント単位と送信元単位で数える。カードは決済代行が返す識別値（fingerprint等）でも数える。制限値は仮の調整値として示し、人間が決める。
- 決済手段の登録・更新の画面は、盗んだカード番号が使えるかを大量に試す攻撃（カードテスティング）に使われる。ログインなしで登録できる経路（ゲスト購入、寄付など）は特に狙われる。決済代行の不正対策（3-D Secure、不正検知の機能など）を使う設計を優先し、有効にする設定としきい値は人間が決める。bot対策（CAPTCHA等）を入れるかも人間が決める。
- 拒否の理由を詳しく返さない。「残高不足」「セキュリティコードが違う」のような理由は、カード番号が有効だと攻撃者に教える。利用者には一般的な文言を返し、詳細はカード情報を含めずにserverのログへ残す（[Sensitive data](sensitive-data.md)）。
- 更新したことを本人へ通知する。メールアドレスの変更は、変更前のアドレスにも通知する。
- 試行と失敗の件数を監視し、急に増えたら人間へ通知する。攻撃を受けている間、その機能だけを止められるようにする。決済代行の手数料が試行ごとにかかる場合があることを計画に書く。
- testは、本人の再確認なしの更新の拒否、回数制限の境界、拒否の文言に理由が含まれないこと、通知が送られることを含める。

## Webhookの受信

- 送信元の署名を処理の最初に検証し、失敗したら処理せずに拒否する。送信元のSDKか公式の手順に従う（例: LINEの`x-line-signature`、Stripeの`Stripe-Signature`、GitHubの`X-Hub-Signature-256`）。
- 署名は受信した生のbodyで計算する。frameworkがJSONに変換した後のデータを文字列に戻して計算しない（例: Next.jsのroute handlerでは`await request.text()`で受け取ってから検証する）。
- 署名の比較には定数時間の関数（`crypto.timingSafeEqual`、`hmac.compare_digest`、`hash_equals`等）を使う。署名用の秘密（channel secret、signing secret等）は[Sensitive data](sensitive-data.md)に従う。
- 署名の対象に時刻を含む方式では、許容する幅を決めて古い要求を拒否する。
- 再送される前提で作る。イベントID（LINEの`webhookEventId`、StripeのイベントID等）で処理済みを記録し、2回目は処理しない。記録は一意制約で守る（[SQL rule](../stacks/sql.md)の「なければ作る」処理）。
- 応答は早く返し、時間のかかる処理は後で行う。送信元のtimeoutで再送が増えるため。送信元IPの制限は補助で、署名検証の代わりにしない。
- testは、正しい署名、bodyを1 byte変えたもの、署名なし、別の秘密で作った署名、古い時刻、同じイベントIDの再送を含める。

## データベース、外部接続、ファイル

- SQLの値はparameter bindingを使い、識別子・sort方向は固定allowlist mappingにする。詳細は[SQL rule](../stacks/sql.md)に従う。
- serverが取得するURLはscheme、host、port、解決後IP、redirectを検証し、loopback、private/link-local、metadata endpoint、内部管理名を脅威モデルに応じて拒否する。redirect後も再検証し、timeout・size・response typeを制限する（[OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)）。
- file uploadは拡張子だけで信頼せず、size、content type、内容検査、保存名、保存先、権限、展開時のpath traversal、download時のContent-Dispositionを設計する。実行可能な場所へ保存しない（[OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)）。
- command、path、template、deserializationの境界では、固定操作とallowlist mappingを優先し、未検証の値のshell文字列連結や無制限のpath指定を許可しない。コマンドは引数配列を使い、option injectionも防ぐ。利用者指定pathが必要なら許可root内に制限し、正規化・symlink・競合を確認する。必要な権限・filesystem・egressを最小化する。

## 検証

- security影響の変更は、認証なし・他tenant・権限なし・境界値・失敗経路・redirectやuploadを含むtestを選び、実行したcheckだけを報告する。実際のbrowser、DB、外部ネットワークが未検証ならその範囲を明記する。
- CSRF token、Origin、cookie属性、CSPなど、ブラウザが付ける値や挙動に依存する防御は、headerを手で付けたcurlやunit testだけで正常系を保証しない。実際のブラウザ（自動操作を含む）で、正規の操作が通ることと拒否すべき要求が拒否されることを確認し、できなければ未検証として報告する。

## 一次資料

- [OWASP Cross Site Scripting Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Cross Site Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OWASP Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
