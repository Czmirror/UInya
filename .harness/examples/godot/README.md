# Godot profile

Godot 4.xのGDScript projectで`.harness/project.json`として調整する設定例です。
このディレクトリは実行可能なGodot projectではありません。判定の根拠は[Godot rule](../../rules/stacks/godot.md)を参照してください。

## 前提

| ファイル | 契約 |
| --- | --- |
| `scripts/run-godot.mjs` | このディレクトリの[run-godot.mjs](run-godot.mjs)をコピーしたもの。終了コード・timeout・出力の`SCRIPT ERROR:`等をすべて判定する |
| `tests/run_tests.gd` | `extends SceneTree`のtest runner。`tests/`のtestを順に実行し、1件でも失敗したら`quit(1)`、全件成功なら`quit(0)` |
| `gdformat` | [gdtoolkit](https://github.com/Scony/godot-gdscript-toolkit)のformatter。未導入なら導入は依存追加として承認を得る |

Godot本体は`GODOT_BIN`、なければPATH上の`godot`を使います。使うversionは導入先の`AGENTS.md`に記録します。

## check の考え方

- `import`は新しい`.uid`・`.import`を生成します。Runnerの前に一度importし、生成物をcommitしてから実行します。
- test scriptを機能ごとに別checkとして増やさず、`tests/run_tests.gd`へ追加します。profileの変更を毎回の作業に含めないためです。
- `typecheck`はimportと同じ処理になるため、同じコマンドを重ねて登録せず、理由付きで`skipped`にしています。
- `smoke`はmain sceneを120 frame動かし、起動時のエラーを検出します。export templateが必要なexportは含めていません。
- `gdformat`を使わない場合は、文字コード・改行・末尾空白の検査など、実在する別のformat checkに置き換えます。成功するだけのダミーにしません。

## 確認した範囲

`run-godot.mjs`の判定は、Godot 4.5.1（Linux、headless）で次を確認しています。
構文エラーで失敗、呼び出し先の実行時エラー後に`quit(0)`しても失敗、`quit()`前の実行時エラー・`assert`失敗でtimeoutにより失敗、正常終了で成功。
`gdformat`、Windows / macOS、Godot 4.6以降、C#は確認していません。

## 日本語表示の確認

日本語等を使うprojectでは、[フォントとWeb出力のルール](../../rules/stacks/godot.md#日本語など多言語のフォントとweb出力)を適用します。
この設定例にはフォントや実行用sceneがないため、汎用の日本語表示testは含めていません。導入先のUIに合わせて`tests/run_tests.gd`へ追加してください。

1. 共通Themeのfontと、独自Theme・`LabelSettings`等で指定されたfontを確認する。
2. 通知やチュートリアルを実際に生成し、`Label.get_theme_font("font")`等で実効フォントを調べる。
   `LabelSettings`がある場合はそのfontも確認する。`Font.has_char()`等で表示文字のglyphを検査し、不足時は失敗させる。
   `RichTextLabel`の太字や別font指定は、通常fontだけの検査で代用しない。
3. exportの除外設定と、出力された成果物内のfont resourceを確認する。
4. Web exportをブラウザーと対象の埋め込み環境で開き、同じ表示を目視する。

glyph検査はフォント指定漏れの回帰検出に使えますが、文字の配置・欠け・ブラウザー上の描画までは保証しません。
検証記録には自動test、Web表示、埋め込み先、成果物の一致をそれぞれ分けて残します。
