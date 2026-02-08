#!/usr/bin/env python3
"""Render all quiz sites from quizzes.toml."""

import tomllib
from pathlib import Path

from render import render

QUIZ_GAMES_DIR = Path.home() / "repos" / "quiz-games"


def main():
    config_path = Path(__file__).parent / "quizzes.toml"
    with open(config_path, "rb") as f:
        config = tomllib.load(f)

    for prefix, quiz in config.items():
        repo_name = quiz.get("repo_name", prefix)

        # Write to sites/<prefix>/index.html
        site_path = Path(__file__).parent / "sites" / prefix / "index.html"
        render(prefix, str(site_path))

        # Write to deployed repo
        deployed_path = QUIZ_GAMES_DIR / repo_name / "index.html"
        if deployed_path.parent.exists():
            render(prefix, str(deployed_path))
        else:
            print(f"Warning: {deployed_path.parent} does not exist, skipping")


if __name__ == "__main__":
    main()
