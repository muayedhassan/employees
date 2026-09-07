import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'data-source', 'employees.xlsx');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'employees.json');
const FALLBACK_FILE = path.join(DATA_DIR, 'fallback-data.js');
const VERSION_FILE = path.join(DATA_DIR, 'version.json');
const CHANGE_FILE = path.join(DATA_DIR, 'change-summary.json');
const HISTORY_FILE = path.join(DATA_DIR, 'change-history.json');
const VALIDATION_FILE = path.join(DATA_DIR, 'validation-report.json');

const FIELD_MAP = {
  'الرقم الوظيفي':'employeeNo',
  'الاسم الكامل':'name',
  'اسم الأم':'motherName',
  'الجنس':'gender',
  'رقم الهوية':'identityNo',
  'تاريخ إصدار الهوية':'identityIssueDate',
  'جهة إصدار الهوية':'identityIssuer',
  'الشعبة':'division',
  'الحالة الوظيفية':'employmentStatus',
  'التحصيل الدراسي':'education',
  'العنوان الوظيفي':'jobTitle',
  'الاختصاص':'specialization',
  'الدرجة':'grade',
  'المرحلة':'step',
  'الراتب':'salary',
  'تاريخ التولد':'birthDate',
  'تاريخ التعيين':'hireDate',
  'الملاحظات':'notes',
  'رقم الاضبارة':'num'
};
const REQUIRED_HEADERS = Object.keys(FIELD_MAP);
const COMPARE_FIELDS = Object.values(FIELD_MAP).filter(k => k !== 'num').concat(['num']);
// Values that are only display placeholders must never be counted as real employee-data edits.
// In the historical source, the value 36 was used as a placeholder for missing data in these fields.
const MISSING_EQUIV_FIELDS = new Set([
  'motherName','gender','identityNo','identityIssueDate','identityIssuer','division',
  'education','jobTitle','specialization','birthDate','hireDate','notes'
]);
const NUMERIC_COMPARE_FIELDS = new Set(['num','salary','grade','step']);

function text(v){
  if(v === undefined || v === null) return '';
  return String(v).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
}
function cleanEmployeeNo(v){
  const s = text(v);
  if(!s || s === '—' || s === '-' || s === '–') return null;
  return s;
}
function nowBaghdad(){
  const parts = new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false
  }).formatToParts(new Date()).reduce((o,p)=>(o[p.type]=p.value,o),{});
  return parts;
}
function makeVersion(){
  const p = nowBaghdad();
  return `DATA-${p.year}.${p.month}.${p.day}-${p.hour}${p.minute}${p.second}`;
}
function clone(v){ return JSON.parse(JSON.stringify(v)); }
function comparable(rec){
  const out={};
  for(const k of COMPARE_FIELDS) out[k] = rec?.[k] ?? '';
  return out;
}
function semanticValue(key,value){
  let s=text(value);
  if(!s || s==='—' || s==='-' || s==='–' || s==='غير متوفر') return '';
  if(MISSING_EQUIV_FIELDS.has(key) && s==='36') return '';
  if(NUMERIC_COMPARE_FIELDS.has(key)){
    const n=Number(String(s).replace(/,/g,''));
    if(Number.isFinite(n)) return String(n);
  }
  return s;
}
function isAnyFieldChange(key,before,after){
  return semanticValue(key,before)!==semanticValue(key,after);
}
// A real edit is only a change between two meaningful existing values.
// Missing/placeholder -> value and value -> missing are data-quality changes, not edits.
function isRealFieldChange(key,before,after){
  const a=semanticValue(key,before), b=semanticValue(key,after);
  return a!=='' && b!=='' && a!==b;
}
function sanitizeModifiedEntries(list){
  return (Array.isArray(list)?list:[]).map(item=>{
    const changes=(Array.isArray(item.changes)?item.changes:[]).filter(c=>isRealFieldChange(c.field,c.oldValue,c.newValue));
    return {...item,changes};
  }).filter(item=>item.changes.length>0);
}
function sanitizeSummaryObject(src){
  if(!src) return src;
  const out=clone(src);
  out.added=Array.isArray(out.added)?out.added:[];
  out.missing=Array.isArray(out.missing)?out.missing:[];
  out.modified=sanitizeModifiedEntries(out.modified);
  out.counts={...(out.counts||{})};
  out.counts.added=out.added.length;
  out.counts.modified=out.modified.length;
  out.counts.missing=out.missing.length;
  if(Number.isFinite(Number(out.counts.excelRows))){
    out.counts.unchanged=Math.max(0,Number(out.counts.excelRows)-out.counts.added-out.counts.modified);
  }
  return out;
}
function sanitizeHistoryObject(src){
  const out={schemaVersion:1,updatedAt:src?.updatedAt||null,versions:[]};
  out.versions=(Array.isArray(src?.versions)?src.versions:[]).map(v=>sanitizeSummaryObject(v));
  return out;
}
function auditValue(key,value){
  if(semanticValue(key,value)==='') return '';
  const v=value ?? '';
  // Keep historical identity-number changes useful without retaining the full old ID in the audit file.
  if(key==='identityNo'){
    const t=String(v).trim();
    if(!t) return '';
    if(t.length<=4) return '****';
    return '••••'+t.slice(-4);
  }
  return v;
}
function diffRecord(before, after){
  const changes=[];
  for(const key of COMPARE_FIELDS){
    if(isRealFieldChange(key,before?.[key],after?.[key])){
      changes.push({field:key, oldValue:auditValue(key,before?.[key]), newValue:auditValue(key,after?.[key])});
    }
  }
  return changes;
}
function diffRecordAll(before, after){
  const changes=[];
  for(const key of COMPARE_FIELDS){
    if(isAnyFieldChange(key,before?.[key],after?.[key])) changes.push(key);
  }
  return changes;
}
function stableId(rec){
  return rec.employeeNo || `TEMP-PERM-${String(rec.num).padStart(4,'0')}`;
}

if(!fs.existsSync(SOURCE)) throw new Error(`ملف Excel غير موجود: ${SOURCE}`);
fs.mkdirSync(DATA_DIR,{recursive:true});

const previous = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE,'utf8')) : {meta:{},perm:[],cont:[]};
const previousSummaryRaw = fs.existsSync(CHANGE_FILE) ? JSON.parse(fs.readFileSync(CHANGE_FILE,'utf8')) : null;
const previousSummary = sanitizeSummaryObject(previousSummaryRaw);
const previousHistoryRaw = fs.existsSync(HISTORY_FILE) ? JSON.parse(fs.readFileSync(HISTORY_FILE,'utf8')) : {schemaVersion:1,versions:[]};
const previousHistory = sanitizeHistoryObject(previousHistoryRaw);
const workbook = XLSX.readFile(SOURCE,{raw:false,cellDates:false});
if(!workbook.SheetNames.length) throw new Error('ملف Excel لا يحتوي على أوراق');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const matrix = XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,blankrows:false});
if(!matrix.length) throw new Error('ورقة Excel فارغة');
const headers = matrix[0].map(text);
const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
if(missingHeaders.length) throw new Error('أعمدة إلزامية مفقودة: '+missingHeaders.join('، '));

const rows = XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false,blankrows:false});
const errors=[];
const warnings=[];
const perm=[];

rows.forEach((row,index)=>{
  const excelRow=index+2;
  const rec={};
  for(const [ar,key] of Object.entries(FIELD_MAP)) rec[key]=text(row[ar]);
  rec.employeeNo=cleanEmployeeNo(rec.employeeNo);
  rec.num=Number(rec.num);
  if(!rec.name) errors.push(`الصف ${excelRow}: الاسم الكامل فارغ`);
  if(!Number.isInteger(rec.num) || rec.num < 1) errors.push(`الصف ${excelRow}: رقم الاضبارة غير صحيح للموظف ${rec.name||'غير معروف'}`);
  if(!rec.employeeNo) warnings.push(`الصف ${excelRow}: لا يوجد رقم وظيفي للموظف ${rec.name||'غير معروف'} (سيستخدم معرف مؤقت)`);
  rec.id=stableId(rec);
  rec.idStatus=rec.employeeNo?'employeeNo':'temporary';
  rec.type='perm';
  rec.syncStatus='current';
  perm.push(rec);
});

const empSeen=new Map();
for(const rec of perm){
  if(!rec.employeeNo) continue;
  if(empSeen.has(rec.employeeNo)) errors.push(`رقم وظيفي مكرر ${rec.employeeNo}: ${empSeen.get(rec.employeeNo)} / ${rec.name}`);
  else empSeen.set(rec.employeeNo,rec.name);
}
const fileSeen=new Map();
for(const rec of perm){
  if(!Number.isInteger(rec.num)) continue;
  if(fileSeen.has(rec.num)) errors.push(`رقم اضبارة مكرر ${rec.num}: ${fileSeen.get(rec.num)} / ${rec.name}`);
  else fileSeen.set(rec.num,rec.name);
}

// Because employeeNo is the primary identifier, changing it is treated as a blocking error.
// We detect this by comparing the same file number in the previously published central data.
const oldPermIdentity = Array.isArray(previous.perm) ? previous.perm : [];
const newByFileNo = new Map(perm.filter(x=>Number.isInteger(x.num)).map(x=>[x.num,x]));
for(const old of oldPermIdentity){
  const now = newByFileNo.get(Number(old.num));
  if(!now) continue;
  const oldEmp = cleanEmployeeNo(old.employeeNo);
  const newEmp = cleanEmployeeNo(now.employeeNo);
  if(oldEmp && oldEmp !== newEmp){
    errors.push(`تغير الرقم الوظيفي للاضبارة ${old.num}: ${old.name} (${oldEmp}) ← ${now.name} (${newEmp||'فارغ'}). الرقم الوظيفي معرف ثابت ويجب مراجعة الحالة.`);
  }
}

const validation={
  ok:errors.length===0,
  checkedAt:new Date().toISOString(),
  source:'data-source/employees.xlsx',
  sheet:workbook.SheetNames[0],
  excelRows:rows.length,
  errors,
  warnings,
  requiredHeaders:REQUIRED_HEADERS
};
fs.writeFileSync(VALIDATION_FILE,JSON.stringify(validation,null,2));
if(errors.length){
  console.error('\nفشل فحص Excel:');
  errors.forEach(x=>console.error('- '+x));
  process.exit(2);
}

const oldPerm=Array.isArray(previous.perm)?previous.perm:[];
const oldById=new Map(oldPerm.map(x=>[String(x.id||stableId(x)),x]));
const oldByFileNo=new Map(oldPerm.filter(x=>Number.isInteger(Number(x.num))).map(x=>[Number(x.num),x]));
const newById=new Map(perm.map(x=>[String(x.id),x]));
const matchedOldIds=new Set();
const added=[];
const modified=[];
const qualityChanged=[];
const unchanged=[];
const missing=[];

for(const rec of perm){
  let old=oldById.get(String(rec.id));
  // If a previously missing employee number is completed later, keep it as the same employee.
  if(!old){
    const byFile=oldByFileNo.get(Number(rec.num));
    if(byFile && !cleanEmployeeNo(byFile.employeeNo)) old=byFile;
  }
  if(!old){
    added.push({id:rec.id,employeeNo:rec.employeeNo,name:rec.name,num:rec.num});
    continue;
  }
  matchedOldIds.add(String(old.id||stableId(old)));
  const allChanges=diffRecordAll(old,rec);
  const changes=diffRecord(old,rec);
  if(changes.length) modified.push({id:rec.id,employeeNo:rec.employeeNo,name:rec.name,num:rec.num,changes});
  if(allChanges.length && !changes.length) qualityChanged.push(rec.id);
  if(!allChanges.length) unchanged.push(rec.id);
}

// Safety rule: a row disappearing from Excel is NOT deleted automatically.
// It is retained from the previous central dataset and marked for review.
for(const old of oldPerm){
  const oid=String(old.id||stableId(old));
  if(newById.has(oid) || matchedOldIds.has(oid)) continue;
  const kept=clone(old);
  kept.syncStatus='missingFromExcel';
  kept.syncWarning='غير موجود في ملف Excel الحالي — لم يتم حذفه تلقائياً';
  perm.push(kept);
  missing.push({id:kept.id,employeeNo:kept.employeeNo||null,name:kept.name,num:kept.num});
  warnings.push(`مفقود من Excel ولم يحذف تلقائياً: ${kept.name} — اضبارة ${kept.num}`);
}
perm.sort((a,b)=>Number(a.num)-Number(b.num));

const cont=Array.isArray(previous.cont)?previous.cont:[];
const hasDataChanges = added.length>0 || modified.length>0 || qualityChanged.length>0 || missing.length>0;
const version = hasDataChanges ? makeVersion() : (previous?.meta?.version || makeVersion());
const updatedAt = hasDataChanges ? new Date().toISOString() : (previous?.meta?.updatedAt || new Date().toISOString());
const dataset={
  meta:{
    schemaVersion:3,
    mode:'excel-master',
    version,
    updatedAt,
    source:'data-source/employees.xlsx',
    primaryIdentifier:'employeeNo',
    temporaryIdCount:perm.filter(x=>!x.employeeNo).length,
    missingFromExcelCount:missing.length,
    counts:{perm:perm.length,cont:cont.length,total:perm.length+cont.length}
  },
  perm,
  cont
};
const summaryCandidate={
  schemaVersion:1,
  mode:'excel-master',
  previousVersion:previous?.meta?.version||null,
  version,
  updatedAt,
  source:'data-source/employees.xlsx',
  counts:{
    excelRows:rows.length,
    added:added.length,
    modified:modified.length,
    qualityChanged:qualityChanged.length,
    missing:missing.length,
    unchanged:unchanged.length,
    warnings:warnings.length,
    totalPublished:perm.length+cont.length
  },
  added,
  modified,
  missing,
  warnings
};
// Code-only workflow runs must not create a fake employee-data version.
// If Excel content is unchanged, keep the last real change summary/version.
const summary = hasDataChanges || !previousSummary ? summaryCandidate : previousSummary;

function historyEventFromSummary(x){
  if(!x || !x.version) return null;
  return {
    version:x.version,
    previousVersion:x.previousVersion||null,
    updatedAt:x.updatedAt||null,
    source:x.source||'data-source/employees.xlsx',
    counts:x.counts||{},
    added:Array.isArray(x.added)?x.added:[],
    modified:Array.isArray(x.modified)?x.modified.map(m=>({...m,changes:Array.isArray(m.changes)?m.changes.map(c=>({field:c.field,oldValue:auditValue(c.field,c.oldValue),newValue:auditValue(c.field,c.newValue)})):[]})):[],
    missing:Array.isArray(x.missing)?x.missing:[]
  };
}
const history={schemaVersion:1,updatedAt:new Date().toISOString(),versions:Array.isArray(previousHistory?.versions)?previousHistory.versions.slice():[]};
// On first installation, seed history with the last already-published Excel change.
if(history.versions.length===0){
  const seed=historyEventFromSummary(previousSummary);
  if(seed && ((seed.counts?.added||0)+(seed.counts?.modified||0)+(seed.counts?.missing||0)>0)) history.versions.push(seed);
}
if(hasDataChanges){
  const ev=historyEventFromSummary(summaryCandidate);
  if(ev && !history.versions.some(x=>x.version===ev.version)) history.versions.push(ev);
}
// Keep a useful long-term audit trail without allowing the public JSON to grow forever.
history.versions=history.versions.slice(-60);
const versionMeta={
  schemaVersion:3,
  mode:'excel-master',
  version,
  updatedAt,
  appDataSource:'Excel/GitHub',
  permCount:perm.length,
  contCount:cont.length,
  totalCount:perm.length+cont.length,
  addedCount:added.length,
  modifiedCount:modified.length,
  qualityChangedCount:qualityChanged.length,
  missingCount:missing.length,
  warningCount:warnings.length,
  source:'data-source/employees.xlsx'
};

fs.writeFileSync(DATA_FILE,JSON.stringify(dataset,null,2));
fs.writeFileSync(FALLBACK_FILE,'window.FALLBACK_EMPLOYEE_DATA = '+JSON.stringify(dataset)+';\n');
fs.writeFileSync(VERSION_FILE,JSON.stringify(versionMeta,null,2));
fs.writeFileSync(CHANGE_FILE,JSON.stringify(summary,null,2));
fs.writeFileSync(HISTORY_FILE,JSON.stringify(history,null,2));

console.log(`\n✓ Excel Master build succeeded`);
console.log(`Version: ${version}${hasDataChanges?'':' (no employee-data changes)'}`);
console.log(`Excel rows: ${rows.length}`);
console.log(`Added: ${added.length} | Real edits: ${modified.length} | Data-quality changes: ${qualityChanged.length} | Missing kept for review: ${missing.length} | Unchanged: ${unchanged.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Published: ${perm.length} permanent + ${cont.length} contract = ${perm.length+cont.length}`);
