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
    from prohibited_word import contains
    assert contains("floor 13", locale="en-US") is True
    assert contains("room 136", locale="en-US") is False
    assert contains("nomor 4", locale="zh-CN") is True
    assert contains("nomor 4", locale="id-ID") is False

def test_confidence():
    from prohibited_word import validate
    assert validate("kamu anjing", min_confidence=0.8)["is_valid"] is True
    assert validate("kamu anjing")["found"][0]["confidence"] == 0.7
