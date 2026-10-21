// Native SF Symbols for feature points and empty media slots.
// xcrun swift scripts/export_feature_symbols.swift images/features/symbols
import AppKit

guard CommandLine.arguments.count == 2 else {
    fputs("Usage: xcrun swift scripts/export_feature_symbols.swift <output-directory>\n", stderr)
    exit(64)
}
let output = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let tint = NSColor(srgbRed: 0.45, green: 0.51, blue: 0.68, alpha: 1)
let configuration = NSImage.SymbolConfiguration(pointSize: 32, weight: .regular)
    .applying(NSImage.SymbolConfiguration(paletteColors: [tint]))
for name in ["photo.on.rectangle.angled.fill", "gear", "cloud.sun", "desktopcomputer.and.macbook", "lightbulb", "rectangle.on.rectangle"] {
    guard let base = NSImage(systemSymbolName: name, accessibilityDescription: nil),
          let image = base.withSymbolConfiguration(configuration),
          let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 128, pixelsHigh: 128,
              bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
              colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
          let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
        fatalError("Could not render SF Symbol: \(name)")
    }
    bitmap.size = NSSize(width: 32, height: 32)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    context.imageInterpolation = .high
    context.cgContext.scaleBy(x: 4, y: 4)
    context.cgContext.clear(NSRect(x: 0, y: 0, width: 32, height: 32))
    let scale = 30 / max(image.size.width, image.size.height)
    let size = NSSize(width: image.size.width * scale, height: image.size.height * scale)
    image.draw(in: NSRect(x: (32 - size.width) / 2, y: (32 - size.height) / 2, width: size.width, height: size.height))
    NSGraphicsContext.restoreGraphicsState()
    guard let data = bitmap.representation(using: .png, properties: [:]) else { fatalError("PNG export failed") }
    try data.write(to: output.appendingPathComponent(name + ".png"))
    print("\(name): native SF Symbol at 4×")
}
