# CAT Draft — AC-37/38, PB-16: 新規単語の初期公開設定

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md (PB-16), 40_開発・検証/400_受入検証計画.md (AC-37/38)
Scope: 作者の書斎で言語に単語を追加する操作、作成API、公開スナップショットと匿名読者境界。

## Process / invariants

- 新規Wordの初期公開設定は既定で「公開」。作者は作成時に明示して「非公開」を選べる。作成後の値は作者の再読込・編集でも保持する。
- 下書き保存だけでは公開スナップショットを生成しない。初期非公開のWordを明示的に公開版へ反映しても、**本人が公開状態を変更するまで**匿名読者へ露出しない。
- 初期公開のWordは、公開版を明示作成し、公開済み祖先の条件を満たす場合に匿名閲覧できる。
- 非公開Wordの公開状態を明示的に切り替えると、公開版が存在し祖先も公開であれば匿名読者へ反映される。単語の意味・語源は単語の実効公開可否に従う。
- 非Wordの作成・公開挙動は本Workでは変更しない。公開予約日時の未決境界は扱わない。

## Candidate exploratory vectors (not deterministic CAT TestModel)

| Case | Action | Expected |
| --- | --- | --- |
| V1 | 言語配下で新規Wordを開く | 公開設定が既定で有効 |
| V2 | 新規Wordの公開設定を無効化して作成 | 作者APIで `isPublic=false`、公開版なし |
| V3 | 非公開Wordの下書きを保存・明示公開版更新 | 作者には保存されるが匿名APIは404 |
| V4 | 公開版を持つWordを作者が明示公開に変更 | 匿名APIで200、親の公開制約を維持 |
| V5 | 既定のままWordを作成 | `isPublic=true`、ただし公開版生成前は匿名404 |
| V6 | Word以外の作成に初期公開設定を指定 | 不適切な型・対象はAPIで拒否 |

この文書はDraftであり、Confirmedへの無断昇格は行わない。CAT正規process-closure / TestModel / vectors / Queue / generated test / formal Red/Green / implementation-conformanceは未実行。探索的CIを正規Gateのpassとしない。
