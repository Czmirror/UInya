# Python

規約は**PEP 8 + PEP 257**を基本とします。
インデントはスペース4、UTF-8・BOMなし・LFは[共通規約](../core/coding-style.md)に従います。
module・function・変数はsnake_case、classはCapWordsを基本とし、public APIのdocstringを整えます。
既存projectの公開名をstyle変更だけで破壊的にrenameしません。

## Toolと設定

- 対象Python version、仮想環境、pyproject.toml、依存管理・lockfile、既存lint / test設定を確認する。
- 複数のPythonがある環境では、PATH上の`python3`を前提にせず、`requires-python`等に合うinterpreterを明示して選ぶ。
  選んだversionと場所を計画に書く。
- 新規projectのtoolはproject内の仮想環境（例: `.venv`）に入れ、versionを`requirements-dev.txt`やlockfile等で固定する。
- 新規projectでtoolを選ぶ際はRuffのlintとformatterを第一候補にする。導入は別途ASK。
- 既存のBlack等を勝手に置き換えず、複数formatterで同じファイルを交互に整形しない。
- 行長などの差異は採用formatterの設定に統一する。PEP 8の目安と異なる場合もprojectで明示する。
- 型annotationは重要な境界・新規ロジックに追加し、採用済みのtype checkerを使う。
  lintの成功をtypecheckの成功として扱わない。未設定なら理由を明示する。
- import時の外部通信・ファイル変更などの副作用を抑え、resourceはcontext manager等で解放する。
- 例外を黙殺せず、mutableなdefault引数、共有状態、非同期処理のcancelを点検する。
- unit testは既存pytest / unittest等を使い、重要な分岐・異常系を検証する。
- DjangoやSQLAlchemy等のORMでは、一覧の関連先をまとめて読み（Djangoの`select_related()`・`prefetch_related()`等）、問い合わせの数が件数で増えないことをtestで確かめる（Djangoの`assertNumQueries()`等。[Server performance](../core/server-performance.md)）。
- 仮想環境・cache・credentialsをcommitしない。global / system Pythonへ勝手にinstallしない。

## 検証コマンドの契約

Ruffを採用済みなら`ruff check .`と`ruff format --check .`を候補にします。
test・typecheck・配布物のbuildはprojectの既存toolに合わせ、Project Profileへ明示します。
仮想環境のtoolは、`cwd`からの相対パスでcommandに書けます（例: `[".venv/bin/ruff", "check", "."]`）。
Windowsでは`.venv/Scripts/`になるため、OSが混在する場合はCIと合わせて決め、仮想環境の作り方をREADME等に残します。
配布物のないscriptではbuildを理由付きで適用外にできます。
言語のformatterとは別に、[共通規約](../core/coding-style.md)の文字コード・BOM・LFの検査もformat checkに加えます。
build backend、setup.py、testのimport / pluginはコード実行です。依存取得・外部送信・DB等の
副作用を確認し、必要な操作承認を得てください。

自動検出はpyproject.toml、requirements*.txtの対応パターン、setup.py / setup.cfg、Pipfileの
ファイル名から候補を示すだけです。setup.pyやbuild backendを実行せず、依存installもしません。
候補は構文・内容の検証結果ではありません。manifestのない単独scriptは手動で`python`を設定します。

PythonアプリへのRunner連携は、標準ライブラリだけのWebアプリで、`.venv`のRuff（lint・format）とunittestを
実行した1件の試用で確認しました（2026-10-07、macOS、Python 3.14）。pytest、type checker、Windows、CIでの連携は未検証です。

## 一次資料

- [PEP 8](https://peps.python.org/pep-0008/)
- [PEP 257](https://peps.python.org/pep-0257/)
- [Ruff formatter](https://docs.astral.sh/ruff/formatter/)
