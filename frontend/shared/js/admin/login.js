(async function () {
  if (window.Auth.isAuthenticated() && window.Auth.hasRole("Admin")) {
    location.href = "index.html";
    return;
  }
  const form = document.getElementById("login-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const user = await window.Auth.login({
        mobileNumber: form.username?.value || form.mobileNumber?.value,
        password: form.password.value,
        rememberMe: Boolean(form.rememberMe?.checked)
      });
      if (!user.roles.some((x) => String(x).toLowerCase() === "admin")) {
        window.Auth.clear();
        window.Toast.error("این حساب به پنل مدیریت دسترسی ندارد.");
        return;
      }
      window.Toast.success("ورود مدیر انجام شد.");
      location.href = "index.html";
    } catch (error) {
      window.Common.handleError(error);
    }
  });
})();
