# Godot

GDScriptのインデントはタブ（表示幅4）を標準とします。C#にはC#の設定を適用します。

- engine version、renderer、GDScript / C#を確認する。C#使用時は[C#](csharp.md)も適用する。
- scene / resource参照とUIDを維持し、生成cacheをsourceへ混ぜない。
- signal接続、nodeの寿命、scene切替時の解放を確認する。
- headless import / test / exportの可否を環境ごとに確認し、未導入pluginを勝手に追加しない。
- 作業開始時に、ステアリングの「データ保存」を確認する。未記録なら下の「セーブデータ」に従って確認を計画に含める。
- ゲームのロジック・乱数・入力処理を設計・変更する場合や、バグを調べる場合は、下の「再現とリプレイ」に従う。
- 実行時の挙動を変更する作業では、下の「実動検証」に従う。
- Web出力の配信、性能に影響する変更、入力処理の変更では、下の「Web出力・性能・操作」に従う。
- export presetのcredentialsや署名情報をcommitしない。

## Engine version

使用するGodotのversionは、導入先のステアリング`.harness/steering/tech.md`の「使用するエンジン・toolchainとversion」に1か所だけ書きます。
ステアリングがない導入先では`AGENTS.md`の同じ項目に書きます。
作業開始時に、記録したversion、`project.godot`の`config/features`、実行する`godot --version`を照合します。
食い違う場合は、どちらに合わせるかを人間に確認し、確認できるまで検証結果を「記録したversionで成功」と報告しません。
`project.godot`のversion移行（例: 4.5から4.6）は人間の判断です。AIが移行を混ぜたり、ユーザーの移行を勝手に戻したりしません。

## 日本語など多言語のフォントとWeb出力

日本語などを表示するprojectでは、editorや開発端末で見えるだけで表示可能と判断しません。

- 表示対象の文字を含むフォントをprojectへ同梱し、共通Themeの`default_font`等で指定する。
  OSの代替フォントに依存しない。同梱するフォントは[Assets](../core/assets.md)に従って出典と利用条件を記録する。
- 動的に生成する吹き出し・通知・初回チュートリアルも、共通Themeを利用できる構造にする。
  独自Theme、Theme Overrides、`LabelSettings`、`RichTextLabel`の太字等、別フォントを使う箇所は個別に確認する。
  `LabelSettings`はThemeより優先されるため、設定した場合はそのfontも確認する。
- 全Labelへの個別指定を必須にしない。共通Themeを基本に、継承しない表示や意図的な例外へ必要な指定を行う。
- Web向け変更では、フォントがexport対象から除外されていないことと、実際に使われるfontに必要なglyphがあることを検証する。
  可能なら、動的UIを生成した状態の実効フォントと表示文字を調べる回帰testを用意する。
  ファイルの存在だけ、headless importの成功だけで日本語表示の成功とはしない。
- Web exportをブラウザーで開き、日本語のメニュー・動的通知・初回限定表示・状態表示など今回の変更箇所を確認する。
  ゲーム投稿サイト（例: itch.io、unityroom）等の埋め込み先が対象なら、その環境も確認対象にする。
  この確認は「実動検証」の対象platformでの確認に当たり、実施できなければBlockedとして残す。
  修正版のexportとアップロードした成果物が一致するかも確認し、古い成果物の残存とフォント指定漏れを切り分ける。

確認方法の例は[Godot profile例](../../examples/godot/README.md#日本語表示の確認)を参照してください。
フォント設定の優先関係は[公式Using Fonts](https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html)を参照してください。

## ライセンス表示

配布物の表示は[Credits](../core/credits.md)に従います。Godotでは次を表示の一覧に含めます。

- エンジン本体はMIT Licenseで、配布するゲームにGodotの著作権表示とライセンス文を含める必要がある。
  エンジンに含まれる第三者のcomponent（FreeType等）の表示も、使うexport templateに合わせて確認する。
- 同梱したフォントのライセンス（SIL Open Font License等）がライセンス文の同梱を求める場合は、それも含める。
- クレジット画面に出す場合は、Web exportを含む対象platformで表示されることを確認する。

表示の方法の例は[公式Complying with licenses](https://docs.godotengine.org/en/stable/about/complying_with_licenses.html)を参照してください。

## セーブデータ

セーブデータの初回確認と、保存に触れる作業の計画・検証は[Save data](../core/save-data.md)に従います。
Godotでは次の点を確認します。

- 保存先は通常`user://`です。実際の場所はOSと`project.godot`の設定（`application/config/use_custom_user_dir`等）で変わるため、対象platformごとに確かめる。
- Web出力では`user://`がブラウザーの保存領域に置かれます。`OS.is_userfs_persistent()`で永続化できるかを確かめ、できない場合の挙動を決める。
- 外部から差し替えられうるデータを`.tres`・`.res`などのresourceとして読み込まない。resourceはscriptを含められるため、objectを生成しない形式（JSONを`JSON.parse_string`等で読む）を使う。
- `ConfigFile`の`load`・`parse`と`str_to_var`はVariantとしてobjectも復元し、scriptの実行につながりうる（[godot#80562](https://github.com/godotengine/godot/issues/80562)）。外部から差し替えられうるデータには使わない。
- `FileAccess.get_var`でobjectを含める指定（`allow_objects`）を、外部から差し替えられうるデータに使わない。

## 再現とリプレイ

採用の判断と、採用した場合の要件は[Game replay](../core/game-replay.md)に従います。
Godotでは次の点を確認します。

- ロジックの乱数は、`seed`を設定した`RandomNumberGenerator`から取る。グローバルの`randf()`・`randi()`等をロジックで使わない。
- ロジックは`_physics_process`または独自の固定tickで進める。`_process`の`delta`をロジックへ直接渡さない。
- ロジックはNodeから分けたクラスに置き、表示なしのtest scriptから実行できるようにする。Nodeは状態を読んで表示する。
- 組み込みの物理（`RigidBody`等）の結果は決定論的と見なさない。ロジックで使う場合は、再現できない範囲を記録する。
- リプレイ文字列の読込にはJSON等を使い、上の「セーブデータ」と同じく、objectを復元する形式を使わない。
- Web出力でのクリップボード（`DisplayServer.clipboard_set`等）の挙動は、対象のブラウザーで確かめる。

## 実動検証

実行時の挙動を変更する作業には[Runtime verification](../core/runtime-verification.md)を適用し、実際の対象sceneで変更機能を動かします。
Godotでは次のように対応させます。

- コンパイル・import: headless importと構文検査で、error・warningがないことを確認する（下の「Headless checkの判定」）。
- 隔離したtest: test scriptで対象ロジックやnodeの条件を確認する。
- 実sceneでの実行: 表示環境のある状態で対象sceneを起動し（例: `godot --path . res://対象.tscn`）、起動経路・signal・状態遷移を含めて確認する。
  Editorが同じprojectを開いていても、別プロセスで`--path`を指定して起動できることが多いので、まずそれを試す。
  Editorの未保存の変更は反映されないため、実行したrevisionを記録する。表示環境がない場合は、coreの「実動確認待ちのPR」に従う。
- 描画・操作: 見た目や入力に関する期待結果と、画面上の挙動を照合する。headlessは描画しないため、この確認には使えない。
- 対象platformの出力: Web等のexportを、出力先と埋め込み先で実行する（日本語表示は上の節も参照）。

証拠には`godot --version`の結果と、出力の`SCRIPT ERROR:`・`ERROR:`・`WARNING:`（既存問題との区別を含む）を記録します。
下の「Headless checkの判定」のwrapperはerrorだけを失敗にするため、warningの有無（音声の再生に関するwarningを含む）は実sceneで実行したときの出力から別に確認します。

## エラーの捕捉

公開後のエラー・crashの扱いは[Error reporting](../core/error-reporting.md)に従います。Godotでは次のように対応させます。

- Godot 4.5以降は、`Logger`を継承したクラスを`OS.add_logger`で登録し、`_log_error`でerrorを受けてcrashログへ書く。`_log_error`はwarningも受けるため、`error_type`で`ERROR_TYPE_WARNING`を分ける。
  `_log_error`・`_log_message`はmain thread以外から同時に呼ばれることがあるため、`Mutex`等でthread安全にする。中で`push_error`・`print`等を呼ばない（再帰になる）。
- `_log_error`のscriptのbacktraceは、既定ではエディタと開発ビルドでしか入らない。製品版でも必要なら`debug/settings/gdscript/always_track_call_stacks`を有効にするかを、性能への影響と合わせて人間と決める。
- Godot 4.4以前では`Logger`が使えない。自前の記録関数を経由してcrashログへ書き、エンジン内部のerrorなど捕捉できない範囲を記録する。
- 開発ビルド（`OS.is_debug_build()`）だけ、エラーを画面に重ねて表示する。crashログは`user://`の下で、セーブデータとは別のファイルにする。

## Web出力・性能・操作

配信は[Web delivery](../core/web-delivery.md)、性能は[Performance](../core/performance.md)、入力は[Controls](../core/controls.md)に従います。Godotでは次の点を確認します。

- Web exportの**Thread Support**を有効にすると、cross-origin isolationのheaderが必要になる。Godot 4.3以降はスレッドなしで出力できるため、headerを設定できない配信先・埋め込み先ではこちらを選ぶ。
- PWAの**Ensure Cross Origin Isolation Headers**でService Workerにheaderを補わせる場合は、Service Workerによる古い版の残存も扱う（Web deliveryの「キャッシュ」）。
- Web出力の`.pck`・`.wasm`の名前はexport名で決まり、中身が変わっても変わらない。配信側のheaderで再検証させるか、出力名を変えるかを決める。
- 性能は、エディタのデバッガのプロファイラとMonitorsで測る。エディタから実行した開発ビルドの数値であることを記録する。
- 入力はInputMapの行動で読む。`NOTIFICATION_APPLICATION_FOCUS_OUT`は公式文書でdesktopとmobileで実装と書かれているため、Web出力で届くかを確かめる。届かなければ、`JavaScriptBridge`でブラウザーの`visibilitychange`を受ける。

## 生成ファイルとRunner

Godotはimportやeditor起動のときに、新しいscript・resourceの`.uid`と`.import`を生成します。
これらはscene参照を保つためにcommitする対象で、`.godot/`は生成cacheとしてGit対象外にします。
素材の移動・名前変更はエディタのFileSystemで行い、`.uid`・`.import`を一緒に動かします。元データは`.gdignore`を置いたdirectoryかprojectの外に置きます（[Assets](../core/assets.md)）。
Runnerは検証中のファイル変化を`blocked`として扱うため、次の順で進めます。

1. 新しいscript・resourceを追加したら、Runnerの前にheadless importを実行する（`godot --headless --path . --editor --import`）。
2. 生成された`.uid`・`.import`を確認し、追加したファイルと一緒にcommitする。
3. その状態でRunnerを実行する。

Runnerが生成ファイルを理由に`blocked`になった場合は、生成物を確認してcommitし、全checkを再実行します。
`blocked`を成功扱いにしたり、生成物を消して通したりしません。

## Headless checkの判定

Godotは失敗を終了コードだけでは伝えません（Godot 4.5.1、Linux headlessで確認）。

| 状況 | 終了コード | 対策 |
| --- | --- | --- |
| scriptの構文エラー | 1 | 終了コードで失敗になる |
| 呼び出し先で実行時エラーが起き、その後`quit(0)`に届く | 0 | 出力の`SCRIPT ERROR:`・`ERROR:`を失敗として扱う |
| `quit()`と同じ関数で実行時エラーや`assert`失敗が起きる | 終わらない | timeoutで止め、失敗として扱う |

checkの組み方:

- Godotを直接`command`に書かず、終了コード・timeout・出力の`SCRIPT ERROR:`・`ERROR:`をすべて判定するwrapperを通す。
  参考実装は[Godot profile例](../../examples/godot/README.md)の`run-godot.mjs`です。
- test scriptは、失敗したら`quit(1)`で終了する。期待値の比較は`assert`ではなく条件分岐で行い、失敗内容を出力する。
- `assert`はdebug buildでしか評価されず、失敗するとprocessが止まらないことがあるため、test結果の判定に使わない。
- timeoutは通常の実行時間より余裕を持たせつつ、Runnerの`timeoutMs`より短くして、wrapper側で失敗理由を出す。
- `lint`と`typecheck`に同じimportを重ねて登録しない。GDScriptに別のlinterがなければ、一方を理由付きの`skipped`にする。

描画・音声・入力の確認は、headlessの成功とは別に、上の「実動検証」で扱います。
