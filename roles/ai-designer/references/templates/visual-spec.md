# Writing DESIGN.md

Write for the designer or developer styling the next screen. Start with the project's actual color roles and typography, then describe the spacing and shared treatments that make screens feel related. Use existing token names, their resolved values, and a short usage rule. Cover themes, density variants, or component states when the product uses them. Follow a supplied project format.

## Example excerpt

These are illustrative choices for a Chinese-language records app. Replace them with the project's values and content needs.

```md
# 视觉规范

## 颜色

| 语义 | 色值 | 用途 |
| --- | --- | --- |
| surface | #FAFAF8 | 页面底色 |
| text | #202426 | 标题和正文 |
| text-secondary | #505B60 | 日期和辅助标签 |
| accent | #185C48 | 主按钮底色、链接文字 |
| on-accent | #FFFFFF | 主按钮文字 |

## 字体

中文优先使用苹方，其次使用 Noto Sans CJK SC，最后回退到系统无衬线字体。

| 角色 | 字号 / 行高 | 字重 | 用途 |
| --- | --- | --- | --- |
| 页面标题 | 1.5rem / 1.35 | 600 | 标识当前页面 |
| 正文 | 1rem / 1.6 | 400 | 可连续阅读的内容 |
| 辅助标签 | 0.875rem / 1.5 | 500 | 字段名、日期标签 |

## 间距与对齐

字段名与值共用左边线，垂直间距 4px。相邻字段组留 16px，相邻章节留 32px。
标签折行时，整组随内容增高，组间距保持一致。
```

Use the same test for component details. A shared rule for the appearance of invalid fields belongs in the visual spec. In an HTML upload design, selecting an unsupported file should reveal the error beside the picker, and selecting a supported file should let the user continue. Put that sequence in the working controls and states of the requested HTML. A visual-spec-only task ends with the document.
