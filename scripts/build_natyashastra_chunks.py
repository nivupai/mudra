"""
Parse an OCR'd Natyashastra text file into page-tagged, chapter-tagged
chunks for client-side search (MiniSearch) on the "Ask the Natya Shastra"
page. Expects the source text to use "=== PDF Page N ===" page markers and
"CHAPTER <WORD>" headings, matching the Manomohan Ghosh translation (Vol. I)
OCR this was built against.

Run from the mudra-app/ directory:
    python3 scripts/build_natyashastra_chunks.py /path/to/natyashastra_full_text.txt
"""
import json
import re
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "natyashastra_full_text.txt"
OUT = "public/data/natyashastra_chunks.json"

PAGE_RE = re.compile(r"^=== PDF Page (\d+) ===$")
CHAPTER_RE = re.compile(r"^CHAPTER\s+[A-Z]+$")
TARGET_WORDS = 160

def main():
    with open(SRC, encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f]

    page = 0
    chapter_num_line = None
    chapter_title = None
    buf = []
    chunks = []

    def flush():
        nonlocal buf
        text = " ".join(" ".join(buf).split())
        if text and len(text.split()) >= 8:  # skip near-empty fragments
            chunks.append({
                "page": page,
                "chapter": chapter_title,
                "text": text,
            })
        buf = []

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        m = PAGE_RE.match(line)
        if m:
            flush()
            page = int(m.group(1))
            i += 1
            continue
        if line.strip() == "[blank/no text]":
            i += 1
            continue
        if CHAPTER_RE.match(line.strip()):
            flush()
            chapter_num_line = line.strip()
            # the next non-blank line is usually the chapter title
            j = i + 1
            while j < n and not lines[j].strip():
                j += 1
            title = lines[j].strip() if j < n else ""
            # strip trailing ", Pages N-M" from ToC-style headings
            title = re.sub(r",?\s*Pages?\s+[\dLXVICM]+(-[\dLXVICM]+)?\.?$", "", title, flags=re.I)
            chapter_title = f"{chapter_num_line.title()}: {title}".strip(": ")
            i += 1
            continue
        if not line.strip():
            # paragraph break — flush if buffer is already a decent size
            if sum(len(s.split()) for s in buf) >= TARGET_WORDS:
                flush()
            else:
                buf.append("")  # preserve as a soft break (collapsed later)
            i += 1
            continue
        buf.append(line.strip())
        i += 1
    flush()

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False)

    print(f"{len(chunks)} chunks written to {OUT}")
    print(f"total words: {sum(len(c['text'].split()) for c in chunks):,}")
    import os
    print(f"file size: {os.path.getsize(OUT)/1e6:.2f} MB")


if __name__ == "__main__":
    main()
