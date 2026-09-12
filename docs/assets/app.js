/* Demo app: loads data/words.json, wires preview + tabs + copy buttons. */
(function () {
  'use strict';

  var SAMPLES = {
    js: [
      'npm install prohibited-word',
      '',
      "import { validate } from 'prohibited-word';",
      '',
      "const r = validate('kamu anjing', { locale: 'id-ID' });",
      'if (!r.isValid) {',
      "  console.log('Blocked:', r.found.map(f => f.word).join(', '));",
      '}'
    ].join('\n'),
    flutter: [
      '# pubspec.yaml',
      'dependencies:',
      '  prohibited_word: ^0.1.0',
      '',
      '// validator',
      "import 'package:prohibited_word/prohibited_word.dart';",
      '',
      'String? validator(String? v) {',
      "  final r = validate(v, locale: 'id-ID');",
      '  if (r.isValid) return null;',
      "  return 'Inappropriate word: ' + r.found.map((f) => f.word).join(', ');",
      '}',
      '',
      'TextFormField(validator: validator);'
    ].join('\n'),
    swift: [
      '// Package.swift',
      '.package(url: "https://github.com/qalvinahmad/prohibited-word.git", from: "0.1.0")',
      '// or CocoaPods: pod \'ProhibitedWord\'',
      '',
      'import ProhibitedWord',
      '',
      'let r = validate("kamu anjing", locale: "id-ID")',
      'if !r.isValid {',
      '    print("Blocked:", r.found.map { $0.word }.joined(separator: ", "))',
      '}'
    ].join('\n'),
    python: [
      'pip install prohibited-word',
      '',
      'from prohibited_word import validate',
      '',
      'r = validate("kamu anjing", locale="id-ID")',
      'if not r["is_valid"]:',
      '    print("Blocked:", [f["word"] for f in r["found"]])'
    ].join('\n'),
    go: [
      'go get github.com/qalvinahmad/prohibited-word/packages/go',
      '',
      'import pw "github.com/qalvinahmad/prohibited-word/packages/go"',
      '',
      'r := pw.Validate("kamu anjing", pw.Options{Locale: "id-ID"})',
      'if !r.IsValid {',
      '    fmt.Println("Blocked:", r.Found[0].Word)',
      '}'
    ].join('\n'),
    cli: [
      '# Homebrew',
      'brew install qalvinahmad/tap/prohibited-word',
      '',
      'prohibited-word --locale id-ID "kamu anjing"',
      'echo "halo apa kabar" | prohibited-word'
    ].join('\n')
  };

  var TAB_LABEL = { js: 'JavaScript', flutter: 'Flutter', swift: 'Swift', python: 'Python', go: 'Go', cli: 'CLI' };

  var PRESETS = [
    { label: 'Basic ID', text: 'kamu anjing banget', locale: '', dets: ['profanity'] },
    { label: 'Leet evasion', text: 'kamu 4nj1ng', locale: '', dets: ['profanity'] },
    { label: 'Separator evasion', text: 'a.n.j.i.n.g', locale: '', dets: ['profanity'] },
    { label: 'Clean', text: 'halo apa kabar, selamat pagi', locale: '', dets: ['profanity'] },
    { label: 'Javanese (jv)', text: 'kamu jancok', locale: 'jv', dets: ['profanity'] },
    { label: 'Thumbs-up AU', text: 'good 👍', locale: 'en-AU', dets: ['profanity'] },
    { label: 'Thumbs-up US', text: 'good 👍', locale: 'en-US', dets: ['profanity'] },
    { label: 'Regional ID', text: 'anak yatim piatu dibantu', locale: 'id-ID', dets: ['profanity'] },
    { label: 'Number 13 US', text: 'meeting room 13', locale: 'en-US', dets: ['profanity'] },
    { label: 'OK sign FR', text: 'nice 👌', locale: 'fr-FR', dets: ['profanity'] },
    { label: 'Phone number', text: 'hubungi 081234567890 ya', locale: '', dets: ['pii'] },
    { label: 'Hidden email', text: 'j o h n [at] gmail [dot] com', locale: '', dets: ['pii'] },
    { label: 'Donation scam', text: 'transfer langsung ke rekening ini ya', locale: 'id-ID', dets: ['scam'] },
    { label: 'Self-harm', text: 'aku mau bunuh diri', locale: '', dets: ['sensitive'] },
    { label: 'Gambling spam', text: 'main slot gacor maxwin', locale: '', dets: ['sensitive'] }
  ];

  var LOCALES = ['', 'id-ID', 'en-US', 'en-AU', 'en-GB', 'jv', 'ar-SA', 'ms-MY', 'nl-NL', 'pt-BR', 'es-MX', 'fr-CA', 'zh-CN', 'en', 'id'];

  function el(id) { return document.getElementById(id); }

  function initTabs() {
    var bar = el('tabs');
    var code = el('code-block');
    Object.keys(SAMPLES).forEach(function (key, i) {
      var b = document.createElement('button');
      b.className = 'tab' + (i === 0 ? ' active' : '');
      b.textContent = TAB_LABEL[key];
      b.setAttribute('data-tab', key);
      b.addEventListener('click', function () {
        bar.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        b.classList.add('active');
        code.textContent = SAMPLES[key];
      });
      bar.appendChild(b);
    });
    code.textContent = SAMPLES.js;
    el('copy-btn').addEventListener('click', function () {
      copyText(code.textContent, el('copy-btn'));
    });
  }

  function copyText(text, btn) {
    function done() {
      var old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = old; }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      done();
    }
  }

  function initDemo() {
    var input = el('demo-input'), locale = el('demo-locale'), sev = el('demo-sev');
    LOCALES.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l;
      o.textContent = l === '' ? 'Auto (all 130 languages)' : l;
      locale.appendChild(o);
    });
    var presets = el('presets');
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'preset';
      b.textContent = p.label;
      b.addEventListener('click', function () {
        input.value = p.text;
        locale.value = p.locale;
        ['profanity', 'pii', 'scam', 'sensitive'].forEach(function (d) {
          el('det-' + d).checked = (p.dets || ['profanity']).indexOf(d) >= 0;
        });
        run();
        input.focus();
      });
      presets.appendChild(b);
    });
    var t = null;
    function rerun() { clearTimeout(t); t = setTimeout(run, 150); }
    ['input', 'change'].forEach(function (ev) {
      input.addEventListener(ev, function () { clearTimeout(t); t = setTimeout(run, 200); });
      locale.addEventListener(ev, rerun);
      sev.addEventListener(ev, rerun);
      ['profanity', 'pii', 'scam', 'sensitive'].forEach(function (d) {
        el('det-' + d).addEventListener(ev, rerun);
      });
    });
  }

  function run() {
    var input = el('demo-input'), locale = el('demo-locale'), sev = el('demo-sev');
    var out = el('demo-result');
    var opts = {};
    if (locale.value) opts.locale = locale.value;
    opts.minSeverity = parseInt(sev.value, 10) || 1;
    opts.detectors = [];
    ['profanity', 'pii', 'scam', 'sensitive'].forEach(function (d) {
      if (el('det-' + d).checked) opts.detectors.push(d);
    });
    var t0 = performance.now();
    var r = window.ProhibitedWord.validate(input.value, opts);
    var ms = (performance.now() - t0).toFixed(1);
    var state = !r.isValid ? 'flagged' : (r.needsHelp ? 'help' : (r.needsReview ? 'review' : 'clean'));
    var label = !r.isValid ? 'Flagged' : (r.needsHelp ? 'Needs help' : (r.needsReview ? 'Needs review' : 'Clean'));
    var html = '';
    html += '<div class="status ' + state + '">'
      + label
      + '<span class="meta">severity ' + r.maxSeverity + ' · ' + ms + ' ms</span></div>';
    if (r.found.length) {
      html += '<div class="chips">';
      r.found.forEach(function (f) {
        html += '<span class="chip"><b>' + escapeHtml(f.word) + '</b>'
          + '<i>' + escapeHtml(f.detector) + '/' + escapeHtml(f.type) + ' · ' + escapeHtml(f.action) + ' · conf ' + f.confidence + '</i></span>';
      });
      html += '</div>';
    }
    out.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fillStats(db) {
    var langs = Object.keys(db.langs || {});
    var total = langs.reduce(function (n, l) { return n + (db.langs[l].words || []).length; }, 0);
    var starter = langs.filter(function (l) { return db.langs[l].maturity === 'starter'; }).length;
    var regional = langs.filter(function (l) { return db.langs[l].maturity === 'regional'; }).length;
    el('stat-langs').textContent = langs.length;
    el('stat-words').textContent = total.toLocaleString('en-US');
    el('stat-regions').textContent = Object.keys(db.regions || {}).length;
    el('stat-emoji').textContent = Object.keys(db.emoji || {}).length;
    el('maturity-note').textContent = starter + ' starter + ' + regional + ' regional of ' + langs.length + ' languages need native-speaker review — see tiers in README.';
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initDemo();
    fetch('data/words.json').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (db) {
      window.ProhibitedWord.loadDataset(db);
      fillStats(db);
      el('demo-input').value = 'kamu anjing banget';
      run();
    }).catch(function (err) {
      el('demo-result').innerHTML = '<div class="status flagged">Dataset failed to load: ' + escapeHtml(err.message) + '</div>';
    });
  });
})();
