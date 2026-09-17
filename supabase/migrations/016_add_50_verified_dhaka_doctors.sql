with verified_doctors (
  full_name, qualification, specialization, specialty_name,
  hospital_name, location, source_url
) as (
  values
    ('Dr. Ahmed Khaled','MBBS, PhD, MD','Lab Medicine','Pathologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-ahmed-khaled'),
    ('Dr. Anita Marium Islam','MBBS, FCPS (Internal Medicine), CCD','Internal Medicine','Medicine Specialist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-anita-marium-islam'),
    ('Dr. Arman Reza Chowdhury','MBBS, FCPS (Radiotherapy), UICC Fellow','Radiation Oncology','Oncologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-arman-reza-chowdhury'),
    ('Dr. Borhan Uddin Ahmad','MBBS (DMC), MRCP (UK), FRCPE','Internal Medicine','Medicine Specialist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-borhan-uddin-ahmad'),
    ('Dr. Farzana Islam','MBBS (DMC), Diploma in Child Health (DU), MCPS (BCPS)','Child Development Centre','Paediatrician','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-farzana-islam'),
    ('Dr. Iqbal Murshed Kabir','MBBS (DMC), FCPS (Medicine), MD (Gastroenterology), FRCP (Glasgow, UK)','Gastroenterology & Hepatology','Gastroenterologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-lqbal-murshed-kabir'),
    ('Maj Gen Prof. Dr. Md. Anisur Rahman Howlader','MBBS, MS (Orthopaedics)','Orthopaedics','Orthopaedic Surgeon','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/prof-dr-md-anisur-rahman-howlader'),
    ('Prof. Dr. Ebadur Rahman','MBBS, FRCP (Edinburgh), FRCP (Ireland), FASN (USA), MRCP (UK), DNeph (UK), Masters in Nephrology (UK)','Nephrology','Kidney Specialist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-ebadur-rahman'),
    ('Prof. Dr. Kazi Hasinur Rahman','BDS, MS (Prosthodontics)','Dental & Maxillofacial Surgery','Dentist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/prof-dr-kazi-hasinur-rahman'),
    ('Prof. Dr. Md. Masum Kamal Khan','MBBS (DMC), FCPS (Medicine), MD (Nephrology)','Nephrology','Kidney Specialist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/prof-dr-md-masum-kamal-khan'),
    ('Prof. Lt. Col. (Retd.) Dr. Q.M. Mahabub Ullah','MBBS, FRCP (Glasgow), DDV, MCPS, MD (Dermatology)','Dermatology & Venereology','Dermatologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/prof-lt-col-dr-qm-mahabub-ullah'),
    ('Dr. Md Rabiul Alam','MBBS, FCPS (Anaesthesia)','Anesthesia and Pain Medicine','Anaesthesiologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/md-rabiul-alam'),
    ('Dr. Moinul Hoque Chowdhury','MBBS, FCPS (Anaesthesia)','Anesthesia and Pain Medicine','Anaesthesiologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/moinul-hoque-chowdhury'),
    ('Dr. Nurun Naher','MBBS, FCPS (Paediatrics), MRCPCH (UK), Training in Pediatric Critical Care','Paediatric ICU','Paediatrician','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/Dr.%20Nurun%20Naher%20%7C%20Paediatric%20ICU%20Specialist%20%7C%20Evercare'),
    ('Dr. Saiful Islam Khan','MBBS, DA, MD (Anaesthesia)','Cardiothoracic Anaesthesia','Anaesthesiologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-saiful-islam-khan'),
    ('Prof. (Brig. Gen.) Dr. Mir Mahmud Hossain','MBBS, FCPS (Anaesthesia), FICA','Neuro Anesthesia & Neuro ICU','Anaesthesiologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/dr-mir-mahmud-hossain'),
    ('Prof. Brig Gen (Retd) Dr. Md Mahbub Noor','MBBS, FCPS (Anaesthesiology)','Critical Care Units','Anaesthesiologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/prof-brig-gen-dr-md-mahbub-noor'),
    ('Prof. Brig Gen (Retd) Dr. S. M. Mahbubul Alam','MBBS, MCPS (Clinical Pathology), FCPS (Histopathology)','Lab Medicine','Pathologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/prof-brig-gen-dr-s-m-mahbubul-alam'),
    ('Prof. Dr. Brig. Gen. (Retd.) Md. Saiful Islam','MBBS, FCPS (Radiology & Imaging)','Diagnostic & Interventional Radiology','Radiologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/prof-dr-brig-gen-md-saiful-islam'),
    ('Prof. Dr. Mohammed Fazlul Kabir','MBBS, Nuclear Medicine Fellow (IAEA, USA)','Nuclear Medicine','Radiologist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/prof-dr-mohammed-fazlul-kabir'),
    ('Professor Dr. Sheikh Mahbub-Us Sobhan','MBBS, MS, DO','Ophthalmology','Eye Specialist','Evercare Hospital Dhaka','Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh','https://www.evercarebd.com/en/dhaka/doctors/professor-dr-sheikh-mahbub-us-sobhan'),
    ('Dr. Lutfor Rahman','MBBS, MS (CTS)','Cardiac Surgery','Cardiac Surgeon','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.-lutfor-rahman'),
    ('Dr. A P M Sohrabuzzaman','MD, FCPS','Interventional Cardiology & Heart Rhythm Services','Cardiologist','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.-a-p-m-sohrabuzzaman'),
    ('Professor Dr. Baren Chakraborty','MBBS (Dhaka), MCPS (Medicine), FCPS (Medicine), FACC (USA), FRCP (Ireland), FRCP (Edinburgh), FRCP (Glasgow)','Cardiology','Cardiologist','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-dr.-baren-chakraborty'),
    ('Dr. Mahbubor Rahman','MBBS (Dhaka), MCPS (Medicine), MD (Cardiology), FACC (USA), FSCAI (USA), FRCP (UK)','Cardiology & Medicine','Cardiologist','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.-mahbubor-rahman'),
    ('Professor Dr. M Khademul Islam','MBBS, FCPS, FRCS (Glasgow), FACS, FICS','General & Laparoscopic Surgery','General Surgeon','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-dr.-m-khademul-islam'),
    ('Professor Dr. M. Amjad Hossain','MS (Orthopaedics), AO Fellow (Germany)','Orthopaedic Surgery','Orthopaedic Surgeon','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-dr.-m.-amjad-hossain'),
    ('Professor Dr. Md. Jahangir Kabir','MBBS, FCPS, FRCS','Urology, Andrology & Uro-Oncology','Urologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor.-dr.-md.-jahangir-kabir'),
    ('Professor (Dr.) Mariam Faruqui (Shati)','MBBS (DU), DGO (DU), MCPS (Gynae), MS (Gynae), FCPS (Gynae)','Gynaecology, Obstetrics & Infertility','Gynaecologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor-(dr.)-mariam-faruqui-(shati)'),
    ('Professor (Dr.) F. M. Siddiqui','MBBS, FCPS, FACP (USA), FRCP','Medicine & Chest Diseases','Chest Medicine Specialist','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor.-(dr.)-f.-m.-siddiqui'),
    ('Professor Dr. Ali Hossain','MBBS, FCPS (Medicine), MD (Chest)','Medicine & Pulmonology','Pulmonologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-dr.-ali-hossain'),
    ('Professor Dr. Muhammad Rafiqul Alam','MBBS, MD (Nephrology), FCPS (Medicine)','Internal Medicine & Kidney Disease','Kidney Specialist','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.-muhammad-rafiqul-alam'),
    ('Professor Dr. Salimur Rahman','MBBS (Dhaka), FCPS (Medicine), FRCP (Ireland), FRCP (Edinburgh)','Hepatology & Liver Medicine','Hepatologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.salimur-rahman'),
    ('Professor Dr. Md. Abdul Mannan','MBBS, FCPS, MD (Paediatrics), MD (Neonatology)','Neonatology & Paediatrics','Neonatologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-dr.-md.-abdul-mannan'),
    ('Prof. Sehereen F. Siddiqua','MBBS, FCPS','Gynaecology, Obstetrics & Laparoscopic Surgery','Gynaecologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-sehereen-f.-siddiqua'),
    ('Dr. Mohammad Moniruzzaman','MBBS (DU), MD (Nephrology)','Kidney Diseases, Diabetes & Medicine','Kidney Specialist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.mohammad-moniruzzaman'),
    ('Professor Dr. Abduz Zaher','MBBS, FCPS (Medicine), FACC (USA), FRCP','Clinical & Interventional Cardiology','Cardiologist','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-dr.-abduz-zaher'),
    ('Prof. Dr. Md. Saifullah','MBBS (DMC), FCPS (Surgery)','General, Laparoscopic, Colorectal & Cancer Surgery','Colorectal Surgeon','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-dr.-md.-saifullah'),
    ('Professor Dr. Abu Zaffar Chowdhury (Biru)','MBBS, MS (Orthopaedics)','Arthroscopy & Replacement Surgery','Orthopaedic Surgeon','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor.-dr.-abu-zaffar-chowdhury-(biru)'),
    ('Professor Dr. Md. Sayedul Islam','MBBS, DTCD, MD (Chest), FRCP (Glasgow)','Medicine, Asthma & Chest Diseases','Chest Medicine Specialist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor-dr.-md.-sayedul-islam'),
    ('Professor Dr. Sirajul Haque','MBBS, FCPS (Medicine), FACP (USA), FRCP (Edinburgh)','Neurology & Internal Medicine','Neurologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor-sirajul-haque'),
    ('Dr. Md. Lokman Hossain','MBBS, MS (Cardiovascular & Thoracic Surgery), FACS (USA)','Cardiac Surgery','Cardiac Surgeon','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.md.-lokman-hossain'),
    ('Professor (Dr.) Mian Mashhud Ahmad','MBBS, MD, PhD, FRCP (Edinburgh)','Gastroenterology & Liver Diseases','Gastroenterologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.mian-mashhud-ahmad'),
    ('Professor Dr. Shahadot Hossain Sheikh','FCPS, MRCS (Edinburgh), FRCS (Glasgow)','Advanced Laparoscopic Colorectal Surgery','Colorectal Surgeon','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor.-dr.-shahadot-hossain-sheikh'),
    ('Professor Dr. Md. Ashraf Ali','MBBS, FCPS (Medicine), MD (Neurology), FRCP (Edinburgh)','Medicine & Neurology','Neurologist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/prof.-dr.-md.-ashraf-ali'),
    ('Professor Dr. Samiran Kumar Saha','MBBS, PhD (Medicine), FACP, FRCP (Edinburgh)','Medicine','Medicine Specialist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor.-dr.-samiran-kumar-saha'),
    ('Dr. Nur Mohammad','MBBS, D-Card, MCPS, MD','Medicine & Cardiology','Cardiologist','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.-nur-mohammad-2'),
    ('Professor Dr. Moududul Haque','MBBS, MD, PhD (MS), Neurosurgery','Neurosurgery','Neurosurgeon','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/professor.-dr.-moududul-haque'),
    ('Dr. Arun Kumar Sharma','MBBS, MCPS (Medicine), MD (Cardiology), FACC (USA)','Clinical & Interventional Cardiology','Cardiologist','LABAID Cardiac Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.-arun-kumar-sharma'),
    ('Dr. A.S.M. Julfekar Helal','MBBS, MD (Nephrology)','Kidney, Medicine & Diabetes','Kidney Specialist','LABAID Specialized Hospital','House 01, Road 04, Dhanmondi, Dhaka 1205, Bangladesh','https://labaid.com.bd/en/doctor/dr.-a.s.m.-julfekar-helal')
)
insert into public.doctors (
  full_name, specialty_id, specialization, qualification,
  hospital_name, location, status, bio, source_url,
  verified_on, verification_status
)
select
  doctor.full_name,
  specialty.id,
  doctor.specialization,
  doctor.qualification,
  doctor.hospital_name,
  doctor.location,
  'Active',
  doctor.specialization || ' specialist at ' || doctor.hospital_name || '.',
  doctor.source_url,
  current_date,
  'Verified'
from verified_doctors doctor
join public.specialties specialty on specialty.name = doctor.specialty_name
where not exists (
  select 1
  from public.doctors existing
  where regexp_replace(lower(existing.full_name), '[^a-z0-9]+', '', 'g') =
        regexp_replace(lower(doctor.full_name), '[^a-z0-9]+', '', 'g')
     or existing.source_url = doctor.source_url
);
