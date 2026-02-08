#!/usr/bin/env python3
"""Deploy all quiz assets to S3."""

import subprocess
import sys
import tomllib
from pathlib import Path

CONTENT_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".db": "application/octet-stream",
}

CACHE_CONTROL = {
    ".html": "max-age=300, s-maxage=60",
    ".css": "max-age=300, s-maxage=60",
    ".js": "max-age=300, s-maxage=60",
    ".db": "max-age=300, s-maxage=60",
}

ROOT = Path(__file__).parent


def s3_cp(local: Path, s3_url: str) -> None:
    ext = local.suffix
    content_type = CONTENT_TYPES.get(ext, "application/octet-stream")
    cache_control = CACHE_CONTROL.get(ext, "max-age=300, s-maxage=60")
    cmd = [
        "aws", "s3", "cp", str(local), s3_url,
        "--content-type", content_type,
        "--cache-control", cache_control,
    ]
    print(f"  {local} → {s3_url}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)


def main():
    config_path = ROOT / "quizzes.toml"
    with open(config_path, "rb") as f:
        config = tomllib.load(f)

    # Deploy quiz sites to s3://quizhive.org/<s3_path>/
    print("Deploying quiz sites to s3://quizhive.org/")
    for prefix, quiz in config.items():
        s3_path = quiz["s3_path"]
        site_dir = ROOT / "sites" / prefix
        for filename in ["index.html", "theme.css"]:
            local = site_dir / filename
            if local.exists():
                s3_cp(local, f"s3://quizhive.org/{s3_path}/{filename}")

    # Deploy home page
    print("\nDeploying home page")
    home = ROOT / "home" / "index.html"
    if home.exists():
        s3_cp(home, "s3://quizhive.org/index.html")

    # Deploy shared assets to s3://assets.quizhive.org/
    print("\nDeploying shared assets to s3://assets.quizhive.org/")
    shared_dir = ROOT / "shared"
    for path in sorted(shared_dir.iterdir()):
        if path.suffix in CONTENT_TYPES:
            s3_cp(path, f"s3://assets.quizhive.org/{path.name}")

    print("\nDone!")


if __name__ == "__main__":
    main()
