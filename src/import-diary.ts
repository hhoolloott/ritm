import {type GymState} from './model';
export function mergeDiary(existing:GymState,incoming:GymState):GymState{
 const result=structuredClone(existing);
 const sessions=new Map(incoming.sessions.filter(s=>s.status==='completed').map(s=>[s.id,s]));
 for(const s of existing.sessions)sessions.set(s.id,s);
 result.sessions=[...sessions.values()];
 const templates=new Map(existing.templates.map(t=>[t.id,t]));
 for(const t of incoming.templates){const old=templates.get(t.id);if(!old||old.exercises.length===0)templates.set(t.id,{...t,exercises:t.exercises.map(e=>({...e,sets:e.sets.map(s=>({...s,done:false}))}))});}
 result.templates=[...templates.values()];
 return result;
}
