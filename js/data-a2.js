/* =============================================================================
   ROMENCE ANTRENÖRÜ — A2 SEVİYESİ İÇERİK VERİSİ
   =============================================================================
   Bu dosya A1 verisinden (js/data.js) BAĞIMSIZDIR ve onu değiştirmez.
   index.html'de data.js'den SONRA, helpers.js'den ÖNCE yüklenmelidir:
       <script src="js/data.js"></script>
       <script src="js/data-a2.js"></script>
       <script src="js/helpers.js"></script>

   Kimlikler (id) burada dosya içinde atanır ve "voc_a2_", "ver_a2_",
   "sent_a2_" ön eklerini taşır — böylece A1 ilerleme verisiyle ÇAKIŞMAZ.
   Mevcut hesaplardaki A1 kutuları (Leitner box) olduğu gibi korunur.

   Kaynak: "Descrierea minimală a limbii române (A1–B2)" A2 bölümü +
   DOOM 3 (2021, Academia Română) çekim tabloları (dexonline.ro üzerinden)
   + Romence sıklık listesi (OpenSubtitles / UD / UniMorph).
   ============================================================================= */

/* ---------- 1. TEMA ADLARI (A2'de eklenenler) ---------- */
const THEME_NAMES_A2 = {hava:"Hava Durumu",aile:"Aile",kimlik:"Kişisel Bilgi",ozellik:"Kişisel Özellikler",egitim:"Eğitim",meslek:"Meslekler / İş",vucut:"Vücut/Sağlık",giyim:"Giyim/Aksesuar",renk:"Renkler",boyut:"Boyut/Şekil",konut:"Konut",yiyecek:"Yiyecek/İçecek",gunluk:"Günlük Aktivite",spor:"Spor/Boş Zaman",tatil:"Tatil",ulasim:"Ulaşım",doga:"Doğa",sehir:"Şehir Mekânları",medya:"Basın/Medya",ozelgun:"Özel Günler",duygu:"Duygular",zamir:"Zamirler",baglac:"Bağlaçlar",zaman:"Zaman İfadeleri",yer:"Yer İfadeleri",edat:"Edatlar",soru:"Soru Sözcükleri"};

/* ---------- 2. KELİME: [tema, temaAdı, romence, türkçe, not] ---------- */
/* Toplam 516 kelime. 'not' alanı cinsiyet/çoğul veya tür bilgisi taşır. */
const VOCAB_A2 = [
["hava","Hava Durumu","furtună","fırtına","f, furtuni"],
["hava","Hava Durumu","ceață","sis","f, cețuri"],
["hava","Hava Durumu","ploaie","yağmur","f, ploi"],
["hava","Hava Durumu","ger","ayaz","n, geruri"],
["hava","Hava Durumu","înnorat","bulutlu","sıfat"],
["hava","Hava Durumu","senin","açık/bulutsuz","sıfat"],
["hava","Hava Durumu","umed","nemli","sıfat"],
["hava","Hava Durumu","a tuna","gök gürlemek","fiil I"],
["hava","Hava Durumu","a fulgera","şimşek çakmak","fiil I"],
["hava","Hava Durumu","grindină","dolu (yağış)","f, grindine"],
["hava","Hava Durumu","vreme","hava, zaman","f, vremuri"],
["hava","Hava Durumu","temperatură","sıcaklık","f, temperaturi"],
["hava","Hava Durumu","grad","derece","n, grade"],
["aile","Aile","socru","kayınpeder","m, socri"],
["aile","Aile","soacră","kaynana","f, soacre"],
["aile","Aile","noră","gelin (kayın)","f, nurori"],
["aile","Aile","ginere","damat","m, gineri"],
["aile","Aile","cumnat","kayınbirader/enişte","m, cumnați"],
["aile","Aile","cumnată","görümce/baldız","f, cumnate"],
["aile","Aile","soț","eş (koca)","m, soți"],
["aile","Aile","soție","eş (karı)","f, soții"],
["aile","Aile","rudă","akraba","f, rude"],
["aile","Aile","strănepot","torununun çocuğu","m, strănepoți"],
["aile","Aile","gemeni","ikizler","m çoğul"],
["kimlik","Kişisel Bilgi","permis de conducere","ehliyet","n, permise"],
["kimlik","Kişisel Bilgi","carnet de student","öğrenci kimliği","n, carnete"],
["kimlik","Kişisel Bilgi","buletin","kimlik kartı","n, buletine"],
["kimlik","Kişisel Bilgi","semnătură","imza","f, semnături"],
["kimlik","Kişisel Bilgi","naționalitate","uyruk","f, naționalități"],
["kimlik","Kişisel Bilgi","stare civilă","medeni hâl","f"],
["kimlik","Kişisel Bilgi","căsătorit","evli","sıfat"],
["kimlik","Kişisel Bilgi","necăsătorit","bekâr","sıfat"],
["kimlik","Kişisel Bilgi","divorțat","boşanmış","sıfat"],
["kimlik","Kişisel Bilgi","adresă","adres","f, adrese"],
["kimlik","Kişisel Bilgi","cod poștal","posta kodu","n, coduri"],
["ozellik","Kişisel Özellikler","șaten","kumral","sıfat"],
["ozellik","Kişisel Özellikler","roșcat","kızıl saçlı","sıfat"],
["ozellik","Kişisel Özellikler","cărunt","kır saçlı","sıfat"],
["ozellik","Kişisel Özellikler","căprui","ela (göz)","sıfat"],
["ozellik","Kişisel Özellikler","mustață","bıyık","f, mustăți"],
["ozellik","Kişisel Özellikler","barbă","sakal","f, bărbi"],
["ozellik","Kişisel Özellikler","prietenos","arkadaş canlısı","sıfat"],
["ozellik","Kişisel Özellikler","onest","dürüst","sıfat"],
["ozellik","Kişisel Özellikler","cinstit","namuslu","sıfat"],
["ozellik","Kişisel Özellikler","generos","cömert","sıfat"],
["ozellik","Kişisel Özellikler","sensibil","duyarlı","sıfat"],
["ozellik","Kişisel Özellikler","modern","modern","sıfat"],
["ozellik","Kişisel Özellikler","la modă","moda olan","değişmez"],
["ozellik","Kişisel Özellikler","demodat","demode","sıfat"],
["ozellik","Kişisel Özellikler","timid","çekingen","sıfat"],
["ozellik","Kişisel Özellikler","curajos","cesur","sıfat"],
["ozellik","Kişisel Özellikler","încăpățânat","inatçı","sıfat"],
["ozellik","Kişisel Özellikler","politicos","kibar","sıfat"],
["ozellik","Kişisel Özellikler","nepoliticos","kaba","sıfat"],
["ozellik","Kişisel Özellikler","răbdător","sabırlı","sıfat"],
["ozellik","Kişisel Özellikler","nerăbdător","sabırsız","sıfat"],
["ozellik","Kişisel Özellikler","chel","kel","sıfat"],
["ozellik","Kişisel Özellikler","creț","kıvırcık","sıfat"],
["egitim","Eğitim","liceu","lise","n, licee"],
["egitim","Eğitim","elev","öğrenci (okul)","m, elevi"],
["egitim","Eğitim","examen oral","sözlü sınav","n"],
["egitim","Eğitim","examen scris","yazılı sınav","n"],
["egitim","Eğitim","notă","not (puan)","f, note"],
["egitim","Eğitim","temă","ödev","f, teme"],
["egitim","Eğitim","caiet","defter","n, caiete"],
["egitim","Eğitim","manual","ders kitabı","n, manuale"],
["egitim","Eğitim","dicționar","sözlük","n, dicționare"],
["egitim","Eğitim","bursă","burs","f, burse"],
["egitim","Eğitim","diplomă","diploma","f, diplome"],
["egitim","Eğitim","a preda","ders vermek","fiil I"],
["egitim","Eğitim","a învăța","öğrenmek/öğretmek","fiil I"],
["egitim","Eğitim","a repeta","tekrar etmek","fiil I"],
["egitim","Eğitim","a explica","açıklamak","fiil I"],
["egitim","Eğitim","cretă","tebeşir","f, crete"],
["egitim","Eğitim","burete","silgi (tahta)","m, bureți"],
["meslek","Meslekler / İş","politician","siyasetçi","m, politicieni"],
["meslek","Meslekler / İş","ziarist","gazeteci","m, ziariști"],
["meslek","Meslekler / İş","regizor","yönetmen","m, regizori"],
["meslek","Meslekler / İş","funcționar","memur","m, funcționari"],
["meslek","Meslekler / İş","muncitor","işçi","m, muncitori"],
["meslek","Meslekler / İş","pompier","itfaiyeci","m, pompieri"],
["meslek","Meslekler / İş","bucătar","aşçı","m, bucătari"],
["meslek","Meslekler / İş","barman","barmen","m, barmani"],
["meslek","Meslekler / İş","recepționer","resepsiyonist","m, recepționeri"],
["meslek","Meslekler / İş","poștaș","postacı","m, poștași"],
["meslek","Meslekler / İş","învățător","ilkokul öğretmeni","m, învățători"],
["meslek","Meslekler / İş","bibliotecar","kütüphaneci","m, bibliotecari"],
["meslek","Meslekler / İş","loc de muncă","iş yeri","n"],
["meslek","Meslekler / İş","serviciu","iş/hizmet","n, servicii"],
["meslek","Meslekler / İş","companie","şirket","f, companii"],
["meslek","Meslekler / İş","firmă","firma","f, firme"],
["meslek","Meslekler / İş","șef","patron/şef","m, șefi"],
["meslek","Meslekler / İş","salariu","maaş","n, salarii"],
["meslek","Meslekler / İş","concediu","izin (tatil)","n, concedii"],
["meslek","Meslekler / İş","interviu de angajare","iş görüşmesi","n"],
["meslek","Meslekler / İş","contract","sözleşme","n, contracte"],
["meslek","Meslekler / İş","a angaja","işe almak","fiil I (-ez)"],
["meslek","Meslekler / İş","a munci","çalışmak (bedenen)","fiil IV (-esc)"],
["meslek","Meslekler / İş","a câștiga","kazanmak","fiil I"],
["meslek","Meslekler / İş","șomaj","işsizlik","n"],
["vucut","Vücut/Sağlık","deget","parmak","n, degete"],
["vucut","Vücut/Sağlık","genunchi","diz","m, genunchi"],
["vucut","Vücut/Sağlık","braț","kol","n, brațe"],
["vucut","Vücut/Sağlık","față","yüz","f, fețe"],
["vucut","Vücut/Sağlık","spate","sırt","n, spate"],
["vucut","Vücut/Sağlık","piept","göğüs","n, piepturi"],
["vucut","Vücut/Sağlık","inimă","kalp","f, inimi"],
["vucut","Vücut/Sağlık","stomac","mide","n, stomacuri"],
["vucut","Vücut/Sağlık","umăr","omuz","m, umeri"],
["vucut","Vücut/Sağlık","cot","dirsek","n, coate"],
["vucut","Vücut/Sağlık","limbă","dil","f, limbi"],
["vucut","Vücut/Sağlık","sânge","kan","n"],
["vucut","Vücut/Sağlık","pieptene","tarak","m, piepteni"],
["vucut","Vücut/Sağlık","perie de păr","saç fırçası","f, perii"],
["vucut","Vücut/Sağlık","șervețel","peçete","n, șervețele"],
["vucut","Vücut/Sağlık","gripă","grip","f, gripe"],
["vucut","Vücut/Sağlık","injecție","iğne (enjeksiyon)","f, injecții"],
["vucut","Vücut/Sağlık","pastilă","hap","f, pastile"],
["vucut","Vücut/Sağlık","plasture","yara bandı","m, plasturi"],
["vucut","Vücut/Sağlık","durere de cap","baş ağrısı","f"],
["vucut","Vücut/Sağlık","febră","ateş (hastalık)","f"],
["vucut","Vücut/Sağlık","tuse","öksürük","f"],
["vucut","Vücut/Sağlık","rețetă","reçete","f, rețete"],
["vucut","Vücut/Sağlık","a răci","üşütmek","fiil IV (-esc)"],
["vucut","Vücut/Sağlık","a tuși","öksürmek","fiil IV (-esc)"],
["vucut","Vücut/Sağlık","a se îmbolnăvi","hastalanmak","fiil IV (-esc)"],
["vucut","Vücut/Sağlık","a se însănătoși","iyileşmek","fiil IV (-esc)"],
["vucut","Vücut/Sağlık","sănătos","sağlıklı","sıfat"],
["vucut","Vücut/Sağlık","bolnav","hasta (sıfat)","sıfat"],
["giyim","Giyim/Aksesuar","palton","palto","n, paltoane"],
["giyim","Giyim/Aksesuar","jachetă","ceket (kısa)","f, jachete"],
["giyim","Giyim/Aksesuar","sacou","takım ceketi","n, sacouri"],
["giyim","Giyim/Aksesuar","costum","takım elbise","n, costume"],
["giyim","Giyim/Aksesuar","șosetă","çorap (kısa)","f, șosete"],
["giyim","Giyim/Aksesuar","ciorap","çorap (uzun)","m, ciorapi"],
["giyim","Giyim/Aksesuar","pantaloni scurți","şort","m çoğul"],
["giyim","Giyim/Aksesuar","bocanc","postal/bot","m, bocanci"],
["giyim","Giyim/Aksesuar","șlap","terlik (plaj)","m, șlapi"],
["giyim","Giyim/Aksesuar","papuc de casă","ev terliği","m, papuci"],
["giyim","Giyim/Aksesuar","adidas","spor ayakkabı","m, adidași"],
["giyim","Giyim/Aksesuar","portmoneu","cüzdan","n, portmonee"],
["giyim","Giyim/Aksesuar","pălărie","şapka","f, pălării"],
["giyim","Giyim/Aksesuar","eșarfă","atkı/eşarp","f, eșarfe"],
["giyim","Giyim/Aksesuar","curea","kemer","f, curele"],
["giyim","Giyim/Aksesuar","cercel","küpe","m, cercei"],
["giyim","Giyim/Aksesuar","brățară","bilezik","f, brățări"],
["giyim","Giyim/Aksesuar","lanț","kolye/zincir","n, lanțuri"],
["giyim","Giyim/Aksesuar","mărime","beden","f, mărimi"],
["giyim","Giyim/Aksesuar","a proba","denemek (kıyafet)","fiil I"],
["giyim","Giyim/Aksesuar","a purta","giymek/taşımak","fiil I"],
["renk","Renkler","portocaliu","turuncu","sıfat 3 formlu"],
["renk","Renkler","gri","gri","DEĞİŞMEZ"],
["renk","Renkler","bej","bej","DEĞİŞMEZ"],
["renk","Renkler","crem","krem","DEĞİŞMEZ"],
["renk","Renkler","mov","mor","DEĞİŞMEZ"],
["renk","Renkler","roz","pembe","DEĞİŞMEZ"],
["renk","Renkler","maro","kahverengi","DEĞİŞMEZ"],
["renk","Renkler","bleumarin","lacivert","DEĞİŞMEZ"],
["renk","Renkler","deschis","açık (renk)","sıfat"],
["renk","Renkler","închis","koyu (renk)","sıfat"],
["boyut","Boyut/Şekil","gros","kalın","sıfat"],
["boyut","Boyut/Şekil","subțire","ince","sıfat"],
["boyut","Boyut/Şekil","rotund","yuvarlak","sıfat"],
["boyut","Boyut/Şekil","pătrat","kare","sıfat"],
["boyut","Boyut/Şekil","dreptunghiular","dikdörtgen","sıfat"],
["boyut","Boyut/Şekil","lat","geniş","sıfat"],
["boyut","Boyut/Şekil","îngust","dar","sıfat"],
["boyut","Boyut/Şekil","adânc","derin","sıfat"],
["boyut","Boyut/Şekil","greu","ağır","sıfat"],
["boyut","Boyut/Şekil","ușor","hafif","sıfat"],
["boyut","Boyut/Şekil","plin","dolu (kap)","sıfat"],
["boyut","Boyut/Şekil","gol","boş","sıfat"],
["konut","Konut","vilă","villa","f, vile"],
["konut","Konut","balcon","balkon","n, balcoane"],
["konut","Konut","terasă","teras","f, terase"],
["konut","Konut","sufragerie","yemek odası","f, sufragerii"],
["konut","Konut","living","oturma odası","n, livinguri"],
["konut","Konut","fotoliu","koltuk","n, fotolii"],
["konut","Konut","raft","raf","n, rafturi"],
["konut","Konut","noptieră","komodin","f, noptiere"],
["konut","Konut","oglindă","ayna","f, oglinzi"],
["konut","Konut","cuptor","fırın","n, cuptoare"],
["konut","Konut","aspirator","elektrikli süpürge","n, aspiratoare"],
["konut","Konut","tavă","tepsi","f, tăvi"],
["konut","Konut","ceașcă","fincan","f, cești"],
["konut","Konut","tigaie","tava","f, tigăi"],
["konut","Konut","oală","tencere","f, oale"],
["konut","Konut","perdea","perde","f, perdele"],
["konut","Konut","covor","halı","n, covoare"],
["konut","Konut","cheie","anahtar","f, chei"],
["konut","Konut","lift","asansör","n, lifturi"],
["konut","Konut","chirie","kira","f, chirii"],
["konut","Konut","a închiria","kiralamak","fiil I (-ez)"],
["konut","Konut","a repara","tamir etmek","fiil I"],
["konut","Konut","a curăța","temizlemek","fiil I"],
["yiyecek","Yiyecek/İçecek","sos","sos","n, sosuri"],
["yiyecek","Yiyecek/İçecek","mămăligă","mısır lapası","f, mămăligi"],
["yiyecek","Yiyecek/İçecek","oțet","sirke","n, oțeturi"],
["yiyecek","Yiyecek/İçecek","corn","ay çöreği (hilal poğaça)","n, cornuri"],
["yiyecek","Yiyecek/İçecek","baghetă","baget ekmek","f, baghete"],
["yiyecek","Yiyecek/İçecek","croasant","kruvasan","n, croasante"],
["yiyecek","Yiyecek/İçecek","ștrudel","strudel","n, ștrudele"],
["yiyecek","Yiyecek/İçecek","pateu","pate/börek","n, pateuri"],
["yiyecek","Yiyecek/İçecek","porumb","mısır","m, porumbi"],
["yiyecek","Yiyecek/İçecek","macaroană","makarna","f, macaroane"],
["yiyecek","Yiyecek/İçecek","spaghete","spagetti","f çoğul"],
["yiyecek","Yiyecek/İçecek","smântână","ekşi krema","f"],
["yiyecek","Yiyecek/İçecek","caș","taze peynir","n, cașuri"],
["yiyecek","Yiyecek/İçecek","brânză topită","eritme peynir","f"],
["yiyecek","Yiyecek/İçecek","fasole","fasulye","f"],
["yiyecek","Yiyecek/İçecek","mazăre","bezelye","f"],
["yiyecek","Yiyecek/İçecek","vânătă","patlıcan","f, vinete"],
["yiyecek","Yiyecek/İçecek","salată verde","marul","f"],
["yiyecek","Yiyecek/İçecek","varză","lahana","f, verze"],
["yiyecek","Yiyecek/İçecek","ciupercă","mantar","f, ciuperci"],
["yiyecek","Yiyecek/İçecek","usturoi","sarımsak","m"],
["yiyecek","Yiyecek/İçecek","căpșună","çilek","f, căpșuni"],
["yiyecek","Yiyecek/İçecek","cireașă","kiraz","f, cireșe"],
["yiyecek","Yiyecek/İçecek","caisă","kayısı","f, caise"],
["yiyecek","Yiyecek/İçecek","piersică","şeftali","f, piersici"],
["yiyecek","Yiyecek/İçecek","pepene","karpuz/kavun","m, pepeni"],
["yiyecek","Yiyecek/İçecek","strugure","üzüm","m, struguri"],
["yiyecek","Yiyecek/İçecek","miel","kuzu","m, miei"],
["yiyecek","Yiyecek/İçecek","curcan","hindi","m, curcani"],
["yiyecek","Yiyecek/İçecek","tort","yaş pasta","n, torturi"],
["yiyecek","Yiyecek/İçecek","frișcă","krem şanti","f"],
["yiyecek","Yiyecek/İçecek","cremă","krema","f, creme"],
["yiyecek","Yiyecek/İçecek","plăcintă","börek","f, plăcinte"],
["yiyecek","Yiyecek/İçecek","budincă","puding","f, budinci"],
["yiyecek","Yiyecek/İçecek","clătită","krep","f, clătite"],
["yiyecek","Yiyecek/İçecek","cozonac","çörek (bayram)","m, cozonaci"],
["yiyecek","Yiyecek/İçecek","dulceață","reçel","f, dulcețuri"],
["yiyecek","Yiyecek/İçecek","limonadă","limonata","f, limonade"],
["yiyecek","Yiyecek/İçecek","vin roșu","kırmızı şarap","n"],
["yiyecek","Yiyecek/İçecek","vin alb","beyaz şarap","n"],
["yiyecek","Yiyecek/İçecek","coniac","konyak","n, coniacuri"],
["yiyecek","Yiyecek/İçecek","votcă","votka","f, votci"],
["yiyecek","Yiyecek/İçecek","felie","dilim","f, felii"],
["yiyecek","Yiyecek/İçecek","bucată","parça","f, bucăți"],
["yiyecek","Yiyecek/İçecek","pungă","poşet","f, pungi"],
["yiyecek","Yiyecek/İçecek","proaspăt","taze","sıfat"],
["yiyecek","Yiyecek/İçecek","a gusta","tatmak","fiil I"],
["yiyecek","Yiyecek/İçecek","a servi","servis etmek","fiil IV (-esc)"],
["yiyecek","Yiyecek/İçecek","a recomanda","tavsiye etmek","fiil I"],
["yiyecek","Yiyecek/İçecek","vegetarian","vejetaryen","sıfat"],
["gunluk","Günlük Aktivite","a se încălța","ayakkabı giymek","fiil I"],
["gunluk","Günlük Aktivite","a se descălța","ayakkabı çıkarmak","fiil I"],
["gunluk","Günlük Aktivite","a se șterge","kurulanmak","fiil III"],
["gunluk","Günlük Aktivite","a se pieptăna","saç taramak","fiil I"],
["gunluk","Günlük Aktivite","a se bărbieri","tıraş olmak","fiil IV (-esc)"],
["gunluk","Günlük Aktivite","a se odihni","dinlenmek","fiil IV (-esc)"],
["gunluk","Günlük Aktivite","a se grăbi","acele etmek","fiil IV (-esc)"],
["gunluk","Günlük Aktivite","a face cumpărături","alışveriş yapmak","fiil III"],
["gunluk","Günlük Aktivite","a face curățenie","temizlik yapmak","fiil III"],
["gunluk","Günlük Aktivite","a spăla vasele","bulaşık yıkamak","fiil I"],
["gunluk","Günlük Aktivite","a face patul","yatağı toplamak","fiil III"],
["gunluk","Günlük Aktivite","a scoate gunoiul","çöpü çıkarmak","fiil III"],
["spor","Spor/Boş Zaman","golf","golf","n, golfuri"],
["spor","Spor/Boş Zaman","aerobic","aerobik","n"],
["spor","Spor/Boş Zaman","gimnastică","jimnastik","f"],
["spor","Spor/Boş Zaman","box","boks","n, boxuri"],
["spor","Spor/Boş Zaman","echipă","takım","f, echipe"],
["spor","Spor/Boş Zaman","rachetă","raket","f, rachete"],
["spor","Spor/Boş Zaman","coș","basket/sepet","n, coșuri"],
["spor","Spor/Boş Zaman","medalie","madalya","f, medalii"],
["spor","Spor/Boş Zaman","stadion","stadyum","n, stadioane"],
["spor","Spor/Boş Zaman","meci","maç","n, meciuri"],
["spor","Spor/Boş Zaman","antrenament","antrenman","n, antrenamente"],
["spor","Spor/Boş Zaman","a pescui","balık tutmak","fiil IV (-iesc)"],
["spor","Spor/Boş Zaman","a călări","ata binmek","fiil IV (-esc)"],
["spor","Spor/Boş Zaman","a ieși în oraș","dışarı çıkmak (eğlence)","fiil IV"],
["spor","Spor/Boş Zaman","a face plajă","güneşlenmek","fiil III"],
["spor","Spor/Boş Zaman","a se distra","eğlenmek","fiil I (-ez)"],
["spor","Spor/Boş Zaman","a petrece","vakit geçirmek","fiil III"],
["spor","Spor/Boş Zaman","expoziție","sergi","f, expoziții"],
["spor","Spor/Boş Zaman","concert","konser","n, concerte"],
["spor","Spor/Boş Zaman","spectacol","gösteri","n, spectacole"],
["spor","Spor/Boş Zaman","a admira","hayran olmak","fiil I"],
["tatil","Tatil","insulă","ada","f, insule"],
["tatil","Tatil","litoral","sahil","n, litoraluri"],
["tatil","Tatil","stațiune","tatil beldesi","f, stațiuni"],
["tatil","Tatil","grădină zoologică","hayvanat bahçesi","f"],
["tatil","Tatil","grădină botanică","botanik bahçesi","f"],
["tatil","Tatil","monument","anıt","n, monumente"],
["tatil","Tatil","statuie","heykel","f, statui"],
["tatil","Tatil","pensiune","pansiyon","f, pensiuni"],
["tatil","Tatil","cort","çadır","n, corturi"],
["tatil","Tatil","hostel","hostel","n, hosteluri"],
["tatil","Tatil","cazare","konaklama","f, cazări"],
["tatil","Tatil","recepție","resepsiyon","f, recepții"],
["tatil","Tatil","rezervare","rezervasyon","f, rezervări"],
["tatil","Tatil","cartelă de acces","oda kartı","f, cartele"],
["tatil","Tatil","bagaj","bagaj","n, bagaje"],
["tatil","Tatil","excursie","gezi","f, excursii"],
["tatil","Tatil","ghid","rehber","m, ghizi"],
["tatil","Tatil","suvenir","hediyelik eşya","n, suveniruri"],
["tatil","Tatil","a rezerva","rezervasyon yapmak","fiil I"],
["ulasim","Ulaşım","tramvai","tramvay","n, tramvaie"],
["ulasim","Ulaşım","troleibuz","troleybüs","n, troleibuze"],
["ulasim","Ulaşım","microbuz","minibüs","n, microbuze"],
["ulasim","Ulaşım","motocicletă","motosiklet","f, motociclete"],
["ulasim","Ulaşım","elicopter","helikopter","n, elicoptere"],
["ulasim","Ulaşım","trecere de pietoni","yaya geçidi","f"],
["ulasim","Ulaşım","drum","yol","n, drumuri"],
["ulasim","Ulaşım","intersecție","kavşak","f, intersecții"],
["ulasim","Ulaşım","trotuar","kaldırım","n, trotuare"],
["ulasim","Ulaşım","port","liman","n, porturi"],
["ulasim","Ulaşım","vagon","vagon","n, vagoane"],
["ulasim","Ulaşım","compartiment","kompartıman","n, compartimente"],
["ulasim","Ulaşım","semn de circulație","trafik işareti","n"],
["ulasim","Ulaşım","semafor","trafik lambası","n, semafoare"],
["ulasim","Ulaşım","abonament","abonman","n, abonamente"],
["ulasim","Ulaşım","benzină","benzin","f"],
["ulasim","Ulaşım","a conduce","araba kullanmak","fiil III"],
["ulasim","Ulaşım","a parca","park etmek","fiil I (-ez)"],
["ulasim","Ulaşım","a urca","çıkmak/binmek","fiil I"],
["ulasim","Ulaşım","a coborî","inmek","fiil IV (-î)"],
["ulasim","Ulaşım","a se opri","durmak","fiil IV (-esc)"],
["doga","Doğa","oaie","koyun","f, oi"],
["doga","Doğa","capră","keçi","f, capre"],
["doga","Doğa","iepure","tavşan","m, iepuri"],
["doga","Doğa","lup","kurt","m, lupi"],
["doga","Doğa","vulpe","tilki","f, vulpi"],
["doga","Doğa","tigru","kaplan","m, tigri"],
["doga","Doğa","pom fructifer","meyve ağacı","m, pomi"],
["doga","Doğa","trandafir","gül","m, trandafiri"],
["doga","Doğa","lalea","lale","f, lalele"],
["doga","Doğa","brad","çam","m, brazi"],
["doga","Doğa","deal","tepe","n, dealuri"],
["doga","Doğa","câmpie","ova","f, câmpii"],
["doga","Doğa","fluviu","büyük nehir","n, fluvii"],
["doga","Doğa","râu","nehir","n, râuri"],
["doga","Doğa","pădure","orman","f, păduri"],
["doga","Doğa","cer","gökyüzü","n, ceruri"],
["doga","Doğa","stea","yıldız","f, stele"],
["doga","Doğa","lună","ay (gökyüzü)","f, luni"],
["doga","Doğa","frunză","yaprak","f, frunze"],
["sehir","Şehir Mekânları","card","kart","n, carduri"],
["sehir","Şehir Mekânları","bon","fiş","n, bonuri"],
["sehir","Şehir Mekânları","rest","para üstü","n, resturi"],
["sehir","Şehir Mekânları","plasă","file, ağ torba","f, plase"],
["sehir","Şehir Mekânları","rând","sıra","n, rânduri"],
["sehir","Şehir Mekânları","loc","yer/koltuk","n, locuri"],
["sehir","Şehir Mekânları","spectator","seyirci","m, spectatori"],
["sehir","Şehir Mekânları","scenă","sahne","f, scene"],
["sehir","Şehir Mekânları","ecran","ekran/perde","n, ecrane"],
["sehir","Şehir Mekânları","comedie","komedi","f, comedii"],
["sehir","Şehir Mekânları","dramă","dram","f, drame"],
["sehir","Şehir Mekânları","film de acțiune","aksiyon filmi","n"],
["sehir","Şehir Mekânları","clinică","klinik","f, clinici"],
["sehir","Şehir Mekânları","pacient","hasta (hekimin hastası)","m, pacienți"],
["sehir","Şehir Mekânları","bancomat","ATM","n, bancomate"],
["sehir","Şehir Mekânları","vedere","kartpostal","f, vederi"],
["sehir","Şehir Mekânları","timbru","pul","n, timbre"],
["sehir","Şehir Mekânları","pachet","paket","n, pachete"],
["sehir","Şehir Mekânları","amendă","ceza","f, amenzi"],
["sehir","Şehir Mekânları","sală de lectură","okuma salonu","f"],
["sehir","Şehir Mekânları","agenție imobiliară","emlakçı","f"],
["sehir","Şehir Mekânları","coadă","kuyruk (sıra)","f, cozi"],
["sehir","Şehir Mekânları","a filma","film çekmek","fiil I (-ez)"],
["sehir","Şehir Mekânları","a consulta","muayene etmek","fiil I"],
["sehir","Şehir Mekânları","a aresta","tutuklamak","fiil I (-ez)"],
["medya","Basın/Medya","documentar","belgesel","n, documentare"],
["medya","Basın/Medya","emisiune","program (TV)","f, emisiuni"],
["medya","Basın/Medya","emisiune de știri","haber programı","f"],
["medya","Basın/Medya","articol","makale","n, articole"],
["medya","Basın/Medya","interviu","röportaj","n, interviuri"],
["medya","Basın/Medya","reclamă","reklam","f, reclame"],
["medya","Basın/Medya","anunț","ilan/duyuru","n, anunțuri"],
["medya","Basın/Medya","abonat","abone","m, abonați"],
["medya","Basın/Medya","canal","kanal","n, canale"],
["medya","Basın/Medya","a transmite","yayınlamak","fiil III"],
["ozelgun","Özel Günler","invitație","davetiye","f, invitații"],
["ozelgun","Özel Günler","felicitare","tebrik kartı","f, felicitări"],
["ozelgun","Özel Günler","petrecere","parti","f, petreceri"],
["ozelgun","Özel Günler","sărbătoare","bayram","f, sărbători"],
["ozelgun","Özel Günler","zi de naștere","doğum günü","f"],
["ozelgun","Özel Günler","cadou","hediye","n, cadouri"],
["ozelgun","Özel Günler","musafir","misafir","m, musafiri"],
["ozelgun","Özel Günler","Crăciun","Noel","n"],
["ozelgun","Özel Günler","Paște","Paskalya","n"],
["ozelgun","Özel Günler","revelion","yılbaşı gecesi","n, revelioane"],
["ozelgun","Özel Günler","aniversare","yıl dönümü","f, aniversări"],
["ozelgun","Özel Günler","nuntă","düğün","f, nunți"],
["ozelgun","Özel Günler","a invita","davet etmek","fiil I"],
["ozelgun","Özel Günler","a felicita","tebrik etmek","fiil I"],
["ozelgun","Özel Günler","a oferi","sunmak","fiil IV"],
["ozelgun","Özel Günler","a sărbători","kutlamak","fiil IV (-esc)"],
["duygu","Duygular","bucurie","sevinç","f, bucurii"],
["duygu","Duygular","tristețe","üzüntü","f"],
["duygu","Duygular","regret","pişmanlık","n, regrete"],
["duygu","Duygular","speranță","umut","f, speranțe"],
["duygu","Duygular","frică","korku","f, frici"],
["duygu","Duygular","rușine","utanç","f"],
["duygu","Duygular","dor","özlem","n, doruri"],
["duygu","Duygular","mândru","gururlu","sıfat"],
["duygu","Duygular","îngrijorat","endişeli","sıfat"],
["duygu","Duygular","nervos","sinirli","sıfat"],
["duygu","Duygular","mulțumit","memnun","sıfat"],
["duygu","Duygular","dezamăgit","hayal kırıklığına uğramış","sıfat"],
["duygu","Duygular","surprins","şaşırmış","sıfat"],
["duygu","Duygular","a se bucura","sevinmek","fiil I"],
["duygu","Duygular","a se teme","korkmak","fiil III"],
["duygu","Duygular","a spera","ummak","fiil I"],
["duygu","Duygular","a regreta","pişman olmak","fiil I"],
["duygu","Duygular","a-i părea rău","üzülmek","dativ fiili"],
["zamir","Zamirler","acest","bu (eril)","işaret sıfatı"],
["zamir","Zamirler","această","bu (dişil)","işaret sıfatı"],
["zamir","Zamirler","acești","bu (eril ç.)","işaret sıfatı"],
["zamir","Zamirler","aceste","bu (dişil ç.)","işaret sıfatı"],
["zamir","Zamirler","acesta","bu (eril, sonra)","işaret zamiri"],
["zamir","Zamirler","aceasta","bu (dişil, sonra)","işaret zamiri"],
["zamir","Zamirler","acel","o (eril)","işaret sıfatı"],
["zamir","Zamirler","acea","o (dişil)","işaret sıfatı"],
["zamir","Zamirler","acela","o (eril, sonra)","işaret zamiri"],
["zamir","Zamirler","aceea","o (dişil, sonra)","işaret zamiri"],
["zamir","Zamirler","care","ki, hangi","ilgi zamiri"],
["zamir","Zamirler","niciun","hiçbir (eril)","olumsuz sıfat"],
["zamir","Zamirler","nicio","hiçbir (dişil)","olumsuz sıfat"],
["zamir","Zamirler","niciunul","hiçbiri (eril)","olumsuz zamir"],
["zamir","Zamirler","nimeni","hiç kimse","olumsuz zamir"],
["zamir","Zamirler","nimic","hiçbir şey","olumsuz zamir"],
["zamir","Zamirler","îmi","bana","dativ zamir"],
["zamir","Zamirler","îți","sana","dativ zamir"],
["zamir","Zamirler","îi","ona","dativ zamir"],
["zamir","Zamirler","le","onlara","dativ zamir"],
["zamir","Zamirler","mie","bana (vurgulu)","dativ zamir"],
["zamir","Zamirler","ție","sana (vurgulu)","dativ zamir"],
["zamir","Zamirler","nouă","bize (vurgulu)","dativ zamir"],
["zamir","Zamirler","vouă","size (vurgulu)","dativ zamir"],
["zamir","Zamirler","lor","onlara (vurgulu)","dativ zamir"],
["zamir","Zamirler","își","kendine","dönüşlü dativ"],
["baglac","Bağlaçlar","iar","ise, oysa","bağlaç"],
["baglac","Bağlaçlar","însă","ama, lâkin","bağlaç"],
["baglac","Bağlaçlar","ci","bilakis","bağlaç"],
["baglac","Bağlaçlar","ori","ya da","bağlaç"],
["baglac","Bağlaçlar","deci","bu yüzden","bağlaç"],
["baglac","Bağlaçlar","după ce","-dikten sonra","bağlaç"],
["baglac","Bağlaçlar","din cauză că","-dığı için","bağlaç"],
["baglac","Bağlaçlar","ca să","-mak için","bağlaç"],
["baglac","Bağlaçlar","de asemenea","ayrıca","bağlaç"],
["baglac","Bağlaçlar","fiindcă","çünkü","bağlaç"],
["baglac","Bağlaçlar","deoarece","çünkü (resmî)","bağlaç"],
["baglac","Bağlaçlar","totuși","yine de","bağlaç"],
["baglac","Bağlaçlar","în plus","üstelik","bağlaç"],
["baglac","Bağlaçlar","de exemplu","örneğin","bağlaç"],
["baglac","Bağlaçlar","în timp ce","-iken","bağlaç"],
["zaman","Zaman İfadeleri","atunci","o zaman","zarf"],
["zaman","Zaman İfadeleri","devreme","erken","zarf"],
["zaman","Zaman İfadeleri","târziu","geç","zarf"],
["zaman","Zaman İfadeleri","alaltăieri","evvelsi gün","zarf"],
["zaman","Zaman İfadeleri","poimâine","öbür gün","zarf"],
["zaman","Zaman İfadeleri","săptămânal","haftalık","zarf"],
["zaman","Zaman İfadeleri","lunar","aylık","zarf"],
["zaman","Zaman İfadeleri","anual","yıllık","zarf"],
["zaman","Zaman İfadeleri","din nou","yeniden","zarf"],
["zaman","Zaman İfadeleri","încă o dată","bir kez daha","zarf"],
["zaman","Zaman İfadeleri","în timpul","sırasında","edat (gen.)"],
["zaman","Zaman İfadeleri","înainte de","-den önce","edat"],
["zaman","Zaman İfadeleri","în urmă cu","önce (süre)","edat"],
["zaman","Zaman İfadeleri","timp de","süresince","edat"],
["zaman","Zaman İfadeleri","pe la","-e doğru (saat)","edat"],
["zaman","Zaman İfadeleri","o dată","bir kez","zarf sayı"],
["zaman","Zaman İfadeleri","de două ori","iki kez","zarf sayı"],
["zaman","Zaman İfadeleri","de multe ori","çok kez","zarf sayı"],
["zaman","Zaman İfadeleri","prima dată","ilk kez","zarf sayı"],
["zaman","Zaman İfadeleri","lunea","pazartesileri","zarf"],
["zaman","Zaman İfadeleri","dimineața","sabahları","zarf"],
["yer","Yer İfadeleri","înainte","ileri","zarf"],
["yer","Yer İfadeleri","înapoi","geri","zarf"],
["yer","Yer İfadeleri","afară","dışarı","zarf"],
["yer","Yer İfadeleri","înăuntru","içeri","zarf"],
["yer","Yer İfadeleri","deasupra","üstünde","edat (gen.)"],
["yer","Yer İfadeleri","dedesubtul","altında","edat (gen.)"],
["yer","Yer İfadeleri","în jurul","etrafında","edat (gen.)"],
["yer","Yer İfadeleri","în centrul","merkezinde","edat (gen.)"],
["yer","Yer İfadeleri","în afara","(-in) dışında","edat (gen.)"],
["yer","Yer İfadeleri","de-a lungul","boyunca","edat (gen.)"],
["yer","Yer İfadeleri","prin","içinden","edat"],
["yer","Yer İfadeleri","spre","-e doğru","edat"],
["yer","Yer İfadeleri","printre","arasından","edat"],
["edat","Edatlar","datorită","sayesinde","edat (dativ)"],
["edat","Edatlar","mulțumită","yardımıyla, sayesinde","edat (dativ)"],
["edat","Edatlar","grație","lütfuyla, sayesinde","edat (dativ)"],
["edat","Edatlar","conform","-e göre","edat (dativ)"],
["edat","Edatlar","potrivit","-e uyarınca","edat (dativ)"],
["edat","Edatlar","contrar","aksine","edat (dativ)"],
["edat","Edatlar","din cauza","yüzünden","edat (gen.)"],
["edat","Edatlar","cu excepția","hariç","edat (gen.)"],
["edat","Edatlar","în ciuda","rağmen","edat (gen.)"],
["edat","Edatlar","în locul","yerine","edat (gen.)"],
["edat","Edatlar","în afară de","dışında","edat (acuz.)"],
["soru","Soru Sözcükleri","al cui","kimin (eril)","soru"],
["soru","Soru Sözcükleri","a cui","kimin (dişil)","soru"],
["soru","Soru Sözcükleri","cui","kime","soru"],
["soru","Soru Sözcükleri","pe cine","kimi","soru"],
["soru","Soru Sözcükleri","cât","ne kadar (eril)","soru"],
["soru","Soru Sözcükleri","câtă","ne kadar (dişil)","soru"],
["soru","Soru Sözcükleri","câți","kaç (eril)","soru"],
["soru","Soru Sözcükleri","câte","kaç (dişil)","soru"],
["soru","Soru Sözcükleri","de câte ori","kaç kez","soru"],
["ozellik","Kişisel Özellikler","destul de","yeterince","zarf"],
["ozellik","Kişisel Özellikler","prea","fazla","zarf"],
["ozellik","Kişisel Özellikler","cam","yaklaşık, aşağı yukarı","zarf"],
["ozellik","Kişisel Özellikler","aproximativ","yaklaşık olarak","zarf"],
["ozellik","Kişisel Özellikler","sigur","elbette","zarf"],
["ozellik","Kişisel Özellikler","poate","belki","zarf"],
["ozellik","Kişisel Özellikler","împreună","birlikte","zarf"],
["ozellik","Kişisel Özellikler","doar","sadece","zarf"],
["ozellik","Kişisel Özellikler","atât","o kadar","zarf"],
["ozellik","Kişisel Özellikler","ba da","aksine evet","zarf"],
["ozellik","Kişisel Özellikler","un pic","biraz","zarf"],
["ozellik","Kişisel Özellikler","mai puțin","daha az","karşılaştırma"],
["ozellik","Kişisel Özellikler","cel mai","en (eril)","karşılaştırma"],
["ozellik","Kişisel Özellikler","cea mai","en (dişil)","karşılaştırma"],
["ozellik","Kişisel Özellikler","la fel de","kadar (eşitlik)","karşılaştırma"],
];

/* ---------- 3. FİİL: [ro, tr, [eu,tu,el,noi,voi,ei], participiu, grup, conjunctiv3] ---------- */
/* A1'deki VERBS ile aynı düzen + 6. eleman olarak conjunctiv 3. şahıs. */
const VERBS_A2 = [
["a angaja","işe almak",["angajez","angajezi","angajează","angajăm","angajați","angajează"],"angajat","I (-ez)","să angajeze"],
["a răci","üşütmek",["răcesc","răcești","răcește","răcim","răciți","răcesc"],"răcit","IV (-esc)","să răcească"],
["a tuna","gök gürlemek",["—","—","tună","—","—","—"],"tunat","I (impers., yalnız 3. şahıs)","să tune"],
["a fulgera","şimşek çakmak",["—","—","fulgeră","—","—","—"],"fulgerat","I (impers., yalnız 3. şahıs)","să fulgere"],
["a se încălța","ayakkabı giymek",["mă încalț","te încalți","se încalță","ne încălțăm","vă încălțați","se încalță"],"încălțat","I","să se încalțe"],
["a se descălța","ayakkabı çıkarmak",["mă descalț","te descalți","se descalță","ne descălțăm","vă descălțați","se descalță"],"descălțat","I","să se descalțe"],
["a se șterge","kurulanmak",["mă șterg","te ștergi","se șterge","ne ștergem","vă ștergeți","se șterg"],"șters","III (-e)","să se șteargă"],
["a pescui","balık tutmak",["pescuiesc","pescuiești","pescuiește","pescuim","pescuiți","pescuiesc"],"pescuit","IV (-iesc)","să pescuiască"],
["a călări","ata binmek",["călăresc","călărești","călărește","călărim","călăriți","călăresc"],"călărit","IV (-esc)","să călărească"],
["a ieși","çıkmak",["ies","ieși","iese","ieșim","ieșiți","ies"],"ieșit","IV (-i)","să iasă"],
["a face cumpărături","alışveriş yapmak",["fac cumpărături","faci cumpărături","face cumpărături","facem cumpărături","faceți cumpărături","fac cumpărături"],"făcut cumpărături","III (-e)","să facă cumpărături"],
["a face plajă","güneşlenmek",["fac plajă","faci plajă","face plajă","facem plajă","faceți plajă","fac plajă"],"făcut plajă","III (-e)","să facă plajă"],
["a gusta","tatmak",["gust","guști","gustă","gustăm","gustați","gustă"],"gustat","I","să guste"],
["a recomanda","tavsiye etmek",["recomand","recomanzi","recomandă","recomandăm","recomandați","recomandă"],"recomandat","I","să recomande"],
["a petrece","vakit geçirmek",["petrec","petreci","petrece","petrecem","petreceți","petrec"],"petrecut","III (-e)","să petreacă"],
["a se distra","eğlenmek",["mă distrez","te distrezi","se distrează","ne distrăm","vă distrați","se distrează"],"distrat","I (-ez)","să se distreze"],
["a admira","hayran olmak",["admir","admiri","admiră","admirăm","admirați","admiră"],"admirat","I","să admire"],
["a filma","film çekmek",["filmez","filmezi","filmează","filmăm","filmați","filmează"],"filmat","I (-ez)","să filmeze"],
["a consulta","muayene etmek",["consult","consulți","consultă","consultăm","consultați","consultă"],"consultat","I","să consulte"],
["a aresta","tutuklamak",["arestez","arestezi","arestează","arestăm","arestați","arestează"],"arestat","I (-ez)","să aresteze"],
["a preda","ders vermek",["predau","predai","predă","predăm","predați","predau"],"predat","I","să predea"],
["a închiria","kiralamak",["închiriez","închiriezi","închiriază","închiriem","închiriați","închiriază"],"închiriat","I (-ez)","să închirieze"],
["a invita","davet etmek",["invit","inviți","invită","invităm","invitați","invită"],"invitat","I","să invite"],
["a felicita","tebrik etmek",["felicit","feliciți","felicită","felicităm","felicitați","felicită"],"felicitat","I","să felicite"],
["a oferi","sunmak",["ofer","oferi","oferă","oferim","oferiți","oferă"],"oferit","IV (-i)","să ofere"],
["a se odihni","dinlenmek",["mă odihnesc","te odihnești","se odihnește","ne odihnim","vă odihniți","se odihnesc"],"odihnit","IV (-esc)","să se odihnească"],
["a se grăbi","acele etmek",["mă grăbesc","te grăbești","se grăbește","ne grăbim","vă grăbiți","se grăbesc"],"grăbit","IV (-esc)","să se grăbească"],
["a se întâlni","buluşmak",["mă întâlnesc","te întâlnești","se întâlnește","ne întâlnim","vă întâlniți","se întâlnesc"],"întâlnit","IV (-esc)","să se întâlnească"],
["a se muta","taşınmak",["mă mut","te muți","se mută","ne mutăm","vă mutați","se mută"],"mutat","I","să se mute"],
["a se căsători","evlenmek",["mă căsătoresc","te căsătorești","se căsătorește","ne căsătorim","vă căsătoriți","se căsătoresc"],"căsătorit","IV (-esc)","să se căsătorească"],
["a se naște","doğmak",["mă nasc","te naști","se naște","ne naștem","vă nașteți","se nasc"],"născut","III (-e)","să se nască"],
["a se simți","kendini ... hissetmek",["mă simt","te simți","se simte","ne simțim","vă simțiți","se simt"],"simțit","IV (-i)","să se simtă"],
["a se ocupa","ilgilenmek",["mă ocup","te ocupi","se ocupă","ne ocupăm","vă ocupați","se ocupă"],"ocupat","I","să se ocupe"],
["a se apropia","yaklaşmak",["mă apropii","te apropii","se apropie","ne apropiem","vă apropiați","se apropie"],"apropiat","I","să se apropie"],
["a se îndepărta","uzaklaşmak",["mă îndepărtez","te îndepărtezi","se îndepărtează","ne îndepărtăm","vă îndepărtați","se îndepărtează"],"îndepărtat","I (-ez)","să se îndepărteze"],
["a se opri","durmak",["mă opresc","te oprești","se oprește","ne oprim","vă opriți","se opresc"],"oprit","IV (-esc)","să se oprească"],
["a se întoarce","dönmek",["mă întorc","te întorci","se întoarce","ne întoarcem","vă întoarceți","se întorc"],"întors","III (-e)","să se întoarcă"],
["a se hotărî","karar vermek",["mă hotărăsc","te hotărăști","se hotărăște","ne hotărâm","vă hotărâți","se hotărăsc"],"hotărât","IV (-î/-ăsc)","să se hotărască"],
["a se pregăti","hazırlanmak",["mă pregătesc","te pregătești","se pregătește","ne pregătim","vă pregătiți","se pregătesc"],"pregătit","IV (-esc)","să se pregătească"],
["a se ruga","rica etmek",["mă rog","te rogi","se roagă","ne rugăm","vă rugați","se roagă"],"rugat","I","să se roage"],
["a se teme","korkmak",["mă tem","te temi","se teme","ne temem","vă temeți","se tem"],"temut","III (-e)","să se teamă"],
["a se bucura","sevinmek",["mă bucur","te bucuri","se bucură","ne bucurăm","vă bucurați","se bucură"],"bucurat","I","să se bucure"],
["a se supăra","gücenmek",["mă supăr","te superi","se supără","ne supărăm","vă supărați","se supără"],"supărat","I","să se supere"],
["a se enerva","sinirlenmek",["mă enervez","te enervezi","se enervează","ne enervăm","vă enervați","se enervează"],"enervat","I (-ez)","să se enerveze"],
["a se plictisi","sıkılmak",["mă plictisesc","te plictisești","se plictisește","ne plictisim","vă plictisiți","se plictisesc"],"plictisit","IV (-esc)","să se plictisească"],
["a se obișnui","alışmak",["mă obișnuiesc","te obișnuiești","se obișnuiește","ne obișnuim","vă obișnuiți","se obișnuiesc"],"obișnuit","IV (-iesc)","să se obișnuiască"],
["a se speria","korkmak (ani)",["mă sperii","te sperii","se sperie","ne speriem","vă speriați","se sperie"],"speriat","I","să se sperie"],
["a alege","seçmek",["aleg","alegi","alege","alegem","alegeți","aleg"],"ales","III (-e)","să aleagă"],
["a ajunge","varmak",["ajung","ajungi","ajunge","ajungem","ajungeți","ajung"],"ajuns","III (-e)","să ajungă"],
["a aparține","ait olmak",["aparțin","aparții","aparține","aparținem","aparțineți","aparțin"],"aparținut","III (-e)","să aparțină"],
["a arăta","göstermek",["arăt","arăți","arată","arătăm","arătați","arată"],"arătat","I","să arate"],
["a ajuta","yardım etmek",["ajut","ajuți","ajută","ajutăm","ajutați","ajută"],"ajutat","I","să ajute"],
["a bate","vurmak",["bat","bați","bate","batem","bateți","bat"],"bătut","III (-e)","să bată"],
["a căuta","aramak",["caut","cauți","caută","căutăm","căutați","caută"],"căutat","I","să caute"],
["a cere","istemek",["cer","ceri","cere","cerem","cereți","cer"],"cerut","III (-e)","să ceară"],
["a coborî","inmek",["cobor","cobori","coboară","coborâm","coborâți","coboară"],"coborât","IV (-î)","să coboare"],
["a conduce","araba kullanmak",["conduc","conduci","conduce","conducem","conduceți","conduc"],"condus","III (-e)","să conducă"],
["a crește","büyümek",["cresc","crești","crește","creștem","creșteți","cresc"],"crescut","III (-e)","să crească"],
["a cunoaște","tanımak",["cunosc","cunoști","cunoaște","cunoaștem","cunoașteți","cunosc"],"cunoscut","III (-e)","să cunoască"],
["a dovedi","kanıtlamak",["dovedesc","dovedești","dovedește","dovedim","dovediți","dovedesc"],"dovedit","IV (-esc)","să dovedească"],
["a dura","sürmek",["(durez)","(durezi)","durează","(durăm)","(durați)","durează"],"durat","I (-ez; defectiv, mai ales pers.3)","să dureze"],
["a explica","açıklamak",["explic","explici","explică","explicăm","explicați","explică"],"explicat","I","să explice"],
["a hotărî","kararlaştırmak",["hotărăsc","hotărăști","hotărăște","hotărâm","hotărâți","hotărăsc"],"hotărât","IV (-î/-ăsc)","să hotărască"],
["a împrumuta","ödünç almak/vermek",["împrumut","împrumuți","împrumută","împrumutăm","împrumutați","împrumută"],"împrumutat","I","să împrumute"],
["a încerca","denemek",["încerc","încerci","încearcă","încercăm","încercați","încearcă"],"încercat","I","să încerce"],
["a îndrăzni","cesaret etmek",["îndrăznesc","îndrăznești","îndrăznește","îndrăznim","îndrăzniți","îndrăznesc"],"îndrăznit","IV (-esc)","să îndrăznească"],
["a lăsa","bırakmak",["las","lași","lasă","lăsăm","lăsați","lasă"],"lăsat","I","să lase"],
["a lipsi","eksik olmak",["lipsesc","lipsești","lipsește","lipsim","lipsiți","lipsesc"],"lipsit","IV (-esc)","să lipsească"],
["a merita","hak etmek",["merit","meriți","merită","merităm","meritați","merită"],"meritat","I","să merite"],
["a muri","ölmek",["mor","mori","moare","murim","muriți","mor"],"murit","IV (-i)","să moară"],
["a naște","doğurmak",["nasc","naști","naște","naștem","nașteți","nasc"],"născut","III (-e)","să nască"],
["a observa","fark etmek",["observ","observi","observă","observăm","observați","observă"],"observat","I","să observe"],
["a permite","izin vermek",["permit","permiți","permite","permitem","permiteți","permit"],"permis","III (-e)","să permită"],
["a pierde","kaybetmek",["pierd","pierzi","pierde","pierdem","pierdeți","pierd"],"pierdut","III (-e)","să piardă"],
["a plictisi","sıkmak",["plictisesc","plictisești","plictisește","plictisim","plictisiți","plictisesc"],"plictisit","IV (-esc)","să plictisească"],
["a pregăti","hazırlamak",["pregătesc","pregătești","pregătește","pregătim","pregătiți","pregătesc"],"pregătit","IV (-esc)","să pregătească"],
["a promite","söz vermek",["promit","promiți","promite","promitem","promiteți","promit"],"promis","III (-e)","să promită"],
["a pune","koymak",["pun","pui","pune","punem","puneți","pun"],"pus","III (-e)","să pună"],
["a purta","giymek/taşımak",["port","porți","poartă","purtăm","purtați","poartă"],"purtat","I","să poarte"],
["a repara","tamir etmek",["repar","repari","repară","reparăm","reparați","repară"],"reparat","I","să repare"],
["a repeta","tekrar etmek",["repet","repeți","repetă","repetăm","repetați","repetă"],"repetat","I","să repete"],
["a rezolva","çözmek",["rezolv","rezolvi","rezolvă","rezolvăm","rezolvați","rezolvă"],"rezolvat","I","să rezolve"],
["a rămâne","kalmak",["rămân","rămâi","rămâne","rămânem","rămâneți","rămân"],"rămas","III (-e)","să rămână"],
["a ridica","kaldırmak",["ridic","ridici","ridică","ridicăm","ridicați","ridică"],"ridicat","I","să ridice"],
["a rupe","yırtmak",["rup","rupi","rupe","rupem","rupeți","rup"],"rupt","III (-e)","să rupă"],
["a saluta","selamlamak",["salut","saluți","salută","salutăm","salutați","salută"],"salutat","I","să salute"],
["a scoate","çıkarmak",["scot","scoți","scoate","scoatem","scoateți","scot"],"scos","III (-e)","să scoată"],
["a simți","hissetmek",["simt","simți","simte","simțim","simțiți","simt"],"simțit","IV (-i)","să simtă"],
["a suna","telefon etmek",["sun","suni","sună","sunăm","sunați","sună"],"sunat","I","să sune"],
["a tăia","kesmek",["tai","tai","taie","tăiem","tăiați","taie"],"tăiat","I","să taie"],
["a termina","bitirmek",["termin","termini","termină","terminăm","terminați","termină"],"terminat","I","să termine"],
["a traduce","çevirmek",["traduc","traduci","traduce","traducem","traduceți","traduc"],"tradus","III (-e)","să traducă"],
["a trece","geçmek",["trec","treci","trece","trecem","treceți","trec"],"trecut","III (-e)","să treacă"],
["a trimite","göndermek",["trimit","trimiți","trimite","trimitem","trimiteți","trimit"],"trimis","III (-e)","să trimită"],
["a urca","çıkmak/binmek",["urc","urci","urcă","urcăm","urcați","urcă"],"urcat","I","să urce"],
["a ura","dilemek",["urez","urezi","urează","urăm","urați","urează"],"urat","I (-ez)","să ureze"],
["a vinde","satmak",["vând","vinzi","vinde","vindem","vindeți","vând"],"vândut","III (-e)","să vândă"],
["a visa","rüya görmek",["visez","visezi","visează","visăm","visați","visează"],"visat","I (-ez)","să viseze"],
["a zâmbi","gülümsemek",["zâmbesc","zâmbești","zâmbește","zâmbim","zâmbiți","zâmbesc"],"zâmbit","IV (-esc)","să zâmbească"],
["a zice","demek",["zic","zici","zice","zicem","ziceți","zic"],"zis","III (-e)","să zică"],
];

/* ---------- 4. KALIP İFADELER: [romence, türkçe, kategori] ---------- */
const EXPRESII_A2 = [
["Ce mai faci?","Nasılsın?","hâl hatır"],["Așa și așa.","Şöyle böyle.","hâl hatır"],
["Mă descurc.","İdare ediyorum.","hâl hatır"],["Ce mai e nou?","Ne var ne yok?","hâl hatır"],
["Nimic deosebit.","Özel bir şey yok.","hâl hatır"],["Nu prea bine.","Pek iyi değil.","hâl hatır"],
["Îmi pare bine de cunoștință.","Tanıştığımıza memnun oldum.","tanışma"],
["Încântat de cunoștință.","Memnun oldum.","tanışma"],["Mă bucur să te cunosc.","Seninle tanıştığıma sevindim.","tanışma"],
["Cum vă numiți?","Adınız ne?","tanışma"],["Numele meu este...","Benim adım...","tanışma"],
["Cu plăcere.","Rica ederim.","nezaket"],["Pentru puțin.","Bir şey değil.","nezaket"],
["N-ai pentru ce.","Ne demek, rica ederim.","nezaket"],["Poftim.","Buyur.","nezaket"],
["Nu-i nimic.","Önemli değil.","nezaket"],["Nicio problemă.","Sorun değil.","nezaket"],
["Îmi pare rău.","Üzgünüm.","özür"],["Îmi cer scuze.","Özür dilerim.","özür"],
["Scuzați-mă!","Affedersiniz!","özür"],["Nu am făcut-o intenționat.","Bilerek yapmadım.","özür"],
["Nu-i nimic, se întâmplă.","Önemli değil, olur öyle.","özür"],
["Ce părere ai?","Ne düşünüyorsun?","görüş"],["După părerea mea...","Bence...","görüş"],
["Sunt de acord.","Aynı fikirdeyim.","görüş"],["Nu sunt de acord.","Katılmıyorum.","görüş"],
["Ai dreptate.","Haklısın.","görüş"],["Nu ai dreptate.","Haksızsın.","görüş"],
["Depinde.","Duruma bağlı.","görüş"],["Sigur că da.","Tabii ki.","görüş"],
["Cu siguranță.","Kesinlikle.","görüş"],["Bineînțeles.","Elbette.","görüş"],
["Desigur.","Tabii.","görüş"],["Din păcate...","Maalesef...","görüş"],
["Nu contează.","Fark etmez.","görüş"],
["Nu înțeleg.","Anlamıyorum.","iletişim"],["Poți să repeți, te rog?","Tekrar eder misin lütfen?","iletişim"],
["Poți să vorbești mai rar?","Daha yavaş konuşabilir misin?","iletişim"],
["Cum se spune în română?","Romence nasıl denir?","iletişim"],["Ce înseamnă?","Ne demek?","iletişim"],
["Habar n-am.","Hiçbir fikrim yok.","iletişim"],["Un moment, vă rog!","Bir dakika lütfen!","iletişim"],
["Ține-mă la curent!","Beni haberdar et!","iletişim"],["Sunt la curent.","Haberim var.","iletişim"],
["La mulți ani!","Nice yıllara!","dilek"],["Felicitări!","Tebrikler!","dilek"],
["Mult noroc!","Bol şans!","dilek"],["Baftă!","Bol şans!","dilek"],["Succes!","Başarılar!","dilek"],
["Noroc!","Şerefe!","dilek"],["Poftă bună!","Afiyet olsun!","dilek"],["Sănătate!","Çok yaşa!","dilek"],
["Însănătoșire grabnică!","Geçmiş olsun!","dilek"],["Crăciun fericit!","Mutlu Noeller!","dilek"],
["Sărbători fericite!","Bayramınız kutlu olsun!","dilek"],["Paște fericit!","Mutlu Paskalyalar!","dilek"],
["An nou fericit!","Mutlu yıllar!","dilek"],["Casă de piatră!","Bir yastıkta kocayın!","dilek"],
["Drum bun!","İyi yolculuklar!","dilek"],["Călătorie plăcută!","İyi seyahatler!","dilek"],
["Distracție plăcută!","İyi eğlenceler!","dilek"],["O zi bună!","İyi günler dilerim!","dilek"],
["Toate cele bune!","Her şey gönlünce olsun!","dilek"],["Numai bine!","Sağlıcakla kal!","dilek"],
["Ai grijă de tine!","Kendine iyi bak!","dilek"],
["Mi-e foame.","Acıktım.","durum"],["Mi-e sete.","Susadım.","durum"],["Mi-e somn.","Uykum var.","durum"],
["Mi-e frig.","Üşüyorum.","durum"],["Mi-e cald.","Sıcak bastı.","durum"],["Mi-e dor de tine.","Seni özledim.","durum"],
["Mi-e frică.","Korkuyorum.","durum"],["Sunt obosit.","Yorgunum.","durum"],
["Mă simt rău.","Kendimi kötü hissediyorum.","durum"],["Mă simt bine.","Kendimi iyi hissediyorum.","durum"],
["M-am săturat.","Doydum. / Bıktım.","durum"],["Mă grăbesc.","Acelem var.","durum"],
["Am întârziat.","Geç kaldım.","durum"],["Abia aștept!","Sabırsızlanıyorum!","durum"],
["Cât costă?","Ne kadar?","pratik"],["Cât face în total?","Toplam ne kadar tutuyor?","pratik"],
["Nota, vă rog!","Hesap lütfen!","pratik"],["Aș dori...","...istiyorum (kibar).","pratik"],
["Ce ne recomandați?","Bize ne tavsiye edersiniz?","pratik"],["Unde este...?","... nerede?","pratik"],
["Cum ajung la...?","...'ya nasıl giderim?","pratik"],["M-am rătăcit.","Kayboldum.","pratik"],
["Am nevoie de ajutor!","Yardıma ihtiyacım var!","pratik"],["Pot să te ajut?","Yardım edebilir miyim?","pratik"],
["Cât e ceasul?","Saat kaç?","pratik"],["Nu am nimic împotrivă.","Benim için sakıncası yok.","pratik"],
["Merită.","Değer.","pratik"],["Nu face nimic.","Zararı yok.","pratik"],
["Pot să probez?","Deneyebilir miyim?","pratik"],["Am o rezervare.","Rezervasyonum var.","pratik"],
["Mergeți drept înainte.","Dümdüz gidin.","pratik"],["La dreapta / La stânga.","Sağa / Sola.","pratik"],
];

/* ---------- 5. CÜMLELER: [romence, türkçe] ---------- */
/* A2 dilbilgisini gösteren örnek cümleler; kelime sıralama ve çeviri
   alıştırmalarında kullanılır. Ses dosyası yoksa "listen" modu sunulmaz. */
const SENTENCES_A2 = [
["Îi dau cartea fetei.","Kitabı kıza veriyorum."],
["Le trimit un mesaj părinților.","Anne babaya bir mesaj gönderiyorum."],
["Îi spun adevărul profesorului.","Gerçeği öğretmene söylüyorum."],
["Îi mulțumesc doctorului.","Doktora teşekkür ediyorum."],
["Am cumpărat un cadou surorii mele.","Kız kardeşime bir hediye aldım."],
["Îmi place cafeaua fără zahăr.","Şekersiz kahveyi severim."],
["Îmi plac florile de primăvară.","İlkbahar çiçeklerini severim."],
["Mi-a plăcut foarte mult filmul.","Film çok hoşuma gitti."],
["Nu-mi place să mă trezesc devreme.","Erken kalkmayı sevmiyorum."],
["Mi-e dor de familia mea.","Ailemi özledim."],
["Îmi trebuie o umbrelă.","Bir şemsiyeye ihtiyacım var."],
["Mă doare capul de dimineață.","Sabahtan beri başım ağrıyor."],
["Mă interesează istoria României.","Romanya tarihi ilgimi çekiyor."],
["Acest oraș este foarte frumos.","Bu şehir çok güzel."],
["Cartea aceasta este a mea.","Bu kitap benim."],
["Acei copii sunt vecinii noștri.","O çocuklar bizim komşularımız."],
["Vreau acea rochie, nu aceasta.","Şu elbiseyi istiyorum, bunu değil."],
["Prețul acestui telefon este mare.","Bu telefonun fiyatı yüksek."],
["Filmul pe care l-am văzut a fost bun.","İzlediğim film iyiydi."],
["Fata care lucrează aici e sora mea.","Burada çalışan kız, kız kardeşim."],
["Casa în care locuiesc este veche.","İçinde oturduğum ev eski."],
["Prietenul cu care am vorbit e doctor.","Konuştuğum arkadaş doktor."],
["Aceasta este cartea pe care o citesc.","Bu, okuduğum kitap."],
["El o să meargă la doctor mâine.","O yarın doktora gidecek."],
["Ei o să vină la petrecere.","Onlar partiye gelecekler."],
["Vreau să citească toată cartea.","Bütün kitabı okumasını istiyorum."],
["Trebuie să plece devreme.","Erken çıkması gerekiyor."],
["Sper să fie bine.","İyi olmasını umuyorum."],
["Citește textul, te rog!","Metni oku lütfen!"],
["Nu pleca încă!","Henüz gitme!"],
["Ajută-mă, te rog!","Bana yardım et lütfen!"],
["Nu-mi spune nimic!","Bana hiçbir şey söyleme!"],
["Să așteptați aici, vă rog!","Lütfen burada bekleyin!"],
["Grăbește-te, e târziu!","Acele et, geç oldu!"],
["Mașina este în fața casei.","Araba evin önünde."],
["Ne plimbăm în jurul lacului.","Gölün etrafında geziyoruz."],
["Din cauza ploii am întârziat.","Yağmur yüzünden geciktim."],
["Datorită ție am terminat la timp.","Senin sayende zamanında bitirdim."],
["În timpul verii mergem la mare.","Yazın denize gideriz."],
["Toți au venit cu excepția Anei.","Ana hariç herkes geldi."],
["Conform programului, plecăm la opt.","Programa göre sekizde çıkıyoruz."],
["Casa mea este mai mare decât a ta.","Benim evim seninkinden büyük."],
["El este la fel de înalt ca mine.","O benim kadar uzun boylu."],
["Acesta este cel mai bun restaurant din oraș.","Bu, şehirdeki en iyi restoran."],
["Rochia este mai puțin scumpă decât pantofii.","Elbise ayakkabılardan daha az pahalı."],
["Nu am niciun ban la mine.","Üzerimde hiç param yok."],
["Nu cunosc pe nimeni aici.","Burada kimseyi tanımıyorum."],
["Nu știu nimic despre asta.","Bu konuda hiçbir şey bilmiyorum."],
["Nu merg niciodată acolo.","Oraya asla gitmem."],
["Eu citesc, iar el se uită la televizor.","Ben okuyorum, o ise televizyon izliyor."],
["Am vrut să vin, însă n-am putut.","Gelmek istedim ama yapamadım."],
["Nu este alb, ci negru.","Beyaz değil, siyah."],
["N-am avut bani, deci n-am cumpărat.","Param yoktu, bu yüzden almadım."],
["După ce termin, te sun.","Bitirdikten sonra seni ararım."],
["Te-am sunat ca să îți mulțumesc.","Sana teşekkür etmek için aradım."],
["Locuiesc la etajul al treilea.","Üçüncü katta oturuyorum."],
["Astăzi este a doua zi de vacanță.","Bugün tatilin ikinci günü."],
["Am fost acolo o dată.","Oraya bir kez gittim."],
["Am citit cartea de două ori.","Kitabı iki kez okudum."],
["O aștept pe Maria la gară.","Maria'yı garda bekliyorum."],
["Îl cunosc pe profesorul tău.","Öğretmenini tanıyorum."],
["Citesc o carte interesantă.","İlginç bir kitap okuyorum."],
["M-am trezit devreme sâmbătă.","Cumartesi erken uyandım."],
["Ne-am întâlnit la o cafenea.","Bir kafede buluştuk."],
["O să mă odihnesc puțin.","Biraz dinleneceğim."],
["Îmi amintesc de vacanța trecută.","Geçen tatili hatırlıyorum."],
["Nu-mi amintesc numele lui.","Onun adını hatırlamıyorum."],
["Ne vom întâlni săptămâna viitoare.","Gelecek hafta buluşacağız."],
["Copiii se joacă în spatele blocului.","Çocuklar apartmanın arkasında oynuyor."],
["Vremea este destul de rece astăzi.","Hava bugün oldukça soğuk."],
["Costă cam cincizeci de lei.","Yaklaşık elli ley tutuyor."],
["Vin pe la ora șapte.","Yedi civarında geliyorum."],
["Lunea merg la cursul de română.","Pazartesileri Romence kursuna giderim."],
];
/* =============================================================================
   6. A2 DİLBİLGİSİ ALIŞTIRMA VERİSİ
   =============================================================================
   Her dizi bir alıştırma konusuna karşılık gelir. Konu anahtarları
   GRAMMAR_TOPICS_A2 dizisinde toplanmıştır; exerciseForGrammarA2()
   fonksiyonu bunları A1'deki exerciseForGrammar() ile aynı biçimde
   {kind:"mc"|"type", prompt, answer, ...} nesnesine dönüştürür.
   ============================================================================= */

/* --- 6.1 DATIV: isimden dativ belirli biçim üretme — [belirsiz, cins, dativ] --- */
const DATIV_ITEMS = [
["fată","dişil","fetei"],["casă","dişil","casei"],["carte","dişil","cărții"],["stradă","dişil","străzii"],
["ușă","dişil","ușii"],["femeie","dişil","femeii"],["cafea","dişil","cafelei"],["familie","dişil","familiei"],
["cheie","dişil","cheii"],["soră","dişil","surorii"],["seară","dişil","serii"],["floare","dişil","florii"],
["masă","dişil","mesei"],["mamă","dişil","mamei"],["școală","dişil","școlii"],["țară","dişil","țării"],
["mașină","dişil","mașinii"],["cameră","dişil","camerei"],["prietenă","dişil","prietenei"],["bunică","dişil","bunicii"],
["băiat","eril","băiatului"],["om","eril","omului"],["profesor","eril","profesorului"],["frate","eril","fratelui"],
["câine","eril","câinelui"],["tată","eril","tatălui"],["copil","eril","copilului"],["doctor","eril","doctorului"],
["prieten","eril","prietenului"],["scaun","nötr","scaunului"],["tren","nötr","trenului"],["oraș","nötr","orașului"],
["telefon","nötr","telefonului"],["birou","nötr","biroului"],
["băieți","eril çoğul","băieților"],["fete","dişil çoğul","fetelor"],["copii","eril çoğul","copiilor"],
["oameni","eril çoğul","oamenilor"],["cărți","dişil çoğul","cărților"],["scaune","nötr çoğul","scaunelor"],
];

/* --- 6.2 DATIV ZAMİR: [cümle(___), doğru, türkçe, çeldiriciler] --- */
const DATIVPRON_ITEMS = [
["___ dau cartea fetei.","Îi","Kitabı kıza veriyorum.",["Îl","O","Le"]],
["___ spun copiilor o poveste.","Le","Çocuklara bir hikâye anlatıyorum.",["Îi","Îl","Le-am"]],
["___ place cafeaua?","Îți","Kahveyi sever misin?",["Te","Tu","Ție"]],
["Maria ___ trimite un mesaj.","îmi","Maria bana bir mesaj gönderiyor.",["mă","mie","mi"]],
["___ mulțumesc pentru ajutor.","Vă","Yardımınız için teşekkür ederim.",["Vouă","Voi","Pe voi"]],
["___ foame.","Mi-e","Acıktım.",["Îmi e","Mie e","Eu am"]],
["___ place filmul acesta.","Nu-mi","Bu film hoşuma gitmiyor.",["Nu mie","Nu mă","Nu-l"]],
["___ spus adevărul ieri.","I-am","Ona dün gerçeği söyledim.",["Îi am","L-am","O am"]],
["___ dea banii mâine.","O să-ți","Yarın sana parayı verecek.",["O să ție","O să te","O să-l"]],
["Profesorul ___ explică lecția studenților.","le","Öğretmen dersi öğrencilere açıklıyor.",["îi","îl","o"]],
["___ este dor de casă.","Ne","Evimizi özledik.",["Nouă","Noi","Ni"]],
["Vreau ___ spun ceva.","să-ți","Sana bir şey söylemek istiyorum.",["să ție","să te","să-l"]],
];

/* --- 6.3 A-I PLĂCEA uyumu: [cümle(___), doğru, türkçe, çeldiriciler] --- */
const PLACEA_ITEMS = [
["Îmi ___ cafeaua.","place","Kahveyi severim.",["plac","plăcut","placă"]],
["Îmi ___ florile.","plac","Çiçekleri severim.",["place","plăcut","placă"]],
["Îți ___ filmele de acțiune?","plac","Aksiyon filmlerini sever misin?",["place","placă","plăcea"]],
["Ne ___ să călătorim.","place","Seyahat etmeyi severiz.",["plac","placă","plăcut"]],
["Le ___ munții.","plac","Dağları severler.",["place","placă","plăcut"]],
["Mi-___ plăcut concertul.","a","Konser hoşuma gitti.",["au","e","ar"]],
["Mi-___ plăcut toate cântecele.","au","Bütün şarkılar hoşuma gitti.",["a","e","ar"]],
["Nu-mi ___ să mă trezesc devreme.","place","Erken kalkmayı sevmiyorum.",["plac","placă","plăcut"]],
["Vă ___ mâncarea românească?","place","Romen yemeklerini sever misiniz?",["plac","placă","plăcut"]],
["O să-mi ___ sigur.","placă","Kesin hoşuma gidecek.",["place","plac","plăcut"]],
];

/* --- 6.4 DATIV mı ACUZATIV mı: [cümle(___), doğru, türkçe, çeldiriciler] --- */
const DATACUZ_ITEMS = [
["___ doare capul.","Mă","Başım ağrıyor.",["Îmi","Mie","Mi-e"]],
["___ place ciocolata.","Îmi","Çikolatayı severim.",["Mă","Pe mine","Mie"]],
["___ interesează istoria.","Mă","Tarih ilgimi çekiyor.",["Îmi","Mie","Mi"]],
["___ trebuie o umbrelă.","Îmi","Bir şemsiyeye ihtiyacım var.",["Mă","Pe mine","Eu"]],
["___ dor picioarele.","Mă","Ayaklarım ağrıyor.",["Îmi","Mie","Mi"]],
["___ deranjează zgomotul.","Mă","Gürültü beni rahatsız ediyor.",["Îmi","Mie","Mi"]],
["___ lipsește ceva.","Îmi","Bir şey eksik (bende).",["Mă","Pe mine","Eu"]],
["___ pare rău.","Îmi","Üzgünüm.",["Mă","Mie","Eu"]],
["___ doare pe Maria.","O","Maria'nın canı acıyor.",["Îi","Îl","Le"]],
["___ place lui Ion să citească.","Îi","Ion okumayı sever.",["Îl","O","Le"]],
];

/* --- 6.5 İŞARET SIFATI: [isim, cins/sayı, doğru, çeldiriciler] --- */
const DEMONS_ITEMS = [
["om","eril tekil","acest",["această","acești","aceste"]],
["fată","dişil tekil","această",["acest","acești","aceste"]],
["copii","eril çoğul","acești",["acest","aceste","această"]],
["cărți","dişil çoğul","aceste",["acest","această","acești"]],
["oraș","nötr tekil","acest",["această","aceste","acești"]],
["casă","dişil tekil","această",["acest","acei","acele"]],
["băieți","eril çoğul","acei",["acea","acele","acel"]],
["rochie","dişil tekil","acea",["acel","acei","acele"]],
["studenți","eril çoğul","acei",["acele","acea","acel"]],
["flori","dişil çoğul","acele",["acei","acel","acea"]],
];

/* --- 6.6 acesta/acela uzun biçim ve aceea/aceia tuzağı --- */
const DEMONSLONG_ITEMS = [
["Fata ___ este sora mea.","aceea","O kız kız kardeşim.",["aceia","acela","acelea"]],
["Copiii ___ sunt vecinii mei.","aceia","O çocuklar komşularım.",["aceea","acelea","acela"]],
["Omul ___ lucrează aici.","acesta","Bu adam burada çalışıyor.",["aceasta","aceștia","acestea"]],
["Cărțile ___ sunt noi.","acestea","Bu kitaplar yeni.",["aceasta","acesta","aceștia"]],
["Prietenii ___ vin diseară.","aceștia","Bu arkadaşlar bu akşam geliyor.",["acestea","aceasta","acesta"]],
["Mașina ___ e prea scumpă.","aceea","O araba çok pahalı.",["aceia","acela","acelea"]],
];

/* --- 6.7 CARE + zorunlu klitik: [cümle(___), doğru, türkçe, çeldiriciler] --- */
const CARE_ITEMS = [
["Cartea pe care ___ citesc este bună.","o","Okuduğum kitap iyi.",["îl","îi","le"]],
["Filmul pe care ___ văzut a fost lung.","l-am","İzlediğim film uzundu.",["o am","i-am","le-am"]],
["Prietenii pe care ___ invitat au venit.","i-am","Davet ettiğim arkadaşlar geldi.",["l-am","le-am","o am"]],
["Florile pe care ___ cumpărat sunt frumoase.","le-am","Aldığım çiçekler güzel.",["l-am","i-am","o am"]],
["Fata căreia ___ telefonat este colega mea.","i-am","Telefon ettiğim kız meslektaşım.",["le-am","l-am","o am"]],
["Oamenii cărora ___ mulțumit au plecat.","le-am","Teşekkür ettiğim insanlar gitti.",["i-am","l-am","o am"]],
["Băiatul ___ stă lângă mine e fratele meu.","care","Yanımda oturan çocuk kardeşim.",["pe care","căruia","cărui"]],
["Casa ___ locuiesc este veche.","în care","İçinde oturduğum ev eski.",["pe care","care","căruia"]],
];

/* --- 6.8 CARE / CE ayrımı --- */
const CARECE_ITEMS = [
["Am două pixuri. ___ vrei?","Pe care","İki kalemim var. Hangisini istiyorsun?",["Pe ce","Pe cine","Pe cât"]],
["___ faci acum?","Ce","Şimdi ne yapıyorsun?",["Care","Cine","Cât"]],
["___ este culoarea ta preferată?","Care","En sevdiğin renk hangisi?",["Ce","Cine","Cum"]],
["___ înseamnă cuvântul acesta?","Ce","Bu kelime ne demek?",["Care","Cine","Cât"]],
["___ dintre voi a venit primul?","Care","Hanginiz ilk geldi?",["Ce","Cine","Cât"]],
["___ copii ai?","Câți","Kaç çocuğun var?",["Câte","Cât","Câtă"]],
["___ apă vrei?","Câtă","Ne kadar su istersin?",["Câți","Câte","Cât"]],
["___ cărți ai citit?","Câte","Kaç kitap okudun?",["Câți","Cât","Câtă"]],
];

/* --- 6.9 CONJUNCTIV 3. ŞAHIS: VERBS_A2'den de üretilebilir, ek liste --- */
const CONJ3_ITEMS = [
["a fi","olmak","să fie"],["a avea","sahip olmak","să aibă"],["a face","yapmak","să facă"],
["a merge","gitmek","să meargă"],["a veni","gelmek","să vină"],["a spune","söylemek","să spună"],
["a da","vermek","să dea"],["a sta","durmak","să stea"],["a lua","almak","să ia"],
["a bea","içmek","să bea"],["a vrea","istemek","să vrea"],["a ști","bilmek","să știe"],
["a putea","yapabilmek","să poată"],["a citi","okumak","să citească"],["a vorbi","konuşmak","să vorbească"],
["a mânca","yemek","să mănânce"],["a pleca","ayrılmak","să plece"],["a învăța","öğrenmek","să învețe"],
["a vedea","görmek","să vadă"],["a plăcea","hoşa gitmek","să placă"],["a începe","başlamak","să înceapă"],
["a rămâne","kalmak","să rămână"],["a cere","istemek","să ceară"],["a vinde","satmak","să vândă"],
["a dormi","uyumak","să doarmă"],["a ieși","çıkmak","să iasă"],["a găsi","bulmak","să găsească"],
["a coborî","inmek","să coboare"],["a hotărî","karar vermek","să hotărască"],["a scrie","yazmak","să scrie"],
];

/* --- 6.10 EMİR KİPİ: [olumlu, olumsuz, türkçe] --- */
const IMPERATIV_ITEMS = [
["Pleacă!","Nu pleca!","Git! / Gitme!"],["Vino!","Nu veni!","Gel! / Gelme!"],
["Citește!","Nu citi!","Oku! / Okuma!"],["Fă!","Nu face!","Yap! / Yapma!"],
["Mergi!","Nu merge!","Git! / Gitme!"],["Spune!","Nu spune!","Söyle! / Söyleme!"],
["Fii cuminte!","Nu fi supărat!","Uslu ol! / Üzülme!"],["Ia!","Nu lua!","Al! / Alma!"],
["Dă!","Nu da!","Ver! / Verme!"],["Stai!","Nu sta!","Dur! / Durma!"],
["Ascultă!","Nu asculta!","Dinle! / Dinleme!"],["Așteaptă!","Nu aștepta!","Bekle! / Bekleme!"],
["Deschide!","Nu deschide!","Aç! / Açma!"],["Închide!","Nu închide!","Kapat! / Kapatma!"],
["Scrie!","Nu scrie!","Yaz! / Yazma!"],["Uită!","Nu uita!","Unut! / Unutma!"],
];

/* --- 6.11 EMİRDE ZAMİR: [fiil+zamir, doğru, türkçe] --- */
const IMPPRON_ITEMS = [
["ajută + mă","Ajută-mă!","Bana yardım et!"],["cheamă + o","Cheam-o!","Onu (kadını) çağır!"],
["sună + o","Sun-o!","Onu (kadını) ara!"],["dă + mi","Dă-mi!","Bana ver!"],
["spune + i","Spune-i!","Ona söyle!"],["spală + te","Spală-te!","Yıkan!"],
["grăbește + te","Grăbește-te!","Acele et!"],["caută + o","Caut-o!","Onu (kadını) ara!"],
["lasă + o","Las-o!","Onu (kadını) bırak!"],["ia + o","Ia-o!","Onu (kadını) al!"],
["cheamă + l","Cheamă-l!","Onu (erkeği) çağır!"],["dă + ne","Dă-ne!","Bize ver!"],
];

/* --- 6.12 EDAT + HAL: [cümle(___), doğru, türkçe, çeldiriciler] --- */
const PREPCASE_ITEMS = [
["Mașina este în fața ___.","casei","Araba evin önünde.",["casă","casa","case"]],
["Lampa e deasupra ___.","mesei","Lamba masanın üstünde.",["masă","masa","mese"]],
["Ne plimbăm în jurul ___.","lacului","Gölün etrafında geziyoruz.",["lac","lacul","lacuri"]],
["Din cauza ___ am întârziat.","ploii","Yağmur yüzünden geciktim.",["ploaie","ploaia","ploi"]],
["Datorită ___ am reușit.","ție","Senin sayende başardım.",["ta","tine","tu"]],
["Stau în fața ___.","ta","Senin önünde duruyorum.",["ție","tine","tu"]],
["Conform ___, trebuie să plătim.","legii","Yasaya göre ödemeliyiz.",["lege","legea","legi"]],
["Toți au venit cu excepția ___.","Mariei","Maria hariç herkes geldi.",["Maria","lui Maria","Mariea"]],
["Pisica este sub ___.","masă","Kedi masanın altında.",["mesei","masa","mese"]],
["Locuiesc în centrul ___.","orașului","Şehir merkezinde oturuyorum.",["oraș","orașul","orașe"]],
["În timpul ___ mergem la mare.","verii","Yazın denize gideriz.",["vară","vara","veri"]],
["Parcul e în spatele ___.","școlii","Park okulun arkasında.",["școală","școala","școli"]],
];

/* --- 6.13 datorită / din cauza --- */
const CAUZA_ITEMS = [
["___ ploii am întârziat.","Din cauza","Yağmur yüzünden geciktim.",["Datorită","Grație","Conform"]],
["___ prietenilor mei am reușit.","Datorită","Arkadaşlarım sayesinde başardım.",["Din cauza","În ciuda","Cu excepția"]],
["___ ta am pierdut trenul.","Din cauza","Senin yüzünden treni kaçırdım.",["Datorită","Grație","Conform"]],
["___ ție am terminat la timp.","Datorită","Senin sayende zamanında bitirdim.",["Din cauza","În locul","În ciuda"]],
["___ frigului am rămas acasă.","Din cauza","Soğuk yüzünden evde kaldım.",["Datorită","Grație","Potrivit"]],
];

/* --- 6.14 SIFAT TİPİ (çekilir mi?): [sıfat, isim öbeği, doğru, çeldirici] --- */
const ADJTIP_ITEMS = [
["gri","costume ___ (gri)","gri","grie"],["roz","rochii ___ (roz)","roz","roze"],
["maro","pantofi ___ (maro)","maro","maroi"],["bej","bluze ___ (bej)","bej","beje"],
["mov","flori ___ (mov)","mov","move"],["roșu","rochii ___ (roșu)","roșii","roșu"],
["verde","mere ___ (verde)","verzi","verde"],["alb","case ___ (alb)","albe","albi"],
["mic","cărți ___ (mic)","mici","mice"],["mare","orașe ___ (mare)","mari","mare"],
["frumos","fete ___ (frumos)","frumoase","frumoși"],["bun","prieteni ___ (bun)","buni","bune"],
["nou","mașini ___ (nou)","noi","nouă"],["dulce","fructe ___ (dulce)","dulci","dulce"],
["scump","haine ___ (scump)","scumpe","scumpi"],["tânăr","studenți ___ (tânăr)","tineri","tinere"],
];

/* --- 6.15 KARŞILAŞTIRMA: [cümle(___), doğru, türkçe, çeldiriciler] --- */
const COMPAR_ITEMS = [
["Casa mea e ___ mare decât a ta.","mai","Benim evim seninkinden büyük.",["cel mai","la fel de","foarte"]],
["El este ___ înalt ca mine.","la fel de","O benim kadar uzun boylu.",["mai","cel mai","mai puțin"]],
["Acesta e ___ bun restaurant din oraș.","cel mai","Bu, şehirdeki en iyi restoran.",["mai","la fel de","mai puțin"]],
["Aceasta e ___ bună soluție.","cea mai","Bu en iyi çözüm.",["cel mai","cei mai","cele mai"]],
["Rochia e ___ scumpă decât pantofii.","mai puțin","Elbise ayakkabılardan daha az pahalı.",["cel mai","cea mai","foarte"]],
["Sunt ___ bune cărți din bibliotecă.","cele mai","Kütüphanedeki en iyi kitaplar.",["cel mai","cea mai","cei mai"]],
["El aleargă mai repede ___ mine.","decât","O benden hızlı koşuyor.",["ca și","la fel","cât de"]],
["Ea este la fel de deșteaptă ___ tine.","ca","O senin kadar akıllı.",["decât","de","cât de"]],
];

/* --- 6.16 OLUMSUZLUK: [cümle(___), doğru, türkçe, çeldiriciler] --- */
const NEGATIV_ITEMS = [
["Nu am ___ ban la mine.","niciun","Üzerimde hiç param yok.",["nici un","nicio","niciunul"]],
["Nu am ___ problemă.","nicio","Hiçbir sorunum yok.",["niciun","nici o","niciuna"]],
["Nu cunosc ___ aici.","pe nimeni","Burada kimseyi tanımıyorum.",["nimeni","pe nimic","nimic"]],
["Nu știu ___ despre asta.","nimic","Bu konuda hiçbir şey bilmiyorum.",["nimeni","niciun","nicio"]],
["Nu merg ___ acolo.","niciodată","Oraya asla gitmem.",["nicăieri","nimic","niciun"]],
["Nu e ___ de găsit.","nicăieri","Hiçbir yerde bulunamıyor.",["niciodată","nimic","niciun"]],
["Nu i-am spus ___.","nimănui","Hiç kimseye söylemedim.",["nimeni","pe nimeni","niciunul"]],
["___ dintre ei nu a venit.","Niciunul","Hiçbiri gelmedi.",["Niciun","Nicio","Nimeni"]],
];

/* --- 6.17 BAĞLAÇLAR: [cümle(___), doğru, türkçe, çeldiriciler] --- */
const BAGLAC_A2_ITEMS = [
["Nu este alb, ___ negru.","ci","Beyaz değil, siyah.",["dar","iar","însă"]],
["Eu citesc, ___ el se uită la TV.","iar","Ben okuyorum, o ise TV izliyor.",["ci","deci","ori"]],
["Am vrut să vin, ___ n-am putut.","însă","Gelmek istedim ama yapamadım.",["ci","iar","deci"]],
["N-am avut bani, ___ n-am cumpărat.","deci","Param yoktu, bu yüzden almadım.",["ci","iar","ori"]],
["___ termin, te sun.","După ce","Bitirdikten sonra seni ararım.",["Deci","Ci","Ori"]],
["Te-am sunat ___ îți mulțumesc.","ca să","Sana teşekkür etmek için aradım.",["deci","ci","după ce"]],
["Am comandat cafea ___ mi-e somn.","din cauză că","Uykum olduğu için kahve söyledim.",["din cauza","deci","ci"]],
["Ori gătim ceva, ___ mâncăm în oraș.","ori","Ya bir şey pişiririz ya da dışarıda yeriz.",["ci","iar","deci"]],
["Nu am mers la mare, ___ la munte.","ci","Denize değil, dağa gittik.",["dar","iar","ori"]],
["Mai întâi mâncăm, ___ mergem la film.","apoi","Önce yemek yeriz, sonra sinemaya gideriz.",["ci","ori","deci"]],
["Au vizitat muzeul. ___, au mers în parc.","De asemenea","Müzeyi gezdiler. Ayrıca parka gittiler.",["Deci","Ci","Ori"]],
["Am întârziat ___ ploii.","din cauza","Yağmur yüzünden geciktim.",["din cauză că","deci","ci"]],
];

/* --- 6.18 SIRA SAYISI: [sayı, cins, doğru] --- */
const ORDINAL_ITEMS = [
["1","eril","primul"],["1","dişil","prima"],["2","eril","al doilea"],["2","dişil","a doua"],
["3","eril","al treilea"],["3","dişil","a treia"],["4","eril","al patrulea"],["4","dişil","a patra"],
["5","eril","al cincilea"],["5","dişil","a cincea"],["6","eril","al șaselea"],["6","dişil","a șasea"],
["7","eril","al șaptelea"],["7","dişil","a șaptea"],["8","eril","al optulea"],["8","dişil","a opta"],
["9","eril","al nouălea"],["9","dişil","a noua"],["10","eril","al zecelea"],["10","dişil","a zecea"],
["12","eril","al doisprezecelea"],["12","dişil","a douăsprezecea"],
["20","eril","al douăzecilea"],["20","dişil","a douăzecea"],["100","eril","al o sutălea"],["100","dişil","a o suta"],
];

/* --- 6.19 PE (belirli nesne): [cümle(___), doğru, türkçe, çeldiriciler] --- */
const PE_ITEMS = [
["O aștept ___ Maria.","pe","Maria'yı bekliyorum.",["la","cu","de"]],
["Îl cunosc ___ profesorul tău.","pe","Öğretmenini tanıyorum.",["la","cu","de"]],
["Citesc ___ cartea.","(boş)","Kitabı okuyorum — cansız nesne, 'pe' yok.",["pe","la","cu"]],
["Cumpăr ___ pâine.","(boş)","Ekmek alıyorum — cansız nesne, 'pe' yok.",["pe","la","de"]],
["Caut ___ un doctor bun.","(boş)","İyi bir doktor arıyorum — belirsiz insan, 'pe' yok.",["pe","la","cu"]],
["___ cine aștepți?","Pe","Kimi bekliyorsun?",["La","Cu","De"]],
["Nu văd ___ nimeni.","pe","Kimseyi görmüyorum.",["la","cu","de"]],
["___ aștept pe Andrei.","Îl","Andrei'yi bekliyorum.",["O","Îi","Le"]],
["___ văd pe Maria.","O","Maria'yı görüyorum.",["Îl","Îi","Le"]],
["___ invitat pe prietenii mei.","I-am","Arkadaşlarımı davet ettim.",["L-am","Le-am","Am"]],
];

/* --- 6.20 DÖNÜŞLÜ FİİL ZAMAN DÖNÜŞÜMÜ: [kaynak, hedefZaman, cevap, türkçe] --- */
const REFLEX_ITEMS = [
["Mă spăl.","perfect compus","M-am spălat.","Yıkandım."],
["Te trezești.","perfect compus","Te-ai trezit.","Uyandın."],
["Se duce.","perfect compus","S-a dus.","Gitti."],
["Ne întâlnim.","perfect compus","Ne-am întâlnit.","Buluştuk."],
["Vă grăbiți.","perfect compus","V-ați grăbit.","Acele ettiniz."],
["Ei se joacă.","perfect compus","Ei s-au jucat.","Onlar oynadılar."],
["Mă odihnesc.","viitor popular","O să mă odihnesc.","Dinleneceğim."],
["Te pregătești.","viitor popular","O să te pregătești.","Hazırlanacaksın."],
["Se întoarce.","viitor popular","O să se întoarcă.","Dönecek."],
["Ne plimbăm.","viitor literar","Ne vom plimba.","Gezineceğiz."],
["Mă spăl.","viitor literar","Mă voi spăla.","Yıkanacağım."],
["Se odihnește.","conjunctiv","să se odihnească","dinlensin"],
["Mă grăbesc.","conjunctiv","să mă grăbesc","acele edeyim"],
["Îmi amintesc.","perfect compus","Mi-am amintit.","Hatırladım."],
["Își aduce aminte.","perfect compus","Și-a adus aminte.","Hatırladı."],
];

/* --- 6.21 KLİTİK YAZIMI: [parçalar, doğru yazım, türkçe] --- */
const KLITIK_ITEMS = [
["nu + îmi + place","nu-mi place","hoşuma gitmiyor"],
["nu + îl + am + văzut","nu l-am văzut","onu görmedim"],
["să + îmi + dea","să-mi dea","bana versin"],
["o să + îl + văd","o să-l văd","onu göreceğim"],
["o să + o + văd","o s-o văd","onu (kadını) göreceğim"],
["îmi + a + spus","mi-a spus","bana söyledi"],
["se + a + dus","s-a dus","gitti"],
["mă + am + spălat","m-am spălat","yıkandım"],
["nu + o + chema","n-o chema","onu çağırma"],
["a + îl + vedea","a-l vedea","onu görmek"],
["nu + mă + ajuta","nu mă ajuta","bana yardım etme"],
["îmi + e + foame","mi-e foame","acıktım"],
];

/* --- 6.22 SES BİLGİSİ (fonetică) --- */
/* [soru tipi, soru, doğru, çeldiriciler, açıklama] */
const FONETIK_ITEMS = [
["oku","\"ghid\" nasıl okunur?","gid",["cid","gıd","hid"],"gh + e/i = SERT G"],
["oku","\"cinci\" nasıl okunur?","çinç",["kinki","sinsi","cinci"],"c + e/i = ç"],
["oku","\"ginere\" nasıl okunur?","cinere",["ginere","çinere","kinere"],"g + e/i = c"],
["oku","\"chef\" nasıl okunur?","kef",["çef","şef","hef"],"ch + e/i = K"],
["oku","\"geam\" nasıl okunur?","cam",["geam","çam","gam"],"ge + a: e okunmaz, g = c"],
["oku","\"examen\" nasıl okunur?","egzamen",["eksamen","ekzamen","eghzamen"],"iki ünlü arasında x = gz"],
["oku","\"excursie\" nasıl okunur?","ekskursie",["egzkursie","eçkursie","ekşkursie"],"ünsüz önünde x = ks"],
["oku","\"țară\" nasıl okunur?","tsarı",["tarı","sarı","çarı"],"ț = ts (Türkçede yok)"],
["hece","\"soare\" kaç hece?","2",["3","1","4"],"oa diftongdur, bölünmez"],
["hece","\"poezie\" kaç hece?","4",["3","2","5"],"oe hiattır, ayrı hecelerde"],
["hece","\"seară\" kaç hece?","2",["3","1","4"],"ea diftongdur"],
["hece","\"alcool\" kaç hece?","3",["2","4","1"],"oo hiattır"],
["hece","\"beau\" kaç hece?","1",["2","3","4"],"eau triftongdur"],
["hece","\"pâine\" kaç hece?","2",["3","1","4"],"âi diftongdur"],
["hece","\"albaștri\" kaç hece?","3",["2","4","1"],"ünsüz+r'den sonra i TAM ünlüdür"],
["cift","\"bir ev\" hangisi?","o casă",["casa","o casa","casă"],"ă = belirsiz, a = belirli"],
["cift","\"o ev (belirli)\" hangisi?","casa",["o casă","casă","casa o"],"son -a belirlilik artikelidir"],
["cift","\"nehir\" hangisi?","râu",["rău","rau","rîu"],"â = ı'ya yakın; ă = farklı ses"],
["cift","\"kötü\" hangisi?","rău",["râu","rau","reu"],"ă sesi"],
["soni","\"lupi\" sondaki i nasıl?","fısıltılı (duyulmaz)",["tam ünlü","yarı ünlü","hiç yok"],"tek ünsüzden sonra fısıltılı"],
["soni","\"albaștri\" sondaki i nasıl?","tam ünlü",["fısıltılı","yarı ünlü","hiç yok"],"ünsüz+r öbeğinden sonra tam ünlü"],
["soni","\"copii\" sondaki i nasıl?","yarı ünlü",["fısıltılı","tam ünlü","hiç yok"],"ünlüden sonra yarı ünlü /j/"],
["yazim","Kelime BAŞINDA hangi harf yazılır?","î",["â","a","ă"],"kelime başı ve sonu î, içi â"],
["yazim","Kelime İÇİNDE hangi harf yazılır?","â",["î","a","ă"],"kelime içi â"],
["yazim","\"neîncetat\" neden î ile?","ne- ön eki + încetat",["kural dışı","yazım hatası","kelime içi"],"ön ek alan î- kelimeleri î'yi korur"],
["vurgu","\"copii\" (çocuklar) vurgusu nerede?","son hece",["ilk hece","ortada","yok"],"copíi = çocuklar; cópii = kopyalar"],
["vurgu","\"carte\" vurgusu nerede?","ilk hece",["son hece","yok","ikisi de"],"cárte — paroxiton"],
];

/* --- 6.23 A2 dilbilgisi konu anahtarları --- */
const GRAMMAR_TOPICS_A2 = ["dativ","dativpron","placea","datacuz","demons","demonslong","care","carece",
  "conj3","imperativ","imppron","prepcase","cauza","adjtip","compar","negativ","baglac2","ordinal","pe",
  "reflex","klitik","fonetik"];

/* Konu adlarının Türkçe etiketleri (arayüzde gösterilir) */
const GRAMMAR_LABELS_A2 = {
  dativ:"Dativ hâli (kime?)", dativpron:"Dativ zamirleri", placea:"a-i plăcea uyumu",
  datacuz:"Dativ mi Acuzativ mi?", demons:"İşaret sıfatları", demonslong:"İşaret zamirleri (uzun)",
  care:"İlgi zamiri care", carece:"Care / Ce / Cât", conj3:"Conjunctiv 3. şahıs",
  imperativ:"Emir kipi", imppron:"Emirde zamir", prepcase:"Edat + hâl", cauza:"datorită / din cauza",
  adjtip:"Sıfat çekimi", compar:"Karşılaştırma", negativ:"Olumsuzluk", baglac2:"Bağlaçlar",
  ordinal:"Sıra sayıları", pe:"pe (belirli nesne)", reflex:"Dönüşlü fiiller", klitik:"Klitik yazımı",
  fonetik:"Ses bilgisi"
};

/* =============================================================================
   7. KİMLİK ATAMA (id)
   =============================================================================
   A1 ilerleme verisiyle çakışmaması için ayrı ön ekler kullanılır.
   Bu blok helpers.js'deki VOCAB/VERBS id atamasından bağımsızdır. */
VOCAB_A2.forEach((v,i)=> v.push("voc_a2_"+i));      // v[5] = id
VERBS_A2.forEach((v,i)=> v.push("ver_a2_"+i));      // v[6] = id
SENTENCES_A2.forEach((s,i)=> s.push("sent_a2_"+i)); // s[2] = id
EXPRESII_A2.forEach((e,i)=> e.push("expr_a2_"+i));  // e[3] = id

/* =============================================================================
   8. ALIŞTIRMA ÜRETİCİLERİ (A2)
   =============================================================================
   A1'deki exerciseForVocab / exerciseForVerb / exerciseForGrammar ile aynı
   sözleşmeyi kullanır: dönen nesne {id, kind, prompt, hint, answer, ...}.
   shuffle(), pick(), getEntry() helpers.js / accounts.js'den gelir. */

/* Çeldirici seçerken hem doğru cevapla hem BİRBİRİYLE aynı metni veren
   maddeleri ele. İki farklı Romence kelimenin Türkçesi aynı olabilir
   (örn. "Mult noroc!" ve "Baftă!" ikisi de "Bol şans!"); bu durumda
   seçeneklerde tekrar oluşur ve soru iki doğru cevaplı hâle gelir. */
function _benzersizCeldirici(havuz, alan, dogru, adet){
  const gorulen = new Set([dogru]);
  const cikti = [];
  for(const x of shuffle(havuz)){
    const deger = alan(x);
    if(gorulen.has(deger)) continue;
    gorulen.add(deger); cikti.push(deger);
    if(cikti.length===adet) break;
  }
  return cikti;
}

/* --- 8.1 Kelime (A2) — A1'deki exerciseForVocab ile aynı mantık, VOCAB_A2 havuzu --- */
function exerciseForVocabA2(v){
  const [theme,themeLabel,ro,tr,not,id] = v;
  const entry = (typeof getEntry==="function") ? getEntry(id) : {box:0};
  const typed = entry.box>=3;
  const dir = Math.random()<0.5 ? "ro2tr" : "tr2ro";
  const farkli = x => x[5]!==id && x[2]!==ro && x[3]!==tr;
  const havuzTema = VOCAB_A2.filter(x=>x[0]===theme && farkli(x));
  const havuz = havuzTema.length>=3 ? havuzTema : VOCAB_A2.filter(farkli);
  if(!typed){
    if(dir==="ro2tr"){
      const secenekler = shuffle([tr, ..._benzersizCeldirici(havuz, d=>d[3], tr, 3)]);
      return {id, kind:"mc", prompt:`"${ro}" ne demek?`, hint:themeLabel, catKey:theme,
              options:secenekler, answer:tr, roDisplay:ro};
    }
    const secenekler = shuffle([ro, ..._benzersizCeldirici(havuz, d=>d[2], ro, 3)]);
    return {id, kind:"mc", prompt:`"${tr}" Romence nedir?`, hint:themeLabel, catKey:theme,
            options:secenekler, answer:ro, roDisplay:ro};
  }
  if(dir==="ro2tr") return {id, kind:"type", prompt:`"${ro}" ne demek? (Türkçe yaz)`, hint:themeLabel,
                            catKey:theme, answer:tr, needsRoChars:false, roDisplay:ro};
  return {id, kind:"type", prompt:`"${tr}" kelimesini Romence yaz.`, hint:themeLabel, catKey:theme,
          answer:ro, needsRoChars:true, roDisplay:ro};
}

/* --- 8.2 Fiil (A2) — şimdiki zaman / participiu / conjunctiv 3. --- */
function exerciseForVerbA2(v){
  const [ro,tr,forms,participiu,grup,conj3,id] = v;
  const entry = (typeof getEntry==="function") ? getEntry(id) : {box:0};
  const modlar = entry.box>=3 ? ["present","past","conj"] : (entry.box>=2 ? ["present","past"] : ["present"]);
  const mode = pick(modlar);
  if(mode==="past"){
    return {id, kind:"type", prompt:`"${ro}" (${tr}) — geçmiş zaman ortacını yaz (a avea + ___).`,
            hint:grup, answer:participiu, needsRoChars:true, roDisplay:participiu};
  }
  if(mode==="conj"){
    return {id, kind:"type", prompt:`"${ro}" (${tr}) — "el/ea" için conjunctiv biçimini yaz (o să ___).`,
            hint:grup+" — conjunctiv 3.", answer:conj3, needsRoChars:true, roDisplay:conj3};
  }
  const p = Math.floor(Math.random()*6);
  if(forms[p]==="—" || forms[p].startsWith("(")){ // kusurlu (defectiv) fiil: yalnız 3. şahıs
    return {id, kind:"type", prompt:`"${ro}" (${tr}) — "el/ea" için şimdiki zaman çekimini yaz.`,
            hint:grup+" — yalnız 3. şahıs", answer:forms[2], needsRoChars:true, roDisplay:forms[2]};
  }
  return {id, kind:"type", prompt:`"${ro}" (${tr}) — "${PERSON_LABEL[p]}" için şimdiki zaman çekimini yaz.`,
          hint:grup, answer:forms[p], needsRoChars:true, roDisplay:forms[p]};
}

/* --- 8.3 Kalıp ifade --- */
function exerciseForExpresie(e){
  const [ro,tr,kat,id] = e;
  const havuz = EXPRESII_A2.filter(x=>x[3]!==id && x[0]!==ro && x[1]!==tr);
  if(Math.random()<0.5){
    return {id, kind:"mc", prompt:`"${ro}" ne demek?`, hint:"Kalıp ifade — "+kat,
            options:shuffle([tr, ..._benzersizCeldirici(havuz, d=>d[1], tr, 3)]), answer:tr, roDisplay:ro};
  }
  return {id, kind:"mc", prompt:`"${tr}" Romence nasıl söylenir?`, hint:"Kalıp ifade — "+kat,
          options:shuffle([ro, ..._benzersizCeldirici(havuz, d=>d[0], ro, 3)]), answer:ro, roDisplay:ro};
}

/* --- 8.4 Cümle (A2) — kelime sıralama veya çeviri --- */
function exerciseForSentenceA2(item){
  /* A1'deki exerciseForSentence ile aynı imza: {ro, tr, id}. Böylece ui.js
     iki seviyede de aynı çağrıyı yapabiliyor. */
  const {ro, tr, id} = item;
  const mode = pick(["order","translate","translate"]);
  if(mode==="translate"){
    if(Math.random()<0.5) return {id, kind:"type", prompt:`"${ro}" ne demek? (Türkçe yaz)`,
                                  hint:"A2 Cümle — Çeviri", answer:tr, needsRoChars:false, roDisplay:ro};
    return {id, kind:"type", prompt:`"${tr}" cümlesini Romence yaz.`, hint:"A2 Cümle — Çeviri",
            answer:ro, needsRoChars:true, roDisplay:ro};
  }
  const kelimeler = ro.replace(/[.!?]+$/,"").split(" ").filter(Boolean);
  return {id, kind:"order", prompt:"Kelimeleri doğru sıraya diz.", hint:"A2 Cümle — Kelime Sırası",
          cue:tr, words:shuffle(kelimeler.slice()), answer:kelimeler.join(" "), roDisplay:ro};
}

/* --- 8.5 Dilbilgisi (A2) --- */
function exerciseForGrammarA2(topic){
  const L = GRAMMAR_LABELS_A2[topic] || topic;
  const mcFromItem = (arr, idPrefix) => {
    const [sent,ans,tr,distr] = pick(arr);
    /* "(boş)" cevabı, boşluğa HİÇBİR ŞEY gelmemesi gerektiği anlamına gelir
       (örn. "pe" edatının kullanılmadığı cansız nesneler). Bu durumda doğru
       Romence gösterimi boşluğun tamamen silinmesiyle elde edilir. */
    const goster = (ans==="(boş)") ? sent.replace(/___ ?/,"") : sent.replace("___",ans);
    return {id:idPrefix, kind:"mc", prompt:sent.replace("___","______"), hint:L, cue:tr,
            options:shuffle([ans,...distr]), answer:ans, roDisplay:goster};
  };

  if(topic==="dativ"){
    const [belirsiz,cins,ans] = pick(DATIV_ITEMS);
    return {id:"gr_a2_dativ", kind:"type",
            prompt:`"${belirsiz}" (${cins}) — dativ/genitiv belirli hâlini yaz. (Örn: kime? — ___)`,
            hint:L, answer:ans, needsRoChars:true, roDisplay:ans};
  }
  if(topic==="dativpron")   return mcFromItem(DATIVPRON_ITEMS,"gr_a2_dativpron");
  if(topic==="placea")      return mcFromItem(PLACEA_ITEMS,"gr_a2_placea");
  if(topic==="datacuz")     return mcFromItem(DATACUZ_ITEMS,"gr_a2_datacuz");
  if(topic==="demonslong")  return mcFromItem(DEMONSLONG_ITEMS,"gr_a2_demonslong");
  if(topic==="care")        return mcFromItem(CARE_ITEMS,"gr_a2_care");
  if(topic==="carece")      return mcFromItem(CARECE_ITEMS,"gr_a2_carece");
  if(topic==="prepcase")    return mcFromItem(PREPCASE_ITEMS,"gr_a2_prepcase");
  if(topic==="cauza")       return mcFromItem(CAUZA_ITEMS,"gr_a2_cauza");
  if(topic==="compar")      return mcFromItem(COMPAR_ITEMS,"gr_a2_compar");
  if(topic==="negativ")     return mcFromItem(NEGATIV_ITEMS,"gr_a2_negativ");
  if(topic==="baglac2")     return mcFromItem(BAGLAC_A2_ITEMS,"gr_a2_baglac2");
  if(topic==="pe")          return mcFromItem(PE_ITEMS,"gr_a2_pe");

  if(topic==="demons"){
    const [isim,tur,ans,distr] = pick(DEMONS_ITEMS);
    return {id:"gr_a2_demons", kind:"mc", prompt:`"${isim}" (${tur}) — doğru işaret sıfatı hangisi?`,
            hint:L, options:shuffle([ans,...distr]), answer:ans, roDisplay:ans+" "+isim};
  }
  if(topic==="conj3"){
    const [mastar,tr,ans] = pick(CONJ3_ITEMS);
    return {id:"gr_a2_conj3", kind:"type",
            prompt:`"${mastar}" (${tr}) — "el/ea" için conjunctiv biçimini yaz. (o să ___)`,
            hint:L, answer:ans, needsRoChars:true, roDisplay:ans};
  }
  if(topic==="imperativ"){
    const [olumlu,olumsuz,tr] = pick(IMPERATIV_ITEMS);
    if(Math.random()<0.5) return {id:"gr_a2_imperativ", kind:"type",
            prompt:`Olumsuz emir yap: "${olumlu}"`, hint:L+" — olumsuzda MASTAR kullanılır",
            cue:tr, answer:olumsuz, needsRoChars:true, roDisplay:olumsuz};
    return {id:"gr_a2_imperativ", kind:"type", prompt:`Olumlu emir yap: "${olumsuz}"`,
            hint:L, cue:tr, answer:olumlu, needsRoChars:true, roDisplay:olumlu};
  }
  if(topic==="imppron"){
    const [parcalar,ans,tr] = pick(IMPPRON_ITEMS);
    return {id:"gr_a2_imppron", kind:"type", prompt:`Birleştir: ${parcalar}`,
            hint:L+" — tire ile yazılır", cue:tr, answer:ans, needsRoChars:true, roDisplay:ans};
  }
  if(topic==="adjtip"){
    const [sifat,obek,ans,yanlis] = pick(ADJTIP_ITEMS);
    return {id:"gr_a2_adjtip", kind:"mc", prompt:obek.replace("___","______"),
            hint:L+" — bazı sıfatlar HİÇ çekilmez", options:shuffle([ans,yanlis]),
            answer:ans, roDisplay:obek.replace("___",ans)};
  }
  if(topic==="ordinal"){
    const [sayi,cins,ans] = pick(ORDINAL_ITEMS);
    return {id:"gr_a2_ordinal", kind:"type", prompt:`"${sayi}" sıra sayısını yaz (${cins}).`,
            hint:L, answer:ans, needsRoChars:true, roDisplay:ans};
  }
  if(topic==="reflex"){
    const [kaynak,hedef,ans,tr] = pick(REFLEX_ITEMS);
    return {id:"gr_a2_reflex", kind:"type", prompt:`"${kaynak}" — ${hedef} biçimine çevir.`,
            hint:L, cue:tr, answer:ans, needsRoChars:true, roDisplay:ans};
  }
  if(topic==="klitik"){
    const [parcalar,ans,tr] = pick(KLITIK_ITEMS);
    return {id:"gr_a2_klitik", kind:"type", prompt:`Doğru yazımı yaz: ${parcalar}`,
            hint:L+" — kısaltma ve tire kuralı", cue:tr, answer:ans, needsRoChars:true, roDisplay:ans};
  }
  if(topic==="fonetik"){
    const [tip,soru,ans,distr,aciklama] = pick(FONETIK_ITEMS);
    return {id:"gr_a2_fonetik", kind:"mc", prompt:soru, hint:"Ses bilgisi — "+aciklama,
            options:shuffle([ans,...distr]), answer:ans, roDisplay:ans};
  }
  return exerciseForGrammarA2("dativpron"); // güvenli geri dönüş
}

/* --- 8.6 A2 havuz özeti (arayüzde ilerleme çubuğu için) --- */
const A2_STATS = {
  kelime: VOCAB_A2.length,
  fiil: VERBS_A2.length,
  cumle: SENTENCES_A2.length,
  ifade: EXPRESII_A2.length,
  gramerKonusu: GRAMMAR_TOPICS_A2.length,
  gramerMaddesi: [DATIV_ITEMS,DATIVPRON_ITEMS,PLACEA_ITEMS,DATACUZ_ITEMS,DEMONS_ITEMS,DEMONSLONG_ITEMS,
    CARE_ITEMS,CARECE_ITEMS,CONJ3_ITEMS,IMPERATIV_ITEMS,IMPPRON_ITEMS,PREPCASE_ITEMS,CAUZA_ITEMS,
    ADJTIP_ITEMS,COMPAR_ITEMS,NEGATIV_ITEMS,BAGLAC_A2_ITEMS,ORDINAL_ITEMS,PE_ITEMS,REFLEX_ITEMS,
    KLITIK_ITEMS,FONETIK_ITEMS].reduce((s,a)=>s+a.length,0)
};
