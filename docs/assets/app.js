/* prohibited-word interactive demo & SDK tabs application */
(function () {
  'use strict';

  var SAMPLES = {
    js: {
      label: 'JavaScript / TypeScript',
      filename: 'validator.js',
      cmd: 'npm install prohibited-word',
      code: [
        "// 1. Impor validator dari package npm",
        "import { validate, contains, censor } from 'prohibited-word';",
        "",
        "// 2. Validasi input formulir pengguna",
        "const result = validate('kamu anjing banget', { locale: 'id-ID' });",
        "",
        "if (!result.isValid) {",
        "  console.log('Status: Ditolak / Mengandung kata terlarang');",
        "  console.log('Kata terdeteksi:', result.found.map(f => f.word));",
        "  console.log('Tingkat keparahan (Max Severity):', result.maxSeverity);",
        "} else {",
        "  console.log('Status: Bersih & Lolos validasi');",
        "}",
        "",
        "// 3. Sensor otomatis menjadi tanda bintang (*)",
        "const cleanText = censor('kamu anjing banget', '*');",
        "console.log('Hasil sensor:', cleanText); // 'kamu ****** banget'",
        "",
        "// 4. Deteksi gesture/emoji budaya (contoh jempol 👍 di AU vs US)",
        "console.log('👍 di AU:', validate('good 👍', { locale: 'en-AU' }).isValid); // false (tabu)",
        "console.log('👍 di US:', validate('good 👍', { locale: 'en-US' }).isValid); // true (ramah)"
      ].join('\n')
    },
    python: {
      label: 'Python',
      filename: 'validator.py',
      cmd: 'pip install prohibited-word',
      code: [
        "# 1. Impor validator dari paket Python",
        "from prohibited_word import validate, contains, censor",
        "",
        "# 2. Validasi input komentar",
        "result = validate('kamu anjing banget', locale='id-ID')",
        "",
        "if not result['is_valid']:",
        "    blocked = [f['word'] for f in result['found']]",
        "    print(f'Peringatan: Komentar mengandung kata terlarang: {blocked}')",
        "    print(f'Max Severity: {result[\"max_severity\"]}')",
        "else:",
        "    print('Komentar aman dan lolos validasi')",
        "",
        "# 3. Sensor teks otomatis",
        "safe_text = censor('kamu anjing banget', mask='*')",
        "print('Teks tersensor:', safe_text)  # 'kamu ****** banget'",
        "",
        "# 4. Cek cepat boolean (O(N) Trie)",
        "if contains('kamu 4nj1ng', locale='id-ID'):",
        "    print('Terdeteksi pola leet-speak!')"
      ].join('\n')
    },
    go: {
      label: 'Go',
      filename: 'main.go',
      cmd: 'go get github.com/qalvinahmad/prohibited-word/packages/go',
      code: [
        "package main",
        "",
        "import (",
        "\t\"fmt\"",
        "\tpw \"github.com/qalvinahmad/prohibited-word/packages/go\"",
        ")",
        "",
        "func main() {",
        "\t// Validasi teks komentar dengan opsi Locale",
        "\tres := pw.Validate(\"kamu anjing banget\", pw.Options{",
        "\t\tLocale: \"id-ID\",",
        "\t})",
        "",
        "\tif !res.IsValid {",
        "\t\tfmt.Printf(\"Validasi Gagal! Max Severity: %d\\n\", res.MaxSeverity)",
        "\t\tfor _, f := range res.Found {",
        "\t\t\tfmt.Printf(\"- Kata: %s | Kategori: %s | Severity: %d\\n\", f.Word, f.Category, f.Severity)",
        "\t\t}",
        "\t} else {",
        "\t\tfmt.Println(\"Teks lolos validasi\")",
        "\t}",
        "",
        "\t// Sensor kata terlarang",
        "\tsafe := pw.Censor(\"kamu anjing banget\", \"*\")",
        "\tfmt.Println(\"Hasil Sensor:\", safe)",
        "}"
      ].join('\n')
    },
    flutter: {
      label: 'Flutter / Dart',
      filename: 'validator.dart',
      cmd: 'flutter pub add prohibited_word',
      code: [
        "import 'package:flutter/material.dart';",
        "import 'package:prohibited_word/prohibited_word.dart';",
        "",
        "/// Validator bawaan untuk TextFormField Flutter",
        "String? formFieldValidator(String? value) {",
        "  if (value == null || value.trim().isEmpty) return null;",
        "",
        "  final result = validate(value, locale: 'id-ID');",
        "  if (!result.isValid) {",
        "    final words = result.found.map((f) => f.word).join(', ');",
        "    return 'Komentar tidak pantas: terdeteksi [$words]';",
        "  }",
        "",
        "  return null; // Teks lolos validasi",
        "}",
        "",
        "// Contoh implementasi di dalam Widget:",
        "// TextFormField(",
        "//   decoration: InputDecoration(labelText: 'Tulis komentar...'),",
        "//   validator: formFieldValidator,",
        "//   autovalidateMode: AutovalidateMode.onUserInteraction,",
        "// )"
      ].join('\n')
    },
    swift: {
      label: 'Swift (iOS / macOS)',
      filename: 'Validator.swift',
      cmd: '// Package.swift: .package(url: "https://github.com/qalvinahmad/prohibited-word.git", from: "0.1.0")',
      code: [
        "import Foundation",
        "import ProhibitedWord",
        "",
        "// Validasi input pengguna",
        "let input = \"kamu anjing banget\"",
        "let result = validate(input, locale: \"id-ID\")",
        "",
        "if !result.isValid {",
        "    let violations = result.found.map { $0.word }.joined(separator: \", \")",
        "    print(\"Validasi form gagal! Ditemukan: [\\(violations)]\")",
        "    print(\"Max severity: \\(result.maxSeverity)\")",
        "} else {",
        "    print(\"Teks valid dan siap disimpan ke server\")",
        "}",
        "",
        "// Sensor kata terlarang",
        "let censored = censor(input, mask: \"*\")",
        "print(\"Teks tersensor: \\(censored)\")"
      ].join('\n')
    },
    cli: {
      label: 'CLI Terminal',
      filename: 'Terminal',
      cmd: 'brew install qalvinahmad/tap/prohibited-word',
      code: [
        "# 1. Periksa teks langsung melalui argumen:",
        "prohibited-word --locale id-ID \"kamu anjing\"",
        "",
        "# 2. Periksa teks via pipe / stdin (misal untuk Git commit-hook):",
        "echo \"halo selamat pagi\" | prohibited-word --exit-code",
        "",
        "# 3. Periksa dengan format JSON untuk integrasi CI/CD:",
        "prohibited-word --json --locale ar-SA \"teks yang ingin diuji\""
      ].join('\n')
    }
  };

  var PRESETS = [
    { label: 'Basic ID', text: 'kamu anjing banget', locale: 'id-ID', dets: ['profanity'] },
    { label: 'Leet evasion', text: 'kamu 4nj1ng', locale: 'id-ID', dets: ['profanity'] },
    { label: 'Separator evasion', text: 'a.n.j.i.n.g', locale: 'id-ID', dets: ['profanity'] },
    { label: 'Thumbs-up AU 👍 (Tabu)', text: 'good job 👍', locale: 'en-AU', dets: ['profanity'] },
    { label: 'Thumbs-up US 👍 (Ramah)', text: 'good job 👍', locale: 'en-US', dets: ['profanity'] },
    { label: 'Jawa (jv)', text: 'kamu jancok', locale: 'jv', dets: ['profanity'] },
    { label: 'Nomor HP (PII)', text: 'hubungi 081234567890 ya', locale: 'id-ID', dets: ['pii'] },
    { label: 'Penipuan Transfer', text: 'transfer langsung ke rekening ini ya', locale: 'id-ID', dets: ['scam'] },
    { label: 'Teks Bersih ✓', text: 'halo apa kabar, selamat pagi kawan', locale: 'id-ID', dets: ['profanity'] }
  ];

  var LOCALES = [
    { code: '', label: 'Auto (Semua 130 Bahasa)' },
    { code: 'id-ID', label: 'id-ID (Indonesia)' },
    { code: 'en-US', label: 'en-US (Inggris - US)' },
    { code: 'en-AU', label: 'en-AU (Inggris - Australia)' },
    { code: 'en-GB', label: 'en-GB (Inggris - UK)' },
    { code: 'jv', label: 'jv (Bahasa Jawa)' },
    { code: 'ar-SA', label: 'ar-SA (Arab - Saudi Arabia)' },
    { code: 'ms-MY', label: 'ms-MY (Melayu - Malaysia)' },
    { code: 'nl-NL', label: 'nl-NL (Belanda)' },
    { code: 'pt-BR', label: 'pt-BR (Portugis - Brasil)' },
    { code: 'es-MX', label: 'es-MX (Spanyol - Meksiko)' },
    { code: 'fr-FR', label: 'fr-FR (Prancis)' },
    { code: 'zh-CN', label: 'zh-CN (Mandarin - China)' },
    { code: 'ja-JP', label: 'ja-JP (Jepang)' },
    { code: 'ko-KR', label: 'ko-KR (Korea)' },
    { code: 'de-DE', label: 'de-DE (Jerman)' },
    { code: 'ru-RU', label: 'ru-RU (Rusia)' }
  ];

  function el(id) { return document.getElementById(id); }

  function copyText(text, btn, successLabel) {
    var oldText = btn.innerHTML;
    function done() {
      btn.innerHTML = successLabel || '✓ Tersalin!';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.innerHTML = oldText;
        btn.classList.remove('copied');
      }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
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

  function initTabs() {
    var bar = el('tabs');
    var code = el('code-block');
    var installCmd = el('install-cmd');
    var tabTitle = el('terminal-tab-title');
    if (!bar) return;

    bar.innerHTML = '';
    var keys = Object.keys(SAMPLES);
    keys.forEach(function (key, i) {
      var b = document.createElement('button');
      b.className = 'tab-btn' + (i === 0 ? ' active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('data-tab', key);
      b.textContent = SAMPLES[key].label;
      b.addEventListener('click', function () {
        bar.querySelectorAll('.tab-btn').forEach(function (t) { t.classList.remove('active'); });
        b.classList.add('active');
        code.textContent = SAMPLES[key].code;
        installCmd.textContent = SAMPLES[key].cmd;
        tabTitle.textContent = SAMPLES[key].filename;
      });
      bar.appendChild(b);
    });

    // Initial tab content
    code.textContent = SAMPLES.js.code;
    installCmd.textContent = SAMPLES.js.cmd;
    tabTitle.textContent = SAMPLES.js.filename;

    el('copy-code-btn').addEventListener('click', function () {
      copyText(code.textContent, el('copy-code-btn'), '<span>✓ Tersalin!</span>');
    });

    el('copy-install-btn').addEventListener('click', function () {
      copyText(installCmd.textContent, el('copy-install-btn'), '<span>✓</span>');
    });
  }

  function initDemo() {
    var input = el('demo-input');
    var locale = el('demo-locale');
    var sev = el('demo-sev');
    var clearBtn = el('clear-btn');
    var presets = el('presets');

    // Populate locales
    LOCALES.forEach(function (loc) {
      var opt = document.createElement('option');
      opt.value = loc.code;
      opt.textContent = loc.label;
      locale.appendChild(opt);
    });

    // Populate presets
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-btn';
      b.textContent = p.label;
      b.addEventListener('click', function () {
        input.value = p.text;
        locale.value = p.locale;
        ['profanity', 'pii', 'scam', 'sensitive'].forEach(function (d) {
          el('det-' + d).checked = (p.dets || ['profanity']).indexOf(d) >= 0;
        });
        handleInputChange();
        input.focus();
      });
      presets.appendChild(b);
    });

    // Input changes
    var debounceTimer = null;
    function handleInputChange() {
      clearTimeout(debounceTimer);
      var val = input.value;
      if (!val || val.trim() === '') {
        clearBtn.style.display = 'none';
        el('empty-state').style.display = 'block';
        el('demo-result').style.display = 'none';
      } else {
        clearBtn.style.display = 'flex';
        el('empty-state').style.display = 'none';
        el('demo-result').style.display = 'block';
        debounceTimer = setTimeout(run, 80);
      }
    }

    input.addEventListener('input', handleInputChange);
    input.addEventListener('change', handleInputChange);

    clearBtn.addEventListener('click', function () {
      input.value = '';
      handleInputChange();
      input.focus();
    });

    // Option changes
    var rerun = function () {
      if (input.value.trim() !== '') {
        run();
      }
    };
    locale.addEventListener('change', rerun);
    sev.addEventListener('change', rerun);
    ['profanity', 'pii', 'scam', 'sensitive'].forEach(function (d) {
      el('det-' + d).addEventListener('change', rerun);
    });

    // Copy clean censored text button
    el('copy-clean-btn').addEventListener('click', function () {
      var txt = el('censored-output').textContent;
      copyText(txt, el('copy-clean-btn'), '<span>✓ Teks Tersalin!</span>');
    });
  }

  function run() {
    var input = el('demo-input');
    var rawText = input.value;
    if (!rawText || rawText.trim() === '') return;

    var locale = el('demo-locale');
    var sev = el('demo-sev');
    var opts = {};
    if (locale.value) opts.locale = locale.value;
    opts.minSeverity = parseInt(sev.value, 10) || 1;
    opts.detectors = [];
    ['profanity', 'pii', 'scam', 'sensitive'].forEach(function (d) {
      if (el('det-' + d).checked) opts.detectors.push(d);
    });

    var t0 = performance.now();
    var r = window.ProhibitedWord.validate(rawText, opts);
    var ms = (performance.now() - t0).toFixed(2);

    // Status Banner Logic
    var banner = el('result-status-banner');
    var iconEl = el('status-icon');
    var headingEl = el('status-heading');
    var subtextEl = el('status-subtext');
    var sevBadge = el('sev-badge');
    var latencyBadge = el('latency-badge');

    banner.className = 'status-banner';
    latencyBadge.textContent = '⚡ ' + ms + ' ms';
    sevBadge.textContent = 'Severity ' + r.maxSeverity;

    if (!r.isValid) {
      banner.classList.add('status-flagged');
      iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      headingEl.textContent = 'Terdeteksi Pelanggaran (Flagged)';
      subtextEl.textContent = 'Teks mengandung kata, gesture, atau konten terlarang yang diblokir.';
    } else if (r.needsReview) {
      banner.classList.add('status-review');
      iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      headingEl.textContent = 'Perlu Peninjauan (Needs Review)';
      subtextEl.textContent = 'Teks mengandung kata/simbol yang berpotensi sensitif atau tabu.';
    } else if (r.needsHelp) {
      banner.classList.add('status-help');
      iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      headingEl.textContent = 'Memerlukan Bantuan (Needs Help)';
      subtextEl.textContent = 'Teks terdeteksi mengandung indikasi sensitif.';
    } else {
      banner.classList.add('status-clean');
      iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
      headingEl.textContent = 'Lolos Validasi (Clean)';
      subtextEl.textContent = 'Teks bersih. Tidak ada kata, gesture tabu, atau PII terdeteksi.';
    }

    // Censored text output
    var censored = window.ProhibitedWord.censor ? window.ProhibitedWord.censor(rawText, '*', opts) : rawText;
    el('censored-output').textContent = censored;

    // Highlighted Text Output & Violations Breakdown
    var highlightBox = el('highlight-box');
    var violationsBox = el('violations-box');
    var chipsGrid = el('chips-grid');

    if (r.found && r.found.length > 0) {
      highlightBox.style.display = 'block';
      violationsBox.style.display = 'block';
      el('violations-count').textContent = r.found.length + ' temuan';

      // Build highlighted HTML
      var highlightedHTML = escapeHtml(rawText);
      r.found.forEach(function (f) {
        if (!f.word) return;
        var reg = new RegExp('(' + escapeRegExp(f.word) + ')', 'gi');
        highlightedHTML = highlightedHTML.replace(reg, '<mark class="flagged-token" title="' + escapeHtml(f.detector + ' · ' + f.action) + '">$1</mark>');
      });
      el('highlighted-output').innerHTML = highlightedHTML;

      // Build chips list
      var chipsHTML = '';
      r.found.forEach(function (f) {
        var note = '';
        if (f.via === 'emoji') {
          note = 'Gestur/Emoji tabu di region terpilih';
        } else if (f.detector === 'pii') {
          note = 'Data pribadi (PII): ' + f.type;
        } else if (f.detector === 'scam') {
          note = 'Pola penipuan / scam: ' + f.type;
        } else {
          note = 'Kata terlarang (' + (f.category || 'profanity') + ')';
        }

        chipsHTML += '<div class="chip-item">'
          + '<div class="chip-top">'
          + '  <b class="chip-word">' + escapeHtml(f.word) + '</b>'
          + '  <span class="chip-badge chip-' + (f.action || 'block') + '">' + escapeHtml(f.action || 'block') + '</span>'
          + '</div>'
          + '<div class="chip-meta">'
          + '  <span>' + escapeHtml(note) + '</span>'
          + '  <span>Severity: ' + (f.severity || 2) + ' · Conf: ' + Math.round((f.confidence || 0.5) * 100) + '%</span>'
          + '</div>'
          + '</div>';
      });
      chipsGrid.innerHTML = chipsHTML;
    } else {
      highlightBox.style.display = 'none';
      violationsBox.style.display = 'none';
      chipsGrid.innerHTML = '';
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeRegExp(string) {
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function fillStats(db) {
    var langs = Object.keys(db.langs || {});
    var total = langs.reduce(function (n, l) { return n + (db.langs[l].words || []).length; }, 0);
    var starter = langs.filter(function (l) { return db.langs[l].maturity === 'starter'; }).length;
    var regional = langs.filter(function (l) { return db.langs[l].maturity === 'regional'; }).length;
    var verified = langs.filter(function (l) { return db.langs[l].maturity === 'verified' || db.langs[l].maturity === 'tier1'; }).length;

    el('stat-langs').textContent = langs.length;
    el('stat-words').textContent = total.toLocaleString('id-ID');
    el('stat-regions').textContent = Object.keys(db.regions || {}).length;
    el('stat-emoji').textContent = Object.keys(db.emoji || {}).length;

    el('maturity-note').textContent = 'Mendukung ' + langs.length + ' bahasa: ' + verified + ' Tier 1 Verified, ' + regional + ' Tier 2 Regional (termasuk Bahasa Jawa jv), dan ' + starter + ' Tier 3 Starter.';
  }

  function initThemeToggle() {
    var toggleBtn = el('theme-toggle');
    if (!toggleBtn) return;
    var saved = localStorage.getItem('pw_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    toggleBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('pw_theme', next);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    initTabs();
    initDemo();

    fetch('data/words.json').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (db) {
      window.ProhibitedWord.loadDataset(db);
      fillStats(db);
    }).catch(function (err) {
      console.error('Gagal memuat dataset:', err);
      el('empty-state').innerHTML = '<div class="empty-state-title" style="color: #ef4444;">Dataset gagal dimuat: ' + escapeHtml(err.message) + '</div>';
    });
  });
})();
