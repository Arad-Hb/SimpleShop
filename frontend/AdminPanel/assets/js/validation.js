/**
 * validation.js — اعتبارسنجی فرم‌ها
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml } = ShopAdmin.utils || { escapeHtml: (s) => s };

  const validateRequired = (value, fieldLabel = 'این فیلد') => {
    const str = value == null ? '' : String(value).trim();
    if (!str) return `${fieldLabel} الزامی است.`;
    return null;
  };

  const validateEmail = (value) => {
    if (!value || !String(value).trim()) return null;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(String(value).trim())) return 'ایمیل معتبر نیست.';
    return null;
  };

  /** موبایل ایران: 09xxxxxxxxx */
  const validateMobile = (value) => {
    if (!value || !String(value).trim()) return null;
    const normalized = String(value).trim().replace(/[\s-]/g, '');
    if (!/^09\d{9}$/.test(normalized)) return 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.';
    return null;
  };

  const validatePhone = (value) => {
    if (!value || !String(value).trim()) return null;
    const normalized = String(value).trim().replace(/[\s-]/g, '');
    if (!/^0\d{10,11}$/.test(normalized)) return 'شماره تلفن معتبر نیست.';
    return null;
  };

  /** اعتبارسنجی کد ملی ایران */
  const validateNationalId = (value) => {
    if (!value || !String(value).trim()) return null;
    const code = String(value).trim();
    if (!/^\d{10}$/.test(code)) return 'کد ملی باید ۱۰ رقم باشد.';
    if (/^(\d)\1{9}$/.test(code)) return 'کد ملی معتبر نیست.';

    const check = parseInt(code[9], 10);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(code[i], 10) * (10 - i);
    }
    const remainder = sum % 11;
    const valid = remainder < 2 ? check === remainder : check === 11 - remainder;
    if (!valid) return 'کد ملی معتبر نیست.';
    return null;
  };

  const validateUnique = (value, items, field, excludeId = null) => {
    if (!value) return null;
    const normalized = String(value).trim().toLowerCase();
    const duplicate = (items || []).some((item) => {
      if (excludeId != null && item.id === excludeId) return false;
      const itemVal = item[field];
      return itemVal != null && String(itemVal).trim().toLowerCase() === normalized;
    });
    if (duplicate) return 'این مقدار قبلاً ثبت شده است.';
    return null;
  };

  const validateSlug = (value) => {
    if (!value || !String(value).trim()) return 'شناسه URL الزامی است.';
    const slug = String(value).trim();
    if (!/^[\u0600-\u06FFa-z0-9]+(?:-[\u0600-\u06FFa-z0-9]+)*$/.test(slug)) {
      return 'شناسه URL فقط می‌تواند شامل حروف، اعداد و خط تیره باشد.';
    }
    return null;
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

  const validateImageFile = (file) => {
    if (!file) return 'انتخاب تصویر الزامی است.';
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'فرمت مجاز: JPG، PNG یا WebP.';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'حداکثر حجم تصویر ۲ مگابایت است.';
    }
    return null;
  };

  const showFieldError = (inputEl, message) => {
    if (!inputEl) return;
    inputEl.classList.add('is-invalid');
    inputEl.setAttribute('aria-invalid', 'true');

    const group = inputEl.closest('.mb-3, .form-group, .col, [class*="field"]') || inputEl.parentElement;
    let feedback = group?.querySelector('.invalid-feedback');
    if (!feedback && group) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback d-block';
      group.appendChild(feedback);
    }
    if (feedback) feedback.textContent = message;
  };

  const clearFieldErrors = (formEl) => {
    if (!formEl) return;
    formEl.querySelectorAll('.is-invalid').forEach((el) => {
      el.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
    });
    formEl.querySelectorAll('.invalid-feedback').forEach((el) => {
      el.textContent = '';
    });
  };

  /**
   * اعتبارسنجی فرم بر اساس قوانین
   * @param {HTMLFormElement} formEl
   * @param {Array<{ name: string, label?: string, rules: Function[] }>} schema
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  const validateForm = (formEl, schema) => {
    clearFieldErrors(formEl);
    const errors = {};
    let valid = true;

    schema.forEach(({ name, label, rules }) => {
      const input = formEl.elements[name];
      const value = input?.type === 'checkbox' ? input.checked : input?.value;
      for (const rule of rules) {
        const err = rule(value, input, formEl);
        if (err) {
          errors[name] = err;
          if (input) showFieldError(input, err);
          valid = false;
          break;
        }
      }
    });

    return { valid, errors };
  };

  ShopAdmin.validation = {
    validateRequired,
    validateEmail,
    validateMobile,
    validatePhone,
    validateNationalId,
    validateUnique,
    validateSlug,
    validateImageFile,
    showFieldError,
    clearFieldErrors,
    validateForm,
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE
  };
})(window.ShopAdmin = window.ShopAdmin || {});
