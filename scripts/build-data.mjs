import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'data-source', 'employees.xlsx');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'employees.json');
const FALLBACK_FILE = path.join(DATA_DIR, 'fallback-data.js');
const VERSION_FILE = path.join(DATA_DIR, 'version.json');
const CHANGE_FILE = path.join(DATA_DIR, 'change-summary.json');
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
function diffRecord(before, after){
  const changes=[];
  for(const key of COMPARE_FIELDS){
    const a = String(before?.[key] ?? '');
    const b = String(after?.[key] ?? '');
    if(a !== b) changes.push({field:key, oldValue:before?.[key] ?? '', newValue:after?.[key] ?? ''});
  }
  return changes;
}
function stableId(rec){
  return rec.employeeNo || `TEMP-PERM-${String(rec.num).padStart(4,'0')}`;
}

if(!fs.existsSync(SOURCE)) throw new Error(`ملف Excel غير موجود: ${SOURCE}`);
fs.mkdirSync(DATA_DIR,{recursive:true});

const previous = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE,'utf8')) : {meta:{},perm:[],cont:[]};
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
const newById=new Map(perm.map(x=>[String(x.id),x]));
const added=[];
const modified=[];
const unchanged=[];
const missing=[];

for(const rec of perm){
  const old=oldById.get(String(rec.id));
  if(!old){
    added.push({id:rec.id,employeeNo:rec.employeeNo,name:rec.name,num:rec.num});
    continue;
  }
  const changes=diffRecord(old,rec);
  if(changes.length) modified.push({id:rec.id,employeeNo:rec.employeeNo,name:rec.name,num:rec.num,changes});
  else unchanged.push(rec.id);
}

// Safety rule: a row disappearing from Excel is NOT deleted automatically.
// It is retained from the previous central dataset and marked for review.
for(const old of oldPerm){
  const oid=String(old.id||stableId(old));
  if(newById.has(oid)) continue;
  const kept=clone(old);
  kept.syncStatus='missingFromExcel';
  kept.syncWarning='غير موجود في ملف Excel الحالي — لم يتم حذفه تلقائياً';
  perm.push(kept);
  missing.push({id:kept.id,employeeNo:kept.employeeNo||null,name:kept.name,num:kept.num});
  warnings.push(`مفقود من Excel ولم يحذف تلقائياً: ${kept.name} — اضبارة ${kept.num}`);
}
perm.sort((a,b)=>Number(a.num)-Number(b.num));

const cont=Array.isArray(previous.cont)?previous.cont:[];
const version=makeVersion();
const updatedAt=new Date().toISOString();
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
const summary={
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
  missingCount:missing.length,
  warningCount:warnings.length,
  source:'data-source/employees.xlsx'
};

fs.writeFileSync(DATA_FILE,JSON.stringify(dataset,null,2));
fs.writeFileSync(FALLBACK_FILE,'window.FALLBACK_EMPLOYEE_DATA = '+JSON.stringify(dataset)+';\n');
fs.writeFileSync(VERSION_FILE,JSON.stringify(versionMeta,null,2));
fs.writeFileSync(CHANGE_FILE,JSON.stringify(summary,null,2));

console.log(`\n✓ Excel Master build succeeded`);
console.log(`Version: ${version}`);
console.log(`Excel rows: ${rows.length}`);
console.log(`Added: ${added.length} | Modified: ${modified.length} | Missing kept for review: ${missing.length} | Unchanged: ${unchanged.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Published: ${perm.length} permanent + ${cont.length} contract = ${perm.length+cont.length}`);
