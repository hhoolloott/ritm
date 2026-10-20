import {initialState,stateSchema} from './model';

const storageKey='ritm-local-preview-v1';
// This preview stays in this browser. It never writes to a server.
export function localJournalRequest(options?:{method?:string,body?:string}):Response{
 const raw=localStorage.getItem(storageKey);
 const stored=raw?JSON.parse(raw):{state:initialState(),revision:0};
 const state=stateSchema.parse(stored.state);
 if(!Number.isSafeInteger(stored.revision)||stored.revision<0)throw new Error('Не удалось прочитать локальный дневник');
 if(options?.method!=='PUT')return Response.json({state,revision:stored.revision});
 const body=JSON.parse(options.body||'{}');
 const checked=stateSchema.safeParse(body.state);
 if(!checked.success||!Number.isSafeInteger(body.revision)||body.revision<0||checked.data.sessions.filter(s=>s.status==='active').length>1)return Response.json({error:'Проверь введённые значения'},{status:400});
 if(body.revision!==stored.revision)return Response.json({error:'Записи изменены в другой вкладке. Скачай копию перед перезагрузкой.'},{status:409});
 const revision=stored.revision+1;
 localStorage.setItem(storageKey,JSON.stringify({state:checked.data,revision}));
 return Response.json({revision});
}
