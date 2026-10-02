from pathlib import Path
import subprocess
import sys
import shutil

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"
DASHY_ROOT = ROOT / "dashy"
DASHY_DEPLOY = DASHY_ROOT / "deploy"

PAGES = ["index.html", "tictactoe.html", "beforegta6.html", "dashy.html"]


def clean_dist() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)


def copy_pages() -> None:
    for page in PAGES:
        src = TEMPLATES / page
        dst = DIST / page
        shutil.copy2(src, dst)


def copy_static() -> None:
    shutil.copytree(STATIC, DIST / "static", dirs_exist_ok=True)


def build_dashy() -> None:
    """Build Dashy from its source tree and include the generated Netlify assets."""
    subprocess.run(
        [sys.executable, str(DASHY_ROOT / "build.py")],
        cwd=DASHY_ROOT,
        check=True,
    )
    # Sync with Flask source directories
    shutil.copy2(DASHY_DEPLOY / "dashy.html", TEMPLATES / "dashy.html")
    shutil.copytree(
        DASHY_DEPLOY / "static" / "dashy",
        STATIC / "dashy",
        dirs_exist_ok=True,
    )
    # Sync with Netlify dist/ output
    shutil.copy2(DASHY_DEPLOY / "dashy.html", DIST / "dashy.html")
    dashy_directory = DIST / "dashy"
    dashy_directory.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DASHY_DEPLOY / "dashy.html", dashy_directory / "index.html")
    shutil.copytree(
        DASHY_DEPLOY / "static" / "dashy",
        DIST / "static" / "dashy",
        dirs_exist_ok=True,
    )


if __name__ == "__main__":
    clean_dist()
    copy_pages()
    copy_static()
    build_dashy()
    print("Netlify build output prepared in dist/")
