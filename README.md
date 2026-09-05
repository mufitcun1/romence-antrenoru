# 🇷🇴 Romence Antrenörü

Türkçe konuşanlar için Romence öğrenme uygulaması. Kelime, fiil çekimi, gramer,
dinleme ve cümle kurma alıştırmaları + deneme sınavı. Leitner (aralıklı tekrar)
sistemiyle bildiklerini seyrekleştirir, bilmediklerini sıklaştırır.

**Canlı:** https://mufitcun1.github.io/romence-antrenoru/

## Durum

| Seviye | Durum |
|---|---|
| **A1** | Tam kapsamlı — 273 kelime, 59 fiil, 59 cümle, 6 gramer konusu, 332 ses dosyası |
| **A2** | Tam kapsamlı — 516 kelime, 100 fiil, 73 cümle, 97 kalıp ifade, 22 gramer konusu (ses dosyası henüz yok) |
| **B1** | Yakında |

## Çalıştırma

Derleme adımı yok. Depoyu klonlayıp bir statik sunucuyla aç:

```bash
python3 -m http.server 8000
# tarayıcıda: http://localhost:8000
```

> `file://` ile açma — service worker ve `fetch('assets/audio/manifest.json')` çalışmaz.

## Test

```bash
npm install          # yalnızca ilk seferde
npx playwright install chromium
npm test
```

`tests/smoke.mjs` kendi statik sunucusunu ayağa kaldırır; hesap oluşturmadan
A1/A2 turlarına, deneme sınavına ve ilerleme ekranına kadar uçtan uca gezer,
konsol hatası olup olmadığını kontrol eder. Çıkış kodu 0 = hepsi geçti.

**Her yayından önce çalıştır.**

## Yapı

```
index.html          script etiketleri bağımlılık sırasında (modül sistemi yok)
css/styles.css
js/data.js          A1 içeriği (VOCAB, VERBS, FIXED_SENTENCES, gramer maddeleri)
js/data-a2.js       A2 içeriği (VOCAB_A2, VERBS_A2, SENTENCES_A2, EXPRESII_A2, …)
js/sentence-gen.js  A1 dinamik cümle üreticisi
js/helpers.js       norm/shuffle/pick + A1 id ataması
js/state.js         Leitner sabitleri
js/storage.js       depolama soyutlama katmanı (şu an localStorage)
js/accounts.js      hesaplar, ilerleme kaydı, örnekleme ağırlıkları
js/audio.js         önceden üretilmiş mp3'ler + tarayıcı TTS yedeği
js/icons.js         kategori ikonları + maskot
js/exercises.js     A1 alıştırma üreticileri
js/ui.js            ekranlar, seviye kaydı (LEVELS), oturum motoru
sw.js               service worker (kod: önce ağ · ses: önce önbellek)
tests/smoke.mjs     uçtan uca duman testi
```

## Dikkat edilmesi gerekenler

- **İlerleme anahtarları seviyeye göre ayrıdır** (`voc_12` ↔ `voc_a2_12`). Yeni
  seviye eklerken id ön ekini değiştirmeyi unutma, yoksa mevcut kullanıcıların
  Leitner kutuları karışır.
- **Romence diakritikleri virgüllüdür:** `ș` (U+0219) ve `ț` (U+021B) — Türkçe
  `ş`/`ţ` (U+015F/U+0163) değil. Cevap karşılaştırması diakritik-duyarsızdır
  (`norm()`), ama gösterilen metin her zaman doğru diakritikli olmalı.
- **`sw.js` içindeki `SHELL_CACHE` sürümünü** yeni bir dosya eklediğinde artır;
  yoksa eski istemciler eksik dosyayla önbellekten açılır.
- Depo herkese açık — **hiçbir sır bu depoya girmez.**
