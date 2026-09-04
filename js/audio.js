/* ============================= SESLİ OKUMA (DİNLEME) ============================= */
/* 332 A1/A2 kelime ve cümlenin gerçek Romence telaffuzu (espeak-ng + mbrola-ro1
   Romence ses motoruyla üretilmiş, düşük bitrate mp3) assets/audio/ altında ayrı
   dosyalar olarak duruyor; assets/audio/manifest.json metin -> dosya adı eşlemesini
   taşıyor. Bu sayede tarayıcının kurulu ses paketine bağımlı kalmıyoruz: "mașină"
   gibi kelimeler her cihazda aynı, doğru Romence telaffuzla çalıyor — ve dosyalar
   yalnızca gerektiğinde (çalınırken) ağdan çekiliyor, sayfa yüklenişini şişirmiyor.
   Havuzda olmayan bir metin gelirse tarayıcının kendi sesli okumasına (varsa)
   düşüyoruz — aşağıdaki eski mantık bu durumda hâlâ devrede. */
let RO_AUDIO_MANIFEST = {};
let roAudioManifestReady = (async function loadRoAudioManifest(){
  try{
    const res = await fetch('assets/audio/manifest.json');
    if(res.ok) RO_AUDIO_MANIFEST = await res.json();
  }catch(e){ RO_AUDIO_MANIFEST = {}; }
})();
function hasPreGenAudio(text){ return !!(RO_AUDIO_MANIFEST && Object.prototype.hasOwnProperty.call(RO_AUDIO_MANIFEST, text)); }
function hasAudioPlayback(){ return typeof Audio !== "undefined"; }

/* window varlığını typeof ile kontrol ediyoruz — bu, tarayıcı dışı ortamlarda
   (örn. Node test harness) "window is not defined" hatası fırlatmadan, sesli
   okumanın desteklenmediğini sessizce tespit etmemizi sağlıyor. */
function hasSpeech(){ return typeof window !== "undefined" && !!window.speechSynthesis; }
let romanianVoice = null;
function pickRomanianVoice(){
  if(!hasSpeech()) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  /* Önce dil kodu ro/ro-RO olan gerçek bir ses ara; bazı sistemlerde dil kodu
     farklı raporlanabildiği için isimde "roman" geçen bir sesi de yedek olarak dene. */
  return voices.find(v=> v.lang && v.lang.toLowerCase().startsWith('ro'))
      || voices.find(v=> v.name && v.name.toLowerCase().includes('roman'))
      || null;
}
if(hasSpeech()){
  window.speechSynthesis.onvoiceschanged = ()=>{ romanianVoice = pickRomanianVoice(); };
  romanianVoice = pickRomanianVoice();
}
function speakWithBrowserVoice(text){
  if(!hasSpeech()) return false;
  try{
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = 'ro-RO';
    if(romanianVoice) u.voice = romanianVoice;
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
    return true;
  }catch(e){ return false; }
}
function speak(text){
  /* Öncelik: önceden üretilmiş gerçek Romence ses klibi (en güvenilir). Manifest
     henüz yüklenmemiş olabilir (ilk birkaç yüz ms) — o durumda tarayıcı sesine düş. */
  if(hasPreGenAudio(text) && hasAudioPlayback()){
    try{
      const a = new Audio('assets/audio/' + RO_AUDIO_MANIFEST[text]);
      a.play().catch(()=>{ speakWithBrowserVoice(text); });
      return true;
    }catch(e){ /* düş: aşağıdaki tarayıcı sesine geç */ }
  }
  return speakWithBrowserVoice(text);
}
