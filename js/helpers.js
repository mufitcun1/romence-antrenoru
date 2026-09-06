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
const shuffle = a => { const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]];} return b; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const PERSON_LABEL = {0:"eu",1:"tu",2:"el/ea",3:"noi",4:"voi",5:"ei/ele"};
const ROMANIAN_CHARS = ["ă","â","î","ș","ț","Ă","Â","Î","Ș","Ț"];

/* item id'leri */
VOCAB.forEach((v,i)=> v.push("voc_"+i));
VERBS.forEach((v,i)=> v.push("ver_"+i));
