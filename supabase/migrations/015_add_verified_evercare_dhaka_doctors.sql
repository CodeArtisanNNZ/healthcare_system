with verified_doctors (
  full_name,
  qualification,
  specialization,
  specialty_name,
  source_url,
  bio
) as (
  values
    (
      'Dr. A.Q.M. Reza',
      'MBBS, MD (Card), FACC (USA), FRCP (Glasgow)',
      'Cardiology Care Centre',
      'Cardiologist',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-aqm-reza',
      'Senior Consultant & Coordinator at Evercare Hospital Dhaka.'
    ),
    (
      'Prof. Dr. Md. Abdul Karim (Mithu)',
      'MBBS, BCS (Health), DLO, FCPS (ENT), FACS; Advanced Clinical Fellow in Head & Neck Surgical Oncology',
      'Thyroid and Head-Neck Oncosurgery',
      'ENT Specialist',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-md-abdul-karim-mithu',
      'Senior Consultant in thyroid and head-neck oncosurgery at Evercare Hospital Dhaka.'
    ),
    (
      'Dr. Abu Jafar Mohammed Saleh',
      'MBBS, FCPS (Hematology)',
      'Hematology & Stem Cell Transplant',
      'Haematologist',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-abu-jafar-mohammed-saleh',
      'Senior Consultant & Coordinator and BMT Program Head at Evercare Hospital Dhaka.'
    ),
    (
      'Prof. Dr. Anwar Israil',
      'MBBS, MD (Neurology)',
      'Neurology',
      'Neurologist',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-anwar-israil',
      'Senior Consultant in neurology at Evercare Hospital Dhaka.'
    ),
    (
      'Dr. Biswajit Bhattacharjee',
      'MBBS, MPhil (Radiotherapy); Clinical Fellow (Oncology), AIMS, India',
      'Radiation Oncology',
      'Oncologist',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-biswajit-bhattacharjee',
      'Senior Consultant & Coordinator in radiation oncology at Evercare Hospital Dhaka.'
    ),
    (
      'Dr. Biva Shrestha Khan',
      'MBBS, MD (Radiology & Imaging)',
      'Diagnostic & Interventional Radiology',
      'Radiologist',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-biva-shrestha-khan',
      'Senior Consultant in diagnostic and interventional radiology at Evercare Hospital Dhaka.'
    ),
    (
      'Professor Dr. Md. Ezharul Haque',
      'MBBS, MS (Surgery)',
      'General & Laparoscopic Surgery',
      'General Surgeon',
      'https://www.evercarebd.com/en/dhaka/doctors/prof-dr-md-ezharul-haque',
      'Senior Consultant in general and laparoscopic surgery at Evercare Hospital Dhaka.'
    ),
    (
      'Dr. Fahmida Begum',
      'MBBS, MD (Nephrology), Advanced Training in Nephrology (Singapore)',
      'Nephrology',
      'Kidney Specialist',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-fahmida-begum',
      'Senior Consultant in nephrology at Evercare Hospital Dhaka.'
    ),
    (
      'Dr. Fahmida Ferdousi',
      'BDS, MS (OMFS)',
      'Dental & Maxillofacial Surgery',
      'Maxillofacial Surgeon',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-fahmida-ferdousi',
      'Associate Consultant in dental and maxillofacial surgery at Evercare Hospital Dhaka.'
    ),
    (
      'Dr. Ferdous Shahriar Sayed',
      'MBBS, MD (Radiotherapy)',
      'Medical Oncology',
      'Oncologist',
      'https://www.evercarebd.com/en/dhaka/doctors/dr-ferdous-shahriar-sayed',
      'Senior Consultant & Coordinator in medical oncology at Evercare Hospital Dhaka.'
    ),
    (
      'Assoc. Prof. Dr. Mohammad Farid Hossain',
      'MBBS (India), MS (PGIMER, India)',
      'General & Laparoscopic Surgery',
      'General Surgeon',
      'https://www.evercarebd.com/en/dhaka/doctors/assoc-prof-dr-mohammad-farid-hossain',
      'Senior Consultant in general and laparoscopic surgery at Evercare Hospital Dhaka.'
    )
)
insert into public.doctors (
  full_name,
  specialty_id,
  specialization,
  qualification,
  hospital_name,
  location,
  status,
  bio,
  source_url,
  verified_on,
  verification_status
)
select
  verified.full_name,
  specialties.id,
  verified.specialization,
  verified.qualification,
  'Evercare Hospital Dhaka',
  'Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh',
  'Active',
  verified.bio,
  verified.source_url,
  current_date,
  'Verified'
from verified_doctors verified
join public.specialties specialties on specialties.name = verified.specialty_name
where not exists (
  select 1
  from public.doctors existing
  where regexp_replace(lower(existing.full_name), '[^a-z0-9]+', '', 'g') =
        regexp_replace(lower(verified.full_name), '[^a-z0-9]+', '', 'g')
     or existing.source_url = verified.source_url
);

update public.doctors
set qualification = 'MBBS (India), MS (PGIMER, India)',
    specialization = 'General & Laparoscopic Surgery',
    specialty_id = (select id from public.specialties where name = 'General Surgeon' limit 1),
    hospital_name = 'Evercare Hospital Dhaka',
    location = 'Plot # 81, Block-E, Bashundhara R/A, Dhaka 1229, Bangladesh',
    bio = 'Senior Consultant in general and laparoscopic surgery at Evercare Hospital Dhaka.',
    source_url = 'https://www.evercarebd.com/en/dhaka/doctors/assoc-prof-dr-mohammad-farid-hossain',
    verified_on = current_date,
    verification_status = 'Verified'
where regexp_replace(lower(full_name), '[^a-z0-9]+', '', 'g') =
      regexp_replace(lower('Assoc. Prof. Dr. Mohammad Farid Hossain'), '[^a-z0-9]+', '', 'g');
