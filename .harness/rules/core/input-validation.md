# Input validation

入力検証は攻撃対策だけでなく、型・形式・業務制約を信頼できる処理境界で一貫して守る契約である。既存schema、validator、API契約、DB制約、error形式を先に調査し、既存の意味を勝手に変えない。

## 設計前の調査

- 各fieldについて、次の行列を作る: source/入口、型、requiredか、nullと空文字の扱い、単位、min/max（長さ・数値・件数）、format/encoding、正規化、cross-field条件、業務上の未知事項、未知fieldの扱い、利用者向けerror、serverの検証層、test。
- 既存仕様から根拠が見つからない上限、丸め、タイムゾーン、Unicode正規化、null意味、未知fieldの互換性をAIが発明しない。安全上必要な技術的上限は候補と影響を示し、業務上の最大値や例外は人間に選択肢を提示して承認を得る。
- 形式を検証できても、価格、所有、在庫、状態遷移、tenant境界などなど利用者に影響する業務判断を自動で決めない。仕様案、未確定点、計画を分けて確認する。

たとえば氏名の上限が未記載なら、既存DB・API・UIの制約を調べ、文字数とbyte数の違い、互換性、候補の上限と推奨理由を提示する。根拠なく固定値を実装せず、決定後に条件表とtestへ反映する。

## 境界と実装

- browser/clientの検証はUX補助にすぎず、server側で最終的に検証する。serverのないCLIやローカルアプリでは処理を実行する側が担う。HTTP/API、upload、CLI、job、queue、外部連携、復元データ、保存済みデータについて、信頼境界を越える箇所と用途に応じて検証する。
- TypeScriptのcompile-time typeやJSON.parseだけをruntime schema検証とみなさない。既存のruntime schema/validatorを再利用し、導入理由と適用範囲を記録する。依存追加は別途承認する。
- 型変換は厳格に行い、`""`、空白、null、未指定、NaN、Infinity、整数外、巨大値、配列件数、深い入れ子を仕様に従って区別する。単位を明示し、byte数と文字数を混同しない。
- 自由文でも、制御文字（改行・タブ・NUL等）と書式制御文字（zero width、bidi override等のUnicode category Cf）を許可するかをfieldごとに決める。bidi overrideは表示順を偽装できる。絵文字の結合に使うZWJ等もCfなので、一律に禁止せず用途で判断する。
- 固定選択肢・identifier・mode・sort方向はallowlistから選び、未知値を安全に拒否または明示的に後方互換処理する。全入力から句読点を一律に禁止せず、自由文は用途に合わせて許可する。
- 構造化データは全体形式、長さ、範囲、encoding、Unicode、正規化を検証する。denylistや危険語検索は補助にとどめ、入力検証でXSSの文脈別出力encodingやSQLのparameter bindingを代替しない。他の利用者に表示してよい内容かの判断（NGワード・予約語）は[User content](user-content.md)に従う。任意のHTML削除や手動escapeを万能な防御にしない。
- field単体で通っても成立しない組合せをcross-field、resource状態、現在actor、tenant、DBの不変条件として検証する。競合があり得る制約はDB制約・transaction・再確認と組み合わせる。
- 未知field、重複field、prototype汚染、過剰な深さ・件数・サイズ、content type偽装を入口ごとの脅威として扱う。受け付ける場合のforward compatibilityも記録する。
- errorはfield/path、機械可読code、利用者向けsafe messageを分け、秘密やvalidation内部を漏らさない。partial updateでは未指定とnullを区別し、許可属性だけを更新する。

## 検証とtest

- 正常値だけでなく、未指定・null・空・最小/最大の境界・一つ外側・型違い・Unicode・巨大入力・未知field・組合せ違反・権限違反・競合をtestする。仕様未確定の値は仮定として固定しない。
- validation層、runtime schema、DB constraint、client UXのどこで何を保証するかを表にし、重複検証の差異とraceをレビューする。静的型検査やschema存在だけでruntime入力が安全とは報告しない。
- 現在時刻・設定値・外部状態で結果が変わる条件（未来日の拒否、期限など）を保存済みデータの読込時にも適用するかを決める。読込時に一律に適用すると、時計や設定の変更だけで起動・処理ができなくなる。入力時だけに適用する、読込時は警告にとどめる、等の選択肢を示す。
- validation変更後は既存API、保存済みデータの読み出し、migration、retry、job再実行、error互換性への影響を確認する。外部validatorやregexのReDoS、parserのresource消費にも上限とtimeoutを設ける。

## 一次資料

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
