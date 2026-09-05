/* ============================= OYUNLAŞTIRMA: SERİ / XP / GÜNLÜK HEDEF =============================
   Bu dosya yalnızca "veri ve kural" katmanıdır — hiçbir şey çizmez. Arayüz
   tarafı (üst bar, tur sonu kutlaması, ilerleme kartları) ui.js'te duruyor ve
   buradaki fonksiyonları çağırıyor. Ayrım kasıtlı: kuralları (seri nasıl artar,
   XP nasıl verilir) ekran koduna karıştırmadan test edebilmek için.

   Tasarım notları:
   - GÜN SINIRI kullanıcının yerel gece yarısıdır. Tarih anahtarı locale
     verisine bağlı olmasın diye elle biçimlendiriliyor ("2026-09-04");
     toLocaleDateString bazı ortamlarda farklı takvim/rakam üretebiliyor.
   - GÜN FARKI hesabı tarih anahtarlarını UTC gece yarısı olarak çözüp
     çıkarıyor. İki taraf da aynı şekilde çözüldüğü için fark her zaman tam
     gün katıdır — yaz saati geçişleri bu hesabı bozmaz.
   - BİR GÜN "sayılır" = o gün günlük XP hedefine ulaşıldı. Sadece uygulamayı
     açmak seriyi ilerletmez; eylem gerekir.
   - CİHAZ SAATİ geriye alınmış olabilir (gap <= 0). Bu durumda seriyi ne
     kırıyoruz ne de ilerletiyoruz — sadece bugüne çekiyoruz. Kullanıcıyı
     saat oyunuyla cezalandırmak, hatalı saatli bir telefonda haksızlık olurdu.
*/

/* --- XP değerleri (bir 10 soruluk tur ≈ 30-40 XP olacak şekilde dengelendi) --- */
const XP_FIRST_TRY    = 3;   // ilk denemede doğru
const XP_SECOND_TRY   = 1;   // ikinci denemede doğru
const XP_SESSION_END  = 5;   // pratik turunu bitirme
const XP_PERFECT      = 5;   // kusursuz tur bonusu
const XP_TEST_END     = 15;  // deneme sınavını bitirme
const XP_FIRST_TODAY  = 5;   // günün ilk turu
const XP_COMBO        = 2;   // her COMBO_STEP'lik ardışık doğru serisi

/* --- Tur içi combo (ardışık doğru) --- */
const COMBO_SHOW = 3;        // rozet bu sayıdan itibaren görünür
const COMBO_STEP = 5;        // her bu katta ek XP

/* --- Günlük hedef seçenekleri --- */
const DAILY_GOALS = [
  {xp:20,  label:"Rahat",  note:"~3 dk"},
  {xp:40,  label:"Normal", note:"~5 dk"},
  {xp:80,  label:"Ciddi",  note:"~10 dk"},
  {xp:150, label:"Yoğun",  note:"~20 dk"},
];
const DEFAULT_DAILY_GOAL = 40;

/* --- Seri --- */
const MAX_FREEZES      = 2;   // aynı anda tutulabilecek en fazla dondurma
const FREEZE_EVERY     = 7;   // her 7 günlük seri katında 1 dondurma hediye
const STREAK_RISK_HOUR = 20;  // bu saatten sonra "serin risk altında" uyarısı
const XP_HISTORY_DAYS  = 90;  // günlük XP kaydının saklanma süresi

/* ============================= TARİH YARDIMCILARI ============================= */

function dateKey(d){
  d = d || new Date();
  const p = n => (n < 10 ? "0" : "") + n;
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function todayKey(){ return dateKey(); }

/* aKey'den bKey'e kaç gün? Bozuk anahtarda NaN döner — çağıran taraf kontrol eder. */
function daysBetween(aKey, bKey){
  const a = Date.parse(aKey + "T00:00:00Z");
  const b = Date.parse(bKey + "T00:00:00Z");
  if(isNaN(a) || isNaN(b)) return NaN;
  return Math.round((b - a) / 86400000);
}
function shiftDateKey(key, deltaDays){
  const ms = Date.parse(key + "T00:00:00Z");
  if(isNaN(ms)) return key;
  return new Date(ms + deltaDays * 86400000).toISOString().slice(0, 10);
}

/* ============================= DURUM GÖÇÜ (MIGRATION) =============================
   Ailenin mevcut hesaplarında bu alanların hiçbiri yok. Bu fonksiyon her giriş
   ve her yeni hesap oluşturmada çalışır; eksik alanı tamamlar, var olana
   dokunmaz. mastery/testHistory verisi ASLA sıfırlanmaz. */
function migrateState(s){
  if(!s || typeof s !== "object") return s;

  if(!s.mastery || typeof s.mastery !== "object") s.mastery = {};
  if(!Array.isArray(s.testHistory)) s.testHistory = [];
  if(typeof s.sessionsCompleted !== "number") s.sessionsCompleted = 0;

  if(!s.xp || typeof s.xp !== "object") s.xp = {total:0, byDate:{}};
  if(typeof s.xp.total !== "number") s.xp.total = 0;
  if(!s.xp.byDate || typeof s.xp.byDate !== "object") s.xp.byDate = {};

  if(typeof s.dailyGoal !== "number" || s.dailyGoal <= 0) s.dailyGoal = DEFAULT_DAILY_GOAL;

  if(!s.streak || typeof s.streak !== "object"){
    s.streak = {current:0, longest:0, lastActiveDate:null, freezes:MAX_FREEZES, freezeUsedDates:[]};
  } else {
    const st = s.streak;
    if(typeof st.current !== "number" || st.current < 0) st.current = 0;
    if(typeof st.longest !== "number" || st.longest < st.current) st.longest = st.current;
    if(typeof st.lastActiveDate !== "string") st.lastActiveDate = null;
    if(typeof st.freezes !== "number" || st.freezes < 0) st.freezes = 0;
    if(st.freezes > MAX_FREEZES) st.freezes = MAX_FREEZES;
    if(!Array.isArray(st.freezeUsedDates)) st.freezeUsedDates = [];
  }

  pruneXpHistory(s);
  return s;
}

/* Günlük XP kaydı sınırsız büyümesin: 90 günden eski ve (cihaz saati ileri
   alınmışsa oluşabilecek) gelecek tarihli kayıtları at. */
function pruneXpHistory(s){
  const t = todayKey();
  Object.keys(s.xp.byDate).forEach(k => {
    const d = daysBetween(k, t);
    if(isNaN(d) || d > XP_HISTORY_DAYS || d < -1) delete s.xp.byDate[k];
  });
}

/* ============================= XP ============================= */

function dailyGoal(){
  return (STATE && typeof STATE.dailyGoal === "number" && STATE.dailyGoal > 0)
    ? STATE.dailyGoal : DEFAULT_DAILY_GOAL;
}
function xpToday(){
  if(!STATE || !STATE.xp || !STATE.xp.byDate) return 0;
  return STATE.xp.byDate[todayKey()] || 0;
}
function xpRemainingToday(){ return Math.max(0, dailyGoal() - xpToday()); }
function goalReachedToday(){ return xpToday() >= dailyGoal(); }

/* XP ver. Hedef bu çağrıyla ilk kez aşıldıysa seriyi de ilerletir.
   Dönüş: {gained, goalJustReached, streak} — streak yalnızca hedef yeni
   aşıldığında dolu gelir (bkz. touchStreak). */
function awardXP(amount){
  const result = {gained:0, goalJustReached:false, streak:null};
  if(!STATE || typeof amount !== "number" || amount <= 0) return result;

  const t = todayKey();
  const before = xpToday();
  const wasReached = before >= dailyGoal();

  STATE.xp.byDate[t] = before + amount;
  STATE.xp.total = (STATE.xp.total || 0) + amount;
  result.gained = amount;
  pendingSave = true;

  if(!wasReached && STATE.xp.byDate[t] >= dailyGoal()){
    result.goalJustReached = true;
    result.streak = touchStreak();
  }
  if(typeof updateGameBar === "function") updateGameBar();
  return result;
}

/* ============================= SERİ ============================= */

/* Seriyi bugüne getirir. Dönüş: {changed, current, usedFreeze, broke, freezeEarned} */
function touchStreak(){
  const info = {changed:false, current:0, usedFreeze:0, broke:false, freezeEarned:0};
  if(!STATE || !STATE.streak) return info;

  const s = STATE.streak, t = todayKey();
  info.current = s.current;
  if(s.lastActiveDate === t) return info;   // bugün zaten sayıldı

  if(!s.lastActiveDate){
    s.current = 1;
  } else {
    const gap = daysBetween(s.lastActiveDate, t);
    if(isNaN(gap) || gap <= 0){
      /* Bozuk kayıt ya da cihaz saati geriye alınmış: seriyi kırma, ilerletme de. */
      s.current = Math.max(1, s.current);
    } else if(gap === 1){
      s.current = s.current + 1;
    } else {
      const missed = gap - 1;
      if(s.freezes >= missed){
        s.freezes -= missed;
        info.usedFreeze = missed;
        for(let i = missed; i >= 1; i--) s.freezeUsedDates.push(shiftDateKey(t, -i));
        if(s.freezeUsedDates.length > 50) s.freezeUsedDates = s.freezeUsedDates.slice(-50);
        s.current = s.current + 1;
      } else {
        s.current = 1;
        info.broke = true;
      }
    }
  }

  /* Her 7 günlük katta 1 dondurma hediye (tavan MAX_FREEZES). Dondurmanın
     kazanılabilir olmadığı bir sistemde alan tek kullanımlık olur ve sessizce
     tükenir; bu kural onu tutarlı hâle getiriyor. */
  if(s.current > 0 && s.current % FREEZE_EVERY === 0 && s.freezes < MAX_FREEZES){
    s.freezes++;
    info.freezeEarned = 1;
  }

  if(s.current > s.longest) s.longest = s.current;
  s.lastActiveDate = t;
  info.changed = true;
  info.current = s.current;
  pendingSave = true;
  return info;
}

/* "Serin bugün bitiyor" uyarısı yalnızca gerçekten öyleyse gösterilir:
   seri var, son aktif gün DÜN, bugün hedef henüz tamamlanmadı ve akşam olmuş. */
function streakAtRisk(){
  const s = STATE && STATE.streak;
  if(!s || !s.current || !s.lastActiveDate) return false;
  if(s.lastActiveDate === todayKey()) return false;
  if(daysBetween(s.lastActiveDate, todayKey()) !== 1) return false;
  return new Date().getHours() >= STREAK_RISK_HOUR;
}
