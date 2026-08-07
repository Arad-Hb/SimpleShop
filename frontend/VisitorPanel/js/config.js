/**
 * VisitorPanel API configuration
 * Change API_BASE_URL to match `dotnet run` (see api/Properties/launchSettings.json)
 */
(function (Store) {
  'use strict';

  Store.config = {
    API_BASE_URL: 'http://localhost:5102',
    /** Use live API when reachable; fall back to shared JSON files when offline */
    USE_API: true,
    REQUEST_TIMEOUT_MS: 8000
  };
})(window.SimpleStore = window.SimpleStore || {});
