#!/usr/bin/env python3
"""Render a single quiz site's index.html from the Jinja2 template."""

import argparse
import sys
import tomllib
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

DEFAULTS = {
    "google_fonts": "Cinzel:wght@400;700;900&family=Spectral:ital,wght@0,400;1,400",
    "theme_css_comment": "Custom Theme Override",
    "login_heading": "Welcome!",
    "username_label": "Enter your name:",
    "username_placeholder": "Your name...",
    "start_button": "Start Quiz",
    "logout_button": "Change User",
    "play_again": "Play Again",
}


def js_string(s: str) -> str:
    """Format a string as a JS single-quoted string literal."""
    escaped = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{escaped}'"


def theme_to_js(theme: dict) -> str:
    """Convert a TOML theme dict to a JS object literal string."""
    lines = ["{"]
    entries = list(theme.items())
    for i, (key, value) in enumerate(entries):
        trailing = "," if i < len(entries) - 1 else ""
        if key == "ranks":
            lines.append("            ranks: [")
            # Align min values: pad the number so label columns line up
            max_min_width = max(len(str(r["min"])) for r in value)
            for j, rank in enumerate(value):
                min_str = str(rank["min"])
                padding = " " * (max_min_width - len(min_str))
                lines.append(
                    f"                {{ min: {min_str},{padding} label: {js_string(rank['label'])} }},"
                )
            lines.append(f"            ]{trailing}")
        elif isinstance(value, list):
            items = ", ".join(js_string(v) if isinstance(v, str) else str(v) for v in value)
            lines.append(f"            {key}: [{items}]{trailing}")
        elif isinstance(value, str):
            lines.append(f"            {key}: {js_string(value)}{trailing}")
        else:
            lines.append(f"            {key}: {value}{trailing}")
    lines.append("        }")
    return "\n".join(lines)


def render(prefix: str, output: str | None = None) -> str:
    """Render index.html for the given quiz prefix."""
    config_path = Path(__file__).parent / "quizzes.toml"
    with open(config_path, "rb") as f:
        config = tomllib.load(f)

    if prefix not in config:
        print(f"Error: quiz '{prefix}' not found in quizzes.toml", file=sys.stderr)
        print(f"Available quizzes: {', '.join(config.keys())}", file=sys.stderr)
        sys.exit(1)

    quiz = config[prefix]
    theme = quiz.get("theme")

    template_vars = {**DEFAULTS, **quiz}
    template_vars["theme"] = theme
    if theme:
        template_vars["theme_js"] = theme_to_js(theme)

    env = Environment(
        loader=FileSystemLoader(Path(__file__).parent / "templates"),
        keep_trailing_newline=True,
    )
    template = env.get_template("index.html.j2")
    result = template.render(**template_vars)

    if output:
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        Path(output).write_text(result)
        print(f"Wrote {output}", file=sys.stderr)
    else:
        sys.stdout.write(result)

    return result


def main():
    parser = argparse.ArgumentParser(description="Render a quiz site's index.html")
    parser.add_argument("prefix", help="Quiz prefix (e.g. greek-myth)")
    parser.add_argument("-o", "--output", help="Output file path (default: stdout)")
    args = parser.parse_args()
    render(args.prefix, args.output)


if __name__ == "__main__":
    main()
