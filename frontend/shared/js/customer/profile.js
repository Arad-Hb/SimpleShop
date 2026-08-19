(async function () {
  const user = await window.PanelLayout.init();
  if (!user) return;
  const form = document.getElementById("profile-form") || document.querySelector("form");
  if (!form) return;

  document.getElementById("nationalId")?.closest(".col-md-4, .mb-3")?.classList.add("d-none");
  document.querySelector('a[href="financial.html"]')?.classList.add("d-none");
  if (form.username || document.getElementById("username")) document.getElementById("username").value = user.mobileNumber || "";
  if (form.firstName) form.firstName.value = user.firstName || "";
  if (form.lastName) form.lastName.value = user.lastName || "";
  if (form.address) form.address.value = user.address || "";
  if (form.postalCode) form.postalCode.value = user.postalCode || "";
  const mobile = document.getElementById("mobile");
  if (mobile) {
    mobile.value = user.mobileNumber || "";
    mobile.readOnly = true;
    mobile.required = false;
  }
  const email = document.getElementById("email");
  if (email) email.required = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await window.Api.put(window.AppConfig.endpoints.profile, {
        firstName: form.firstName.value,
        lastName: form.lastName.value,
        address: form.address?.value,
        postalCode: form.postalCode?.value
      });
      window.Toast.success(result.data.message || "پروفایل ذخیره شد.");
      await window.Auth.loadAuthenticatedUser();
    } catch (error) {
      window.Common.handleError(error);
    }
  });

  document.getElementById("password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const passwordForm = event.currentTarget;
    try {
      const result = await window.Api.post(window.AppConfig.endpoints.changePassword, {
        currentPassword: passwordForm.currentPassword.value,
        newPassword: passwordForm.newPassword.value
      });
      window.Toast.success(result.data.message || "رمز عبور تغییر کرد.");
      passwordForm.reset();
    } catch (error) {
      window.Common.handleError(error);
    }
  });

  const avatar = document.getElementById("avatar-upload") || document.getElementById("avatar-file");
  avatar?.addEventListener("change", async () => {
    if (!avatar.files[0]) return;
    const data = new FormData();
    data.append("file", avatar.files[0]);
    try {
      const result = await window.Api.upload(window.AppConfig.endpoints.avatar, data);
      window.Toast.success(result.data.message || "تصویر ذخیره شد.");
    } catch (error) {
      window.Common.handleError(error);
    }
  });
})();
