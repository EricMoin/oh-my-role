import DeliveryQueue
import XCTest

final class OutboxTests: XCTestCase {
    func testMenuAndCommandRespectEachPhase() {
        let cases: [(DeliveryPhase, Bool)] = [
            (.queued, true), (.uploading, false), (.confirming, false), (.delivered, true)
        ]
        for (phase, allowed) in cases {
            let selected = Attachment(id: "A", phase: phase)
            let neighbor = Attachment(id: "B", phase: .queued)
            var queue = Outbox(attachments: [selected, neighbor])

            XCTAssertEqual(offersDiscard(for: selected), allowed, "Menu at \(phase)")
            XCTAssertEqual(queue.discard(id: selected.id), allowed, "Command at \(phase)")
            XCTAssertEqual(queue.attachments, allowed ? [neighbor] : [selected, neighbor])
        }
    }

    func testPhaseChangesAfterTheMenuOpens() {
        let item = Attachment(id: "A", phase: .queued)
        var queue = Outbox(attachments: [item])
        XCTAssertTrue(offersDiscard(for: item))
        queue.update(.confirming, for: item.id)

        XCTAssertFalse(queue.discard(id: item.id))
        XCTAssertEqual(queue.attachments, [Attachment(id: "A", phase: .confirming)])
    }

    func testMissingAttachmentPreservesOtherItems() {
        let item = Attachment(id: "A", phase: .queued)
        var queue = Outbox(attachments: [item])
        XCTAssertFalse(queue.discard(id: "missing"))
        XCTAssertEqual(queue.attachments, [item])
    }
}
