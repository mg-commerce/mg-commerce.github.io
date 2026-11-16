/* MG Logo-Shop: Upload, Vorschau und Warenkorb – HelmFuchs (MG Commerce) */
(function () {
  var CDN = 'https://cdn.shopify.com/s/files/1/0694/4532/0931/files/';
  // Musterbilder (1200x1200) und Logo-Feld [x0, y0, x1, y1, Hintergrundfarbe]
  var BILDER = {
    'logo-t-shirt': { box: [435, 411, 765, 549], farben: {
      'Weiß': ['logo-t-shirt-weiss.jpg', '#fcfffb'], 'Schwarz': ['logo-t-shirt-schwarz.jpg', '#1a1f19'], 'Navy': ['logo-t-shirt-navy.jpg', '#15224c'] } },
    'logo-hoodie': { box: [450, 497, 749, 623], farben: {
      'Weiß': ['logo-hoodie-weiss.jpg', '#f5f8fe'], 'Schwarz': ['logo-hoodie-schwarz.jpg', '#1f1f1d'], 'Navy': ['logo-hoodie-navy.jpg', '#1d264d'], 'Grau': ['logo-hoodie-grau.jpg', '#8d8e91'] } },
    'logo-polo-gestickt': { box: [615, 385, 785, 455], farben: {
      'Weiß': ['logo-polo-gestickt-weiss.jpg', '#fcfffb'], 'Schwarz': ['logo-polo-gestickt-schwarz.jpg', '#1c211b'], 'Navy': ['logo-polo-gestickt-navy.jpg', '#142849'] } },
    'logo-trinkflasche': { box: [490, 574, 710, 666], farben: { '*': ['logo-trinkflasche-weiss.jpg', '#f7fff3'] } },
    'logo-tasse': { box: [420, 545, 779, 695], farben: { '*': ['logo-tasse-weiss.jpg', '#fefdff'] } }
  };

  function start() {
    var box = document.getElementById('mg-logo-box');
    var feld = document.getElementById('mg-logo');
    var form = document.querySelector('form[action*="/cart/add"]');
    if (!box || !feld || !form) return;
    var knopf = form.querySelector('button[name="add"], [type="submit"]');
    if (knopf && knopf.parentNode) knopf.parentNode.insertBefore(box, knopf); else form.appendChild(box);

    /* ---------- Vorschau ---------- */
    var m = location.pathname.match(/\/products\/([^\/?#]+)/);
    var handle = m ? m[1] : '';
    var def = BILDER[handle];
    var vorschau = document.getElementById('mg-logo-vorschau');
    var canvas = vorschau ? vorschau.querySelector('canvas') : null;
    var hinweis = vorschau ? vorschau.querySelector('.mg-vs-hinweis') : null;
    var logoBild = null, varianten = null, cache = {};

    if (def) {
      fetch('/products/' + handle + '.js').then(function (r) { return r.json(); })
        .then(function (p) { varianten = p.variants; zeichnen(); }).catch(function () {});
    }
    function farbe() {
      if (!def) return null;
      if (def.farben['*']) return def.farben['*'];
      var id = '';
      try { id = String(new FormData(form).get('id') || ''); } catch (e) {}
      if (!id) id = new URLSearchParams(location.search).get('variant') || '';
      var v = (varianten || []).filter(function (x) { return String(x.id) === id; })[0];
      var name = v ? v.option1 : Object.keys(def.farben)[0];
      return def.farben[name] || def.farben[Object.keys(def.farben)[0]];
    }
    function bild(src, fertig) {
      if (cache[src]) { if (cache[src].complete) fertig(cache[src]); else cache[src].addEventListener('load', function () { fertig(cache[src]); }); return; }
      var i = new Image(); cache[src] = i; i.onload = function () { fertig(i); }; i.src = CDN + src;
    }
    function zeichnen() {
      if (!vorschau || !canvas || !def) return;
      if (!logoBild) { vorschau.hidden = true; return; }
      var f = farbe(); if (!f) return;
      vorschau.hidden = false;
      bild(f[0], function (grund) {
        var c = canvas.getContext('2d'), s = canvas.width / 1200, b = def.box;
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.drawImage(grund, 0, 0, canvas.width, canvas.height);
        // Platzhalter „IHR LOGO“ abdecken
        c.fillStyle = f[1];
        var p = 8; c.fillRect((b[0] - p) * s, (b[1] - p) * s, (b[2] - b[0] + 2 * p) * s, (b[3] - b[1] + 2 * p) * s);
        // Logo einpassen
        var bw = (b[2] - b[0]) * s * 0.92, bh = (b[3] - b[1]) * s * 0.86;
        var r = Math.min(bw / logoBild.width, bh / logoBild.height);
        var w = logoBild.width * r, h = logoBild.height * r;
        var x = (b[0] + b[2]) / 2 * s - w / 2, y = (b[1] + b[3]) / 2 * s - h / 2;
        c.drawImage(logoBild, x, y, w, h);
      });
    }
    feld.addEventListener('change', function () {
      logoBild = null;
      var datei = feld.files && feld.files[0];
      if (hinweis) hinweis.textContent = '';
      if (!datei) { zeichnen(); return; }
      if (!/^image\/(png|jpe?g|svg\+xml|webp|gif)$/.test(datei.type)) {
        if (vorschau) vorschau.hidden = true;
        var n = document.getElementById('mg-logo-pdf'); if (n) n.hidden = false;
        return;
      }
      var n2 = document.getElementById('mg-logo-pdf'); if (n2) n2.hidden = true;
      var leser = new FileReader();
      leser.onload = function () {
        var i = new Image();
        i.onload = function () {
          logoBild = i; zeichnen();
          if (hinweis && i.width && i.width < 1000 && !/svg/.test(datei.type))
            hinweis.textContent = 'Hinweis: Ihr Logo ist nur ' + i.width + ' Pixel breit und könnte im Druck unscharf werden. Wir melden uns, falls nötig.';
        };
        i.src = leser.result;
      };
      leser.readAsDataURL(datei);
    });
    form.addEventListener('change', function (e) { if (e.target !== feld) setTimeout(zeichnen, 50); });
    document.addEventListener('click', function () { setTimeout(zeichnen, 150); });

    /* ---------- Mit Logo selbst in den Warenkorb (Theme lässt Dateien weg) ---------- */
    var laeuft = false;
    function senden(e) {
      if (!feld.files || !feld.files.length) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (laeuft) return; laeuft = true;
      if (knopf) knopf.disabled = true;
      fetch('/cart/add.js', { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); window.location.href = '/cart'; })
        .catch(function () {
          laeuft = false; if (knopf) knopf.disabled = false;
          alert('Das Logo konnte nicht hochgeladen werden. Bitte erneut versuchen oder nach der Bestellung an info@helmfuchs.de schicken.');
        });
    }
    if (knopf) knopf.addEventListener('click', senden, true);
    form.addEventListener('submit', senden, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
