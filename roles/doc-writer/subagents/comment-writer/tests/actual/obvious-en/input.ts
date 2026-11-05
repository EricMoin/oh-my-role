function validateOrder(order: Order): boolean {
  for (const item of order.items) {
    if (item.stock < item.qty) {
      return false;
    }
  }
  return true;
}

const client = new PaymentClient(config.payKey);

function lineTotal(item: Item): number {
  return item.price * item.qty;
}

function orderTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

function setRequestTimeout(seconds: number): void {
  config.timeout = seconds;
}
