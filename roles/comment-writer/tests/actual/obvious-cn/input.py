def validate_order(order):
    for item in order["items"]:
        if item["stock"] < item["qty"]:
            return False
    return True


client = PaymentClient(config["pay_key"])


def _line_total(item):
    return item["price"] * item["qty"]


def _order_total(items):
    return sum(_line_total(item) for item in items)


def set_timeout(seconds):
    config["timeout"] = seconds
