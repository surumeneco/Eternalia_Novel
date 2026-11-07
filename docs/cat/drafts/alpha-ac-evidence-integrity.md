---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.ac-evidence-integrity
status: draft
process: eternalia.alpha-acceptance
source_refs:
  - https://drive.google.com/file/d/1LjaL1FZM-aJhJ2xEy-Jvti17MvEbDuhu/view
  - https://drive.google.com/file/d/1UhPscjapy01dznom8Vm7KHCJkbt0Z5Ls/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# α受入証拠の構造整合性（CAT Draft、実行系のメタ検証）

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.alpha-acceptance | AC-01〜AC-78の機械可読な受入証拠台帳の整合性 |

## 範囲

`docs/alpha-ac-traceability.md` のAC-01〜AC-78が欠落・重複・順序入替・不正な判定で受入者を誤認させないよう、決定論的に機械検査する。これはTaskQueue親のAC台帳保全Workであり、製品の新規機能やCAT規範TestModelの生成ではない。元のGoogle Drive受入仕様は読み取り専用の正本として保持する。

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| AC-META-01 | 台帳にAC行を列挙 | ID順序、78件の重複と欠落、5列構造を確認 | 全78件が一意・順序一致のみ通過 |
| AC-META-02 | 各ACに判定欄がある | `pass`、`fail`、`not-run`、`pending-decision`、`scope-excluded` の列挙を検査 | 不明な状態・空欄は拒否 |
| AC-META-03 | AC全体をpassに変更する | 試験コードパス、40桁の正確なHEAD SHA、GitHub Actions実行URLの記載を確認 | 根拠を持たないpassを拒否 |
| AC-META-04 | 断片的なCIまたは探索的テストが成功する | 台帳が`not-run`を維持できる | 部分証拠を自動的にpassへ昇格させない |

## 非権限・非保証

この静的検査は実際にCIが成功したか、コミットSHAとテストが一致するか、証拠リンクが有効か、ユーザーの実機確認が終わったかを**検証できない**。正規CAT Process Closure / Model Conformance / Implementation Conformance / Confirmed昇格にも該当しない。証拠の真正性は別工程で照合し、誤った合格認定を避ける。
