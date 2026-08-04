(function (Store) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const { formatPrice, escapeHtml, showToast } = Store.ui;
    const { getProduct } = Store.catalog;
    const summary = document.getElementById('checkout-summary');
    const form = document.getElementById('checkout-form');
    const items = Store.cart.getCart();

    if (!items.length) {
      window.location.href = 'cart.html';
      return;
    }

    const total = Store.cart.cartTotal();
    if (summary) {
      summary.innerHTML = `
        <h2 class="h5 fw-bold mb-3">سفارش شما</h2>
        ${items.map((item) => {
          const p = getProduct(item.id);
          if (!p) return '';
          return `<div class="row-line"><span>${escapeHtml(p.title)} × ${item.qty.toLocaleString('fa-IR')}</span><span>${formatPrice(p.price * item.qty)}</span></div>`;
        }).join('')}
        <div class="total-line"><span>مبلغ کل</span><span>${formatPrice(total)}</span></div>
        <p class="small text-muted mb-0">ارسال رایگان · پرداخت هنگام تحویل (دمو)</p>`;
    }

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();
      if (!name || !phone || !address) {
        showToast('لطفاً فیلدهای ضروری را کامل کنید');
        return;
      }
      Store.cart.clearCart();
      const { formatDateTime } = Store.ui;
      showToast(`سفارش شما در تاریخ ${formatDateTime(new Date())} با موفقیت ثبت شد`);
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    });
  });
})(window.SimpleStore = window.SimpleStore || {});
