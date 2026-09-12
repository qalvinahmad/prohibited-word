def test_exact():
    from prohibited_word import contains
    assert contains("kamu anjing") is True

def test_leet():
    from prohibited_word import contains
    assert contains("kamu 4nj1ng") is True

def test_separator():
    from prohibited_word import contains
    assert contains("a.n.j.i.n.g") is True

def test_clean():
    from prohibited_word import contains
    assert contains("halo apa kabar") is False

def test_scunthorpe():
    from prohibited_word import contains
    assert contains("banget") is False

def test_locale124():
    from prohibited_word import contains
    assert contains("kamu jancok", locale="jv") is True

def test_regional_remove():
    from prohibited_word import contains
    assert contains("anak yatim piatu", locale="id-ID") is False
    assert contains("anak yatim piatu", lang=["id"]) is True

def test_emoji_region():
    from prohibited_word import contains
    assert contains("good 👍", locale="en-AU") is True
    assert contains("good 👍", locale="en-US") is False

def test_severity():
    from prohibited_word import validate
    assert validate("kamu anjing", min_severity=3)["is_valid"] is True
    assert validate("kamu anjing")["max_severity"] == 2

def test_symbol_standalone():
    from prohibited_word import validate, contains
    r = validate("floor 13", locale="en-US")
    assert r["is_valid"] is True
    assert r["needs_review"] is True
    assert r["found"][0]["type"] == "symbol"
    assert contains("room 136", locale="en-US") is False

def test_pii_opt_in():
    from prohibited_word import validate, contains
    assert contains("hubungi 081234567890", detectors=["pii"]) is True
    assert contains("hubungi 081234567890") is False
    r = validate("email saya j o h n [at] gmail [dot] com", detectors=["pii"])
    assert r["found"][0]["type"] == "email"
    assert validate("NIK 3174051209900001", detectors=["pii"])["found"][0]["type"] == "nik"

def test_scam_layer():
    from prohibited_word import validate, contains
    r = validate("transfer langsung ke rekening ini ya", detectors=["scam"])
    assert r["is_valid"] is False
    assert r["found"][0]["type"] == "direct_transfer"

def test_sensitive_layer():
    from prohibited_word import validate, contains
    r = validate("aku mau bunuh diri", detectors=["sensitive"])
    assert r["needs_help"] is True
    assert r["found"][0]["action"] == "help"
    assert contains("main slot gacor", detectors=["sensitive"]) is True
    assert validate("chat wa aja ya", detectors=["sensitive"])["needs_review"] is True

def test_confidence():
    from prohibited_word import validate
    assert validate("kamu anjing", min_confidence=0.8)["is_valid"] is True
    assert validate("kamu anjing")["found"][0]["confidence"] == 0.7
