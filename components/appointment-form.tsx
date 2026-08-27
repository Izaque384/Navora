'use client';

import { useRef, useState, useTransition } from 'react';
import { getAvailableAppointmentSlots } from '@/app/dashboard/actions';

type Option = { id: string; name: string };
type Customer = Option & { phone: string };
type Service = Option & { duration_min: number };
type Slot = { startAt: string; endAt: string; label: string };

type Props = {
  customers: Customer[];
  services: Service[];
  professionals: Option[];
  timezone: string;
  submitAction: (formData: FormData) => Promise<void>;
};

function todayInTimezone(timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function AppointmentForm({ customers, services, professionals, timezone, submitAction }: Props) {
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [selectedStart, setSelectedStart] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState('Selecione serviço, profissional e data.');
  const [isPending, startTransition] = useTransition();
  const latestRequest = useRef(0);

  function refreshSlots(nextServiceId: string, nextProfessionalId: string, nextDate: string) {
    const requestId = ++latestRequest.current;
    setSelectedStart('');
    setSlots([]);

    if (!nextServiceId || !nextProfessionalId || !nextDate) {
      setMessage('Selecione serviço, profissional e data.');
      return;
    }

    setMessage('Consultando horários...');
    startTransition(async () => {
      const result = await getAvailableAppointmentSlots({
        serviceId: nextServiceId,
        professionalId: nextProfessionalId,
        date: nextDate,
      });
      if (requestId !== latestRequest.current) return;

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      setSlots(result.slots);
      setMessage(result.slots.length ? 'Escolha um horário disponível.' : 'Não há horários disponíveis nesta data.');
    });
  }

  return (
    <form action={submitAction} className="admin-form">
      <label>Cliente<select name="customerId" required defaultValue=""><option value="" disabled>Selecione</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.phone}</option>)}</select></label>
      <label>Serviço<select name="serviceId" required value={serviceId} onChange={(event) => { const value = event.target.value; setServiceId(value); refreshSlots(value, professionalId, date); }}><option value="" disabled>Selecione</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.duration_min} min</option>)}</select></label>
      <label>Profissional<select name="professionalId" required value={professionalId} onChange={(event) => { const value = event.target.value; setProfessionalId(value); refreshSlots(serviceId, value, date); }}><option value="" disabled>Selecione</option>{professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Data<input type="date" value={date} min={todayInTimezone(timezone)} onChange={(event) => { const value = event.target.value; setDate(value); refreshSlots(serviceId, professionalId, value); }} required /></label>

      <fieldset className="slot-fieldset" disabled={isPending || slots.length === 0}>
        <legend>Horário</legend>
        <p className="slot-help" aria-live="polite">{message}</p>
        <div className="slot-grid">
          {slots.map((slot) => (
            <button
              className={selectedStart === slot.startAt ? 'slot-button selected' : 'slot-button'}
              key={slot.startAt}
              type="button"
              onClick={() => setSelectedStart(slot.startAt)}
              aria-pressed={selectedStart === slot.startAt}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </fieldset>

      <input type="hidden" name="startAt" value={selectedStart} />
      <label>Observações<textarea name="notes" rows={3} placeholder="Opcional" /></label>
      <button className="button full" type="submit" disabled={!selectedStart || isPending}>Criar agendamento</button>
    </form>
  );
}
