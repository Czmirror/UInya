# クリスマス素材とブラウザー回帰試験

2026-11-24の会話で、ユーザーからクリスマス素材と12カテゴリの自動試験・CI差分の作成を依頼された。当初はローカル差分のみの依頼。2026-11-25の会話でユーザーがpush・問題のないPRのマージ・公開を承認した。

基点はmainの370b4a2。作業ブランチは codex/christmas-assets-browser-tests。PR #49の未マージ素材は今回の基点に含めない。

1. 固定バージョンのPlaywright Testを追加し、通常の素材棚と保存・書き出しの入口から12カテゴリを検証する。
2. ビルドとプレビューをテスト設定が起動し、/UInya/ を実HTTPで確認する。
3. GitHub Actionsに読み取り権限だけの独立したブラウザージョブを追加する。Harnessの既存チェックはそのまま実行する。
4. サンタ帽とプレゼント箱をアクセントへ追加し、同じ自動試験で表示・配置・出力を確かめる。
5. ローカルのHarnessとブラウザー試験を実行し、Linux CIの未確認を明記する。

仕様・試験結果は docs/specs/browser-asset-checks.md と docs/tests/functional/browser-asset-checks.md に記録する。次の優先項目は、Linux CIの初回実行結果を確認すること。
