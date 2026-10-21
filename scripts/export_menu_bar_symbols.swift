// Native SF Symbols for the website's decorative menu bars.
// Run on macOS: xcrun swift scripts/export_menu_bar_symbols.swift images/menu-bar
import AppKit

enum ExportFailure: Error { case unavailableSymbol(String), cannotCreateBitmap, cannotEncodePNG }

func exportSymbols(to output: URL) throws {
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

    let configuration = NSImage.SymbolConfiguration(pointSize: 16, weight: .medium)
        .applying(NSImage.SymbolConfiguration(paletteColors: [.white]))
    let names = ["apple.logo", "wifi", "speaker.wave.2.fill", "battery.100percent",
                 "magnifyingglass", "switch.2", "snowflake", "cloud.rain", "leaf",
                 "camera.macro", "sparkles", "lightbulb"]
    for name in names {
        guard let image = NSImage(systemSymbolName: name, accessibilityDescription: nil)?
            .withSymbolConfiguration(configuration) else { throw ExportFailure.unavailableSymbol(name) }
        image.isTemplate = false
        let scale: CGFloat = 4
        let bounds = CGRect(origin: .zero, size: image.size)
        guard let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil,
            pixelsWide: Int(image.size.width * scale), pixelsHigh: Int(image.size.height * scale),
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
            let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
            throw ExportFailure.cannotCreateBitmap
        }
        bitmap.size = image.size
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = context
        context.cgContext.scaleBy(x: scale, y: scale)
        context.cgContext.clear(bounds)
        context.imageInterpolation = .high
        image.draw(in: bounds)
        NSGraphicsContext.restoreGraphicsState()
        guard let data = bitmap.representation(using: .png, properties: [:]) else {
            throw ExportFailure.cannotEncodePNG
        }
        try data.write(to: output.appendingPathComponent(name + ".png"))
        print("\(name): native SF Symbol, \(bitmap.pixelsWide)×\(bitmap.pixelsHigh) pixels")
    }
}

guard CommandLine.arguments.count == 2 else {
    fputs("Usage: xcrun swift scripts/export_menu_bar_symbols.swift <output-directory>\n", stderr)
    exit(64)
}
do {
    try exportSymbols(to: URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true))
} catch {
    fputs("SF Symbol export failed: \(error)\n", stderr)
    exit(1)
}
