# Controls

ゲームの入力処理・操作説明・キー割り当てを設計・変更する場合と、新しい入力デバイス・platform（スマホ、ゲームパッド等）に対応する場合に適用します。
Web UIのタッチ操作は[Web](../stacks/web.md)から、必要な項目だけを参照します。
目的は、開発者の手元の1つの操作環境で動いたことを、遊ぶ人の環境でも遊べることの代わりにしないことです。
エンジン固有のAPIは、各stackのルールに書きます。

既存ルールとの分担:

- 操作の実動確認の手順は[Runtime verification](runtime-verification.md)の「描画・操作」。
- 入力の記録とリプレイは[Game replay](game-replay.md)。
- キー割り当ての保存は[Save data](save-data.md)。
- 埋め込み先のiframeの制約は[Web delivery](web-delivery.md)の「埋め込み先」。

## 対応範囲

- キーボード・マウス・ゲームパッド・タッチのどれに対応するかを決める。決めていない場合は、現状をコードから調べて人間に確認する。
- 決めた範囲は、ステアリング`.harness/steering/tech.md`の「対応する入力」に書く。ステアリングがない導入先では`AGENTS.md`に書く。
- 対応しない入力は、その旨を画面か説明で示す。

## 行動への割り当て

- ロジックは物理キーを直接読まず、行動（ジャンプ、決定、戻る等）を読む。例: GodotのInputMap、UnityのInput Systemのaction。
- 同じ行動に、対応する入力デバイスごとの割り当てを持たせる。
- [Game replay](game-replay.md)を採用している場合は、記録するのも行動の入力にする。

## キー割り当ての変更

- 変更できるようにするかを決める。
- できる場合は、同じキーの重複の検出、初期値に戻す操作、保存（[Save data](save-data.md)）を扱う。
- 割り当てを変えたら、画面の操作説明も変わることを確かめる。

## 操作説明

画面の操作説明は、使っている入力デバイスに合わせます（例: ゲームパッドで遊んでいるならボタンの表示）。
最後に使った入力デバイスで切り替える場合は、切り替えの条件を決めます。

## 中断と復帰

- タブの切り替え、ウィンドウのフォーカス喪失、スマホのバックグラウンドへの移動で、ゲームを一時停止する。一時停止しない場合はその理由を仕様に書く。
- 復帰したときに、押したままになったキーの状態を消す。フォーカスを失った間に離したキーは、離したと通知されないことがある。
- iframeに埋め込むと、クリックするまでキー入力が届かない。開始時にクリック・タップを求める画面を置く。
- 例: ブラウザーの`visibilitychange`・`blur`、Godotの`NOTIFICATION_APPLICATION_FOCUS_OUT`、Unityの`OnApplicationPause`・`OnApplicationFocus`。エンジンの通知がWeb出力でも届くかは、対象のブラウザーで確かめる。

## ブラウザーの制約

- 音声は、利用者がページを操作した後でないと再生できない（自動再生の制限）。最初のクリック・キー入力で音声を開始する（Web Audio APIなら`AudioContext`の`resume()`）。
- スペース・矢印キーによるページのスクロール、ピンチ操作による拡大、右クリックのメニューを、ゲーム中にどう扱うかを決める。
- ブラウザーが予約しているキー（タブを閉じる等）は奪えない前提にする。
- 全画面とpointer lock（マウスカーソルを固定する機能）は、利用者の操作から呼ぶ必要がある。
- ゲームパッドは、ボタンを押すまでページから見えないことがある。

## スマホ・タッチ

- viewportの設定と、画面の向き（縦・横）の扱いを決める。
- 指で押せる大きさのボタンにする。
- ノッチ等で隠れる場所（安全領域）にボタンや情報を置かない。
- `touch-action`等で、ゲーム中の誤スクロール・拡大を防ぐ。
- 仮想パッドが必要かを決める。

## 検証

- 対応すると決めた入力ごとに、[Runtime verification](runtime-verification.md)の「描画・操作」として実際に操作して確かめる。
- 中断と復帰（タブの切り替え・フォーカス喪失）と、最初の操作での音声の開始を、対象のブラウザー・端末で確かめる。
- 実機・対象ブラウザーで試せない入力は、未検証として残す。エミュレーターや開発者ツールの端末表示で確かめた場合は、そう書く。

## 一次資料

- [MDN: Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [MDN: Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
