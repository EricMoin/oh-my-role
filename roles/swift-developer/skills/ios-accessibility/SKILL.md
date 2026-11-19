---
name: ios-accessibility
description: Use when an iOS action is hard to hear, name, focus or activate with VoiceOver, Voice Control, Switch Control or a keyboard, or when larger text or a translation makes it unreachable.
---

# iOS accessibility

Name the task and input method, then inspect the accessibility element actually exported by the owning SwiftUI view or UIKit control. For example, a grouped row may swallow a perfectly labelled child button. For a UIKit control embedded in SwiftUI, inspect the composed hierarchy before adding semantics on either side.

| User report | First observation |
| --- | --- |
| “I hear Delete twice, then lose my place.” | With VoiceOver, inspect the row and child elements, activate the action, then record where focus moves after removal. |
| “I can see Save, but saying ‘Tap Save’ does nothing.” | With Voice Control on a physical device, show names and speak the visible control name. Inspect its input labels and competing names. A UI-test identifier serves a different consumer. |
| “I can swipe the row, but my switch can't reach its action.” | Follow the Switch Control scan through the row and its actions. Provide an accessible equivalent for the gesture and complete it through scanning. |
| “I can't get out of this sheet with my keyboard.” | With Full Keyboard Access, follow focus into the sheet, activate its controls, dismiss it and observe where focus returns. |

Use the assistive input from the report for acceptance. A semantic inspection can identify a missing label even when hardware for the final check is unavailable. [Testing with assistive technologies](https://developer.apple.com/documentation/accessibility/performing-accessibility-testing-for-your-app)

| Symptom | Change to consider | Observable check |
| --- | --- | --- |
| VoiceOver reads an icon filename, announces a custom toggle as plain text, or lands on a decorative image | Use a standard button or toggle when it has the desired behavior. Supply a localized label and meaningful value or trait for custom controls. Remove purely decorative content from traversal. | Navigate in both directions with VoiceOver. Hear the purpose and current state, activate the control and hear the new state. Use an accessibility identifier for test lookup and a meaningful label for speech. |
| A row takes many swipes, or grouping it hides its trailing action | Group information that describes one element. Expose independent actions as separate reachable controls or discoverable accessibility actions. Preserve sensible traversal in both reading directions. | Read the row, then invoke each supported action without finding it visually. Check where focus lands after a row disappears or a sheet closes. |
| At large text sizes the Save button overlaps a field | Choose semantic SwiftUI text styles, or a UIKit preferred font or `UIFontMetrics`-scaled font with automatic content-size adjustment. Allow wrapping and reflow a horizontal group vertically when space runs out. Inspect fixed heights and compression priorities. | Select an accessibility text size and complete the form on the smallest relevant screen with the keyboard up. Verify the button, error text and input remain reachable. |
| Meaning disappears in Dark Mode, without color, or with reduced motion | Pair color with a shape, icon, or text. Use adaptive colors, check contrast, and provide a legible transition when Reduce Motion is active. | Reproduce success and error states with the affected settings and identify them from state cues that survive the change. |
| A translation truncates, a count uses the wrong plural, or back navigation flips incorrectly | Put complete localizable phrases and plural variants in the project's localization resources. Use leading and trailing layout where direction follows the language. Keep inherently directional content consistent with its meaning. | Run the affected screen with an expanded or right-to-left pseudolanguage and a supported real locale. Check the relevant plural forms and that back reaches the correct screen. |

[VoiceOver design guidance](https://developer.apple.com/design/human-interface-guidelines/voiceover) · [UIKit font scaling](https://developer.apple.com/documentation/uikit/uicontentsizecategoryadjusting/adjustsfontforcontentsizecategory) · [Localization testing](https://developer.apple.com/documentation/xcode/preparing-your-interface-for-localization) · [String catalogs and plurals](https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog)

## Choose evidence for the claim

- Use Accessibility Inspector or a supported XCUITest accessibility audit for each relevant screen state. Read individual failures for labels, clipped text, contrast, target sizes and traits. Narrow any justified exception to the affected element and condition. [Performing accessibility audits](https://developer.apple.com/documentation/accessibility/performing-accessibility-audits-for-your-app)
- Run the user task with the intended assistive technology when spoken order, announcements, activation, or focus are acceptance criteria. Test the presented sheet, validation error, and return to the triggering control when they participate in that task. Record the sequence actually observed. Document visual layout with screenshots and the automated checks with the audit result. [Performing accessibility testing](https://developer.apple.com/documentation/accessibility/performing-accessibility-testing-for-your-app)
- Report the screen, locale, text size, appearance, device/OS and assistive technology that matter to the finding. If VoiceOver interaction was unavailable, name the unobserved behavior and retain any completed audit separately.

For example, an audit may find no clipping after a login failure while VoiceOver focus stays on Submit and never exposes the error. Verify that a person can discover the error, reach the field and complete the retry. Record the spoken label or focus movement that demonstrated the fix.

Firefox for iOS documents a practical distinction for testable native controls. Its accessibility guidance assigns labels and traits according to what people should hear, while its UI testing guide locates controls through identifiers. Apply this to a localized delete action by asserting its identifier in an automation test, then listening to its translated name and role during the VoiceOver journey. [Firefox iOS accessibility guide](https://github.com/mozilla-mobile/firefox-ios/wiki/A-Brief-Overview-of-Accessibility) · [Firefox iOS UI testing guide](https://github.com/mozilla-mobile/firefox-ios/wiki/Test-Automation-Efficiency-UI-Testing-Guide-for-Firefox-iOS)
