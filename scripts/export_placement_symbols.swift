// White native SF Symbols for the placement choices on the website.
// xcrun swift scripts/export_placement_symbols.swift images/features/placement
import AppKit

guard CommandLine.arguments.count == 2 else {
    fputs("Usage: xcrun swift scripts/export_placement_symbols.swift <output-directory>\n", stderr)
    exit(64)
}

let output = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let configuration = NSImage.SymbolConfiguration(pointSize: 28, weight: .medium)
    .applying(NSImage.SymbolConfiguration(paletteColors: [.white]))

for (filename, symbol) in [
    ("over-windows", "interface.window.on.rectangle"),
    ("desktop-only", "desktopcomputer"),
    ("top-strip", "inset.filled.tophalf.rectangle"),
] {
    guard let base = NSImage(systemSymbolName: symbol, accessibilityDescription: nil),
          let image = base.withSymbolConfiguration(configuration),
          let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 160, pixelsHigh: 160,
              bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
              colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
          let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
        fatalError("Could not render SF Symbol: \(symbol)")
    }
    bitmap.size = NSSize(width: 40, height: 40)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    context.imageInterpolation = .high
    context.cgContext.scaleBy(x: 4, y: 4)
    context.cgContext.clear(NSRect(x: 0, y: 0, width: 40, height: 40))
    let scale = 30 / max(image.size.width, image.size.height)
    let size = NSSize(width: image.size.width * scale, height: image.size.height * scale)
    image.draw(in: NSRect(x: (40 - size.width) / 2, y: (40 - size.height) / 2,
                          width: size.width, height: size.height))
    NSGraphicsContext.restoreGraphicsState()
    guard let data = bitmap.representation(using: .png, properties: [:]) else {
        fatalError("PNG export failed: \(symbol)")
    }
    try data.write(to: output.appendingPathComponent(filename + ".png"))
    print("\(symbol): native SF Symbol at 4×")
}
