window.PanelUI = (function () {
  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value ?? "";
    });
  }

  function bindLogout() {
    document.querySelectorAll("[data-action='logout'], #panelLogout, #headerLogout").forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        window.Auth.logout();
      });
    });
  }

  return { setText, bindLogout };
})();
