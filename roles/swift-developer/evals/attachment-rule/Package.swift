// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "AttachmentRuleTrial",
    products: [.library(name: "DeliveryQueue", targets: ["DeliveryQueue"])],
    targets: [
        .target(name: "DeliveryQueue"),
        .testTarget(name: "DeliveryQueueTests", dependencies: ["DeliveryQueue"])
    ]
)
