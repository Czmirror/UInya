# Web delivery

Webサイト・Webアプリ・ゲームのWeb出力（Godot Web、Unity WebGL、WASM等）を、ブラウザーへ配信する場合に適用します。
build・配信の設定、キャッシュ・header・配信先を作る・変える場合と、「直したのに反映されない」を調べる場合に読みます。
目的は、配信先で古い版が残る、headerの違いで起動しない、といった問題を、手元で動いたことだけで見逃さないことです。
エンジン固有の設定名は、各stackのルールに書きます。

既存ルールとの分担:

- deployの承認、buildを1回にして同じartifactを進めることは[CI/CD](cicd.md)。
- リリース後の確認の順序は[Release](release.md)。
- security headerの組み合わせで正規の要求を壊していないかの確認は[Security](security.md)。
- 公開後のエラーの捕捉は[Error reporting](error-reporting.md)。

## 版の識別

build識別子（revision等）を成果物に入れ、配信されたものがどのbuildかを確かめられるようにします。
例: 開発表示・クレジット画面・`version.json`・consoleへの出力。
識別子には秘密や内部のpathを含めません（[Sensitive data](sensitive-data.md)）。

## キャッシュ

- 中身が変わるファイルは、ファイル名にハッシュを含めるか、versionを付けたURLで参照する。
- 入口のHTMLは長くキャッシュさせない（例: `Cache-Control: no-cache`で毎回再検証させる）。入口が古いままだと、新しいファイルを参照できない。
- 中身が変わってもファイル名が変わらない出力（Godotの`.pck`・`.wasm`等）は、配信側のheaderで再検証させるか、出力名を変えるかを決める。
- Service Worker（エンジンのPWA出力を含む）を使う場合は、新しい版をいつ反映するかを決める。Service Workerはオフライン用に古い版を返し続けることがある。

## 形式と圧縮

- `.wasm`は`application/wasm`で配る。違うMIME typeでは起動が遅くなる・失敗することがある。
- 事前に圧縮したファイル（`.br`・`.gz`）を配る場合は、配信側が`Content-Encoding`を正しく付けるかを確かめる。
- headerを設定できない配信先では、圧縮しない、配信側の自動圧縮に任せる、エンジン側の展開機能を使う、のどれかを選ぶ。展開機能は読み込みが遅くなることを記録する。

## スレッドとcross-origin isolation

- スレッド（`SharedArrayBuffer`）を使う出力は、`Cross-Origin-Opener-Policy: same-origin`と`Cross-Origin-Embedder-Policy: require-corp`（または`credentialless`）のheaderが必要になる。
- 配信先・埋め込み先でこのheaderを設定できない場合は、スレッドを使わない出力を選ぶ。
- `credentialless`は対応していないブラウザーがある。使う場合は対象のブラウザーで確かめる。
- COEPを付けると、CORSやCORPに対応しない外部の画像・計測・広告・埋め込みが読めなくなる。COOPの`same-origin`は、別のwindowと連携するポップアップのログイン（OAuth等）を壊すことがある。付ける場合は、外部のリソースとログインが動くかを確かめる。
- エンジンが用意する、Service Workerでheaderを補う機能を使う場合は、上の「キャッシュ」のService Workerの扱いも決める。

## 埋め込み先

ゲーム投稿サイト（itch.io、unityroom等）のiframeで配信する場合は、次を確かめます。

- 表示サイズと全画面の可否。
- ファイルの数・サイズの上限と、圧縮・headerを設定できるか。
- スレッドを使う出力を動かせるか（配信先がheaderを付けられるか）。
- キー入力とフォーカスの扱い（[Controls](controls.md)の「中断と復帰」）。

## 利用者がアップロードしたものの配信

利用者がアップロードしたHTML・WASM・SVG等を配信する場合は、本体のサイトと別の登録可能ドメイン（例: 本体が`example.com`なら`example-usercontent.com`）で配信します。
同じドメインのサブドメインでは、cookieや同じサイトとしての扱いを本体と分けられないためです。
配信先のドメインと、本体のcookie・認証がそのドメインへ送られないことを計画に書きます。

## 公開後の照合

- deployやアップロードのあと、配信されたファイルのハッシュ・サイズ・build識別子を手元の成果物と照合する。
- 「直したのに直らない」という報告では、まずこの照合で古い成果物の残存を切り分けてから、コードを調べる。
- ブラウザーで確かめるときは、キャッシュを無効にした状態か、新しいプライベートウィンドウを使う。Service Workerがある場合は、その登録も確かめる。
- 照合のために読むのは、認証のない公開URLに限る。認証が必要な環境やproductionの管理画面を読む操作は[Safety](safety.md)に従う。

## 検証

- 配信先で実際に開き、上の項目のうち今回の変更に関わるものを確かめる。
- headerは、手元の設定ファイルではなく実際の応答で確かめる（例: ブラウザーの開発者ツールのNetwork、`curl -I`）。
- 配信先・埋め込み先で試せない場合は、未検証として残す。手元のserverで動いたことを、配信先で動いたことの代わりにしない。

## 記録する場所

配信先、headerを設定できるか、キャッシュの方式、build識別子の確かめ方は、ステアリング`.harness/steering/tech.md`の「配信」に要点だけを書きます。
ステアリングがない導入先では`AGENTS.md`に書きます。

## 一次資料

- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- [MDN: Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)
- [Godot: Exporting for the Web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)
