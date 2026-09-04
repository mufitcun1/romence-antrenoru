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
async function createAccountRecord(key, displayName, password){
  const salt = randomSaltHex();
  const hash = await hashPassword(password, salt);
  const data = {mastery:{}, testHistory:[], sessionsCompleted:0};
  ACCOUNTS.accounts[key] = { displayName, salt, hash, data };
  return {ok:true, key};
}

async function registerAccount(usernameRaw, displayNameRaw, password){
  const key = (usernameRaw||"").trim().toLowerCase();
  if(!key) return {ok:false, msg:"Kullanıcı adı boş olamaz."};
  if(key==="admin") return {ok:false, msg:'Bu kullanıcı adı ayrılmış — "Admin girişi" bağlantısını kullan.'};
  if(!/^[a-z0-9_.]{2,20}$/i.test(key)) return {ok:false, msg:"Kullanıcı adı yalnızca harf/rakam/._ içerebilir (2-20 karakter)."};
  if(ACCOUNTS.accounts[key]) return {ok:false, msg:"Bu kullanıcı adı zaten alınmış."};
  if(!password || password.length<3) return {ok:false, msg:"Şifre en az 3 karakter olmalı."};
  return createAccountRecord(key, (displayNameRaw||"").trim() || usernameRaw.trim(), password);
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
  if(!password || password.length<3) return {ok:false, msg:"Şifre en az 3 karakter olmalı."};
  const acc = ACCOUNTS.accounts['admin'];
  if(!acc || !acc.hash){
    const salt = randomSaltHex();
    const hash = await hashPassword(password, salt);
    const data = (acc && acc.data) ? acc.data : {mastery:{}, testHistory:[], sessionsCompleted:0};
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
  if(!acc) return {ok:false, msg:"Böyle bir kullanıcı bulunamadı."};
  const hash = await hashPassword(password, acc.salt);
  if(hash !== acc.hash) return {ok:false, msg:"Şifre yanlış."};
  return {ok:true, key};
}

function enterAsUser(key){
  currentUser = key;
  STATE = ACCOUNTS.accounts[key].data;
  if(!STATE.mastery) STATE.mastery = {};
  if(!STATE.testHistory) STATE.testHistory = [];
  if(!STATE.sessionsCompleted) STATE.sessionsCompleted = STATE.sessionsCompleted||0;
  try{ localStorage.setItem('romence_user', key); }catch(e){}
  showAppChrome(true);
  switchTab('practice');
}

function logoutUser(){
  currentUser = null; STATE = null;
  try{ localStorage.removeItem('romence_user'); }catch(e){}
  showAppChrome(false);
  authMode = "login";
  renderAuth();
}

function showAppChrome(show){
  const lr = document.getElementById('levelrow');
  const tb = document.getElementById('tabsRow');
  const ub = document.getElementById('userbar');
  if(lr) lr.style.display = show? '' : 'none';
  if(tb) tb.style.display = show? '' : 'none';
  if(ub){
    ub.style.display = show? 'flex' : 'none';
    if(show && currentUser && ACCOUNTS.accounts[currentUser]){
      const who = document.getElementById('userbarWho');
      if(who) who.textContent = '👤 ' + ACCOUNTS.accounts[currentUser].displayName;
    }
  }
}

function renderAuth(){
  showAppChrome(false);
  const isLogin = authMode==="login";
  root().innerHTML = `<div class="card">
    <div class="mascotwrap">${mascotSVG("happy",84)}</div>
    <div class="pill">${isLogin? "Giriş Yap":"Hesap Oluştur"}</div>
    <div class="qtext">${isLogin? "Ailene özel ilerlemeni görmek için giriş yap.":"Yeni bir hesap oluştur — ilerlemen bu hesaba kaydedilecek."}</div>
    <div class="inputrow" style="flex-direction:column;align-items:stretch">
      <input type="text" id="authUser" autocomplete="username" class="authinput" placeholder="Kullanıcı adı"/>
      ${isLogin? "" : `<input type="text" id="authDisplay" class="authinput" placeholder="Görünecek isim (opsiyonel)"/>`}
      <input type="password" id="authPass" autocomplete="${isLogin?'current-password':'new-password'}" class="authinput" placeholder="Şifre"/>
    </div>
    <div class="autherr" id="authErr"></div>
    <button class="btn" id="authSubmitBtn" style="width:100%;margin-top:14px">${isLogin? "Giriş Yap":"Hesap Oluştur"}</button>
    <div class="authswitch">${isLogin
      ? 'Hesabın yok mu? <a id="authSwitchLink">Hesap oluştur</a>'
      : 'Zaten hesabın var mı? <a id="authSwitchLink">Giriş yap</a>'}</div>
    ${isLogin? `<div class="authswitch" style="margin-top:4px"><a id="adminLink">Admin girişi</a></div>` : ""}
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
    } else {
      const dispInp = document.getElementById('authDisplay');
      res = await registerAccount(username, dispInp? dispInp.value : "", password);
    }
    submitBtn.disabled = false;
    submitting = false;
    if(!res.ok){ showErr(res.msg); return; }
    if(!isLogin) pendingSave = true; // yeni hesap: paylaşılan belgeye kaydedilmeli
    enterAsUser(res.key);
  }
  document.getElementById('authSubmitBtn').addEventListener('click', submit);
  passInp.addEventListener('keydown', e=>{ if(e.key==="Enter"){ e.preventDefault(); submit(); } });
  document.getElementById('authSwitchLink').addEventListener('click', ()=>{
    authMode = isLogin? "register":"login";
    renderAuth();
  });
  const adminLink = document.getElementById('adminLink');
  if(adminLink) adminLink.addEventListener('click', renderAdminAuth);
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
    enterAsUser(res.key);
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
  /* NOT: burada persist() ÇAĞRILMAZ — artifact.publish() yayınlayan görünüm
     dahil tüm açık sekmeleri yeniden yükler. Soru başına kaydetmek, oturum
     ortasında sayfayı sıfırlardı. Kayıt sadece kullanıcı ana ekrana dönünce
     veya sekme değiştirince yapılır (bkz. goHomeAndSave / switchTab), böylece
     sonuç ekranı veya yeni bir tur asla elinden alınmaz. */
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
async function doPublish(){
  /* STATE, o an giriş yapmış kullanıcının veri dilimidir (zaten aynı referans
     olduğu için bu satır çoğunlukla no-op'tur, ama güvenlik ağı olarak
     bırakıyoruz). Kaydedilen belge TÜM kullanıcıların hesaplarını birlikte
     taşıyor, böylece bir aile üyesinin kaydı diğerlerinin hesabını silmiyor. */
  if(currentUser && ACCOUNTS && ACCOUNTS.accounts[currentUser]) ACCOUNTS.accounts[currentUser].data = STATE;
  const ok = await saveAccountsToStorage(ACCOUNTS);
  pendingSave = false;
  if(ok){
    const p=document.getElementById('savepill');
    if(p){ p.classList.add('show'); setTimeout(()=>p.classList.remove('show'),1400); }
  }
}
/* Sonuç ekranından ana ekrana dönerken: varsa bekleyen ilerlemeyi hemen kaydet. */
function goHome(){
  if(pendingSave){
    clearTimeout(saveTimer);
    doPublish();
  }
  switchTab('practice');
}
