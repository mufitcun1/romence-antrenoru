/* ============================= CÜMLE KURMA — SABİT VE DİNAMİK ÜRETİM =============================
   Kullanıcı isteğiyle: hem gerçek ders cümlelerinden oluşan, sesi önceden
   üretilmiş sabit bir havuz (FIXED_SENTENCES — yukarıdaki), hem de
   sınırsız çeşitlilikte yeni cümle kurabilen dinamik bir üretici var.
   Dinamik cümlelerin sesi önceden üretilemez (kombinasyon sayısı çok
   büyük) — bu yüzden dinamik cümlelerde "listen" modu YOK, sadece
   kelime sırlama ve çeviri var. Çeviriler, dilbilgisel doğruluğu garanti
   etmek için HER ZAMAN elle yazılmış, kişiye göre tam Türkçe cümle
   olarak saklanıyor (otomatik/algoritmik Türkçe çekim ÜRETİLMİYOR —
   Türkçe iyelik/kip ekleri sesli uyuma bağlı olduğu için otomatik üretim
   riskli olurdu). */
const SENT_SUBJECTS = [
  {ro:"Eu", idx:0}, {ro:"Tu", idx:1}, {ro:"El", idx:2}, {ro:"Ea", idx:2},
  {ro:"Noi", idx:3}, {ro:"Voi", idx:4}, {ro:"Ei", idx:5}, {ro:"Ele", idx:5},
];
// [eu, tu, el/ea, noi, voi, ei/ele] sırasıyla — a fi (durum/yer) kalıbı
const FI_COMPLEMENTS = [
  {ro:"acasă", trBare:"evde", tr:["evdeyim","evdesin","evde","evdeyiz","evdesiniz","evdeler"]},
  {ro:"aici", trBare:"burada", tr:["buradayım","buradasın","burada","buradayız","buradasınız","buradalar"]},
  {ro:"acolo", trBare:"orada", tr:["oradayım","oradasın","orada","oradayız","oradasınız","oradalar"]},
  {ro:"la curs", trBare:"kursta", tr:["kurstayım","kurstasın","kursta","kurstayız","kurstasınız","kurstalar"]},
  {ro:"la telefon", trBare:"telefonda", tr:["telefondayım","telefondasın","telefonda","telefondayız","telefondasınız","telefondalar"]},
  {ro:"la spital", trBare:"hastanede", tr:["hastanedeyim","hastanedesin","hastanede","hastanedeyiz","hastanedesiniz","hastanedeler"]},
  {ro:"în parc", trBare:"parkta", tr:["parktayım","parktasın","parkta","parktayız","parktasınız","parktalar"]},
  {ro:"în România", trBare:"Romanya'da", tr:["Romanya'dayım","Romanya'dasın","Romanya'da","Romanya'dayız","Romanya'dasınız","Romanya'dalar"]},
  {ro:"în Turcia", trBare:"Türkiye'de", tr:["Türkiye'deyim","Türkiye'desin","Türkiye'de","Türkiye'deyiz","Türkiye'desiniz","Türkiye'deler"]},
  {ro:"aproape", trBare:"yakında", tr:["yakındayım","yakındasın","yakında","yakındayız","yakındasınız","yakındalar"]},
  {ro:"departe", trBare:"uzakta", tr:["uzaktayım","uzaktasın","uzakta","uzaktayız","uzaktasınız","uzaktalar"]},
];
// a avea (sahiplik) kalıbı — tr dizisi her kişi için TAM cümle (özne dahil)
const AVEA_OBJECTS = [
  {ro:"timp", tr:["Benim zamanım var","Senin zamanın var","Onun zamanı var","Bizim zamanımız var","Sizin zamanınız var","Onların zamanı var"]},
  {ro:"bani", tr:["Benim param var","Senin paran var","Onun parası var","Bizim paramız var","Sizin paranız var","Onların parası var"]},
  {ro:"cafea", tr:["Benim kahvem var","Senin kahven var","Onun kahvesi var","Bizim kahvemiz var","Sizin kahveniz var","Onların kahvesi var"]},
  {ro:"mașină", tr:["Benim arabam var","Senin araban var","Onun arabası var","Bizim arabamız var","Sizin arabanız var","Onların arabası var"]},
  {ro:"casă", tr:["Benim evim var","Senin evin var","Onun evi var","Bizim evimiz var","Sizin eviniz var","Onların evi var"]},
];
// "değil" kişi ekleri sabittir (isme göre değişmez) — a fi olumsuzlamasında kullanılır
const DEGIL_FORMS = ["değilim","değilsin","değil","değiliz","değilsiniz","değiller"];

function genDynamicSentence(){
  const useAvea = Math.random()<0.4;
  const subj = pick(SENT_SUBJECTS);
  const neg = Math.random()<0.35;
  const fiVerb = VERBS.find(v=>v[0]==="a fi");
  const aveaVerb = VERBS.find(v=>v[0]==="a avea");
  if(!useAvea){
    const c = pick(FI_COMPLEMENTS);
    const verbForm = fiVerb[2][subj.idx];
    const ro = (neg? `${subj.ro} nu ${verbForm} ${c.ro}.` : `${subj.ro} ${verbForm} ${c.ro}.`);
    let tr = neg ? `${c.trBare} ${DEGIL_FORMS[subj.idx]}` : c.tr[subj.idx];
    /* Türkçede eu/tu/noi/voi/ei-ele kişi ekleri öznesiz de anlaşılır
       (buradayım/kurstasın/evdeler gibi), ama el/ea (3. tekil şahıs) bu
       kalıpta hiç ek almıyor (Romence "este" de öyle) — "Orada." tek
       başına özne belirsiz kalıyor. Açıklık için "O " ekliyoruz. */
    if(subj.idx===2) tr = "O " + tr;
    tr = tr.charAt(0).toUpperCase()+tr.slice(1)+".";
    return {ro, tr};
  } else {
    const o = pick(AVEA_OBJECTS);
    const verbForm = aveaVerb[2][subj.idx];
    const ro = (neg? `${subj.ro} nu ${verbForm} ${o.ro}.` : `${subj.ro} ${verbForm} ${o.ro}.`);
    let tr = o.tr[subj.idx];
    if(neg) tr = tr.replace(" var"," yok");
    return {ro, tr: tr+"."};
  }
}

function exerciseForSentence(item){
  // item: {ro, tr, id} (sabit havuzdan) ya da {ro, tr} (dinamik, id yok)
  const box = item.id ? getEntry(item.id).box : 0;
  let mode;
  if(!item.id){
    mode = pick(["order","translate"]); // dinamik cümlede ses garantisi yok, dinleme sunulmuyor
  } else if(box<2){
    mode = "order";
  } else if(box<4){
    mode = pick(["order","translate"]);
  } else {
    mode = pick(["translate","dictation"]);
  }
  if(mode==="dictation"){
    return {id:item.id, kind:"type", listen:true, audioText:item.ro, prompt:"Cümleyi dinle ve yaz.", hint:"Cümle — Dinleme", answer:item.ro, needsRoChars:true, roDisplay:item.ro};
  }
  if(mode==="translate"){
    const dir = Math.random()<0.5 ? "ro2tr" : "tr2ro";
    if(dir==="ro2tr") return {id:item.id, kind:"type", prompt:`"${item.ro}" ne demek? (Türkçe yaz)`, hint:"Cümle — Çeviri", answer:item.tr, needsRoChars:false, roDisplay:item.ro};
    return {id:item.id, kind:"type", prompt:`"${item.tr}" cümlesini Romence yaz.`, hint:"Cümle — Çeviri", answer:item.ro, needsRoChars:true, roDisplay:item.ro};
  }
  const cleanWords = item.ro.replace(/[.!?]+$/,'').split(' ').filter(Boolean);
  /* cue: hedef cümlenin Türkçesi — küçük pill yerine ayrı, büyük ve okunaklı
     bir kutuda gösteriliyor (bkz. .cuebox), çünkü tüm cümleyi anlaşılır
     boyutta görmek gerekiyor, tek kelimelik ipucu değil bu. */
  return {id:item.id, kind:"order", prompt:"Kelimeleri doğru sıraya diz.", hint:"Cümle — Kelime Sırası", cue:item.tr, words: shuffle(cleanWords.slice()), answer: cleanWords.join(' '), roDisplay:item.ro};
}

