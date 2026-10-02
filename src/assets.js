/* ==================== assets.js — optional generated art ====================
   tools/hf-assets.mjs can make backgrounds, the menu/intro art and ending stills (never people) and
   lists them in assets.list.js. If a file is listed and loads, the game uses it; otherwise every
   scene falls back to its code-drawn art, so the game always works with zero assets. */
const ASSETS = (function () {
  const imgs = {};
  const files = (typeof ASSET_FILES === 'object' && ASSET_FILES) || {};
  if (typeof Image !== 'undefined') {
    Object.keys(files).forEach(function (id) {
      const im = new Image();
      im.onload = function () { imgs[id] = im; };
      im.src = 'assets/gen/' + files[id];
    });
  }
  return { img: function (id) { return imgs[id] || null; }, ids: Object.keys(files) };
})();

/* draw an image so it covers the box (cropping the overflow), like CSS object-fit: cover */
function drawCover(c, img, x, y, w, h) {
  const k = Math.max(w / img.width, h / img.height);
  const sw = w / k, sh = h / k;
  c.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}
