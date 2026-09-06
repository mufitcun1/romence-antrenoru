/* =============================================================================
   DUMAN TESTİ (smoke test) — Romence Antrenörü
   =============================================================================
   Çalıştırma:
       node tests/smoke.mjs
   (Depo kökünden. Playwright ve Chromium kurulu olmalı; test kendi statik
   sunucusunu ayağa kaldırır, ayrıca bir şey başlatmana gerek yok.)

   Amaç: her yayından önce elle tıklamadan şu soruların cevabını almak —
   uygulama açılıyor mu, hesap oluşturulabiliyor mu, A1 turu çalışıyor mu,
   A2 turu çalışıyor mu, A1 ile A2 ilerlemesi birbirine karışıyor mu,
   konsolda hata var mı.

   Çıkış kodu 0 = hepsi geçti, 1 = en az bir kontrol düştü.
   ============================================================================= */
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8099;
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css",
  ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".mp3":"audio/mpeg" };

const sonuclar = [];
function kontrol(ad, kosul, ayrinti){
  sonuclar.push({ad, gecti: !!kosul, ayrinti: ayrinti||""});
  console.log(`${kosul ? "  ✓" : "  ✗"} ${ad}${ayrinti ? "  — " + ayrinti : ""}`);
}

function sunucuBaslat(){
  return new Promise(res=>{
    const s = http.createServer((req, resp)=>{
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if(p === "/") p = "/index.html";
      const dosya = path.join(KOK, p);
      if(!dosya.startsWith(KOK) || !fs.existsSync(dosya) || fs.statSync(dosya).isDirectory()){
        resp.writeHead(404); resp.end("yok"); return;
      }
      resp.writeHead(200, {"Content-Type": MIME[path.extname(dosya)] || "application/octet-stream"});
      fs.createReadStream(dosya).pipe(resp);
    });
    s.listen(PORT, ()=> res(s));
  });
}

/* Ekrandaki soruyu tipine göre cevaplar. Doğru cevabı bilerek vermiyoruz —
   amaç akışın çalıştığını görmek, puan almak değil. */
async function soruyuCevapla(page){
  /* Cevaplanmış soruda şıklar disabled kalıyor. ":not([disabled])" olmadan
     Playwright disabled butonu 30 sn boyunca tıklamayı deniyor ve uygulama
     donduğunda hata "timeout" gibi görünüp asıl sebebi gizliyor. */
  if(await page.locator("#opts .opt:not([disabled])").count() > 0){
    await page.locator("#opts .opt:not([disabled])").first().click({timeout: 5000});
  } else if(await page.locator("#orderBank .wordchip:not([disabled])").count() > 0){
    const n = await page.locator("#orderBank .wordchip:not([disabled])").count();
    for(let i=0;i<n;i++) await page.locator("#orderBank .wordchip:not([disabled])").first().click({timeout: 5000});
    await page.locator("#checkOrderBtn").click({timeout: 5000});
  } else if(await page.locator("#typeInput:not([disabled])").count() > 0){
    await page.locator("#typeInput").fill("test");
    await page.locator("#checkBtn").click({timeout: 5000});
  } else {
    return false;
  }
  /* Test bilerek doğru cevap vermiyor; yanlış cevapta uygulama tekrar hakkı
     verip "Devam"ı göstermeyebiliyor. O durumda "Atla" ile soruyu kapatıyoruz. */
  const devam = page.locator("#nextBtn");
  try{
    await devam.waitFor({state:"visible", timeout: 1500});
  }catch(e){
    const atla = page.locator("#skipBtn");
    if(await atla.count() > 0 && await atla.isVisible()) await atla.click();
    await devam.waitFor({state:"visible", timeout: 5000});
  }
  /* nextBtn'de yanlışlıkla atlamayı engelleyen 350 ms'lik bir koruma penceresi
     var (bkz. ui.js) — tıklamadan önce onun geçmesini bekliyoruz. */
  await page.waitForTimeout(420);
  await devam.click({timeout: 5000});
  return true;
}

/* maxSoru bir ÜST SINIR, turun uzunluğu değil: yanlış cevaplanan soru turun
   sonunda bir kez daha soruluyor (bkz. ui.js:markResult), bu test de bilerek
   yanlış cevap verdiği için 10 soruluk bir tur 20 soruya kadar uzayabiliyor.
   Sınav turunda tekrar yok, orada uzunluk sabit. */
async function turuBitir(page, maxSoru, hatalar){
  let oncekiIdx = -1;
  for(let i=0;i<maxSoru;i++){
    if(await page.locator("#homeBtn, #backBtn").count() > 0) return true;   // sonuç ekranı
    /* Uygulama bir istisna atıp ekranı çizemezse aynı soru ekranında sonsuza
       kadar tıklamayalım: soru sırası ilerlemiyorsa donmuşuz demektir. Bunu
       30 sn'lik Playwright timeout'una bırakmak hatayı okunmaz hale getiriyor. */
    const idx = await page.evaluate(()=> (typeof sessionIdx === "number" ? sessionIdx : -1));
    if(idx === oncekiIdx){
      const sonHata = (hatalar && hatalar.length) ? hatalar[hatalar.length-1] : "(konsolda hata yok)";
      console.log(`     (ekran ${idx+1}. soruda dondu — son hata: ${sonHata})`);
      return false;
    }
    oncekiIdx = idx;
    if(!(await soruyuCevapla(page))){
      const sonHata = (hatalar && hatalar.length) ? hatalar[hatalar.length-1] : "(konsolda hata yok)";
      console.log(`     (tur ${i+1}. soruda cevaplanamadı — son hata: ${sonHata} — ekran: ${(await page.locator("#app-root").innerText()).slice(0,80).replace(/\n/g," ")})`);
      return false;
    }
  }
  return await page.locator("#homeBtn, #backBtn").count() > 0;
}

const sunucu = await sunucuBaslat();
const browser = await chromium.launch();
/* Service worker'ı engelliyoruz: sw.js yeni bir sürümü devralınca sayfayı
   kendisi yeniliyor (controllerchange -> location.reload, bkz. index.html) ve
   testin ortasında etkileşimi kesebiliyor. Burada test edilen şey SW değil;
   kaynağı kapatmak kararsız bir testi tolere etmekten iyidir. */
const context = await browser.newContext({serviceWorkers: "block"});
const page = await context.newPage();

/* Uygulamanın kendi hataları ile dış kaynak hatalarını ayırıyoruz: AdSense
   script'i (pagead2.googlesyndication.com) bu kapalı test ortamından yüklenemez
   ve bunu "uygulama hatası" saymak testi sürekli kırmızı tutar. Sayısı yine de
   raporlanıyor ki sessizce yutulmuş olmasın. */
const konsolHatalari = [];
const disKaynakHatalari = [];
const yerelMi = u => !u || u.startsWith(`http://localhost:${PORT}`);
page.on("console", m => {
  if(m.type() !== "error") return;
  const u = (m.location() && m.location().url) || "";
  (yerelMi(u) ? konsolHatalari : disKaynakHatalari).push(`${m.text()} <${u}>`);
});
page.on("pageerror", e => konsolHatalari.push("pageerror: " + e.message));

try {
  await page.goto(`http://localhost:${PORT}/index.html`);
  await page.waitForSelector("#app-root .card", {timeout: 10000});

  /* ---------- 1. Hesap oluşturma ---------- */
  console.log("\n1) Giriş / hesap");
  /* Misafir modu geldikten sonra ilk ekran kayıt formu değil, karşılama
     ekranı: oradan kayıt formuna #toRegisterLink ile geçiliyor. Eski kayıt
     ekranından gelen yol (#authSwitchLink) hâlâ geçerli, ikisini de
     destekliyoruz ki test her iki akışta da anlamlı kalsın. */
  if(await page.locator("#toRegisterLink").count()){
    await page.locator("#toRegisterLink").click();        // karşılama -> hesap oluştur
  } else {
    await page.locator("#authSwitchLink").click();        // giriş -> hesap oluştur
  }
  /* #authUser her iki ekranda da var; yeniden çizim bitmeden doldurursak
     değer siliniyor. Yalnızca kayıt ekranında bulunan alanı bekliyoruz. */
  await page.waitForSelector("#authDisplay", {timeout: 5000});
  await page.locator("#authUser").fill("testkullanici");
  await page.locator("#authPass").fill("test1234");
  /* Kayıt formunda şifre tekrar alanı var (kurtarma yolu olmayan bir hesapta
     tek harflik yazım hatası hesabı kalıcı kaybettiriyordu). Alan yoksa
     eski akış da çalışsın diye koşullu dolduruyoruz. */
  if(await page.locator("#authPass2").count()) await page.locator("#authPass2").fill("test1234");
  kontrol("Kayıt alanları gerçek bir <form> içinde (şifre yöneticisi için)",
    await page.locator("#authForm").count() === 1);
  await page.locator("#authSubmitBtn").click();
  await page.waitForSelector("#levelrow", {state:"visible", timeout: 10000});
  kontrol("Hesap oluşturulup uygulamaya girildi", await page.locator("#levelrow").isVisible());

  /* ---------- 2. A1 hâlâ çalışıyor (regresyon) ---------- */
  console.log("\n2) A1 regresyon");
  kontrol("A1 chip'i aktif", await page.locator('.levelchip[data-level="A1"].active').count() === 1);
  const a1Filtreler = await page.locator("#filterRow .filterchip").allTextContents();
  kontrol("A1 filtreleri arasında Dinleme var", a1Filtreler.some(t=>t.includes("Dinleme")), a1Filtreler.join(" | "));
  kontrol("A1 filtreleri arasında Kalıp İfade YOK", !a1Filtreler.some(t=>t.includes("Kalıp")));
  await page.locator("#startBtn").click();
  await page.waitForSelector(".qtext");
  const a1Kuyruk = await page.evaluate(()=> sessionQueue.map(x=>x.type));
  kontrol("A1 turu 10 soru üretti", a1Kuyruk.length === 10, `tipler: ${[...new Set(a1Kuyruk)].join(",")}`);
  const a1Idler = await page.evaluate(()=> sessionQueue
      .filter(x=> x.type !== "gram")            // gram maddesinde data bir konu adı, id yok
      .map(x=> x.data && (x.data.id || x.data[x.data.length-1]))
      .filter(v=> typeof v === "string" && v.includes("_")));
  kontrol("A1 turundaki id'lerin hiçbiri _a2_ değil", a1Idler.every(id=> !id.includes("_a2_")), `örnek: ${a1Idler.slice(0,3).join(", ")}`);
  const a1Bitti = await turuBitir(page, 26, konsolHatalari);
  kontrol("A1 turu sonuç ekranıyla bitti", a1Bitti);
  await page.locator("#homeBtn").click();

  /* ---------- 3. A2 seviyesi ---------- */
  console.log("\n3) A2 seviyesi");
  await page.locator('.levelchip[data-level="A2"]').click();
  await page.waitForSelector("#startBtn", {timeout: 5000});
  kontrol("A2 seçilince sekmeler görünür (yakında ekranı değil)", await page.locator("#tabsRow").isVisible());
  const a2Filtreler = await page.locator("#filterRow .filterchip").allTextContents();
  kontrol("A2 filtrelerinde Kalıp İfade var", a2Filtreler.some(t=>t.includes("Kalıp")), a2Filtreler.join(" | "));
  kontrol("A2 filtrelerinde Dinleme YOK", !a2Filtreler.some(t=>t.includes("Dinleme")));

  await page.locator("#startBtn").click();
  await page.waitForSelector(".qtext");
  const a2Kuyruk = await page.evaluate(()=> sessionQueue.map(x=>x.type));
  kontrol("A2 turu 10 soru üretti", a2Kuyruk.length === 10, `tipler: ${[...new Set(a2Kuyruk)].join(",")}`);
  const a2Idler = await page.evaluate(()=> sessionQueue
      .filter(x=> x.type !== "gram")            // gram maddesinde data bir konu adı, id yok
      .map(x=> x.data && (x.data.id || x.data[x.data.length-1]))
      .filter(v=> typeof v === "string" && v.includes("_")));
  kontrol("A2 turundaki id'lerin tamamı _a2_ taşıyor", a2Idler.length > 0 && a2Idler.every(id=> id.includes("_a2_")), `örnek: ${a2Idler.slice(0,3).join(", ")}`);
  const a2Bitti = await turuBitir(page, 26, konsolHatalari);
  kontrol("A2 turu sonuç ekranıyla bitti", a2Bitti);
  await page.locator("#homeBtn").click();

  /* ---------- 4. A2 deneme sınavı ---------- */
  console.log("\n4) A2 deneme sınavı");
  await page.locator('.tab[data-tab="test"]').click();
  await page.locator("#startTestBtn").click();
  await page.waitForSelector(".qtext");
  const sinavN = await page.evaluate(()=> sessionQueue.length);
  kontrol("A2 sınavı 24 soru üretti", sinavN === 24, `soru: ${sinavN}`);
  const sinavIdler = await page.evaluate(()=> sessionQueue
      .filter(x=> x.type !== "gram")            // gram maddesinde data bir konu adı, id yok
      .map(x=> x.data && (x.data.id || x.data[x.data.length-1]))
      .filter(v=> typeof v === "string" && v.includes("_")));
  kontrol("A2 sınavı A2 havuzundan geliyor", sinavIdler.every(id=> id.includes("_a2_")));

  /* Sınavı SONUNA KADAR oynuyoruz. Sınav sonu ekranı (renderSessionDone ->
     summarizeByCat -> renderTestResult) yalnızca 24. soru cevaplandıktan sonra
     çalışıyor; sadece sınavı başlatıp bırakmak o yolu hiç test etmiyor. */
  const sinavBitti = await turuBitir(page, 30, konsolHatalari);
  kontrol("A2 sınavı sonuç ekranıyla bitti", sinavBitti);
  const sonucMetni = sinavBitti ? await page.locator("#app-root").innerText() : "";
  kontrol("Sınav sonucu ekranı çizildi", sonucMetni.includes("Deneme Sınavı Sonucu"), sonucMetni.split("\n").slice(0,3).join(" / "));
  kontrol("Bölüm bazlı sonuçta 'undefined' etiket yok", !sonucMetni.includes("undefined"));
  kontrol("A2 sonucunda Kalıp İfade satırı var", sonucMetni.includes("Kalıp İfade"));
  kontrol("A2 sonucunda boş 'Dinleme' satırı yok", !sonucMetni.includes("Dinleme"));
  const gecmis = await page.evaluate(()=> STATE.testHistory.map(h=> ({total:h.total, kat:Object.keys(h.byCategory)})));
  kontrol("Sınav geçmişine kayıt düştü", gecmis.length === 1 && gecmis[0].total === 24, JSON.stringify(gecmis[0]||null));
  kontrol("Kategori özetinde 'ifade' anahtarı var", (gecmis[0]?.kat||[]).includes("ifade"));
  /* Yüksek puan yorumu seviyeye göre değişmeli — testi bilerek yanlış cevapladığı
     için o dal normal akışta çizilmiyor, doğrudan çağırıp kontrol ediyoruz. */
  const yuksekPuanMetni = sinavBitti
    ? (await page.evaluate(()=> renderTestResult(95)), await page.locator("#app-root").innerText())
    : "";
  kontrol("Yüksek puan yorumu tamamlanan seviyeyi söylüyor, ters yönde değil",
    yuksekPuanMetni.includes("A2 seviyesini tamamladın")
      && !yuksekPuanMetni.includes("A2 seviyesine hazırsın")
      && !yuksekPuanMetni.includes("A1"),
    yuksekPuanMetni.split("\n").find(l=>l.includes("tamamladın")) || "");

  /* Sınav geçmişi seviyeye göre ayrılmalı: A2 sonucu A1'in geçmişinde
     görünmemeli (aksi halde kullanıcı A1 sınavını hiç yapmadan A1 ekranında
     sonuç görür). Metin yerine satır sayısına bakıyoruz: başlık CSS ile büyük
     harfe çevrildiği için innerText araması yanıltıcı sonuç veriyor. */
  await page.locator('.levelchip[data-level="A1"]').click();
  await page.locator('.tab[data-tab="test"]').click();
  await page.waitForSelector("#startTestBtn");
  kontrol("A2 sınav sonucu A1 geçmişinde görünmüyor",
    await page.locator("#app-root .themerow").count() === 0,
    `A1 ekranındaki geçmiş satırı: ${await page.locator("#app-root .themerow").count()}`);
  await page.locator('.levelchip[data-level="A2"]').click();
  await page.locator('.tab[data-tab="test"]').click();
  await page.waitForSelector("#startTestBtn");
  kontrol("A2 sınav sonucu A2 geçmişinde görünüyor",
    await page.locator("#app-root .themerow").count() === 1,
    `A2 ekranındaki geçmiş satırı: ${await page.locator("#app-root .themerow").count()}`);
  kontrol("Seviye değişince yarım sınav durumu temizlendi",
    await page.evaluate(()=> testMode === false && testResults.length === 0 && sessionQueue.length === 0));

  /* ---------- 5. A2 ilerleme ekranı ---------- */
  console.log("\n5) A2 ilerleme ekranı");
  await page.locator('.tab[data-tab="dash"]').click();
  await page.waitForSelector(".statgrid");
  const dashMetni = await page.locator("#app-root").innerText();
  kontrol("İlerleme ekranı A2 etiketiyle açıldı", dashMetni.includes("A2"), dashMetni.split("\n")[1] || "");
  kontrol("İlerleme ekranında A2 kelime sayısı (516) görünüyor", dashMetni.includes("516"));

  /* ---------- 6. B1 seviyesi ---------- */
  console.log("\n6) B1 seviyesi");
  await page.locator('.levelchip[data-level="B1"]').click();
  /* Önceki bölüm İlerleme sekmesinde bitiyor; seviye değişince aktif sekme
     korunuyor, o yüzden Pratik'e dönmeden #startBtn görünmez. */
  await page.locator('.tab[data-tab="practice"]').click();
  await page.waitForSelector("#startBtn", {timeout: 5000});
  kontrol("B1 seçilince sekmeler görünür (artık 'yakında' değil)", await page.locator("#tabsRow").isVisible());
  const b1Filtreler = await page.locator("#filterRow .filterchip").allTextContents();
  kontrol("B1 filtrelerinde Zıt Anlam var", b1Filtreler.some(t=>t.includes("Zıt")), b1Filtreler.join(" | "));
  kontrol("B1 filtrelerinde Dinleme YOK", !b1Filtreler.some(t=>t.includes("Dinleme")));

  await page.locator("#startBtn").click();
  await page.waitForSelector(".qtext");
  const b1Kuyruk = await page.evaluate(()=> sessionQueue.map(x=>x.type));
  kontrol("B1 turu 10 soru üretti", b1Kuyruk.length === 10, `tipler: ${[...new Set(b1Kuyruk)].join(",")}`);
  const b1Idler = await page.evaluate(()=> sessionQueue
      .filter(x=> x.type !== "gram")
      .map(x=> x.data && (x.data.id || x.data[x.data.length-1]))
      .filter(v=> typeof v === "string" && v.includes("_")));
  kontrol("B1 turundaki id'lerin tamamı _b1_ taşıyor",
    b1Idler.length > 0 && b1Idler.every(id=> id.includes("_b1_")), `örnek: ${b1Idler.slice(0,3).join(", ")}`);

  /* Karma tasarım iddiasını MADDE BAZINDA doğrula. Önceki sürüm yalnızca
     "kuyrukta bir type sorusu var mı" diye bakıyordu; fiil soruları zaten
     daima type olduğu için klitik/gendat/türetme yanlışlıkla çoktan seçmeliye
     çevrilse bile o kontrol geçiyordu. */
  const tasarim = await page.evaluate(()=>{
    const oncesi = new Set(Object.keys(STATE.mastery));
    const r = {
      klitik: exerciseForGrammarB1("klitik").kind,
      gendat: exerciseForGrammarB1("gendat").kind,
      turetme: exerciseForGrammarB1("turetme").kind,
      edat: exerciseForGrammarB1("edat").kind,
      fiil: exerciseForVerbB1(VERBS_B1[0]).kind,
      kelimeYeni: exerciseForVocabB1(VOCAB_B1[0]).kind,
      /* strictHyphen artık maddeye bağlı: 22 klitik cümlesinin 5'inde kısa
         çizgi yok ("Filmul acela __ văzusem" → îl) ve orada iç tire denetimi
         anlamsız. Tek örneğe bakmak bu yüzden kararsız; havuzun tamamında
         tire varlığı ile bayrağın örtüştüğünü doğruluyoruz. */
      klitikStrict: (()=>{
        let tireli = 0, tiresiz = 0, tutarli = true;
        for(let i=0;i<200;i++){
          const q = exerciseForGrammarB1("klitik");
          const t = /-______|______-/.test(q.prompt);
          if(t) tireli++; else tiresiz++;
          if(!!q.strictHyphen !== t) tutarli = false;
        }
        return tutarli && tireli > 0 && tiresiz > 0;
      })(),
      klitikCumleGosteriyor: (()=>{ const q=exerciseForGrammarB1("klitik");
        return !!q.roDisplay && q.roDisplay !== q.answer; })(),
      cumleNoktalamasiz: (()=>{ const q=exerciseForSentenceB1({ro:"Am venit acasă.",tr:"Eve geldim.",id:"x"});
        return !q.words.some(w=>/[.!?]$/.test(w)); })(),
    };
    Object.keys(STATE.mastery).forEach(k=>{ if(!oncesi.has(k)) delete STATE.mastery[k]; });
    return r;
  });
  kontrol("Klitik / genitiv-dativ / türetme YAZDIRILIYOR",
    tasarim.klitik==="type" && tasarim.gendat==="type" && tasarim.turetme==="type",
    `klitik=${tasarim.klitik} gendat=${tasarim.gendat} turetme=${tasarim.turetme}`);
  kontrol("Edat kalıbı ve yeni kelime çoktan seçmeli kalıyor",
    tasarim.edat==="mc" && tasarim.kelimeYeni==="mc", `edat=${tasarim.edat} kelime=${tasarim.kelimeYeni}`);
  kontrol("Fiil çekimi daima yazdırılıyor", tasarim.fiil==="type", tasarim.fiil);
  kontrol("Kısa çizgi denetimi yalnızca tireli klitik maddelerinde açık", tasarim.klitikStrict);
  kontrol("Klitik/gendat/türetme cevabı düzeltilmiş CÜMLEYİ gösteriyor", tasarim.klitikCumleGosteriyor);
  kontrol("Cümle dizmede noktalama kırpılıyor (son kelimeyi ele vermesin)", tasarim.cumleNoktalamasiz);

  /* Kullanıcı refleksle "-l" yazarsa haksız yere reddedilmemeli. */
  const tireKirpma = await page.evaluate(()=>{
    const kirp = x => normTire(String(x||"").replace(/^-+|-+$/g,""));
    return kirp("-l")===kirp("l") && normTire("mi-o")!==normTire("mio");
  });
  kontrol("Baş/son tire kırpılıyor ama iç tire anlamlı kalıyor", tireKirpma);

  const b1Idler2 = await page.evaluate(()=> VERBS_B1.length);
  kontrol("B1 fiil havuzu dolu", b1Idler2 > 200, `${b1Idler2} fiil`);

  const b1Bitti = await turuBitir(page, 25, konsolHatalari);
  kontrol("B1 turu sonuç ekranıyla bitti", b1Bitti);
  await page.locator("#homeBtn").click();

  await page.locator('.tab[data-tab="dash"]').click();
  await page.waitForSelector(".statgrid");
  const b1Dash = await page.locator("#app-root").innerText();
  kontrol("B1 ilerleme ekranı açıldı", b1Dash.includes("B1"), b1Dash.split("\n")[1] || "");
  kontrol("İlerleme ekranında B1 kelime sayısı (520) görünüyor", b1Dash.includes("520"));

  /* ---------- 7. A1 ilerlemesi bozulmadı ---------- */
  console.log("\n7) Veri ayrımı");
  const kutular = await page.evaluate(()=> Object.keys(STATE.mastery));
  const a1Kayit = kutular.filter(k=> !k.includes("_a2_"));
  const a2Kayit = kutular.filter(k=> k.includes("_a2_"));
  kontrol("A1 ilerleme kayıtları duruyor", a1Kayit.length > 0, `${a1Kayit.length} kayıt`);
  kontrol("A2 ilerlemesi ayrı anahtarlarla tutuluyor", a2Kayit.length > 0, `${a2Kayit.length} kayıt`);
  kontrol("A1 ve A2 anahtarları çakışmıyor", a1Kayit.every(k=> !a2Kayit.includes(k)));

  /* ---------- 7b. Kalite kontrol turunda bulunan hatalar ----------
     Bu bölümdeki her kontrol, 6 Eylül 2026 A1 kalite kontrol turunda tespit
     edilen somut bir hataya karşılık gelir; hepsi madde bazında iddia eder. */
  console.log("\n7b) Kalite kontrol düzeltmeleri");
  await page.evaluate(()=> selectLevel("A1"));

  const sifat = await page.evaluate(()=>{
    const m = {};
    for(let i=0;i<3000;i++){
      const e = exerciseForGrammar("adj");
      /* Cinsiyet artık soruda değil, açıklamada. */
      const isim = (e.prompt.match(/"([^"]+)"/) || [])[1];
      const cins = (String(e.aciklama||"").match(/(dişil|eril|nötr) bir isim/) || [])[1];
      m[isim] = {cins, cevap:e.answer, ayniSik: e.options[0]===e.options[1], id:e.id};
    }
    return m;
  });
  const sifatBeklenen = {"casă":"mică","fată":"frumoasă","floare":"frumoasă","mașină":"nouă","carte":"veche",
                         "copil":"mic","câine":"bun","om":"înalt","frate":"tânăr","parc":"frumos"};
  const sifatYanlis = Object.keys(sifatBeklenen).filter(k=> !sifat[k] || sifat[k].cevap !== sifatBeklenen[k]);
  kontrol("Sıfat uyumunda dişil isim dişil biçimi ister", sifatYanlis.length === 0,
    sifatYanlis.map(k=> `${k}: ${sifat[k] && sifat[k].cevap}`).join(", "));
  kontrol("Hiçbir sıfat maddesinde iki şık aynı değil",
    Object.values(sifat).every(v=> !v.ayniSik));
  kontrol("Gramer maddeleri konu başına tek id paylaşmıyor",
    new Set(Object.values(sifat).map(v=>v.id)).size === Object.keys(sifat).length);

  kontrol("a costa 2. tekil şahıs 'coști'",
    await page.evaluate(()=> VERBS.find(v=>v[0]==="a costa")[2][1]) === "coști");
  kontrol("niciodată'lı cümlede 'nu' var",
    /dar tu nu ești niciodată acasă/.test(await page.evaluate(()=> FIXED_SENTENCES[34][0])));

  const tas = await page.evaluate(()=>{
    const s = FIXED_SENTENCES[8];
    const e = exerciseForSentence({ro:s[0], tr:s[1], id:s[2]});
    return {w:e.words, a:e.answer, ro:e.roDisplay, esit: norm(e.words.slice().join(" ")).split(" ").sort().join()===norm(e.answer).split(" ").sort().join()};
  });
  kontrol("Dizme taşlarında iç noktalama yok (yeri ele vermiyor)",
    !tas.w.some(w=> /[,;:]/.test(w)), tas.w.join(" "));
  kontrol("Dizme taşlarında cümle başı büyük harfi ele vermiyor",
    tas.w.includes("eu") && !tas.w.includes("Eu"), tas.w.join(" "));
  kontrol("Özel adlar taşlarda büyük harfle kalıyor",
    tas.w.includes("Turcia") && tas.w.includes("Istanbul"), tas.w.join(" "));
  kontrol("Doğru yazılış (noktalamalı) hâlâ gösteriliyor",
    tas.ro === "Eu sunt din Turcia, din Istanbul.", tas.ro);
  kontrol("Nötrleştirilen taşlar cevapla hâlâ eşleşiyor", tas.esit);

  const belirsiz = await page.evaluate(()=>{
    const m = new Map();
    for(let i=0;i<8000;i++){ const s = genDynamicSentence();
      if(!m.has(s.tr)) m.set(s.tr, new Set());
      m.get(s.tr).add(s.ro); }
    return [...m.entries()].filter(([,v])=> v.size>1).map(([k,v])=> k+" -> "+[...v].join(" / "));
  });
  kontrol("Dinamik cümlelerde çift Romence karşılıklı Türkçe cümle yok",
    belirsiz.length === 0, belirsiz.slice(0,2).join(" | "));

  const celdirici = await page.evaluate(()=>{
    const fiilMi = ro => /^a\s/.test(ro);
    let ayniSik = 0, turKarisik = 0, mc = 0;
    for(let i=0;i<3000;i++){
      const v = VOCAB[Math.floor(Math.random()*VOCAB.length)];
      const e = exerciseForVocab(v);
      if(e.kind !== "mc") continue;
      mc++;
      if(new Set(e.options.map(norm)).size < e.options.length) ayniSik++;
      if(/ne demek/.test(e.prompt)){
        const satirlar = e.options.map(o=> VOCAB.find(x=> x[3]===o)).filter(Boolean);
        if(satirlar.length===e.options.length && new Set(satirlar.map(x=>fiilMi(x[2]))).size>1) turKarisik++;
      }
    }
    const bag = VOCAB.find(x=> x[2]==="și");
    const kumeler = new Set();
    for(let i=0;i<200;i++) kumeler.add(exerciseForVocab(bag).options.slice().sort().join("|"));
    return {ayniSik, turKarisik, mc, kume: kumeler.size};
  });
  kontrol("Hiçbir çoktan seçmelide aynı şık iki kez yok", celdirici.ayniSik === 0,
    `${celdirici.ayniSik}/${celdirici.mc}`);
  kontrol("Çeldiriciler cevapla aynı sözcük türünden", celdirici.turKarisik === 0,
    `${celdirici.turKarisik} karışık soru`);
  kontrol("Dört kelimelik temada şık kümesi çeşitleniyor", celdirici.kume > 2,
    `${celdirici.kume} farklı küme`);

  kontrol("Çok karşılıklı gloss'ta tek karşılık da kabul ediliyor",
    await page.evaluate(()=> anlamSecenekleri("amca/dayı").includes("amca")));
  kontrol("Ayırt edici parantez korunuyor (o (erkek) -> 'o' kabul edilmiyor)",
    await page.evaluate(()=> !anlamSecenekleri("o (erkek)").includes("o")));

  /* ---------- A2 alıştırma üreticileri ----------
     A2'nin üreticileri data-a2.js'de ayrı birer kopya; A1 için yazılan
     düzeltmeler oraya kendiliğinden gelmiyor. Bu blok her birini madde
     bazında sınıyor ki bir daha sessizce ayrışmasınlar. */
  console.log("\n5b) A2 alıştırma üreticileri");

  const a2tas = await page.evaluate(()=>{
    const ozel = ozelAdSeti();
    let bh = [], np = [], esitsiz = 0, n = 0;
    SENTENCES_A2.forEach(s=>{
      for(let k=0;k<20;k++){
        const e = exerciseForSentenceA2({ro:s[0], tr:s[1], id:s[2]});
        if(e.kind !== "order") continue;
        n++;
        e.words.forEach(w=>{
          if(/^[A-ZĂÂÎȘȚ]/.test(w) && !ozel.has(w)) bh.push(s[0]+" -> "+w);
          if(/[,;:!?.]$/.test(w)) np.push(s[0]+" -> "+w);
        });
        if(norm(e.words.slice().sort().join(" ")) !== norm(e.answer.split(" ").sort().join(" "))) esitsiz++;
        break;
      }
    });
    return {n, bh, np, esitsiz};
  });
  kontrol("A2 dizme taşları cümle başı büyük harfini ele vermiyor",
    a2tas.bh.length === 0, `${a2tas.bh.length}/${a2tas.n} — ` + a2tas.bh.slice(0,2).join(" | "));
  kontrol("A2 dizme taşlarında iç noktalama yok",
    a2tas.np.length === 0, `${a2tas.np.length}/${a2tas.n} — ` + a2tas.np.slice(0,2).join(" | "));
  kontrol("A2 nötrleştirilen taşlar cevapla hâlâ eşleşiyor", a2tas.esitsiz === 0);

  const a2tire = await page.evaluate(()=>{
    let bayraksiz = 0;
    for(let i=0;i<60;i++){
      if(!exerciseForGrammarA2("imppron").strictHyphen) bayraksiz++;
      if(!exerciseForGrammarA2("klitik").strictHyphen)  bayraksiz++;
    }
    /* ui.js'in strictHyphen'da kullandığı karşılaştırıcının aynısı */
    const esitle = x => normTire(String(x||"").replace(/^-+|-+$/g,""));
    return {bayraksiz, ayirtEdiyor: esitle("Las-o!") !== esitle("laso")
                                 && esitle("s-a dus") !== esitle("sa dus"),
            hosgorulu: esitle("-o") === esitle("o")};
  });
  kontrol("Tire öğreten A2 soruları strictHyphen taşıyor", a2tire.bayraksiz === 0, String(a2tire.bayraksiz));
  kontrol("Tiresiz yazım artık doğru sayılmıyor (Las-o! ≠ laso)", a2tire.ayirtEdiyor);
  kontrol("Baş/son tire hâlâ hoşgörülü (-o = o)", a2tire.hosgorulu);

  const a2gram = await page.evaluate(()=>{
    const konular = ["dativ","dativpron","demons","conj3","imperativ","imppron","klitik","fonetik","reflex","ordinal","pe","compar"];
    const out = {};
    konular.forEach(k=>{
      const ids = new Set();
      for(let i=0;i<300;i++) ids.add(exerciseForGrammarA2(k).id);
      out[k] = ids.size;
    });
    return out;
  });
  const tekIdli = Object.keys(a2gram).filter(k=> a2gram[k] < 2);
  kontrol("A2 gramer maddeleri konu başına tek id paylaşmıyor",
    tekIdli.length === 0, tekIdli.join(", ") || JSON.stringify(a2gram));

  const a2celdirici = await page.evaluate(()=>{
    const fiilMi = ro => /^a\s/.test(ro);
    let turKarisik = 0, ayniSik = 0, esAnlamli = 0, mc = 0;
    for(let i=0;i<3000;i++){
      const v = VOCAB_A2[Math.floor(Math.random()*VOCAB_A2.length)];
      const e = exerciseForVocabA2(v);
      if(e.kind !== "mc") continue;
      mc++;
      if(new Set(e.options.map(norm)).size < e.options.length) ayniSik++;
      if(/Romence nedir/.test(e.prompt)){
        if(e.options.some(o=> fiilMi(o) !== fiilMi(v[2]))) turKarisik++;
        const grup = ES_ANLAMLI_A2.find(g=> g.indexOf(v[2]) >= 0);
        if(grup && e.options.some(o=> o !== v[2] && grup.indexOf(o) >= 0)) esAnlamli++;
      }
    }
    return {turKarisik, ayniSik, esAnlamli, mc};
  });
  kontrol("A2 çeldiricileri cevapla aynı sözcük türünden",
    a2celdirici.turKarisik === 0, `${a2celdirici.turKarisik}/${a2celdirici.mc}`);
  kontrol("A2'de hiçbir soruda aynı şık iki kez yok", a2celdirici.ayniSik === 0);
  kontrol("Eş anlamlı kelime ikinci doğru cevap olarak şıklara girmiyor",
    a2celdirici.esAnlamli === 0, `${a2celdirici.esAnlamli} soru`);

  /* Yazarak mod yalnızca 3. kutudan sonra açılıyor; kutuyu geçici doldurup
     gerçek kod yolunu sınıyoruz. */
  const a2yazarak = await page.evaluate(()=>{
    const yedek = JSON.stringify(STATE.mastery);
    const dene = (ro, yon) => {
      const v = VOCAB_A2.find(x=> x[2] === ro);
      STATE.mastery[v[5]] = {box:5, seen:5, correct:5};
      for(let i=0;i<200;i++){
        const e = exerciseForVocabA2(v);
        if(e.kind === "type" && (yon === "ro2tr" ? /ne demek/ : /Romence yaz/).test(e.prompt)) return e;
      }
      return null;
    };
    const cumnat = dene("cumnat", "ro2tr");
    const onest  = dene("onest",  "tr2ro");
    const sonuc = {
      glossParcasi: !!cumnat && [cumnat.answer].concat(cumnat.answerAlts||[]).some(a=> norm(a) === norm("kayınbirader")),
      esAnlamliKabul: !!onest && (onest.answerAlts||[]).indexOf("cinstit") >= 0
    };
    STATE.mastery = JSON.parse(yedek);
    return sonuc;
  });
  kontrol("A2 yazarak kelimede çok karşılıklı gloss'un tek parçası kabul ediliyor", a2yazarak.glossParcasi);
  kontrol("A2 yazarak kelimede eş anlamlı Romence karşılık kabul ediliyor", a2yazarak.esAnlamliKabul);

  const a2cumle = await page.evaluate(()=>{
    const etiketsiz = SENTENCES_A2
      .filter(r=> /^(El|Ea|Ei|Ele)\b/.test(r[0]) && /^(O|Onlar)\s/.test(r[1])
               && !/\((erkek|kadın|erkekler|kadınlar)\)/.test(r[1]))
      .map(r=> r[1]);
    const s = SENTENCES_A2.find(x=> x[0] === "Ne vom întâlni săptămâna viitoare.");
    let alt = null;
    for(let i=0;i<200 && s;i++){
      const e = exerciseForSentenceA2({ro:s[0], tr:s[1], id:s[2]});
      if(e.kind === "type" && /Romence yaz/.test(e.prompt)){ alt = e.answerAlts || []; break; }
    }
    return {etiketsiz, gelecekAlt: (alt||[]).indexOf("O să ne întâlnim săptămâna viitoare.") >= 0};
  });
  kontrol("Cinsiyet belirsiz A2 cümlelerinde Türkçe tarafta etiket var",
    a2cumle.etiketsiz.length === 0, a2cumle.etiketsiz.join(" | "));
  kontrol("Gelecek zamanın ikinci biçimi de doğru sayılıyor", a2cumle.gelecekAlt);

  const a2ipucu = await page.evaluate(()=>{
    let fonSizinti = 0, fonAciklamasiz = 0, cinsSoruda = 0, cinsAciklamada = 0, cipYanlis = 0, cift = 0;
    for(let i=0;i<120;i++){
      const f = exerciseForGrammarA2("fonetik");
      if(f.hint !== "Ses bilgisi") fonSizinti++;
      if(!f.aciklama) fonAciklamasiz++;
      const d = exerciseForGrammarA2("dativ");
      if(/\((dişil|eril|nötr)\)/.test(d.prompt)) cinsSoruda++;
      if(/(dişil|eril|nötr)[^"]* bir isim/.test(String(d.aciklama||""))) cinsAciklamada++;
      const m = exerciseForGrammarA2("demons");
      if(/\((eril|dişil|nötr)/.test(m.prompt)) cinsSoruda++;
      const v = exerciseForVerbA2(VERBS_A2[Math.floor(Math.random()*VERBS_A2.length)]);
      if(!/^Fiil çekimi · /.test(v.hint)) cipYanlis++;
      if((v.hint.match(/3\. şahıs/g) || []).length > 1) cift++;
    }
    return {n:120, fonSizinti, fonAciklamasiz, cinsSoruda, cinsAciklamada, cipYanlis, cift};
  });
  kontrol("Ses bilgisi ipucu kuralı cevaptan önce ele vermiyor",
    a2ipucu.fonSizinti === 0 && a2ipucu.fonAciklamasiz === 0, JSON.stringify(a2ipucu));
  kontrol("A2 dativ/işaret sorusunda cinsiyet soruda değil, açıklamada",
    a2ipucu.cinsSoruda === 0 && a2ipucu.cinsAciklamada === a2ipucu.n, JSON.stringify(a2ipucu));
  kontrol("Fiil ipucu çipi ne olduğunu söylüyor ve kendini tekrarlamıyor",
    a2ipucu.cipYanlis === 0 && a2ipucu.cift === 0, JSON.stringify(a2ipucu));

  /* Sınavda ikinci hak yok: yanlış cevap sonrası soru kapanmalı. */
  await page.evaluate(()=> selectLevel("A1"));
  await page.locator('.tab[data-tab="test"]').click();
  await page.waitForSelector("#startTestBtn, #testStartBtn, .btn");
  const sinavTekHak = await page.evaluate(async ()=>{
    startTest();
    await new Promise(r=> setTimeout(r, 300));
    /* Doğru olmayan bir cevap üretip markResult'ın soruyu kapattığını görüyoruz. */
    const oncekiIdx = sessionIdx;
    markResult(false);
    return {kapandi: !!currentEx._done, testMode};
  });
  kontrol("Deneme sınavında yanlış cevap ikinci hak vermiyor",
    sinavTekHak.kapandi === true, JSON.stringify(sinavTekHak));
  await page.evaluate(()=>{ testMode=false; testResults=[]; sessionQueue=[]; sessionIdx=0; goHome(); });

  /* Sınav bonusu başarıya oranlı olmalı — sınavı atlayarak XP toplanamasın. */
  const sinavXp = await page.evaluate(()=>{
    const yedek = {c:sessionScore.correct, t:sessionScore.total, x:sessionXp};
    sessionScore = {correct:1, total:24}; sessionXp = 0; sessionFirstOfDay = false;
    grantSessionEndXP(true); const dusuk = sessionXp;
    sessionScore = {correct:24, total:24}; sessionXp = 0;
    grantSessionEndXP(true); const yuksek = sessionXp;
    sessionScore = {correct:yedek.c, total:yedek.t}; sessionXp = yedek.x;
    return {dusuk, yuksek};
  });
  kontrol("Sınav bonusu başarıya oranlı", sinavXp.dusuk < sinavXp.yuksek,
    `1/24 -> ${sinavXp.dusuk} XP, 24/24 -> ${sinavXp.yuksek} XP`);

  /* Erişilebilirlik: sekmeler klavyeyle odaklanabilir ve sekme rolü taşımalı. */
  const sekme = await page.evaluate(()=> [...document.querySelectorAll('.tab')].map(t=>({
    rol:t.getAttribute('role'), ti:t.tabIndex, sec:t.getAttribute('aria-selected')})));
  kontrol("Sekmeler role=tab ve klavyeyle odaklanabilir",
    sekme.length===3 && sekme.every(t=> t.rol==="tab" && t.ti>=0), JSON.stringify(sekme));
  await page.locator('.tab[data-tab="dash"]').focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  kontrol("Sekme klavyeyle (Enter) değiştirilebiliyor",
    await page.locator(".statgrid").count() > 0);

  /* Bulut durumu tek kaynaktan: üst bar ile hesap kartı aynı metni gösterir. */
  const durum = await page.evaluate(()=>{
    const kart = document.getElementById('syncCardStatus');
    return {kartVar: !!kart, kart: kart? kart.innerHTML.trim():"", etiket: syncStatusLabel().trim()};
  });
  kontrol("Hesap kartındaki bulut durumu tek kaynaktan geliyor",
    !durum.kartVar || durum.kart === durum.etiket, JSON.stringify(durum));

  /* Mobilde HTML5 sürükle-bırak çalışmadığı için metin dokunmaya göre değişmeli. */
  /* Cinsiyet artık soruda değil, cevaptan sonra veriliyor. */
  const cinsiyet = await page.evaluate(()=>{
    const out = {soruda:0, aciklamada:0, n:0};
    for(const t of ["adj","art"]) for(let i=0;i<400;i++){
      const e = exerciseForGrammar(t); out.n++;
      if(/\((dişil|eril|nötr)\)/.test(e.prompt)) out.soruda++;
      if(e.aciklama && /(dişil|eril|nötr) bir isim/.test(e.aciklama)) out.aciklamada++;
    }
    return out;
  });
  kontrol("Cinsiyet artık soru metninde verilmiyor", cinsiyet.soruda === 0, JSON.stringify(cinsiyet));
  kontrol("Cinsiyet cevaptan sonra açıklamada veriliyor", cinsiyet.aciklamada === cinsiyet.n, JSON.stringify(cinsiyet));

  /* Diyakritik zorunlu değil — kural ekranda yazıyor mu? */
  await page.evaluate(()=>{ sessionQueue=[{type:"gram",data:"art"}]; sessionIdx=0; nextExercise(); });
  await page.waitForSelector("#charRow");
  kontrol("Diyakritik satırının altında 'zorunlu değil' notu var",
    (await page.locator(".charnote").count()) > 0 &&
    /zorunlu değil/.test(await page.locator(".charnote").innerText()));

  /* Doğru ama diyakritiksiz yazılan cevapta nazik uyarı. */
  const diy = await page.evaluate(async ()=>{
    sessionQueue=[{type:"gram",data:"num"}]; sessionIdx=0;
    currentEx = {id:"t1", kind:"type", prompt:"test", answer:"mâine", roDisplay:"mâine", needsRoChars:true};
    renderExercise();
    answer("maine", null);
    await new Promise(r=>setTimeout(r,150));
    const fb = document.getElementById('feedback');
    return {metin: fb? fb.innerText : "", dogruMu: /Doğru!/.test(fb? fb.innerText : "")};
  });
  kontrol("Diyakritiksiz doğru cevap kabul ediliyor", diy.dogruMu, diy.metin.replace(/\n/g," "));
  kontrol("Diyakritik eksikse yazım nazikçe hatırlatılıyor",
    /Diyakritikler olmadan/.test(diy.metin), diy.metin.replace(/\n/g," "));

  /* Seri dondurma metni başlangıç hediyesiyle tutarlı olmalı. */
  await page.evaluate(()=>{ goHome(); });
  await page.locator('.tab[data-tab="dash"]').click();
  await page.waitForSelector(".statgrid");
  const dashMetin = await page.locator("#app-root").innerText();
  kontrol("Seri dondurma açıklaması başlangıç hediyesini de anlatıyor",
    /Başlangıçta 2 dondurman var/.test(dashMetin),
    (dashMetin.match(/Bir günü kaçırdığında[^\n]*/) || [""])[0].slice(0,120));

  /* ---------- Kalite kontrol turu 2: arayüz düzeltmeleri ---------- */
  console.log("\n7c) Arayüz düzeltmeleri");

  const seviyeHafiza = await page.evaluate(()=>{
    selectLevel("A2");
    const yazildi = localStorage.getItem("romence_level");
    /* Açılış davranışını taklit et: seviye A1'e düşmüş, hafıza tazelenmemiş. */
    currentLevel = "A1"; seviyeGeriYuklendi = false;
    const dondu = seviyeyiGeriYukle();
    return {yazildi, dondu, aktif: currentLevel,
            cip: (document.querySelector(".levelchip.active")||{}).innerText};
  });
  kontrol("Seçilen seviye localStorage'a yazılıyor", seviyeHafiza.yazildi === "A2", String(seviyeHafiza.yazildi));
  kontrol("Açılışta kayıtlı seviyeye dönülüyor",
    seviyeHafiza.dondu === true && seviyeHafiza.aktif === "A2", JSON.stringify(seviyeHafiza));

  const turDurumu = await page.evaluate(()=>{
    goHome();
    const anaEkran = turDevamEdiyorMu();
    startPractice(10);
    const turda = turDevamEdiyorMu();
    goHome();
    return {anaEkran, turda, sonra: turDevamEdiyorMu()};
  });
  kontrol("Tur devam ediyor mu bilgisi doğru (yenileme ertelemesi buna bakıyor)",
    turDurumu.anaEkran === false && turDurumu.turda === true && turDurumu.sonra === false,
    JSON.stringify(turDurumu));
  kontrol("index.html yenilemeyi tur ortasında ertelemek üzere bu bilgiyi kullanıyor",
    /turDevamEdiyorMu/.test(await (await fetch(`http://localhost:${PORT}/index.html`)).text()));

  const mesaj = await page.evaluate(()=>{
    const a1 = (selectLevel("A1"), basariMesaji());
    const a2 = (selectLevel("A2"), basariMesaji());
    return {a1, a2};
  });
  kontrol("Sınav sonucu tamamlanan seviyeyi söylüyor, ters yönde değil",
    !/A2 seviyesine hazırsın/.test(mesaj.a2) && /A2 seviyesini tamamladın/.test(mesaj.a2),
    mesaj.a2);
  kontrol("Sonraki seviye hazırsa oraya yönlendiriyor", /A2'e geçebilirsin/.test(mesaj.a1), mesaj.a1);

  await page.evaluate(()=> selectLevel("A2"));
  await page.locator('.tab[data-tab="test"]').click();
  await page.waitForSelector("#startTestBtn");
  const sinavEkran = await page.locator("#app-root").innerText();
  kontrol("Sınav ekranı tek hak kuralını baştan söylüyor",
    /tek hak/.test(sinavEkran) && /süre sınırı yok/.test(sinavEkran),
    (sinavEkran.match(/24 soru[^\n]*/) || [""])[0]);

  const sinavCumle = await page.evaluate(()=>{
    const sonuc = {a1:0, a2:0, toplam:0};
    testMode = true;
    for(let i=0;i<40;i++){
      const s2 = SENTENCES_A2[i % SENTENCES_A2.length];
      if(exerciseForSentenceA2({ro:s2[0], tr:s2[1], id:s2[2]}).kind !== "order") sonuc.a2++;
      const s1 = FIXED_SENTENCES[i % FIXED_SENTENCES.length];
      if(exerciseForSentence({ro:s1[0], tr:s1[1], id:s1[2]}).kind !== "order") sonuc.a1++;
      sonuc.toplam++;
    }
    testMode = false;
    return sonuc;
  });
  kontrol("Sınavda cümle sorusu serbest çeviri değil, dizme",
    sinavCumle.a1 === 0 && sinavCumle.a2 === 0, JSON.stringify(sinavCumle));

  const yazilis = await page.evaluate(()=>{
    const oku = (ex, cevap) => {
      currentEx = ex; renderExercise();
      const fb = document.getElementById("feedback");
      currentEx._yazilan = cevap;
      markResult(true, null, true);
      return fb.innerText;
    };
    testMode = false; sessionQueue = []; sessionIdx = 0;
    const mc = oku({id:"t1", kind:"mc", prompt:"deneme", hint:"x",
                    options:["cinstit","altul"], answer:"cinstit", roDisplay:"cinstit"}, "cinstit");
    const mcBilgili = oku({id:"t2", kind:"mc", prompt:"deneme", hint:"x",
                    options:["dürüst","namuslu"], answer:"dürüst", roDisplay:"onest"}, "dürüst");
    const yaz = oku({id:"t3", kind:"type", prompt:"deneme", hint:"x",
                    answer:"mâine", roDisplay:"mâine"}, "mâine");
    return {mc, mcBilgili, yaz};
  });
  kontrol("Çoktan seçmelide gereksiz 'Yazılışı' satırı basılmıyor",
    !/Yazılışı/.test(yazilis.mc), yazilis.mc.replace(/\n/g," "));
  kontrol("Ek bilgi taşıyorsa çoktan seçmelide de gösteriliyor",
    /Yazılışı: onest/.test(yazilis.mcBilgili), yazilis.mcBilgili.replace(/\n/g," "));
  kontrol("Yazarak cevapta doğru yazılış hâlâ gösteriliyor",
    /Yazılışı: mâine/.test(yazilis.yaz), yazilis.yaz.replace(/\n/g," "));

  await page.evaluate(()=>{ goHome(); selectLevel("A2"); });
  await page.locator('.tab[data-tab="dash"]').click();
  await page.waitForSelector(".statgrid");
  const dashA2 = await page.locator("#app-root").innerText();
  await page.evaluate(()=> selectLevel("A1"));
  await page.locator('.tab[data-tab="dash"]').click();
  await page.waitForSelector(".statgrid");
  const dashA1 = await page.locator("#app-root").innerText();
  kontrol("İlerleme ekranında gramer satırı var", /Gramer/.test(dashA2));
  kontrol("Dinamik cümle açıklaması yalnızca dinamik havuzu olan seviyede",
    /Dinamik \(sınırsız\)/.test(dashA1) && !/Dinamik \(sınırsız\)/.test(dashA2));
  kontrol("Yüzde ile ustalık farkı açıklanıyor",
    /yalnızca son kutuya ulaşan/.test(dashA2));
  await page.evaluate(()=> selectLevel("A2"));

  kontrol("Dizme ipucu metni işaretçi türüne göre seçiliyor",
    /(sürükle|dokun)/.test(await page.evaluate(()=> ORDER_HINT)),
    await page.evaluate(()=> ORDER_HINT));

  /* ---------- 9. B1 kalite kontrol düzeltmeleri ---------- */
  console.log("\n9) B1 kalite kontrol düzeltmeleri");
  await page.evaluate(()=> selectLevel("B1"));
  await page.locator('.tab[data-tab="practice"]').click();
  await page.waitForSelector("#startBtn", {timeout: 5000});

  /* 9.1 Senkron kendi kendini yeniden kurmuyor (sonsuz 4 sn'lik çevrim).
     Eskiden syncNow → persistNow → doPublish → syncSoon zinciri kapanmıyordu:
     uygulama boştayken bile ekran her ~5 saniyede yeniden çiziliyordu. */
  const cevrim = await page.evaluate(async ()=>{
    const gercek = syncSoon;
    let sayac = 0;
    syncSoon = ()=> { sayac++; };
    syncApplying = true;  await doPublish();
    const uygularken = sayac;
    syncApplying = false; await doPublish();
    const normalde = sayac;
    syncSoon = gercek;
    return {uygularken, normalde};
  });
  kontrol("Senkronun uyguladığı kayıt yeni bir senkron kurmuyor",
    cevrim.uygularken === 0 && cevrim.normalde === 1, JSON.stringify(cevrim));

  /* 9.2 Yeniden çizim koruması tur/sınav SONUÇ ekranını da kapsıyor.
     Kapsamasaydı skor, kazanılan XP ve bölüm dağılımı okunmadan siliniyordu. */
  const koruma = await page.evaluate(async ()=>{
    const kaynak = await fetch("js/sync.js").then(r=>r.text());
    const d = document.createElement("div");
    d.className = "testresult"; document.body.appendChild(d);
    const eslesti = !!document.querySelector(".exprogress, .testresult");
    d.remove();
    return {kaynakta: kaynak.includes(".exprogress, .testresult"), eslesti};
  });
  kontrol("Sonuç ekranı yeniden çizim korumasının içinde",
    koruma.kaynakta && koruma.eslesti, JSON.stringify(koruma));

  /* 9.3 Gramer maddeleri artık konu başına tek id taşımıyor. */
  const gramIdler = await page.evaluate(()=>{
    const s = new Set();
    for(let i=0;i<80;i++) s.add(exerciseForGrammarB1("klitik").id);
    return [...s];
  });
  kontrol("B1 klitik maddeleri ayrı id taşıyor",
    gramIdler.length > 5 && gramIdler.every(id=> /^gr_b1_klitik_\d+$/.test(id)),
    `${gramIdler.length} farklı id`);

  const havuz = await page.evaluate(()=> ({
    gram: GRAM_IDS_B1.length,
    toplam: levelItemIds(LEVELS.B1).length
  }));
  kontrol("94 gramer maddesi ustalık havuzunda (844 → 938)",
    havuz.gram === 94 && havuz.toplam === 938, JSON.stringify(havuz));

  /* 9.4 Klitik ipucu maddeye bağlı: 22 cümlenin 5'inde kısa çizgi yok. */
  const ipuclari = await page.evaluate(()=>{
    const out = [];
    for(let i=0;i<200;i++){
      const q = exerciseForGrammarB1("klitik");
      out.push({tireli: /-______|______-/.test(q.prompt), zatenVar: /zaten var/.test(q.cue||""), strict: !!q.strictHyphen});
    }
    return out;
  });
  kontrol("Kısa çizgi ipucu yalnızca gerçekten tireli cümlelerde",
    ipuclari.every(x=> x.tireli === x.zatenVar && x.tireli === x.strict),
    `tiresiz örnek sayısı: ${ipuclari.filter(x=>!x.tireli).length}`);

  /* 9.5 Model cümlede noktalama öncesi boşluk kalmıyor ("în mijloc , fără"). */
  const bosluk = await page.evaluate(()=>{
    const kotu = [];
    ["klitik","gendat","edat","turetme"].forEach(k=>{
      for(let i=0;i<120;i++){
        const q = exerciseForGrammarB1(k);
        if(/\s[,.;:!?]/.test(q.roDisplay||"")) kotu.push(q.roDisplay);
      }
    });
    return [...new Set(kotu)];
  });
  kontrol("Gramer model cümlelerinde noktalama öncesi boşluk yok",
    bosluk.length === 0, bosluk.slice(0,2).join(" | "));

  /* 9.6 Cinsiyet işareti kelimenin kendisine yapışık değil. */
  const b1Cinsiyet = await page.evaluate(()=>{
    const yapisik = VOCAB_B1.filter(v=> /\((f|n|m)\)\s*$/.test(v[2])).length;
    const ornek = VOCAB_B1.find(v=> v[4] === "n");
    const q = exerciseForVocabB1(ornek);
    return {yapisik, hint:q.hint, aciklama:q.aciklama};
  });
  kontrol("Cinsiyet işareti Romence kelimeye yapışık değil", b1Cinsiyet.yapisik === 0,
    `yapışık kalan: ${b1Cinsiyet.yapisik}`);
  kontrol("Cinsiyet bilgisi soruda değil, cevaptan sonra",
    !/·\s*(f|n|m)\b/.test(b1Cinsiyet.hint) && /dişil|nötr|eril/.test(b1Cinsiyet.aciklama||""),
    `${b1Cinsiyet.hint} → ${b1Cinsiyet.aciklama}`);

  /* 9.7 B1 cümle taşlarında baş harf / iç noktalama sızıntısı yok. */
  const tasSizinti = await page.evaluate(()=>{
    const kotu = [];
    SENTENCES_B1.forEach(s=>{
      const q = exerciseForSentenceB1({ro:s[0], tr:s[1], id:s[2]});
      const ozel = ozelAdSeti();
      q.words.forEach(w=>{
        if(/[,;:!?.]/.test(w)) kotu.push("noktalama: "+w);
        if(/^[A-ZĂÂÎȘȚ]/.test(w) && !ozel.has(w)) kotu.push("büyük harf: "+w);
      });
    });
    return [...new Set(kotu)];
  });
  kontrol("B1 dizme taşlarında büyük harf/noktalama sızıntısı yok",
    tasSizinti.length === 0, tasSizinti.slice(0,3).join(" | "));

  /* 9.8 Condițional-optativ gerçekten soruluyor (32/32 imperfect çıkıyordu). */
  const kipler = await page.evaluate(()=>{
    const say = {imp:0, cond:0};
    for(let i=0;i<300;i++){
      const q = exerciseForVerbB1(VERBS_B1[i % VERBS_B1.length]);
      if(/condițional/i.test(q.prompt)) say.cond++; else say.imp++;
    }
    return say;
  });
  kontrol("Condițional-optativ ilk turdan itibaren soruluyor",
    kipler.cond > 30 && kipler.imp > 30, JSON.stringify(kipler));

  /* Kip artık rastgele seçildiği için tek örnek yeterli değil: iki kipten de
     örnek toplayıp ikisinde de rozetin çekim sınıfını sızdırmadığına bakıyoruz. */
  const fiilIpucu = await page.evaluate(()=>{
    const v = VERBS_B1.find(x=> /^IV/.test(x[4]));
    let imp = null, cond = null;
    for(let i=0;i<400 && (!imp || !cond);i++){
      const q = exerciseForVerbB1(v);
      if(/condițional/i.test(q.prompt)) cond = cond || q; else imp = imp || q;
    }
    return {impHint:imp&&imp.hint, impAciklama:imp&&imp.aciklama,
            condHint:cond&&cond.hint, condAciklama:cond&&cond.aciklama};
  });
  kontrol("Çekim sınıfı soruda değil, cevaptan sonra",
    !!fiilIpucu.impHint && !!fiilIpucu.condHint
      && !/\(-/.test(fiilIpucu.impHint) && !/\(-/.test(fiilIpucu.condHint)
      && /grubu/.test(fiilIpucu.impAciklama||""),
    `${fiilIpucu.impHint} → ${fiilIpucu.impAciklama} · ${fiilIpucu.condHint}`);

  /* 9.9 Kök paylaşan zıt anlam maddesi çoktan seçmeli değil (bedava cevap). */
  const zit = await page.evaluate(()=>{
    const kokPaylasan = ANTONIM_B1.filter(a=> _b1KokPaylasiyor(a[0], a[1]) && !a[1].trim().includes(" "));
    const farkli = ANTONIM_B1.filter(a=> !_b1KokPaylasiyor(a[0], a[1]));
    return {
      kokSayisi: kokPaylasan.length,
      kokKind: kokPaylasan.slice(0,5).map(a=> exerciseForAntonimB1(a).kind),
      farkliKind: farkli.slice(0,5).map(a=> exerciseForAntonimB1(a).kind)
    };
  });
  kontrol("Kök paylaşan zıt anlam maddeleri yazdırılıyor",
    zit.kokSayisi > 5 && zit.kokKind.every(k=> k === "type"),
    `${zit.kokSayisi} madde · ${zit.kokKind.join(",")}`);
  kontrol("Anlamca farklı karşıtlar çoktan seçmeli kalıyor",
    zit.farkliKind.some(k=> k === "mc"), zit.farkliKind.join(","));

  /* 9.10 Boş tur / boş sınav ödül vermiyor. */
  const bosTur = await page.evaluate(()=>{
    const oncekiXp = sessionXp, oncekiScore = sessionScore;
    sessionScore = {correct:0,total:0,firstTry:0};
    sessionXp = 0; grantSessionEndXP(false); const tur = sessionXp;
    sessionXp = 0; grantSessionEndXP(true);  const sinav = sessionXp;
    sessionScore = oncekiScore; sessionXp = oncekiXp;
    return {tur, sinav};
  });
  kontrol("Hiç soru cevaplanmayan tur/sınav XP vermiyor",
    bosTur.tur === 0 && bosTur.sinav === 0, JSON.stringify(bosTur));

  /* 9.11 Combo ilk denemedeki yanlışta kırılıyor. */
  await page.locator("#startBtn").click();
  await page.waitForSelector(".qtext");
  const combo = await page.evaluate(()=>{
    sessionCombo = 4;
    currentEx = {id:"test_combo", kind:"mc", answer:"x", _attempts:1};
    markResult(true);                      // ikinci denemede doğru
    const ikinciDeneme = sessionCombo;
    sessionCombo = 4;
    currentEx = {id:"test_combo2", kind:"mc", answer:"x", _attempts:0};
    markResult(true);                      // ilk denemede doğru
    return {ikinciDeneme, ilkDeneme: sessionCombo};
  });
  kontrol("İlk denemedeki yanlış combo'yu kırıyor",
    combo.ikinciDeneme === 0 && combo.ilkDeneme === 5, JSON.stringify(combo));

  /* 9.12b Kelime havuzlarında çift kayıt yok.
     "apartament" hem kişisel bilgi hem konut temasında duruyordu: aynı kelime
     iki ayrı Leitner kutusuna giriyor, havuz sayısını şişiriyor ve öğrenciye
     aynı şeyi iki kez ezberletiyordu. */
  const cift = await page.evaluate(()=>{
    const say = (liste, roIdx, trIdx) => {
      const ro = {}, tr = {};
      liste.forEach(r=>{ ro[r[roIdx]] = (ro[r[roIdx]]||0)+1; tr[r[trIdx]] = (tr[r[trIdx]]||0)+1; });
      return {
        ro: Object.keys(ro).filter(k=> ro[k] > 1),
        tr: Object.keys(tr).filter(k=> tr[k] > 1)
      };
    };
    return {
      a1: say(VOCAB, 2, 3),
      b1: say(VOCAB_B1, 2, 3),
      a1Adet: VOCAB.length
    };
  });
  kontrol("A1 kelime havuzunda çift kayıt yok",
    cift.a1.ro.length === 0 && cift.a1.tr.length === 0,
    `ro: ${cift.a1.ro.join(",") || "yok"} · tr: ${cift.a1.tr.join(",") || "yok"} · ${cift.a1Adet} kelime`);
  kontrol("B1 kelime havuzunda çift Romence kayıt yok",
    cift.b1.ro.length === 0, cift.b1.ro.join(",") || "yok");

  /* 9.13 Çok karşılıklı Türkçe gloss'ta kısmi cevap kabul ediliyor (B1). */
  const b1Gloss = await page.evaluate(()=>{
    const v = VOCAB_B1.find(x=> x[3].includes("/"));
    if(!v) return null;
    const q = exerciseForVocabB1(v);  // kutu 0'da mc gelir; alts'ı doğrudan sınıyoruz
    return {gloss:v[3], alts:(typeof anlamSecenekleri==="function" ? anlamSecenekleri(v[3]) : [])};
  });
  kontrol("Çok karşılıklı gloss'ta parçalar da kabul ediliyor (B1)",
    !!b1Gloss && b1Gloss.alts.length > 1,
    b1Gloss ? `${b1Gloss.gloss} → ${b1Gloss.alts.join(" | ")}` : "örnek yok");

  /* 9.14 "ocak" hangi ocak? — ay ile aragaz artık ayırt edilebiliyor. */
  const ocak = await page.evaluate(()=>{
    const ay = VOCAB.find(v=> v[2]==="ianuarie");
    const aragaz = VOCAB.find(v=> v[2]==="aragaz");
    return {ay: ay && ay[3], aragaz: aragaz && aragaz[3],
            ayKabul: anlamSecenekleri(ay[3]).includes("ocak")};
  });
  kontrol("'ocak' karşılıkları ayırt edilebiliyor, kısa yazım hâlâ kabul",
    ocak.ay === "ocak (ay)" && /aragaz/.test(ocak.aragaz||"") && ocak.ayKabul,
    JSON.stringify(ocak));

  /* 9.11'deki markResult çağrısı ekranı geri bildirim durumunda bıraktı;
     temiz bir ana ekrandan devam ediyoruz. */
  await page.evaluate(()=>{ sessionQueue = []; sessionIdx = 0; currentEx = null; switchTab("practice"); });
  await page.waitForSelector("#startBtn", {timeout: 5000});

  /* 9.12 Tur sürerken sekmeye basınca uyarı çıkıyor, tur sessizce silinmiyor. */
  await page.locator("#startBtn").click();
  await page.waitForSelector(".qtext");
  await page.locator('.tab[data-tab="dash"]').click();
  const uyariVar = await page.locator("#turCikisUyari").count();
  const halaSoruda = await page.locator(".qtext").count();
  kontrol("Tur sürerken sekmeye basınca önce uyarı çıkıyor",
    uyariVar === 1 && halaSoruda === 1, `uyarı:${uyariVar} soru:${halaSoruda}`);
  await page.locator("#turCikisOnay").click();
  await page.waitForSelector(".statgrid", {timeout: 5000});
  kontrol("Onaylayınca turdan çıkılıyor", await page.locator(".statgrid").count() === 1);
  await page.evaluate(()=> selectLevel("A2"));
  await page.locator('.tab[data-tab="practice"]').click();

  /* ---------- 10. Uygulama içi hesap silme (Play Store şartı) ---------- */
  console.log("\n10) Hesap silme");
  await page.evaluate(()=> selectLevel("A2"));
  await page.locator('.tab[data-tab="dash"]').click();
  await page.waitForSelector(".statgrid");
  kontrol("İlerleme ekranında 'Hesabımı Sil' düğmesi var",
    await page.locator("#deleteAccountBtn").count() === 1);

  await page.locator("#deleteAccountBtn").click();
  await page.waitForSelector("#delConfirmBtn", {timeout: 5000});
  kontrol("Onay düğmesi kullanıcı adı yazılmadan kapalı",
    await page.locator("#delConfirmBtn").isDisabled());
  await page.locator("#delConfirmInput").fill("yanlisad");
  kontrol("Yanlış kullanıcı adı onayı açmıyor",
    await page.locator("#delConfirmBtn").isDisabled());
  await page.locator("#delConfirmInput").fill("testkullanici");
  kontrol("Doğru kullanıcı adı onayı açıyor",
    !(await page.locator("#delConfirmBtn").isDisabled()));

  /* Sunucu tarafı henüz uygulanmadığında YEREL kayıt silinmemeli: yarım silme
     kullanıcıya erişemediği ama var olan bir hesap bırakır. */
  await page.evaluate(()=>{ window.__gercekSil = syncDeleteAccount;
                            syncDeleteAccount = async ()=> ({ok:false, reason:"not_deployed"}); });
  await page.locator("#delConfirmBtn").click();
  await page.waitForTimeout(800);
  const yarimSilme = await page.evaluate(()=> ({
    hesapDuruyor: !!(ACCOUNTS && ACCOUNTS.accounts && ACCOUNTS.accounts["testkullanici"]),
    girisAcik: currentUser === "testkullanici",
    hata: (document.getElementById("delErr")||{}).textContent || ""
  }));
  kontrol("Bulut silinemezse yerel hesap da silinmiyor",
    yarimSilme.hesapDuruyor && yarimSilme.girisAcik, JSON.stringify(yarimSilme));
  kontrol("Kullanıcıya dürüst bir mesaj gösteriliyor",
    /henüz açık değil|destek/i.test(yarimSilme.hata), yarimSilme.hata.slice(0,80));

  /* Sunucu tarafı çalıştığında hesap gerçekten gidiyor. */
  await page.evaluate(()=>{ syncDeleteAccount = async ()=> ({ok:true}); });
  await page.locator("#delConfirmBtn").click();
  await page.waitForTimeout(1200);
  const silindi = await page.evaluate(()=> ({
    hesapGitti: !(ACCOUNTS && ACCOUNTS.accounts && ACCOUNTS.accounts["testkullanici"]),
    cikisYapildi: currentUser === null,
    depodaYok: !((localStorage.getItem("romence_accounts_v2")||"").includes("testkullanici"))
  }));
  kontrol("Onaylanınca hesap cihazdan da siliniyor ve çıkış yapılıyor",
    silindi.hesapGitti && silindi.cikisYapildi && silindi.depodaYok, JSON.stringify(silindi));

  /* Migration dosyası depoda duruyor mu (kullanıcı uygulayacak). */
  const migration = await fetch(`http://localhost:${PORT}/supabase/migrations/20260906_delete_own_account.sql`)
    .then(r=> r.ok ? r.text() : "").catch(()=> "");
  kontrol("Sunucu tarafı SQL'i depoda ve auth.uid() ile sınırlı",
    /delete_own_account/.test(migration) && /auth\.uid\(\)/.test(migration)
      && /security definer/i.test(migration) && /set search_path = ''/.test(migration)
      && !/create or replace function public\.delete_own_account\s*\(\s*[a-z]/i.test(migration),
    migration ? `${migration.length} karakter` : "dosya yok");

  /* ---------- 8. Konsol ---------- */
  console.log("\n8) Konsol");
  kontrol("Uygulama kaynaklı konsol hatası yok", konsolHatalari.length === 0, konsolHatalari.slice(0,3).join(" | "));
  if(disKaynakHatalari.length){
    console.log(`     (dış kaynak yüklenemedi — test ortamı ağa çıkamıyor, uygulama hatası değil: ${disKaynakHatalari.length} adet)`);
  }

} catch(err){
  kontrol("Test beklenmedik hatayla durdu", false, err.message);
} finally {
  await browser.close();
  sunucu.close();
}

const dusen = sonuclar.filter(s=> !s.gecti);
console.log(`\n${"=".repeat(60)}`);
console.log(`SONUÇ: ${sonuclar.length - dusen.length}/${sonuclar.length} kontrol geçti`);
if(dusen.length){
  console.log("DÜŞENLER:");
  dusen.forEach(d=> console.log(`  ✗ ${d.ad}${d.ayrinti ? "  — " + d.ayrinti : ""}`));
}
process.exit(dusen.length ? 1 : 0);
