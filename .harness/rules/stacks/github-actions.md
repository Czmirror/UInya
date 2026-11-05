# GitHub Actions

[CI/CD](../core/cicd.md)に追加して適用します。対象は`.github/workflows/`と、repository内のcomposite action・reusable workflowです。

- workflowの先頭で`permissions: contents: read`を既定にし、書き込みが必要なjobだけ`permissions`を広げる。
- 外部のactionは`uses: owner/repo@<40桁のcommit SHA> # vX.Y.Z`のようにSHAで固定する。tagやbranchだけで参照しない。
- `actions/checkout`には`persist-credentials: false`を指定する。後続stepでpushが必要な場合だけ、理由を計画に書く。
- `pull_request_target`と`workflow_run`では、PRのコードをcheckout・実行しない。secretsと書き込み権限があるためです。
- `run:`の中で`${{ github.event.pull_request.title }}`、`${{ github.head_ref }}`など外部の人が書ける値を直接展開しない。
  `env:`で環境変数にしてから、`"$PR_TITLE"`のようにquoteして使う。
- jobに`timeout-minutes`を設定する。
- `on.schedule`はUTCで動き、混雑時には遅れたり間引かれたりする。公開repositoryでは60日間活動がないと無効になる。アプリの定期処理に使う場合は`concurrency`で重複実行を防ぎ、[Scheduled jobs](../core/scheduled-jobs.md)に従う。
- productionへのdeploy jobは`environment:`を指定し、environmentの保護（required reviewers）で人間の承認を通す。
- cloudへの認証は、長期のaccess keyをsecretsに置くより、OIDC（`id-token: write`）を優先する。
- secretsを`echo`しない。値を加工して出力する場合は`::add-mask::`を使う。
- AIが失敗したjobを再実行する場合は`gh run rerun <run-id> --failed`を使い、[CI/CD](../core/cicd.md)の回数制限に従う。

検証候補: workflowの構文はPRでの実行結果で確認します。actionlint等の静的検査を追加する場合は、dependency追加として承認を受けます。

## 一次資料

- [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
- [Using environments for deployment](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment)
