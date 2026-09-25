/* Light / dark theme. Loaded in <head>, before the stylesheet paints, so a
   returning dark-mode visitor never sees a flash of the light page.

   The choice is remembered under "hkj-theme". With nothing remembered the
   page follows the system setting. Any element carrying [data-theme-toggle]
   flips it; a [data-theme-label] inside names the theme it would switch to. */
(function (window, document) {
  "use strict";

  var KEY = "hkj-theme";
  var root = document.documentElement;

  function stored() {
    try {
      var t = window.localStorage.getItem(KEY);
      return t === "light" || t === "dark" ? t : null;
    } catch (e) { return null; }
  }

  function system() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function current() { return root.getAttribute("data-theme") || "light"; }

  function paintLabels() {
    var next = current() === "light" ? "Dark" : "Light";
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-toggle]"), function (button) {
      button.setAttribute("aria-label", "Switch to " + next.toLowerCase() + " theme");
      var label = button.querySelector("[data-theme-label]");
      if (label) label.textContent = next;
    });
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    paintLabels();
  }

  apply(stored() || system());

  /* Follow the system while the visitor hasn't picked a side. */
  if (window.matchMedia) {
    var query = window.matchMedia("(prefers-color-scheme: dark)");
    var follow = function () { if (!stored()) apply(system()); };
    if (query.addEventListener) query.addEventListener("change", follow);
    else if (query.addListener) query.addListener(follow);
  }

  document.addEventListener("DOMContentLoaded", paintLabels);
  document.addEventListener("click", function (e) {
    var button = e.target.closest && e.target.closest("[data-theme-toggle]");
    if (!button) return;
    var next = current() === "light" ? "dark" : "light";
    try { window.localStorage.setItem(KEY, next); } catch (err) { /* private mode */ }
    apply(next);
  });
})(window, document);
