(async function () {
  if (!await window.PanelLayout.init()) return;
  const form = document.getElementById("customer-form") || document.querySelector("form");
  if (!form) return;
  const id = window.Common.query("id");

  if (id) {
    try {
      const item = (await window.Api.get(window.AppConfig.endpoints.adminCustomer(id))).data;
      if (form.firstName) form.firstName.value = item.firstName || "";
      if (form.lastName) form.lastName.value = item.lastName || "";
      if (form.mobileNumber) {
        form.mobileNumber.value = item.mobileNumber || "";
        form.mobileNumber.disabled = true;
      }
      if (form.address) form.address.value = item.address || "";
      if (form.postalCode) form.postalCode.value = item.postalCode || "";
      if (form.isActive) form.isActive.checked = item.isActive;
    } catch (error) {
      window.Common.handleError(error);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      mobileNumber: form.mobileNumber.value,
      address: form.address?.value,
      postalCode: form.postalCode?.value,
      isActive: form.isActive ? form.isActive.checked : true,
      password: form.password?.value
    };
    try {
      const result = id
        ? await window.Api.put(window.AppConfig.endpoints.adminCustomer(id), payload)
        : await window.Api.post(window.AppConfig.endpoints.adminCustomers, payload);
      window.Toast.success(result.data.message);
      location.href = "customers.html";
    } catch (error) {
      window.Common.handleError(error);
    }
  });
})();
