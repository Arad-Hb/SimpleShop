(async function () {
  await window.Layout.init();
  if (!window.Auth.isAuthenticated() || !window.Auth.hasRole("Customer")) {
    window.Auth.redirectToLogin(location.href);
    return;
  }

  const user = window.Auth.getCurrentUser();
  const lines = window.Cart.read();
  if (!lines.length) {
    location.href = "card.html";
    return;
  }

  const form = document.getElementById("checkout-form");
  document.querySelector(".payment-demo-box")?.remove();
  document.querySelector("p.small.text-muted")?.remove();
  const payBtn = document.getElementById("btn-pay");
  if (payBtn) {
    payBtn.textContent = "ثبت سفارش";
    payBtn.type = "submit";
  }
  if (form.fullName || document.getElementById("fullName")) document.getElementById("fullName").value = window.Auth.displayName(user);
  if (document.getElementById("phone")) document.getElementById("phone").value = user.mobileNumber || "";
  if (document.getElementById("address")) document.getElementById("address").value = user.address || "";
  if (document.getElementById("postalCode")) document.getElementById("postalCode").value = user.postalCode || "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      shippingFullName: document.getElementById("fullName").value,
      shippingMobile: document.getElementById("phone").value,
      shippingAddress: document.getElementById("address").value,
      shippingPostalCode: document.getElementById("postalCode")?.value,
      customerNote: document.getElementById("note")?.value,
      items: window.Cart.read().map((x) => ({ productId: x.productId, quantity: x.quantity }))
    };
    try {
      const result = await window.Api.post(window.AppConfig.endpoints.customerOrders, payload);
      window.Cart.clear();
      window.Toast.success(result.data.message || "سفارش ثبت شد.");
      location.href = window.AppConfig.panel.customer + "orders.html";
    } catch (error) {
      window.Common.handleError(error, "ثبت سفارش انجام نشد.");
    }
  });
})();
