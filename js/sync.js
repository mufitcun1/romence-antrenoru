/* ============================= BULUT SENKRONU (Supabase) =============================
   Amaç: ilerlemenin (mastery / xp / streak / testHistory) cihaz değişse bile
   kaybolmaması ve aynı hesapla başka bir cihazda kaldığı yerden devam
   edebilmesi.

   TASARIM KARARLARI

   1. YEREL ÖNCE (local-first). Uygulama her zaman localStorage üzerinden
      çalışır; bulut yalnızca arka planda eşitler. İnternet yoksa, Supabase
      kapalıysa veya istek başarısız olursa uygulama hiç etkilenmez — bu
      dosyadaki hiçbir hata kullanıcının pratiğini bölmez.

   2. KİMLİK. Uygulamanın kendi kullanıcı adı/şifre ekranı aynen duruyor;
      perde arkasında Supabase Auth'a "kullaniciadi@rotrainer.app" biçiminde
      TÜRETİLMİŞ bir e-postayla giriş yapılıyor. Böylece giriş akışı
      değişmeden sunucu tarafında gerçek bir kimlik (auth.uid()) oluşuyor ve
      progress tablosundaki RLS onun üzerinden koruyor. Gerçek bir e-posta
      olmadığı için şifre sıfırlama akışı YOK — bu bilinçli bir sınır.

   3. NEDEN supabase-js DEĞİL. Depo bilinçli olarak build adımsız, düz JS.
      120 KB'lık küçültülmüş bir paketi vendor'lamak hem bu mimariyi bozardı
      hem de inceleyemeyeceğimiz bir blob'u depoya sokardı. Burada yalnızca
      dokümante edilmiş REST uçları çağrılıyor; şifre saklama ve token imzalama
      sunucuda kalıyor (ev yapımı kimlik doğrulama YOK).

   4. BİRLEŞTİRME. İki cihaz aynı hesapla çalışabilir. Kör "son yazan kazanır"
      bir turu silebileceği için alan bazında birleştirme yapılıyor (bkz.
      mergeStates) — kayıp yerine en ileri değer kazanır.

   GÜVENLİK NOTU: aşağıdaki anahtar "publishable" (yayınlanabilir) anahtardır,
   gizli değildir — tarayıcıda görünmesi tasarım gereğidir. Erişimi belirleyen
   şey bu anahtar değil, progress tablosundaki RLS politikalarıdır. Gizli
   (sb_secret_*) anahtar hiçbir koşulda buraya konmaz. */

const SYNC_URL          = "https://vlgyozoosjexyimbylbf.supabase.co";
const SYNC_KEY          = "sb_publishable_hgM8c68-rnauskezgfo1_A__xYi-wLU";
const SYNC_EMAIL_DOMAIN = "rotrainer.app";
const SYNC_SESSION_KEY  = "romence_sync_session";
const SYNC_MIN_PASSWORD = 6;      // Supabase Auth'un alt sınırı
const SYNC_TIMEOUT_MS   = 12000;
/* Kayıt sırasındaki "bu ad bulutta boş mu" kontrolü kullanıcıyı bekletiyor.
   Tek istek 12 sn, syncLink iki istek yapabildiği için en kötü hâlde 24 sn
   eder — kötü şebekede kabul edilemez. Bu süreden sonra kayıt YEREL olarak
   tamamlanıyor, hesap "unlinked" işaretleniyor ve bağlanma bir sonraki
   fırsata kalıyor (bkz. registerAccount, M2/M4). */
const SYNC_PROBE_MS     = 6000;
const SYNC_DEBOUNCE_MS  = 4000;   // yazma sonrası buluta gönderme gecikmesi

let syncSession = null;   // {access_token, refresh_token, expires_at, user_id, username}
/* off            : giriş yapılmamış ya da misafir — bulut hiç ilgilendirmiyor
   unlinked       : gerçek bir hesap var ama bu cihazda bulut oturumu YOK.
                    Kullanıcı yedeksiz; bu durumun GÖRÜNÜR olması şart (M2).
   linking        : şu an bağlanılıyor
   syncing        : çekiliyor/gönderiliyor
   ok             : yedeklendi
   offline        : ağ yok · unavailable: sunucu geçici olarak yanıt vermiyor
   error          : kalıcı bir hata
   short_password : şifre Supabase'in alt sınırının altında (bkz. M1) */
let syncStatus  = "off";
let syncTimer   = null;
let syncBusy    = false;

/* Durumu tek yerden değiştiriyoruz: rozeti güncellemeyi unutmak, senkronun
   sessizce başarısız olmasının en kolay yoluydu. */
function syncSetStatus(status){
  syncStatus = status;
  if(typeof updateSyncBadge === "function") updateSyncBadge();
}

/* ============================= ALT KATMAN ============================= */

function syncEmailFor(username){
  /* Kullanıcı adı kayıt sırasında /^[a-z0-9_.]{2,20}$/ ile doğrulanıyor, yani
     e-posta yerel kısmı için güvenli. Yine de küçük harfe indiriyoruz. */
  return String(username || "").trim().toLowerCase() + "@" + SYNC_EMAIL_DOMAIN;
}

async function syncFetch(path, opts){
  opts = opts || {};
  const ctrl = new AbortController();
  const timer = setTimeout(()=> ctrl.abort(), SYNC_TIMEOUT_MS);
  const headers = Object.assign({
    "apikey": SYNC_KEY,
    "Content-Type": "application/json",
  }, opts.headers || {});
  if(opts.token) headers["Authorization"] = "Bearer " + opts.token;
  try{
    const res = await fetch(SYNC_URL + path, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });
    let json = null;
    const text = await res.text();
    if(text){ try{ json = JSON.parse(text); }catch(e){ json = null; } }
    /* GEÇİCİ mi KALICI mı ayrımı kritik: 5xx/429 sunucunun o anki derdidir,
       "böyle bir kullanıcı yok" DEĞİLDİR. Bu ayrım olmadan bir Supabase
       kesintisi kullanıcıya "hesabın yok" dedirtir ve token yenilemede
       oturumu boşuna sildirir. */
    const temporary = (res.status >= 500 || res.status === 429);
    return {ok: res.ok, status: res.status, data: json, temporary};
  }catch(e){
    /* Ağ yok, zaman aşımı, CORS — hepsi aynı sonuca varır: şimdi olmadı. */
    return {ok: false, status: 0, data: null, offline: true, temporary: true};
  }finally{
    clearTimeout(timer);
  }
}

/* --- Oturum saklama (bu cihaza özel) --- */
function syncSaveSession(){
  try{ localStorage.setItem(SYNC_SESSION_KEY, JSON.stringify(syncSession)); }catch(e){}
}
function syncLoadSession(){
  try{
    const raw = localStorage.getItem(SYNC_SESSION_KEY);
    syncSession = raw ? JSON.parse(raw) : null;
  }catch(e){ syncSession = null; }
  return syncSession;
}
function syncClearSession(){
  syncSession = null;
  try{ localStorage.removeItem(SYNC_SESSION_KEY); }catch(e){}
  syncSetStatus("off");
}

function syncSetSession(payload, username){
  if(!payload || !payload.access_token) return false;
  syncSession = {
    access_token:  payload.access_token,
    refresh_token: payload.refresh_token,
    /* expires_in saniye cinsinden; 60 sn güvenlik payı bırakıyoruz. */
    expires_at:    Date.now() + ((payload.expires_in || 3600) - 60) * 1000,
    user_id:       payload.user && payload.user.id,
    username:      username || (syncSession && syncSession.username) || null,
  };
  syncSaveSession();
  return true;
}

/* Süresi dolmuşsa yenile. Yenileme de başarısızsa oturum düşer ve senkron
   bir sonraki girişe kadar kapanır — uygulama çalışmaya devam eder. */
async function syncEnsureToken(){
  if(!syncSession || !syncSession.refresh_token) return null;
  if(syncSession.access_token && Date.now() < syncSession.expires_at) return syncSession.access_token;
  const res = await syncFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: {refresh_token: syncSession.refresh_token},
  });
  if(res.ok && res.data && res.data.access_token){
    syncSetSession(res.data, syncSession.username);
    return syncSession.access_token;
  }
  if(res.temporary) return null;        // ağ/sunucu geçici: oturumu SİLME, sonra dene
  syncClearSession();                    // token gerçekten geçersiz
  /* Hesap duruyor, yalnızca bulut oturumu düştü — "off" demek bunu görünmez
     kılardı; kullanıcı yeniden bağlanmaya davet edilmeli. */
  syncSetStatus("unlinked");
  return null;
}

/* ============================= KİMLİK BAĞLAMA =============================
   Yerel giriş başarılı olduktan SONRA çağrılır (şifre yalnızca o an elde).
   Önce giriş denenir; kullanıcı sunucuda yoksa kaydedilir. Bu sıra kasıtlı:
   mevcut aile hesapları ilk girişlerinde sessizce buluta bağlanmış olur. */
/* syncLink'i sınırlı süreyle dener; süre dolarsa "unavailable" döner ama
   arkadaki istek iptal edilmez — sonradan başarılı olursa oturum yine kurulur
   ve durum kendiliğinden "ok"a döner. */
function syncLinkWithin(username, password, ms){
  return Promise.race([
    syncLink(username, password),
    new Promise(resolve => setTimeout(()=> resolve({ok:false, reason:"unavailable", timedOut:true}), ms)),
  ]);
}

async function syncLink(username, password){
  if(!username || !password) return {ok:false, reason:"missing"};
  if(password.length < SYNC_MIN_PASSWORD){
    syncSetStatus("short_password");
    return {ok:false, reason:"short_password"};
  }
  syncSetStatus("linking");

  const email = syncEmailFor(username);
  /* created: bulut hesabı BU çağrıda mı açıldı, yoksa zaten var mıydı?
     Kayıt akışı bunu bilmeli — "zaten vardı" demek, kullanıcının aslında
     kendi hesabına yeni bir cihazdan girdiği ve ilerlemesinin geri geleceği
     anlamına gelir (bkz. registerAccount, M4). */
  let created = false;
  let res = await syncFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: {email, password},
  });

  if(!res.ok && res.temporary){
    /* Ağ yok ya da sunucu geçici olarak bozuk: hesabın yokluğuna YORMA. */
    syncSetStatus(res.offline ? "offline" : "unavailable");
    return {ok:false, reason: res.offline ? "offline" : "unavailable"};
  }

  if(!res.ok){
    /* Sunucuda böyle bir kullanıcı yok (ya da şifre farklı) — kaydetmeyi dene. */
    const up = await syncFetch("/auth/v1/signup", {method:"POST", body:{email, password}});
    if(up.ok && up.data && up.data.access_token){
      res = up;
      created = true;
    } else if(up.ok){
      /* Kayıt oldu ama oturum dönmedi: projede e-posta onayı AÇIK demektir.
         Türetilmiş e-postaya onay maili gidemeyeceği için senkron çalışamaz. */
      syncSetStatus("error");
      return {ok:false, reason:"email_confirmation_required"};
    } else if(up.temporary){
      syncSetStatus(up.offline ? "offline" : "unavailable");
      return {ok:false, reason: up.offline ? "offline" : "unavailable"};
    } else {
      /* Gerçek ret: kullanıcı zaten var ama şifre tutmuyor, ya da şifre
         sunucunun kurallarına uymuyor. */
      syncSetStatus("error");
      return {ok:false, reason:"signup_failed", detail: up.data};
    }
  }
  if(!syncSetSession(res.data, username)){
    syncSetStatus("error");
    return {ok:false, reason:"no_session"};
  }
  syncSetStatus("ok");
  return {ok:true, created};
}

/* ŞİFRE DEĞİŞTİRME — BULUT TARAFI (M1)
   Supabase'in ucu: PUT /auth/v1/user, gövde {"password": "..."},
   Authorization: Bearer <access_token> (supabase-js'teki updateUser aynı ucu
   çağırıyor). 5 Eylül 2026'da canlı projede uçtan uca DOĞRULANDI: 200
   dönüyor, eski şifre çalışmaz oluyor, yeni şifreyle giriş yapılıyor ve
   6 karakterden kısa şifre 422/weak_password ile reddediliyor.
   Projede "şifre değişiminde yeniden kimlik doğrulama" ayarı AÇIK olursa bu
   uç e-postayla gönderilen bir nonce ister; türetilmiş adrese posta
   gidemeyeceği için o ayar KAPALI kalmalı (şu an kapalı, proje notlarında
   yazılı). Ayrıca uç "yakın zamanda giriş yapmış olma" koşulu arayabildiği
   için önce TAZE bir oturum alıyoruz — bu aynı zamanda eski şifreyi
   sunucuda doğrulamış oluyor. */
async function syncChangePassword(username, oldPassword, newPassword){
  if(!username || !newPassword) return {ok:false, reason:"missing"};
  if(newPassword.length < SYNC_MIN_PASSWORD) return {ok:false, reason:"short_password"};
  const email = syncEmailFor(username);

  const signin = await syncFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: {email, password: oldPassword},
  });
  if(!signin.ok && signin.temporary)
    return {ok:false, reason: signin.offline ? "offline" : "unavailable"};

  if(!signin.ok){
    /* Bulutta bu şifreyle hesap yok. En yaygın hâli: eski şifre 6 karakterden
       kısaydı, bu yüzden bulut hesabı hiç oluşmamıştı — yeni (uzun) şifreyle
       şimdi oluşuyor. Ad başkasındaysa syncLink "signup_failed" der. */
    const linked = await syncLink(username, newPassword);
    if(linked.ok) return {ok:true, created: linked.created};
    return {ok:false, reason: linked.reason};
  }

  if(!syncSetSession(signin.data, username)) return {ok:false, reason:"no_session"};

  const upd = await syncFetch("/auth/v1/user", {
    method: "PUT",
    token: syncSession.access_token,
    body: {password: newPassword},
  });
  if(!upd.ok){
    if(upd.temporary) return {ok:false, reason: upd.offline ? "offline" : "unavailable"};
    return {ok:false, reason:"update_failed", detail: upd.data};
  }

  /* Şifre değişince sunucu eski oturumları geçersiz kılabiliyor; yeni şifreyle
     taze bir oturum alıp saklıyoruz ki senkron kesintiye uğramasın. */
  const again = await syncFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: {email, password: newPassword},
  });
  if(again.ok && again.data) syncSetSession(again.data, username);
  syncSetStatus("ok");
  return {ok:true, created:false};
}

/* ============================= ÇEK / GÖNDER ============================= */

async function syncPull(){
  const token = await syncEnsureToken();
  if(!token) return {ok:false, reason:"no_session"};
  const res = await syncFetch(
    "/rest/v1/progress?select=data,updated_at&user_id=eq." + encodeURIComponent(syncSession.user_id),
    {token});
  if(!res.ok) return {ok:false, reason: res.offline ? "offline" : (res.temporary ? "unavailable" : "http_" + res.status)};
  const row = Array.isArray(res.data) && res.data.length ? res.data[0] : null;
  return {ok:true, data: row ? row.data : null, updatedAt: row ? row.updated_at : null};
}

async function syncPush(data){
  const token = await syncEnsureToken();
  if(!token) return {ok:false, reason:"no_session"};
  const res = await syncFetch("/rest/v1/progress", {
    method: "POST",
    token,
    headers: {"Prefer": "resolution=merge-duplicates,return=minimal"},
    body: {user_id: syncSession.user_id, data: data},
  });
  if(!res.ok) return {ok:false, reason: res.offline ? "offline" : (res.temporary ? "unavailable" : "http_" + res.status)};
  return {ok:true};
}

/* ============================= BİRLEŞTİRME =============================
   İki cihaz aynı hesapla çalışabildiği için kör "son yazan kazanır" bir turu
   yok edebilir. Alan bazında, KAYIP OLMAYAN yönde birleştiriyoruz. */
function mergeStates(local, remote){
  if(!remote) return local;
  if(!local)  return remote;
  const out = {};

  /* mastery: öğe bazında daha çok çalışılmış olan kazanır. Eşit görülme
     sayısında kutusu yüksek olan (daha ileri) alınır. */
  out.mastery = {};
  const ids = new Set(Object.keys(local.mastery || {}).concat(Object.keys(remote.mastery || {})));
  ids.forEach(id => {
    const a = (local.mastery || {})[id], b = (remote.mastery || {})[id];
    if(!a){ out.mastery[id] = b; return; }
    if(!b){ out.mastery[id] = a; return; }
    const aSeen = a.seen || 0, bSeen = b.seen || 0;
    out.mastery[id] = (bSeen > aSeen || (bSeen === aSeen && (b.box || 0) > (a.box || 0))) ? b : a;
  });

  /* XP: gün bazında ve toplamda en yüksek. Toplamı toplamak iki cihazda aynı
     turu iki kez saymak olurdu; max hem tekrarlamaz hem geri gitmez. */
  const lxp = local.xp || {total:0, byDate:{}}, rxp = remote.xp || {total:0, byDate:{}};
  out.xp = {total: Math.max(lxp.total || 0, rxp.total || 0), byDate: {}};
  const days = new Set(Object.keys(lxp.byDate || {}).concat(Object.keys(rxp.byDate || {})));
  days.forEach(d => out.xp.byDate[d] = Math.max((lxp.byDate || {})[d] || 0, (rxp.byDate || {})[d] || 0));

  /* Seri: son aktif günü daha YENİ olan taraf gerçeği taşır. Rekor her iki
     taraftan da en yükseği; dondurma sayısı ise en DÜŞÜĞÜ — senkronun
     dondurma hediye etmesi bir kaçak olurdu. */
  const ls = local.streak || {}, rs = remote.streak || {};
  const newer = (rs.lastActiveDate || "") > (ls.lastActiveDate || "") ? rs : ls;
  out.streak = {
    current:         newer.current || 0,
    longest:         Math.max(ls.longest || 0, rs.longest || 0, newer.current || 0),
    lastActiveDate:  newer.lastActiveDate || null,
    freezes:         Math.min(
                       ls.freezes === undefined ? MAX_FREEZES : ls.freezes,
                       rs.freezes === undefined ? MAX_FREEZES : rs.freezes),
    freezeUsedDates: Array.from(new Set((ls.freezeUsedDates || []).concat(rs.freezeUsedDates || []))).slice(-50),
  };

  /* Sınav geçmişi: birleştir, aynı kaydı iki kez tutma, son 50'yi sakla. */
  const seen = new Set();
  out.testHistory = (local.testHistory || []).concat(remote.testHistory || [])
    .filter(h => {
      /* Seviye anahtarın parçası: aynı gün aynı skorla alınan A1 ve A2 sınavları
         farklı kayıtlardır. Eski kayıtlarda level alanı yok, hepsi A1'di. */
      const k = (h.level || "A1") + "|" + h.date + "|" + h.score + "|" + h.total;
      if(seen.has(k)) return false;
      seen.add(k); return true;
    })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-50);

  out.sessionsCompleted = Math.max(local.sessionsCompleted || 0, remote.sessionsCompleted || 0);
  /* Günlük hedef bir tercih, birikim değil: en son aktif olan cihazınki geçerli. */
  out.dailyGoal = (newer === rs ? remote.dailyGoal : local.dailyGoal) || DEFAULT_DAILY_GOAL;

  return migrateState(out);
}

/* ============================= ORKESTRA =============================
   Çek → birleştir → yerele uygula → geri gönder. Her adım sessizce
   başarısız olabilir; uygulama akışı hiçbir durumda bölünmez. */
async function syncNow(){
  if(syncBusy || !syncSession || !STATE || isGuest) return {ok:false, reason:"skip"};
  syncBusy = true;
  syncSetStatus("syncing");
  try{
    const pulled = await syncPull();
    if(!pulled.ok){
      syncSetStatus((pulled.reason === "offline")     ? "offline"
                  : (pulled.reason === "unavailable")  ? "unavailable"
                  /* Oturum düşmüş: hesap yedeksiz kaldı, görünür olsun. */
                  : (pulled.reason === "no_session")   ? "unlinked" : "error");
      return pulled;
    }
    if(pulled.data){
      const merged = mergeStates(STATE, pulled.data);
      /* STATE referansı ACCOUNTS içindeki dilime işaret ettiği için yerine
         yeni nesne koymak yerine İÇİNİ değiştiriyoruz — aksi hâlde kaydetme
         yolu eski nesneyi yazmaya devam ederdi. */
      Object.keys(STATE).forEach(k => { delete STATE[k]; });
      Object.assign(STATE, merged);
      if(typeof updateGameBar === "function") updateGameBar();
      pendingSave = true;
      if(typeof persistNow === "function") await persistNow();
      /* Ekranda görünen rakamlar (ustalık, seri, geçmiş) artık eski. Ana
         ekranları yeniden çiziyoruz — ama soru ekranındaysak DOKUNMUYORUZ,
         yoksa kullanıcının cevapladığı soru elinden alınırdı. */
      const soruEkraninda = !!document.querySelector('.exprogress');
      if(!soruEkraninda && typeof switchTab === "function" && typeof activeTab === "string"){
        switchTab(activeTab);
      }
    }
    const pushed = await syncPush(STATE);
    syncSetStatus(pushed.ok                           ? "ok"
                : (pushed.reason === "offline")       ? "offline"
                : (pushed.reason === "unavailable")   ? "unavailable"
                : (pushed.reason === "no_session")    ? "unlinked" : "error");
    return pushed;
  }finally{
    syncBusy = false;
    if(typeof updateSyncBadge === "function") updateSyncBadge();
  }
}

/* Yazmadan sonra çağrılır; sık kaydetme buluta sık istek atmasın diye
   geciktirilir. */
function syncSoon(){
  if(!syncSession || isGuest) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(()=>{ syncNow(); }, SYNC_DEBOUNCE_MS);
}

/* Uygulama açılışında: bu cihazda daha önce bağlanılmışsa ve giriş yapan
   kullanıcı o hesapsa arka planda eşitle. */
function syncResume(username){
  syncLoadSession();
  /* M2 — SESSİZ BAŞARISIZLIK BURADAYDI. Otomatik girişte şifre elimizde
     olmadığı için syncLink çağrılamıyor; eskiden burada "off" deyip
     çıkıyorduk ve rozet boş görünüyordu. Çevrimdışıyken kayıt olan (ya da
     oturumu düşen) kullanıcı, elle çıkış yapıp tekrar girmedikçe sonsuza
     kadar yedeksiz kalıyordu — üstelik bunu hiç bilmeden. Artık durum
     "unlinked" ve arayüzde tıklanabilir bir uyarı olarak görünüyor. */
  if(!syncSession){
    syncSetStatus((typeof isGuest !== "undefined" && isGuest) ? "off" : "unlinked");
    return;
  }
  if(username && syncSession.username && syncSession.username !== username){
    /* Cihazda başka bir aile üyesi giriş yaptı: eski oturumu taşıma. */
    syncClearSession();
    syncSetStatus("unlinked");
    return;
  }
  syncSetStatus("syncing");
  syncNow();
}
