# Reviewing a task from entry to outcome

Choose a task the intended person actually performs. Identify their starting screen, permissions, object, and the result they need. Include the next action they are likely to take. Design the path and its feedback together. Review retraces it independently on the delivered revision.

## Task flow

Start at the entry a user can discover. Follow the visible controls with the relevant input methods. At each handoff, check what the user can see, what they have to remember, and where focus or selection lands. On a narrow screen, try the entry that replaces a desktop toolbar or hover action.

For example, an editor renames a saved view while comparing records. Keep Rename with that view, put Save and Cancel beside the edit, then return focus to the renamed item with its selection and filters intact. Sending the editor to global settings, making them find the view again, and dropping them on an unfiltered list is a concrete detour. A row menu can keep occasional actions close without crowding the row. A destructive action needs deliberate activation even when it lives nearby.

## Action coverage

After a user creates something, ask what happens to it if they made a mistake, their needs change, or the collection grows. Determine what this actor can do to **one object**, and what they need to do to the **collection**. Verify an entry, an operable control and a visible result for each required action. Keep a brief reason for a plausible omission where it affects the design.

| Decision in a saved-views manager | What to try |
| --- | --- |
| Create, edit or rename a view | Create from the list, find the new view, rename it from its own actions, and reopen it. Check that the same view now has the new name. |
| Remove a mistaken view | From that view, try the permitted delete or archive path. Cancel or undo where provided. A read-only viewer can legitimately lack this action. |
| Order or find many views | Put sort on the collection and test it with distinct names. If users curate a personal order, test moving an item and its keyboard alternative. For a large collection, search for the renamed view and clear the query. A short fixed list may need neither search nor manual ordering. |

Action placement follows the scope of the effect. Carbon's table puts collection tools in the toolbar, sorting on a column, and actions on their row or selection. [Carbon data table guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines)

## Motion feedback

For consequential changes, name the trigger, the cue the user should perceive, and the settled state. Choose normal, interrupted, and reduced-motion behavior. Reuse a suitable native or project transition. For new custom interactions, implement purposeful motion where it helps the user notice feedback or follow an object. Use the project's timing and easing. Keep the control responsive from the first frame. Carbon uses sorting rows as an example of motion that preserves a visible object's continuity. [Carbon motion guidelines](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview)

**Bordered text field.** Tab into a custom email field. Add visible weight to its edge immediately, then briefly fade in the remaining emphasis on that same edge. Keep field bounds, text and caret stable. Tab back to an invalid address and compare with its unfocused red edge. The change in weight should identify focus from the first frame while the error color and message persist. Rapidly tab away and check that no late animation restores the previous field's focused appearance. With reduced motion, apply the final focus weight immediately. Material Web uses an active stroke whose opacity changes on the existing outline. [Material Web outlined field](https://github.com/material-components/material-web/blob/main/field/internal/_outlined-field.scss#L57-L93)

**Reordering.** Sort a list while following a selected item. Keep selection attached to the item and let the user track it to the new position. With reduced motion, update the order directly and retain a visible selection. Check interruption by changing the sort direction again before the first transition finishes. Support the user's motion preference while preserving the result. [W3C on animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

## Making the review decision

- **Revise:** a required entry exists only on hover on a touch layout, a frequent edit loses the user's place, or a required follow-up has no usable control. Name the starting state, the failing step, its consequence and the result that would pass a retest.
- **Revise:** in ordinary motion mode the new custom field only swaps color, the focus handoff is absent, or an unrelated entrance animation is the only animation on the page. Retest focus, invalid refocus and rapid exit on the field. An existing accessible platform treatment, an explicit static requirement or reduced motion may call for an immediate state change. Cite the applicable constraint and verify the final cue.
- **Unverified:** a still image or source declaration can show the intended end states. For an interactive deliverable, observe the transition while using the control, replay it or inspect a recording of the path. For a static deliverable, assess the specified behavior within its brief and identify what still needs execution.
