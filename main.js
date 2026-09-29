(function () {
  // Menu mobile
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Fermer' : 'Menu';
    });
  }

  // Année du pied de page
  var y = document.getElementById('annee');
  if (y) y.textContent = new Date().getFullYear();

  // Consentement cookies : Google Tag Manager ne se charge qu'après accord
  var GTM_ID = 'GTM-NTW53TK9';
  function loadGTM() {
    if (window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }
  var choix = null;
  try { choix = localStorage.getItem('as-cookies'); } catch (e) {}
  var bandeau = document.getElementById('cookie');
  if (choix === 'oui') loadGTM();
  else if (!choix && bandeau) bandeau.classList.add('show');
  function repondre(v) {
    try { localStorage.setItem('as-cookies', v); } catch (e) {}
    if (bandeau) bandeau.classList.remove('show');
    if (v === 'oui') loadGTM();
  }
  document.querySelectorAll('[data-cookie]').forEach(function (b) {
    b.addEventListener('click', function () { repondre(b.getAttribute('data-cookie')); });
  });
  document.querySelectorAll('[data-cookie-reset]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      try { localStorage.removeItem('as-cookies'); } catch (err) {}
      if (bandeau) bandeau.classList.add('show');
    });
  });

  // Formulaire de devis (Web3Forms)
  window.initDevis = function () {
  var form = document.getElementById('form-devis');
  if (form) {
    var nb = document.getElementById('nb');
    function majVolume() {
      var mode = form.querySelector('input[name=mode_volume]:checked').value;
      document.getElementById('bloc-cartons').hidden = mode !== 'cartons';
      document.getElementById('bloc-fourchette').hidden = mode !== 'fourchette';
      nb.required = mode === 'cartons';
    }
    form.querySelectorAll('input[name=mode_volume]').forEach(function (r) { r.addEventListener('change', majVolume); });
    majVolume();
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var envoi = form.querySelector('button[type=submit]');
      envoi.disabled = true;
      envoi.textContent = 'Envoi en cours…';
      status.className = 'form-status';
      status.textContent = '';
      var data = new FormData(form);
      var services = data.getAll('service_souhaite');
      data.delete('service_souhaite');
      data.append('services', services.join(', ') || 'Non précisé');
      var mode = data.get('mode_volume');
      var volume = mode === 'cartons'
        ? data.get('nombre_cartons') + ' carton(s) – ' + data.get('taille_cartons')
        : 'Fourchette : ' + data.get('fourchette');
      ['mode_volume', 'nombre_cartons', 'taille_cartons', 'fourchette'].forEach(function (k) { data.delete(k); });
      data.append('volume', volume);
      fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            window.location.href = '/merci';
          } else { throw new Error(res.message || 'Erreur'); }
        })
        .catch(function () {
          status.className = 'form-status err';
          status.textContent = "La demande n'a pas pu être envoyée. Écrivez-nous directement à contact@archivsafe.fr.";
          envoi.disabled = false;
          envoi.textContent = 'Envoyer ma demande de devis';
        });
    });
  }
  };
  window.initDevis();
})();
