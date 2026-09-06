/* ============================= GÖRSELLER (SVG İKONLAR + MASKOT) =============================
   Artifact'ın taşıma limitine takılmadan, sayfayı ağırlaştırmadan görsellik
   katmak için: her kategori için küçük, tutarlı çizgi-ikonlar + basit bir
   maskot karakteri. Hepsi satır içi SVG (inline) olarak üretiliyor — ayrı
   dosya indirmeye gerek yok, currentColor sayesinde açık/koyu tema ve 3 renk
   paletiyle otomatik uyumlu. */

const CATEGORY_ICON_PATHS = {
  gun:     '<circle cx="12" cy="12" r="8.2"/><path d="M12 8v4.3l3 1.9" stroke-linecap="round"/>',
  hava:    '<path d="M8.5 17h8a3.3 3.3 0 0 0 .6-6.55 5 5 0 0 0-9.5-1.9A3.8 3.8 0 0 0 8.5 17Z"/><path d="M9 20.2h.01M12.5 20.2h.01M16 20.2h.01" stroke-linecap="round"/>',
  aile:    '<circle cx="8.3" cy="7.5" r="2.3"/><circle cx="15.7" cy="7.5" r="2.3"/><path d="M4 19.5c0-3 2-5 4.3-5s4.3 2 4.3 5M11.4 19.5c0-3 2-5 4.3-5s4.3 2 4.3 5" stroke-linecap="round"/>',
  kimlik:  '<rect x="3.3" y="5.5" width="17.4" height="13" rx="2"/><circle cx="8.3" cy="11" r="1.9"/><path d="M5.8 16.3c.5-1.6 1.7-2.4 2.5-2.4s2 .8 2.5 2.4" stroke-linecap="round"/><path d="M14 9.5h5M14 12.5h5M14 15.5h3" stroke-linecap="round"/>',
  ozellik: '<circle cx="12" cy="12" r="8.2"/><circle cx="9" cy="10.2" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10.2" r="1" fill="currentColor" stroke="none"/><path d="M8.5 14.3c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" stroke-linecap="round"/>',
  egitim:  '<path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" stroke-linejoin="round"/><path d="M6 11.6v4.3c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4.3" /><path d="M21.5 9.5v5" stroke-linecap="round"/>',
  meslek:  '<rect x="3" y="8.3" width="18" height="11" rx="2"/><path d="M8.3 8.3V6.6c0-.9.7-1.6 1.6-1.6h4.2c.9 0 1.6.7 1.6 1.6v1.7" /><path d="M3 13.5h18" /><path d="M10.5 13.5h3v1.8h-3z" fill="currentColor" stroke="none"/>',
  vucut:   '<path d="M12 20.2s-7.8-4.8-7.8-10.3A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.8 2.8c0 5.5-7.8 10.3-7.8 10.3Z" stroke-linejoin="round"/><path d="M6.5 12h2.3l1.3-2.3 1.6 4.6 1.2-2.3h3.6" stroke-linecap="round" stroke-linejoin="round"/>',
  giyim:   '<path d="M8.5 4.3 12 6l3.5-1.7 3.8 3.3-2.6 2.7-1.7-1.4V19.7h-6V8.9L7.3 10.3 4.7 7.6l3.8-3.3Z" stroke-linejoin="round"/>',
  renk:    '<path d="M12 3.5a8.4 8.4 0 1 0 0 16.8c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2a4 4 0 0 0 4-4c0-4.4-4-6.9-8.4-6.9Z" stroke-linejoin="round"/><circle cx="7.7" cy="10.5" r="1.15" fill="currentColor" stroke="none"/><circle cx="10.6" cy="7.3" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="7.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="17" cy="11.3" r="1.15" fill="currentColor" stroke="none"/>',
  konut:   '<path d="M4 11.3 12 4l8 7.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9.5h12V10" stroke-linejoin="round"/><path d="M10 19.5v-5h4v5" stroke-linejoin="round"/>',
  yiyecek: '<path d="M7 3.5v6.4a2 2 0 0 0 1.4 1.9V20.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 3.5v6.4M10 3.5v6.4M8.5 3.5v6.7" stroke-linecap="round"/><path d="M16.5 3.5c-1.8 0-2.8 2-2.8 4.4 0 1.9 1 3.2 2 3.6v9" stroke-linecap="round" stroke-linejoin="round"/>',
  gunluk:  '<rect x="4" y="4.3" width="16" height="16" rx="2.5"/><path d="M8.3 9.5h7.4M8.3 12.7h7.4M8.3 15.9h4.6" stroke-linecap="round"/>',
  spor:    '<circle cx="12" cy="12" r="8.2"/><path d="M12 3.8v16.4M4.4 9.3h15.2M4.4 14.7h15.2" stroke-linecap="round"/>',
  tatil:   '<path d="M4 20.5 9.5 8.8a2.3 2.3 0 0 1 4.2 0L19.3 20.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 20.5h19" stroke-linecap="round"/><path d="M9 15.3h6" stroke-linecap="round"/>',
  ulasim:  '<path d="M4.3 15.3 5.6 9.9a2 2 0 0 1 2-1.5h8.8a2 2 0 0 1 2 1.5l1.3 5.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="3.2" y="15.3" width="17.6" height="4.3" rx="1.4"/><circle cx="7.3" cy="19.6" r="1.4" fill="currentColor" stroke="none"/><circle cx="16.7" cy="19.6" r="1.4" fill="currentColor" stroke="none"/>',
  doga:    '<path d="M12 3.5c3 2 5 5 5 8.2A5 5 0 0 1 7 11.7c0-3.2 2-6.2 5-8.2Z" stroke-linejoin="round"/><path d="M12 13v8" stroke-linecap="round"/>',
  sehir:   '<path d="M4 20.5V9.3l4.5-2.6v13.8" stroke-linejoin="round"/><path d="M13 20.5V4.5l6 3v13" stroke-linejoin="round"/><path d="M6 12.3h1M6 15.5h1M15 8h1.4M15 11.2h1.4M15 14.4h1.4" stroke-linecap="round"/><path d="M2.5 20.5h19" stroke-linecap="round"/>',
  medya:   '<rect x="3" y="5.5" width="18" height="13.5" rx="1.6"/><path d="M6.3 8.7h5.4v4.3H6.3zM6.3 15h5.4M14 8.7h3.7M14 11.3h3.7M14 13.9h3.7M14 16.4h3.7" stroke-linecap="round"/>',
  zamir:   '<circle cx="9" cy="8.3" r="2.6"/><path d="M4.5 18c0-2.6 2-4.6 4.5-4.6" stroke-linecap="round"/><path d="M14 6.6a2.6 2.6 0 1 1 3.4 4.4M18.7 18c0-2-1.3-3.7-3.2-4.3" stroke-linecap="round"/>',
  soru:    '<circle cx="12" cy="12" r="8.2"/><path d="M9.7 9.5a2.3 2.3 0 1 1 3.5 2c-.9.6-1.2 1-1.2 2.1" stroke-linecap="round"/><circle cx="12" cy="16.8" r="0.15" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>',
  baglac:  '<rect x="3" y="9" width="8" height="6" rx="3"/><rect x="13" y="9" width="8" height="6" rx="3"/><path d="M9 12h6" stroke-linecap="round"/>',
  zaman:   '<path d="M7 4h10M7 20h10" stroke-linecap="round"/><path d="M7.5 4c0 4 2.2 5.7 4.5 8-2.3 2.3-4.5 4-4.5 8h9c0-4-2.2-5.7-4.5-8 2.3-2.3 4.5-4 4.5-8Z" stroke-linejoin="round"/>',
  yer:     '<path d="M12 21s6.5-6.2 6.5-11.2a6.5 6.5 0 1 0-13 0C5.5 14.8 12 21 12 21Z" stroke-linejoin="round"/><circle cx="12" cy="9.8" r="2.4"/>',
  /* A2 ile gelen temalar */
  boyut:   '<rect x="3.5" y="7" width="17" height="10" rx="1.6"/><path d="M7 7v2.6M10.5 7v4M14 7v2.6M17.5 7v4" stroke-linecap="round"/>',
  duygu:   '<path d="M12 20.3s-7.6-4.6-7.6-10A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.9c0 5.4-7.6 10-7.6 10Z" stroke-linejoin="round"/>',
  ozelgun: '<rect x="3.5" y="10.5" width="17" height="9.5" rx="1.6"/><path d="M3.5 14.3h17M12 10.5V20" stroke-linecap="round"/><path d="M12 10.5c-2.6 0-3.9-.9-3.9-2.3 0-1.1.9-1.9 2-1.9 1.6 0 1.9 1.6 1.9 4.2Zm0 0c2.6 0 3.9-.9 3.9-2.3 0-1.1-.9-1.9-2-1.9-1.6 0-1.9 1.6-1.9 4.2Z" stroke-linejoin="round"/>',
  /* --- B1 tematik alanları --- */
  is:      '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" stroke-linecap="round"/><path d="M3 12.5h18" />',
  guncel:  '<rect x="3" y="5.5" width="14" height="13" rx="1.6"/><path d="M17 9.5h3.2a.8.8 0 0 1 .8.8v6.4a1.8 1.8 0 0 1-3.6 0V9.5Z" stroke-linejoin="round"/><path d="M6 9h8M6 12h8M6 15h5" stroke-linecap="round"/>',
  hizmet:  '<path d="M13.6 5.6a3.4 3.4 0 0 0 4.8 4.8l2.4 2.4-2.6 2.6-2.4-2.4a3.4 3.4 0 0 0-4.8-4.8Z" stroke-linejoin="round"/><path d="M10.6 10.6 4 17.2a1.9 1.9 0 0 0 2.7 2.7l6.6-6.6" stroke-linecap="round"/>',
  seyahat: '<path d="M3 15.5 21 9.8l-1 3-5.5 1.9-2.2 4.3-1.9-.6.8-3.4-4.4 1.2-1.4-1.4Z" stroke-linejoin="round"/>',
  alisveris: '<path d="M4.5 8h15l-1.3 10.4a1.8 1.8 0 0 1-1.8 1.6H7.6a1.8 1.8 0 0 1-1.8-1.6L4.5 8Z" stroke-linejoin="round"/><path d="M9 8V6.4a3 3 0 0 1 6 0V8" stroke-linecap="round"/>',
  saglik:  '<path d="M12 20.3s-7.6-4.6-7.6-10A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.9c0 5.4-7.6 10-7.6 10Z" stroke-linejoin="round"/><path d="M12 10.6v4M10 12.6h4" stroke-linecap="round"/>',
  yeme:    '<path d="M6 4.5v7a2 2 0 0 0 4 0v-7M8 11.5V20" stroke-linecap="round"/><path d="M16.5 4.5c-1.4 0-2.5 2-2.5 4.5s1.1 3.5 2.5 3.5V20" stroke-linecap="round"/>',
  bosvakit: '<circle cx="12" cy="12" r="8.2"/><path d="M10 9.2v5.6l4.6-2.8-4.6-2.8Z" stroke-linejoin="round"/>',
  iliski:  '<circle cx="8" cy="9" r="2.6"/><circle cx="16" cy="9" r="2.6"/><path d="M3.4 19c0-3 2-4.8 4.6-4.8s4.6 1.8 4.6 4.8M11.4 19c0-3 2-4.8 4.6-4.8s4.6 1.8 4.6 4.8" stroke-linecap="round"/>',
  dil:     '<circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4" /><path d="M12 3.8c2.2 2.3 3.4 5.2 3.4 8.2s-1.2 5.9-3.4 8.2c-2.2-2.3-3.4-5.2-3.4-8.2S9.8 6.1 12 3.8Z" stroke-linejoin="round"/>',
  kavram:  '<path d="M9.2 18.5h5.6" stroke-linecap="round"/><path d="M10 21h4" stroke-linecap="round"/><path d="M12 3.2a5.8 5.8 0 0 0-3.4 10.5c.6.5.9 1.1.9 1.8h5a2.4 2.4 0 0 1 .9-1.8A5.8 5.8 0 0 0 12 3.2Z" stroke-linejoin="round"/>',
  algi:    '<path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.6"/>',
  edat:    '<path d="M4 12h11" stroke-linecap="round"/><path d="M11.5 8.2 15.3 12l-3.8 3.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 5.5v13" stroke-linecap="round"/>'
};
function categoryIconSVG(key, size){
  size = size || 20;
  const inner = CATEGORY_ICON_PATHS[key] || CATEGORY_ICON_PATHS.gun;
  return `<svg class="cat-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">${inner}</svg>`;
}

/* Basit, sevimli bir maskot — Romanya bayrağı renklerinden ilham alan bir
   kurt figürü (Romen halk kültüründe "lup" hem sembolik hem sevimli).
   mood: "neutral" | "happy" | "sad" */
function mascotSVG(mood, size){
  mood = mood || "neutral";
  size = size || 96;
  const mouth = mood==="happy"
    ? '<path d="M42 66c4 5 12 5 16 0" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round" fill="none"/>'
    : mood==="sad"
    ? '<path d="M42 70c4 -4 12 -4 16 0" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round" fill="none"/>'
    : '<path d="M42 67h16" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
  const eyes = mood==="happy"
    ? '<path d="M34 54c2-3 6-3 8 0M50 54c2-3 6-3 8 0" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round" fill="none"/>'
    : mood==="sad"
    ? '<circle cx="38" cy="55" r="2.6" fill="#1e293b"/><circle cx="54" cy="55" r="2.6" fill="#1e293b"/><path d="M32 49c2-1.5 4-1.5 6 0M50 49c2-1.5 4-1.5 6 0" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>'
    : '<circle cx="38" cy="55" r="2.8" fill="#1e293b"/><circle cx="54" cy="55" r="2.8" fill="#1e293b"/>';
  const brows = mood==="happy" ? '' : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 96 96" aria-hidden="true">
    <ellipse cx="48" cy="52" rx="30" ry="27" fill="#e8ecf3"/>
    <path d="M22 34 12 14 34 28Z" fill="#e8ecf3"/>
    <path d="M74 34 84 14 62 28Z" fill="#e8ecf3"/>
    <path d="M22 34 16 20 32 30Z" fill="#c7d0e0"/>
    <path d="M74 34 80 20 64 30Z" fill="#c7d0e0"/>
    <ellipse cx="48" cy="58" rx="14" ry="10" fill="#fbfcfe"/>
    ${eyes}
    <ellipse cx="48" cy="62" rx="4" ry="3" fill="#1e293b"/>
    ${mouth}
    <path d="M32 68c-3 3-3 7 0 9M64 68c3 3 3 7 0 9" stroke="#c7d0e0" stroke-width="2" stroke-linecap="round" fill="none"/>
  </svg>`;
}
