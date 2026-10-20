import {createClient} from '@supabase/supabase-js';
import {initialState,stateSchema} from './model';
import {localJournalRequest} from './local-preview';
const url=import.meta.env.VITE_SUPABASE_URL||'';
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
// Only the browser-safe publishable/anon key belongs in VITE_* variables.
export const cloud=url&&key?createClient(url,key):null;
export const localPreview=!cloud&&import.meta.env.VITE_LOCAL_PREVIEW==='true';
const result=(body:unknown,status=200)=>Response.json(body,{status});
export async function journalRequest(options?:{method?:string,body?:string}):Promise<Response>{
 if(localPreview)return localJournalRequest(options);
 if(!cloud)return result({error:'Облачная база ещё не подключена'},503);
 const {data:{session}}=await cloud.auth.getSession();
 if(!session)return result({error:'Войди в дневник заново'},401);
 if(options?.method==='PUT'){
  const body=JSON.parse(options.body||'{}');const checked=stateSchema.safeParse(body.state);
  if(!checked.success||!Number.isSafeInteger(body.revision)||body.revision<0)return result({error:'Проверь введённые значения'},400);
  if(checked.data.sessions.filter(s=>s.status==='active').length>1)return result({error:'Сначала заверши текущую тренировку'},400);
  const {data,error}=await cloud.rpc('save_journal',{p_payload:checked.data,p_expected_revision:body.revision});
  if(error){if(error.code==='40001')return result({error:'Дневник изменён на другом устройстве. Загрузи облачную версию.'},409);throw new Error('Не удалось сохранить запись. Проверь подключение к интернету.');}
  return result({revision:data});
 }
 const {data,error}=await cloud.from('journals').select('payload,revision').eq('user_id',session.user.id).maybeSingle();
 if(error)throw new Error('Не удалось загрузить дневник. Проверь подключение к базе.');
 const parsed=stateSchema.safeParse(data?.payload??initialState());
 if(!parsed.success)throw new Error('Формат дневника не поддерживается. Сохрани копию данных перед обновлением.');
 return result({state:parsed.data,revision:data?.revision??0});
}
