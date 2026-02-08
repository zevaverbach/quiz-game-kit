# Quiz Game Kit

## Architecture: Monorepo, Two S3 Buckets

Everything lives in this repo:

- `templates/` + `quizzes.toml` — Jinja2 templates and quiz configuration
- `shared/` — `quiz-engine.js`, `styles.css`, quiz `.db` files
- `sites/` — rendered `index.html` + `theme.css` per quiz
- `home/` — landing page (`index.html`)

### S3 Buckets (they are different!)

| Bucket | Hosts | Example |
|--------|-------|---------|
| `s3://quizhive.org/` | Per-quiz `index.html` + `theme.css`, home page | `s3://quizhive.org/beyblade/index.html` |
| `s3://assets.quizhive.org/` | Shared assets (`quiz-engine.js`, `styles.css`, `.db` files) | `s3://assets.quizhive.org/quiz-engine.js` |

**Common mistake:** uploading shared assets to `s3://quizhive.org/` instead of `s3://assets.quizhive.org/`. The HTML references `https://assets.quizhive.org/` for shared assets.

## Render Pipeline

`python3 render_all.py` reads `quizzes.toml` and outputs each quiz's `index.html` to `sites/<prefix>/index.html`.

## Deploying

`python3 deploy.py` uploads everything to S3:
- Each quiz's `index.html` + `theme.css` from `sites/` → `s3://quizhive.org/<s3_path>/`
- Shared assets from `shared/` → `s3://assets.quizhive.org/`
- Home page from `home/index.html` → `s3://quizhive.org/index.html`

## Cloudflare Caching

`assets.quizhive.org` is behind Cloudflare CDN. After uploading new shared assets, **purge the Cloudflare cache** or users will see stale files:

1. Go to https://dash.cloudflare.com/ → quizhive.org → Caching → Configuration
2. Custom Purge the changed URLs (e.g. `https://assets.quizhive.org/quiz-engine.js`)

The `CLOUDFLARE_API_TOKEN` env var exists but does not work for API-based cache purge — use the dashboard.
