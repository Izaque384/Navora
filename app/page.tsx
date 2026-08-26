'use client';

import { useState } from 'react';

const services = [
  { name: 'Corte clássico', duration: '45 min', price: 45 },
  { name: 'Barba', duration: '30 min', price: 35 },
  { name: 'Corte + barba', duration: '1h15', price: 70 },
];

const professionals = ['Lucas Mendes', 'Rafael Costa'];
const times = ['09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15', '17:00'];

function RazorMark({ size = 34 }: { size?: number }) {
  return <img className="razor-mark" src="/navora-mark.svg" width={size} height={size} alt="" aria-hidden="true" />;
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: 'M4 10.5 12 4l8 6.5V20h-5v-5h-6v5H4z',
    calendar: 'M5 6h14v14H5z M8 3v5M16 3v5M5 10h14',
    users: 'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 1 0 0-6',
    scissors: 'M6 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 12l12 8M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6l12-8',
    chart: 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4.9 4.9l2.1 2.1M17 7l2.1-2.1M4 12H2M22 12h-2M7 17l-2.1 2.1M19.1 19.1 17 17M12 4V2M12 22v-2',
    plus: 'M12 5v14M5 12h14',
    search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM17 17l4 4',
    bell: 'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 22h4',
    money: 'M12 2v20M17 6.5C16 5.5 14.5 5 12.5 5 10 5 8 6.3 8 8.2c0 5.1 9 2.5 9 7.1 0 2-2 3.7-5 3.7-2 0-3.6-.6-4.8-1.7',
  };
  return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] ?? paths.home} /></svg>;
}

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
        <button className="brand" onClick={() => setView('home')} aria-label="Ir para o início">
          <span className="brand-mark"><RazorMark size={31} /></span><span>NAVORA</span>
        </button>
        <span className="tag">A agenda que acompanha seu estilo.</span>
        <div className="top-actions"><button className="link" onClick={() => setView('dashboard')}>Painel</button><button className="button secondary" onClick={startBooking}>Agendar</button></div>
      </header>

      {view === 'home' && <main className="main">
        <section className="hero"><div className="eyebrow">PRECISÃO PARA A SUA ROTINA</div><h1>O corte certo,<br /><em>na hora certa.</em></h1><p>Agende sua experiência em poucos passos. Sem ligação, sem espera, do seu jeito.</p></section>
        <section className="card booking-card"><div className="shop"><div><div className="shop-kicker">NAVORA STUDIO</div><h2>Seu próximo horário começa aqui.</h2><p>Av. Paulista, 1000 · São Paulo</p></div><span className="open">Aberto até 19:00</span></div>
          <div className="services">{services.map((item) => <button className="service" key={item.name} onClick={startBooking}><div><strong>{item.name}</strong><small>{item.duration}</small></div><span className="price">R$ {item.price}</span></button>)}</div>
          <button className="button full" onClick={startBooking}>Agendar agora <span>→</span></button>
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
          <button className="button full" onClick={() => step < 4 ? setStep(step + 1) : setConfirmed(true)}>{step < 4 ? 'Continuar' : 'Confirmar agendamento'} <span>→</span></button>
        </section>}
      </main>}

      {view === 'dashboard' && <main className="dashboard">
        <aside className="nav">
          <div className="nav-brand"><RazorMark size={30} /><span>NAVORA</span></div>
          <nav><button className="active"><Icon name="home" />Visão geral</button><button><Icon name="calendar" />Agenda</button><button><Icon name="users" />Clientes</button><button><Icon name="scissors" />Serviços</button><button><Icon name="users" />Profissionais</button><button><Icon name="money" />Financeiro</button><button><Icon name="chart" />Relatórios</button><button><Icon name="settings" />Configurações</button></nav>
          <div className="profile"><span className="profile-avatar">B</span><div><b>Barbearia Elite</b><small>Administrador</small></div><span>⌄</span></div>
        </aside>
        <section className="panel">
          <div className="dashhead"><div><div className="eyebrow">QUARTA-FEIRA, 26 DE AGOSTO</div><h1>Boa tarde, Barbeiro. <span>👋</span></h1><p>Confira o que está acontecendo na sua barbearia hoje.</p></div><div className="header-tools"><button className="icon-button"><Icon name="search" /></button><button className="icon-button"><Icon name="bell" /></button><button className="profile-mini">BE</button></div></div>
          <div className="stats">
            <div className="stat"><div className="stat-top"><span>Agendamentos hoje</span><span className="stat-icon"><Icon name="calendar" /></span></div><b>28</b><small>+12% vs ontem</small></div>
            <div className="stat"><div className="stat-top"><span>Faturamento hoje</span><span className="stat-icon"><Icon name="money" /></span></div><b>R$ 1.860</b><small>+18% vs ontem</small></div>
            <div className="stat"><div className="stat-top"><span>Clientes novos (mês)</span><span className="stat-icon"><Icon name="users" /></span></div><b>24</b><small>+8% vs mês passado</small></div>
            <div className="stat"><div className="stat-top"><span>Taxa de ocupação</span><span className="stat-icon"><Icon name="chart" /></span></div><b>78%</b><small>+9% vs ontem</small></div>
          </div>
          <div className="dashboard-grid">
            <div className="section-card agenda-card"><div className="section-head"><div><h2>Agenda de hoje</h2><p className="caption">Próximos atendimentos</p></div><button className="ghost-button">Ver agenda completa →</button></div><div className="schedule">{[['09:00','Carlos Eduardo','Corte + Barba','Jonas','JR'],['10:00','Matheus Silva','Degradê','Jonas','JR'],['11:00','Lucas Pereira','Corte + Barba','Matheus','MT'],['14:00','Rafael Souza','Sobrancelha','Matheus','MT'],['15:00','Gabriel Martins','Corte + Barba','Jonas','JR']].map(([t,n,s,p,a]) => <div className="appointment" key={t}><time>{t}</time><div className="appointment-person"><b>{n}</b><small>{s}</small></div><span className="pro-avatar">{a}</span><span className="pro-name">{p}</span></div>)}</div></div>
            <div className="section-card revenue-card"><div className="section-head"><div><h2>Faturamento</h2><p className="caption">Últimos 7 dias</p></div><button className="ghost-button">7 dias⌄</button></div><div className="chart"><div className="chart-lines"><span>R$ 2.000</span><span>R$ 1.500</span><span>R$ 1.000</span><span>R$ 500</span><span>R$ 0</span></div><div className="bars">{[['Seg','72'],['Ter','38'],['Qua','64'],['Qui','52'],['Sex','61'],['Sáb','43'],['Dom','0']].map(([day,h]) => <div className="bar-col" key={day}><div className="bar" style={{ height: `${h}%` }} /><small>{day}</small></div>)}</div></div></div>
            <div className="section-card upcoming-card"><div className="section-head"><div><h2>Próximos agendamentos</h2></div><button className="ghost-button">Ver todos</button></div><div className="upcoming"><div><time>16:00</time><b>Felipe Andrade</b><small>Corte + Barba</small><span>Confirmado</span></div><div><time>17:00</time><b>Bruno Almeida</b><small>Degradê</small><span>Confirmado</span></div></div></div>
            <div className="section-card shortcuts-card"><div className="section-head"><h2>Atalhos rápidos</h2></div><div className="shortcuts"><button onClick={startBooking}><Icon name="calendar" /><span>Novo agendamento</span></button><button><Icon name="users" /><span>Novo cliente</span></button><button><Icon name="money" /><span>Caixa do dia</span></button><button><Icon name="chart" /><span>Relatórios</span></button></div></div>
          </div>
        </section>
      </main>}
    </div>
  );
}
