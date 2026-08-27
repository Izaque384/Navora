'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { createPublicBooking, getPublicSlots, type BookingState } from './actions';

type Item={id:string;name:string}; type Service=Item&{duration_min:number;price:number};
type Props={slug:string;timezone:string;services:Service[];professionals:Item[];links:{professional_id:string;service_id:string}[]};
const initial:BookingState={ok:false,message:''};

export function PublicBookingForm({slug,timezone,services,professionals,links}:Props){
  const [state,action,pending]=useActionState(createPublicBooking,initial);
  const [serviceId,setServiceId]=useState(''); const [professionalId,setProfessionalId]=useState(''); const [date,setDate]=useState('');
  const [slots,setSlots]=useState<{startAt:string;endAt:string}[]>([]); const [startAt,setStartAt]=useState(''); const [loading,startTransition]=useTransition(); const request=useRef(0);
  const allowed=new Set(links.filter(x=>x.service_id===serviceId).map(x=>x.professional_id));
  const visibleProfessionals=serviceId?professionals.filter(x=>allowed.has(x.id)):professionals;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const time=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:timezone});
  function load(nextService:string,nextProfessional:string,nextDate:string){const id=++request.current;setSlots([]);setStartAt('');if(!nextService||!nextProfessional||!nextDate)return;startTransition(async()=>{const result=await getPublicSlots({slug,serviceId:nextService,professionalId:nextProfessional,date:nextDate});if(id!==request.current)return;setSlots(result.slots);});}
  if(state.ok)return <div className="public-success"><span>✓</span><h2>Horário confirmado</h2><p>{state.message}</p><button onClick={()=>window.location.reload()}>Fazer outro agendamento</button></div>;
  return <form action={action} className="public-booking-form">
    <input type="hidden" name="slug" value={slug}/><input type="hidden" name="startAt" value={startAt}/>
    <div className="public-step"><span>01</span><div><h2>Escolha o serviço</h2><select name="serviceId" required value={serviceId} onChange={e=>{setServiceId(e.target.value);setProfessionalId('');load(e.target.value,'',date)}}><option value="">Selecione</option>{services.map(s=><option key={s.id} value={s.id}>{s.name} · {s.duration_min} min · {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(s.price))}</option>)}</select></div></div>
    <div className="public-step"><span>02</span><div><h2>Escolha o profissional</h2><select name="professionalId" required value={professionalId} onChange={e=>{setProfessionalId(e.target.value);load(serviceId,e.target.value,date)}}><option value="">Selecione</option>{visibleProfessionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
    <div className="public-step"><span>03</span><div><h2>Data e horário</h2><input type="date" min={today} value={date} onChange={e=>{setDate(e.target.value);load(serviceId,professionalId,e.target.value)}} required/><div className="public-slot-grid">{slots.map(s=><button type="button" key={s.startAt} className={startAt===s.startAt?'selected':''} onClick={()=>setStartAt(s.startAt)}>{time.format(new Date(s.startAt))}</button>)}</div>{loading&&<small>Consultando horários...</small>}{!loading&&date&&professionalId&&slots.length===0&&<small>Nenhum horário disponível nesta data.</small>}</div></div>
    <div className="public-step"><span>04</span><div><h2>Seus dados</h2><div className="public-fields"><input name="name" placeholder="Nome completo" minLength={2} required/><input name="phone" placeholder="WhatsApp" minLength={8} required/><input name="email" type="email" placeholder="E-mail (opcional)"/><textarea name="notes" maxLength={500} placeholder="Observação (opcional)"/></div></div></div>
    {state.message&&<p className="public-error">{state.message}</p>}<button className="public-submit" type="submit" disabled={!startAt||pending}>{pending?'Confirmando...':'Confirmar agendamento'}</button>
  </form>;
}
