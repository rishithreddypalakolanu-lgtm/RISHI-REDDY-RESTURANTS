/* ==========================================================================
   RISHI RESTAURANTS — Checkout & Purchase Details
   Front-end order management using localStorage.
   ========================================================================== */
(function () {
  "use strict";

  const CART_KEY = "rishi-restaurants-cart";
  const ORDERS_KEY = "rishi-restaurants-orders";
  const DELIVERY_FEE = 40;
  const GST_RATE = 0.05;

  let appliedCoupon = null;

  const $ = (id) => document.getElementById(id);

  function money(value) {
    return "₹" + Math.round(Number(value) || 0).toLocaleString("en-IN");
  }

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "{}"); }
    catch (_) { return {}; }
  }

  function readOrders() {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      return Array.isArray(orders) ? orders : [];
    } catch (_) { return []; }
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function itemFor(id) {
    return Array.isArray(window.MENU_ITEMS) ? window.MENU_ITEMS.find(item => String(item.id) === String(id)) : null;
  }

  function cartSubtotal(cart) {
    return Object.entries(cart).reduce((sum, [id, entry]) => {
      const item = itemFor(id);
      return item ? sum + item.price * Number(entry.qty || 0) : sum;
    }, 0);
  }

  function getTotals(cart) {
    const subtotal = cartSubtotal(cart);
    const delivery = subtotal ? DELIVERY_FEE : 0;
    const discount = appliedCoupon ? (
      appliedCoupon.type === "percent" ? subtotal * appliedCoupon.value / 100 : appliedCoupon.value
    ) : 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * GST_RATE;
    const total = taxable + delivery + tax;
    return { subtotal, delivery, discount: Math.min(discount, subtotal), tax, total };
  }

  function generateOrderId() {
    const d = new Date();
    const stamp = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("");
    const random = Math.floor(1000 + Math.random() * 9000);
    return "RISHI-" + stamp + "-" + random;
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function renderCheckout() {
    const cart = readCart();
    if (!Object.keys(cart).length) {
      closeModal("checkout-modal");
      if ($("toast")) {
        $("toast").innerHTML = '<i class="fa-solid fa-circle-info"></i><span>Your cart is empty.</span>';
        $("toast").classList.add("show");
        setTimeout(() => $("toast").classList.remove("show"), 2400);
      }
      return;
    }

    const totals = getTotals(cart);
    $("checkout-items").innerHTML = Object.entries(cart).map(([id, entry]) => {
      const item = itemFor(id);
      if (!item) return "";
      return '<div class="checkout-item"><div><b>' + item.name + '</b><small>' +
        Number(entry.qty) + ' × ' + money(item.price) + '</small></div><strong>' +
        money(item.price * Number(entry.qty)) + '</strong></div>';
    }).join("");

    $("checkout-subtotal").textContent = money(totals.subtotal);
    $("checkout-delivery").textContent = money(totals.delivery);
    $("checkout-tax").textContent = money(totals.tax);
    $("checkout-discount").textContent = "-" + money(totals.discount);
    $("checkout-total").textContent = money(totals.total);
  }

  function applyCoupon() {
    const input = $("coupon-input");
    const msg = $("coupon-message");
    const code = input.value.trim().toUpperCase();
    const coupons = {
      RISHI10: { type: "percent", value: 10, label: "10% off" },
      WELCOME50: { type: "fixed", value: 50, label: "₹50 off" },
      SAVE20: { type: "percent", value: 20, label: "20% off" }
    };

    if (!code) {
      appliedCoupon = null;
      msg.textContent = "Enter a coupon code.";
      msg.className = "coupon-message error";
      renderCheckout();
      return;
    }
    if (!coupons[code]) {
      appliedCoupon = null;
      msg.textContent = "Invalid coupon code.";
      msg.className = "coupon-message error";
      renderCheckout();
      return;
    }
    appliedCoupon = { code, ...coupons[code] };
    msg.textContent = code + " applied — " + coupons[code].label;
    msg.className = "coupon-message success";
    renderCheckout();
  }

  function validateDelivery(formData) {
    const type = formData.get("orderType");
    if (type !== "delivery") return true;
    const required = ["address", "city", "state", "pincode"];
    return required.every(field => String(formData.get(field) || "").trim());
  }

  function createOrder(formData) {
    const cart = readCart();
    if (!Object.keys(cart).length) return null;

    const totals = getTotals(cart);
    const orderType = formData.get("orderType");
    const payment = formData.get("payment");
    const items = Object.entries(cart).map(([id, entry]) => {
      const item = itemFor(id);
      return item ? {
        id: item.id,
        name: item.name,
        price: item.price,
        qty: Number(entry.qty),
        amount: item.price * Number(entry.qty)
      } : null;
    }).filter(Boolean);

    const order = {
      orderId: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: "Order Placed",
      customer: {
        name: String(formData.get("name") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        email: String(formData.get("email") || "").trim()
      },
      orderType,
      address: orderType === "delivery" ? {
        address: String(formData.get("address") || "").trim(),
        city: String(formData.get("city") || "").trim(),
        state: String(formData.get("state") || "").trim(),
        pincode: String(formData.get("pincode") || "").trim(),
        landmark: String(formData.get("landmark") || "").trim()
      } : null,
      paymentMethod: payment,
      notes: String(formData.get("notes") || "").trim(),
      coupon: appliedCoupon ? appliedCoupon.code : "",
      items,
      ...totals
    };

    const orders = readOrders();
    orders.unshift(order);
    saveOrders(orders);
    return order;
  }

  function statusSteps(order) {
    const steps = ["Order Placed", "Preparing", "Ready", "Out for Delivery", "Delivered"];
    const current = steps.indexOf(order.status);
    return steps.map((step, index) =>
      '<div class="status-step ' + (index <= current ? "done" : "") + '">' +
      '<span>' + (index < current ? "✓" : index === current ? "●" : "○") + '</span><small>' + step + '</small></div>'
    ).join("");
  }

  function orderDetailsHTML(order) {
    const address = order.address
      ? order.address.address + ", " + order.address.city + ", " + order.address.state + " - " + order.address.pincode +
        (order.address.landmark ? " (" + order.address.landmark + ")" : "")
      : "Restaurant Pickup";

    return '<div class="order-detail-view">' +
      '<div class="order-success"><div class="success-icon">✓</div><p>Order placed successfully!</p><h3>' + order.orderId + '</h3>' +
      '<small>' + new Date(order.createdAt).toLocaleString("en-IN") + '</small></div>' +
      '<div class="status-timeline">' + statusSteps(order) + '</div>' +
      '<div class="detail-grid">' +
      '<div><span>Customer</span><b>' + order.customer.name + '</b></div>' +
      '<div><span>Phone</span><b>' + order.customer.phone + '</b></div>' +
      '<div><span>Order Type</span><b>' + (order.orderType === "delivery" ? "Home Delivery" : "Restaurant Pickup") + '</b></div>' +
      '<div><span>Payment</span><b>' + order.paymentMethod + '</b></div>' +
      '<div class="full"><span>Address</span><b>' + address + '</b></div>' +
      '</div>' +
      '<div class="receipt-table">' +
      order.items.map(item => '<div><span>' + item.name + ' × ' + item.qty + '</span><strong>' + money(item.amount) + '</strong></div>').join("") +
      '<div><span>Subtotal</span><strong>' + money(order.subtotal) + '</strong></div>' +
      '<div><span>Delivery</span><strong>' + money(order.delivery) + '</strong></div>' +
      '<div><span>GST (5%)</span><strong>' + money(order.tax) + '</strong></div>' +
      '<div><span>Discount</span><strong>- ' + money(order.discount) + '</strong></div>' +
      '<div class="grand"><span>Grand Total</span><strong>' + money(order.total) + '</strong></div>' +
      '</div>' +
      '<div class="order-actions"><button class="btn btn-primary" data-print-order="' + order.orderId + '"><i class="fa-solid fa-print"></i> Print Receipt</button>' +
      '<button class="btn btn-outline" data-reorder="' + order.orderId + '"><i class="fa-solid fa-rotate-right"></i> Reorder</button></div>' +
      '</div>';
  }

  function renderOrders() {
    const orders = readOrders();
    const list = $("orders-list");
    if (!orders.length) {
      list.innerHTML = '<div class="orders-empty"><i class="fa-solid fa-receipt"></i><h3>No orders yet</h3><p>Your completed purchases will appear here.</p><button class="btn btn-primary" data-close-orders>Browse Menu</button></div>';
      return;
    }

    list.innerHTML = orders.map(order =>
      '<article class="order-history-card">' +
      '<div class="order-history-head"><div><span>' + order.orderId + '</span><small>' + new Date(order.createdAt).toLocaleString("en-IN") + '</small></div>' +
      '<strong>' + money(order.total) + '</strong></div>' +
      '<div class="order-history-items">' + order.items.map(i => i.name + ' × ' + i.qty).join(", ") + '</div>' +
      '<div class="order-history-foot"><span class="order-status">' + order.status + '</span>' +
      '<button class="btn btn-outline btn-small" data-view-order="' + order.orderId + '">View Details</button></div>' +
      '</article>'
    ).join("");
  }

  function showOrderDetails(orderId) {
    const order = readOrders().find(o => o.orderId === orderId);
    if (!order) return;
    $("orders-list").innerHTML = '<button class="back-orders" data-back-orders><i class="fa-solid fa-arrow-left"></i> Back to Orders</button>' + orderDetailsHTML(order);
  }

  function printReceipt(orderId) {
    const order = readOrders().find(o => o.orderId === orderId);
    if (!order) return;
    const rows = order.items.map(i => '<tr><td>' + i.name + '</td><td>' + i.qty + '</td><td>' + money(i.price) + '</td><td>' + money(i.amount) + '</td></tr>').join("");
    const html = '<!doctype html><html><head><title>' + order.orderId + ' - Rishi Restaurants</title><style>' +
      'body{font-family:Arial,sans-serif;padding:30px;color:#24140c;max-width:720px;margin:auto}h1{text-align:center}h2{border-bottom:1px solid #ddd;padding-bottom:8px}table{width:100%;border-collapse:collapse}th,td{padding:9px;border-bottom:1px solid #ddd;text-align:left}.right{text-align:right}.total{font-size:20px;font-weight:bold}</style></head><body>' +
      '<h1>RISHI RESTAURANTS</h1><p style="text-align:center">Order Receipt</p><h2>' + order.orderId + '</h2>' +
      '<p><b>Date:</b> ' + new Date(order.createdAt).toLocaleString("en-IN") + '<br><b>Customer:</b> ' + order.customer.name + '<br><b>Phone:</b> ' + order.customer.phone + '</p>' +
      '<table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="right">Subtotal: ' + money(order.subtotal) + '<br>Delivery: ' + money(order.delivery) + '<br>GST: ' + money(order.tax) + '<br>Discount: -' + money(order.discount) + '</p>' +
      '<p class="right total">Grand Total: ' + money(order.total) + '</p><p>Payment: ' + order.paymentMethod + '</p><p style="text-align:center">Thank you for ordering from Rishi Restaurants!</p>' +
      '<script>window.onload=function(){window.print();}</script></body></html>';
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  }

  function reorder(orderId) {
    const order = readOrders().find(o => o.orderId === orderId);
    if (!order) return;
    const cart = {};
    order.items.forEach(item => { cart[item.id] = { qty: item.qty }; });
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    closeModal("orders-modal");
    window.location.hash = "menu";
    setTimeout(() => window.dispatchEvent(new CustomEvent("rishi:cart-refresh")), 50);
  }

  function init() {
    $("orders-toggle").addEventListener("click", () => {
      renderOrders();
      openModal("orders-modal");
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-order]")) closeModal("checkout-modal");
      if (e.target.closest("[data-close-orders]")) closeModal("orders-modal");
      const view = e.target.closest("[data-view-order]");
      if (view) showOrderDetails(view.dataset.viewOrder);
      if (e.target.closest("[data-back-orders]")) renderOrders();
      const print = e.target.closest("[data-print-order]");
      if (print) printReceipt(print.dataset.printOrder);
      const reorderBtn = e.target.closest("[data-reorder]");
      if (reorderBtn) reorder(reorderBtn.dataset.reorder);
    });

    $("apply-coupon").addEventListener("click", applyCoupon);

    $("order-type").addEventListener("change", () => {
      const delivery = $("delivery-fields");
      const isDelivery = $("order-type").value === "delivery";
      delivery.style.display = isDelivery ? "" : "none";
      ["address", "city", "state", "pincode"].forEach(name => {
        const field = $("checkout-form").elements[name];
        if (field) field.required = isDelivery;
      });
      if (!isDelivery) {
        const pickup = $("checkout-form").elements.payment;
        [...pickup].forEach(radio => { if (radio.value === "Pay at Restaurant") radio.checked = true; });
      }
      renderCheckout();
    });

    $("checkout-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.checkValidity() || !validateDelivery(new FormData(form))) {
        form.reportValidity();
        return;
      }
      const order = createOrder(new FormData(form));
      if (!order) return;

      closeModal("checkout-modal");
      $("orders-list").innerHTML = orderDetailsHTML(order);
      openModal("orders-modal");
      form.reset();
      appliedCoupon = null;
      $("coupon-message").textContent = "";
      window.dispatchEvent(new CustomEvent("rishi:order-completed"));
    });

    window.addEventListener("rishi:open-checkout", () => {
      appliedCoupon = null;
      $("coupon-input").value = "";
      $("coupon-message").textContent = "";
      renderCheckout();
      openModal("checkout-modal");
    });

    window.addEventListener("rishi:cart-refresh", () => {
      // The main script owns cart rendering; refresh by reloading its current UI.
      const count = Object.values(readCart()).reduce((sum, item) => sum + Number(item.qty || 0), 0);
      if ($("cart-count")) $("cart-count").textContent = count;
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal("checkout-modal");
        closeModal("orders-modal");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();