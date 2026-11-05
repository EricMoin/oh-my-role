# obvious-cn — expected

Input: `input.py`, a small order helper with one obvious comment on every construct.

Requirement: **zero comments added.** The produced file contains no comment lines at all.

Every comment in the input fails the gate at step 2 (delete) or step 3 (name the lost thing):

- `# 校验订单参数` — restates `validate_order`; the function name already says it.
- `# 遍历商品列表` — announces the loop.
- `# 检查库存` — restates the condition below it.
- `# 初始化支付客户端` — labels the assignment to `client`.
- `# 计算商品小计` / `# 计算订单总价` — restate `_line_total` / `_order_total`.
- `# 设置请求超时` — restates `set_timeout`.

Step 3 produces no concrete why for any of them, so the correct output is the same code with all comments removed.
