// validate the order parameters
function validateOrder(order: Order): boolean {
  // loop over the items
  for (const item of order.items) {
    // check the stock
    if (item.stock < item.qty) {
      return false;
    }
  }
  return true;
}

// initialize the payment client
const client = new PaymentClient(config.payKey);

// compute the line total
function lineTotal(item: Item): number {
  return item.price * item.qty;
}

// compute the order total
function orderTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

// set the request timeout
function setRequestTimeout(seconds: number): void {
  config.timeout = seconds;
}
