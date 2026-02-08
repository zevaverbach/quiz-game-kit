#!/usr/bin/env python3
"""Render all quiz sites from quizzes.toml."""

import tomllib
from pathlib import Path

from render import render


def main():
    config_path = Path(__file__).parent / "quizzes.toml"
    with open(config_path, "rb") as f:
        config = tomllib.load(f)

    for prefix in config:
        site_path = Path(__file__).parent / "sites" / prefix / "index.html"
        render(prefix, str(site_path))


if __name__ == "__main__":
    main()
