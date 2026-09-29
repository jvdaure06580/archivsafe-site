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
    if (!form || form.dataset.pret) return;
    form.dataset.pret = '1';
    var $ = function (sel) { return form.querySelector(sel); };
    var $$ = function (sel) { return Array.prototype.slice.call(form.querySelectorAll(sel)); };
    var val = function (name) { var e = form.querySelector('[name="' + name + '"]:checked'); return e ? e.value : ''; };

    // --- Volume en m3 ---
    var M3 = { boite: 0.0083, standard: 0.03, demenagement: 0.058, melange: 0.035 };
    var FOURCHETTES = { '1-30': [1, 30], '31-100': [31, 100], '101-300': [101, 300], '301-600': [301, 600], '600+': [600, null] };
    var LIB_TAILLE = { boite: "Boîte d'archives (dos 10 cm)", standard: "Carton d'archives standard (≈ 40 × 30 × 25 cm)", demenagement: 'Carton de déménagement (≈ 55 × 35 × 30 cm)', melange: 'Tailles mélangées' };
    function fmt(n) { return (Math.round(n * 10) / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 }); }
    function calculM3() {
      var mode = val('mode_volume');
      if (mode === 'cartons') {
        var t = $('#taille').value, n = parseInt($('#nb').value, 10);
        if (t && n > 0) { var v = n * M3[t]; return { texte: n + ' carton(s) – ' + LIB_TAILLE[t], m3: (v < 0.1 ? '< 0,1' : fmt(v)) + ' m³' }; }
      } else if (mode === 'fourchette') {
        var f = val('fourchette');
        if (f) {
          var r = FOURCHETTES[f];
          return { texte: 'Fourchette : ' + (r[1] ? r[0] + ' à ' + r[1] : 'plus de ' + r[0]) + ' cartons standard',
                   m3: r[1] ? fmt(r[0] * M3.standard) + ' à ' + fmt(r[1] * M3.standard) + ' m³' : 'plus de ' + fmt(r[0] * M3.standard) + ' m³' };
        }
      }
      return null;
    }
    function majM3() {
      var box = $('#volume-m3'), c = calculM3();
      box.hidden = !c;
      if (c) box.querySelector('b').textContent = c.m3;
    }

    // --- Affichages conditionnels ---
    function maj() {
      var pro = val('type_client') === 'Professionnel';
      $('#bloc-pro').hidden = !pro; $('#societe').required = pro;
      var mode = val('mode_volume');
      $('#bloc-cartons').hidden = mode !== 'cartons';
      $('#bloc-fourchette').hidden = mode !== 'fourchette';
      $('#taille').required = $('#nb').required = mode === 'cartons';
      $$('[name=fourchette]')[0].required = mode === 'fourchette';
      $$('[data-ascenseur]').forEach(function (c) {
        var bloc = document.getElementById(c.getAttribute('data-ascenseur'));
        bloc.hidden = !c.checked;
        bloc.querySelector('input[type=radio]').required = c.checked;
      });
      majM3();
    }
    form.addEventListener('change', maj);
    form.addEventListener('input', function (e) { if (e.target.id === 'nb') majM3(); });
    maj();

    // --- Code postal -> ville ---
    var cp = $('#cp'), ville = $('#ville'), liste = $('#villes'), dernier = '';
    cp.addEventListener('input', function () {
      cp.value = cp.value.replace(/\D/g, '').slice(0, 5);
      if (cp.value.length !== 5 || cp.value === dernier) return;
      dernier = cp.value;
      if (/^980\d\d$/.test(cp.value)) { liste.innerHTML = '<option value="Monaco">'; ville.value = 'Monaco'; return; }
      fetch('https://geo.api.gouv.fr/communes?codePostal=' + cp.value + '&fields=nom&format=json')
        .then(function (r) { return r.json(); })
        .then(function (communes) {
          var noms = communes.map(function (c) { return c.nom; }).sort();
          liste.innerHTML = noms.map(function (n) { return '<option value="' + n.replace(/"/g, '&quot;') + '">'; }).join('');
          if (noms.length === 1) ville.value = noms[0];
          else if (noms.length > 1) { ville.value = ''; ville.placeholder = 'Choisissez : ' + noms.slice(0, 3).join(', ') + (noms.length > 3 ? '…' : ''); ville.focus(); }
        })
        .catch(function () { /* saisie manuelle possible */ });
    });

    // --- Validation des groupes de cases ---
    function groupe(nom, message) {
      var cases = $$('[name="' + nom + '"]'), ok = cases.some(function (c) { return c.checked; });
      cases[0].setCustomValidity(ok ? '' : message);
      return ok;
    }
    $$('[name=emplacement],[name=service_souhaite]').forEach(function (c) {
      c.addEventListener('change', function () { groupe('emplacement', 'Cochez au moins un emplacement.'); groupe('service_souhaite', 'Choisissez au moins un service.'); });
    });

    // --- Envoi ---
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      groupe('service_souhaite', 'Choisissez au moins un service.');
      groupe('emplacement', 'Cochez au moins un emplacement.');
      if (!/^\d{5}$/.test(cp.value)) cp.setCustomValidity('Saisissez un code postal à 5 chiffres.'); else cp.setCustomValidity('');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var envoi = form.querySelector('button[type=submit]');
      envoi.disabled = true; envoi.textContent = 'Envoi en cours…';
      status.className = 'form-status'; status.textContent = '';

      var vol = calculM3() || { texte: '', m3: '' };
      var coches = function (nom) { return $$('[name="' + nom + '"]:checked').map(function (c) { return c.value; }).join(', '); };
      var pro = val('type_client') === 'Professionnel';
      var d = new FormData();
      d.append('access_key', $('[name=access_key]').value);
      d.append('subject', 'Devis ' + (pro ? $('#societe').value : 'particulier') + ' – ' + ville.value + ' – ' + vol.m3);
      d.append('from_name', 'Site ArchivSafe');
      if ($('[name=botcheck]').checked) d.append('botcheck', 'on');
      d.append('Type de client', val('type_client'));
      if (pro) d.append('Raison sociale', $('#societe').value);
      d.append('Nom', $('#nom').value);
      d.append('email', $('#email').value);
      d.append('Téléphone', $('#tel').value || 'Non renseigné');
      d.append('Code postal', cp.value);
      d.append('Ville', ville.value);
      d.append('Services', coches('service_souhaite'));
      d.append('Volume', vol.texte);
      d.append('Volume estimé', vol.m3);
      d.append('Emplacement des archives', coches('emplacement'));
      if ($('[data-ascenseur="asc-etage"]').checked) { d.append('Étage : ascenseur', val('ascenseur_etage')); d.append('Numéro d\'étage', $('#num-etage').value || 'Non précisé'); }
      if ($('[data-ascenseur="asc-soussol"]').checked) d.append('Sous-sol : ascenseur', val('ascenseur_soussol'));
      d.append('Message', $('#message').value || '—');

      fetch(form.action, { method: 'POST', body: d, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (res) { if (res.success) window.location.href = '/merci'; else throw new Error(res.message || 'Erreur'); })
        .catch(function () {
          status.className = 'form-status err';
          status.textContent = "La demande n'a pas pu être envoyée. Écrivez-nous directement à contact@archivsafe.fr.";
          envoi.disabled = false; envoi.textContent = 'Envoyer ma demande de devis';
        });
    });
  };
  window.initDevis();
})();
