(async function () {
  const user = await window.PanelLayout.init();
  if (!user) return;
  const form = document.getElementById("profile-form") || document.querySelector("form");
  if (form?.firstName) form.firstName.value = user.firstName || "";
  if (form?.lastName) form.lastName.value = user.lastName || "";
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await window.Api.put(window.AppConfig.endpoints.profile, {
        firstName: form.firstName.value,
        lastName: form.lastName.value,
        address: form.address?.value,
        postalCode: form.postalCode?.value
      });
      window.Toast.success(result.data.message);
    } catch (error) {
      window.Common.handleError(error);
    }
  });
  document.getElementById("password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const passwordForm = event.target;
    try {
      const result = await window.Api.post(window.AppConfig.endpoints.changePassword, {
        currentPassword: passwordForm.currentPassword.value,
        newPassword: passwordForm.newPassword.value
      });
      window.Toast.success(result.data.message);
    } catch (error) {
      window.Common.handleError(error);
    }
  });
})();
