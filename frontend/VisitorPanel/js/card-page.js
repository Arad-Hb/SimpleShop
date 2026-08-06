(function (Store) {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    await Store.catalog.ready;
    const { escapeHtml, formatPrice, formatDateTime, showToast } = Store.ui;
    const root = document.getElementById('card-root');
    if (!root) return;

    const renderExpiryBanner = () => {
      const info = Store.card.getExpiryInfo();
      const entity = Store.card.getCardEntity();
      if (!entity.cardItems.length) return '';
      return `
        <div class="alert alert-warning card-expiry-banner mb-3" role="status">
          <i class="bi bi-clock-history me-1"></i>
          این کارت خرید تا <strong>${formatDateTime(info.expiresAt)}</strong> نگهداری می‌شود
          (${info.daysLeft.toLocaleString('fa-IR')} روز باقی‌مانده).
          پس از انقضا، اقلام کارت حذف می‌شوند.
        </div>`;
    };

    const thumbHtml = (row) => {
      if (row.imageUrl) {
        return `<img class="cart-thumb-img" src="${escapeHtml(row.imageUrl)}" alt="">`;
      }
      return `<div class="cart-thumb"><i class="bi ${escapeHtml(row.icon || 'bi-box-seam')}"></i></div>`;
    };

    const render = () => {
      const entity = Store.card.getCardEntity();
      const cardItems = entity.cardItems;

      if (!cardItems.length) {
        root.innerHTML = `
          <div class="panel-card empty-cart">
            <i class="bi bi-credit-card-2-front"></i>
            <p class="mb-3">کارت خرید شما خالی است.</p>
            <a href="index.html" class="btn btn-primary">شروع خرید</a>
          </div>`;
        return;
      }

      const rows = cardItems.map((row) => `
        <tr data-id="${escapeHtml(row.productId)}">
          <td>
            <div class="cart-item">
              ${thumbHtml(row)}
              <div>
                <a href="product.html?id=${encodeURIComponent(row.productId)}" class="fw-bold text-decoration-none text-dark">${escapeHtml(row.title)}</a>
                <div class="small text-muted">${escapeHtml(row.brand)}${row.categoryName ? ` · ${escapeHtml(row.categoryName)}` : ''}</div>
              </div>
            </div>
          </td>
          <td>${formatPrice(row.unitPrice)}</td>
          <td>
            <div class="qty-box">
              <button type="button" data-qty="-1">−</button>
              <span>${row.quantity.toLocaleString('fa-IR')}</span>
              <button type="button" data-qty="1">+</button>
            </div>
          </td>
          <td class="fw-bold">${formatPrice(row.lineTotal)}</td>
          <td><button type="button" class="btn btn-sm btn-outline-danger" data-remove aria-label="حذف"><i class="bi bi-trash"></i></button></td>
        </tr>`).join('');

      const total = entity.itemsTotal || Store.card.cardTotal();
      const collected = entity.collectedAt
        ? `<div class="small text-muted mb-2">جمع‌آوری: ${formatDateTime(entity.collectedAt)}</div>`
        : '';

      root.innerHTML = `
        ${renderExpiryBanner()}
        <div class="cart-layout">
          <div class="panel-card">
            ${collected}
            <div class="table-responsive">
              <table class="cart-table">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>قیمت واحد</th>
                    <th>تعداد</th>
                    <th>جمع خط</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
          <aside class="panel-card cart-summary">
            <h2 class="h5 fw-bold mb-3">خلاصه کارت</h2>
            <div class="row-line"><span>جمع اقلام</span><span>${formatPrice(total)}</span></div>
            <div class="row-line"><span>هزینه ارسال</span><span class="text-success fw-bold">رایگان</span></div>
            <div class="total-line"><span>مبلغ قابل پرداخت</span><span>${formatPrice(total)}</span></div>
            <a href="checkout.html" class="btn btn-primary w-100 mb-2">ادامه فرآیند خرید</a>
            <a href="index.html" class="btn btn-outline-secondary w-100">ادامه خرید از فروشگاه</a>
          </aside>
        </div>`;

      root.querySelectorAll('tr[data-id]').forEach((tr) => {
        const id = tr.dataset.id;
        const row = cardItems.find((i) => i.productId === id);
        tr.querySelectorAll('[data-qty]').forEach((btn) => {
          btn.addEventListener('click', () => {
            Store.card.setQty(id, (row?.quantity || 1) + Number(btn.dataset.qty));
            showToast('کارت به‌روزرسانی شد');
            render();
          });
        });
        tr.querySelector('[data-remove]')?.addEventListener('click', () => {
          Store.card.removeFromCard(id);
          showToast('از کارت حذف شد');
          render();
        });
      });
    };

    render();
    document.addEventListener('card:updated', render);
  });
})(window.SimpleStore = window.SimpleStore || {});
