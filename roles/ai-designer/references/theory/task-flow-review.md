# Reviewing UX in the context of a task

Start with what the person came to accomplish. Identify where they enter, what they already know or have in front of them, and what would count as success in their work. Use the brief, existing product and available research to ground this account. A walkthrough can reveal what the interface shows. Claims about what people actually understand or prefer need user evidence.

## Find the question the design needs to answer

Walk the task using the information available to the person at each step. Before a consequential choice, predict the effect from its wording, placement, defaults and the surrounding content. Then compare that prediction with what happens. Look for places where a person can complete every click and still accomplish the wrong thing. A well-labeled step can also be unnecessary. Ask what it contributes to the user's goal and what happens to their work if they skip it or turn back.

The task may end with a decision on a read-only page. If someone needs the cheaper plan for a year's use and the page quotes one price per month and another per seat per year, try answering from the page for the person's actual team size. Which figures are comparable? What would they have to remember, convert or guess? Follow the question the task raises even if none of the headings below names it. When two treatments seem plausible, compare them where their effect on the person differs.

For example, a coordinator needs to assign **all** unowned requests. The list shows 20 of 186 matches. Tick the header checkbox and inspect the selection *before* committing a bulk action. Could the coordinator tell which requests would change? If the interface says only “Selected”, compare the intended scope with the objects actually selected. Showing “20 on this page selected” may resolve the ambiguity. Offering “Select all 186 matches” also makes sense if the task and the person's permissions support it. In a queue where the brief requires checking every request individually, that shortcut would undermine the work.

Other tasks suggest other questions. When someone returns from comparing options, check whether they still have the information and place they need to decide. When a batch only partly succeeds, try recovering the failed items and check what happens to the successful ones. If one person hands work to another, inspect what each can tell about ownership and the next step. These are examples for choosing a revealing walkthrough. Record a finding only when there is evidence of a consequence. For more context, `theory/psychology` covers mental models and attention, and `theory/interaction-design` covers navigation, defaults and recovery.

## Task flow

Start at the entry a user can discover. Follow the visible controls with the relevant input methods. At each handoff, check what the user can see, what they have to remember, and where focus or selection lands. On a narrow screen, try the entry that replaces a desktop toolbar or hover action.

For example, an editor renames a saved view while comparing records. Keep Rename with that view, put Save and Cancel beside the edit, then return focus to the renamed item with its selection and filters intact. Sending the editor to global settings, making them find the view again, and dropping them on an unfiltered list is a concrete detour. A row menu can keep occasional actions close without crowding the row. A destructive action needs deliberate activation even when it lives nearby.

## Action coverage

After a user creates something, ask what happens to it if they made a mistake, their needs change, or the collection grows. Determine what this actor can do to **one object**, and what they need to do to the **collection**. Verify an entry, an operable control and a visible result for each required action. Keep a brief reason for a plausible omission where it affects the design.

| Decision in a saved-views manager | What to try |
| --- | --- |
| Create, edit or rename a view | Create from the list, find the new view, rename it from its own actions, and reopen it. Check that the same view now has the new name. |
| Remove a mistaken view | On a disposable test view or in an isolated prototype, try the permitted delete or archive path. Check cancellation or undo where provided. A read-only viewer can legitimately lack this action. |
| Order or find many views | Put sort on the collection and test it with distinct names. If users curate a personal order, test moving an item and its keyboard alternative. For a large collection, search for the renamed view and clear the query. A short fixed list may need neither search nor manual ordering. |

Action placement follows the scope of the effect. Carbon's table puts collection tools in the toolbar, sorting on a column, and actions on their row or selection. [Carbon data table guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines)

## Choose feedback the person can use

First identify what the person needs to know. A button press can acknowledge input while the operation is still pending. Show completion when the result is known. A selected filter and its updated results may already communicate success. Copying a link changes something outside the page, so even a fast copy benefits from explicit confirmation.

Choose a place the person can still perceive after acting. A persistent Copy link button can briefly read “Copied” after a successful write. If Copy link lives in a menu that closes, a short status message on the remaining surface can confirm the same result. Expose the status to assistive technology without moving focus. If copying fails, put a way to copy manually where the person can use it. A transient “Copy failed” alone gives them little to work with.

Let the reach, duration and consequence of the change guide the choice. Put a correction beside the affected input. Keep an ongoing problem affecting several actions, such as offline editing, visible where those actions happen. Interrupt with a dialog when a decision genuinely needs to be made before work continues. Follow the project's placement conventions and check what the message might cover. Use an icon when it helps someone recognize the state, with wording or another perceivable cue that carries the meaning. See `theory/interaction-design`, especially *Success Feedback* and *Feedback Delivery Mechanisms*, for more patterns.

## Motion feedback

For consequential changes, name the trigger, the cue the user should perceive, and the settled state. Choose normal, interrupted, and reduced-motion behavior. Reuse a suitable native or project transition. For new custom interactions, implement purposeful motion where it helps the user notice feedback or follow an object. Use the project's timing and easing. Keep the control responsive from the first frame. Carbon uses sorting rows as an example of motion that preserves a visible object's continuity. [Carbon motion guidelines](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview)

**Bordered text field.** Tab into a custom email field. Add visible weight to its edge immediately, then briefly fade in the remaining emphasis on that same edge. Keep field bounds, text and caret stable. Tab back to an invalid address and compare with its unfocused red edge. The change in weight should identify focus from the first frame while the error color and message persist. Rapidly tab away and check that no late animation restores the previous field's focused appearance. With reduced motion, apply the final focus weight immediately. Material Web uses an active stroke whose opacity changes on the existing outline. [Material Web outlined field](https://github.com/material-components/material-web/blob/main/field/internal/_outlined-field.scss#L57-L93)

**Reordering.** Sort a list while following a selected item. Keep selection attached to the item and let the user track it to the new position. With reduced motion, update the order directly and retain a visible selection. Check interruption by changing the sort direction again before the first transition finishes. Support the user's motion preference while preserving the result. [W3C on animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

## Making the review decision

Describe a consequential issue in the user's terms. Give the starting condition, what in the artifact supports the expectation, the actual result and a concrete retest. Use its impact and the scope of the deliverable to decide the outcome under `gate-contract`. A user losing their place, applying a change to the wrong records or being unable to tell whether a required action succeeded can each warrant revision.

For required motion, replay the affected interaction. For a new custom bordered field, check the focus handoff and rapid exit. Include invalid refocus if the field has a validation state. An unrelated entrance animation provides no evidence about that handoff. Use the established platform treatment or reduced-motion behavior where applicable.

For a static brief, assess what the depicted states and specification support. For an interactive deliverable, identify any required behavior that could not be exercised safely as unverified. Separate observations from assumptions worth testing with users.
