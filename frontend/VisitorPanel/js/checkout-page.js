(function (Store) {
  'use strict';

  const createPaymentReference = () =>
    `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const saveCustomerSession = (result, firstName, lastName) => {
    if (!SimpleShopPanelSession?.savePanelSession) return;
    SimpleShopPanelSession.savePanelSession('Customer', {
      token: result?.token,
      username: result?.username || result?.mobile,
      mobile: result?.mobile,
      userId: result?.userId,
      role: result?.role || 'Customer',
      fullName: result?.fullName || `${firstName} ${lastName}`.trim()
    }, false);
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await Store.catalog?.ready;

    const { formatPrice, escapeHtml, showToast } = Store.ui;
    const summary = document.getElementById('checkout-summary');
    const form = document.getElementById('checkout-form');
    const payBtn = document.getElementById('btn-pay');

    Store.card.purgeInvalidCardItems?.();
    const entity = Store.card.getCardEntity();
    const cardItems = entity.cardItems;

    if (!cardItems.length) {
      window.location.href = 'card.html';
      return;
    }

    const orderLines = Store.card.toOrderItems();
    if (!orderLines.length) {
      showToast('اقلام کارت با کاتالوگ فروشگاه هم‌خوان نیستند. لطفاً دوباره به کارت اضافه کنید.');
      setTimeout(() => { window.location.href = 'card.html'; }, 900);
      return;
    }

    const total = entity.itemsTotal || Store.card.cardTotal();
    const isLoggedIn = !!Store.api?.getToken?.();

    if (summary) {
      summary.innerHTML = `
        <h2 class="h5 fw-bold mb-3">سفارش شما</h2>
        ${cardItems.map((row) => `
          <div class="row-line checkout-line">
            <span class="checkout-line-title">
              ${row.imageUrl ? `<img src="${escapeHtml(row.imageUrl)}" alt="" class="checkout-thumb">` : ''}
              ${escapeHtml(row.title)} × ${row.quantity.toLocaleString('fa-IR')}
            </span>
            <span>${formatPrice(row.lineTotal)}</span>
          </div>`).join('')}
        <div class="total-line"><span>مبلغ کل</span><span>${formatPrice(total)}</span></div>
        <p class="small text-muted mb-0">${isLoggedIn ? 'پرداخت و ثبت سفارش با حساب کاربری' : 'پرداخت، سپس ثبت‌نام/ورود خودکار و تکمیل سفارش'}</p>`;
    }

    const splitName = (full) => {
      const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return { firstName: '', lastName: '' };
      if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    };

    const setBusy = (busy) => {
      if (payBtn) {
        payBtn.disabled = busy;
        payBtn.textContent = busy ? 'در حال پردازش…' : 'پرداخت و تکمیل سفارش';
      }
      form?.querySelectorAll('input, textarea, button').forEach((el) => {
        if (el !== payBtn) el.disabled = busy;
      });
    };

    const runCheckout = async () => {
      const name = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();
      const postalCode = document.getElementById('postalCode').value.trim();
      const note = document.getElementById('note')?.value?.trim() || '';

      if (!name || !phone || !address || !postalCode) {
        showToast('لطفاً نام، موبایل، آدرس و کد پستی را کامل کنید');
        return;
      }

      if (!Store.config?.USE_API || !Store.api) {
        showToast('اتصال به سرور فعال نیست');
        return;
      }

      const shippingAddress = note ? `${address}\n${note}` : address;
      const { firstName, lastName } = splitName(name);
      const paymentReference = createPaymentReference();

      setBusy(true);
      try {
        let orderId;

        if (isLoggedIn) {
          const result = await Store.api.createOrder({
            shippingAddress,
            paymentStatus: 'Paid',
            items: orderLines
          });
          orderId = result?.id ?? result?.Id;
        } else {
          const result = await Store.api.completeCheckout({
            mobile: phone,
            firstName,
            lastName,
            shippingAddress,
            postalCode,
            paymentReference,
            items: orderLines
          });
          if (result?.token) Store.api.setToken(result.token);
          saveCustomerSession(result, firstName, lastName);
          orderId = result?.order?.id ?? result?.order?.Id;
        }

        Store.card.clearCard();
        showToast(orderId
          ? `پرداخت موفق — سفارش #${orderId} ثبت شد`
          : 'پرداخت موفق — سفارش شما ثبت شد');
        setTimeout(() => { window.location.href = 'index.html'; }, 900);
      } catch (err) {
        const message = SimpleShopHttp?.parseError?.(err) || err?.message || 'تکمیل سفارش ناموفق بود';
        showToast(message);
        setBusy(false);
      }
    };

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      runCheckout();
    });
    payBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      runCheckout();
    });
  });
})(window.SimpleStore = window.SimpleStore || {});
