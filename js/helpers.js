/* ============================= YARDIMCI FONKSİYONLAR ============================= */
const norm = s => (s||"").toString().trim().toLowerCase()
  .replace(/ă|â/g,"a").replace(/î/g,"i").replace(/ș|ş/g,"s").replace(/ț|ţ/g,"t").replace(/[^a-z0-9 ]/g,"");
/* Klitik zamir alıştırmalarında kısa çizgi ANLAMLIDIR: "mi-o" ile "mio" aynı
   şey değil, "să-ți" ile "sati" aynı şey değil. norm() kısa çizgiyi siliyor ve
   bunu bilerek yapıyor (A1/A2'de hoşgörülü olmak istiyoruz). Bu yüzden norm()
   değiştirilmedi; yalnızca strictHyphen işaretli sorular bu sıkı sürümü kullanır. */
const normTire = s => (s||"").toString().trim().toLowerCase()
  .replace(/ă|â/g,"a").replace(/î/g,"i").replace(/ș|ş/g,"s").replace(/ț|ţ/g,"t")
  .replace(/[‐‑‒–—]/g,"-").replace(/[^a-z0-9 -]/g,"");
/* Bir Türkçe karşılığın kabul edilebilir yazımları.
   "amca/dayı" ya da "ocak (aragaz)" gibi çok karşılıklı gloss'larda yazarak
   cevap verilirken eskiden yalnızca tam dize kabul ediliyordu; "amca" yazan
   kullanıcı haksız yere yanlış sayılıyordu. Parantezli açıklama hem atılmış
   hem tek başına, eğik çizgiyle ayrılmış karşılıklar da tek tek kabul edilir. */
const anlamSecenekleri = s => {
  const t = String(s||"").trim();
  const out = new Set(); if(t) out.add(t);
  /* Parantez iki farklı iş görüyor:
     - AYIRT EDİCİ: "o (erkek)" / "o (kadın)" — el ile ea'yı ayıran tek şey bu.
       Burada parantezi atmak "o" yazan kullanıcıya ikisini de doğru saydırır,
       yani sorunun ölçtüğü ayrımı yok eder. Bu yüzden atılmaz.
     - AÇIKLAYICI: "ocak (aragaz)" — parantez yalnızca hangi "ocak" olduğunu
       söylüyor; "ocak" da "aragaz" da kabul edilmeli. */
  const m = t.match(/\(([^)]*)\)/);
  const ayirtEdici = /^(erkek|kadın|erkekler|kadınlar|eril|dişil|nötr|tekil|çoğul)/i;
  if(m && m[1].trim() && !ayirtEdici.test(m[1].trim())){
    const parensiz = t.replace(/\s*\([^)]*\)\s*/g," ").replace(/\s+/g," ").trim();
    if(parensiz) out.add(parensiz);
    out.add(m[1].trim());
  }
  Array.from(out).forEach(x=> x.split("/").forEach(p=>{ if(p.trim()) out.add(p.trim()); }));
  return Array.from(out);
};
const shuffle = a => { const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]];} return b; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const PERSON_LABEL = {0:"eu",1:"tu",2:"el/ea",3:"noi",4:"voi",5:"ei/ele"};
const ROMANIAN_CHARS = ["ă","â","î","ș","ț","Ă","Â","Î","Ș","Ț"];

/* item id'leri */
VOCAB.forEach((v,i)=> v.push("voc_"+i));
VERBS.forEach((v,i)=> v.push("ver_"+i));
