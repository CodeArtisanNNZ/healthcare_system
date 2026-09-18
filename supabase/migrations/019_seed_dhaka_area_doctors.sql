-- Publicly sourced Dhaka doctor/chamber coverage.
-- Third-party directory records remain "Needs review" until independently verified.

with seed(full_name,registration_no,specialty_name,specialization,qualification,experience,hospital_name,source_url,verified_on,verification_status,district,status) as (
  values
('Asst. Prof. Dr. Kazi Md. Hannanur Rahman Jewel','A39616','Orthopaedic Surgeon','Orthopedist','MBBS, MS (Orthopedics), FCPS (Orthopedics)',11,'National Institute of Traumatology and Orthopaedic Rehabilitation','https://doctime.com.bd/doctors/asst-prof-dr-kazi-md-hannanur-rahman-jewel-72892','2026-09-18','Needs review','Dhaka','Active'),
('Asst. Prof. Dr. MD. GOLAM-UR-RAHAMAN SOHAIL','A50909','Medicine Specialist','Medicine Specialist','MBBS, BCS (Health), FCPS (Internal Medicine), CCD (Endocrinology)',10,'Shaheed Suhrawardy Medical College','https://doctime.com.bd/doctors/asst-prof-dr-md-golamurrahaman-sohail-400','2026-09-18','Needs review','Dhaka','Active'),
('Asst. Prof. Dr. Sharmin Begum',null,'Dermatologist','Skin, Sex, Hair, Nail & Allergy Specialist','MBBS, MCPS, FCPS (Dermatology)',null,'Bangladesh Medical University','https://dhakadocs.com/doctors/jatrabari/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. AKM Humayun Kabir',null,'Medicine Specialist','Medicine Specialist','MBBS (DMC), MCPS (Medicine), FCPS (Medicine)',null,'Dhaka Medical College & Hospital','https://dhakadocs.com/doctors/motijheel/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Asif Md. Sazzad-Uz Zumma','A-61850','Urologist','Urologist','MBBS, BCS (Health), MRCS, MS (Urology)',11,'National Institute of Cancer Research & Hospital','https://doctime.com.bd/doctors/dr-asif-md-sazzad-uz-zumma-17195458','2026-09-18','Needs review','Dhaka','Active'),
('Dr. ASM Sirajum Munir',null,'Medicine Specialist','Internal Medicine Specialist','MBBS, BCS (Health), FCPS (Medicine), MRCP (UK), FRCP (Edin), FRCP (Glasgow)',null,'Mugda Medical College & Hospital','https://dhakadocs.com/doctors/malibagh/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Debashis Roy',null,'Medicine Specialist','Internal Medicine Specialist','MBBS (Dhaka), BCS (Health), FCPS (Medicine), MRCP (UK), MACP (USA)',null,'Mugda Medical College & Hospital','https://dhakadocs.com/doctors/banani/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Farhana Akter','A73335','Gynaecologist','Gynecologist & Obstetrician','MBBS, MCPS (Obstetrics), FCPS (Gynae & Obs)',5,'Azimpur Maternity Hospital, Dhaka','https://doctime.com.bd/doctors/dr-farhana-akter-499465','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Farjana Akhter',null,'Dermatologist','Skin & Sexual Medicine Specialist','MBBS, DDV',null,'Bangladesh Specialized Hospital','https://dhakadocs.com/doctors/shyamoli/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Jyoti Vaskar Saha',null,'Kidney Specialist','Clinical & Interventional Nephrologist','MBBS (Dhaka), BCS (Health), MD (Nephrology), MACP (USA), CCD (BIRDEM)',null,'Shaheed Suhrawardy Medical College & Hospital','https://dhakadocs.com/doctors/wari/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Khandaker Alamin Rumi',null,'Medicine Specialist','Medicine & Critical Care Medicine Specialist','MBBS, MRCP (UK), MD (Critical Care Medicine - BSMMU)',null,'City Hospital Limited, Dhaka','https://dhakadocs.com/doctors/mohammadpur/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. M. Wahiduzzaman',null,'Medicine Specialist','Medicine & Diabetes Specialist','MBBS (Dhaka), MRCP (UK), FCPS (Medicine)',null,'BIRDEM General Hospital & Ibrahim Medical College','https://dhakadocs.com/doctors/banasree/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Md. Ferdous Hasan',null,'Medicine Specialist','Medicine, Diabetes & Hormonal Diseases Specialist','MBBS (DU), MPH, CCD (BIRDEM), Diploma in Family Medicine, CTM (DU), FRSH (London)',null,'Medinova Medical Services, Malibagh','https://dhakadocs.com/doctors/malibagh/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Mohammad Tanvir Islam',null,'Medicine Specialist','Medicine (All Diseases of Adults) Specialist','MBBS, FCPS (Medicine)',null,'Bangladesh Medical University','https://dhakadocs.com/doctors/shantinagar/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Sadia Sajmin Siddiqua',null,'General Surgeon','General, Colorectal, Laparoscopic & Breast Surgeon','MBBS (DMC), FCPS (Surgery)',null,'Sarkari Karmachari Hospital','https://dhakadocs.com/doctors/khilgaon/general-surgeon/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Sharmin Sultana (Setu)',null,'Chest Medicine Specialist','Medicine, Diabetes & Chest Medicine Specialist','MBBS, FCPS (Medicine), FCPS (Pulmonology), MACP (USA), CCEBDM (India), CCD (BIRDEM)',null,'National Institute of Diseases of the Chest & Hospital','https://dhakadocs.com/doctors/motijheel/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. SM Sadlee',null,'Neurologist','General & Neuromedicine Specialist','MBBS, MRCP (UK)',null,'United Hospital Ltd, Dhaka','https://dhakadocs.com/doctors/gulshan/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Tahera K. Kona',null,'Medicine Specialist','Medicine Specialist','MBBS, FCPS (Medicine), CCD (BIRDEM)',null,'Kurmitola General Hospital, Dhaka','https://dhakadocs.com/doctors/banani/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Dr. Yesmin Akhter (Rakhey)',null,'Medicine Specialist','Medicine Specialist','MBBS, BCS (Health), FCPS (Medicine), MRCP (UK), CCD (BIRDEM), MACP (USA)',null,'Kurmitola General Hospital, Dhaka','https://dhakadocs.com/doctors/mirpur/medicine-specialist/','2026-09-18','Needs review','Dhaka','Active'),
('Prof. Dr. Munira Ferdausi',null,'Gynaecologist','Gynecology, Obstetrics Specialist & Surgeon','MBBS, MPH (Epidemiology), MS (Obs & Gynae), FACS (USA)',null,'Shaheed Suhrawardy Medical College & Hospital','https://dhakadocs.com/doctors/uttara/surgeon/','2026-09-18','Needs review','Dhaka','Active'),
('Prof. Dr. Puravi Rani Dev Nath',null,'Eye Specialist','Ophthalmologist & Surgeon','MBBS, MS (Ophthalmology)',null,'BIRDEM General Hospital & Ibrahim Medical College','https://dhakadocs.com/doctors/shahbag/surgeon/','2026-09-18','Needs review','Dhaka','Active'),
('Prof. Dr. S. M. Mahbub Alam',null,'Urologist','Urologist & Surgeon','MBBS, FCPS (Surgery), MS (Urology)',null,'Dhaka Medical College & Hospital','https://dhakadocs.com/doctors/panthapath/surgeon/','2026-09-18','Needs review','Dhaka','Active')
)
insert into public.doctors(
  full_name,registration_no,specialty_id,specialization,qualification,experience,
  hospital_name,source_url,verified_on,verification_status,district,status
)
select s.full_name,s.registration_no,sp.id,s.specialization,s.qualification,s.experience,
       s.hospital_name,s.source_url,s.verified_on::date,s.verification_status,s.district,s.status
from seed s
left join public.specialties sp on lower(sp.name)=lower(s.specialty_name)
where not exists (
  select 1 from public.doctors d
  where lower(trim(d.full_name))=lower(trim(s.full_name))
     or (s.registration_no is not null and lower(coalesce(d.registration_no,''))=lower(s.registration_no))
);

with loc(full_name,chamber_name,address,area,district,available_days,available_time,consultation_fee,source_url,verified_on,verification_status,is_primary) as (
  values
('Asst. Prof. Dr. Kazi Md. Hannanur Rahman Jewel','Ibn Sina Diagnostic & Consultation Center, Badda','House Cha-72/1, Progoti Sharani, North Badda, Dhaka-1212','Badda','Dhaka','Everyday','6:00 PM – 10:00 PM',null,'https://doctime.com.bd/doctors/asst-prof-dr-kazi-md-hannanur-rahman-jewel-72892','2026-09-18','Needs review',true),
('Asst. Prof. Dr. Kazi Md. Hannanur Rahman Jewel','Farazy Hospital Ltd. Natun Bazar Branch','Madani Avenue, 100 Feet Road, Baridhara, Natun Bazar, Dhaka-1212','Baridhara','Dhaka','Sat, Tue & Thu','4:00 PM – 6:00 PM',null,'https://doctime.com.bd/doctors/asst-prof-dr-kazi-md-hannanur-rahman-jewel-72892','2026-09-18','Needs review',true),
('Asst. Prof. Dr. MD. GOLAM-UR-RAHAMAN SOHAIL','Better Life Hospital','DIT Road, Rampura, Dhaka','Rampura','Dhaka','Sat – Thu','5:00 PM – 9:00 PM',null,'https://doctime.com.bd/doctors/asst-prof-dr-md-golamurrahaman-sohail-400','2026-09-18','Needs review',true),
('Asst. Prof. Dr. Sharmin Begum',null,'Jatrabari, Dhaka','Jatrabari','Dhaka',null,null,null,'https://dhakadocs.com/doctors/jatrabari/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. AKM Humayun Kabir','Popular Diagnostic Center, Shantinagar','Unit # 01, House # 11, Shantinagar, Motijheel, Dhaka','Motijheel','Dhaka','Sun, Tue, Thu & Fri','6:00 PM – 9:00 PM',null,'https://dhakadocs.com/doctors/motijheel/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Asif Md. Sazzad-Uz Zumma','National Institute of Cancer Research & Hospital','Mohakhali, Dhaka','Mohakhali','Dhaka','Sat – Thu','3:15 PM – 8:30 PM',null,'https://doctime.com.bd/doctors/dr-asif-md-sazzad-uz-zumma-17195458','2026-09-18','Needs review',true),
('Dr. ASM Sirajum Munir','Padma Diagnostic Center, Malibagh','Malibagh, Dhaka','Malibagh','Dhaka','Sun – Wed','6:00 PM – 9:00 PM',null,'https://dhakadocs.com/doctors/malibagh/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Debashis Roy','York Hospital Ltd. Banani','House # 12 & 13, Road # 22, Block # K, Banani, Dhaka-1213','Banani','Dhaka','Sat – Thu','6:00 PM – 9:00 PM',null,'https://dhakadocs.com/doctors/banani/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Farhana Akter','Azimpur Maternity Hospital, Dhaka','Azimpur, Dhaka','Azimpur','Dhaka','Everyday','10:00 AM – 11:55 PM',null,'https://doctime.com.bd/doctors/dr-farhana-akter-499465','2026-09-18','Needs review',true),
('Dr. Farjana Akhter','Bangladesh Specialized Hospital','21, Mirpur Road, Shyamoli, Dhaka-1207','Shyamoli','Dhaka',null,null,null,'https://dhakadocs.com/doctors/shyamoli/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Jyoti Vaskar Saha',null,'Wari, Dhaka','Wari','Dhaka','Sun, Tue & Thu','6:00 PM – 7:30 PM',null,'https://dhakadocs.com/doctors/wari/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Khandaker Alamin Rumi','City Hospital Limited, Dhaka','1/8, Block-E, Lalmatia, Satmosjid Road, Mohammadpur, Dhaka-1207','Mohammadpur','Dhaka','Sat – Thu','6:30 PM – 9:00 PM',null,'https://dhakadocs.com/doctors/mohammadpur/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. M. Wahiduzzaman','Advance Hospital, Banasree','House # 1, Main Road, Block # F, Banasree, Dhaka','Banasree','Dhaka','Sat – Thu','6:00 PM – 10:00 PM',null,'https://dhakadocs.com/doctors/banasree/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Md. Ferdous Hasan','Medinova Medical Services, Malibagh','Gemcon Business Tower, 255 New Circular Road, Malibagh, Dhaka','Malibagh','Dhaka','Sat – Thu','7:30 PM – 9:00 PM',null,'https://dhakadocs.com/doctors/malibagh/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Mohammad Tanvir Islam','Popular Diagnostic Center, Shantinagar','Unit # 01, House # 11, Shantinagar, Motijheel, Dhaka','Shantinagar','Dhaka','Sat – Thu','5:30 PM – 8:00 PM',null,'https://dhakadocs.com/doctors/shantinagar/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Sadia Sajmin Siddiqua','Khidmah Hospital, Dhaka','C-287/2-3 Khilgaon Bishwa Road, Khilgaon, Dhaka','Khilgaon','Dhaka','Sat – Mon','4:00 PM – 7:00 PM',null,'https://dhakadocs.com/doctors/khilgaon/general-surgeon/','2026-09-18','Needs review',true),
('Dr. Sharmin Sultana (Setu)','Islami Bank Hospital, Motijheel','24/B, Outer Circular Road, Shahjahanpur, Motijheel, Dhaka','Motijheel','Dhaka','Sat, Mon & Wed','7:00 PM – 9:00 PM',null,'https://dhakadocs.com/doctors/motijheel/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Sharmin Sultana (Setu)','Safe Physiotherapy & Health Care','Sabujbon Nur Tower, Shahar Khilgaon, East Rampura, Dhaka','Rampura','Dhaka','Sun, Tue & Thu','5:30 PM – 7:30 PM',null,'https://dhakadocs.com/doctors/motijheel/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. SM Sadlee','United Hospital Ltd, Dhaka','Gulshan, Dhaka','Gulshan','Dhaka',null,null,null,'https://dhakadocs.com/doctors/gulshan/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Tahera K. Kona','Banani Clinic Limited','House # 116, Road # 15, Block-C, Banani, Dhaka','Banani','Dhaka','Sat – Thu','5:00 PM – 7:00 PM',null,'https://dhakadocs.com/doctors/banani/medicine-specialist/','2026-09-18','Needs review',true),
('Dr. Yesmin Akhter (Rakhey)','Aalok Healthcare & Hospital, Mirpur 10','House # 1 & 3, Road # 2, Block # B, Mirpur 10, Dhaka','Mirpur','Dhaka','Everyday','6:00 PM – 9:00 PM; Fri 9:00 AM – 1:00 PM',null,'https://dhakadocs.com/doctors/mirpur/medicine-specialist/','2026-09-18','Needs review',true),
('Prof. Dr. Munira Ferdausi','Labaid Diagnostic, Uttara','Uttara, Dhaka','Uttara','Dhaka',null,'Evening',null,'https://dhakadocs.com/doctors/uttara/surgeon/','2026-09-18','Needs review',true),
('Prof. Dr. Puravi Rani Dev Nath','BIRDEM Specialized Chamber Complex','Shahbag, Dhaka','Shahbag','Dhaka',null,null,null,'https://dhakadocs.com/doctors/shahbag/surgeon/','2026-09-18','Needs review',true),
('Prof. Dr. S. M. Mahbub Alam','BRB Hospital, Dhaka','Panthapath, Dhaka','Panthapath','Dhaka',null,null,null,'https://dhakadocs.com/doctors/panthapath/surgeon/','2026-09-18','Needs review',true)
)
insert into public.doctor_locations(
  doctor_id,chamber_name,address,area,district,available_days,available_time,
  consultation_fee,source_url,verified_on,verification_status,is_primary
)
select d.id,l.chamber_name,l.address,l.area,l.district,l.available_days,l.available_time,
       l.consultation_fee,l.source_url,l.verified_on::date,l.verification_status,l.is_primary
from loc l
join public.doctors d on lower(trim(d.full_name))=lower(trim(l.full_name))
where not exists (
  select 1 from public.doctor_locations x
  where x.doctor_id=d.id
    and lower(x.area)=lower(l.area)
    and coalesce(lower(x.chamber_name),'')=coalesce(lower(l.chamber_name),'')
);
