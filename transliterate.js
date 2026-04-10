(function attachTransliterator(globalScope) {
  const MANCHU_MAP = new Map([
    ["\u1820", "a"],
    ["\u185D", "e"],
    ["\u1873", "i"],
    ["\u185F", "y"],
    ["\u1823", "o"],
    ["\u1860", "u"],
    ["\u1861", "v"],
    ["\u1828", "n"],
    ["\u1829", "ng"],
    ["\u1874", "k"],
    ["\u1864", "g"],
    ["\u1865", "h"],
    ["\u182A", "b"],
    ["\u1866", "p"],
    ["\u1830", "s"],
    ["\u1867", "x"],
    ["\u1868", "t"],
    ["\u1869", "d"],
    ["\u182F", "l"],
    ["\u182E", "m"],
    ["\u1834", "q"],
    ["\u1835", "j"],
    ["\u1836", "y"],
    ["\u1875", "r"],
    ["\u1876", "f"],
    ["\u1838", "w"],
    ["\u183A", "k"],
    ["\u186C", "g"],
    ["\u186D", "h"],
    ["\u186E", "c"],
    ["\u186F", "z"],
    ["\u1870", "r"],
    ["\u1871", "q"],
    ["\u1877", "j"]
  ]);

  const STRIP_CHARS = /[\u180B-\u180E\u200C\u200D\uFE00-\uFE0F]/g;
  const MANCHU_SCRIPT_RE = /[\u1800-\u18AF]/;
  const IRREGULAR_IMPERATIVES = new Map([
    ["baisu", "baimbi"],
    ["gaisu", "gaimbi"],
    ["bisu", "bimbi"],
    ["oso", "ombi"],
    ["jefu", "jembi"],
    ["jio", "jimbi"],
    ["gaju", "gajimbi"],
    ["benji", "benjimbi"],
    ["benju", "benjimbi"]
  ]);
  const DIRECT_DICTIONARY_FORMS = new Set([
    "bimbi",
    "ombi",
    "jembi",
    "jimbi"
  ]);
  const VERB_RULES = [
    ["mbihe", (base) => `${base}mbi`],
    ["nggala", (base) => `${base}mbi`],
    ["nggele", (base) => `${base}mbi`],
    ["nggolo", (base) => `${base}mbi`],
    ["ralame", (base) => `${base}mbi`],
    ["relame", (base) => `${base}mbi`],
    ["rolame", (base) => `${base}mbi`],
    ["ndara", (base) => `${base}mbi`],
    ["ndere", (base) => `${base}mbi`],
    ["ndoro", (base) => `${base}mbi`],
    ["habi", (base) => `${base}mbi`],
    ["hebi", (base) => `${base}mbi`],
    ["hobi", (base) => `${base}mbi`],
    ["kabi", (base) => `${base}mbi`],
    ["kebi", (base) => `${base}mbi`],
    ["kobi", (base) => `${base}mbi`],
    ["kini", (base) => `${base}mbi`],
    ["cina", (base) => `${base}mbi`],
    ["rahv", (base) => `${base}mbi`],
    ["rahu", (base) => `${base}mbi`],
    ["rakv", (base) => `${base}mbi`],
    ["raku", (base) => `${base}mbi`],
    ["hakv", (base) => `${base}mbi`],
    ["hekv", (base) => `${base}mbi`],
    ["hokv", (base) => `${base}mbi`],
    ["kakv", (base) => `${base}mbi`],
    ["kekv", (base) => `${base}mbi`],
    ["kokv", (base) => `${base}mbi`],
    ["haku", (base) => `${base}mbi`],
    ["heku", (base) => `${base}mbi`],
    ["hoku", (base) => `${base}mbi`],
    ["kaku", (base) => `${base}mbi`],
    ["keku", (base) => `${base}mbi`],
    ["koku", (base) => `${base}mbi`],
    ["cibe", (base) => `${base}mbi`],
    ["tala", (base) => `${base}mbi`],
    ["tele", (base) => `${base}mbi`],
    ["tolo", (base) => `${base}mbi`],
    ["ngka", (base) => `${base}mbi`],
    ["ngke", (base) => `${base}mbi`],
    ["ngko", (base) => `${base}mbi`],
    ["mbi", (base) => `${base}mbi`],
    ["mpi", (base) => `${base}mbi`],
    ["hai", (base) => `${base}mbi`],
    ["hei", (base) => `${base}mbi`],
    ["hoi", (base) => `${base}mbi`],
    ["tai", (base) => `${base}mbi`],
    ["tei", (base) => `${base}mbi`],
    ["toi", (base) => `${base}mbi`],
    ["ki", (base) => `${base}mbi`],
    ["me", (base) => `${base}mbi`],
    ["fi", (base) => `${base}mbi`],
    ["pi", (base) => `${base}mbi`],
    ["ci", (base) => `${base}mbi`],
    ["ra", (base) => `${base}mbi`],
    ["re", (base) => `${base}mbi`],
    ["ro", (base) => `${base}mbi`],
    ["ha", (base) => `${base}mbi`],
    ["he", (base) => `${base}mbi`],
    ["ho", (base) => `${base}mbi`],
    ["ka", (base) => `${base}mbi`],
    ["ke", (base) => `${base}mbi`],
    ["ko", (base) => `${base}mbi`]
  ];

  function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function normalizeLatinToDaiqing(value) {
    return value
      .toLowerCase()
      .normalize("NFC")
      .replace(/[šś]/g, "x")
      .replace(/c/g, "q")
      .replace(/[č]/g, "q")
      .replace(/[ž]/g, "j")
      .replace(/[ûūǖ]/g, "v");
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function transliterateManchu(value) {
    return Array.from(value.replace(STRIP_CHARS, ""))
      .map((char) => MANCHU_MAP.get(char) || char)
      .join("");
  }

  function createVerbDictionaryCandidates(value) {
    const normalized = normalizeLatinToDaiqing(normalizeWhitespace(value));

    if (!normalized || /\s/.test(normalized)) {
      return [];
    }

    const candidates = [];

    if (IRREGULAR_IMPERATIVES.has(normalized)) {
      candidates.push(IRREGULAR_IMPERATIVES.get(normalized));
    }

    if (DIRECT_DICTIONARY_FORMS.has(normalized) || normalized.endsWith("mbi")) {
      candidates.push(normalized);
    }

    VERB_RULES.forEach(([suffix, builder]) => {
      if (!normalized.endsWith(suffix) || normalized.length <= suffix.length) {
        return;
      }

      const base = normalized.slice(0, -suffix.length);

      if (!/[aeiouvy]/.test(base)) {
        return;
      }

      candidates.push(builder(base));
    });

    return unique(candidates.filter(Boolean));
  }

  function analyzeWord(value) {
    const normalized = normalizeLatinToDaiqing(normalizeWhitespace(value));
    const dictionaryForms = createVerbDictionaryCandidates(normalized);

    return {
      original: value,
      normalized,
      dictionaryForms,
      preferredLookup: dictionaryForms[0] || normalized,
      looksVerbLike: dictionaryForms.length > 0
    };
  }

  function normalizeSelection(value) {
    const trimmed = normalizeWhitespace((value || "").replace(STRIP_CHARS, ""));

    if (!trimmed) {
      return {
        original: "",
        normalized: "",
        detectedScript: "unknown"
      };
    }

    if (MANCHU_SCRIPT_RE.test(trimmed)) {
      const normalized = normalizeWhitespace(transliterateManchu(trimmed));
      const analysis = analyzeWord(normalized);

      return {
        original: trimmed,
        normalized,
        detectedScript: "manchu",
        dictionaryForms: analysis.dictionaryForms,
        preferredLookup: analysis.preferredLookup,
        looksVerbLike: analysis.looksVerbLike
      };
    }

    const normalized = normalizeWhitespace(normalizeLatinToDaiqing(trimmed));
    const analysis = analyzeWord(normalized);

    return {
      original: trimmed,
      normalized,
      detectedScript: "latin",
      dictionaryForms: analysis.dictionaryForms,
      preferredLookup: analysis.preferredLookup,
      looksVerbLike: analysis.looksVerbLike
    };
  }

  globalScope.ManchuTransliterator = {
    analyzeWord,
    normalizeSelection
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
