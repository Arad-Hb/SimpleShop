(function (ShopCustomer) {
  'use strict';

  const { escapeHtml, formatPrice, formatDateTime } = ShopCustomer.utils;

  const statusLabel = {
    open: 'باز / پرداخت‌نشده',
    abandoned: 'رها‌شده',
    empty: 'خالی'
  };

  const cartTotal = (cart) =>
    (cart.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);

  const render = () => {
    const grid = document.getElementById('carts-grid');
    const empty = document.getElementById('carts-empty');
    if (!grid) return;

    const carts = ShopCustomer.storage.getCarts()
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    if (!carts.length) {
      grid.innerHTML = '';
      empty?.classList.remove('d-none');
      return;
    }

    empty?.classList.add('d-none');
    grid.innerHTML = carts.map((cart) => {
      const items = cart.items || [];
      const status = items.length ? (cart.status === 'abandoned' ? 'abandoned' : 'open') : 'empty';
      const total = cartTotal(cart);

      return `
        <div class="col-md-6 col-xl-4">
          <article class="cart-card" data-cart="${escapeHtml(cart.id)}">
            <div class="cart-card__head">
              <div>
                <h3 class="cart-card__title">${escapeHtml(cart.title || 'سبد خرید')}</h3>
                <p class="cart-card__meta">آخرین تغییر: ${formatDateTime(cart.updatedAt || cart.createdAt)}</p>
              </div>
              <span class="cart-status cart-status--${status}">${escapeHtml(statusLabel[status])}</span>
            </div>

            ${items.length ? `
              <ul class="cart-card__items">
                ${items.map((item) => `
                  <li class="cart-card__item">
                    <div>
                      <div class="cart-card__item-name">${escapeHtml(item.name)}</div>
                      <div class="cart-card__item-meta">${Number(item.qty || 1).toLocaleString('fa-IR')} عدد · ${formatPrice(item.price)}</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-remove-item="${escapeHtml(item.productId)}" title="حذف">
                      <i class="bi bi-trash"></i>
                    </button>
                  </li>
                `).join('')}
              </ul>
            ` : `<p class="cart-card__empty"><i class="bi bi-cart-x"></i> این سبد خالی است و پرداختی انجام نشده.</p>`}

            <div class="cart-card__foot">
              <div class="cart-card__total">${items.length ? formatPrice(total) : '۰ تومان'}</div>
              <div class="d-flex gap-2">
                ${items.length ? `<a class="btn btn-sm btn-primary" href="../VisitorPanel/card.html">ادامه خرید</a>` : ''}
                <button type="button" class="btn btn-sm btn-outline-secondary" data-delete-cart>حذف سبد</button>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-cart]').forEach((card) => {
      const cartId = card.getAttribute('data-cart');
      card.querySelectorAll('[data-remove-item]').forEach((btn) => {
        btn.addEventListener('click', () => {
          ShopCustomer.storage.removeCartItem(cartId, btn.getAttribute('data-remove-item'));
          ShopCustomer.ui.showToast('success', 'کالا از سبد حذف شد.');
          render();
        });
      });
      card.querySelector('[data-delete-cart]')?.addEventListener('click', () => {
        ShopCustomer.ui.showConfirmModal(
          'حذف سبد',
          'این سبد ناتمام حذف شود؟',
          () => {
            ShopCustomer.storage.deleteCart(cartId);
            ShopCustomer.ui.showToast('success', 'سبد حذف شد.');
            render();
          }
        );
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopCustomer.auth.requireAuth()) return;

    ShopCustomer.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سبدهای ناتمام' }
    ]);

    render();
  });
})(window.ShopCustomer = window.ShopCustomer || {});
