/* ============================= ALIŞTIRMA ÜRETİCİLERİ ============================= */
function themeVocab(theme){ return VOCAB.filter(v=>v.length<5 || true); }

/* ÇELDİRİCİ SEÇİMİ
   İki eski sorun vardı:
   1) Çeldiriciler sözcük türüne bakmadan seçiliyordu; "şehir mekanları" gibi
      isim+fiil karışık temalarda üç isim arasına tek fiil düşünce (hastane /
      satın almak / menü / banka) cevap kelimeyi hiç bilmeden bulunabiliyordu.
   2) Dört kelimelik temalarda (bağlaçlar, basın/medya, yer zarfları) tema
      havuzu tam üç çeldirici veriyordu; şıklar HER ZAMAN aynı dört kelime
      oluyordu, öğrenci kelimeyi değil şık dizilimini ezberliyordu.
   Ayrıca aynı anlama gelen ikinci bir kayıt (aynı Romence ya da aynı Türkçe)
   çeldirici olarak seçilemez — yoksa iki şık birden doğru olurdu. */
const _fiilMi = ro => /^a\s/.test(String(ro||"").trim());
function celdiriciler(havuz, satir, adet){
  const [theme,,ro,tr,id] = satir;
  const uygun = x => x[4]!==id && norm(x[2])!==norm(ro) && norm(x[3])!==norm(tr)
                     && _fiilMi(x[2])===_fiilMi(ro);
  const hedef = adet + 3; // en az bu kadar aday olsun ki şıklar her turda değişsin
  let pool = havuz.filter(x=> x[0]===theme && uygun(x));
  if(pool.length < hedef){
    const disari = havuz.filter(x=> x[0]!==theme && uygun(x));
    pool = pool.concat(shuffle(disari).slice(0, hedef-pool.length));
  }
  if(pool.length < adet) pool = havuz.filter(x=> x[4]!==id);
  return shuffle(pool).slice(0, adet);
}

function exerciseForVocab(v){
  const [theme,themeLabel,ro,tr,id] = v;
  const entry = getEntry(id);
  const typed = entry.box>=3;
  const dir = Math.random()<0.5 ? "ro2tr" : "tr2ro";
  if(!typed){
    const distractors = celdiriciler(VOCAB, v, 3);
    if(dir==="ro2tr"){
      const opts = shuffle([tr, ...distractors.map(d=>d[3])]);
      return {id, kind:"mc", prompt:`"${ro}" ne demek?`, hint:themeLabel, catKey:theme, options:opts, answer:tr, roDisplay:ro};
    } else {
      const opts = shuffle([ro, ...distractors.map(d=>d[2])]);
      return {id, kind:"mc", prompt:`"${tr}" Romence nedir?`, hint:themeLabel, catKey:theme, options:opts, answer:ro, roDisplay:ro};
    }
  } else {
    if(dir==="ro2tr") return {id, kind:"type", prompt:`"${ro}" ne demek? (Türkçe yaz)`, hint:themeLabel, catKey:theme, answer:tr, answerAlts:anlamSecenekleri(tr), needsRoChars:false, roDisplay:ro};
    return {id, kind:"type", prompt:`"${tr}" kelimesini Romence yaz.`, hint:themeLabel, catKey:theme, answer:ro, needsRoChars:true, roDisplay:ro};
  }
}

function exerciseForListening(v){
  const [theme,themeLabel,ro,tr,id] = v;
  const entry = getEntry(id);
  const typed = entry.box>=3;
  if(!typed){
    const distractors = celdiriciler(VOCAB, v, 3);
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

/* GRAMER MADDE SEÇİMİ
   Eskiden her konu TEK id taşıyordu (gram_adj, gram_prep…): 10 farklı soru
   tekrar motoru tarafından tek öğe sanılıyordu. Sonuç: hangi maddede
   zorlandığın izlenemiyordu ve maddeler rastgele (yerine koymalı) seçildiği
   için aynı soru tek turda iki kez çıkabiliyordu.
   Artık her madde kendi id'sini alıyor ve seçim kelime/fiil havuzlarındaki
   gibi ustalık ağırlıklı yapılıyor — bilinmeyen madde daha sık gelir. */
function gramSec(list, topic, uygunMu){
  const idx = list.map((_,i)=>i).filter(i=> !uygunMu || uygunMu(list[i]));
  const ids = idx.map(i=> "gram_"+topic+"_"+i);
  /* STATE yalnızca oturum açıldıktan sonra var; ustalık ağırlıklı seçim ona
     bakıyor. Oturum dışında (önizleme/erken çağrı) çökmek yerine düz rastgele
     seçime düşüyoruz — eski davranışın aynısı. */
  const agirlikliSecilebilir = typeof weightedSample === "function" && typeof STATE !== "undefined" && STATE && STATE.mastery;
  const sec = (agirlikliSecilebilir ? weightedSample(ids,1)[0] : null) || pick(ids);
  return [list[idx[ids.indexOf(sec)]], sec];
}

function exerciseForGrammar(topic){
  if(topic==="prep"){
    const [it,id] = gramSec(PREP_ITEMS,"prep");
    const [sent,ans,tr,distr] = it;
    const opts = shuffle([ans,...distr]);
    return {id, kind:"mc", prompt:sent.replace("___","______"), hint:"Doğru edatı seç", cue:tr, options:opts, answer:ans, roDisplay:sent.replace("___",ans)};
  }
  if(topic==="neg"){
    const [it,id] = gramSec(NEG_ITEMS,"neg");
    const [aff,neg] = it;
    return {id, kind:"type", prompt:`Olumsuz yap: "${aff}"`, hint:"NU ekle", answer:neg, needsRoChars:true, roDisplay:neg};
  }
  if(topic==="qword"){
    const [it,id] = gramSec(QWORD_ITEMS,"qword");
    const [sent,ans,tr,distr] = it;
    const opts = shuffle([ans,...distr]);
    return {id, kind:"mc", prompt:sent.replace("___","______"), hint:"Doğru soru kelimesini seç", cue:tr, options:opts, answer:ans, roDisplay:sent.replace("___",ans)};
  }
  if(topic==="adj"){
    /* Eril VE nötr isimler tekilde eril biçimi alır; yalnızca dişil isim dişil
       biçimi ister. (Eskiden "cins==='eril' ? eril : disil" yazıyordu ve veri
       de ters girilmiş olduğu için dişil isimlerde ERİL biçim doğru cevap
       sayılıyordu — uygulama "mașină nou" öğretiyordu.)
       İki biçimi aynı olan sıfatlar (mare/mare) dışarıda bırakılır: iki şık
       birebir aynı çıkar ve sorunun doğru cevabı ayırt edilemez. */
    const [it,id] = gramSec(ADJ_ITEMS,"adj", r=> norm(r[2])!==norm(r[3]));
    const [isim,cins,eril,disil] = it;
    const ans   = cins==="dişil" ? disil : eril;
    const wrong = cins==="dişil" ? eril  : disil;
    /* Cinsiyet artık SORUDA yazmıyor. Romencede asıl zor iş ismin cinsiyetini
       bilmek; "(dişil)" yazmak sorunun ölçtüğü şeyi hediye ediyordu, geriye
       mekanik ek getirmek kalıyordu. Bilgi cevaptan SONRA veriliyor — aynı
       ilke B1 gramer ipuçlarında da uygulanmıştı. */
    return {id, kind:"mc", prompt:`"${isim}" — doğru sıfat formu hangisi?`,
      hint:"Sıfat-isim cinsiyet uyumu", options:shuffle([ans,wrong]), answer:ans,
      roDisplay:`${isim} ${ans}`,
      aciklama: `"${isim}" ${cins} bir isim.` + (cins==="nötr"
        ? " Nötr isimler tekilde eril gibi çekilir (un parc frumos), çoğulda dişil gibi (două parcuri frumoase)."
        : "")};
  }
  if(topic==="art"){
    const [it,id] = gramSec(ART_ITEMS,"art");
    const [isim,cins,dogru] = it;
    return {id, kind:"type", prompt:`"${isim}" — belirtili halini yaz.`, hint:"Belirli artikel eki", answer:dogru, needsRoChars:true, roDisplay:dogru,
      aciklama: `"${isim}" ${cins} bir isim.` + (cins==="nötr" ? " Nötr isimler tekilde eril gibi çekilir: -ul eki alır." : "")};
  }
  if(topic==="num"){
    const [it,id] = gramSec(NUM_ITEMS,"num");
    const [digit,ans] = it;
    return {id, kind:"type", prompt:`"${digit}" sayısını Romence yaz.`, hint:"Sayılar", answer:ans, needsRoChars:true, roDisplay:ans};
  }
}
const GRAMMAR_TOPICS = ["prep","neg","qword","adj","art","num"];
