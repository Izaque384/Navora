'use client';

import { FormEvent, useRef, useState, useTransition } from 'react';
import { getAvailableAppointmentSlots } from '@/app/dashboard/actions';

type Option = { id: string; name: string };
type Customer = Option & { phone: string };
type Service = Option & { duration_min: number };
type Slot = { startAt: string; endAt: string; label: string };

type Props = {
  appointment: { id: string; customerId: string; serviceId: string; professionalId: string; startAt: string; notes: string | null };
  customers: Customer[];
  services: Service[];
  professionals: Option[];
  timezone: string;
  updateAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
};

function dateInTimezone(value: string, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

export function AppointmentEditor({ appointment, customers, services, professionals, timezone, updateAction }: Props) {
  const [serviceId, setServiceId] = useState(appointment.serviceId);
  const [professionalId, setProfessionalId] = useState(appointment.professionalId);
  const [date, setDate] = useState(dateInTimezone(appointment.startAt, timezone));
  const [selectedStart, setSelectedStart] = useState(appointment.startAt);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState('Altere uma seleção para consultar os horários.');
  const [feedback, setFeedback] = useState('');
  const [isPending, startTransition] = useTransition();
  const latestRequest = useRef(0);

  function refreshSlots(nextServiceId: string, nextProfessionalId: string, nextDate: string) {
    const requestId = ++latestRequest.current;
    setSelectedStart('');
    setSlots([]);
    setFeedback('');
    if (!nextServiceId || !nextProfessionalId || !nextDate) return;

    setMessage('Consultando horários...');
    startTransition(async () => {
      const result = await getAvailableAppointmentSlots({ appointmentId: appointment.id, serviceId: nextServiceId, professionalId: nextProfessionalId, date: nextDate });
      if (requestId !== latestRequest.current) return;
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setSlots(result.slots);
      setMessage(result.slots.length ? 'Escolha o novo horário.' : 'Não há horários disponíveis nesta data.');
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateAction(formData);
      setFeedback(result.ok ? 'Agendamento atualizado.' : result.error ?? 'Não foi possível atualizar.');
    });
  }

  return (
    <details className="appointment-editor">
      <summary>Editar</summary>
      <form className="admin-form appointment-edit-form" onSubmit={submit}>
        <input type="hidden" name="appointmentId" value={appointment.id} />
        <label>Cliente<select name="customerId" required defaultValue={appointment.customerId}>{customers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.phone}</option>)}</select></label>
        <div className="form-row">
          <label>Serviço<select name="serviceId" required value={serviceId} onChange={(event) => { const value = event.target.value; setServiceId(value); refreshSlots(value, professionalId, date); }}>{services.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.duration_min} min</option>)}</select></label>
          <label>Profissional<select name="professionalId" required value={professionalId} onChange={(event) => { const value = event.target.value; setProfessionalId(value); refreshSlots(serviceId, value, date); }}>{professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>
        <label>Data<input type="date" min={dateInTimezone(new Date().toISOString(), timezone)} value={date} onChange={(event) => { const value = event.target.value; setDate(value); refreshSlots(serviceId, professionalId, value); }} required /></label>
        <fieldset className="slot-fieldset" disabled={isPending || slots.length === 0}>
          <legend>Novo horário</legend>
          <p className="slot-help" aria-live="polite">{message}</p>
          <div className="slot-grid">{slots.map((slot) => <button className={selectedStart === slot.startAt ? 'slot-button selected' : 'slot-button'} key={slot.startAt} type="button" onClick={() => setSelectedStart(slot.startAt)}>{slot.label}</button>)}</div>
        </fieldset>
        <input type="hidden" name="startAt" value={selectedStart} />
        <label>Observações<textarea name="notes" rows={2} defaultValue={appointment.notes ?? ''} /></label>
        {feedback && <p className={feedback === 'Agendamento atualizado.' ? 'form-feedback success' : 'form-feedback error'} aria-live="polite">{feedback}</p>}
        <button className="button full" type="submit" disabled={!selectedStart || isPending}>{isPending ? 'Salvando...' : 'Salvar alterações'}</button>
      </form>
    </details>
  );
}
