# Screenshot list

The shots below are what every commercial asset (LP, README, app store
gallery, demo thumbnail, marketing tweet) draws from. Capture all of them
before launch and store them in `docs/screenshots/` (gitignored as a
binary directory; commit only what you ship in marketing).

## Capture rules

- 1920×1080 viewport, browser zoom 110%.
- Hide bookmarks bar, tab bar URL clutter.
- Use the dark theme already shipped — don't restyle.
- Cursor in the relevant location, not random.
- Pre-create one polished sample project so titles and chapters look real.
- For "before/after" cover shots, use the same project.

## Required shots

| #  | File                          | Page                                | Description                                                          |
| -- | ----------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| 01 | `01_landing_hero.png`         | `/welcome`                          | Hero with the wordmark and the two CTAs visible.                     |
| 02 | `02_dashboard_with_books.png` | `/`                                 | Dashboard with 4–6 finished projects and the plan/quota banner.      |
| 03 | `03_new_book_form.png`        | `/projects/new`                     | Form filled in, cost estimate visible, similar-books panel showing.  |
| 04 | `04_pipeline_running.png`     | `/projects/<id>` Pipeline tab       | 3 steps green, 1 amber/running, 1 pending. Cost badge visible.       |
| 05 | `05_pipeline_done.png`        | `/projects/<id>` Pipeline tab       | All 10 steps green.                                                  |
| 06 | `06_manuscript.png`           | `/projects/<id>` Manuscript tab     | One chapter expanded with real prose. Word count visible.            |
| 07 | `07_kdp_package.png`          | `/projects/<id>` KDP tab            | Title, subtitle, description, 7 keywords, A+ content visible.        |
| 08 | `08_cover_studio_ebook.png`   | `/projects/<id>` Cover Studio       | Ebook tab. Generated image + title overlay rendered in preview.      |
| 09 | `09_cover_studio_paperback.png` | `/projects/<id>` Cover Studio     | Paperback tab. "Preview with guides" showing bleed/safe/spine.       |
| 10 | `10_exports.png`              | `/projects/<id>` Exports tab        | List of exported files, all with Download buttons.                   |
| 11 | `11_knowledge_search.png`     | `/knowledge`                        | A semantic search query with hits and similarity scores.             |
| 12 | `12_estimate.png`             | `/estimate`                         | Step-by-step cost breakdown for a 30k-word book.                     |
| 13 | `13_settings.png`             | `/settings`                         | API keys section visible (with overrides masked) + cost limit set.   |
| 14 | `14_diagnostics.png`          | `/diagnostics`                      | All providers green, no stuck runs.                                  |
| 15 | `15_pricing.png`              | `/pricing`                          | Three tier cards with Buy buttons.                                   |
| 16 | `16_onboarding_keys.png`      | `/onboard` step 2                   | Keys step with all three masked inputs filled.                       |
| 17 | `17_onboarding_test.png`      | `/onboard` step 3                   | Test step with three green dots and latencies.                       |
| 18 | `18_license_active.png`       | `/license`                          | "Pro" plan active card.                                              |

## Optional / hero composites

| #  | File                          | Description                                                                                    |
| -- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| H1 | `hero_3panel.png`             | Three-panel composite: idea → pipeline → cover.                                                |
| H2 | `hero_zip.png`                | Finder/Explorer window showing the contents of a downloaded ZIP — visually proves the output. |
| H3 | `before_after_cover.png`      | Before: blank trim outline. After: rendered ebook cover.                                       |

## Where they're used

- **README** — H1, 04, 09, 11
- **Landing page** — H1, 02, 04, 09, 15
- **Pricing page (logos / proof)** — 11, 14, 18
- **Demo video thumbnail** — H1
- **App store / Product Hunt** — 01, 04, 09, 11, 15
- **Email to lifetime customers** — 16, 17, 18 (so they recognize the
  flow they're about to do)

## Naming + storage

Filenames are stable so the marketing site can hard-link to them. Store
under `docs/screenshots/` with the names above. Keep the originals in a
separate (unversioned) drive folder; only commit final assets used in
public copy.
