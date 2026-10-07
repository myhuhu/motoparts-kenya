// Small whitelist HTML sanitizer for product descriptions written in the admin
// rich-text editor. Anything not on the list is unwrapped or removed.
const ALLOWED = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "DEL", "CODE",
  "A", "UL", "OL", "LI", "P", "BR", "DIV", "SPAN",
]);
const DROP = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META"]);

export function sanitizeHtml(html = "") {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 8) {
        child.remove(); // comments
        return;
      }
      if (child.nodeType !== 1) return; // keep text nodes

      if (DROP.has(child.tagName)) {
        child.remove();
        return;
      }
      if (!ALLOWED.has(child.tagName)) {
        walk(child);
        child.replaceWith(...child.childNodes); // unwrap unknown tag, keep its content
        return;
      }

      [...child.attributes].forEach((attr) => {
        const safeLink =
          child.tagName === "A" &&
          attr.name === "href" &&
          /^(https?:|mailto:|tel:)/i.test(attr.value.trim());
        if (!safeLink) child.removeAttribute(attr.name);
      });
      if (child.tagName === "A") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
      walk(child);
    });
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

export const isEmptyHtml = (html = "") => html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
