#!/usr/bin/env python3
"""Prepare SQL and a Storage manifest from normalized legacy JSON; performs no network writes.
Usage: python scripts/prepare_legacy_import.py legacy.json auth-user-map.json output-dir
JSON shape: {"specialty": [{"SpecialtyID": 1, "SpecialtyName": "..."}], "user": [...]}
Auth map shape: {"legacy UserID": "existing Supabase Auth UUID"}.
"""
import json, sys, uuid, re
from pathlib import Path
NAMESPACE = uuid.UUID('79325e40-54c2-4a47-9611-6fc402ca29cf')
TABLES = {
 'specialty': ('specialties','SpecialtyID',{'SpecialtyName':'name'}),
 'symptom_rule': ('symptom_rules','RuleID',{'Keyword':'keyword','SpecialtyID':'specialty_id','Priority':'priority','EmergencyNotice':'emergency_notice'}),
 'doctor': ('doctors','UserID',{'FullName':'full_name','RegistrationNo':'registration_no','SpecialtyID':'specialty_id','Specialization':'specialization','Qualification':'qualification','Experience':'experience','Location':'location','ConsultationFee':'consultation_fee','AvailableTime':'available_time','Phone':'phone','Email':'email','Status':'status'}),
 'hospital': ('hospitals','HospitalID',{'HospitalName':'name','Address':'address','Location':'location','Phone':'phone','Email':'email','EmergencyPhone':'emergency_phone','Departments':'departments','Description':'description','Status':'status'}),
 'caregiver': ('caregivers','CaregiverID',{'FullName':'full_name','Gender':'gender','Experience':'experience','Qualification':'qualification','Services':'services','Location':'location','FeePerDay':'fee_per_day','Phone':'phone','Email':'email','Availability':'availability','Status':'status'}),
 'ambulance': ('ambulances','AmbulanceID',{'ServiceName':'service_name','DriverName':'driver_name','DriverPhone':'driver_phone','AmbulanceType':'ambulance_type','VehicleNumber':'vehicle_number','Location':'location','Address':'address','City':'city','HospitalName':'hospital_name','Availability':'availability','Rate':'rate','Status':'status'}),
 'lab_tests': ('lab_tests','LabTestID',{'TestName':'test_name','LaboratoryName':'laboratory_name','Category':'category','Description':'description','Price':'price','Location':'location','Address':'address','Contact':'contact','Status':'status'}),
}
def identifier(table,old):
 if old is None: raise ValueError('Missing primary key for '+table)
 return str(uuid.uuid5(NAMESPACE,table+':'+str(old)))
def literal(value):
 if value is None:return 'NULL'
 # Standard-conforming strings; never evaluate supplied SQL or shell fragments.
 return "'"+str(value).replace("'","''")+"'"
def prepare(source,user_map):
 tables={k.lower():v for k,v in source.items()}
 if not all(isinstance(v,list) for v in tables.values()):raise ValueError('Every table value must be an array of row objects.')
 for k,v in user_map.items():uuid.UUID(v)
 def owner(old):
  if str(old) not in user_map:raise ValueError('Missing Auth UUID mapping for legacy UserID '+str(old))
  return user_map[str(old)]
 sql=['-- Review before running as postgres. Auth users must already exist.', 'begin;','set standard_conforming_strings=on;']
 files=[]
 def add_file(old,bucket,folder,table,row_id,column,fallback):
  if not old:return
  raw=str(old).replace('\\','/')
  if raw.startswith(('http:','https:','/')) or '..' in raw.split('/'):raise ValueError('Unsafe file path: '+raw)
  local=raw if raw.startswith('uploads/') else fallback+'/'+Path(raw).name
  ext=Path(raw).suffix.lower()
  if ext not in (['.pdf','.png','.jpg','.jpeg'] if bucket=='health-records' else ['.png','.jpg','.jpeg']):raise ValueError('Unsupported file type: '+raw)
  storage_path=f'{folder}/{identifier(table+"-file",row_id)}{ext}'
  files.append({'local_path':local,'bucket':bucket,'path':storage_path,'table':table,'row_id':row_id,'column':column})
  return storage_path
 for old_table,(new_table,pk,columns) in TABLES.items():
  for r in tables.get(old_table,[]):
   row_id=identifier(old_table,r.get(pk)); data={'id':row_id}
   for src,dst in columns.items():
    if src in r: data[dst]=r[src]
   if data.get('status') is None and 'Status' in columns:data['status']='Active'
   if old_table=='symptom_rule':data['priority']=data.get('priority') or 0
   if 'specialty_id' in data:data['specialty_id']=identifier('specialty',data['specialty_id'])
   if old_table=='doctor' and str(r.get('UserID')) in user_map:data['user_id']=owner(r['UserID'])
   old_image=r.get('ProfileImage') or r.get('ImagePath')
   if old_image:
    image=add_file(old_image,'directory-images','legacy',new_table,row_id,'image_path','uploads/'+new_table)
    data['image_path']=image
   sql.append(f'insert into public.{new_table} ({",".join(data)}) values ({",".join(map(literal,data.values()))}) on conflict(id) do nothing;')
 for r in tables.get('user',[]):
  uid=owner(r.get('UserID'))
  role={'Patient':'patient','Doctor':'doctor','Admin':'admin'}.get(r.get('UserType','Patient'))
  if role is None:raise ValueError('Unknown UserType')
  # No passwords or email changes: Auth is the authoritative credential store.
  values={'full_name':r.get('FullName',''),'phone':r.get('Phone'),'address':r.get('Address'),'role':role,'status':r.get('Status') or 'Active'}
  sql.append('update public.profiles set '+','.join(k+'='+literal(v) for k,v in values.items())+' where id='+literal(uid)+';')
 for r in tables.get('patient_profiles',[]):
  uid=owner(r.get('UserID'));values={}
  for old,new in {'Phone':'phone','Address':'address','DateOfBirth':'date_of_birth','BloodGroup':'blood_group','Gender':'gender'}.items():
   if old in r:values[new]=None if r[old] in ('','0000-00-00') else r[old]
  if r.get('ProfileImage'):values['avatar_path']=add_file(r['ProfileImage'],'avatars',uid,'profiles',uid,'avatar_path','uploads/profiles')
  if values:sql.append('update public.profiles set '+','.join(k+'='+literal(v) for k,v in values.items())+' where id='+literal(uid)+';')
 for table,kind,pk,date in [('prescriptions','prescription','PrescriptionID','UploadDate'),('lab_reports','report','ReportID','ReportDate')]:
  for r in tables.get(table,[]):
   uid=owner(r.get('UserID'));row_id=identifier(table,r.get(pk));name=r.get('FileName')
   if not name:raise ValueError('Missing FileName')
   path=add_file(name,'health-records',uid,'health_records',row_id,'path','uploads/'+('reports' if kind=='report' else 'prescriptions'))
   values={'id':row_id,'user_id':uid,'kind':kind,'file_name':Path(name).name,'path':path,'description':r.get('Description')}
   if r.get(date):values['created_at']=r[date]
   sql.append(f'insert into public.health_records ({",".join(values)}) values ({",".join(map(literal,values.values()))}) on conflict(id) do nothing;')
 ignored=set(tables)-set(TABLES)-{'user','patient_profiles','prescriptions','lab_reports'}
 if ignored:raise ValueError('Unmapped tables: '+', '.join(sorted(ignored))+'. Review and map these separately; do not silently discard them.')
 sql.append('commit;')
 return '\n'.join(sql)+'\n',files
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit(__doc__)
 source=json.loads(Path(sys.argv[1]).read_text());users=json.loads(Path(sys.argv[2]).read_text())
 sql,files=prepare(source,users)
 out=Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
 (out/'legacy-data.sql').write_text(sql)
 (out/'storage-manifest.json').write_text(json.dumps(files,indent=2)+'\n')
 print(f'Prepared SQL and {len(files)} Storage mappings. Review them before importing. No remote changes made.')
