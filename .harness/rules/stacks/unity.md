# Unity

[C#](csharp.md)に追加します。

- package lockを確認する。Editor versionは下の「Editor version」に従う。
- 作業開始時に、ステアリングの「データ保存」を確認する。未記録なら下の「セーブデータ」に従って確認を計画に含める。
- ゲームのロジック・乱数・入力処理を設計・変更する場合や、バグを調べる場合は、下の「再現とリプレイ」に従う。
- assetとmetaの対応、GUID、scene / prefab参照を維持する。assetの移動・名前変更はEditor上で行い、`.meta`を一緒に動かす（[Assets](../core/assets.md)）。
- Editor用コードとruntime用コードを分離する。
- serialization変更、scene lifecycle、frameごとのallocationを確認する。
- EditMode / PlayMode testと対象platform buildを区別する。
- WebGLの配信、性能に影響する変更、入力処理の変更では、下の「WebGL・性能・操作」に従う。
- Library等の生成物をcommitしない。licenseやcredentials利用はASK条件を確認する。
- splash screen・ロゴ表示など、Unityの利用規約・ライセンスの種類によって変わる表示の扱いは人間に確認する。配布物の表示は[Credits](../core/credits.md)に従う。

## Editor version

使用するUnity Editorのversionは、導入先のステアリング`.harness/steering/tech.md`の「使用するエンジン・toolchainとversion」に1か所だけ書きます。
ステアリングがない導入先では`AGENTS.md`の同じ項目に書きます。
作業開始時に、記録したversionと`ProjectSettings/ProjectVersion.txt`、実行するEditorのversionを照合します。
食い違う場合は、どちらに合わせるかを人間に確認し、確認できるまで検証結果を「記録したversionで成功」と報告しません。
Editor versionの移行は人間の判断です。AIが移行を混ぜたり、ユーザーの移行を勝手に戻したりしません。

## セーブデータ

セーブデータの初回確認と、保存に触れる作業の計画・検証は[Save data](../core/save-data.md)に従います。
Unityでは次の点を確認します。

- `PlayerPrefs`は設定など小さな値に使うかを決める。保存場所と容量の制限はplatformで異なるため、対象platformごとに確かめる。
- ファイルに保存する場合は`Application.persistentDataPath`等の保存先を確認する。
- WebGLでは保存先がブラウザーの保存領域になります。書き込みが再読込後にも残るか（保存領域への反映の方式）を、使用するEditor versionで確かめる。
- `BinaryFormatter`は安全でないため、セーブデータに使わない。既存コードが使っている場合は移行を計画で提案する。

## 再現とリプレイ

採用の判断と、採用した場合の要件は[Game replay](../core/game-replay.md)に従います。
Unityでは次の点を確認します。

- ロジックの乱数は、seedを指定した生成器（`System.Random`等）をロジック側で持つ。グローバルな状態を持つ`UnityEngine.Random`をロジックで使わない。
- ロジックは固定tick（`FixedUpdate`または独自のtick）で進める。`Time.deltaTime`をロジックへ直接渡さない。
- ロジックはMonoBehaviourから分けたC#クラスに置き、EditMode testから再生できるようにする。MonoBehaviourは状態を読んで表示する。
- 組み込みの物理の結果は決定論的と見なさない。ロジックで使う場合は、再現できない範囲を記録する。
- platformやscripting backend（Mono・IL2CPP）が違うと浮動小数点の結果が変わりうる。リプレイを再現できる組み合わせを記録する。

## 実動検証

実行時の挙動を変更する作業には[Runtime verification](../core/runtime-verification.md)を適用し、実際の対象sceneで変更機能を動かします。
Unityでは次のように対応させます。

- コンパイル: 変更したassemblyのerror・warningを確認する。
- EditMode / 隔離したPlayMode test: 対象ロジックやcomponentの条件を確認する。
- 実sceneでのPlayMode: 実際の起動経路、参照、lifecycle、状態遷移を含めて変更機能を確認する。
- 描画・操作: Game view等で、見た目や入力に関する期待結果と画面上の挙動を照合する。
- 対象platform buildとその実行: platform固有の変更・問題に必要な範囲で行う。

Editorが開いている場合の扱いは、coreの「実行環境の安全な利用と実行不能時の対応」に従います。未保存のscene・prefab・assetも保護の対象です。
Unityは同じprojectを2つのEditorで開けません。Editorが同じprojectを開いているときは、次の順に検討します。

1. 開いているEditorを安全に操作できる手段（projectが用意した検証用のmenu・MCP等）があれば、それを使う。人間の作業中の操作は割り込まない。
2. 別のworktree（同じrepositoryの別の作業フォルダ）にcommit済みの状態を複製し、batch mode（画面を出さないコマンドライン実行）で隔離したPlayMode testや対象sceneの自動実行を行う。
   `Library/`の再生成に時間がかかること、Editorの未保存の変更は複製に含まれないことを記録に書く。batch modeの結果は描画・操作の確認の代わりにしない。
3. どちらも使えない、または描画・操作の確認が必要なら、coreの「実動確認待ちのPR」に従って人間に確認手順を渡す。
証拠にはUnity版と、Consoleのerror・warning（既存問題との区別を含む）を記録します。

## WebGL・性能・操作

配信は[Web delivery](../core/web-delivery.md)、性能は[Performance](../core/performance.md)、入力は[Controls](../core/controls.md)に従います。Unityでは次の点を確認します。

- WebGLのCompression Format（Brotli・Gzip・圧縮なし）とDecompression Fallbackは、配信先が`Content-Encoding`を付けられるかで決める。Decompression Fallbackは展開をブラウザー側で行うため、読み込みが遅くなる。
- WebGLでスレッドを使う設定にする場合は、cross-origin isolationのheaderが必要になる。設定名と対応状況は、使うEditor versionの公式文書で確かめる。
- 性能はProfilerで測る。Editor上のPlay modeの数値は製品版の代わりにしない。対象platformのdevelopment buildにProfilerを接続して測った場合は、そう記録する。
- 入力はInput Systemのaction等の行動で読む。中断は`OnApplicationPause`・`OnApplicationFocus`で受け、WebGLで届くかを対象のブラウザーで確かめる。

## エラーの捕捉

公開後のエラー・crashの扱いは[Error reporting](../core/error-reporting.md)に従います。Unityでは次のように対応させます。

- `Application.logMessageReceivedThreaded`で、`LogType.Error`・`LogType.Exception`・`LogType.Assert`を受けてcrashログへ書く。main thread以外からも呼ばれるため、処理をthread安全にし、中でUnityのAPIやログ出力を呼ばない。
- 開発ビルド（`Debug.isDebugBuild`）だけ、エラーを画面に重ねて表示する。
- crashログの置き場所は`Application.persistentDataPath`の下で、セーブデータとは別のファイルにする。

WebGLの配信設定は[Unity Manual: Deploy a Web application](https://docs.unity3d.com/Manual/webgl-deploying.html)を参照してください。この項目はUnityの公式文書を読めない環境で書いたため、使うEditor versionの文書で確かめてから適用します。

このスタックはルール提供段階です。このHarness自体の検証としてUnity Editorでの実動は未実施です。
