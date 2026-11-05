# TypeScript

Coreに追加して適用します。対象のTypeScript versionと既存tsconfigを先に確認してください。

- public APIと外部入力の境界に型を定義し、入力値はruntimeでも検証する。
- `any`、型assertion、`@ts-ignore`でエラーを隠さない。必要な例外は理由と影響を説明する。
- strict等の既存設定を無断で弱めない。
- 成功経路に加え、null、境界値、例外、非同期失敗をtestする。
- typecheckは既存scriptを使う。候補は`tsc --noEmit`だが、実際のbuild構成に合わせる。
  serverとブラウザ（DOMの型）などでtsconfigを分けている場合は、すべてのprojectを検査する。1つの`-p`だけで済ませない。
- Nodeのtype strippingで`.ts`を直接実行する構成では、`erasableSyntaxOnly`等で型を消すだけで動く構文に制限し、
  対象Node versionでの扱い（実験的機能の警告など）を確認して記録する。
- ESLint等のlinterを使わず、`tsc`のstrict系optionでlintを代用する場合は、その判断と検出できない範囲
  （未使用のPromise、危険なDOM APIの使用など）をProject Profileの説明と完了報告に書く。lintとtypecheckが同じコマンドになることも示す。
- lockfileとpackage managerを尊重し、別managerのlockfileを混在させない。
- native binaryを含むpackage（platform別packageで配布されるcompiler等）を追加する場合は、dependency追加の承認で
  binaryが入ることと配布元を説明する。

検証候補: lint、format check、typecheck、unit / integration test、build。
コマンドはProject Profileで明示し、rule内で特定のtest runnerを強制しません。
