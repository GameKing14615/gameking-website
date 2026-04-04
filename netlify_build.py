from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"

PAGES = ["index.html", "tictactoe.html", "beforegta6.html"]


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


if __name__ == "__main__":
    clean_dist()
    copy_pages()
    copy_static()
    print("Netlify build output prepared in dist/")
