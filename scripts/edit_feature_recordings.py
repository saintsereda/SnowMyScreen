"""Prepare the supplied screen recordings for the feature cards.

Usage: python3 scripts/edit_feature_recordings.py GARLAND_MOV PLACEMENT_MOV
Requires ffmpeg on PATH. Source recordings stay outside the published site.
"""

from pathlib import Path
import argparse
import subprocess


ROOT = Path(__file__).resolve().parent.parent
VIDEOS = ROOT / "videos"


def run(*args):
    subprocess.run(("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *map(str, args)), check=True)


def poster(video, destination, second):
    run("-ss", second, "-i", video, "-frames:v", "1", "-q:v", "3", destination)


def garland_montage(source):
    # Distinct designs in a shuffled order, with alternating short and long holds.
    # These starts leave the source's scene changes and the year's flash out of the edit.
    scenes = (
        (1.0, 3.4),   # colored stars
        (20.5, 2.2),  # classic bulbs
        (39.5, 2.8),  # cats
        (13.0, 2.0),  # trees
        (27.0, 3.0),  # mugs
        (52.2, 2.4),  # year figures
        (34.2, 2.2),  # clovers
        (45.5, 3.0),  # dogs
        (56.8, 2.6),  # gold sparkles
    )
    fade = 0.24
    filters = []
    for index, (start, duration) in enumerate(scenes):
        filters.append(
            f"[0:v]trim=start={start}:duration={duration},setpts=PTS-STARTPTS,"
            f"fps=30,crop=1728:972:0:0,scale=1440:810:flags=lanczos,format=yuv420p[s{index}]"
        )
    total = scenes[0][1]
    previous = "s0"
    for index, (_, duration) in enumerate(scenes[1:], 1):
        offset = total - fade
        output = f"x{index}"
        filters.append(f"[{previous}][s{index}]xfade=transition=fade:duration={fade}:offset={offset:.3f}[{output}]")
        previous = output
        total += duration - fade
    destination = VIDEOS / "garland-showcase.mp4"
    run("-i", source, "-filter_complex", ";".join(filters), "-map", f"[{previous}]",
        "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", destination)
    poster(destination, VIDEOS / "garland-showcase.jpg", 0.5)


def placement_recordings(source):
    settings = ("-an", "-c:v", "libx264", "-preset", "medium", "-crf", "25",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart")
    # The new recording shows desktop, over windows, then top strip in order.
    scenes = (
        ("desktop", 0.4, 9.8, "placement-desktop", 2),
        ("over", 14.0, 24.5, "placement-over-windows", 1),
        ("strip", 25.4, 38.0, "placement-top-strip", 3),
    )
    for _, start, end, basename, poster_second in scenes:
        video = VIDEOS / f"{basename}.mp4"
        run("-i", source,
            "-vf", f"trim=start={start}:end={end},setpts=PTS-STARTPTS,fps=24,scale=960:-2",
            *settings, video)
        poster(video, VIDEOS / f"{basename}.jpg", poster_second)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("garland_mov", type=Path)
    parser.add_argument("placement_mov", type=Path)
    args = parser.parse_args()
    garland_montage(args.garland_mov)
    placement_recordings(args.placement_mov)
