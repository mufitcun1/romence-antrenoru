/* ============================= ALIŞTIRMA ÜRETİCİLERİ ============================= */
function themeVocab(theme){ return VOCAB.filter(v=>v.length<5 || true); }

function exerciseForVocab(v){
  const [theme,themeLabel,ro,tr,id] = v;
  const entry = getEntry(id);
  const typed = entry.box>=3;
  const dir = Math.random()<0.5 ? "ro2tr" : "tr2ro";
  if(!typed){
    const distractorsPool = VOCAB.filter(x=>x[0]===theme && x[4]!==id);
    const pool2 = distractorsPool.length>=3? distractorsPool : VOCAB.filter(x=>x[4]!==id);
    const distractors = shuffle(pool2).slice(0,3);
    if(dir==="ro2tr"){
      const opts = shuffle([tr, ...distractors.map(d=>d[3])]);
      return {id, kind:"mc", prompt:`"${ro}" ne demek?`, hint:themeLabel, catKey:theme, options:opts, answer:tr, roDisplay:ro};
    } else {
      const opts = shuffle([ro, ...distractors.map(d=>d[2])]);
      return {id, kind:"mc", prompt:`"${tr}" Romence nedir?`, hint:themeLabel, catKey:theme, options:opts, answer:ro, roDisplay:ro};
    }
  } else {
    if(dir==="ro2tr") return {id, kind:"type", prompt:`"${ro}" ne demek? (Türkçe yaz)`, hint:themeLabel, catKey:theme, answer:tr, needsRoChars:false, roDisplay:ro};
    return {id, kind:"type", prompt:`"${tr}" kelimesini Romence yaz.`, hint:themeLabel, catKey:theme, answer:ro, needsRoChars:true, roDisplay:ro};
  }
}

function exerciseForListening(v){
  const [theme,themeLabel,ro,tr,id] = v;
  const entry = getEntry(id);
  const typed = entry.box>=3;
  if(!typed){
    const distractorsPool = VOCAB.filter(x=>x[0]===theme && x[4]!==id);
    const pool2 = distractorsPool.length>=3? distractorsPool : VOCAB.filter(x=>x[4]!==id);
    const distractors = shuffle(pool2).slice(0,3);
    const opts = shuffle([tr, ...distractors.map(d=>d[3])]);
    return {id, kind:"mc", listen:true, audioText:ro, prompt:`Dinlediğin kelimenin Türkçe anlamı nedir?`, hint:themeLabel, catKey:theme, options:opts, answer:tr, roDisplay:ro};
  }
  return {id, kind:"type", listen:true, audioText:ro, prompt:`Duyduğun kelimeyi Romence yaz.`, hint:themeLabel, catKey:theme, answer:ro, needsRoChars:true, roDisplay:ro};
}

/* Bazı fiiller Romencede kişilere değil, nesnelere/duruma uygulanır (impersonal) —
   örn. "a costa" (fiyatı olmak) günlük dilde neredeyse yalnızca 3. tekil/çoğul
   şahısla ("el/ea costă", "ei/ele costă") kullanılır; "voi costați" gibi 1./2. şahıs
   çekimleri gramer olarak doğru olsa da gerçek hayatta hiç kurulmaz ve garip kaçar.
   Bu yüzden bu fiillerde çekim alıştırmasını yalnızca 3. şahıs formlarıyla sınırlıyoruz. */
const IMPERSONAL_VERBS = new Set(["a costa"]);
const IMPERSONAL_PERSONS = [2,5]; // el/ea, ei/ele

function exerciseForVerb(v){
  const [ro,tr,forms,participiu,grup,id] = v;
  const entry = getEntry(id);
  const mode = entry.box>=2 ? pick(["present","past"]) : "present";
  if(mode==="past"){
    return {id, kind:"type", prompt:`"${ro}" (${tr}) — geçmiş zaman ortacını yaz (a avea + ___).`, hint:grup, answer:participiu, needsRoChars:true, roDisplay:participiu};
  }
  const personPool = IMPERSONAL_VERBS.has(ro) ? IMPERSONAL_PERSONS : [0,1,2,3,4,5];
  const p = pick(personPool);
  return {id, kind:"type", prompt:`"${ro}" (${tr}) — "${PERSON_LABEL[p]}" için şimdiki zaman çekimini yaz.`, hint:grup, answer:forms[p], needsRoChars:true, roDisplay:forms[p]};
}

function exerciseForGrammar(topic){
  if(topic==="prep"){
    const [sent,ans,tr,distr] = pick(PREP_ITEMS);
    const opts = shuffle([ans,...distr]);
    return {id:"gram_prep", kind:"mc", prompt:sent.replace("___","______"), hint:"Doğru edatı seç", cue:tr, options:opts, answer:ans, roDisplay:sent.replace("___",ans)};
  }
  if(topic==="neg"){
    const [aff,neg] = pick(NEG_ITEMS);
    return {id:"gram_neg", kind:"type", prompt:`Olumsuz yap: "${aff}"`, hint:"NU ekle", answer:neg, needsRoChars:true, roDisplay:neg};
  }
  if(topic==="qword"){
    const [sent,ans,tr,distr] = pick(QWORD_ITEMS);
    const opts = shuffle([ans,...distr]);
    return {id:"gram_qword", kind:"mc", prompt:sent.replace("___","______"), hint:"Doğru soru kelimesini seç", cue:tr, options:opts, answer:ans, roDisplay:sent.replace("___",ans)};
  }
  if(topic==="adj"){
    const [isim,cins,eril,disil] = pick(ADJ_ITEMS);
    const ans = cins==="eril"?eril:disil;
    const wrong = cins==="eril"?disil:eril;
    const opts = shuffle([ans,wrong]);
    return {id:"gram_adj", kind:"mc", prompt:`"${isim}" (${cins}) — doğru sıfat formu hangisi?`, hint:"Sıfat-isim cinsiyet uyumu", options:opts, answer:ans, roDisplay:ans};
  }
  if(topic==="art"){
    const [isim,cins,dogru] = pick(ART_ITEMS);
    return {id:"gram_art", kind:"type", prompt:`"${isim}" (${cins}) — belirtili halini yaz.`, hint:"Belirli artikel eki", answer:dogru, needsRoChars:true, roDisplay:dogru};
  }
  if(topic==="num"){
    const [digit,ans] = pick(NUM_ITEMS);
    return {id:"gram_num", kind:"type", prompt:`"${digit}" sayısını Romence yaz.`, hint:"Sayılar", answer:ans, needsRoChars:true, roDisplay:ans};
  }
}
const GRAMMAR_TOPICS = ["prep","neg","qword","adj","art","num"];
