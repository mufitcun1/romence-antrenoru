-- UYGULAMA İÇİ HESAP SİLME (Play Store şartı)
--
-- Bu dosyayı Supabase panelinde SQL Editor'e yapıştırıp çalıştır.
-- Uygulanmadan önce "Hesabımı sil" düğmesi bulut kaydını silemez ve
-- kullanıcıya "silinemedi" der; uygulandıktan sonra kendiliğinden çalışır.
--
-- Neden gerekli: istemci kendi auth kaydını silemez (admin yetkisi ister) ve
-- public.progress üzerinde DELETE policy'si yoktu. Bu fonksiyon ikisini
-- birlikte, YALNIZCA çağıranın kendi hesabı için yapıyor.
--
-- Güvenlik notları:
--  * Parametre almıyor — silinecek hesap her zaman auth.uid(); başkasının
--    hesabını silmek mümkün değil.
--  * search_path boşa sabitleniyor: SECURITY DEFINER fonksiyonlarda arama
--    yolu ele geçirilerek yetki yükseltilebiliyor, bu yüzden tüm adlar tam
--    nitelikli yazıldı.
--  * anon ve public'ten yetki geri alınıyor; yalnızca authenticated çağırabilir.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'oturum yok' using errcode = '28000';
  end if;
  delete from public.progress where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- RLS takımı tam olsun: kullanıcı kendi ilerleme satırını fonksiyon dışında da
-- silebilsin (ileride sürpriz çıkarmaması için).
drop policy if exists progress_delete_own on public.progress;
create policy progress_delete_own on public.progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);
