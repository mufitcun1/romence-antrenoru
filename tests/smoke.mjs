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
  kontrol("Yüksek puan yorumu A2 diyor, A1 demiyor",
    yuksekPuanMetni.includes("A2 seviyesine hazırsın") && !yuksekPuanMetni.includes("A1"),
    yuksekPuanMetni.split("\n").find(l=>l.includes("hazırsın")) || "");

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
      klitikStrict: exerciseForGrammarB1("klitik").strictHyphen === true,
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
  kontrol("Klitik sorusu kısa çizgiye duyarlı işaretli", tasarim.klitikStrict);
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
