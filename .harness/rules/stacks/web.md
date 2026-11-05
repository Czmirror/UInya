# Web: HTML / CSS / JavaScript

静的サイトとWeb UIに適用する、Framework非依存の追加ルールです。
Next.js等のUIにも適用し、TypeScriptを使う場合はその型に関するルールを追加で読みます。
Node.js専用のJavaScriptでは下記のJS共通事項だけを必要に応じて参照し、DOMや表示検証は不要です。
文字コード・改行は[共通規約](../core/coding-style.md)、インデントの初期値はスペース2です。
引用符・semicolon等は既存formatterに合わせ、独自の流儀や新しい依存を持ち込みません。
XSS・CSRF・認可には[Security](../core/security.md)、フォーム・API等には[Input validation](../core/input-validation.md)も適用します。
管理画面・業務画面では、画面の説明・取り消せない操作の確認・エラーの文言に[Admin screens](../core/admin-screens.md)も適用します。

## HTML・アクセシビリティ

- 用途に合う要素を使う。操作はbutton、移動はlinkを基本とし、clickだけのdivで代用しない。
- 見出し構造、documentの言語、画像の代替text、formのlabelとerror表示を確認する。
- native要素の意味を優先し、ARIAを付けるだけでキーボード操作の実装を省略しない。
- キーボードで操作できること、focusが見えること、dialog等の開閉でfocusが迷子にならないことを確認する。

## CSS・表示

見た目の水準と、色・余白などの値のまとめ方は[UI visual](../core/ui-visual.md)に従います。

- 既存のclass命名、componentのstyle範囲、design tokenを尊重し、無関係なglobal styleを変更しない。
- 狭い画面、長い文言、文字拡大で内容や操作が失われないか確認する。
- 色だけで状態を伝えず、contrastとfocus表示を確認する。
- motionを減らす利用者設定を尊重し、animationを必須の情報伝達手段にしない。
  設定がonのときは、移動・拡大の動きを止め、透明度・色の変化は残してよい（全部消すと、状態が変わったことに気づきにくくなるため）。
- 対象browserを確認し、非対応のCSS / Web APIを使う場合はfallbackか仕様上の判断を示す。
- タッチ操作では、指で押せる大きさと、`touch-action`等による誤スクロール・誤拡大の防止を確認する。ゲームの操作は[Controls](../core/controls.md)に従う。

### 動き（アニメーション）

- 動きを付けるかは、その操作を使う回数で決める。1日に何度も使う操作（キーボードショートカット、コマンドパレット、一覧の移動）には付けないか、ごく短くする。
  キーボードで起こした操作には付けない。ダイアログ・通知などたまに出るものには短く付ける。（毎回待たされると、遅い画面に感じるため）
- UIの動きは300ms未満を目安にする（押したときの反応は100〜160ms、メニュー・選択肢は150〜250ms程度）。
  出てくる・消える動きには`ease-out`系を使い、`ease-in`は使わない。消える動きは出てくる動きより速くする。（`ease-in`は動き出しが遅れ、反応が鈍く見えるため）
- 動かすのは`transform`と`opacity`にする。`width`・`height`・`margin`・`padding`は動かさない。`transition: all`ではなく動かす性質を書く。（配置の再計算で動きがかくつくため）
- `scale(0)`から出さず、`scale(0.95)`程度と`opacity: 0`から出す。押したボタンから開くポップアップは`transform-origin`をボタンの側にし、画面中央のダイアログは中央のままにする。
- ここに挙げた時間や曲線の値は目安で、AIが選んだ値は[UI visual](../core/ui-visual.md)のとおり「仮の調整値」として挙げる。

### スマートフォンのブラウザー

スマートフォンでも使う画面に適用します。

- ホバーの見た目は`@media (hover: hover) and (pointer: fine)`の中に書き、押したときの反応は`:active`で付ける。（タッチ端末ではタップ後にホバーの見た目が残るため）
- 入力欄・選択欄の文字は16px以上にする。拡大を禁止する指定（`user-scalable=no`、`maximum-scale=1`）は使わない。
  （iOSでは16px未満の入力欄を押すと画面が拡大され、拡大の禁止は拡大したい利用者の操作を奪うため）
- 画面の高さいっぱいの部品は`100vh`ではなく、`100dvh`（いま見えている高さ）か`100svh`（いちばん狭いときの高さ）を使う。
  （`100vh`ではブラウザーのバーに下が隠れるため）
- 画面の端に固定する部品（ヘッダー、下のバー、通知）は、viewportのmetaに`viewport-fit=cover`を付けたうえで`env(safe-area-inset-*)`の余白を取る。（端末の切り欠きや角の丸みに隠れないように）
- 文字を選べなくする指定（`user-select: none`）はボタン等の操作部品だけに付け、本文には付けない。
- 開発者ツールの端末表示では分からない不具合が多いため、実機で確かめる。確かめられなければ未検証として報告する。

## JavaScript

共通事項:

- 実行環境と対象version、ES Modules / CommonJSの既存構成を確認し、無断で切り替えない。
- 再代入しない値はconst、必要な場合はletを基本とし、暗黙のglobal変数を作らない。
- 外部入力・API応答の形を検証し、Promiseの失敗、timeout、競合やcancelを扱う。
- 重要ロジックの成功経路・失敗経路をtestし、lintの成功をtypecheckの成功と混同しない。

ブラウザで動く場合:

- 未信頼の文字列をinnerHTML等へ直接渡さない。通常のtextはtextContent等で挿入する。
  HTMLが必要なら用途に適した既存のsanitizerと許可範囲を確認する。独自の正規表現だけに頼らない。
- client側の判定だけで認可を成立させず、秘密鍵やserver用credentialsを配布しない。
- event listener、timer、通信の寿命を管理し、画面の破棄後に不要な処理を残さない。
- 通信中・失敗・空の状態を扱い、連打や重複送信への挙動を確認する。状態の見せ方と値が欠けたときの表示は[Display states](../core/display-states.md)に従う。

## ブラウザーのゲーム

ゲームのロジック・乱数・入力処理を設計・変更する場合や、バグを調べる場合は、導入先が対象に加えていれば[Game replay](../core/game-replay.md)を適用します。
同ルールの「Webでの扱い」（`Math.random()`・`Date.now()`・frame時間をロジックへ直接使わない、ブラウザー間の差、クリップボードの制限）に従います。

## 検索・共有されるページ

検索やSNSで見つけてもらう公開ページを作る・変える場合に適用します。
管理画面・社内ツール・ログイン後の画面には適用せず、検索に出ないこと（下の3）だけを確かめます。
内容の企画（何を書くか、どの検索語を狙うか）は扱いません。

1. ページごとに固有の`<title>`と`meta description`を付ける。同じ文言を全ページで使い回さない。
2. 同じ内容のURLを1つに揃える（`https`、`www`の有無、末尾スラッシュ、`rel="canonical"`）。移動したページは301で新しいURLへ送る。
3. プレビュー・ステージング環境は検索に出さない。`noindex`（meta、または`X-Robots-Tag` header）か認証を使う。
   robots.txtで拒否するだけでは、他から張られたリンクで検索結果に出ることがある。またrobots.txtで拒否したページの`noindex`は読まれない。
   本番に`noindex`やrobots.txtの全拒否を持ち込まない。
4. `robots.txt`とsitemapを置く。存在しないページは404を返し、「見つかりません」の画面を200で返さない。エラーページの作り方は[Display states](../core/display-states.md)に従う。
5. 大事な内容はHTMLに出す。JavaScriptを実行しないと本文が出ない作りなら、静的生成・SSRを検討する。
   ゲームのWeb出力はcanvasだけになるため、説明文のある入口ページを用意する。
6. 共有用のOGP（`og:title`・`og:description`・`og:image`）を付ける。必要ならX等のカードも付ける。
7. 検索向けにしないこと: `llms.txt`等のAI向けのファイル、AI向けの書き換えや細かい分割、検索語の言い換えだけのページの量産。
   Googleは、生成AIの検索機能も通常の検索の仕組みの上で動き、これらは不要としている。構造化データはリッチリザルトを狙う場合に使い、AI検索のための手段として扱わない。

表示の速さ（Core Web Vitals等）は[Performance](../core/performance.md)に従います。

## 検証と適用範囲

導入済みのHTML / CSS / JS lint、format check、unit testと、重要操作のbrowser testを使います。
表示・focus・キーボード操作は実際に確認し、自動アクセシビリティ検査だけで十分と報告しません。
ブラウザでの実動確認・browser testでは、`console.error`と未処理の例外を集めて失敗として扱います（例: Playwrightの`page.on('pageerror')`と`page.on('console')`）。
既存のエラーや外部要因（拡張機能、広告ブロッカー等）で出るものは、許可する一覧に理由と一緒に書き、黙って無視しません。
公開後のエラーの捕捉と報告は[Error reporting](../core/error-reporting.md)に従います。
配信の設定・キャッシュ・headerは[Web delivery](../core/web-delivery.md)、読み込みの重さと配信サイズは[Performance](../core/performance.md)に従います。
対応browserや実機で試せない項目は未検証として残します。静的サイトのbuildやJSのtypecheckが
適用外なら理由を示します。新しいcheckerやbrowser toolのinstallは別途承認対象です。

Profileのrule名は`web`です。検出はHTML / CSSファイルとNext.jsの証拠から候補を示します。
package.jsonやJSファイルだけではブラウザ向けと決めつけません。JSのみのUIやtemplate中心の
projectは、対象パスに`web`を手動設定してください。候補検出は表示の正しさを保証しません。

## 一次資料

- [W3C: Accessibility Principles](https://www.w3.org/WAI/fundamentals/accessibility-principles/)
- [MDN: innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [emilkowalski/skills](https://github.com/emilkowalski/skills)（「動き」「スマートフォンのブラウザー」の要点の参考。commit `a81dbca`）
- [Google: Optimizing for generative AI features on Google Search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google: Block Search indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
