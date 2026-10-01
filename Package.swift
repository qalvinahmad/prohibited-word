// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "ProhibitedWord",
  platforms: [.macOS(.v12), .iOS(.v15), .watchOS(.v8), .tvOS(.v15)],
  products: [
    .library(name: "ProhibitedWord", targets: ["ProhibitedWord"])
  ],
  targets: [
    .target(
      name: "ProhibitedWord",
      path: "packages/swift/Sources/ProhibitedWord",
      resources: [
        .copy("words.json"),
        .copy("words-lite.json")
      ]
    ),
    .testTarget(
      name: "ProhibitedWordTests",
      dependencies: ["ProhibitedWord"],
      path: "packages/swift/Tests/ProhibitedWordTests"
    ),
  ]
)
