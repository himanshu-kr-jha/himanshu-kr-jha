/* Tiny DOM builder shared by index.html and blog.html.
   Everything goes through textContent, so content from portfolio-data.js is
   never parsed as markup. */
(function (window) {
  "use strict";

  function append(node, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(function (c) { append(node, c); });
      return;
    }
    node.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  }

  /* el("a", {class: "btn", href: url, text: "Label"}, children) */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key.indexOf("on") === 0 && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    append(node, children);
    return node;
  }

  /* The four registration marks every .blueprint object wears. */
  function corners() {
    return ["tl", "tr", "bl", "br"].map(function (pos) {
      return el("i", { class: "corner " + pos });
    });
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  /* On narrow screens the rail index is a horizontal strip; if the current
     entry sits past its right edge you land on a page with no visible marker
     of where you are. Centre it once, on load. */
  function revealCurrent(container) {
    var node = typeof container === "string" ? document.getElementById(container) : container;
    var current = node && node.querySelector(".is-current");
    if (!current || node.scrollWidth <= node.clientWidth) return;
    node.scrollLeft = Math.max(0, current.offsetLeft - (node.clientWidth - current.offsetWidth) / 2);
  }

  function mount(target, children) {
    var node = typeof target === "string" ? document.getElementById(target) : target;
    if (!node) return null;
    node.textContent = "";
    append(node, children);
    return node;
  }

  window.DOM = {
    el: el, corners: corners, pad: pad, mount: mount, append: append,
    revealCurrent: revealCurrent
  };
})(window);
