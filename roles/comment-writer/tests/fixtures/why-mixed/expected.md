# why-mixed — expected

Input: `input.py`. Four decisions in the file cannot be recovered from the code and its names.

Requirement: the output contains **exactly these four comments and no others**.

| # | Required comment | If it is deleted, the reader loses |
|---|---|---|
| 1 | `# 短信计费以 60 秒为一个单位，不足 60 秒也按 60 秒收。` | 60 来自运营商的计费合同，不是随手取的值；删掉后有人会把它改成 1 或 1000。 |
| 2 | `# 必须先 flush 再 close，否则缓冲区里最后一批日志会丢。` | flush 不是多余的；删掉后有人会以为 close 已经处理了缓冲。 |
| 3 | `# Windows 上 rename 不能覆盖已有文件，先删掉目标。` | 这个分支只在 Windows 需要；删掉后有人会按 POSIX 的习惯把它当冗余代码删掉。 |
| 4 | `# 尾帧要单独补发，循环只处理到倒数第二帧。` | `len(frames) - 1` 是有意写的；删掉后有人会把它改成 `len(frames)`，最后一帧被重复发送。 |

All four pass the gate: each names a contract, an ordering requirement, a platform quirk, or an intentional boundary that the code alone cannot express.
