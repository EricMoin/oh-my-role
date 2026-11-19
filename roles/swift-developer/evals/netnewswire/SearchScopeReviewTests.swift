import ArticlesDatabase
import RSParser
import Testing

@MainActor
struct SearchScopeReviewTests {
    @Test func feedScopeAndTimelineSnapshotSelectDifferentMatches() async throws {
        let database = ArticlesDatabase(
            databaseFilePath: ":memory:", accountID: "review", retentionStyle: .feedBased
        )
        let items: Set<ParsedItem> = [
            story("first", title: "Orchid indoors"),
            story("second", title: "Growing an orchid"),
            story("other", title: "Growing basil")
        ]
        let change = await database.updateAsync(parsedItems: items, feedID: "garden", deleteOlder: false)
        let inserted = try #require(change.new)
        let byKey = Dictionary(uniqueKeysWithValues: inserted.map { ($0.uniqueID, $0.articleID) })
        let first = try #require(byKey["first"])
        let second = try #require(byKey["second"])
        let other = try #require(byKey["other"])

        let inFeeds = await database.fetchArticlesMatchingAsync(searchString: "orchid", feedIDs: ["garden"])
        #expect(Set(inFeeds.map(\.articleID)) == [first, second])

        let inTimeline = await database.fetchArticlesMatchingWithArticleIDsAsync(
            searchString: "orchid", articleIDs: [first, other]
        )
        #expect(Set(inTimeline.map(\.articleID)) == [first])

        let emptyTimeline = await database.fetchArticlesMatchingWithArticleIDsAsync(
            searchString: "orchid", articleIDs: []
        )
        #expect(emptyTimeline.isEmpty)
    }

    private func story(_ id: String, title: String) -> ParsedItem {
        ParsedItem(
            syncServiceID: nil, uniqueID: id, feedURL: "garden", url: nil, externalURL: nil,
            title: title, language: nil, contentHTML: nil, contentText: nil, markdown: nil,
            summary: nil, imageURL: nil, thumbnailURL: nil, bannerImageURL: nil,
            datePublished: nil, dateModified: nil, authors: nil, tags: nil, attachments: nil
        )
    }
}
