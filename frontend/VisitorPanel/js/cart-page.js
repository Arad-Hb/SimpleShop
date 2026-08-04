(function (Store) {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    await Store.catalog.ready;
    const { escapeHtml, formatPrice, showToast } = Store.ui;
    const { getProduct } = Store.catalog;
    const root = document.getElementById('cart-root');
    if (!root) return;

    const render = () => {
      const items = Store.cart.getCart();
      if (!items.length) {
        root.innerHTML = `
          <div class="panel-card empty-cart">
            <i class="bi bi-cart-x"></i>
            <p class="mb-3">سبد خرید شما خالی است.</p>
            <a href="index.html" class="btn btn-primary">شروع خرید</a>
          </div>`;
        return;
      }

      const rows = items.map((item) => {
        const p = getProduct(item.id);
        if (!p) return '';
        return `
          <tr data-id="${escapeHtml(p.id)}">
            <td>
              <div class="cart-item">
                <div class="cart-thumb"><i class="bi ${escapeHtml(p.icon)}"></i></div>
                <div>
                  <a href="product.html?id=${encodeURIComponent(p.id)}" class="fw-bold text-decoration-none text-dark">${escapeHtml(p.title)}</a>
                  <div class="small text-muted">${escapeHtml(p.brand)}</div>
                </div>
              </div>
            </td>
            <td>${formatPrice(p.price)}</td>
            <td>
              <div class="qty-box">
                <button type="button" data-qty="-1">−</button>
                <span>${item.qty.toLocaleString('fa-IR')}</span>
                <button type="button" data-qty="1">+</button>
              </div>
            </td>
            <td class="fw-bold">${formatPrice(p.price * item.qty)}</td>
            <td><button type="button" class="btn btn-sm btn-outline-danger" data-remove aria-label="حذف"><i class="bi bi-trash"></i></button></td>
          </tr>`;
      }).join('');

      const total = Store.cart.cartTotal();
      root.innerHTML = `
        <div class="cart-layout">
          <div class="panel-card">
            <div class="table-responsive">
              <table class="cart-table">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>قیمت</th>
                    <th>تعداد</th>
                    <th>جمع</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
          <aside class="panel-card cart-summary">
            <h2 class="h5 fw-bold mb-3">خلاصه سفارش</h2>
            <div class="row-line"><span>جمع جزء</span><span>${formatPrice(total)}</span></div>
            <div class="row-line"><span>هزینه ارسال</span><span class="text-success fw-bold">رایگان</span></div>
            <div class="total-line"><span>مبلغ قابل پرداخت</span><span>${formatPrice(total)}</span></div>
            <a href="checkout.html" class="btn btn-primary w-100 mb-2">ادامه فرآیند خرید</a>
            <a href="index.html" class="btn btn-outline-secondary w-100">ادامه خرید از فروشگاه</a>
          </aside>
        </div>`;

      root.querySelectorAll('tr[data-id]').forEach((tr) => {
        const id = tr.dataset.id;
        const item = items.find((i) => i.id === id);
        tr.querySelectorAll('[data-qty]').forEach((btn) => {
          btn.addEventListener('click', () => {
            Store.cart.setQty(id, (item?.qty || 1) + Number(btn.dataset.qty));
            showToast('سبد به‌روزرسانی شد');
            render();
          });
        });
        tr.querySelector('[data-remove]')?.addEventListener('click', () => {
          Store.cart.removeFromCart(id);
          showToast('از سبد حذف شد');
          render();
        });
      });
    };

    render();
  });
})(window.SimpleStore = window.SimpleStore || {});
