# Guard hooks

AIの操作と`git push`の直前に、保護ブランチ・DB・秘匿情報に関わる操作を止める補助の仕組みです。
判定基準の正本は[Safety](../rules/core/safety.md)・[Git safety](../rules/core/git.md)・[Database](../rules/core/database.md)のままです。
guardはその一部を機械的に確認するだけで、sandboxでも承認システムでもありません。
秘密・個人情報・決済情報をどこに置いてよいかの基準は[Sensitive data](../rules/core/sensitive-data.md)です。

## 2つの層

| 層 | 呼び出し元 | 対象 | 製品依存 |
| --- | --- | --- | --- |
| pre-push | Gitの`pre-push` hook（[`scripts/hooks/pre-push`](../scripts/hooks/pre-push)） | 実際にpushされるref | なし。AIにも人間の誤操作にも効く |
| 操作の確認 | 製品のhook（Claude Codeの`PreToolUse`など）から`scripts/guard.mjs check` | AIが実行しようとするコマンド、ファイルの読み書き | 入出力の変換だけ製品ごと |

判定ロジックは[`scripts/lib/guard.mjs`](../scripts/lib/guard.mjs)の1か所です。

## guardは許可を出さない

`check`の結果は`deny`・`ask`・`none`（判定なし）の3つだけです。`none`は「guardは止めない」という意味で、
許可ではありません。その後は製品の通常の権限確認に進みます。guardを入れても既存の確認は緩みません。

入力のJSONが壊れている、設定ファイルが不正など、guard自身が判定できない場合は`ask`にします。
設定の書き間違いでguardが黙って無効になることを防ぐためです。

## 判定表

| 区分 | 操作 | 判定 | rule |
| --- | --- | --- | --- |
| 保護ブランチ | 保護ブランチへのforce push（`-f`、`--force`、`--force-with-lease`、`+refspec`） | deny | `git-push-force-protected` |
| 保護ブランチ | 保護ブランチの削除（`--delete`、`:branch`） | deny | `git-push-delete-protected` |
| 保護ブランチ | `git push --mirror` | deny | `git-push-mirror` |
| 保護ブランチ | 保護ブランチへの通常のpush、`--all` | ask | `git-push-protected` |
| Git | 保護ブランチ以外へのforce push・削除 | ask | `git-push-force`、`git-push-delete` |
| Git | `--no-verify`付きのpush、`core.hooksPath`の上書き・変更 | ask | `git-push-no-verify`、`git-hooks-path` |
| Git | `reset --hard`、`clean -f`、`branch -d/-D`、`tag -d`、`checkout --`/`.`、`restore`（`--staged`だけを除く）、`stash drop/clear` | ask | `git-reset-hard`ほか |
| Git | `rebase`、`commit --amend`、`filter-branch`、`remote set-url/remove` | ask | `git-history-rewrite`、`git-remote-change` |
| DB | DB client（psql、mysql、sqlite3等）に渡す`DROP`・`TRUNCATE`・`ALTER`、`WHERE`のない`DELETE`・`UPDATE` | ask | `db-destructive-sql` |
| DB | DB clientがfileからSQLを実行する（`-f`、`<`） | ask | `db-sql-file` |
| DB | migrationの適用（prisma、artisan、rails、manage.py、alembic、knex、typeorm、drizzle-kit、flyway、goose、dotnet ef等） | ask | `db-migration` |
| 秘匿情報 | 秘匿ファイルの読み取り（Read等のtool、`cat`・`grep`・`cp`・`source`・`curl -F x=@file`等、`< file`） | deny | `secret-read` |
| 秘匿情報 | 秘匿ファイルへの書き込み | ask | `secret-write` |
| Harness | 保護path（下の「設定」の既定値。Harness、CI、AIツールの設定、Gitのhook）への書き込み | ask | `protected-path-write` |
| 実行 | pipeから受け取った内容をshellが実行する（`curl … \| sh`、`… \| bash -s`等） | ask | `pipe-to-shell` |
| リリース | tagのpush（`--tags`、`--follow-tags`、`refs/tags/…`、local tagと同名のrefspec） | ask | `git-push-tag` |
| リリース | `git tag <name>`によるtagの作成（`-l`・`--list`・`-v`等の参照だけは対象外） | ask | `git-tag-create` |
| リリース | packageの公開（`npm`・`pnpm`・`yarn`・`bun publish`、`yarn npm publish`、`cargo publish`、`poetry publish`、`twine upload`、`gem push`、`dotnet nuget push`。`--dry-run`は対象外） | ask | `package-publish` |
| リリース | `gh release create`・`upload`・`edit`・`delete` | ask | `release-create` |
| 依存 | package名を指定した追加（`npm install <pkg>`、`pnpm`・`yarn`・`bun add`、`pip install <pkg>`、`python -m pip install`、`uv add`、`uv pip install <pkg>`、`poetry add`、`cargo add`、`go get`、`composer require`、`gem install`、`dotnet add package`） | ask | `dependency-add` |

リリースと依存の行は[Safety](../rules/core/safety.md)のASKと[Release](../rules/core/release.md)の不可逆な操作に対応します。
保護pathのうちAIツールの設定とhookの行は、Safetyの「AIツールの設定の追加・変更」に対応します。`pipe-to-shell`はSafetyの「repository外のscript」に対応します。
Level 5はagentの変更をGitでstageして保護pathと照合するため、`.git/`の下の変更はLevel 5では検出されません（guardの層では検出します）。
引数なしの`npm install`・`npm ci`・`pnpm install`・`yarn`、`pip install -r <file>`、`pip install .`・`-e .`は、
lockfileや宣言済みの依存を入れるだけなので対象外です。

pre-pushの層では、保護ブランチへの通常のpush・non-fast-forward・削除を止めます（Gitのhookは確認を出せないため）。
人間がレビューしたうえで必要な場合は、`git push --no-verify`で迂回します。AIがこれを使うと操作の確認層で`ask`になります。
tagのpushはpre-pushの層では止めません。Gitのhookは確認を出せないため、止めると人間の通常のリリースにも`--no-verify`が必要になるからです。

## 設定

`.harness/project.json`の任意項目`guard`で変えられます。省略時は既定値です。

```json
"guard": {
  "protectedBranches": ["main", "develop", "release/*"],
  "secretPaths": [".env", ".env.*", "*.pem", "*.key", "config/master.key"],
  "secretPathExceptions": [".env.ci.example"],
  "protectedPaths": ["infra/"]
}
```

| 項目 | 既定値 | 指定したとき |
| --- | --- | --- |
| `protectedBranches` | `main`、`master`、`release/*` | 置き換え |
| `secretPaths` | `.env`、`.env.*`、`*.pem`、`*.key`、`*.p12`、`*.pfx`、`id_rsa*`・`id_ecdsa*`・`id_ed25519*`、`credentials*`、`.netrc`、`.dev.vars`・`.dev.vars.*`（Cloudflare Wranglerの開発用秘密） | 置き換え |
| `secretPathExceptions` | `.env.example`、`.env.sample`、`.env.template`、`.dev.vars.example`、`*.pub` | 既定値に追加 |
| `protectedPaths` | `.harness/`、`.github/`、`AGENTS.md`、`CLAUDE.md`、AIツールの設定（`.claude/`、`.codex/`、`.cursor/`、`.gemini/`、`.kiro/`、`.mcp.json`）、Gitのhookと設定（`.git/hooks/`、`.git/config`）、hookの管理tool（`.husky/`、`lefthook.yml`、`.lefthook.yml`、`.pre-commit-config.yaml`）、`.vscode/tasks.json`（Level 5と共通） | 既定値に追加（既定値は外せない） |

`/`を含まないpatternはファイル名として、どのdirectoryでも一致します。`/`を含むpatternはroot相対のpathと比べます。
`*`は`/`をまたがず、`**`はまたぎます。保護ブランチを空にする、既定の秘匿patternを外すなどの弱める設定は許可しますが、
`validate-config.mjs`が警告します。

## 導入

hookの有効化は導入先の設定変更なので、`bootstrap-project.mjs`は行いません。人間が手順を確認して設定します。
以下はsubmodule方式（`.harness/upstream`）の例です。コピー方式では`.harness/scripts/`に`guard.mjs`と`lib/`を置き、パスを読み替えます。

### pre-push

既存のhookがなければ、[`scripts/hooks/pre-push`](../scripts/hooks/pre-push)を`.git/hooks/pre-push`へコピーして実行権限を付けます。
husky・lefthook等を使っている場合は上書きせず、そのpre-pushから次の1行を呼びます。`core.hooksPath`は変更しません。

```sh
node .harness/upstream/scripts/guard.mjs pre-push "$@"
```

`.git/hooks/`はcloneで共有されないため、各開発者・各環境で設定が必要です。CIやGitHubのbranch protectionの代わりにはなりません。

### 製品のhook

製品ごとの設定はAdapter（共通Harnessの`adapters/README.md`）を参照してください。現在、動作を確認したのはClaude Codeだけです。
他の製品では、hookから次の形式でguardを呼べば同じ判定を使えます。

```sh
echo '{"kind":"command","command":"git push -f origin main","cwd":"."}' \
  | node .harness/upstream/scripts/guard.mjs check --root .
# {"decision":"deny","rule":"git-push-force-protected","reason":"..."}
```

入力の`kind`は`command`（`command`必須）、`read`・`write`（`path`必須）です。`cwd`はroot相対または絶対path。
出力はいつも1行のJSONで、終了codeは0です。製品側で`decision`を見て止めるかどうかを決めます。

## 限界

- コマンドは`;`・`&&`・`|`等で区切った各部分の先頭のコマンドと引数を見るだけです。汎用のshell解析はしません。
  scriptファイル、alias、関数、変数展開（`F=.env; cat "$F"`）、コマンド置換、`npm run`の中身、`grep -r`での暗黙の読み取りは見抜けません。
  `bash -c`と`eval`の文字列は3段まで同じ規則で確認します。
- 保護pathへの書き込みは、Read・Write等のtoolと、`>`のリダイレクトだけを見ます。`cp`・`mv`・`sed -i`・`tee`等による書き込みは見抜けません。
- `pipe-to-shell`は、`sh`・`bash`・`zsh`・`dash`・`ksh`がpipeからコマンドを読む場合だけを見ます。`bash <(curl …)`、`python -`等のshell以外のinterpreter、ダウンロードしてから実行する2段の操作は見抜けません。
- `none`は安全の証明ではありません。止めなかった操作も、Safetyの判定と承認は必要です。
- 依存の追加は、package名を引数に書いた場合だけ見ます。`package.json`等を直接編集してからの`npm install`、`npx <pkg>`の一時実行、
  Makefileや`npm run`の中のinstallは見抜けません。依存の変更は差分レビューで確認します。
- tagのpushは、引数のrefspecとlocal tagの名前から判定します。`push.followTags`の設定による暗黙のtag pushは見抜けません。
- ファイルの読み取りtoolはpathだけを見ます。symlink経由の読み取りは見抜けません。
- pre-pushは`.git/hooks/`に置いた環境でだけ働きます。`--no-verify`で迂回できます。
- 権限制限・network制限・credentialを置かない環境・branch protectionは、引き続き実行環境とGitHub側で用意してください。
