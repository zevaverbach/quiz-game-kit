# Shared Assets

Shared quiz engine, styles, and SQLite question databases. Deployed to `s3://assets.quizhive.org/`.

## Schema

```sql
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct INTEGER NOT NULL CHECK(correct BETWEEN 0 AND 3),
    fun_fact TEXT,
    wiki_url TEXT
);
```

## Available Databases

| File | Questions | Topic |
|------|-----------|-------|
| `sample-quiz.db` | 3 | Sample/template questions |
| `system-design.db` | 200 | System design interview prep |
| `beyblade-x.db` | 100 | Beyblade X trivia |
| `greek-mythology.db` | 722 | Greek mythology trivia |

## Creating New Databases

Use any SQLite client to create and populate a `.db` file following the schema above. The `correct` field is a 0-based index (0 = option_a, 1 = option_b, 2 = option_c, 3 = option_d).
