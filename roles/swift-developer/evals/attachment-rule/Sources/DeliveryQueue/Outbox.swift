// Starting implementation for the attachment-rule exercise in DESIGN.md.
public enum DeliveryPhase: Equatable {
    case queued, uploading, confirming, delivered
}

public struct Attachment: Equatable {
    public let id: String
    public var phase: DeliveryPhase

    public init(id: String, phase: DeliveryPhase) {
        self.id = id
        self.phase = phase
    }
}

public struct Outbox {
    public private(set) var attachments: [Attachment]

    public init(attachments: [Attachment]) {
        self.attachments = attachments
    }

    public mutating func update(_ phase: DeliveryPhase, for id: String) {
        guard let index = attachments.firstIndex(where: { $0.id == id }) else { return }
        attachments[index].phase = phase
    }

    @discardableResult
    public mutating func discard(id: String) -> Bool {
        guard let index = attachments.firstIndex(where: { $0.id == id }) else { return false }
        attachments.remove(at: index)
        return true
    }
}

public func offersDiscard(for attachment: Attachment) -> Bool {
    attachment.phase != .uploading
}
