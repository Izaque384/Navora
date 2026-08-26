'use client';

import { useState } from 'react';

const services = [
  { name: 'Corte clássico', duration: '45 min', price: 45 },
  { name: 'Barba', duration: '30 min', price: 35 },
  { name: 'Corte + barba', duration: '1h15', price: 70 },
];

const professionals = ['Lucas Mendes', 'Rafael Costa'];
const times = ['09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15', '17:00'];

export default function Home() {
  const [view, setView] = useState<'home' | 'booking' | 'dashboard'>('home');
  const [step, setStep] = useState(1);
  const [service, setService] = useState(services[0]);
  const [professional, setProfessional] = useState(professionals[0]);
  const [time, setTime] = useState(times[0]);
  const [confirmed, setConfirmed] = useState(false);

  const startBooking = () => { setView('booking'); setStep(1); setConfirmed(false); };

  return (
    <div className="app">
      <header className="top">
        <button className="brand" onClick={() => setView('home')}><span className="mark">N</span><span>NAVORA</span></button>
        <span className="tag">A agenda que acompanha seu estilo.</span>
        <div className="top-actions"><button className="link" onClick={() => setView('dashboard')}>Painel</button><button className="button secondary" onClick={startBooking}>Agendar</button></div>
      </header>

      {view === 'home' && <main className="main">
        <section className="hero"><div className="eyebrow">SUA BARBEARIA, NO SEU TEMPO</div><h1>O corte certo,<br />na hora certa.</h1><p>Agende sua experiência em poucos passos. Sem ligação, sem espera, do seu jeito.</p></section>
        <section className="card"><div className="shop"><div><h2>Navora Studio</h2><p>Av. Paulista, 1000 · São Paulo</p></div><span className="open">Aberto até 19:00</span></div>
          <div className="services">{services.map((item) => <button className="service" key={item.name} onClick={startBooking}><div><strong>{item.name}</strong><small>{item.duration}</small></div><span className="price">R$ {item.price}</span></button>)}</div>
          <button className="button full" onClick={startBooking}>Agendar agora</button>
        </section>
      </main>}

      {view === 'booking' && <main className="main">
        <button className="link back" onClick={() => step > 1 ? setStep(step - 1) : setView('home')}>← Voltar</button>
        <div className="progress">{[1,2,3,4].map((n) => <i key={n} className={n <= step ? 'on' : ''} />)}</div>
        {confirmed ? <section className="card success"><div className="tick">✓</div><h2>Agendamento confirmado</h2><p>{service.name} com {professional} às {time}.</p><button className="button" onClick={() => setView('home')}>Voltar ao início</button></section> : <section className="card">
          {step === 1 && <><h2>Escolha o serviço</h2><p className="muted">O que você deseja agendar?</p><div className="choices">{services.map((item) => <button key={item.name} className={`choice ${service.name === item.name ? 'selected' : ''}`} onClick={() => setService(item)}><div><strong>{item.name}</strong><small>{item.duration}</small></div><span className="price">R$ {item.price}</span></button>)}</div></>}
          {step === 2 && <><h2>Escolha o profissional</h2><p className="muted">Quem vai cuidar do seu atendimento?</p><div className="choices">{professionals.map((name) => <button key={name} className={`choice ${professional === name ? 'selected' : ''}`} onClick={() => setProfessional(name)}><div className="choice-main"><span className="avatar">{name[0]}</span><strong>{name}</strong></div><span>→</span></button>)}</div></>}
          {step === 3 && <><h2>Escolha o horário</h2><p className="muted">Quarta-feira, 26 de agosto</p><div className="times">{times.map((item) => <button key={item} className={`time ${time === item ? 'selected' : ''}`} onClick={() => setTime(item)}>{item}</button>)}</div></>}
          {step === 4 && <><h2>Confirme seu agendamento</h2><div className="summary"><b>{service.name}</b><br />{professional} · hoje às {time}<br />R$ {service.price}</div><label>Seu nome</label><input placeholder="Digite seu nome" /><label>WhatsApp</label><input placeholder="(00) 00000-0000" /></>}
          <button className="button full" onClick={() => step < 4 ? setStep(step + 1) : setConfirmed(true)}>{step < 4 ? 'Continuar' : 'Confirmar agendamento'}</button>
        </section>}
      </main>}

      {view === 'dashboard' && <main className="dashboard"><aside className="nav"><div className="nav-brand">NAVORA</div><button className="active">Agenda</button><button>Clientes</button><button>Serviços</button><button>Relatórios</button><button>Configurações</button></aside><section className="panel"><div className="dashhead"><div><h1>Bom dia, Marcos.</h1><p>Quarta-feira, 26 de agosto</p></div><button className="button" onClick={startBooking}>+ Agendamento</button></div><div className="stats"><div className="stat"><span>Atendimentos hoje</span><b>8</b><small>2 em andamento</small></div><div className="stat"><span>Faturamento previsto</span><b>R$ 510</b><small>↑ 14% vs. ontem</small></div><div className="stat"><span>Horários livres</span><b>6</b><small>até 19:00</small></div></div><div className="section-card"><h2>Agenda de hoje</h2><p className="caption">Próximos atendimentos</p><div className="schedule">{[['09:00','João da Silva','Corte clássico','Lucas Mendes'],['09:45','Pedro Santos','Barba','Rafael Costa'],['10:30','Ana Oliveira','Corte + barba','Lucas Mendes'],['11:15','Carlos Souza','Corte clássico','Rafael Costa']].map(([t,n,s,p]) => <div className="appointment" key={t}><time>{t}</time><div><b>{n}</b><small>{s} · {p}</small></div><span className="status">Confirmado</span></div>)}</div></div></section></main>}
    </div>
  );
}
