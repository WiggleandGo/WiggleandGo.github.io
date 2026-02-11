#!/usr/bin/env python3
"""
Crop videos for the website and save to static/videos/cropped/.

Uses ffmpeg to produce H.264 MP4s that play in browsers and standard players.

- Stacked videos (*_rope_stacked.mp4, stacked_*.mp4): crop 30% from the left.
- Hero video (daruma_block_1.mp4): crop 20% from the top.
"""

import os
import shutil
import subprocess
import sys

# Paths relative to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEOS_DIR = os.path.join(PROJECT_ROOT, "static", "videos")
CROPPED_DIR = os.path.join(VIDEOS_DIR, "cropped")

# Stacked videos: crop 30% from the left (keep right 70%)
STACKED_LEFT_CROP = 0.30  # fraction to remove from left

# Hero video: crop 10% from the top (keep bottom 90%)
HERO_TOP_CROP = 0.10  # fraction to remove from top

STACKED_PATTERNS = (
    "brown_rope_stacked.mp4",
    "chain_rope_stacked.mp4",
    "orange_rope_stacked.mp4",
    "red_rope_stacked.mp4",
    "yellow_rope_stacked.mp4",
    "stacked_45_5_rgb_video.mp4",
    "stacked_45_10_rgb_video.mp4",
    "stacked_45_20_rgb_video.mp4",
    "stacked_45_30_rgb_video.mp4",
    "stacked_55_5_rgb_video.mp4",
    "stacked_65_5_rgb_video.mp4",
)

HERO_VIDEO = "daruma_block_1.mp4"


def check_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def crop_video_left(in_path: str, out_path: str, crop_left_fraction: float) -> None:
    """Crop a fraction from the left using ffmpeg. Output: H.264 MP4."""
    # crop=out_w:out_h:x:y  (x,y = top-left of output in input)
    # Keep right (1 - crop_left_fraction) of width, start at x = crop_left_fraction * iw
    w_expr = f"iw*{1 - crop_left_fraction:.4f}"
    x_expr = f"iw*{crop_left_fraction:.4f}"
    vf = f"crop={w_expr}:ih:{x_expr}:0"
    cmd = [
        "ffmpeg",
        "-y",
        "-i", in_path,
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-movflags", "+faststart",  # better for web playback
        "-pix_fmt", "yuv420p",       # required for broad compatibility
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    print(f"  -> {out_path}")


def crop_video_top(in_path: str, out_path: str, crop_top_fraction: float) -> None:
    """Crop a fraction from the top using ffmpeg. Output: H.264 MP4."""
    # crop=iw:out_h:0:y  -> full width, height 80%, y offset = 20% of input height
    h_expr = f"ih*{1 - crop_top_fraction:.4f}"
    y_expr = f"ih*{crop_top_fraction:.4f}"
    vf = f"crop=iw:{h_expr}:0:{y_expr}"
    cmd = [
        "ffmpeg",
        "-y",
        "-i", in_path,
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    print(f"  -> {out_path}")


def main() -> None:
    if not check_ffmpeg():
        print("ffmpeg is required. Install it (e.g. apt install ffmpeg, brew install ffmpeg).", file=sys.stderr)
        sys.exit(1)

    os.makedirs(CROPPED_DIR, exist_ok=True)

    for name in STACKED_PATTERNS:
        in_path = os.path.join(VIDEOS_DIR, name)
        if not os.path.isfile(in_path):
            print(f"Skip (not found): {name}")
            continue
        out_path = os.path.join(CROPPED_DIR, name)
        print(f"Crop left 30%: {name}")
        crop_video_left(in_path, out_path, STACKED_LEFT_CROP)

    hero_path = os.path.join(VIDEOS_DIR, HERO_VIDEO)
    if os.path.isfile(hero_path):
        out_path = os.path.join(CROPPED_DIR, HERO_VIDEO)
        print(f"Crop top 10%: {HERO_VIDEO}")
        crop_video_top(hero_path, out_path, HERO_TOP_CROP)
    else:
        print(f"Skip (not found): {HERO_VIDEO}")

    print("Done. Cropped videos are in static/videos/cropped/")


if __name__ == "__main__":
    main()
