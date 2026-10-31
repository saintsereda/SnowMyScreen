// Export the app's own idle cleaning cursors for the website tool picker.
// W=../app/Snowflakes/Features/Weather
// xcrun swiftc -parse-as-library -o /tmp/export-cleaning-icons scripts/export_cleaning_tool_icons.swift \
//   $W/PixelCleaningCursorFrames.swift $W/RainSqueegeeCursor.swift $W/LeafBroomCursor.swift $W/SnowShovelCursor.swift
// /tmp/export-cleaning-icons images/features/tools \
//   ../app/Snowflakes/Assets.xcassets/SnowShovelCursor.imageset/shovel-2x.png
import AppKit

@main
struct ExportCleaningToolIcons {
    @MainActor static func main() throws {
        guard CommandLine.arguments.count == 3 else {
            fputs("Usage: export-cleaning-icons <output-directory> <shovel-png>\n", stderr)
            exit(64)
        }
        let output = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        guard let shovel = NSImage(contentsOfFile: CommandLine.arguments[2]) else {
            fatalError("Could not read the shovel artwork")
        }
        shovel.size = NSSize(width: 32, height: 48)

        let cursors = [("shovel", SnowShovelCursor.makeFrames(from: shovel)[0]),
                       ("broom", LeafBroomCursor.frames[0]),
                       ("squeegee", RainSqueegeeCursor.frames[0])]
        let bitmaps = cursors.map { name, cursor -> (String, NSBitmapImageRep) in
            guard let bitmap = cursor.image.representations
                .compactMap({ $0 as? NSBitmapImageRep })
                .max(by: { $0.pixelsWide < $1.pixelsWide }) else {
                fatalError("Could not export \(name) cursor")
            }
            return (name, bitmap)
        }

        // One square crop for all tools keeps their relative size and position.
        let crop = bitmaps.map { opaqueBounds($0.1) }.reduce(CGRect.null) { $0.union($1) }
        let side = Int(max(crop.width, crop.height))
        let origin = CGPoint(x: Int(crop.midX) - side / 2, y: Int(crop.midY) - side / 2)
        for (name, bitmap) in bitmaps {
            guard let square = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: side, pixelsHigh: side,
                bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                colorSpaceName: .deviceRGB, bytesPerRow: side * 4, bitsPerPixel: 32),
                  let input = bitmap.bitmapData, let result = square.bitmapData else {
                fatalError("Could not crop \(name) cursor")
            }
            for y in 0..<side {
                for x in 0..<side {
                    let fromX = x + Int(origin.x), fromY = y + Int(origin.y)
                    let to = y * square.bytesPerRow + x * 4
                    guard (0..<bitmap.pixelsWide).contains(fromX), (0..<bitmap.pixelsHigh).contains(fromY) else {
                        for channel in 0..<4 { result[to + channel] = 0 }
                        continue
                    }
                    let from = fromY * bitmap.bytesPerRow + fromX * 4
                    for channel in 0..<4 { result[to + channel] = input[from + channel] }
                }
            }
            guard let data = square.representation(using: .png, properties: [:]) else {
                fatalError("Could not encode \(name) cursor")
            }
            try data.write(to: output.appendingPathComponent(name + ".png"))
            print(name, side, side)
        }
    }

    private static func opaqueBounds(_ bitmap: NSBitmapImageRep) -> CGRect {
        guard let data = bitmap.bitmapData else { return .null }
        var bounds = CGRect.null
        for y in 0..<bitmap.pixelsHigh {
            for x in 0..<bitmap.pixelsWide where data[y * bitmap.bytesPerRow + x * 4 + 3] > 0 {
                bounds = bounds.union(CGRect(x: x, y: y, width: 1, height: 1))
            }
        }
        return bounds
    }
}
