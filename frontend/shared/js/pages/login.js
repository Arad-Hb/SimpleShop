(async function () {
  await window.Layout.init();
  if (window.Auth.isAuthenticated()) {
    location.href = window.Auth.dashboardUrl();
    return;
  }

  const params = new URLSearchParams(location.search);
  const form = document.getElementById("login-form") || document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mobile = form.mobileNumber?.value || form.username?.value || form.mobile?.value;
    const password = form.password.value;
    const rememberMe = Boolean(form.rememberMe?.checked);
    try {
      const user = await window.Auth.login({ mobileNumber: mobile, password, rememberMe });
      window.Toast.success("ورود با موفقیت انجام شد.");
      const returnUrl = window.Auth.resolveReturnUrl(params.get("returnUrl"));
      location.href = returnUrl || window.Auth.dashboardUrl(user);
    } catch (error) {
      window.Common.handleError(error, "ورود انجام نشد.");
    }
  });
})();
