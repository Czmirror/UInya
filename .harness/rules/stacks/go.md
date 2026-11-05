# Go

規約は**gofmt + Effective Go**を基本とします。独自の整形流儀でgofmtを上書きしません。
toolchain versionをprojectで揃え、version変更による差分を通常の機能変更に混ぜないでください。

- Go versionとmodule境界を確認し、go.mod / go.sumを一貫して更新する。
- errorを握りつぶさず、contextによるキャンセルとtimeoutを伝播する。
- goroutineの寿命、channelの所有権、resource closeを確認する。
- gofmt相当のformat check、go vet、go test、必要なbuildを設定する。
- インデントはタブを使うgofmtの出力に従い、共通のスペース規約で上書きしない。
- 並行処理を変更した場合は、環境が対応していればrace検証を追加する。
- module downloadやtestの外部接続は、networkの承認範囲を確認する。
- package名・公開identifier・commentはGoの慣習に合わせ、不要な略語や冗長な名前を避ける。
- unit testは標準testingと既存の補助toolを優先する。新規のlint / test依存を勝手に追加しない。

## 検証コマンドの契約

既存構成に合わせ、対象moduleの`cwd`で`go vet ./...`、`go test ./...`、`go build ./...`を候補にします。
race検証は対象変更と環境に応じて`go test -race ./...`を追加します。
Goのtoolchain自動取得、module取得、cgoやtestの外部アクセスも調査してください。
`go.mod`の`go`・`toolchain`ディレクティブがローカルのGoより新しいと、既定の`GOTOOLCHAIN=auto`は別版を取得します。
取得を防ぐには、ディレクティブをローカル版以下に揃えるか`GOTOOLCHAIN=local`で実行します。
Project Profileのcheckには環境変数を指定する項目がないため、必要ならproject内のwrapperで設定します。

format checkでは`gofmt -l`の終了codeだけで合格にしてはいけません。
整形が必要なファイルが出力された場合にもnonzeroで終了するproject内wrapper等を使います。
vendor・生成物を区別し、CIで`gofmt -w`による自動修正は行いません。
gofmtは`.go`ファイルだけを対象とし、templateや文書のUTF-8・BOM・LFを検査しないため、[共通規約](../core/coding-style.md)の検査もformat checkに加えます。

Runner連携は、Goの小さなWebアプリの試用1件（`go vet`、gofmtのwrapper、`go test -race`、`go build`）で動作を確認しました。
cgo、複数module、vendorを含む構成は未検証です。

## 一次資料

- [Effective Go](https://go.dev/doc/effective_go)
- [gofmt command](https://pkg.go.dev/cmd/gofmt)
