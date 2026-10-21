// Export the app's own idle cleaning cursors for the website tool picker.
// xcrun swiftc -o /tmp/export-cleaning-icons scripts/export_cleaning_tool_icons.swift \
//   ../app/Snowflakes/RainSqueegeeCursor.swift ../app/Snowflakes/LeafBroomCursor.swift
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
        try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))
            .write(to: output.appendingPathComponent("shovel.png"))

        for (name, cursor) in [("broom", LeafBroomCursor.frames[0]),
                               ("squeegee", RainSqueegeeCursor.frames[0])] {
            guard let bitmap = cursor.image.representations
                .compactMap({ $0 as? NSBitmapImageRep })
                .max(by: { $0.pixelsWide < $1.pixelsWide }),
                  let data = bitmap.representation(using: .png, properties: [:]) else {
                fatalError("Could not export \(name) cursor")
            }
            try data.write(to: output.appendingPathComponent(name + ".png"))
        }
    }
}
