/* ============================= DEPOLAMA KATMANI =============================
   Bu sürüm artık bağımsız bir web sayfası (Artifact platformunun otomatik
   publish()/reload mekanizması yok). İlerleme şimdilik bu cihazın tarayıcısına
   (localStorage) kaydediliyor — kurulum gerektirmez, anında çalışır. Aileler
   arası / cihazlar arası senkronizasyon için buraya gerçek bir arka uç
   bağlanacak (bkz. proje notları); geri kalan bütün kod (ACCOUNTS/STATE ve
   ona bağlı her şey) hiç değişmeden çalışmaya devam edecek — yalnızca bu iki
   fonksiyonun içi değişecek. */
const STORAGE_KEY = "romence_accounts_v2";

async function loadAccountsFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(parsed && parsed.version===2 && parsed.accounts) return parsed;
    return null;
  }catch(e){ return null; }
}

async function saveAccountsToStorage(accounts){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    return true;
  }catch(e){ return false; }
}
