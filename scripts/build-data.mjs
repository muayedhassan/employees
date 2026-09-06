import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'data-source', 'employees.xlsx');
const DATA_FILE = path.join(ROOT, 'data', 'employees.json');
const FALLBACK_FILE = path.join(ROOT, 'data', 'fallback-data.js');
const VERSION_FILE = path.join(ROOT, 'data', 'version.json');

const map = {
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

function text(v){
  if(v === undefined || v === null) return '';
  return String(v).trim();
}
function versionNow(){
  const parts = new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Baghdad', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
  }).formatToParts(new Date()).reduce((o,p)=>(o[p.type]=p.value,o),{});
  return `${parts.year}.${parts.month}.${parts.day}.${parts.hour}${parts.minute}${parts.second}`;
}

if(!fs.existsSync(SOURCE)) throw new Error(`Missing ${SOURCE}`);

const oldData = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE,'utf8')) : {cont:[]};
const wb = XLSX.readFile(SOURCE, {raw:false});
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
const perm = rows.map(row => {
  const rec = {};
  for(const [ar,key] of Object.entries(map)) rec[key] = text(row[ar]);
  rec.num = Number(rec.num);
  if(!Number.isInteger(rec.num) || rec.num < 1) throw new Error(`Invalid file number for ${rec.name}`);
  if(!rec.name) throw new Error(`Missing name at file number ${rec.num}`);
  if(!rec.employeeNo || rec.employeeNo === '—' || rec.employeeNo === '-'){
    rec.employeeNo = null;
    rec.id = `TEMP-PERM-${String(rec.num).padStart(4,'0')}`;
    rec.idStatus = 'temporary';
  }else{
    rec.id = rec.employeeNo;
    rec.idStatus = 'employeeNo';
  }
  rec.type = 'perm';
  return rec;
});

const employeeNos = perm.filter(x=>x.employeeNo).map(x=>x.employeeNo);
if(new Set(employeeNos).size !== employeeNos.length) throw new Error('Duplicate employee number found in Excel');
const fileNos = perm.map(x=>x.num);
if(new Set(fileNos).size !== fileNos.length) throw new Error('Duplicate permanent file number found in Excel');

const cont = Array.isArray(oldData.cont) ? oldData.cont : [];
const version = versionNow();
const updatedAt = new Date().toISOString();
const dataset = {
  meta:{
    schemaVersion:2,
    version,
    updatedAt,
    source:'data-source/employees.xlsx',
    primaryIdentifier:'employeeNo',
    counts:{perm:perm.length,cont:cont.length,total:perm.length+cont.length}
  },
  perm,
  cont
};
const versionMeta = {
  schemaVersion:2,
  version,
  updatedAt,
  permCount:perm.length,
  contCount:cont.length,
  totalCount:perm.length+cont.length,
  source:'data-source/employees.xlsx'
};

fs.writeFileSync(DATA_FILE, JSON.stringify(dataset,null,2));
fs.writeFileSync(FALLBACK_FILE, 'window.FALLBACK_EMPLOYEE_DATA = '+JSON.stringify(dataset)+';\n');
fs.writeFileSync(VERSION_FILE, JSON.stringify(versionMeta,null,2));
console.log(`Generated ${perm.length} permanent + ${cont.length} contract employees; version ${version}`);
