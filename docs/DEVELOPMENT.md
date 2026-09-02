# VENTURE INFO 開発運用ルール

## 目的

公開中のVENTURE INFOを停止させず、変更を小さく検証してから本番へ反映する。

## 標準フロー

1. 変更内容と対象ファイルを事前に提示する。
2. 同志ひびの承認後に作業ブランチを作成する。
3. 実装、ローカル検証、GitHub Actions検証を行う。
4. Pull Requestを作成し、結果と既知のリスクを報告する。
5. Merge直前で停止する。
6. 同志ひびの明示的なMerge承認後だけmainへ反映する。
7. 本番表示と主要動線を確認する。

## ブランチ

- 本番: `main`
- 作業: `codex/<変更内容>`
- `main`への直接コミットは禁止する。
- 1つのPull Requestには、原則として1つの目的だけを含める。

## 必須KPI

Pull RequestをMerge可能と判断する最低条件は次のとおり。

- Quality gate: PASS
- 秘密鍵検出: 0件
- 重大な既知不具合: 0件
- 対象動線の確認: 完了
- Merge承認: 取得済み

## セキュリティ境界

フロントエンドへ置いてよいもの:

- Supabase URL
- Supabase publishable / anon key（RLSが有効であること）

GitHubへコミットしてはいけないもの:

- Supabase service-role / secret key
- OpenAI API key
- 管理者PIN・管理トークン
- 秘密鍵、個人アクセストークン、認証情報

秘密情報はSupabase Edge Function Secretsなど、サーバー側のSecret管理へ保存する。

## 企業データ

企業データを追加・変更する場合は、根拠URL、確認日、confidenceを残す。根拠がない項目は推測で補完せず、「要確認」または非表示とする。

## Supabase

スキーマやRLSを変更するPull Requestでは、影響するテーブル、既存データへの影響、ロールバックSQLを明記する。ブラウザの匿名ユーザーへSELECT、UPDATE、DELETE権限を追加する場合は、別途セキュリティレビューを行う。

## ロールバック

本番障害時は、原因となったPull Requestをrevertする。複数の無関係な変更を1つのPull Requestに混在させず、切り戻し可能性を維持する。
