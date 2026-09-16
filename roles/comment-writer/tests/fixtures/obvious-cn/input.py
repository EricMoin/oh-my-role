# 校验订单参数
def validate_order(order):
    # 遍历商品列表
    for item in order["items"]:
        # 检查库存
        if item["stock"] < item["qty"]:
            return False
    return True

# 初始化支付客户端
client = PaymentClient(config["pay_key"])

# 计算商品小计
def _line_total(item):
    return item["price"] * item["qty"]

# 计算订单总价
def _order_total(items):
    return sum(_line_total(item) for item in items)

# 设置请求超时
def set_timeout(seconds):
    config["timeout"] = seconds
