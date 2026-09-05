/* ============================= UI ============================= */
let activeTab = "practice";
let currentEx = null;
let sessionQueue = [];
let sessionIdx = 0;
let sessionScore = {correct:0,total:0};
let testMode = false;
let testResults = [];
let practiceFilter = "mixed"; // mixed | voc | ver | gram | lis | cum
/* Bu turda kazanılan ödüller — tur sonu ekranında gösterilir, her tur başında
   resetSessionRewards() ile sıfırlanır. */
let sessionXp = 0;              // bu turda toplanan XP
let sessionGoalReached = false; // günlük hedef bu turda mı tamamlandı
let sessionFirstOfDay = false;  // bu tur günün ilk turu mu (bonus için)
const FILTER_OPTS = [
  {key:"mixed", label:"Karışık"},
  {key:"voc", label:"İsim / Kelime"},
  {key:"ver", label:"Fiil"},
  {key:"gram", label:"Cümle / Gramer"},
  {key:"lis", label:"🎧 Dinleme"},
  {key:"cum", label:"📝 Cümle Kurma"},
];
function ratiosForFilter(filter){
  if(filter==="voc") return {vocRatio:1, verRatio:0, lisRatio:0, cumRatio:0};
  if(filter==="ver") return {vocRatio:0, verRatio:1, lisRatio:0, cumRatio:0};
  if(filter==="gram") return {vocRatio:0, verRatio:0, lisRatio:0, cumRatio:0};
  if(filter==="lis") return {vocRatio:0, verRatio:0, lisRatio:1, cumRatio:0};
  if(filter==="cum") return {vocRatio:0, verRatio:0, lisRatio:0, cumRatio:1};
  return {vocRatio:0.3, verRatio:0.2, lisRatio:0.15, cumRatio:0.15}; // mixed (gram kalanı tamamlar)
}

function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
function root(){ return document.getElementById('app-root'); }

/* Üst bardaki seri + günlük XP göstergesini güncel değerlere göre çizer.
   #app-root'un dışında durduğu için ekran değişimlerinden etkilenmez; her
   XP kazanımından sonra (awardXP içinden) ve sekme geçişlerinde çağrılır. */
function updateGameBar(){
  const bar = document.getElementById('gamebar');
  if(!bar || !STATE) return;
  const st = STATE.streak || {current:0};
  const goal = dailyGoal(), today = xpToday();
  const pct = Math.min(100, Math.round(100*today/goal));
  const n = document.getElementById('gStreakNum'); if(n) n.textContent = st.current || 0;
  const x = document.getElementById('gXpNum');     if(x) x.textContent = today + "/" + goal;
  const b = document.getElementById('gXpBar');     if(b){ b.style.width = pct + "%"; b.classList.toggle('good', today>=goal); }
  bar.classList.toggle('active', (st.current||0) > 0);
  bar.classList.toggle('goaldone', today >= goal);
}

function resetSessionRewards(){
  sessionXp = 0;
  sessionGoalReached = false;
  /* "Günün ilk turu" bonusu: tur BAŞLARKEN bugün hiç XP kazanılmamışsa. */
  sessionFirstOfDay = (xpToday() === 0);
}

function buildSessionQueue(n, opts){
  opts = opts||{};
  const nVoc = opts.vocRatio!==undefined ? Math.round(n*opts.vocRatio) : Math.round(n*0.3);
  const nVer = opts.verRatio!==undefined ? Math.round(n*opts.verRatio) : Math.round(n*0.2);
  const nLis = opts.lisRatio!==undefined ? Math.round(n*opts.lisRatio) : Math.round(n*0.15);
  const nCum = opts.cumRatio!==undefined ? Math.round(n*opts.cumRatio) : Math.round(n*0.15);
  const nGram = Math.max(0, n - nVoc - nVer - nLis - nCum);
  const vocIds = weightedSample(VOCAB.map(v=>v[4]), nVoc);
  const verIds = weightedSample(VERBS.map(v=>v[5]), nVer);
  /* Dinleme de kelime havuzundan örnekleniyor (ayrı bir örnekleme çağrısıyla —
     aynı turda voc ile çakışması kasıtlı sorun değil, farklı beceriyi (kulak) test ediyor). */
  const lisIds = weightedSample(VOCAB.map(v=>v[4]), nLis);
  const q = [];
  vocIds.forEach(id=> q.push({type:"voc", data:VOCAB.find(v=>v[4]===id)}));
  verIds.forEach(id=> q.push({type:"ver", data:VERBS.find(v=>v[5]===id)}));
  lisIds.forEach(id=> q.push({type:"lis", data:VOCAB.find(v=>v[4]===id)}));
  /* Cümle kurma: yarısı sabit (gerçek ders cümleleri, sesi hazır, ustalık
     takip edilir), yarısı dinamik (sınırsız kombinasyon, id/ustalık yok). */
  const nCumFixed = Math.round(nCum*0.5);
  const nCumDyn = nCum - nCumFixed;
  const cumIds = weightedSample(FIXED_SENTENCES.map(s=>s[2]), nCumFixed);
  cumIds.forEach(id=>{
    const s = FIXED_SENTENCES.find(x=>x[2]===id);
    q.push({type:"cum", data:{ro:s[0], tr:s[1], id:s[2]}});
  });
  for(let i=0;i<nCumDyn;i++){
    const s = genDynamicSentence();
    q.push({type:"cum", data:{ro:s.ro, tr:s.tr}});
  }
  for(let i=0;i<nGram;i++) q.push({type:"gram", data:pick(GRAMMAR_TOPICS)});
  return shuffle(q);
}

function nextExercise(){
  if(sessionIdx>=sessionQueue.length){ renderSessionDone(); return; }
  const item = sessionQueue[sessionIdx];
  if(item.type==="voc") currentEx = exerciseForVocab(item.data);
  else if(item.type==="ver") currentEx = exerciseForVerb(item.data);
  else if(item.type==="lis") currentEx = exerciseForListening(item.data);
  else if(item.type==="cum") currentEx = exerciseForSentence(item.data);
  else currentEx = exerciseForGrammar(item.data);
  if(item._retry) currentEx.isRetry = true;   // tur sonunda geri gelen yanlış soru
  renderExercise();
}

function renderExercise(){
  const total = sessionQueue.length;
  const idx = sessionIdx+1;
  const exPct = Math.round((idx/total)*100);
  let body = `<div class="exprogress"><div class="track"><div class="fill" style="width:${exPct}%"></div></div>
    <div class="caption">${testMode?"Deneme Sınavı":"Pratik"} — Soru ${idx}/${total}${currentEx.isRetry?' · <span class="retrytag">&#128260; tekrar</span>':''}</div></div>`;
  body += `<div class="card">`;
  const pillIcon = currentEx.catKey ? categoryIconSVG(currentEx.catKey,15) : "";
  body += `<span class="pill">${pillIcon}${currentEx.hint||""}</span>`;
  body += `<div class="qtext">${currentEx.prompt}</div>`;
  if(currentEx.cue){ body += `<div class="cuebox">${currentEx.cue}</div>`; }
  if(currentEx.listen){
    const preGen = hasPreGenAudio(currentEx.audioText) && hasAudioPlayback();
    if(preGen || hasSpeech()){
      body += `<div class="audiorow" style="display:flex;align-items:center;gap:10px;margin:2px 0 14px">
        <button class="btn secondary" id="playBtn" type="button">🔊 Dinle</button>
        <span style="color:var(--ink-dim);font-size:.8rem">Gerektiği kadar tekrar dinleyebilirsin</span>
      </div>`;
      if(!preGen && !romanianVoice){
        /* Önceden üretilmiş ses klibi yok VE cihazda gerçek bir Romence ses de
           bulunamadı — bu durumda tarayıcının kendi sesine düşüyoruz, o da
           İngilizce/varsayılan bir sesin Romence metni okumaya çalışmasından
           kaynaklı hatalı/garip çıkabilir (örn. "mașină" yanlış duyulabilir).
           Kullanıcıyı önceden uyarıyoruz; doğru yazılış cevaptan sonra her
           zaman gösteriliyor. A1 kelime dağarcığının tamamı önceden üretilmiş
           gerçek Romence sesle geldiği için bu uyarı pratikte artık nadiren çıkar. */
        body += `<div style="margin:-8px 0 14px;color:var(--ink-dim);font-size:.78rem">⚠️ Bu cihazda gerçek bir Romence ses bulunamadı — telaffuz yaklaşık/hatalı çıkabilir. Doğru yazılışı her zaman cevapladıktan sonra göreceksin.</div>`;
      }
    } else {
      body += `<div class="audiorow" style="margin:2px 0 14px;color:var(--ink-dim);font-size:.85rem">🔇 Bu cihazda sesli okuma desteklenmiyor, bu yüzden kelimeyi burada gösteriyoruz: <b>${currentEx.audioText}</b></div>`;
    }
  }
  if(currentEx.kind==="mc"){
    body += `<div class="opts" id="opts">`;
    currentEx.options.forEach((o,i)=>{ body += `<button class="opt" data-val="${encodeURIComponent(o)}">${o}</button>`; });
    body += `</div>`;
  } else if(currentEx.kind==="order"){
    body += `<div class="orderbuilt" id="orderBuilt"><span class="orderhint">Kelimeleri sürükle veya tıkla, cümleyi buraya oluştur…</span></div>`;
    body += `<div class="orderbank" id="orderBank"></div>`;
    body += `<div class="row" style="margin-top:10px;gap:8px"><button class="btn secondary" id="clearOrderBtn" type="button">Temizle</button><button class="btn" id="checkOrderBtn" type="button">Kontrol Et</button></div>`;
  } else {
    body += `<div class="inputrow"><input type="text" id="typeInput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Cevabını yaz..."/><button class="btn" id="checkBtn">Kontrol Et</button></div>`;
    if(currentEx.needsRoChars){
      body += `<div class="charrow" id="charRow">`;
      ROMANIAN_CHARS.forEach(c=>{ body += `<button type="button" class="charbtn" data-ch="${c}">${c}</button>`; });
      body += `</div>`;
    }
  }
  body += `<div class="feedback" id="feedback"></div>`;
  body += `<div class="row" style="margin-top:14px"><button class="btn secondary" id="skipBtn">Atla</button><button class="btn" id="nextBtn" style="display:none">Devam →</button></div>`;
  body += `</div>`;
  root().innerHTML = body;

  if(currentEx.listen && (hasPreGenAudio(currentEx.audioText) && hasAudioPlayback() || hasSpeech())){
    document.getElementById('playBtn').addEventListener('click', ()=> speak(currentEx.audioText));
    speak(currentEx.audioText);
  }
  if(currentEx.kind==="mc"){
    document.querySelectorAll('#opts .opt').forEach(btn=>{
      btn.addEventListener('click', ()=> answer(decodeURIComponent(btn.getAttribute('data-val')), btn));
    });
  } else if(currentEx.kind==="order"){
    /* Kelime sıralama: kelime bankasındaki her kelime kendi orijinal (karışık)
       indeksiyle takip edilir (aynı kelime birden fazla geçebilir diye index
       bazlı, metin bazlı değil). built dizisi kullanıcının sırasını tutar.
       Hem tıklama (dokunmatik/mobil için güvenilir yedek) hem de gerçek
       sürükle-bırak (HTML5 drag&drop) destekleniyor — ikisi de aynı
       used/built state'ini günceller. */
    const orderWords = currentEx.words;
    let used = new Set();
    let built = [];
    let dragSource = null; // {from:'bank', i} veya {from:'built', pos}

    function getInsertIndex(container, clientX, clientY){
      const chips = [...container.querySelectorAll('.wordchip')].filter(el=> !el.classList.contains('dragging'));
      if(chips.length===0) return 0;
      let closest=0, closestDist=Infinity, before=true;
      chips.forEach((chip, idx)=>{
        const r = chip.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        const dist = Math.hypot(clientX-cx, clientY-cy);
        if(dist<closestDist){ closestDist=dist; closest=idx; before = clientX<cx; }
      });
      return before ? closest : closest+1;
    }

    function renderBank(){
      const bank = document.getElementById('orderBank');
      bank.innerHTML = orderWords.map((w,i)=> used.has(i) ? "" :
        `<button type="button" class="wordchip" data-i="${i}" draggable="true">${w}</button>`).join('');
      bank.querySelectorAll('.wordchip').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const i = +btn.getAttribute('data-i');
          used.add(i); built.push(i);
          renderBank(); renderBuilt();
        });
        btn.addEventListener('dragstart', (e)=>{
          dragSource = {from:'bank', i:+btn.getAttribute('data-i')};
          btn.classList.add('dragging');
          if(e.dataTransfer){ e.dataTransfer.effectAllowed='move'; try{ e.dataTransfer.setData('text/plain', btn.getAttribute('data-i')); }catch(err){} }
        });
        btn.addEventListener('dragend', ()=>{ btn.classList.remove('dragging'); dragSource=null; });
      });
    }
    function renderBuilt(){
      const builtEl = document.getElementById('orderBuilt');
      if(built.length===0){
        builtEl.innerHTML = `<span class="orderhint">Kelimeleri sürükle veya tıkla, cümleyi buraya oluştur…</span>`;
        return;
      }
      builtEl.innerHTML = built.map((i,pos)=>
        `<button type="button" class="wordchip built" data-pos="${pos}" draggable="true">${orderWords[i]}</button>`).join('');
      builtEl.querySelectorAll('.wordchip').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const pos = +btn.getAttribute('data-pos');
          const i = built[pos];
          built.splice(pos,1); used.delete(i);
          renderBank(); renderBuilt();
        });
        btn.addEventListener('dragstart', (e)=>{
          dragSource = {from:'built', pos:+btn.getAttribute('data-pos')};
          btn.classList.add('dragging');
          if(e.dataTransfer){ e.dataTransfer.effectAllowed='move'; try{ e.dataTransfer.setData('text/plain', 'built:'+btn.getAttribute('data-pos')); }catch(err){} }
        });
        btn.addEventListener('dragend', ()=>{ btn.classList.remove('dragging'); dragSource=null; });
      });
    }
    renderBank(); renderBuilt();

    const bankZone = document.getElementById('orderBank');
    const builtZone = document.getElementById('orderBuilt');
    builtZone.addEventListener('dragover', (e)=>{
      if(!dragSource) return;
      e.preventDefault();
      if(e.dataTransfer) e.dataTransfer.dropEffect='move';
      builtZone.classList.add('dragover');
    });
    builtZone.addEventListener('dragleave', ()=> builtZone.classList.remove('dragover'));
    builtZone.addEventListener('drop', (e)=>{
      e.preventDefault();
      builtZone.classList.remove('dragover');
      if(!dragSource) return;
      const insertAt = getInsertIndex(builtZone, e.clientX, e.clientY);
      if(dragSource.from==='bank'){
        used.add(dragSource.i);
        built.splice(insertAt, 0, dragSource.i);
      } else {
        const [moved] = built.splice(dragSource.pos, 1);
        built.splice(insertAt, 0, moved);
      }
      dragSource = null;
      renderBank(); renderBuilt();
    });
    bankZone.addEventListener('dragover', (e)=>{
      if(!dragSource || dragSource.from!=='built') return;
      e.preventDefault();
      if(e.dataTransfer) e.dataTransfer.dropEffect='move';
      bankZone.classList.add('dragover');
    });
    bankZone.addEventListener('dragleave', ()=> bankZone.classList.remove('dragover'));
    bankZone.addEventListener('drop', (e)=>{
      e.preventDefault();
      bankZone.classList.remove('dragover');
      if(!dragSource || dragSource.from!=='built') return;
      const [moved] = built.splice(dragSource.pos, 1);
      used.delete(moved);
      dragSource = null;
      renderBank(); renderBuilt();
    });

    document.getElementById('clearOrderBtn').addEventListener('click', ()=>{
      used = new Set(); built = []; renderBank(); renderBuilt();
    });
    document.getElementById('checkOrderBtn').addEventListener('click', ()=>{
      const builtStr = built.map(i=>orderWords[i]).join(' ');
      const correct = norm(builtStr)===norm(currentEx.answer);
      const final = markResult(correct);
      if(final){
        document.querySelectorAll('#orderBank .wordchip, #orderBuilt .wordchip').forEach(b=> { b.disabled=true; b.setAttribute('draggable','false'); });
        document.getElementById('clearOrderBtn').disabled = true;
        document.getElementById('checkOrderBtn').disabled = true;
      }
      /* final değilse (yanlış ama tekrar hakkı var): hiçbir şeyi kilitlemiyoruz,
         kullanıcı kelimeleri sürükleyip/tıklayıp düzenleyerek tekrar deneyebilir. */
    });
  } else {
    const inp = document.getElementById('typeInput');
    inp.focus();
    inp.addEventListener('keydown', e=>{ if(e.key==="Enter"){ e.preventDefault(); answer(inp.value, null); } });
    document.getElementById('checkBtn').addEventListener('click', ()=> answer(inp.value, null));
    if(currentEx.needsRoChars){
      document.querySelectorAll('#charRow .charbtn').forEach(btn=>{
        btn.addEventListener('click', ()=> insertChar(inp, btn.getAttribute('data-ch')));
      });
    }
  }
  document.getElementById('skipBtn').addEventListener('click', ()=> { markResult(false, "(atlandı)", true); });
}

function insertChar(inp, ch){
  const start = inp.selectionStart!=null? inp.selectionStart : inp.value.length;
  const end = inp.selectionEnd!=null? inp.selectionEnd : inp.value.length;
  inp.value = inp.value.slice(0,start) + ch + inp.value.slice(end);
  const pos = start + ch.length;
  inp.focus();
  if(inp.setSelectionRange) inp.setSelectionRange(pos,pos);
}

const MAX_ATTEMPTS = 2; // her soruda iki cevap hakkı — ilk yanlışta "tekrar dene" diyoruz

function answer(val, btnEl){
  const correct = norm(val)===norm(currentEx.answer);
  const final = markResult(correct);
  if(currentEx.kind==="mc"){
    if(final){
      document.querySelectorAll('#opts .opt').forEach(b=>{
        b.disabled = true;
        const v = decodeURIComponent(b.getAttribute('data-val'));
        if(norm(v)===norm(currentEx.answer)) b.classList.add('correct');
        else if(b===btnEl) b.classList.add('wrong');
      });
    } else if(btnEl){
      /* Yanlış ama tekrar hakkı var: doğru cevabı göstermeden yalnızca
         tıklanan yanlış seçeneği kilitliyoruz, diğerleri denenebilir kalıyor. */
      btnEl.disabled = true;
      btnEl.classList.add('wrong');
    }
  } else {
    if(final){
      document.getElementById('typeInput').disabled = true;
      document.getElementById('checkBtn').disabled = true;
    } else {
      const inp = document.getElementById('typeInput');
      if(inp){ inp.value = ""; inp.focus(); }
    }
  }
}

function markResult(correct, note, noRetry){
  /* İki cevap hakkı: ilk yanlışta (skip/atla hariç) soruyu sonuçlandırmadan
     "tekrar dene" gösteriyoruz; kayıt (mastery/skor) yalnızca final olduğunda
     yapılıyor. Çağıran taraf, dönen değere göre (final mi değil mi) alanları
     kilitleyip kilitlemeyeceğine karar veriyor. */
  currentEx._attempts = (currentEx._attempts||0) + 1;
  const isFinal = correct || noRetry || currentEx._attempts >= MAX_ATTEMPTS;
  const fb = document.getElementById('feedback');
  if(!isFinal){
    if(fb){
      fb.classList.remove('good','bad');
      fb.classList.add('show','bad');
      fb.innerHTML = `<div class="ficon">✕</div><div class="ftext"><b>Yanlış!</b> Tekrar dene 💪</div>`;
    }
    return false;
  }
  if(!currentEx._done){
    currentEx._done = true;
    /* Dinamik olarak üretilen cümlelerin id'si yok (sonsuz çeşitlilik —
       tek bir öğe olarak "ustalık" takibi anlamlı değil), bu yüzden
       yalnızca id'si olan alıştırmalarda ustalık kaydı tutuyoruz. */
    if(currentEx.id) recordAnswer(currentEx.id, correct);

    /* Tur skoru ve XP yalnızca sorunun İLK sorulduğu hâli için işlenir.
       Tur sonunda geri gelen tekrar soruları (isRetry) skoru şişirmesin ve
       XP kazandırmasın — yoksa yanlış yapmak ödüllendirilmiş olurdu.
       Ustalık kaydı (recordAnswer) ise tekrarlarda da işler; asıl öğrenme
       orada gerçekleşiyor. */
    if(!currentEx.isRetry){
      sessionScore.total++; if(correct) sessionScore.correct++;
      if(testMode) testResults.push({cat: sessionQueue[sessionIdx].type, correct});
      if(correct){
        const gain = currentEx._attempts <= 1 ? XP_FIRST_TRY : XP_SECOND_TRY;
        sessionXp += gain;
        if(awardXP(gain).goalJustReached) sessionGoalReached = true;
      }
    }

    /* Yanlış cevaplanan (veya atlanan) soru turun SONUNA eklenir; tur, o soru
       bir kez daha sorulmadan bitmez. Sınavda yapılmaz — sınav bir ölçüm
       aracıdır, öğretme turu değil. Zaten tekrar olan soru yeniden
       kuyruğa alınmaz (sonsuz döngü olurdu). */
    if(!correct && !testMode && !currentEx.isRetry){
      const item = sessionQueue[sessionIdx];
      if(item) sessionQueue.push(Object.assign({}, item, {_retry:true}));
    }

    /* Soru başına kaydet (900 ms debounce). Artifact platformundan çıkıldığı
       için kaydetmek artık sayfayı yeniden yüklemiyor; ertelemenin tek etkisi
       tur ortasında kapatan kullanıcının ilerlemesini kaybetmesiydi. */
    persist();
  }
  if(fb){
    fb.classList.remove('good','bad');
    fb.classList.add('show', correct?'good':'bad');
    /* Doğru bilinince de yazılışı gösteriyoruz — hem cevap kontrolü aksan/noktalama
       farkını görmezden geldiği için (norm() diyakritik-duyarsız), hem de dinleme
       sorularında (answer Türkçe olabiliyor) Romence yazılışı hiç görünmüyordu. */
    const spellingLine = currentEx.roDisplay
      ? `<div style="margin-top:4px;color:var(--ink-dim);font-size:.85rem">Yazılışı: <b style="color:var(--ink)">${currentEx.roDisplay}</b></div>`
      : "";
    fb.innerHTML = correct
      ? `<div class="ficon">✓</div><div class="ftext"><b>Doğru!</b>${spellingLine}</div>`
      : `<div class="ficon">✕</div><div class="ftext"><b>Doğru cevap:</b> ${currentEx.answer}${(currentEx.roDisplay && currentEx.roDisplay!==currentEx.answer) ? spellingLine : ""}</div>`;
  }
  const skip = document.getElementById('skipBtn'); if(skip) skip.style.display='none';
  const nb = document.getElementById('nextBtn');
  if(nb){
    nb.style.display='inline-block';
    /* Enter tuşuyla cevap kontrol edilirken bu fonksiyon odağı hemen bu
       düğmeye taşırsa, aynı fiziksel Enter tuşunun "keyup"ı bu (artık
       odaklanmış) düğmede bir tıklama gibi algılanıp kullanıcı geri
       bildirimi görmeden bir sonraki soruya atlatıyordu. Kısa bir koruma
       penceresiyle (gerçek bir tıklama/Enter çok daha geç gelir) ve odağı
       biraz geciktirerek bunu engelliyoruz. */
    const guardUntil = Date.now() + 350;
    nb.onclick = ()=>{
      if(Date.now() < guardUntil) return;
      sessionIdx++; nextExercise();
    };
    setTimeout(()=>{ if(document.getElementById('nextBtn')===nb) nb.focus(); }, 350);
  }
  return true;
}

/* Tur/sınav sonucu ekranlarında düz "8/10" yazısı yerine animasyonlu, yüzdeye
   göre renklenen bir daire (SVG) gösteriyoruz — Duolingo tarzı başarı
   ekranlarında iyi çalıştığı görülen bir örüntü. Animasyon SMIL <animate> ile
   (ekstra kütüphane gerektirmiyor); prefers-reduced-motion açıksa halka
   doğrudan son haliyle, animasyonsuz çiziliyor. */
function scoreRingSVG(pct){
  pct = Math.max(0, Math.min(100, pct));
  const size=132, stroke=10, r=(size-stroke)/2, c=2*Math.PI*r;
  const offset = c - (pct/100)*c;
  const color = pct>=80 ? "var(--good)" : pct>=50 ? "var(--accent)" : "var(--bad)";
  let reduced = false;
  try{ reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
  const animTag = reduced ? "" : `<animate attributeName="stroke-dashoffset" from="${c.toFixed(2)}" to="${offset.toFixed(2)}" dur="0.9s" fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1"/>`;
  return `<svg class="scorering" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Yüzde ${pct}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--chip)" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(reduced?offset:c).toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})">${animTag}</circle>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${Math.round(size*0.22)}" font-weight="800" fill="var(--ink)">%${pct}</text>
  </svg>`;
}

/* Turu bitirme ödülleri. Ekran çizilmeden ÖNCE çağrılır ki ödül kutusu
   güncel XP/seri değerlerini göstersin. */
function grantSessionEndXP(wasTest){
  let bonus = wasTest ? XP_TEST_END : XP_SESSION_END;
  if(!wasTest && sessionScore.total > 0 && sessionScore.correct === sessionScore.total) bonus += XP_PERFECT;
  if(sessionFirstOfDay) bonus += XP_FIRST_TODAY;
  sessionXp += bonus;
  if(awardXP(bonus).goalJustReached) sessionGoalReached = true;
}

/* Tur ve sınav sonu ekranlarının ortak ödül kutusu: kazanılan XP, günlük
   hedefe göre konum ve serinin durumu. */
function rewardBoxHTML(){
  const goal = dailyGoal(), today = xpToday();
  const pct = Math.min(100, Math.round(100*today/goal));
  const st = STATE.streak || {current:0};
  const done = today >= goal;
  let streakRow;
  if(sessionGoalReached){
    streakRow = `<div class="rewardstreak big"><span class="rflame pop">&#128293;</span>
      <div><b>${st.current} günlük seri</b><small>Günlük hedefini tamamladın — serin sürüyor.</small></div></div>`;
  } else if(done){
    streakRow = `<div class="rewardstreak"><span class="rflame">&#128293;</span>
      <div><b>${st.current} günlük seri</b><small>Bugünkü hedefin zaten tamamdı.</small></div></div>`;
  } else {
    streakRow = `<div class="rewardstreak"><span class="rflame dim">&#128293;</span>
      <div><b>${st.current} günlük seri</b><small>Seriyi sürdürmek için ${goal-today} XP daha gerekiyor.</small></div></div>`;
  }
  return `<div class="rewardbox">
    <div class="xpgain">+${sessionXp} XP</div>
    <div class="goalrow"><span>Günlük hedef</span><span>${today}/${goal} XP</span></div>
    <div class="barwrap"><div class="bar${done?' good':''}" style="width:${pct}%"></div></div>
    ${streakRow}
  </div>`;
}

function renderSessionDone(){
  const wasTest = testMode;
  const pct = sessionScore.total? Math.round(100*sessionScore.correct/sessionScore.total):0;
  STATE.sessionsCompleted = (STATE.sessionsCompleted||0)+1;
  grantSessionEndXP(wasTest);
  pendingSave = true;
  if(wasTest){
    STATE.testHistory.push({date:new Date().toISOString().slice(0,10), score:sessionScore.correct, total:sessionScore.total,
      byCategory: summarizeByCat(testResults)});
    persistNow();   // sınav sonucu ve ödülleri hemen kalıcı olsun
    renderTestResult(pct);
    testMode=false; testResults=[];
    return;
  }
  root().innerHTML = `<div class="card testresult">
    <div class="mascotwrap">${mascotSVG(pct>=70?"happy":pct>=40?"neutral":"sad",84)}</div>
    <div class="pill">Tur Tamamlandı</div>
    <div class="scoreringwrap">${scoreRingSVG(pct)}</div>
    <p class="fraction">${sessionScore.correct}/${sessionScore.total} doğru</p>
    ${rewardBoxHTML()}
    <div class="row" style="margin-top:14px;gap:10px">
      <button class="btn secondary" id="homeBtn" style="flex:1">Ana Ekrana Dön</button>
      <button class="btn" id="againBtn" style="flex:1">Yeni Tur Başlat</button>
    </div>
  </div>`;
  persistNow();   // tur ödülleri ekranda görünür görünmez diske yazılsın
  document.getElementById('againBtn').addEventListener('click', startPractice);
  document.getElementById('homeBtn').addEventListener('click', goHome);
}

function summarizeByCat(results){
  const cats = {voc:{c:0,t:0}, ver:{c:0,t:0}, gram:{c:0,t:0}, lis:{c:0,t:0}, cum:{c:0,t:0}};
  results.forEach(r=>{ cats[r.cat].t++; if(r.correct) cats[r.cat].c++; });
  return cats;
}
function renderTestResult(pct){
  const last = STATE.testHistory[STATE.testHistory.length-1];
  const catLabel = {voc:"Kelime",ver:"Fiil",gram:"Gramer",lis:"Dinleme",cum:"Cümle"};
  let rows="";
  Object.keys(last.byCategory).forEach(k=>{
    const c=last.byCategory[k];
    const p = c.t? Math.round(100*c.c/c.t):0;
    rows += `<div class="themerow"><span class="themename">${catLabel[k]}</span><span class="themepct">${c.c}/${c.t} (%${p})</span></div>`;
  });
  root().innerHTML = `<div class="card testresult">
    <div class="mascotwrap">${mascotSVG(pct>=70?"happy":pct>=40?"neutral":"sad",84)}</div>
    <div class="pill">Deneme Sınavı Sonucu</div>
    <div class="scoreringwrap">${scoreRingSVG(pct)}</div>
    <p class="fraction">${last.score}/${last.total} doğru</p>
    <p style="color:var(--ink-dim)">${pct>=80?"Harika, A1'e hazırsın! 🎉":pct>=60?"İyi gidiyorsun, biraz daha tekrar et.":"Pratik'e dönüp zayıf konuları tekrarla."}</p>
    ${rewardBoxHTML()}
  </div>
  <div class="card"><h2 style="margin-top:0">Bölüm Bazlı Sonuç</h2>${rows}</div>
  <button class="btn" id="backBtn" style="width:100%">Pratiğe Dön</button>`;
  document.getElementById('backBtn').addEventListener('click', goHome);
}

function startPractice(){
  sessionQueue = buildSessionQueue(10, ratiosForFilter(practiceFilter));
  sessionIdx = 0; sessionScore = {correct:0,total:0}; testMode=false;
  resetSessionRewards();
  nextExercise();
}
function renderPracticeHome(){
  const totalItems = VOCAB.length+VERBS.length+FIXED_SENTENCES.length;
  const mastered = Object.values(STATE.mastery).filter(e=>e.box>=MAX_BOX).length;
  const seen = Object.values(STATE.mastery).filter(e=>e.seen>0).length;
  const filterLabel = {mixed:"kelime, fiil çekimi, gramer, dinleme ve cümle kurma karışık", voc:"sadece isim/kelime bilgisi",
    ver:"sadece fiil çekimi", gram:"sadece cümle kurulumu/gramer", lis:"sadece dinleme (kulakla anlama)",
    cum:"sadece cümle kurma (sabit ders cümleleri + sınırsız yeni kombinasyon)"}[practiceFilter];
  /* Akşam olmuş, seri var ve bugünkü hedef henüz tamamlanmamışsa uyar.
     Koşulun tamamı streakAtRisk() içinde — burada yalnızca çiziyoruz. */
  const riskCard = streakAtRisk() ? `<div class="card riskcard">
    <div class="pill">&#9888;&#65039; Seri risk altında</div>
    <div class="qtext">${STATE.streak.current} günlük serin bugün bitiyor</div>
    <p>Bugün ${xpRemainingToday()} XP daha kazanırsan serin devam eder — bir tur yeter.</p>
  </div>` : "";
  root().innerHTML = riskCard + `<div class="card">
    <div class="pill">A1 Pratik</div>
    <p style="color:var(--ink-dim);font-size:.9rem;line-height:1.5">Ne çalışmak istersin?</p>
    <div class="filterrow" id="filterRow">
      ${FILTER_OPTS.map(f=>`<button type="button" class="filterchip${f.key===practiceFilter?' active':''}" data-key="${f.key}">${f.label}</button>`).join("")}
    </div>
    <p style="color:var(--ink-dim);font-size:.82rem;line-height:1.5">Bu turda ${filterLabel} soruluyor. Bildiklerin gittikçe azalır, bilmediklerin daha sık sorulur.</p>
    <div class="progresslabel" style="text-align:left;margin:14px 0">Karşılaşılan: ${seen}/${totalItems} · Ustalaşılan: ${mastered}/${totalItems}<br>Bugün: ${xpToday()}/${dailyGoal()} XP${goalReachedToday()? " &#10003; günlük hedef tamam" : ""}</div>
    <button class="btn" id="startBtn" style="width:100%">Pratiğe Başla (10 Soru)</button>
  </div>`;
  document.querySelectorAll('#filterRow .filterchip').forEach(btn=>{
    btn.addEventListener('click', ()=>{ practiceFilter = btn.getAttribute('data-key'); renderPracticeHome(); });
  });
  document.getElementById('startBtn').addEventListener('click', startPractice);
}

function startTest(){
  testMode = true; testResults=[];
  sessionQueue = buildSessionQueue(24, {vocRatio:0.3, verRatio:0.2, lisRatio:0.15, cumRatio:0.15});
  sessionIdx = 0; sessionScore = {correct:0,total:0};
  resetSessionRewards();
  nextExercise();
}
function renderTestHome(){
  const hist = STATE.testHistory||[];
  let histRows = hist.slice(-5).reverse().map(h=>{
    const p = h.total? Math.round(100*h.score/h.total):0;
    return `<div class="themerow"><span class="themename">${h.date}</span><span class="themepct">${h.score}/${h.total} (%${p})</span></div>`;
  }).join("");
  root().innerHTML = `<div class="card">
    <div class="pill">Deneme Sınavı</div>
    <p style="color:var(--ink-dim);font-size:.9rem;line-height:1.5">24 soruluk, gerçek A1 sınavı formatına yakın karışık test: kelime bilgisi, fiil çekimi, gramer (edat/soru kelimesi/olumsuzlama/sıfat uyumu/sayılar), dinleme ve cümle kurma.</p>
    <button class="btn" id="startTestBtn" style="width:100%;margin-top:6px">Sınavı Başlat</button>
  </div>
  ${hist.length? `<div class="card"><h2 style="margin-top:0">Geçmiş Sonuçlar</h2>${histRows}</div>`:""}`;
  document.getElementById('startTestBtn').addEventListener('click', startTest);
}

function renderDashboard(){
  const vocIds = VOCAB.map(v=>v[4]), verIds = VERBS.map(v=>v[5]), sentIds = FIXED_SENTENCES.map(s=>s[2]);
  function stats(ids){
    // scoreSum: her öğenin box'ı + mevcut box içindeki kısmi streak ilerlemesi
    // (böylece tek bir doğru cevap bile çubuğu hemen biraz hareket ettirir,
    // yüzdenin "3 kez doğru yapana kadar sıfırda donması" hissi olmaz)
    let mastered=0, total=ids.length, scoreSum=0, seen=0;
    ids.forEach(id=>{
      const e=STATE.mastery[id];
      const box=e?e.box:0, streak=e?e.streak:0;
      if(e && e.seen>0) seen++;
      scoreSum += box + Math.min(streak,LEVEL_UP_STREAK)/LEVEL_UP_STREAK;
      if(box>=MAX_BOX) mastered++;
    });
    return {mastered,total,seen,pct: total? Math.round(100*scoreSum/(total*MAX_BOX)):0};
  }
  const vs = stats(vocIds), fs = stats(verIds), cs = stats(sentIds);
  const st = STATE.streak || {current:0, longest:0, freezes:0};
  const overallPct = Math.round((vs.pct*0.5+fs.pct*0.3+cs.pct*0.2));
  let themeRows = "";
  Object.keys(THEME_NAMES).forEach(t=>{
    const ids = VOCAB.filter(v=>v[0]===t).map(v=>v[4]);
    const s = stats(ids);
    themeRows += `<div class="themerow"><span class="themename">${categoryIconSVG(t,18)}${THEME_NAMES[t]}</span><span class="themepct">${s.pct}%</span></div>`;
  });
  root().innerHTML = `
  <div class="statgrid">
    <div class="stat"><div class="n">%${overallPct}</div><div class="l">A1 HAZIRLIK</div></div>
    <div class="stat"><div class="n">${vs.seen}/${vs.total}</div><div class="l">KARŞILAŞILAN KELİME</div></div>
    <div class="stat"><div class="n">${fs.seen}/${fs.total}</div><div class="l">KARŞILAŞILAN FİİL</div></div>
  </div>
  <div class="card">
    <h2 style="margin-top:0">Seri ve Günlük Hedef</h2>
    <div class="row"><span>Güncel seri</span><span>&#128293; ${st.current} gün</span></div>
    <div class="row" style="margin-top:8px"><span>En uzun seri</span><span>${st.longest} gün</span></div>
    <div class="row" style="margin-top:8px"><span>Seri dondurma</span><span>&#10052;&#65039; ${st.freezes}/${MAX_FREEZES}</span></div>
    <div class="row" style="margin-top:8px"><span>Bugünkü XP</span><span>${xpToday()}/${dailyGoal()}</span></div>
    <div class="row" style="margin-top:8px"><span>Toplam XP</span><span>${STATE.xp.total}</span></div>
    <p style="color:var(--ink-dim);font-size:.82rem;margin:16px 0 0">Günlük hedefin — her gün bu kadar XP kazanırsan serin sürer:</p>
    <div class="filterrow" id="goalRow">
      ${DAILY_GOALS.map(g=>`<button type="button" class="filterchip${g.xp===dailyGoal()?' active':''}" data-goal="${g.xp}">${g.label} · ${g.xp} XP</button>`).join("")}
    </div>
    <p style="color:var(--ink-dim);font-size:.78rem;margin:0;line-height:1.5">Bir tur (10 soru) yaklaşık 30-40 XP kazandırır. Bir günü kaçırdığında seri dondurma sessizce devreye girip serini korur; her ${FREEZE_EVERY} günlük seride bir tane kazanırsın.</p>
  </div>
  <div class="card">
    <h2 style="margin-top:0">Genel İlerleme (ustalık)</h2>
    <div class="row"><span>Kelime bilgisi</span><span>%${vs.pct} · ustalaşılan ${vs.mastered}/${vs.total}</span></div>
    <div class="barwrap"><div class="bar" style="width:${vs.pct}%"></div></div>
    <div class="row" style="margin-top:12px"><span>Fiil çekimi</span><span>%${fs.pct} · ustalaşılan ${fs.mastered}/${fs.total}</span></div>
    <div class="barwrap"><div class="bar" style="width:${fs.pct}%"></div></div>
    <div class="row" style="margin-top:12px"><span>Cümle kurma (sabit havuz)</span><span>%${cs.pct} · ustalaşılan ${cs.mastered}/${cs.total}</span></div>
    <div class="barwrap"><div class="bar" style="width:${cs.pct}%"></div></div>
    <p style="color:var(--ink-dim);font-size:.78rem;margin:12px 0 0">"Ustalık" bir kelime/fiili/cümleyi üst üste 3 kez doğru bilince artar — bu yüzden yavaş ama kalıcı ilerler. "Karşılaşılan" ise en az bir kez soruldu demek. Dinamik (sınırsız) cümleler her seferinde yeni olduğu için ustalık takibine dahil değil, sadece pratik amaçlı.</p>
  </div>
  <div class="card"><h2 style="margin-top:0">Konu Bazlı Kelime Ustalığı</h2>${themeRows}</div>
  <div class="card"><h2 style="margin-top:0">Genel</h2>
    <div class="row"><span>Tamamlanan tur/sınav</span><span>${STATE.sessionsCompleted||0}</span></div>
    <div class="row" style="margin-top:8px"><span>Deneme sınavı sayısı</span><span>${(STATE.testHistory||[]).length}</span></div>
  </div>
  ${currentUser==='admin' ? `<div class="card" id="adminToolsCard">
    <h2 style="margin-top:0">Yönetici Araçları</h2>
    <p style="color:var(--ink-dim);font-size:.82rem;margin:0 0 10px">Uygulama güncellenmeden önce tüm ailenin ilerlemesini buradan yedekle; bir güncellemeden sonra gerekirse aynı yerden geri yükle.</p>
    <button class="btn" id="backupBtn" style="width:100%">Yedeği Kopyala</button>
    <textarea id="backupArea" readonly style="display:none;width:100%;min-height:100px;margin-top:10px;font-family:monospace;font-size:.7rem;padding:8px;border-radius:8px;border:1px solid var(--border);box-sizing:border-box"></textarea>
    <button class="btn" id="showRestoreBtn" style="width:100%;margin-top:8px;background:var(--chip);color:var(--ink)">Yedekten Geri Yükle</button>
    <div id="restoreBox" style="display:none;margin-top:10px">
      <textarea id="restoreArea" placeholder="Yedek JSON'ı buraya yapıştır" style="width:100%;min-height:100px;font-family:monospace;font-size:.7rem;padding:8px;border-radius:8px;border:1px solid var(--border);box-sizing:border-box"></textarea>
      <button class="btn" id="confirmRestoreBtn" style="width:100%;margin-top:8px">Onayla ve Geri Yükle</button>
    </div>
    <div class="autherr" id="backupErr" style="display:none;margin-top:8px"></div>
    <div id="backupOk" style="display:none;margin-top:8px;color:var(--good);font-size:.85rem"></div>
  </div>` : ""}`;
  document.querySelectorAll('#goalRow .filterchip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      STATE.dailyGoal = +btn.getAttribute('data-goal');
      /* Hedef düşürülünce bugünkü XP onu zaten aşmış olabilir; bu durumda
         gün "tamamlanmış" sayılır ve seri hemen ilerlemeli. */
      if(goalReachedToday() && STATE.streak.lastActiveDate !== todayKey()) touchStreak();
      pendingSave = true;
      persist();
      updateGameBar();
      renderDashboard();
    });
  });

  if(currentUser==='admin'){
    const backupBtn = document.getElementById('backupBtn');
    const area = document.getElementById('backupArea');
    const showRestoreBtn = document.getElementById('showRestoreBtn');
    const restoreBox = document.getElementById('restoreBox');
    const restoreArea = document.getElementById('restoreArea');
    const confirmRestoreBtn = document.getElementById('confirmRestoreBtn');
    const errEl = document.getElementById('backupErr');
    const okEl = document.getElementById('backupOk');
    backupBtn.addEventListener('click', ()=>{
      if(currentUser && ACCOUNTS.accounts[currentUser]) ACCOUNTS.accounts[currentUser].data = STATE;
      const json = JSON.stringify(ACCOUNTS);
      area.value = json;
      area.style.display = 'block';
      area.focus(); area.select();
      try{ navigator.clipboard.writeText(json); }catch(e){}
      okEl.textContent = "Yedek metni panoya kopyalandı (kopyalanmadıysa aşağıdaki kutudan elle seçip kopyalayabilirsin).";
      okEl.style.display = 'block';
      errEl.style.display = 'none';
    });
    showRestoreBtn.addEventListener('click', ()=>{
      restoreBox.style.display = restoreBox.style.display==='none' ? 'block' : 'none';
      okEl.style.display = 'none';
    });
    confirmRestoreBtn.addEventListener('click', ()=>{
      let parsed;
      try{ parsed = JSON.parse(restoreArea.value); }
      catch(e){ errEl.textContent = "Geçersiz JSON — metni tam ve eksiksiz yapıştırdığından emin ol."; errEl.style.display='block'; okEl.style.display='none'; return; }
      if(!parsed || parsed.version!==2 || !parsed.accounts || typeof parsed.accounts!=="object"){
        errEl.textContent = "Bu geçerli bir yedek dosyası gibi görünmüyor.";
        errEl.style.display='block'; okEl.style.display='none';
        return;
      }
      ACCOUNTS = parsed;
      if(currentUser && ACCOUNTS.accounts[currentUser]){
        STATE = ACCOUNTS.accounts[currentUser].data;
      } else {
        STATE = {mastery:{}, testHistory:[], sessionsCompleted:0};
        ACCOUNTS.accounts[currentUser] = { displayName:"Admin", salt:null, hash:null, data:STATE };
      }
      errEl.style.display='none';
      okEl.textContent = "Geri yükleme başarılı — kaydediliyor…";
      okEl.style.display='block';
      restoreBox.style.display='none';
      pendingSave = true;
      persist();
    });
  }
}

function switchTab(tab){
  /* Güvenlik ağı: kaydedilmemiş ilerleme varsa (bir soru cevaplanmış ama
     henüz kaydedilmemişse), sekmeler arası geçişte kaydet. Bu an güvenlidir
     çünkü zaten yeni bir ana ekrana gidiliyor — reload burada göze batmaz. */
  if(pendingSave){
    persist();
  }
  activeTab = tab;
  updateGameBar();
  document.querySelectorAll('.tab').forEach(t=> t.classList.toggle('active', t.getAttribute('data-tab')===tab));
  if(tab==="practice") renderPracticeHome();
  else if(tab==="test") renderTestHome();
  else renderDashboard();
}

/* ============================= SEVİYE SEÇİMİ (A1/A2/B1) =============================
   Şu an yalnızca A1 içeriği hazır. A2 ve B1 chip'leri ileride gerçek içerik
   eklendiğinde aynı Pratik/Deneme Sınavı/İlerleme motoruyla çalışacak; şimdilik
   tıklanınca "yakında" ekranı gösteriyoruz, A1 verisine/dosyasına dokunmuyoruz. */
let currentLevel = "A1";
function selectLevel(lvl){
  currentLevel = lvl;
  document.querySelectorAll('.levelchip').forEach(c=> c.classList.toggle('active', c.getAttribute('data-level')===lvl));
  const tabsRow = document.getElementById('tabsRow');
  if(lvl==="A1"){
    tabsRow.style.display = '';
    switchTab(activeTab);
  } else {
    tabsRow.style.display = 'none';
    root().innerHTML = `<div class="card" style="text-align:center;padding:40px 18px">
      <div class="pill">Yakında</div>
      <div class="qtext" style="margin-top:10px">${lvl} seviyesi hazırlanıyor</div>
      <p style="color:var(--ink-dim);margin-top:10px;line-height:1.5">Şu an yalnızca A1 seviyesi tam kapsamlı ve kullanıma açık.
      A1'i bitirdikçe ${lvl} kelime, fiil çekimi, gramer, dinleme, cümle kurma ve deneme sınavı içerikleri de buraya eklenecek —
      aynı tekrar ve ilerleme sistemiyle çalışacak.</p>
      <button class="btn secondary" style="margin-top:18px" onclick="selectLevel('A1')">A1'e Dön</button>
    </div>`;
  }
}

/* ============================= TEMA (RENK PALETİ) =============================
   Kişisel/cihaza özel bir tercih — ortak STATE'e değil, bu tarayıcının kendi
   localStorage'ına kaydediliyor (bkz. artifact kuralları: "per-viewer
   conveniences" için localStorage önerilir). Bu yüzden persist()/publish()
   akışına hiç girmiyor, anında değişiyor, kimseyi etkilemiyor. */
const PALETTES = ["blue","green","purple"];
function applyPalette(p){
  if(PALETTES.indexOf(p)===-1) p = "blue";
  document.documentElement.setAttribute('data-palette', p);
  document.querySelectorAll('.paletteswatch').forEach(b=> b.classList.toggle('active', b.getAttribute('data-palette')===p));
  try{ localStorage.setItem('romence_palette', p); }catch(e){ /* bazı ortamlarda erişilemeyebilir, sorun değil */ }
}
function initPalette(){
  let saved = "blue";
  try{
    const v = localStorage.getItem('romence_palette');
    if(v && PALETTES.indexOf(v)!==-1) saved = v;
  }catch(e){ /* localStorage yoksa varsayılana düş */ }
  applyPalette(saved);
}

/* ============================= INIT ============================= */
initPalette();
document.querySelectorAll('.paletteswatch').forEach(b=> b.addEventListener('click', ()=> applyPalette(b.getAttribute('data-palette'))));
document.querySelectorAll('.tab').forEach(t=> t.addEventListener('click', ()=> switchTab(t.getAttribute('data-tab'))));
document.querySelectorAll('.levelchip').forEach(c=> c.addEventListener('click', ()=> selectLevel(c.getAttribute('data-level'))));
document.getElementById('logoutBtn').addEventListener('click', logoutUser);

/* Bu cihazda daha önce giriş yapılmışsa (localStorage'da hatırlanan kullanıcı
   adı ve o kullanıcı hâlâ kayıtlıysa) şifre sormadan direkt içeri alıyoruz —
   güvenilir cihaz kolaylığı. Aksi halde giriş/hesap oluşturma ekranını
   gösteriyoruz. Aynı cihazı birden fazla aile üyesi paylaşıyorsa "Çıkış Yap"
   ile hesap değiştirilebilir. */
(async function tryAutoLogin(){
  await loadAccounts();
  let remembered = null;
  try{ remembered = localStorage.getItem('romence_user'); }catch(e){}
  if(remembered && ACCOUNTS.accounts[remembered]){
    enterAsUser(remembered);
  } else {
    authMode = "login";
    renderAuth();
  }
})();
