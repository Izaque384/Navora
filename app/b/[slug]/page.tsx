import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicBookingForm } from './booking-form';

export default async function PublicBookingPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const supabase=await createClient();
  const {data:shop}=await supabase.from('barbershops').select('id,name,address,phone,timezone,public_booking_enabled').eq('slug',slug).eq('public_booking_enabled',true).maybeSingle();
  if(!shop)notFound();
  const [servicesResult,professionalsResult,linksResult]=await Promise.all([
    supabase.from('services').select('id,name,duration_min,price').eq('barbershop_id',shop.id).eq('active',true).order('name'),
    supabase.from('professionals').select('id,name').eq('barbershop_id',shop.id).eq('active',true).order('name'),
    supabase.from('professional_services').select('professional_id,service_id').eq('barbershop_id',shop.id),
  ]);
  return <main className="public-booking-shell"><header className="public-booking-header"><Link href="/"><Image src="/navora-mark.svg" width={28} height={28} alt="Navora"/><b>NAVORA</b></Link><span>Agendamento online</span></header><section className="public-booking-hero"><div className="eyebrow">AGENDE SEU HORÁRIO</div><h1>{shop.name}</h1><p>{[shop.address,shop.phone].filter(Boolean).join(' · ')||'Escolha o melhor horário para você.'}</p></section><div className="public-booking-card"><PublicBookingForm slug={slug} timezone={shop.timezone} services={(servicesResult.data??[]).map(s=>({...s,price:Number(s.price)}))} professionals={professionalsResult.data??[]} links={linksResult.data??[]}/></div><footer className="public-booking-footer">Agendamento seguro por Navora</footer></main>;
}
