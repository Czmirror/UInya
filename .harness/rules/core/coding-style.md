# Coding conventions

実装上の判断には[共通コーディング原則](principles.md)を適用します。
コードコメント・APIドキュメントには[Comments](comments.md)、ログ出力には[Logging](logging.md)も適用します。

## 共通のテキスト規約

新規・変更するソース、設定、ドキュメントは以下を標準とします。

- 文字コードはUTF-8、BOMなし。
- 改行はLF。空でないファイルの末尾に改行を入れる。
- 行末の不要なスペース・タブを除去する。
- インデントはスペースを基本とし、言語・ツールの規約がある場合は下表を適用する。
- formatterの結果を優先し、整列や折り返しを独自ルールで再整形しない。
- 双方向制御文字（U+202A〜U+202E、U+2066〜U+2069、U+200E、U+200F、U+061C）をファイルに直接書かない。
  表示上の順序とparserが読む順序をずらせる（Trojan Source、CVE-2021-42574）。文字列などで必要ならescape（例: `\u202E`）で書く。
  ゼロ幅スペース（U+200B）、word joiner（U+2060）、先頭以外のU+FEFFも直接書かない。ZWJ（U+200D）・ZWNJ（U+200C）は絵文字や一部の文字体系で必要なため、文書・データでは許可する。
  ソースコード（文字列・正規表現・コメントを含む）ではescape（例: `\u200D`）で書き、直接書かない。escapeが実際の文字に変わっても見た目で気づけないため。
  AIのファイル書き込みでescapeが実際の文字に変わることがあるため、書いた後にbyte列や検査で確認する。
- 新しく書く名前・文章では`allowlist`・`denylist`（日本語は許可リスト・禁止リスト）を使い、`whitelist`・`blacklist`は使わない。
  既存の名前は、触った範囲以外を一括で変えない（変える場合は計画に書く）。

| 対象 | 初期設定 | 補足 |
| --- | --- | --- |
| HTML / CSS / JavaScript / TypeScript / Next.js、JSON、YAML、Markdown | スペース2 | 導入先の既存formatter設定と整合させる |
| SQL | スペース2 | DB方言と既存formatterに合わせる |
| PHP / Laravel、C# / Unity | スペース4 | 導入先のcoding standard・analyzerと整合させる |
| Python | スペース4 | PEP 8 / PEP 257と採用formatterに合わせる |
| Rust | スペース4 | Rust Style Guideとrustfmtに合わせる |
| Go | タブ | gofmtの結果を正とし、整列用スペースを禁止しない |
| GodotのGDScript | タブ（表示幅4） | Godotのstyle guideに合わせる |
| Makefile / GNUmakefile / *.mk | recipeのタブを保持 | 構文を壊す一括スペース変換は禁止 |
| `.gitmodules` | タブ（Gitが生成する形式） | `git submodule add`の出力をそのまま保持する |
| その他 | スペース2を初期値 | 言語・既存projectの慣習を調査して設定する |

タブの表示幅と、ファイルに保存するインデント文字は別です。
混在projectでは拡張子・パス単位で設定し、例えばGodotでもC#にはC#の規約を適用します。
このHarnessのスペース対象ファイルでは生のタブ文字を使用しません。
testでタブやBOM等を扱う場合は、文字列のescapeやbyte列からfixtureを生成できます。

## 設定と検証

規約の正本はこの文書です。repository rootの`.editorconfig`をeditorの保存設定に使い、
`.gitattributes`の`text=auto eol=lf`でGitがテキストと判定したファイルの改行を揃えます。
`charset = utf-8`はBOMなしを指定します。`utf-8-bom`は使いません。
Gitの改行設定だけではUTF-8やBOMなしを保証できないため、CIのcheckも併用します。

Harness自身のstyle checkは、明示した拡張子・設定ファイル名を対象に、byte列からUTF-8の妥当性、
BOMなし、LF、末尾改行、行末空白、タブ例外、双方向制御文字とゼロ幅スペース等の不可視文字を検査します。
ZWJ・ZWNJはコードの拡張子のファイルだけで拒否します。
字下げ幅や言語構文に応じた正しい整形までは検査しません。そこは各言語のformatterが担当します。
このcheckerは`.editorconfig`の汎用parserではありません。初期のタブ例外は
`scripts/lib/text-style.mjs`にも明示しているため、例外変更時は設定・check・testを揃えて更新します。
導入先では、言語のformatterとは別に、UTF-8・BOMなし・LF（必要なら双方向制御文字も）の検査をformat checkへ組み込んでください。
bootstrapは`.editorconfig`と`.gitattributes`が無ければ`templates/editorconfig`・`templates/gitattributes`から作り、
Project Profileの雛形にこの検査（`check-text-style.mjs`、id `text-style`）を必須checkとして入れます。
雛形の`.gitattributes`は、cmd.exeがLFで誤動作することがある`.bat`・`.cmd`だけCRLFにします。
言語のformatterは対象言語のファイルしか見ず、文字コードやBOMを検査しないものもあるため、言語ルールの検証コマンドの候補だけでは足りません。

## 例外と既存資産

UTF-8は新規テキストの標準としますが、既存の外部連携、file format、生成ツールが別のencodingや
改行を要求する場合は例外が必要です。バイナリ、vendor、生成物、encoding検証用fixtureを
一律変換してはいけません。対象パス、理由、必要な形式、検証方法を計画に記録してください。
vendorの出典・改変の記録は[Libraries and dependencies](libraries.md)に従います。

既存projectへの導入では`.editorconfig`、formatter、`.gitattributes`を先に確認し、
ユーザー変更を保護して必要な設定だけを統合します。全文字コード変換やGitのrenormalizeは
この規約の追加だけを理由に実行しません。意味や外部互換性を変える例外は人間と決定します。

## 参照

- [EditorConfig properties](https://editorconfig.org/#supported-properties)
- [Effective Go: Formatting](https://go.dev/doc/effective_go#formatting)
- [GDScript style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html)
