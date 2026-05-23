/**
 * Minimal SCORM 1.2 API stub for self-hosted orientation module.
 * Persists learner data in localStorage so progress survives page refreshes.
 * No server / LMS required — this is purely client-side.
 *
 * Exposed as window.API (SCORM 1.2 spec requires the name "API").
 */
(function () {
  var STORE_KEY = "brewmatch_scorm_orientation";

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; }
  }

  function save(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  var _data = load();
  var _initialized = false;
  var _finished = false;

  var API = {
    LMSInitialize: function (param) {
      _initialized = true;
      return "true";
    },
    LMSFinish: function (param) {
      _finished = true;
      save(_data);
      // Fire a custom event so the parent page can react (e.g. show "Completed" badge).
      try { window.parent.postMessage({ type: "scorm:finish", data: _data }, "*"); } catch (e) {}
      return "true";
    },
    LMSGetValue: function (element) {
      return String(_data[element] !== undefined ? _data[element] : "");
    },
    LMSSetValue: function (element, value) {
      _data[element] = value;
      // Persist on every set so progress is saved even if LMSFinish is never called.
      save(_data);
      // Let the parent know about lesson_status changes.
      if (element === "cmi.core.lesson_status") {
        try { window.parent.postMessage({ type: "scorm:status", status: value }, "*"); } catch (e) {}
      }
      return "true";
    },
    LMSCommit: function (param) {
      save(_data);
      return "true";
    },
    LMSGetLastError: function () { return "0"; },
    LMSGetErrorString: function (errorCode) { return "No error"; },
    LMSGetDiagnostic: function (errorCode) { return "No error"; },
  };

  window.API = API;

  // Expose a read helper so the player page can check prior progress on load.
  window.SCORM_getData = function () { return load(); };
})();
