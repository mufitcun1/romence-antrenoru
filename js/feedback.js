/* ============================= SES VE TİTREŞİM GERİ BİLDİRİMİ =============================
   Cevap verirken "bir şey oldu" hissi veren ince katman. Ses dosyası YOK —
   tonlar Web Audio API ile anlık üretiliyor (toplam ~0 KB indirme, çevrimdışı
   da çalışır, service worker'a yeni varlık eklemiyor).

   Tarayıcı otomatik oynatma politikası gereği AudioContext ancak bir kullanıcı
   hareketinden sonra kurulabilir; bu yüzden bağlam ilk ses çalma anında (ki o
   an her zaman bir tıklamanın ardından gelir) tembel olarak yaratılıyor.

   Açık/kapalı tercihi CİHAZA özel (tema seçimiyle aynı desen): ortak hesap
   verisine değil bu tarayıcının localStorage'ına yazılıyor. Aynı hesabı
   kullanan iki kişiden biri sessiz çalışmak isteyebilir. */

const SFX_KEY = "romence_sfx";
let sfxEnabled = true;
let audioCtx = null;

function sfxAvailable(){
  return typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
}

function getAudioCtx(){
  if(audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return null;
  try{ audioCtx = new Ctx(); }catch(e){ audioCtx = null; }
  return audioCtx;
}

/* notes: [{f: frekans, t: başlangıç sn, d: süre sn}] — basit zarf (attack/release)
   ile çalınır. Zarf olmadan kısa tonlar "tık" sesi çıkarır. */
function playNotes(notes, type, peak){
  if(!sfxEnabled) return;
  const ctx = getAudioCtx();
  if(!ctx) return;
  if(ctx.state === "suspended"){ try{ ctx.resume(); }catch(e){} }
  const now = ctx.currentTime;
  notes.forEach(n => {
    try{
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.0001, now + n.t);
      gain.gain.exponentialRampToValueAtTime(peak || 0.16, now + n.t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }catch(e){ /* ses hiçbir zaman akışı bozmamalı */ }
  });
}

function vibrate(pattern){
  if(!sfxEnabled) return;
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}

/* Doğru: yükselen iki nota. Yanlış: alçak, kısa ve boğuk — cezalandırıcı
   değil, yalnızca ayırt edici olsun diye yumuşak tutuldu. */
function sfxCorrect(){
  playNotes([{f:660,t:0,d:0.10},{f:880,t:0.075,d:0.13}], "sine", 0.15);
  vibrate(25);
}
function sfxWrong(){
  playNotes([{f:180,t:0,d:0.16}], "triangle", 0.12);
  vibrate([30,50,30]);
}
function sfxCombo(){
  playNotes([{f:880,t:0,d:0.07},{f:1175,t:0.06,d:0.09}], "sine", 0.13);
  vibrate([15,30,15]);
}
function sfxSessionEnd(){
  playNotes([{f:523,t:0,d:0.13},{f:659,t:0.11,d:0.13},{f:784,t:0.22,d:0.22}], "sine", 0.16);
  vibrate([25,45,25,45,45]);
}
function sfxStreak(){
  playNotes([{f:659,t:0,d:0.11},{f:784,t:0.10,d:0.11},{f:988,t:0.20,d:0.16},{f:1319,t:0.32,d:0.26}], "sine", 0.17);
  vibrate([30,40,30,40,70]);
}

/* --- Açık/kapalı düğmesi --- */
function applySfx(on){
  sfxEnabled = !!on;
  const btn = document.getElementById('sfxToggle');
  if(btn){
    btn.textContent = sfxEnabled ? "🔊" : "🔇";
    btn.setAttribute('aria-pressed', sfxEnabled ? "true" : "false");
    btn.setAttribute('title', sfxEnabled ? "Ses ve titreşim açık" : "Ses ve titreşim kapalı");
    btn.classList.toggle('off', !sfxEnabled);
  }
  try{ localStorage.setItem(SFX_KEY, sfxEnabled ? "on" : "off"); }catch(e){}
}

function initSfx(){
  let on = true;
  try{ if(localStorage.getItem(SFX_KEY) === "off") on = false; }catch(e){}
  const btn = document.getElementById('sfxToggle');
  if(btn && !sfxAvailable()) btn.style.display = "none";   // ses üretilemiyorsa düğmeyi hiç gösterme
  applySfx(on);
  if(btn) btn.addEventListener('click', ()=> applySfx(!sfxEnabled));
}
