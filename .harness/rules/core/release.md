# Release

リリース・versionの更新・CHANGELOGやリリースノートの作成・tag付けを頼まれたときに適用します。
操作ごとのASKの判定は[Safety](safety.md)と[Git](git.md)、deploy・release pipelineの作り方は[CI/CD](cicd.md)を正本とします。
ここでは、AIがリリースを準備し、人間の承認を受けて実行し、記録を残すまでの順序を決めます。

## 流れ

リリースは次の順で進めます。前の段階を飛ばして次へ進みません。

| 段階 | 担当 | 出口条件 |
| --- | --- | --- |
| 準備 | AI（ローカルの作業だけ） | version案・リリースノート草案・検証結果・rollback手順がそろう |
| 承認 | 人間 | 操作ごとの明示的承認 |
| 実行 | AI（承認範囲だけ） | 承認した操作が終わる、または途中で停止して報告する |
| 記録 | AI | [Release](../../templates/release.md)に結果を残す |
| リリース後の確認 | AIと人間 | 計画した確認の結果がそろう |

計画と記録には[Release](../../templates/release.md)を使います。小さなリリースは関連する項目だけで構いません。

## 準備

準備はローカルの作業で、[Safety](safety.md)のALLOWの範囲で進めます。

- リリースする対象のbranch・revisionを確定する。前回のリリース（tag等）から今回までの変更を集める。
- 既存のversion方式（`package.json`等のmanifest、tag、CHANGELOGの形式）を調べて従う。
  方式がなければ[Semantic Versioning](https://semver.org/)を提案し、人間が決める。AIが独断で方式を決めない。
- version案と根拠を示す。変更ごとに、破壊的変更（公開API・CLI・設定・データ形式・必要な実行環境の変更）かどうかを判定する。
  判定できない変更は「未確定」として示し、互換と決めつけない。
- CHANGELOG・リリースノートの草案を書く。導入先・利用者が対応を必要とする変更は、別の節に分けて先に書く。
- migration・dependency変更・戻せない変更の有無と、rollback手順を書く（[CI/CD](cicd.md)のCD）。
- クレジット・ライセンス文の表示が現在の素材・依存と一致し、成果物に含まれているかを確認する（[Credits](credits.md)）。
- 対象revisionでProject Profileの必須checkを実行し、結果を記録する。失敗・実行不能が残る場合はリリースを提案せず、理由を報告する。
- version番号の更新やCHANGELOGの整理は、通常の変更としてPRに含める。そのPRのmergeとリリースの実行は別の承認にする。

## 承認

- tagの作成・push、packageの公開、GitHub Release等の作成、deployは、操作ごとにASKとする。
  [Approval request](../../templates/approval-request.md)で、操作・対象revision・versionを示す。
- 承認の対象は「version・対象revision・リリースノート」の組とする。どれかが変わったら承認を取り直す。
- 公開したversion番号とpushしたtagは、取り消せないものとして扱う。消して付け直す、同じ番号を再利用する、を前提にしない。
  この不可逆性を承認依頼に書く。
- 計画やリリースPRの承認・mergeは、tag作成や公開の承認を含まない（[Safety](safety.md)）。

## 実行

- 承認した操作だけを、承認したrevisionに対して行う。tagは承認したrevisionにだけ付ける。
- release pipelineがある場合はそれを使い、手元で別にbuildしない（[CI/CD](cicd.md)）。
- 途中で失敗したら、残りの操作を独断で進めない。どこまで済んだか（tag・artifact・公開・deployのどれが完了したか）を報告して止まる。
- 失敗を直すためにtag削除やforce pushをしない。必要なら[Git](git.md)の承認が必要な操作として個別に示す。

## 記録

[Release](../../templates/release.md)に、version、revision、artifact、承認した人と出典、日時、実行結果を残します。
AIが記入した承認欄は承認の証明になりません。会話・PR等の出典を示します。
置き場所は既存の慣習に従い、なければリリースPRの計画（`docs/work/<task-id>/`）に置きます。

## リリース後の確認

- 準備で決めた確認（主要な画面・API・CLIの動作、エラーの増加がないか等）を行い、結果を記録する。
  エラー監視の送信先がある場合は、前のversionと比べたエラーの件数と新しい種類の有無を見る（[Error reporting](error-reporting.md)）。
  Webへ配信する場合は、配信されたファイルとbuild識別子が今回の成果物と一致することを確かめる（[Web delivery](web-delivery.md)）。
  検索で見つけてもらう公開ページがある場合は、本番が`noindex`やrobots.txtで塞がれていないこと、プレビュー環境が検索に出ていないことを確かめる（[Web](../stacks/web.md)の「検索・共有されるページ」）。Search Console等への登録や確認は人間の操作として示す。
  AIが確認できない範囲（production環境の監視など）は未確認として人間に示す。
- 問題が出た場合、rollbackするかどうかは人間が決める。AIは状況、影響、rollback手順を示す。

## 普段の変更でのCHANGELOG

CHANGELOGを持つprojectでは、利用者に見える変更を含むPRで`Unreleased`の節に追記します。
リリースのときに履歴から思い出して書くより、変更と同時に書くほうが漏れが少ないためです。
CHANGELOGを持たないprojectで、新しく作るかどうかは準備の段階で提案します。

## 参考

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
