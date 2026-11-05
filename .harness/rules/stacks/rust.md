# Rust

**Rust Style Guide + rustfmt + Clippy**を基本とします。
インデントはスペース4、文字コード・改行は[共通規約](../core/coding-style.md)に従います。
対象edition、最低対応Rust version（MSRV）、toolchain、workspace、features、targetを最初に確認します。
既存rustfmt設定を尊重し、toolchainやeditionの変更を通常の機能修正へ混ぜません。

## 実装・安全性

- ownershipとborrowingを明確にし、不要なcloneや共有可変状態で設計上の問題を隠さない。
- 回復可能な失敗はResult / Optionで扱い、入力やI/Oの失敗に安易なunwrap / expectを使わない。
  panicが妥当な不変条件は根拠を説明し、testする。
- unsafeは必要最小限に限定し、守るべき不変条件・呼び出し側の責務・検証方法を記録する。
  FFIやunsafeを導入した場合は、完了報告と人間レビューの対象にする。
- async処理のcancel、lockの保持範囲、taskとresourceの寿命を確認する。
- public API・traitの変更、error型、feature変更の互換性を確認する。
- 境界の分離にはmodule・crate・関数・traitを必要に応じて使い、層ごとのcrate分割を強制しない。
- Cargo.toml / Cargo.lockと既存のlockfile運用を尊重する。crate追加や大規模更新はASK。
- build.rs、proc macro、Cargo設定のrunner / linker等はコード実行経路として調査する。
  `cargo check`でもbuild scriptやproc macroが実行され得るため、安全な読取操作とは扱わない。

## 検証コマンドの契約

以下は採用済みtoolchain・依存が使える場合の候補です。対象workspaceの`cwd`で実行します。

| stage | 候補 |
| --- | --- |
| format | `cargo fmt --all -- --check` |
| lint | `cargo clippy --workspace --all-targets --locked -- -D warnings` |
| typecheck | `cargo check --workspace --all-targets --locked` |
| test | `cargo test --workspace --locked` |
| build | `cargo build --workspace --locked` |

Clippyのwarning扱いは既存方針とtoolchainに合わせ、検査を無断で緩和しません。
言語のformatterとは別に、[共通規約](../core/coding-style.md)の文字コード・BOM・LFの検査もformat checkに加えます。
必要なfeature / targetの組合せを計画で選びます。相互排他的featureがある場合もあるため、
`--all-features`を機械的に指定しません。doc testも含め、実行した組合せを報告します。

`--locked`はlockfile更新を防ぎますが、networkアクセスやコード実行を禁止するものではありません。
lockfileが必要なら承認済み計画で準備し、未取得依存・toolchain・componentのinstallは別途承認します。
cacheが揃っている場合のoffline実行も検討し、取得できない状態を成功扱いしません。
projectで採用したsecurity checkを別途設定し、Clippyだけでsecurityを保証したとは報告しません。

自動検出はCargo.tomlの存在から候補を示すだけです。Cargo・build.rs・proc macroは起動しません。
workspace rootとmemberはそれぞれ候補になり、適用パスと実行対象は人間と確認します。
既定の生成directoryであるtargetは探索対象外です。独自の出力先は導入先で別途扱います。
このスタックはルール・候補検出提供段階で、RustアプリへのRunner連携は未検証です。

## 一次資料

- [Rust Style Guide](https://doc.rust-lang.org/style-guide/)
- [Clippy usage](https://doc.rust-lang.org/clippy/usage.html)
- [Cargo fmt](https://doc.rust-lang.org/cargo/commands/cargo-fmt.html)
- [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html)
- [Rust procedural macros](https://doc.rust-lang.org/reference/procedural-macros.html)
