import { z } from 'zod';

const id=z.string().min(1).max(100),num=z.number().finite().min(0).max(5000);
export const setSchema=z.object({id,weight:num,reps:z.number().int().min(0).max(1000),done:z.boolean()});
export const exerciseSchema=z.object({id,name:z.string().trim().min(1).max(120),group:z.string().max(60),sets:z.array(setSchema).min(1).max(30)});
export const templateSchema=z.object({id,name:z.string().trim().min(1).max(100),note:z.string().max(300),exercises:z.array(exerciseSchema).max(50)});
export const sessionSchema=z.object({id,templateId:z.string().max(100),name:z.string().min(1).max(100),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),startedAt:z.string().max(40),duration:z.number().finite().min(0).max(1000000),status:z.enum(['active','completed']),exercises:z.array(exerciseSchema).max(50),note:z.string().max(1000)});
export const stateSchema=z.object({templates:z.array(templateSchema).max(100),sessions:z.array(sessionSchema).max(5000),plans:z.array(z.object({id,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),templateId:id})).max(2000),settings:z.object({weeklyGoal:z.number().int().min(1).max(14),restSeconds:z.number().int().min(0).max(600),membershipStart:z.string().max(10),membershipEnd:z.string().max(10),membershipPrice:z.number().finite().min(0).max(1000000),membershipVisits:z.number().int().min(0).max(10000)})});
export type GymState=z.infer<typeof stateSchema>;
export type Exercise=z.infer<typeof exerciseSchema>;
export type Template=z.infer<typeof templateSchema>;
export type Session=z.infer<typeof sessionSchema>;
export const uid=()=>crypto.randomUUID();
export const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const dayDate=(s:string)=>new Date(s+'T12:00:00');
export const monday=(d=new Date())=>{const n=new Date(d);n.setHours(12,0,0,0);n.setDate(n.getDate()-((n.getDay()+6)%7));return n;};
export const fmt=(n:number)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
export const volume=(s:Session)=>s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.done).reduce((a,x)=>a+x.weight*x.reps,0),0);
export const doneSets=(s:Session)=>s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.done).length,0);
export function initialState():GymState {return {templates:['Руки','Грудь','Спина','Ноги'].map((name,i)=>({id:'base-'+i,name,note:'',exercises:[]})),sessions:[],plans:[],settings:{weeklyGoal:3,restSeconds:90,membershipStart:'',membershipEnd:'',membershipPrice:0,membershipVisits:0}};}
export function prepareSession(template:Template,history:Session[],date=dateKey()):Session {
 const prior=[...history].filter(s=>s.status==='completed').sort((a,b)=>b.date.localeCompare(a.date)||b.startedAt.localeCompare(a.startedAt));
 return {id:uid(),templateId:template.id,name:template.name,date,startedAt:new Date().toISOString(),duration:0,status:'active',note:'',exercises:template.exercises.map(e=>{const previous=prior.flatMap(s=>s.exercises).find(x=>x.name.trim().toLocaleLowerCase()===e.name.trim().toLocaleLowerCase());const sets=previous?.sets.filter(s=>s.done);return {...e,id:uid(),sets:(sets?.length?sets:e.sets).map(s=>({...s,id:uid(),done:false}))};})};
}



