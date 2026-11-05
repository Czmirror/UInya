# PHP

## 採用する規約

新規projectの標準は **PSR-1 + PER Coding Style** とします。
PERはPSR-12を拡張・置換し、新しいPHP構文のstyleも扱います。
参照時点の公式文書はPER Coding Style 3.1です。導入時は対象PHPとformatterが対応する
規約version・presetを確認して固定し、「最新版」へ自動追従しません。
既存のPSR-12設定は維持できます。切り替えは別の変更として計画・レビューします。

| 規約 | 役割 | Harnessでの扱い |
| --- | --- | --- |
| PSR-0 | 旧autoload規約、非推奨 | 新規採用しない |
| PSR-1 | 基本的なcoding standard | 採用する |
| PSR-2 | 旧coding style、非推奨 | 新規採用しない |
| PSR-3 | Logger interface | ログ連携で必要な場合に使う。整形規約ではない |
| PSR-4 | Autoload規約 | Composerを使う新規のclass配置・namespaceの基準 |
| PSR-12 | Extended coding style | 既存projectやtoolの対応事情に応じて維持できる |
| PER Coding Style | 現代のPHP向けcoding style | 新規projectの標準 |

インデントはスペース4。UTF-8・BOMなし・LFは[共通規約](../core/coding-style.md)に従います。
PHPのみのファイルでは終了tagを省略し、class名・method名等は採用規約に合わせます。
`strict_types`導入はstyle変更だけで決めず、実行時の挙動・互換性への影響を確認してください。

## 検証・実装

- PHP version、拡張、Composerとlockfileを確認する。
- 入力検証、出力escaping、prepared statementを使い、動的なコード実行を避ける。
- 大量の行は全件を配列にせずgenerator等で処理し、`memory_limit`・`max_execution_time`を上げて解決しない（[Data import](../core/data-import.md)）。
- 既存の静的解析・coding standardを尊重し、例外やnullable値を明示する。
- Composer plugin / scriptはコード実行であり、install前に信頼性と承認条件を確認する。
- syntax、formatter check、既存静的解析、unit testをProject Profileに設定する。
- formatter / coding standard checkerは導入済みのものを優先し、check modeでnonzero失敗を検出する。
- Laravelでは既存Pint等のpresetを尊重する。PER適用のために別formatterを重ねて競合させない。
- 規約の採用はtoolの自動installを許可しない。追加依存はSafetyのASK条件に従う。

このスタックはルール提供段階で、PHP環境でのRunner連携は未検証です。

## 一次資料

- [PHP-FIG: PSR一覧とstatus](https://www.php-fig.org/psr/)
- [PHP-FIG: PER Coding Style](https://www.php-fig.org/per/coding-style/)

参照日: 2026-09-28。
