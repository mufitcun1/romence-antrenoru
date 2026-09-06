/* ============================= HESAPLAR (Basit Kullanıcı Adı/Şifre) =============================
   Aile içinde tek bir uygulama linki paylaşılıyor; herkesin kendi ilerlemesini
   ayrı tutabilmesi ve başka bir cihazda kaldığı yerden devam edebilmesi için
   basit bir hesap sistemi. Yayınlanan TEK belge (ACCOUNTS), TÜM kullanıcıların
   hesap bilgisini ve ilerleme verisini birlikte taşıyor; giriş yapılınca STATE
   değişkeni yalnızca o kullanıcının veri dilimine (ACCOUNTS.accounts[key].data)
   işaret ediyor — böylece geri kalan bütün kod (recordAnswer, dashboard, vb.)
   hiç değişmeden STATE.mastery/testHistory/sessionsCompleted üzerinden çalışmaya
   devam ediyor. Kaydederken (doPublish) STATE, giriş yapmış kullanıcının veri
   dilimine geri yazılıp TÜM belge birlikte yayınlanıyor. İlerleme tarayıcıya
   değil bu sayfanın paylaşılan belgesine kaydedildiği için, aynı hesapla başka
   bir cihazda giriş yapıldığında ilerleme aynen devam ediyor. */
let ACCOUNTS = null;    // {version:2, accounts:{ key:{displayName,salt,hash,data:{mastery,testHistory,sessionsCompleted}} }}
let currentUser = null; // giriş yapmış kullanıcının anahtarı (küçük harf)
let authMode = "login"; // "login" | "register"

/* ---- MİSAFİR MODU ----
   Uygulamayı açan herkesin önce şifre yazmak zorunda olması, Play Store'dan
   indiren kullanıcının hiçbir şey görmeden kaybedildiği yerdi. Misafir modunda
   hesap olmadan pratik yapılabiliyor; ilerleme bu cihazın localStorage'ında
   AYRI bir anahtarda tutuluyor (ACCOUNTS'a karışmıyor, yedek/geri yükleme
   akışını kirletmiyor) ve kayıt olunduğunda yeni hesaba tohum olarak aktarılıyor. */
const GUEST_KEY = "romence_guest_v1";
let isGuest = false;

function loadGuestState(){
  try{
    const raw = localStorage.getItem(GUEST_KEY);
    if(raw) return migrateState(JSON.parse(raw));
  }catch(e){}
  return migrateState({mastery:{}, testHistory:[], sessionsCompleted:0});
}
function saveGuestState(){
  try{ localStorage.setItem(GUEST_KEY, JSON.stringify(STATE)); return true; }catch(e){ return false; }
}
function clearGuestState(){
  isGuest = false;
  try{ localStorage.removeItem(GUEST_KEY); localStorage.removeItem('romence_mode'); }catch(e){}
}

async function loadAccounts(){
  const raw = await loadAccountsFromStorage();
  ACCOUNTS = raw || {version:2, accounts:{}};
}

function bufToHex(buf){ return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
function randomSaltHex(){
  const arr = new Uint8Array(16);
  try{ (window.crypto||crypto).getRandomValues(arr); }
  catch(e){ for(let i=0;i<arr.length;i++) arr[i]=Math.floor(Math.random()*256); }
  return bufToHex(arr.buffer);
}
async function hashPassword(password, saltHex){
  const raw = saltHex + ":" + password;
  try{
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(raw));
    return bufToHex(digest);
  }catch(e){
    /* crypto.subtle bulunamazsa (çok eski/güvensiz bağlam) basit bir yedek —
       "basit" bir aile uygulaması için yeterli, SHA-256 kadar güçlü değil. */
    let h = 0;
    for(let i=0;i<raw.length;i++){ h = (Math.imul(31,h) + raw.charCodeAt(i))|0; }
    return "fallback" + (h>>>0).toString(16);
  }
}

/* Bir hesap kaydını gerçekten oluşturan ortak alt fonksiyon — normal kayıt
   (registerAccount) bunu kullanıyor. */
async function createAccountRecord(key, displayName, password, seedData){
  const salt = randomSaltHex();
  const hash = await hashPassword(password, salt);
  /* seedData: misafir olarak yapılan ilerleme. Yeni hesap boştan değil,
     kullanıcının o ana kadar kazandıklarıyla başlar. */
  const data = migrateState(seedData || {mastery:{}, testHistory:[], sessionsCompleted:0});
  ACCOUNTS.accounts[key] = { displayName, salt, hash, data };
  return {ok:true, key};
}

async function registerAccount(usernameRaw, displayNameRaw, password, seedData){
  const key = (usernameRaw||"").trim().toLowerCase();
  if(!key) return {ok:false, msg:"Kullanıcı adı boş olamaz."};
  if(key==="admin") return {ok:false, msg:'Bu kullanıcı adı ayrılmış — "Admin girişi" bağlantısını kullan.'};
  /* Kural Türkçe harf kabul etmiyor (kullanıcı adı bulutta
     "ad@rotrainer.app" e-postasına dönüşüyor, ASCII olmak zorunda). Mesajda
     "harf" demek Türkçe arayüzde yanıltıcıydı: "müfitçun" yazan kullanıcı
     ü ve ç'ye "harf değil" denmiş gibi oluyordu. */
  if(!/^[a-z0-9_.]{2,20}$/i.test(key)) return {ok:false, msg:"Kullanıcı adı yalnızca İngilizce harf (a-z), rakam, nokta ve alt çizgi içerebilir — Türkçe harf (ç, ğ, ı, ö, ş, ü) ve boşluk kullanılamaz. 2-20 karakter."};
  if(ACCOUNTS.accounts[key]) return {ok:false, msg:"Bu kullanıcı adı zaten alınmış."};
  /* M1 — ALT SINIR TEK KAYNAKTAN. Burada 3, Supabase'de 6 yazıyordu; arada
     kalan kullanıcı yerel hesap açabiliyor ama bulut hesabı HİÇ oluşmuyordu.
     Telefonunu değiştirince "böyle bir kullanıcı yok" duvarına çarpıp tüm
     ilerlemesini kaybediyordu. İki yerde iki ayrı sayı bulunması hatanın kök
     nedeniydi; sabit artık yalnızca sync.js'te. */
  if(!password || password.length < SYNC_MIN_PASSWORD)
    return {ok:false, msg:"Şifre en az " + SYNC_MIN_PASSWORD + " karakter olmalı."};

  /* M4 — KULLANICI ADI BULUTTA KÜRESEL OLARAK TEKİL.
     Yerelde ad yalnızca bu cihazda tekil, bulutta ise "ad@rotrainer.app"
     olarak herkes için tekil. Kontrolü yerel kayıttan ÖNCE yapıyoruz: aksi
     hâlde kullanıcı hesabını açmış olur, sonra senkronun sessizce kapalı
     kaldığını hiç öğrenemezdi. syncLink zaten önce giriş, sonra kayıt
     deniyor — yani aynı çağrı hem "bu ad boş mu" sorusunu yanıtlıyor hem de
     boşsa bulut hesabını oluşturuyor; ayrı bir "ad sorgulama" ucu açmıyoruz
     (o uç, herkesin kullanıcı adı listesini taramasına da izin verirdi). */
  const linked = await syncLinkWithin(key, password, SYNC_PROBE_MS);
  if(!linked.ok && linked.reason === "signup_failed")
    return {ok:false, msg:"Bu kullanıcı adı alınmış — başka bir tane seç."};
  /* offline / unavailable / email_confirmation_required: kontrol yapılamadı.
     Kaydı ENGELLEMİYORUZ (internetsiz kullanıcıyı kapıda bırakmak daha kötü);
     hesap "unlinked" işaretiyle açılır ve bağlanma anında ad çakışırsa
     kullanıcıya ad değiştirme sunulur (bkz. renderSyncConnect). */

  const rec = await createAccountRecord(key, (displayNameRaw||"").trim() || usernameRaw.trim(), password, seedData);
  rec.linked   = linked.ok;
  /* created===false: bu ad+şifre bulutta ZATEN vardı, yani kullanıcı aslında
     kendi hesabına yeni bir cihazdan giriyor. Sonraki syncNow ilerlemesini
     geri getirir; arayüz bunu ona söylemeli. */
  rec.restored = linked.ok && linked.created === false;
  return rec;
}

/* Admin girişi: ÖNCEDEN burada kaynak kodunda açık bir sabit şifre
   (ADMIN_PASSWORD) vardı. Depo public GitHub'a taşınınca bu, herkesin
   view-source ile admin şifresini görebileceği bir güvenlik açığı hâline
   geldi — kaldırıldı. Yeni davranış: "admin" hesabı, normal hesaplarla
   birebir aynı salt+hash mekanizmasıyla korunuyor (bkz. hashPassword).
   Hesabın henüz gerçek bir şifresi yoksa (ilk kurulum ya da eski sabit-şifre
   sürümünden kalma salt:null/hash:null kaydı), girilen şifre o an için YENİ
   admin şifresi olarak kaydedilir; hesabın zaten bir şifresi varsa normal
   girişteki gibi doğrulanır. Yani admin olarak ilk giren kişi şifreyi
   belirlemiş olur — bu yüzden yayına/duyuruya açmadan önce bu adımı SEN
   (uygulamanın sahibi) tamamlamalısın. */
async function adminLogin(password){
  if(!password) return {ok:false, msg:"Şifre boş olamaz."};
  const acc = ACCOUNTS.accounts['admin'];
  if(!acc || !acc.hash){
    /* Alt sınır yalnızca şifre BELİRLENİRKEN geçerli. Doğrulama tarafına da
       koysaydık, eski kısa şifreli admin kendi hesabından kilitlenirdi. */
    if(password.length < SYNC_MIN_PASSWORD)
      return {ok:false, msg:"Şifre en az " + SYNC_MIN_PASSWORD + " karakter olmalı."};
    const salt = randomSaltHex();
    const hash = await hashPassword(password, salt);
    const data = migrateState((acc && acc.data) ? acc.data : {mastery:{}, testHistory:[], sessionsCompleted:0});
    ACCOUNTS.accounts['admin'] = { displayName:"Admin", salt, hash, data };
    pendingSave = true;
    return {ok:true, key:'admin'};
  }
  const hash = await hashPassword(password, acc.salt);
  if(hash !== acc.hash) return {ok:false, msg:"Şifre yanlış."};
  return {ok:true, key:'admin'};
}

async function loginAccount(usernameRaw, password){
  const key = (usernameRaw||"").trim().toLowerCase();
  const acc = ACCOUNTS.accounts[key];
  /* reason: çağıran taraf "bu cihazda yok" ile "şifre yanlış"ı ayırt etmeli —
     ilkinde buluttan geri yükleme denenebilir, ikincisinde denenmemeli. */
  if(!acc) return {ok:false, reason:"no_user", msg:"Böyle bir kullanıcı bulunamadı.", key};
  const hash = await hashPassword(password, acc.salt);
  if(hash !== acc.hash) return {ok:false, reason:"bad_password", msg:"Şifre yanlış."};
  return {ok:true, key};
}

/* YENİ CİHAZDA GERİ YÜKLEME
   Hesap listesi cihaza özel olduğu için, kullanıcı telefonunu değiştirdiğinde
   "böyle bir kullanıcı yok" duvarına çarpardı ve bulut yedeği hiç devreye
   giremezdi. Burada sıra tersine çevriliyor: yerelde yoksa BULUTTA sorulur;
   şifre orada doğrulanırsa hesap bu cihaza kurulur ve ilerleme çekilir.
   Şifre doğrulaması yine sunucuda yapılır — burada yerel bir baypas yok. */
async function restoreAccountFromCloud(usernameRaw, password){
  const key = (usernameRaw||"").trim().toLowerCase();
  const linked = await syncLink(key, password);
  if(!linked.ok) return {ok:false, reason:linked.reason};
  await createAccountRecord(key, usernameRaw.trim(), password);
  pendingSave = true;
  return {ok:true, key, linked:true, restored:true};
}

/* ŞİFRE DEĞİŞTİRME (M1)
   SIRA KRİTİK: önce BULUT, başarılı olursa yerel. Ters sırada yaparsak ve
   bulut çağrısı düşerse iki taraftaki şifre ayrışır — kullanıcı bu cihazda
   girebilir ama yeni cihazda giremez; sessiz ve teşhisi zor bir bozulma.
   Bu yüzden şifre değiştirmek internet gerektiriyor; çevrimdışıyken net bir
   mesajla reddediliyor. */
async function changePassword(key, oldPassword, newPassword){
  const acc = ACCOUNTS && ACCOUNTS.accounts[key];
  if(!acc) return {ok:false, msg:"Hesap bulunamadı."};
  /* Mevcut şifre doğrulaması yerelde: cihazı eline geçiren birinin şifreyi
     bilmeden değiştirmesini engeller. (hash yoksa henüz şifre belirlenmemiş
     bir admin kaydıdır — o durumda eski şifre sorulmaz.) */
  if(acc.hash){
    const h = await hashPassword(oldPassword || "", acc.salt);
    if(h !== acc.hash) return {ok:false, msg:"Mevcut şifren yanlış."};
  }
  if(!newPassword || newPassword.length < SYNC_MIN_PASSWORD)
    return {ok:false, msg:"Yeni şifre en az " + SYNC_MIN_PASSWORD + " karakter olmalı."};
  if(newPassword === oldPassword) return {ok:false, msg:"Yeni şifre eskisiyle aynı."};

  const cloud = await syncChangePassword(key, oldPassword, newPassword);
  if(!cloud.ok){
    if(cloud.reason === "offline")
      return {ok:false, msg:"Şifre değiştirmek için internet gerekiyor — yoksa bu cihazdaki şifrenle bulut şifresi ayrışır ve yeni telefonunda giriş yapamazsın."};
    if(cloud.reason === "unavailable")
      return {ok:false, msg:"Sunucuya şu an ulaşılamıyor. Biraz sonra tekrar dene — şifren değişmedi."};
    if(cloud.reason === "signup_failed")
      return {ok:false, msg:"Bu kullanıcı adı bulutta başka bir hesaba ait. Buluta bağlanırken farklı bir kullanıcı adı seçmen gerekiyor."};
    return {ok:false, msg:"Bulut hesabının şifresi güncellenemedi, bu yüzden buradaki şifre de değiştirilmedi. Biraz sonra tekrar dene."};
  }

  const salt = randomSaltHex();
  acc.salt = salt;
  acc.hash = await hashPassword(newPassword, salt);
  acc.pwPromptSkipped = false;   // artık kısa değil; uyarı ekranı gereksiz
  pendingSave = true;
  await persistNow();
  return {ok:true, created: !!cloud.created};
}

/* KULLANICI ADI DEĞİŞTİRME (M4)
   Çevrimdışı açılan bir hesap, bağlanma anında adın bulutta başkasınca
   alınmış olduğunu öğrenebilir. İlerlemeyi kaybetmeden çıkış yolu: kaydı
   YENİ anahtara taşı (data nesnesi aynı kalır, dolayısıyla tek bir soru bile
   kaybolmaz), sonra yeni adla buluta bağlan. */
async function renameAccount(oldKey, newUsernameRaw){
  const newKey = (newUsernameRaw||"").trim().toLowerCase();
  const acc = ACCOUNTS && ACCOUNTS.accounts[oldKey];
  if(!acc) return {ok:false, msg:"Hesap bulunamadı."};
  if(!newKey) return {ok:false, msg:"Kullanıcı adı boş olamaz."};
  if(newKey === oldKey) return {ok:false, msg:"Yeni ad eskisiyle aynı."};
  if(newKey === "admin") return {ok:false, msg:"Bu kullanıcı adı ayrılmış."};
  if(!/^[a-z0-9_.]{2,20}$/i.test(newKey)) return {ok:false, msg:"Kullanıcı adı yalnızca İngilizce harf (a-z), rakam, nokta ve alt çizgi içerebilir — Türkçe harf (ç, ğ, ı, ö, ş, ü) ve boşluk kullanılamaz. 2-20 karakter."};
  if(ACCOUNTS.accounts[newKey]) return {ok:false, msg:"Bu kullanıcı adı bu cihazda zaten kullanılıyor."};

  ACCOUNTS.accounts[newKey] = acc;
  delete ACCOUNTS.accounts[oldKey];
  /* Görünen isim ayrıca seçilmemişse kullanıcı adıyla aynıydı; onu da taşı. */
  if(acc.displayName === oldKey) acc.displayName = (newUsernameRaw||"").trim();
  if(currentUser === oldKey){
    currentUser = newKey;
    STATE = ACCOUNTS.accounts[newKey].data;   // aynı referans; niyeti açık bırakıyoruz
    try{ localStorage.setItem('romence_user', newKey); }catch(e){}
    showAppChrome(true);
  }
  pendingSave = true;
  await persistNow();
  return {ok:true, key:newKey};
}

function enterAsUser(key){
  isGuest = false;
  currentUser = key;
  STATE = ACCOUNTS.accounts[key].data;
  /* Eski sürümden kalan hesaplarda oyunlaştırma alanları (xp/streak/dailyGoal)
     yoktur; migrateState eksikleri tamamlar, var olan ilerlemeye dokunmaz. */
  migrateState(STATE);
  try{ localStorage.setItem('romence_user', key); }catch(e){}
  showAppChrome(true);
  syncResume(key);        // bu cihazda daha önce bağlanılmışsa arka planda eşitle
  switchTab('practice');
}

/* startImmediately: karşılama ekranındaki "Hemen Başla" doğrudan soruya
   götürür — ana ekranı arada göstermek sürtünme ekler. */
function enterAsGuest(startImmediately){
  isGuest = true;
  currentUser = null;
  /* Misafirin bulut hesabı olması beklenmiyor: "yedek yok" uyarısı burada
     yanlış olurdu (tur sonundaki kayıt çağrısı zaten bu işi yapıyor). */
  if(typeof syncSetStatus === "function") syncSetStatus("off");
  STATE = loadGuestState();
  try{ localStorage.setItem('romence_mode','guest'); localStorage.removeItem('romence_user'); }catch(e){}
  showAppChrome(true);
  if(startImmediately) startPractice(5);   // ilk tur kısa: hızlı bir başarı anı
  else switchTab('practice');
}

function logoutUser(){
  currentUser = null; STATE = null; isGuest = false;
  syncClearSession();     // cihazı paylaşan başka bir aile üyesi bu oturumu devralmasın
  try{ localStorage.removeItem('romence_user'); localStorage.removeItem('romence_mode'); }catch(e){}
  showAppChrome(false);
  authMode = "login";
  renderAuth();
}

/* Misafirken "İlerlemeni Kaydet" düğmesi: STATE'i BIRAKMADAN kayıt ekranına
   geçiyoruz; kayıt başarılı olursa o STATE yeni hesabın tohumu oluyor. */
function startGuestSignup(){
  authMode = "register";
  renderAuth();
}

function showAppChrome(show){
  const lr = document.getElementById('levelrow');
  const tb = document.getElementById('tabsRow');
  const ub = document.getElementById('userbar');
  const gb = document.getElementById('gamebar');
  if(gb) gb.style.display = show? '' : 'none';
  if(show && typeof updateGameBar === 'function') updateGameBar();
  if(lr) lr.style.display = show? '' : 'none';
  if(tb) tb.style.display = show? '' : 'none';
  if(ub){
    ub.style.display = show? 'flex' : 'none';
    const who = document.getElementById('userbarWho');
    const btn = document.getElementById('logoutBtn');
    if(show && isGuest){
      if(who) who.textContent = '👤 Misafir';
      if(btn) btn.textContent = 'İlerlemeni Kaydet';
    } else if(show && currentUser && ACCOUNTS.accounts[currentUser]){
      if(who) who.textContent = '👤 ' + ACCOUNTS.accounts[currentUser].displayName;
      if(btn) btn.textContent = 'Çıkış Yap';
    }
  }
}

/* Kayıt duvarı yerine karşılama ekranı: birincil eylem "Hemen Başla".
   Yalnızca bu cihazda hatırlanan bir oturum yokken gösterilir — mevcut aile
   üyeleri kendi cihazlarında hiç görmez. */
function renderWelcome(){
  showAppChrome(false);
  root().innerHTML = `<div class="card welcome">
    <div class="mascotwrap">${mascotSVG("happy",92)}</div>
    <div class="qtext" style="text-align:center;margin-bottom:6px">Romence'ye bugün başla</div>
    <p class="welcometext">Kayıt olmadan hemen deneyebilirsin. Hesap açmak istersen bu turda kazandıkların yeni hesabına taşınır.</p>
    <button class="btn" id="guestBtn" style="width:100%">Hemen Başla &#183; 5 soru</button>
    <div class="authswitch">Zaten hesabın var mı? <a id="toLoginLink">Giriş yap</a></div>
    <div class="authswitch" style="margin-top:2px"><a id="toRegisterLink">Yeni hesap oluştur</a></div>
  </div>`;
  document.getElementById('guestBtn').addEventListener('click', ()=> enterAsGuest(true));
  document.getElementById('toLoginLink').addEventListener('click', ()=>{ authMode="login"; renderAuth(); });
  document.getElementById('toRegisterLink').addEventListener('click', ()=>{ authMode="register"; renderAuth(); });
}

function renderAuth(){
  showAppChrome(false);
  const isLogin = authMode==="login";
  root().innerHTML = `<div class="card">
    <div class="mascotwrap">${mascotSVG("happy",84)}</div>
    <div class="pill">${isLogin? "Giriş Yap":"Hesap Oluştur"}</div>
    <div class="qtext">${isLogin? "Kaldığın yerden devam etmek için giriş yap.":"Yeni bir hesap oluştur — ilerlemen bu hesaba kaydedilecek."}</div>
    <form id="authForm" style="display:contents" novalidate>
    <div class="inputrow" style="flex-direction:column;align-items:stretch">
      <input type="text" id="authUser" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" class="authinput" placeholder="${isLogin? "Kullanıcı adı" : "Kullanıcı adı (a-z, 0-9, . _)"}"/>
      ${isLogin? "" : `<input type="text" id="authDisplay" name="nickname" autocomplete="nickname" class="authinput" placeholder="Görünecek isim (opsiyonel)"/>`}
      <input type="password" id="authPass" name="password" autocomplete="${isLogin?'current-password':'new-password'}" class="authinput" placeholder="${isLogin? "Şifre" : "Şifre (en az " + SYNC_MIN_PASSWORD + " karakter)"}"/>
      ${isLogin? "" : `<input type="password" id="authPass2" name="password_confirm" autocomplete="new-password" class="authinput" placeholder="Şifreyi tekrar yaz"/>`}
    </div>
    ${isLogin? "" : `<div class="pwnote">&#128273; <b>Şifreni not al.</b> Hesabın gerçek bir e-postaya bağlı olmadığı için şifreni unutursan kurtarma yolu yok — hesabına bir daha giremezsin.</div>`}
    <div class="autherr" id="authErr"></div>
    <button type="submit" class="btn" id="authSubmitBtn" style="width:100%;margin-top:14px">${isLogin? "Giriş Yap":"Hesap Oluştur"}</button>
    </form>
    <div class="authswitch">${isLogin
      ? 'Hesabın yok mu? <a id="authSwitchLink">Hesap oluştur</a>'
      : 'Zaten hesabın var mı? <a id="authSwitchLink">Giriş yap</a>'}</div>
    ${isLogin? `<div class="pwnote" style="margin-top:12px">&#128273; Şifreni unuttuysan: hesap gerçek bir e-postaya bağlı olmadığı için kendi başına sıfırlanamıyor. <a href="mailto:mufitcun1@gmail.com?subject=RoTrainer%20-%20sifre%20yardimi">Destekle iletişime geç</a>.</div>` : ""}
    <div class="authswitch" style="margin-top:4px"><a id="backToWelcome">&#8592; Geri</a></div>
  </div>`;
  const userInp = document.getElementById('authUser');
  const passInp = document.getElementById('authPass');
  const errEl = document.getElementById('authErr');
  function showErr(msg){ errEl.textContent = msg; errEl.style.display = 'block'; }
  let submitting = false;
  async function submit(){
    if(submitting) return;
    submitting = true;
    const submitBtn = document.getElementById('authSubmitBtn');
    submitBtn.disabled = true;
    errEl.style.display = 'none';
    const username = userInp.value;
    const password = passInp.value;
    let res;
    if(isLogin){
      res = await loginAccount(username, password);
      if(!res.ok && res.reason === "no_user"){
        /* Bu cihazda hesap yok — buluttan geri yüklemeyi dene (yeni telefon). */
        showErr("Bu cihazda kayıtlı değil, bulut yedeği kontrol ediliyor…");
        const restored = await restoreAccountFromCloud(username, password);
        if(restored.ok){
          res = restored;
        } else if(restored.reason === "offline" || restored.reason === "unavailable"){
          /* Hesabın yokluğuna YORMA: geçici bir bağlantı/sunucu sorunu.
             Aksi hâlde kullanıcı hesabını kaybettiğini sanıp yenisini açar. */
          showErr("Bu cihazda kayıtlı değil ve bulut yedeğine şu an ulaşılamıyor. Biraz sonra tekrar dene.");
          submitBtn.disabled = false; submitting = false; return;
        }
      }
    } else {
      /* Hesabın kurtarma yolu yok: tek harflik bir yazım hatası hesabı kalıcı
         olarak kaybettiriyordu. Tek şifre alanı bu risk için yeterli değil. */
      const pass2 = document.getElementById('authPass2');
      if(pass2 && pass2.value !== password){
        showErr("İki şifre birbirini tutmuyor.");
        submitBtn.disabled = false; submitting = false; return;
      }
      const dispInp = document.getElementById('authDisplay');
      res = await registerAccount(username, dispInp? dispInp.value : "", password, isGuest ? STATE : null);
    }
    submitBtn.disabled = false;
    submitting = false;
    if(!res.ok){ showErr(res.msg); return; }
    if(!isLogin){
      pendingSave = true;       // yeni hesap: paylaşılan belgeye kaydedilmeli
      if(isGuest) clearGuestState();   // ilerleme hesaba taşındı, misafir kopyası gereksiz
    }
    enterAsUser(res.key);       // içindeki syncResume, varsa oturumu bulup eşitler
    /* YENİ hesabı hemen diske yaz. switchTab'in 900 ms'lik gecikmeli kaydı
       burada yetmiyor: kayıt olup uygulamayı hemen kapatan kullanıcı hesabını
       komple kaybediyordu (aynı sebeple tur sonunda da persistNow kullanılıyor). */
    if(!isLogin || res.restored) await persistNow();
    /* Kayıt yolunda bağlantı denemesi registerAccount içinde YAPILDI; kalıcı
       bir sebeple düştüyse (ad alınmış, e-posta onayı) tekrarlamak boşuna. */
    if(isLogin && !res.linked){
      /* Bulut senkronu: düz şifreye yalnızca BURADA erişimimiz var (hesap
         kaydında salt+hash tutuluyor). Arka planda bağlanıyor; başarısız
         olursa uygulama yerel çalışmaya aynen devam eder. Kayıt yolunda
         bağlantı zaten registerAccount içinde kurulduğu için tekrarlamıyoruz. */
      syncLink(res.key, password).then(r => { if(r.ok) syncNow(); });
    }
    /* Kayıt sırasında ad+şifre bulutta zaten varsa kullanıcı aslında kendi
       hesabına yeni bir cihazdan girmiştir. Sessizce devam etmek, ilerlemenin
       birden bire "geri gelmesini" açıklanamaz kılardı. */
    if(!isLogin && res.restored){
      restoredNotice = true;
      switchTab('practice');
    }
    /* Şifresi kısa olan MEVCUT hesaplar: girişte bir kez uyar (M1). Kayıt
       yolunda gerekmez, orada alt sınır zaten dayatılıyor. */
    if(isLogin && password.length < SYNC_MIN_PASSWORD){
      const acc = ACCOUNTS.accounts[res.key];
      if(acc && !acc.pwPromptSkipped) renderPasswordStrengthen(res.key, password);
    }
  }
  const authForm = document.getElementById('authForm');
  if(authForm){
    authForm.addEventListener('submit', e=>{ e.preventDefault(); submit(); });
  } else {
    document.getElementById('authSubmitBtn').addEventListener('click', submit);
    passInp.addEventListener('keydown', e=>{ if(e.key==="Enter"){ e.preventDefault(); submit(); } });
  }
  document.getElementById('authSwitchLink').addEventListener('click', ()=>{
    authMode = isLogin? "register":"login";
    renderAuth();
  });
  /* "Admin girişi" bağlantısı giriş ekranından kaldırıldı: her kullanıcıya
     görünüyordu, tüketici uygulamasında gereksiz ve davetkârdı. Yönetici
     erişimi kaybolmasın diye gizli yol duruyor — adresin sonuna #admin. */
  const adminLink = document.getElementById('adminLink');
  if(adminLink) adminLink.addEventListener('click', renderAdminAuth);
  if(location.hash === "#admin"){ location.hash = ""; renderAdminAuth(); }
  const backLink = document.getElementById('backToWelcome');
  if(backLink) backLink.addEventListener('click', ()=>{
    /* Misafirken kayıt ekranına gelinmişse geri dönmek oyuna geri döndürür,
       karşılama ekranına değil — ilerleme hâlâ elinde. */
    if(isGuest){ showAppChrome(true); switchTab('practice'); }
    else renderWelcome();
  });
  userInp.focus();
}

/* "Admin girişi": kullanıcı adı hep sabit "admin". Şifre henüz belirlenmediyse
   yazdığın şey admin şifresi olarak kaydedilir (bkz. adminLogin) — kayıt
   formu veya ayrı bir kurulum ekranı yok, aynı tek alan hem ilk kurulum hem
   sonraki girişler için kullanılıyor. */
function renderAdminAuth(){
  showAppChrome(false);
  root().innerHTML = `<div class="card">
    <div class="pill">Admin Girişi</div>
    <div class="qtext">Sadece şifreni yaz — kullanıcı adı seçmene gerek yok. Daha önce admin şifresi belirlemediysen, yazdığın şifre yeni admin şifren olarak kaydedilir.</div>
    <div class="inputrow" style="flex-direction:column;align-items:stretch">
      <input type="password" id="adminPass" autocomplete="current-password" class="authinput" placeholder="Admin şifresi"/>
    </div>
    <div class="autherr" id="authErr"></div>
    <button class="btn" id="adminSubmitBtn" style="width:100%;margin-top:14px">Giriş Yap</button>
    <div class="authswitch"><a id="authBackLink">← Normal girişe dön</a></div>
  </div>`;
  const passInp = document.getElementById('adminPass');
  const errEl = document.getElementById('authErr');
  function showErr(msg){ errEl.textContent = msg; errEl.style.display = 'block'; }
  let submitting = false;
  async function submit(){
    if(submitting) return;
    submitting = true;
    const submitBtn = document.getElementById('adminSubmitBtn');
    submitBtn.disabled = true;
    errEl.style.display = 'none';
    const res = await adminLogin(passInp.value);
    submitBtn.disabled = false;
    submitting = false;
    if(!res.ok){ showErr(res.msg); return; }
    const adminPass = passInp.value;
    enterAsUser(res.key);
    syncLink(res.key, adminPass).then(r => { if(r.ok) syncNow(); });
    if(adminPass.length < SYNC_MIN_PASSWORD){
      const acc = ACCOUNTS.accounts[res.key];
      if(acc && !acc.pwPromptSkipped) renderPasswordStrengthen(res.key, adminPass);
    }
  }
  document.getElementById('adminSubmitBtn').addEventListener('click', submit);
  passInp.addEventListener('keydown', e=>{ if(e.key==="Enter"){ e.preventDefault(); submit(); } });
  document.getElementById('authBackLink').addEventListener('click', ()=>{ authMode="login"; renderAuth(); });
  passInp.focus();
}

function getEntry(id){
  if(!STATE.mastery[id]) STATE.mastery[id] = {box:0,streak:0,seen:0,correct:0};
  return STATE.mastery[id];
}
function recordAnswer(id, correct){
  const e = getEntry(id);
  e.seen++;
  if(correct){
    e.correct++; e.streak++;
    if(e.streak>=LEVEL_UP_STREAK){ e.box=Math.min(MAX_BOX,e.box+1); e.streak=0; }
  } else {
    e.streak=0; e.box=Math.max(0,e.box-1);
  }
  /* Eskiden burada persist() çağrılmazdı: Artifact platformunda kaydetmek
     (artifact.publish()) tüm açık sekmeleri yeniden yüklüyordu, bu yüzden
     kayıt ana ekrana dönene kadar ertelenirdi. O platformdan çıkıldı; kayıt
     artık localStorage'a yazıyor ve hiçbir şeyi yeniden yüklemiyor. Erteleme
     sürdüğü sürece tur sonu ekranında uygulamayı kapatan kullanıcı turun
     tamamını (XP ve seri dahil) kaybediyordu — çağrı ui.js:markResult içinde
     geri kondu (900 ms'lik debounce persist() içinde). */
  pendingSave = true;
}
function weightFor(id){
  const e = STATE.mastery[id];
  const box = e?e.box:0;
  return 1/Math.pow(1.8, box);
}
function weightedSample(ids, n){
  const pool = ids.slice(); const out=[];
  while(pool.length && out.length<n){
    const weights = pool.map(weightFor);
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total, idx=0;
    for(;idx<weights.length;idx++){ r-=weights[idx]; if(r<=0) break; }
    idx = Math.min(idx, pool.length-1);
    out.push(pool[idx]); pool.splice(idx,1);
  }
  return out;
}

let saveTimer=null, pendingSave=false;
function persist(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doPublish, 900);
}
/* Beklemeden kaydet — kullanıcının uygulamayı kapatabileceği anlarda
   (tur/sınav sonucu ekranı, ana ekrana dönüş) kullanılır. */
function persistNow(){
  clearTimeout(saveTimer);
  return doPublish();
}
function showSavePill(){
  const p = document.getElementById('savepill');
  if(p){ p.classList.add('show'); setTimeout(()=>p.classList.remove('show'),1400); }
}
async function doPublish(){
  /* Misafirin ilerlemesi ACCOUNTS'a değil kendi anahtarına yazılır — yedek
     alma/geri yükleme aracı yalnızca gerçek hesapları taşısın diye. */
  if(isGuest){
    const ok = saveGuestState();
    pendingSave = false;
    if(ok) showSavePill();
    return;
  }
  /* STATE, o an giriş yapmış kullanıcının veri dilimidir (zaten aynı referans
     olduğu için bu satır çoğunlukla no-op'tur, ama güvenlik ağı olarak
     bırakıyoruz). Kaydedilen belge TÜM kullanıcıların hesaplarını birlikte
     taşıyor, böylece bir aile üyesinin kaydı diğerlerinin hesabını silmiyor. */
  if(currentUser && ACCOUNTS && ACCOUNTS.accounts[currentUser]) ACCOUNTS.accounts[currentUser].data = STATE;
  const ok = await saveAccountsToStorage(ACCOUNTS);
  pendingSave = false;
  if(ok) showSavePill();
  syncSoon();             // yerel kayıt kesin; bulut arkadan gelir
}
/* Sonuç ekranından ana ekrana dönerken: varsa bekleyen ilerlemeyi hemen kaydet. */
function goHome(){
  if(pendingSave) persistNow();
  switchTab('practice');
}
