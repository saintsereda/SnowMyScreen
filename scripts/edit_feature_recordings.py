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
    # Distinct scenes, with alternating short and long holds. The source changes
    # scene in order; these starts leave its transition frames out of the edit.
    scenes = (
        (0.5, 3.6),   # cool white bulbs
        (13.1, 2.1),  # warm bulbs
        (18.3, 2.8),  # hearts
        (24.4, 3.2),  # stars
        (32.5, 2.2),  # multicolor rounds
        (39.1, 2.6),  # year figures
        (44.4, 2.0),  # gifts
        (50.3, 3.5),  # gold lights
        (69.0, 2.3),  # red lights
        (75.0, 3.1),  # multicolor finale
    )
    fade = 0.24
    filters = []
    for index, (start, duration) in enumerate(scenes):
        filters.append(
            f"[0:v]trim=start={start}:duration={duration},setpts=PTS-STARTPTS,"
            f"fps=24,crop=1298:730:0:0,scale=960:540,format=yuv420p[s{index}]"
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
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", destination)
    poster(destination, VIDEOS / "garland-showcase.jpg", 0.5)


def placement_recordings(source):
    settings = ("-an", "-c:v", "libx264", "-preset", "medium", "-crf", "25",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart")

    # The first and last stretches keep the snow behind the browser window;
    # the middle stretch shows it falling in front of the window.
    desktop = VIDEOS / "placement-desktop.mp4"
    filter_graph = (
        "[0:v]trim=start=0.2:end=9.6,setpts=PTS-STARTPTS,fps=24,scale=960:-2[a];"
        "[0:v]trim=start=26.7:end=48.7,setpts=PTS-STARTPTS,fps=24,scale=960:-2[b];"
        "[a][b]concat=n=2:v=1:a=0[out]"
    )
    run("-i", source, "-filter_complex", filter_graph, "-map", "[out]", *settings, desktop)
    poster(desktop, VIDEOS / "placement-desktop.jpg", 3)

    over = VIDEOS / "placement-over-windows.mp4"
    run("-i", source, "-vf", "trim=start=10.5:end=25.4,setpts=PTS-STARTPTS,fps=24,scale=960:-2",
        *settings, over)
    poster(over, VIDEOS / "placement-over-windows.jpg", 5)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("garland_mov", type=Path)
    parser.add_argument("placement_mov", type=Path)
    args = parser.parse_args()
    garland_montage(args.garland_mov)
    placement_recordings(args.placement_mov)
