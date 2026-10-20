import {useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import type {Session} from '@supabase/supabase-js';
import {cloud,localPreview} from './cloud';
import GymApp from './gym-app';
import './style.css';
function App(){
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!cloud){setLoading(false);return;}let alive=true;cloud.auth.getSession().then(({data,error})=>{if(alive){setSession(data.session);setLoading(false);if(error)setError('Не удалось восстановить вход. Попробуй войти заново.');}});const {data:{subscription}}=cloud.auth.onAuthStateChange((_event,s)=>{if(alive){setSession(s);setLoading(false);}});return()=>{alive=false;subscription.unsubscribe();};},[]);
 if(loading)return <main className="login"><div className="brand">ритм</div><p>Загружаем дневник…</p></main>;
 if(localPreview)return <GymApp userKey="local-preview"/>;
 if(!cloud)return <main className="login"><div className="brand">ритм</div><h2>Дневник ещё настраивается</h2><p>Для сохранения записей между устройствами<br/>нужно подключить облачную базу.</p></main>;
 if(session)return <GymApp key={session.user.id} userKey={session.user.id}/>;
 return <main className="login"><div className="brand">ритм</div><h2>Твой дневник тренировок</h2><p>Войди в один аккаунт на телефоне и ноутбуке.</p><form className="login-form" onSubmit={async e=>{e.preventDefault();if(!cloud||busy)return;setBusy(true);setError('');try{const {error}=await cloud.auth.signInWithPassword({email:email.trim(),password});if(error)setError('Не удалось войти. Проверь почту и пароль.');else setPassword('');}catch{setError('Нет соединения. Попробуй ещё раз.');}finally{setBusy(false);}}}><label>Почта<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Пароль<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="login-error">{error}</p>}<button className="btn primary wide" disabled={busy}>{busy?'Входим…':'Войти'}</button></form></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
