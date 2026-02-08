# Quiz Game Kit

## Architecture: Two Repos, Two S3 Buckets

This repo holds **templates** and rendered HTML. The shared quiz engine and styles live in a separate repo:

- **`~/repos/quiz-game-kit/`** (this repo) — Jinja2 templates, `quizzes.toml`, rendered `sites/`
- **`~/repos/quiz-data/`** — `quiz-engine.js`, `styles.css`, quiz `.db` files

### S3 Buckets (they are different!)

| Bucket | Hosts | Example |
|--------|-------|---------|
| `s3://quizhive.org/` | Per-quiz `index.html` + `theme.css` | `s3://quizhive.org/beyblade/index.html` |
| `s3://assets.quizhive.org/` | Shared assets (`quiz-engine.js`, `styles.css`, `.db` files) | `s3://assets.quizhive.org/quiz-engine.js` |

**Common mistake:** uploading shared assets to `s3://quizhive.org/` instead of `s3://assets.quizhive.org/`. The HTML references `https://assets.quizhive.org/` for shared assets.

### Deploying shared assets

When `quiz-engine.js` or `styles.css` changes:
```
aws s3 cp ~/repos/quiz-data/quiz-engine.js s3://assets.quizhive.org/quiz-engine.js --content-type "application/javascript" --cache-control "max-age=300, s-maxage=60"
aws s3 cp ~/repos/quiz-data/styles.css s3://assets.quizhive.org/styles.css --content-type "text/css" --cache-control "max-age=300, s-maxage=60"
```

## Cloudflare Caching

`assets.quizhive.org` is behind Cloudflare CDN. After uploading new shared assets, **purge the Cloudflare cache** or users will see stale files:

1. Go to https://dash.cloudflare.com/ → quizhive.org → Caching → Configuration
2. Custom Purge the changed URLs (e.g. `https://assets.quizhive.org/quiz-engine.js`)

The `CLOUDFLARE_API_TOKEN` env var exists but does not work for API-based cache purge — use the dashboard.

## Render Pipeline

`python3 render_all.py` reads `quizzes.toml` and outputs each quiz's `index.html` to **two locations**:
- `sites/<quiz>/index.html` (this repo, for version control)
- `~/repos/quiz-games/<repo_name>/index.html` (individual quiz repos)
