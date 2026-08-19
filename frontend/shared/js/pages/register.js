(async function () {
  await window.Layout.init();
  const form = document.getElementById("register-form") || document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      mobileNumber: form.mobileNumber.value,
      password: form.password.value
    };
    try {
      await window.Auth.register(payload);
      window.Toast.success("ثبت‌نام انجام شد. اکنون وارد شوید.");
      await window.Auth.login({ mobileNumber: payload.mobileNumber, password: payload.password, rememberMe: true });
      location.href = window.Auth.dashboardUrl();
    } catch (error) {
      window.Common.handleError(error, "ثبت‌نام انجام نشد.");
    }
  });
})();
