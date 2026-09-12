/* prohibited-word interactive demo & SDK tabs application */
(function () {
  'use strict';

  var SAMPLES = {
    js: {
      label: 'JavaScript / TypeScript',
      filename: 'validator.js',
      cmd: 'npm install prohibited-word',
      code: [
        "// 1. Import the validator from npm",
        "import { validate, contains, censor } from 'prohibited-word';",
        "",
        "// 2. Validate user form input",
        "const result = validate('shut up bitch', { locale: 'en-US' });",
        "",
        "if (!result.isValid) {",
        "  console.log('Status: Rejected / Contains prohibited words');",
        "  console.log('Detected words:', result.found.map(f => f.word));",
        "  console.log('Max Severity:', result.maxSeverity);",
        "} else {",
        "  console.log('Status: Clean & passed validation');",
        "}",
        "",
        "// 3. Auto-mask with asterisks (*)",
        "const cleanText = censor('shut up bitch', '*');",
        "console.log('Censored:', cleanText); // '**** up *****'",
        "",
        "// 4. Cultural gesture/emoji detection (thumbs-up 👍 in AU vs US)",
        "console.log('👍 in AU:', validate('good 👍', { locale: 'en-AU' }).isValid); // false (rude)",
        "console.log('👍 in US:', validate('good 👍', { locale: 'en-US' }).isValid); // true (friendly)"
      ].join('\n')
    },
    python: {
      label: 'Python',
      filename: 'validator.py',
      cmd: 'pip install prohibited-word',
      code: [
        "# 1. Import the validator from PyPI",
        "from prohibited_word import validate, contains",
        "",
        "# 2. Validate a comment input",
        "result = validate('shut up bitch', locale='en-US')",
        "",
        "if not result['is_valid']:",
        "    blocked = [f['word'] for f in result['found']]",
        "    print(f'Warning: comment contains prohibited words: {blocked}')",
        "    print(f\"Max Severity: {result['max_severity']}\")",
        "else:",
        "    print('Comment is safe and passed validation')",
        "",
        "# 3. Opt-in PII layer (phone numbers, emails, IDs, cards)",
        "pii = validate('call +14155552671', detectors=['pii'])",
        "print('PII found:', [f['type'] for f in pii['found']])  # ['phone']",
        "",
        "# 4. Fast boolean check (O(N) trie)",
        "if contains('you are sh1t', locale='en-US'):",
        "    print('Leet-speak pattern detected!')"
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
        "\t// Validate comment text with a Locale option",
        "\tres := pw.Validate(\"shut up bitch\", pw.Options{",
        "\t\tLocale: \"en-US\",",
        "\t})",
        "",
        "\tif !res.IsValid {",
        "\t\tfmt.Printf(\"Validation failed! Max Severity: %d\\n\", res.MaxSeverity)",
        "\t\tfor _, f := range res.Found {",
        "\t\t\tfmt.Printf(\"- Word: %s | Category: %s | Severity: %d\\n\", f.Word, f.Category, f.Severity)",
        "\t\t}",
        "\t} else {",
        "\t\tfmt.Println(\"Text passed validation\")",
        "\t}",
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
        "/// Built-in validator for Flutter TextFormField",
        "String? formFieldValidator(String? value) {",
        "  if (value == null || value.trim().isEmpty) return null;",
        "",
        "  final result = validate(value, locale: 'en-US');",
        "  if (!result.isValid) {",
        "    final words = result.found.map((f) => f.word).join(', ');",
        "    return 'Inappropriate comment: detected [$words]';",
        "  }",
        "",
        "  return null; // Text passed validation",
        "}",
        "",
        "// Example usage inside a Widget:",
        "// TextFormField(",
        "//   decoration: InputDecoration(labelText: 'Write a comment...'),",
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
        "// Validate user input",
        "let input = \"shut up bitch\"",
        "let result = validate(input, locale: \"en-US\")",
        "",
        "if !result.isValid {",
        "    let violations = result.found.map { $0.word }.joined(separator: \", \")",
        "    print(\"Form validation failed! Found: [\\(violations)]\")",
        "    print(\"Max severity: \\(result.maxSeverity)\")",
        "} else {",
        "    print(\"Text is valid and ready to save to the server\")",
        "}",
      ].join('\n')
    },
    cli: {
      label: 'CLI Terminal',
      filename: 'Terminal',
      cmd: 'brew install qalvinahmad/tap/prohibited-word',
      code: [
        "# 1. Check text directly via arguments:",
        "prohibited-word --locale en-US \"shut up bitch\"",
        "",
        "# 2. Check text via pipe / stdin (e.g. for a Git commit-hook):",
        "echo \"hello good morning\" | prohibited-word",
        "",
        "# 3. Enable detector layers (PII, scam, sensitive):",
        "prohibited-word --detectors pii --locale en-US \"call +14155552671\""
      ].join('\n')
    }
  };

  var PRESETS = [
    { label: 'Basic EN', text: 'shut up bitch', locale: 'en-US', dets: ['profanity'] },
    { label: 'Leet evasion', text: 'you are sh1t', locale: 'en-US', dets: ['profanity'] },
    { label: 'Separator evasion', text: 'f.u.c.k you', locale: 'en-US', dets: ['profanity'] },
    { label: 'Clean', text: 'hello how are you, good morning', locale: 'en-US', dets: ['profanity'] },
    { label: 'Scunthorpe', text: 'Scunthorpe', locale: 'en-US', dets: ['profanity'] },
    { label: 'Thumbs-up AU (rude)', text: 'good job 👍', locale: 'en-AU', dets: ['profanity'] },
    { label: 'Thumbs-up US (friendly)', text: 'good job 👍', locale: 'en-US', dets: ['profanity'] },
    { label: 'Spanish (es)', text: 'eres un idiota', locale: 'es', dets: ['profanity'] },
    { label: 'Phone number (PII)', text: 'call +14155552671 now', locale: 'en-US', dets: ['pii'] },
    { label: 'Transfer scam', text: 'transfer directly to this account', locale: 'en-US', dets: ['scam'] },
    { label: 'Self-harm', text: 'i want to kill myself', locale: 'en-US', dets: ['sensitive'] },
    { label: 'Gambling spam', text: 'claim your online casino bonus', locale: 'en-US', dets: ['sensitive'] }
  ];

  var LOCALES = [
    { code: '', label: 'Auto (All 130 languages)' },
    { code: 'en-US', label: 'en-US (English - US)' },
    { code: 'en-AU', label: 'en-AU (English - Australia)' },
    { code: 'en-GB', label: 'en-GB (English - UK)' },
    { code: 'es', label: 'es (Spanish)' },
    { code: 'ar-SA', label: 'ar-SA (Arabic - Saudi Arabia)' },
    { code: 'ms-MY', label: 'ms-MY (Malay - Malaysia)' },
    { code: 'nl-NL', label: 'nl-NL (Dutch)' },
    { code: 'pt-BR', label: 'pt-BR (Portuguese - Brazil)' },
    { code: 'es-MX', label: 'es-MX (Spanish - Mexico)' },
    { code: 'fr-FR', label: 'fr-FR (French)' },
    { code: 'zh-CN', label: 'zh-CN (Chinese - China)' },
    { code: 'ja-JP', label: 'ja-JP (Japanese)' },
    { code: 'ko-KR', label: 'ko-KR (Korean)' },
    { code: 'de-DE', label: 'de-DE (German)' },
    { code: 'ru-RU', label: 'ru-RU (Russian)' }
  ];

  function el(id) { return document.getElementById(id); }

  function copyText(text, btn, successLabel) {
    var oldText = btn.innerHTML;
    function done() {
      btn.innerHTML = successLabel || '✓ Copied!';
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
      copyText(code.textContent, el('copy-code-btn'), '<span>✓ Copied!</span>');
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
      copyText(txt, el('copy-clean-btn'), '<span>✓ Text copied!</span>');
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
      headingEl.textContent = 'Violation detected (Flagged)';
      subtextEl.textContent = 'The text contains blocked prohibited words, gestures, or content.';
    } else if (r.needsReview) {
      banner.classList.add('status-review');
      iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      headingEl.textContent = 'Needs Review';
      subtextEl.textContent = 'The text contains potentially sensitive or taboo words/symbols.';
    } else if (r.needsHelp) {
      banner.classList.add('status-help');
      iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      headingEl.textContent = 'Needs Help';
      subtextEl.textContent = 'The text shows sensitive indications — consider a supportive response.';
    } else {
      banner.classList.add('status-clean');
      iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
      headingEl.textContent = 'Passed Validation (Clean)';
      subtextEl.textContent = 'Clean text. No prohibited words, taboo gestures, or PII detected.';
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
      el('violations-count').textContent = r.found.length + ' findings';

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
          note = 'Taboo gesture/emoji in the selected region';
        } else if (f.detector === 'pii') {
          note = 'Personal data (PII): ' + f.type;
        } else if (f.detector === 'scam') {
          note = 'Scam pattern: ' + f.type;
        } else {
          note = 'Prohibited word (' + (f.category || 'profanity') + ')';
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
    el('stat-words').textContent = total.toLocaleString('en-US');
    el('stat-regions').textContent = Object.keys(db.regions || {}).length;
    el('stat-emoji').textContent = Object.keys(db.emoji || {}).length;

    el('maturity-note').textContent = 'Supporting ' + langs.length + ' languages: ' + verified + ' Tier 1 Verified, ' + regional + ' Tier 2 Regional, and ' + starter + ' Tier 3 Starter.';
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

  var WORDS_DB = null;
  var WORDS_PAGE = 0;
  var WORDS_PER_PAGE = 100;
  var MATURITY_CONF = { curated: 0.7, regional: 0.6, starter: 0.4, verified: 0.95 };

  function wordConf(lang, e) {
    if (e.conf) return e.conf;
    return MATURITY_CONF[(WORDS_DB.langs[lang] || {}).maturity] || 0.5;
  }

  function wordEntries(code) {
    var spec = (WORDS_DB.langs || {})[code] || {};
    var out = (spec.words || []).map(function (e) {
      return { w: e.w, c: e.c || 'profanity', s: e.s || 2, conf: wordConf(code, e), own: true };
    });
    if (el('word-parent').checked && spec.parent && WORDS_DB.langs[spec.parent]) {
      var seen = {};
      out.forEach(function (e) { seen[String(e.w).toLowerCase()] = true; });
      (WORDS_DB.langs[spec.parent].words || []).forEach(function (e) {
        if (!seen[String(e.w).toLowerCase()]) {
          out.push({ w: e.w, c: e.c || 'profanity', s: e.s || 2, conf: wordConf(spec.parent, e), own: false });
        }
      });
    }
    var q = el('word-search').value.trim().toLowerCase();
    if (q) out = out.filter(function (e) { return String(e.w).toLowerCase().indexOf(q) >= 0; });
    return out;
  }

  function renderWords() {
    var code = el('word-lang').value;
    var spec = (WORDS_DB.langs || {})[code] || {};
    var all = wordEntries(code);
    var pages = Math.max(1, Math.ceil(all.length / WORDS_PER_PAGE));
    if (WORDS_PAGE >= pages) WORDS_PAGE = pages - 1;
    var rows = all.slice(WORDS_PAGE * WORDS_PER_PAGE, WORDS_PAGE * WORDS_PER_PAGE + WORDS_PER_PAGE);
    var html = '';
    rows.forEach(function (e, i) {
      html += '<tr><td>' + (WORDS_PAGE * WORDS_PER_PAGE + i + 1) + '</td><td><b>'
        + escapeHtml(e.w) + '</b>' + (e.own ? '' : ' <span class="note">(base)</span>') + '</td><td>'
        + escapeHtml(e.c) + '</td><td>' + e.s + '</td><td>' + e.conf + '</td></tr>';
    });
    el('word-rows').innerHTML = html || '<tr><td colspan="5" class="note">No words match.</td></tr>';
    el('word-page').textContent = 'Page ' + (WORDS_PAGE + 1) + ' of ' + pages + ' · ' + all.length + ' words';
    var parentTxt = spec.parent ? ' · parent: ' + spec.parent : '';
    el('word-meta').textContent = (spec.name || code) + ' (' + code + ') · ' + (spec.maturity || '?')
      + ' · source: ' + (spec.source || '?') + parentTxt;
    try {
      history.replaceState(null, '', '#words-' + code);
    } catch (err) {}
  }

  function initWords(db) {
    WORDS_DB = db;
    var sel = el('word-lang');
    Object.keys(db.langs || {}).sort(function (a, b) {
      return ((db.langs[a] || {}).order || 999) - ((db.langs[b] || {}).order || 999);
    }).forEach(function (code) {
      var spec = db.langs[code] || {};
      var o = document.createElement('option');
      o.value = code;
      o.textContent = (spec.name || code) + ' (' + code + ') — ' + (spec.words || []).length + ' words';
      sel.appendChild(o);
    });
    var m = (location.hash || '').match(/^#words-([a-z0-9\-]+)/i) || (location.search || '').match(/[?&]lang=([a-z0-9\-]+)/i);
    if (m && db.langs && db.langs[m[1].toLowerCase()]) sel.value = m[1].toLowerCase();
    if (!sel.value) sel.value = 'jv';
    ['word-lang', 'word-search', 'word-parent'].forEach(function (id) {
      el(id).addEventListener('input', function () { WORDS_PAGE = 0; renderWords(); });
      el(id).addEventListener('change', function () { WORDS_PAGE = 0; renderWords(); });
    });
    el('word-prev').addEventListener('click', function () { if (WORDS_PAGE > 0) { WORDS_PAGE--; renderWords(); } });
    el('word-next').addEventListener('click', function () { WORDS_PAGE++; renderWords(); });
    el('copy-word-link').addEventListener('click', function () {
      copyText(location.origin + location.pathname + '#words-' + sel.value, el('copy-word-link'), 'Copied!');
    });
    renderWords();
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
      initWords(db);
    }).catch(function (err) {
      console.error('Failed to load dataset:', err);
      el('empty-state').innerHTML = '<div class="empty-state-title" style="color: #ef4444;">Failed to load dataset: ' + escapeHtml(err.message) + '</div>';
    });
  });
})();
