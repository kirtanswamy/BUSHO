-- BUSHO operational security foundation.
-- Additive migration: preserves legacy tables and legacy status values.
-- No facility register, worker account, patient record, or purchase order is seeded here.

begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- PMBJK district-wise snapshot totals 352 as of 2026-02-28; a separate state aggregate is 371 as of 2026-06-30.
-- ---------------------------------------------------------------------------
-- 1. Administrative reference data: LGD geography and separate PMBJK snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.states (
  lgd_code text primary key,
  name text not null,
  source_authority text not null,
  source_date text not null,
  source_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.districts (
  lgd_code text primary key,
  state_lgd_code text not null references public.states(lgd_code),
  name text not null,
  source_date text not null,
  source_authority text not null,
  source_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  lgd_code text primary key,
  state_lgd_code text not null references public.states(lgd_code),
  district_lgd_code text references public.districts(lgd_code),
  name text not null,
  name_local text,
  mapping_review_required boolean not null default false,
  is_selectable boolean not null default true,
  source_date text not null,
  created_at timestamptz not null default now(),
  constraint blocks_review_not_selectable check (not mapping_review_required or not is_selectable)
);

create table if not exists public.block_mapping_candidates (
  block_lgd_code text not null references public.blocks(lgd_code) on delete cascade,
  district_lgd_code text not null references public.districts(lgd_code),
  source_date text not null,
  created_at timestamptz not null default now(),
  primary key (block_lgd_code, district_lgd_code)
);

insert into public.states (lgd_code, name, source_authority, source_date, source_url)
values ('22', 'Chhattisgarh', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', '21Oct2026', 'https://lgdirectory.gov.in/')
on conflict (lgd_code) do update
set name = excluded.name, source_authority = excluded.source_authority,
    source_date = excluded.source_date, source_url = excluded.source_url;

insert into public.districts
  (lgd_code, state_lgd_code, name, source_date, source_authority, source_url)
values
('646', '22', 'Balod', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('644', '22', 'Balodabazar-Bhatapara', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('649', '22', 'Balrampur-Ramanujganj', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('374', '22', 'Bastar', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('650', '22', 'Bemetara', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('636', '22', 'Bijapur', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('375', '22', 'Bilaspur', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('376', '22', 'Dakshin Bastar Dantewada', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('377', '22', 'Dhamtari', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('378', '22', 'Durg', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('645', '22', 'Gariyaband', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('734', '22', 'Gaurela-Pendra-Marwahi', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('379', '22', 'Janjgir-Champa', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('380', '22', 'Jashpur', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('382', '22', 'Kabeerdham', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('759', '22', 'Khairagarh-Chhuikhadan-Gandai', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('643', '22', 'Kondagaon', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('383', '22', 'Korba', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('384', '22', 'Korea', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('385', '22', 'Mahasamund', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('760', '22', 'Manendragarh-Chirmiri-Bharatpur(M C B)', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('761', '22', 'Mohla-Manpur-Ambagarh Chouki', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('647', '22', 'Mungeli', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('637', '22', 'Narayanpur', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('386', '22', 'Raigarh', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('387', '22', 'Raipur', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('388', '22', 'Rajnandgaon', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('762', '22', 'Sakti', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('763', '22', 'Sarangarh-Bilaigarh', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('642', '22', 'Sukma', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('648', '22', 'Surajpur', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('389', '22', 'Surguja', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/'),
('381', '22', 'Uttar Bastar Kanker', '21Oct2026', 'Ministry of Panchayati Raj — Local Government Directory (LGD)', 'https://lgdirectory.gov.in/')
on conflict (lgd_code) do update
set state_lgd_code = excluded.state_lgd_code, name = excluded.name,
    source_date = excluded.source_date, source_authority = excluded.source_authority,
    source_url = excluded.source_url;

insert into public.blocks
  (lgd_code, state_lgd_code, district_lgd_code, name, name_local,
   mapping_review_required, is_selectable, source_date)
values
('3708', '22', '761', 'A.Chowki (Td)', 'अ.चौकी(तद)', false, true, '21Oct2026'),
('3693', '22', '387', 'Abhanpur', 'अभनपुर', false, true, '21Oct2026'),
('3641', '22', '379', 'Akaltara', 'अकलतरा', false, true, '21Oct2026'),
('3717', '22', '389', 'Ambikapur', 'अंबिकापुर', false, true, '21Oct2026'),
('3658', '22', '381', 'Antagarh', 'अंतागढ़', false, true, '21Oct2026'),
('3694', '22', '387', 'Arang', 'आरंग', false, true, '21Oct2026'),
('3590', '22', '643', 'Baderajpur', 'बदेराजपुर', false, true, '21Oct2026'),
('3679', '22', '385', 'Bagbahara', 'बागबाहरा', false, true, '21Oct2026'),
('3650', '22', '380', 'Bagicha', 'बागीचा', false, true, '21Oct2026'),
('7144', '22', '384', 'Baikunthpur', 'बैकुंठपुर', false, true, '21Oct2026'),
('3591', '22', '374', 'Bakawand', 'बकावंड', false, true, '21Oct2026'),
('3629', '22', '646', 'Balod', 'बालोद', false, true, '21Oct2026'),
('3643', '22', '379', 'Baloda', 'बलोदा', false, true, '21Oct2026'),
('3695', '22', '644', 'Baloda Bazar', 'बलोदा बाज़ार', false, true, '21Oct2026'),
('3718', '22', '649', 'Balrampur', 'बलरामपुर', false, true, '21Oct2026'),
('3642', '22', '379', 'Bamhindih', 'बम्हनीडीह', false, true, '21Oct2026'),
('3684', '22', '763', 'Baramkela', 'बरमकेला', false, true, '21Oct2026'),
('3680', '22', '385', 'Basna', 'बसना', false, true, '21Oct2026'),
('3592', '22', '374', 'Bastanar', 'बस्तानर', false, true, '21Oct2026'),
('3593', '22', '374', 'Bastar', 'बस्तर', false, true, '21Oct2026'),
('3719', '22', '389', 'Batauli', 'बतौली', false, true, '21Oct2026'),
('3604', '22', '375', 'Belha', 'बेल्हा', false, true, '21Oct2026'),
('3630', '22', '650', 'Bemetara', 'बेमेतरा', false, true, '21Oct2026'),
('3631', '22', '650', 'Berla', 'बेरला', false, true, '21Oct2026'),
('3614', '22', '636', 'Bhairamgarh', 'भैरमगढ़', false, true, '21Oct2026'),
('3720', '22', '648', 'Bhaiyathan', 'भैयाथान', false, true, '21Oct2026'),
('3659', '22', '381', 'Bhanupratappur', 'भानुप्रतापपुर', false, true, '21Oct2026'),
('3675', '22', '760', 'Bharatpur', 'भरतपुर', false, true, '21Oct2026'),
('3696', '22', '644', 'Bhatapara', 'भाटापारा', false, true, '21Oct2026'),
('3615', '22', '636', 'Bhopal Patnam', 'भोपाल पटनम', false, true, '21Oct2026'),
('3616', '22', '636', 'Bijapur', 'बीजापुर', false, true, '21Oct2026'),
('3697', '22', '763', 'Bilaigarh', 'बिलाईगढ़', false, true, '21Oct2026'),
('3665', '22', '382', 'Bodla', 'बोडला', false, true, '21Oct2026'),
('3660', '22', '381', 'Charama', 'चारामा', false, true, '21Oct2026'),
('3617', '22', '642', 'Chhindgarh', 'छिन्द्गढ़', false, true, '21Oct2026'),
('3709', '22', '759', 'Chhuikhadan', 'छुईखदान', false, true, '21Oct2026'),
('3710', '22', '388', 'Chhuriya', 'छुरिया', false, true, '21Oct2026'),
('3698', '22', '645', 'Chhurra', 'छुरा', false, true, '21Oct2026'),
('3644', '22', '762', 'Dabhara', 'डभरा', false, true, '21Oct2026'),
('3618', '22', '376', 'Dantewada', 'दंतेवाडा', false, true, '21Oct2026'),
('3594', '22', '374', 'Darbha', 'दरभा', false, true, '21Oct2026'),
('3699', '22', '645', 'Deobhog', 'देवभोग', false, true, '21Oct2026'),
('3632', '22', '378', 'Dhamdha', 'धमधा', false, true, '21Oct2026'),
('3625', '22', '377', 'Dhamtari', 'धमतरी', false, true, '21Oct2026'),
('3685', '22', '386', 'Dharamjaigarh', 'धरमजैगढ़', false, true, '21Oct2026'),
('3700', '22', '387', 'Dharsiwa', 'धरसीवा', false, true, '21Oct2026'),
('3633', '22', '646', 'Dondi', 'डोंडी', false, true, '21Oct2026'),
('3634', '22', '646', 'Dondilohara', 'डोंडीलोहरा', false, true, '21Oct2026'),
('3711', '22', '388', 'Dongargaon', 'डोंगरगांव', false, true, '21Oct2026'),
('3712', '22', '388', 'Dongarghar', 'दोंगढ़ार', false, true, '21Oct2026'),
('3651', '22', '380', 'Duldula', 'दुलदुला', false, true, '21Oct2026'),
('3635', '22', '378', 'Durg', 'दुर्ग', false, true, '21Oct2026'),
('3661', '22', '381', 'Durgukondal', 'दुर्गुकोंदल', false, true, '21Oct2026'),
('3701', '22', '645', 'Fingeshwar', 'फिंगेश्वर', false, true, '21Oct2026'),
('3702', '22', '645', 'Gariyaband', 'गरियाबंद', false, true, '21Oct2026'),
('3605', '22', '734', 'Gaurella-1', 'गौरेल्ला-1', false, true, '21Oct2026'),
('3606', '22', '734', 'Gaurella-2', 'गौरेल्ला-2', false, true, '21Oct2026'),
('3619', '22', '376', 'Geedam', 'गीदम', false, true, '21Oct2026'),
('3686', '22', '386', 'Gharghoda', 'घरघोड़ा', false, true, '21Oct2026'),
('3636', '22', '646', 'Gunderdehi', 'गुन्दरदेही', false, true, '21Oct2026'),
('3637', '22', '646', 'Gurur', 'गुरुर', false, true, '21Oct2026'),
('3595', '22', '374', 'Jagdalpur', 'जगदलपुर', false, true, '21Oct2026'),
('3645', '22', '762', 'Jaijaipur', 'जैजैपुर', false, true, '21Oct2026'),
('3652', '22', '380', 'Jashpur', 'जशपुर', false, true, '21Oct2026'),
('3662', '22', '381', 'Kanker', 'कांकेर', false, true, '21Oct2026'),
('3653', '22', '380', 'Kansabel', 'कांसाबेल', false, true, '21Oct2026'),
('3669', '22', '383', 'Kartala', 'करतला', false, true, '21Oct2026'),
('3703', '22', '644', 'Kasdol', 'कसडोल', false, true, '21Oct2026'),
('3620', '22', '376', 'Katekalyan', 'कटेकल्याण', false, true, '21Oct2026'),
('3670', '22', '383', 'Katghora', 'कटघोरा', false, true, '21Oct2026'),
('3666', '22', '382', 'Kawardha', 'कवर्धा', false, true, '21Oct2026'),
('3596', '22', '643', 'Keshkal', 'केशकाल', false, true, '21Oct2026'),
('3676', '22', NULL, 'Khadgawana', 'खडगवां', true, false, '21Oct2026'),
('3713', '22', '759', 'Khairagarh', 'खैरागढ़', false, true, '21Oct2026'),
('3687', '22', '386', 'Kharsia', 'खरसिया', false, true, '21Oct2026'),
('3663', '22', '381', 'Koilebeda', 'कोइलबेड़ा', false, true, '21Oct2026'),
('3597', '22', '643', 'Kondagaon', 'कोंडागांव', false, true, '21Oct2026'),
('3621', '22', '642', 'Konta', 'कोंटा', false, true, '21Oct2026'),
('3671', '22', '383', 'Korba', 'कोरबा', false, true, '21Oct2026'),
('3607', '22', '375', 'Kota', 'कोटा', false, true, '21Oct2026'),
('3654', '22', '380', 'Kunkuri', 'कुनकुरी', false, true, '21Oct2026'),
('3626', '22', '377', 'Kurud', 'कुरूद', false, true, '21Oct2026'),
('3721', '22', '649', 'Kusmi', 'कुसमी', false, true, '21Oct2026'),
('3622', '22', '376', 'Kuwakonda', 'कुवाकोंडा', false, true, '21Oct2026'),
('3688', '22', '386', 'Lailunga', 'लैलूंगा', false, true, '21Oct2026'),
('3722', '22', '389', 'Lakhanpur', 'लखनपुर', false, true, '21Oct2026'),
('3598', '22', '374', 'Lohandiguda', 'लोहान्दिगुदा', false, true, '21Oct2026'),
('3608', '22', '647', 'Lormi', 'लोरमी', false, true, '21Oct2026'),
('3723', '22', '389', 'Lundra', 'लुन्द्रा', false, true, '21Oct2026'),
('3627', '22', '377', 'Magarlod', 'मगरलोड', false, true, '21Oct2026'),
('3681', '22', '385', 'Mahasamund', 'महासमुंद', false, true, '21Oct2026'),
('3724', '22', '389', 'Mainpat', 'मैनपाट', false, true, '21Oct2026'),
('3704', '22', '645', 'Mainpur', 'मैनपुर', false, true, '21Oct2026'),
('3599', '22', '643', 'Makdi', 'माकडी', false, true, '21Oct2026'),
('3646', '22', '762', 'Malkharoda', 'मालखरोदा', false, true, '21Oct2026'),
('3677', '22', '760', 'Manendragarh', 'मनेन्द्रगढ़', false, true, '21Oct2026'),
('3655', '22', '380', 'Manora', 'मनोरा', false, true, '21Oct2026'),
('3714', '22', '761', 'Manpur (Td)', 'मानपुर(तद)', false, true, '21Oct2026'),
('3609', '22', '734', 'Marwahi', 'मरवाही', false, true, '21Oct2026'),
('3610', '22', '375', 'Masturi', 'मस्तुरी', false, true, '21Oct2026'),
('3715', '22', '761', 'Mohala (Td)', 'मोहला (तद)', false, true, '21Oct2026'),
('3611', '22', '647', 'Mungeli', 'मुंगेली', false, true, '21Oct2026'),
('3628', '22', '377', 'Nagari', 'नगरी', false, true, '21Oct2026'),
('3600', '22', '637', 'Narayanpur', 'नारायणपुर', false, true, '21Oct2026'),
('3664', '22', '381', 'Narharpur', 'नरहरपुर', false, true, '21Oct2026'),
('3638', '22', '650', 'Nawagarh', 'नवागढ़', false, true, '21Oct2026'),
('3647', '22', '379', 'Nawagarh', 'नवागढ़', false, true, '21Oct2026'),
('3725', '22', '648', 'Odagi', 'ओडागी', false, true, '21Oct2026'),
('3601', '22', '637', 'Orchha(Abhujmad)', 'ओरछा', false, true, '21Oct2026'),
('3705', '22', '644', 'Palari', 'पलारी', false, true, '21Oct2026'),
('3672', '22', '383', 'Pali', 'पाली', false, true, '21Oct2026'),
('3648', '22', '379', 'Pamgarh', 'पामगढ़', false, true, '21Oct2026'),
('3667', '22', '382', 'Pandariya', 'पंडरिया', false, true, '21Oct2026'),
('3639', '22', '378', 'Patan', 'पाटन', false, true, '21Oct2026'),
('3612', '22', '647', 'Pathariya', 'पथरिया', false, true, '21Oct2026'),
('3656', '22', '380', 'Patthalgaon', 'पत्थलगांव', false, true, '21Oct2026'),
('3602', '22', '643', 'Pharasgaon', 'फरसगांव', false, true, '21Oct2026'),
('3657', '22', '380', 'Pharsabahar', 'फरसाबहार', false, true, '21Oct2026'),
('3682', '22', '385', 'Pithora', 'पिथोरा', false, true, '21Oct2026'),
('3673', '22', '383', 'Podi Uparoda', 'पोड़ी उपरोड़ा', false, true, '21Oct2026'),
('3726', '22', '648', 'Pratappur', 'प्रतापपुर', false, true, '21Oct2026'),
('3727', '22', '648', 'Premnagar', 'प्रेमनगर', false, true, '21Oct2026'),
('3689', '22', '386', 'Pussore', 'पुससौर', false, true, '21Oct2026'),
('3690', '22', '386', 'Raigarh', 'रायगढ़', false, true, '21Oct2026'),
('3716', '22', '388', 'Rajnandgaon', 'राजनांदगांव', false, true, '21Oct2026'),
('3728', '22', '649', 'Rajpur', 'राजपुर', false, true, '21Oct2026'),
('3729', '22', '648', 'Ramanujnagar', 'रामानुजनगर', false, true, '21Oct2026'),
('3730', '22', '649', 'Ramchandrapur', 'रामचन्द्रपुर', false, true, '21Oct2026'),
('3668', '22', '382', 'S.Lohara', 'स.लोहरा', false, true, '21Oct2026'),
('3640', '22', '650', 'Saja', 'साजा', false, true, '21Oct2026'),
('3649', '22', '762', 'Sakti', 'सकती', false, true, '21Oct2026'),
('3683', '22', '385', 'Saraipali', 'सरईपाली', false, true, '21Oct2026'),
('3691', '22', '763', 'Sarangarh', 'सारंगगढ़', false, true, '21Oct2026'),
('3731', '22', '649', 'Shankargarh', 'शंकरगढ़', false, true, '21Oct2026'),
('3706', '22', '644', 'Simga', 'सिमगा', false, true, '21Oct2026'),
('3732', '22', '389', 'Sitapur', 'सीतापुर', false, true, '21Oct2026'),
('3678', '22', '384', 'Sonhat', 'सोनहत', false, true, '21Oct2026'),
('3623', '22', '642', 'Sukma', 'सुकमा', false, true, '21Oct2026'),
('3733', '22', '648', 'Surajpur', 'सूरजपुर', false, true, '21Oct2026'),
('3613', '22', '375', 'Takhatpur', 'तखतपुर', false, true, '21Oct2026'),
('3692', '22', '386', 'Tamnar', 'तमनार', false, true, '21Oct2026'),
('3707', '22', '387', 'Tilda', 'तिल्दा', false, true, '21Oct2026'),
('3603', '22', '374', 'Tokapal', 'तोकापाल', false, true, '21Oct2026'),
('3734', '22', '389', 'Udaipur', 'उदयपुर', false, true, '21Oct2026'),
('3624', '22', '636', 'Usoor', 'उसूर', false, true, '21Oct2026'),
('3735', '22', '649', 'Wadrafnagar', 'वाड्रफनगर', false, true, '21Oct2026')
on conflict (lgd_code) do update
set state_lgd_code = excluded.state_lgd_code,
    district_lgd_code = excluded.district_lgd_code,
    name = excluded.name, name_local = excluded.name_local,
    mapping_review_required = excluded.mapping_review_required,
    is_selectable = excluded.is_selectable, source_date = excluded.source_date;

insert into public.block_mapping_candidates (block_lgd_code, district_lgd_code, source_date)
values
('3676', '384', '21Oct2026'),
('3676', '760', '21Oct2026')
on conflict do nothing;

create table if not exists public.janaushadhi_district_snapshots (
  state_lgd_code text not null references public.states(lgd_code),
  district_lgd_code text not null references public.districts(lgd_code),
  snapshot_date date not null,
  kendra_count integer not null check (kendra_count >= 0),
  source_url text not null,
  created_at timestamptz not null default now(),
  primary key (snapshot_date, district_lgd_code)
);

create table if not exists public.janaushadhi_state_snapshots (
  state_lgd_code text not null references public.states(lgd_code),
  snapshot_date date not null,
  kendra_count integer not null check (kendra_count >= 0),
  source_url text not null,
  created_at timestamptz not null default now(),
  primary key (snapshot_date, state_lgd_code)
);

insert into public.janaushadhi_district_snapshots
  (state_lgd_code, district_lgd_code, snapshot_date, kendra_count, source_url)
values
('22', '374', '2026-02-28', 11, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '375', '2026-02-28', 20, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '376', '2026-02-28', 2, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '377', '2026-02-28', 10, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '378', '2026-02-28', 61, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '379', '2026-02-28', 10, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '380', '2026-02-28', 9, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '381', '2026-02-28', 4, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '382', '2026-02-28', 7, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '383', '2026-02-28', 12, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '384', '2026-02-28', 3, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '385', '2026-02-28', 11, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '386', '2026-02-28', 12, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '387', '2026-02-28', 42, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '388', '2026-02-28', 19, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '389', '2026-02-28', 5, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '636', '2026-02-28', 3, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '637', '2026-02-28', 3, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '642', '2026-02-28', 1, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '643', '2026-02-28', 7, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '644', '2026-02-28', 22, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '645', '2026-02-28', 7, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '646', '2026-02-28', 8, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '647', '2026-02-28', 8, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '648', '2026-02-28', 7, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '649', '2026-02-28', 7, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '650', '2026-02-28', 10, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '734', '2026-02-28', 5, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '759', '2026-02-28', 7, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '760', '2026-02-28', 6, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '761', '2026-02-28', 4, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '762', '2026-02-28', 5, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3'),
('22', '763', '2026-02-28', 4, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246064&lang=1&reg=3')
on conflict (snapshot_date, district_lgd_code) do update
set kendra_count = excluded.kendra_count, source_url = excluded.source_url;

insert into public.janaushadhi_state_snapshots
  (state_lgd_code, snapshot_date, kendra_count, source_url)
values
('22', '2026-06-30', 371, 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2297561&lang=1&reg=48')
on conflict (snapshot_date, state_lgd_code) do update
set kendra_count = excluded.kendra_count, source_url = excluded.source_url;

create table if not exists public.janaushadhi_kendras (
  id uuid primary key default gen_random_uuid(),
  external_registry_id text,
  name text not null,
  address text,
  district_lgd_code text not null references public.districts(lgd_code),
  block_lgd_code text references public.blocks(lgd_code),
  source_url text not null,
  source_date date,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','verified','needs_review','inactive')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (external_registry_id)
);
comment on table public.janaushadhi_kendras is
  'PMBJK Kendra directory, separate from AAM/CGMSC facilities. No locations are seeded until sourced and verified.';

-- ---------------------------------------------------------------------------
-- 2. Identity, role assignment and geographic/facility scope
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en',
  role text not null default 'pending'
    check (role in ('pending','worker','supervisor','storekeeper','district_admin','state_admin','platform_admin')),
  status text not null default 'pending'
    check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workers
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists workers_auth_user_id_uidx
  on public.workers(auth_user_id) where auth_user_id is not null;
alter table public.workers alter column whatsapp_number drop not null;
alter table public.workers drop constraint if exists workers_role_check;
alter table public.workers add constraint workers_role_check
  check (role = any (array['worker'::text,'supervisor'::text,'storekeeper'::text,'admin'::text]));

create table if not exists public.user_facility_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  assignment_role text not null
    check (assignment_role in ('worker','supervisor','storekeeper','viewer')),
  is_active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  constraint user_facility_assignment_dates check (valid_until is null or valid_until > valid_from),
  unique (user_id, facility_id, assignment_role)
);

create table if not exists public.user_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope_level text not null check (scope_level in ('state','district','block')),
  state_lgd_code text not null references public.states(lgd_code),
  district_lgd_code text references public.districts(lgd_code),
  block_lgd_code text references public.blocks(lgd_code),
  scope_role text not null check (scope_role in ('supervisor','storekeeper','district_admin','state_admin')),
  is_active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  constraint user_scope_level_shape check (
    (scope_level = 'state' and district_lgd_code is null and block_lgd_code is null)
    or (scope_level = 'district' and district_lgd_code is not null and block_lgd_code is null)
    or (scope_level = 'block' and district_lgd_code is not null and block_lgd_code is not null)
  ),
  constraint user_scope_dates check (valid_until is null or valid_until > valid_from)
);

create index if not exists user_facility_assignments_user_active_idx
  on public.user_facility_assignments(user_id, facility_id, assignment_role) where is_active;
create index if not exists user_scope_assignments_user_active_idx
  on public.user_scope_assignments(user_id, scope_level, state_lgd_code, district_lgd_code, block_lgd_code)
  where is_active;

alter table public.facilities
  add column if not exists state_lgd_code text references public.states(lgd_code),
  add column if not exists district_lgd_code text references public.districts(lgd_code),
  add column if not exists block_lgd_code text references public.blocks(lgd_code),
  add column if not exists facility_type text not null default 'other',
  add column if not exists registry_source text,
  add column if not exists registry_source_date text,
  add column if not exists external_registry_id text,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists is_synthetic boolean not null default false,
  add column if not exists is_active boolean not null default true;

alter table public.facilities drop constraint if exists facilities_facility_type_check;
alter table public.facilities add constraint facilities_facility_type_check
  check (facility_type in ('aam_shc','phc','chc','district_hospital','sub_centre','other'));
alter table public.facilities drop constraint if exists facilities_verification_status_check;
alter table public.facilities add constraint facilities_verification_status_check
  check (verification_status in ('unverified','verified','needs_review','inactive'));
create unique index if not exists facilities_external_registry_uidx
  on public.facilities(external_registry_id) where external_registry_id is not null;
create index if not exists facilities_block_idx on public.facilities(block_lgd_code);
create index if not exists facilities_district_idx on public.facilities(district_lgd_code);
comment on column public.facilities.is_synthetic is
  'True only for clearly labelled demonstration facilities; no production facility should inherit demo status.';
comment on table public.facilities is
  'Operational AAM/health-facility registry. PMBJK locations live separately in janaushadhi_kendras.';

-- ---------------------------------------------------------------------------
-- 3. Extend existing report and inventory workflow records (no parallel store)
-- ---------------------------------------------------------------------------
alter table public.reports
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_by_user_id uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text,
  add column if not exists worker_response_note text,
  add column if not exists escalated_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists closed_at timestamptz;

alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check check (
  status = any (array[
    'draft','submitted','resubmitted','supervisor_verified','correction_requested',
    'escalated','closed','rejected',
    'needs_clarification','awaiting_confirmation','confirmed','superseded'
  ]::text[])
);
create index if not exists reports_worker_created_idx on public.reports(worker_id, created_at desc);
create index if not exists reports_facility_status_date_idx on public.reports(facility_id, status, reporting_date desc);

create table if not exists public.report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  status_from text,
  status_to text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists report_events_report_created_idx on public.report_events(report_id, created_at);

alter table public.inventory_snapshots
  add column if not exists batch_number text,
  add column if not exists expiry_date date,
  add column if not exists notes text,
  add column if not exists data_mode text not null default 'operational';
alter table public.inventory_snapshots drop constraint if exists inventory_snapshots_data_mode_check;
alter table public.inventory_snapshots add constraint inventory_snapshots_data_mode_check
  check (data_mode in ('operational','synthetic_demo','imported_reference'));
create index if not exists inventory_snapshots_item_observed_idx
  on public.inventory_snapshots(inventory_item_id, observed_at desc);

alter table public.replenishment_requests
  add column if not exists source_report_id uuid references public.reports(id),
  add column if not exists created_by_user_id uuid references auth.users(id),
  add column if not exists reviewed_by_user_id uuid references auth.users(id),
  add column if not exists reviewed_at_user timestamptz,
  add column if not exists on_hand_quantity numeric check (on_hand_quantity is null or on_hand_quantity >= 0),
  add column if not exists dpdmis_reference text,
  add column if not exists allocation_reference text,
  add column if not exists dispatch_reference text,
  add column if not exists receipt_reference text,
  add column if not exists received_quantity numeric not null default 0 check (received_quantity >= 0),
  add column if not exists unit text,
  add column if not exists note text,
  add column if not exists data_mode text not null default 'operational';

alter table public.replenishment_requests drop constraint if exists replenishment_requests_status_check;
alter table public.replenishment_requests add constraint replenishment_requests_status_check
  check (status = any (array[
    'draft','recommended_to_facility_store','supervisor_approved','submitted_to_dpdmis',
    'allocated','dispatched','partially_received','received','returned_for_clarification',
    'approved','rejected'
  ]::text[]));
alter table public.replenishment_requests drop constraint if exists replenishment_requests_data_mode_check;
alter table public.replenishment_requests add constraint replenishment_requests_data_mode_check
  check (data_mode in ('operational','synthetic_demo'));
alter table public.replenishment_requests add constraint replenishment_received_not_over_requested
  check (received_quantity <= requested_quantity);
create index if not exists replenishment_facility_status_created_idx
  on public.replenishment_requests(facility_id, status, created_at desc);
create index if not exists replenishment_source_report_idx
  on public.replenishment_requests(source_report_id) where source_report_id is not null;

create table if not exists public.replenishment_events (
  id uuid primary key default gen_random_uuid(),
  replenishment_request_id uuid not null references public.replenishment_requests(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  status_from text,
  status_to text,
  external_reference text,
  quantity_delta numeric check (quantity_delta is null or quantity_delta >= 0),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists replenishment_events_request_created_idx
  on public.replenishment_events(replenishment_request_id, created_at);

-- ---------------------------------------------------------------------------
-- 4. Private, RLS-safe authorization helpers and auth onboarding
-- ---------------------------------------------------------------------------
create or replace function app_private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'active'
  limit 1
$$;

create or replace function app_private.profile_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.status = 'active'
  )
$$;

create or replace function app_private.has_facility_access(
  p_facility_id uuid,
  p_allowed_assignment_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.status = 'active'
        and (
          exists (
            select 1
            from public.user_facility_assignments ufa
            where ufa.user_id = p.id
              and ufa.facility_id = p_facility_id
              and ufa.is_active
              and ufa.valid_from <= now()
              and (ufa.valid_until is null or ufa.valid_until > now())
              and (p_allowed_assignment_roles is null or ufa.assignment_role = any(p_allowed_assignment_roles))
              and (
                (p.role = 'worker' and ufa.assignment_role = 'worker')
                or (p.role = 'supervisor' and ufa.assignment_role = 'supervisor')
                or (p.role = 'storekeeper' and ufa.assignment_role = 'storekeeper')
                or (p.role in ('district_admin','state_admin','platform_admin') and ufa.assignment_role in ('supervisor','storekeeper','viewer'))
              )
          )
          or exists (
            select 1
            from public.user_scope_assignments usa
            join public.facilities f on f.id = p_facility_id
            where usa.user_id = p.id
              and usa.is_active
              and usa.valid_from <= now()
              and (usa.valid_until is null or usa.valid_until > now())
              and (usa.state_lgd_code is null or usa.state_lgd_code = f.state_lgd_code)
              and (usa.district_lgd_code is null or usa.district_lgd_code = f.district_lgd_code)
              and (usa.block_lgd_code is null or usa.block_lgd_code = f.block_lgd_code)
              and (
                (p.role = 'supervisor' and usa.scope_role = 'supervisor')
                or (p.role = 'storekeeper' and usa.scope_role = 'storekeeper')
                or (p.role = 'district_admin' and usa.scope_role = 'district_admin')
                or (p.role = 'state_admin' and usa.scope_role = 'state_admin')
                or (p.role = 'platform_admin' and usa.scope_role in ('state_admin','district_admin','supervisor','storekeeper'))
              )
              and (
                p_allowed_assignment_roles is null
                or usa.scope_role = any(p_allowed_assignment_roles)
              )
          )
        )
    )
$$;

create or replace function app_private.auth_worker_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select w.id from public.workers w
  where w.auth_user_id = (select auth.uid()) and w.is_active
  limit 1
$$;

-- Auth-created profiles are deliberately pending and unprivileged.
-- Only trusted provisioning (service role/admin operations) may assign role/status.
create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is null then
    raise exception 'Auth user id is required';
  end if;
  insert into public.profiles (id, display_name, preferred_language, role, status)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'en'),
    'pending',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists busho_on_auth_user_created on auth.users;
create trigger busho_on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- 5. Database-enforced state transitions and append-only event ledgers
-- ---------------------------------------------------------------------------
create or replace function app_private.guard_report_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := app_private.current_profile_role();
  v_user uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'A new worker report must begin as a draft';
    end if;
    if v_role <> 'worker' or new.worker_id is distinct from app_private.auth_worker_id()
       or not app_private.has_facility_access(new.facility_id, array['worker']::text[]) then
      raise exception 'Only an active assigned worker can create a report for their facility';
    end if;
    return new;
  end if;

  if new.facility_id is distinct from old.facility_id
     or new.worker_id is distinct from old.worker_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Report ownership, facility and creation time are immutable';
  end if;

  if new.status is not distinct from old.status then
    if v_role = 'worker' then
      if old.worker_id is distinct from app_private.auth_worker_id()
         or not app_private.has_facility_access(old.facility_id, array['worker']::text[])
         or old.status not in ('draft','correction_requested')
         or new.review_note is distinct from old.review_note
         or new.reviewed_by_user_id is distinct from old.reviewed_by_user_id
         or new.reviewed_at is distinct from old.reviewed_at
         or new.verified_at is distinct from old.verified_at
         or new.escalated_at is distinct from old.escalated_at
         or new.closed_at is distinct from old.closed_at then
        raise exception 'This worker report update is not allowed';
      end if;
    elsif v_role = 'supervisor' then
      if not app_private.has_facility_access(old.facility_id, array['supervisor']::text[])
         or new.original_text is distinct from old.original_text
         or new.worker_id is distinct from old.worker_id
         or new.facility_id is distinct from old.facility_id
         or new.reporting_date is distinct from old.reporting_date
         or new.language_code is distinct from old.language_code
         or new.reviewed_by_user_id is distinct from old.reviewed_by_user_id
         or new.reviewed_at is distinct from old.reviewed_at
         or new.verified_at is distinct from old.verified_at
         or new.escalated_at is distinct from old.escalated_at
         or new.closed_at is distinct from old.closed_at
         or old.status not in ('submitted','resubmitted','supervisor_verified','escalated') then
        raise exception 'This supervisor report correction is not allowed';
      end if;
    else
      raise exception 'An active worker or assigned supervisor is required';
    end if;
    return new;
  end if;

  if v_role = 'worker' then
    if old.worker_id is distinct from app_private.auth_worker_id()
       or not app_private.has_facility_access(old.facility_id, array['worker']::text[])
       or not (
         (old.status = 'draft' and new.status = 'submitted')
         or (old.status = 'correction_requested' and new.status = 'resubmitted')
       ) then
      raise exception 'Workers may only submit drafts or resubmit a returned report';
    end if;
    if new.review_note is distinct from old.review_note
       or new.reviewed_by_user_id is distinct from old.reviewed_by_user_id
       or new.reviewed_at is distinct from old.reviewed_at
       or new.verified_at is distinct from old.verified_at
       or new.escalated_at is distinct from old.escalated_at
       or new.closed_at is distinct from old.closed_at then
      raise exception 'Workers cannot set supervisor review fields';
    end if;
    new.submitted_at := now();
    new.confirmed_at := now();
    return new;
  elsif v_role = 'supervisor' then
    if not app_private.has_facility_access(old.facility_id, array['supervisor']::text[]) then
      raise exception 'Supervisor is not assigned to this facility or scope';
    end if;
    if not (
      (old.status in ('submitted','resubmitted') and new.status in ('supervisor_verified','correction_requested','escalated','rejected'))
      or (old.status = 'escalated' and new.status in ('supervisor_verified','correction_requested','rejected'))
      or (old.status = 'supervisor_verified' and new.status = 'closed')
    ) then
      raise exception 'This supervisor report transition is not allowed';
    end if;
    if new.original_text is distinct from old.original_text
       or new.worker_id is distinct from old.worker_id
       or new.facility_id is distinct from old.facility_id
       or new.reporting_date is distinct from old.reporting_date
       or new.language_code is distinct from old.language_code then
      raise exception 'Supervisors cannot rewrite the worker source report';
    end if;
    if new.status in ('correction_requested','escalated') and nullif(btrim(new.review_note), '') is null then
      raise exception 'A reason is required for correction or escalation';
    end if;
    new.reviewed_by_user_id := v_user;
    new.reviewed_at := now();
    if new.status = 'supervisor_verified' then new.verified_at := now(); end if;
    if new.status = 'escalated' then new.escalated_at := now(); end if;
    if new.status = 'closed' then new.closed_at := now(); end if;
    return new;
  end if;

  raise exception 'Active supervisor or assigned worker role required for report transition';
end;
$$;

drop trigger if exists busho_guard_report_transition on public.reports;
create trigger busho_guard_report_transition
before insert or update on public.reports
for each row execute function app_private.guard_report_transition();

create or replace function app_private.record_report_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
  v_from text;
  v_to text;
  v_fields text[] := array[]::text[];
  v_status_changed boolean := false;
  v_note text;
begin
  if tg_op = 'INSERT' then
    v_action := 'report_created';
    v_from := null;
    v_to := new.status;
    v_fields := array['created'];
  else
    v_status_changed := new.status is distinct from old.status;
    if v_status_changed then v_fields := array_append(v_fields, 'status'); end if;
    if new.summary is distinct from old.summary then v_fields := array_append(v_fields, 'summary'); end if;
    if new.review_note is distinct from old.review_note then v_fields := array_append(v_fields, 'review_note'); end if;
    if new.worker_response_note is distinct from old.worker_response_note then v_fields := array_append(v_fields, 'worker_response_note'); end if;
    if new.original_text is distinct from old.original_text then v_fields := array_append(v_fields, 'original_text'); end if;
    if new.language_code is distinct from old.language_code then v_fields := array_append(v_fields, 'language_code'); end if;
    if new.reporting_date is distinct from old.reporting_date then v_fields := array_append(v_fields, 'reporting_date'); end if;
    if cardinality(v_fields) = 0 then return new; end if;

    v_action := case when v_status_changed then 'status_transition' else 'report_fields_updated' end;
    v_from := old.status;
    v_to := new.status;
    if new.review_note is distinct from old.review_note then
      v_note := new.review_note;
    elsif new.worker_response_note is distinct from old.worker_response_note then
      v_note := new.worker_response_note;
    end if;
  end if;

  insert into public.report_events
    (report_id, actor_user_id, actor_role, action, status_from, status_to, note, metadata)
  values (
    new.id, auth.uid(), app_private.current_profile_role(), v_action,
    v_from, v_to, v_note,
    jsonb_build_object(
      'reporting_date', new.reporting_date,
      'facility_id', new.facility_id,
      'fields_changed', to_jsonb(v_fields)
    )
  );
  return new;
end;
$$;

drop trigger if exists busho_report_event_created on public.reports;
create trigger busho_report_event_created after insert on public.reports
for each row execute function app_private.record_report_event();
drop trigger if exists busho_report_event_status on public.reports;
create trigger busho_report_event_status
after update of status, summary, review_note, worker_response_note, original_text, language_code, reporting_date
on public.reports
for each row execute function app_private.record_report_event();

-- Record structured-field corrections as metadata only. Do not duplicate field
-- values or source text in the append-only report timeline.
create or replace function app_private.record_report_item_correction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $report_item_correction$
declare
  v_fields text[] := array[]::text[];
begin
  if new.item_type is distinct from old.item_type then v_fields := array_append(v_fields, 'item_type'); end if;
  if new.item_code is distinct from old.item_code then v_fields := array_append(v_fields, 'item_code'); end if;
  if new.display_label is distinct from old.display_label then v_fields := array_append(v_fields, 'display_label'); end if;
  if new.quantity is distinct from old.quantity then v_fields := array_append(v_fields, 'quantity'); end if;
  if new.unit is distinct from old.unit then v_fields := array_append(v_fields, 'unit'); end if;
  if new.value_text is distinct from old.value_text then v_fields := array_append(v_fields, 'value_text'); end if;
  if new.confidence is distinct from old.confidence then v_fields := array_append(v_fields, 'confidence'); end if;
  if new.requires_review is distinct from old.requires_review then v_fields := array_append(v_fields, 'requires_review'); end if;
  if cardinality(v_fields) = 0 then return new; end if;

  insert into public.report_events
    (report_id, actor_user_id, actor_role, action, status_from, status_to, note, metadata)
  values (
    new.report_id, auth.uid(), app_private.current_profile_role(),
    'report_item_corrected', null, null, null,
    jsonb_build_object('report_item_id', new.id, 'changed_fields', to_jsonb(v_fields))
  );
  return new;
end;
$report_item_correction$;

drop trigger if exists busho_report_item_correction_event on public.report_items;
create trigger busho_report_item_correction_event after update on public.report_items
for each row execute function app_private.record_report_item_correction();

create or replace function app_private.guard_replenishment_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := app_private.current_profile_role();
  v_user uuid := auth.uid();
  v_delta numeric;
begin
  if tg_op = 'INSERT' then
    if v_role <> 'supervisor'
       or not app_private.has_facility_access(new.facility_id, array['supervisor']::text[]) then
      raise exception 'Only an assigned active supervisor can create an indent recommendation';
    end if;
    if new.source_report_id is null or not exists (
      select 1 from public.reports r
      where r.id = new.source_report_id
        and r.facility_id = new.facility_id
        and r.status in ('supervisor_verified','closed')
    ) then
      raise exception 'An associated supervisor-verified report is required';
    end if;
    new.created_by_user_id := v_user;
    if new.status not in ('draft','recommended_to_facility_store') then
      raise exception 'A new indent must begin as a draft or recommendation';
    end if;
    return new;
  end if;

  if new.facility_id is distinct from old.facility_id
     or new.inventory_item_id is distinct from old.inventory_item_id
     or new.requested_quantity is distinct from old.requested_quantity
     or new.created_at is distinct from old.created_at
     or new.source_report_id is distinct from old.source_report_id
     or new.created_by_user_id is distinct from old.created_by_user_id
     or new.reviewed_by_user_id is distinct from old.reviewed_by_user_id
     or new.reviewed_at_user is distinct from old.reviewed_at_user
     or new.data_mode is distinct from old.data_mode then
    raise exception 'Indent ownership, item, creator, reviewer, requested quantity, source report and data mode are immutable';
  end if;

  if old.dpdmis_reference is not null and new.dpdmis_reference is distinct from old.dpdmis_reference then
    raise exception 'A recorded DPDMIS reference cannot be changed';
  end if;
  if old.allocation_reference is not null and new.allocation_reference is distinct from old.allocation_reference then
    raise exception 'A recorded allocation reference cannot be changed';
  end if;
  if old.dispatch_reference is not null and new.dispatch_reference is distinct from old.dispatch_reference then
    raise exception 'A recorded dispatch reference cannot be changed';
  end if;

  if new.dpdmis_reference is distinct from old.dpdmis_reference
     and not (old.status = 'supervisor_approved' and new.status = 'submitted_to_dpdmis') then
    raise exception 'DPDMIS reference can only be recorded during submission';
  end if;
  if new.allocation_reference is distinct from old.allocation_reference
     and not (old.status = 'submitted_to_dpdmis' and new.status = 'allocated') then
    raise exception 'Allocation reference can only be recorded during allocation';
  end if;
  if new.dispatch_reference is distinct from old.dispatch_reference
     and not (old.status in ('submitted_to_dpdmis','allocated') and new.status = 'dispatched') then
    raise exception 'Dispatch reference can only be recorded during dispatch';
  end if;
  if new.receipt_reference is distinct from old.receipt_reference
     and not (
       old.status in ('dispatched','partially_received')
       and new.status in ('partially_received','received')
       and new.received_quantity > old.received_quantity
       and nullif(btrim(new.receipt_reference), '') is not null
     ) then
    raise exception 'Receipt references can only be recorded with a receipt quantity update';
  end if;

  if v_role not in ('supervisor','storekeeper')
     or not app_private.has_facility_access(old.facility_id, array['supervisor','storekeeper']::text[]) then
    raise exception 'Assigned supervisor or storekeeper role required';
  end if;

  -- Idempotent retry: accept an exact replay of an already-recorded receipt.
  -- No quantity/reference changes means the receipt movement trigger is a no-op.
  if new.status = old.status
     and new.received_quantity = old.received_quantity
     and new.receipt_reference is not distinct from old.receipt_reference
     and new.status in ('partially_received','received') then
    return new;
  end if;

  if old.status = 'draft' and new.status = 'recommended_to_facility_store' then
    if v_role <> 'supervisor' then raise exception 'Only a supervisor can recommend an indent'; end if;
  elsif old.status = 'recommended_to_facility_store' and new.status = 'supervisor_approved' then
    if v_role <> 'supervisor' then raise exception 'Only a supervisor can approve an indent'; end if;
    new.reviewed_by_user_id := v_user;
    new.reviewed_at_user := now();
  elsif old.status in ('recommended_to_facility_store','supervisor_approved','submitted_to_dpdmis')
        and new.status = 'returned_for_clarification' then
    if nullif(btrim(new.note), '') is null then raise exception 'A clarification reason is required'; end if;
  elsif old.status = 'supervisor_approved' and new.status = 'submitted_to_dpdmis' then
    if nullif(btrim(new.dpdmis_reference), '') is null then
      raise exception 'A DPDMIS submission reference is required';
    end if;
  elsif old.status = 'submitted_to_dpdmis' and new.status = 'allocated' then
    if v_role <> 'storekeeper' then raise exception 'Only an assigned storekeeper can record allocation'; end if;
    if nullif(btrim(new.allocation_reference), '') is null then
      raise exception 'An allocation reference is required';
    end if;
  elsif old.status in ('submitted_to_dpdmis','allocated') and new.status = 'dispatched' then
    if v_role <> 'storekeeper' then raise exception 'Only an assigned storekeeper can record dispatch'; end if;
    if nullif(btrim(new.dispatch_reference), '') is null then
      raise exception 'A dispatch/challan reference is required';
    end if;
  elsif old.status in ('dispatched','partially_received')
        and new.status in ('partially_received','received') then
    if v_role <> 'storekeeper' then raise exception 'Only an assigned storekeeper can record receipt'; end if;
    if nullif(btrim(new.receipt_reference), '') is null then
      raise exception 'A goods receipt reference is required';
    end if;
    v_delta := new.received_quantity - old.received_quantity;
    if v_delta <= 0 then raise exception 'Receipt quantity must increase'; end if;
    if new.received_quantity > new.requested_quantity then
      raise exception 'Received quantity cannot exceed requested quantity';
    end if;
    if new.status = 'partially_received' and new.received_quantity >= new.requested_quantity then
      raise exception 'Use received status when the full requested quantity arrives';
    end if;
    if new.status = 'received' and new.received_quantity <> new.requested_quantity then
      raise exception 'The full requested quantity must be recorded before closing receipt';
    end if;
  else
    raise exception 'This indent transition is not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists busho_guard_replenishment_transition on public.replenishment_requests;
create trigger busho_guard_replenishment_transition
before insert or update on public.replenishment_requests
for each row execute function app_private.guard_replenishment_transition();

create or replace function app_private.record_replenishment_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
  v_from text;
  v_to text;
  v_delta numeric;
  v_reference text;
begin
  if tg_op = 'INSERT' then
    v_action := 'indent_created';
    v_from := null;
    v_to := new.status;
    v_delta := null;
    v_reference := null;
  else
    if new.status is not distinct from old.status
       and new.received_quantity is not distinct from old.received_quantity then
      return new;
    end if;
    v_action := case
      when new.received_quantity > old.received_quantity then 'receipt_recorded'
      else 'status_transition'
    end;
    v_from := old.status;
    v_to := new.status;
    v_delta := new.received_quantity - old.received_quantity;
    v_reference := coalesce(new.receipt_reference,new.dispatch_reference,
                            new.allocation_reference,new.dpdmis_reference);
  end if;

  insert into public.replenishment_events
    (replenishment_request_id, actor_user_id, actor_role, action,
     status_from, status_to, external_reference, quantity_delta, note, metadata)
  values (
    new.id, auth.uid(), app_private.current_profile_role(), v_action,
    v_from, v_to, v_reference, v_delta, new.note,
    jsonb_build_object(
      'requested_quantity', new.requested_quantity,
      'received_quantity', new.received_quantity,
      'dpdmis_reference', new.dpdmis_reference,
      'allocation_reference', new.allocation_reference,
      'dispatch_reference', new.dispatch_reference,
      'receipt_reference', new.receipt_reference
    )
  );
  return new;
end;
$$;

drop trigger if exists busho_replenishment_event_created on public.replenishment_requests;
create trigger busho_replenishment_event_created after insert on public.replenishment_requests
for each row execute function app_private.record_replenishment_event();
drop trigger if exists busho_replenishment_event_updated on public.replenishment_requests;
create trigger busho_replenishment_event_updated after update of status, received_quantity on public.replenishment_requests
for each row execute function app_private.record_replenishment_event();

create or replace function app_private.prevent_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Workflow event history is append-only';
end;
$$;

drop trigger if exists report_events_no_update_delete on public.report_events;
create trigger report_events_no_update_delete
before update or delete on public.report_events
for each row execute function app_private.prevent_event_mutation();
drop trigger if exists replenishment_events_no_update_delete on public.replenishment_events;
create trigger replenishment_events_no_update_delete
before update or delete on public.replenishment_events
for each row execute function app_private.prevent_event_mutation();

-- ---------------------------------------------------------------------------
-- 6. Restrict exposed-schema grants, then enable authenticated scoped access
-- ---------------------------------------------------------------------------
revoke all privileges on all tables in schema public from anon, authenticated;

-- Lock down objects created by future migrations too. PUBLIC function EXECUTE
-- is a separate global default and must be revoked without a schema qualifier.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;
alter default privileges for role postgres
  revoke execute on functions from public;

grant usage on schema public to authenticated;
grant usage on schema app_private to authenticated;

-- Directory data is visible only after sign-in; no anonymous operational data.
grant select on public.states, public.districts, public.blocks,
  public.block_mapping_candidates, public.janaushadhi_district_snapshots,
  public.janaushadhi_state_snapshots, public.janaushadhi_kendras
to authenticated;

grant select on public.profiles, public.user_facility_assignments,
  public.user_scope_assignments, public.facilities, public.workers,
  public.reports, public.report_items, public.report_events,
  public.inventory_items, public.inventory_snapshots,
  public.replenishment_requests, public.replenishment_events,
  public.audit_logs, public.conversations, public.messages, public.ai_runs
to authenticated;

grant update (display_name, preferred_language) on public.profiles to authenticated;
grant insert (facility_id, display_name, whatsapp_number, preferred_language, role, is_active, auth_user_id)
  on public.workers to authenticated;
grant update (display_name, preferred_language) on public.workers to authenticated;
grant insert (facility_id, worker_id, reporting_date, original_text, language_code, status, summary)
  on public.reports to authenticated;
grant update (status, summary, original_text, language_code, reporting_date, review_note, worker_response_note)
  on public.reports to authenticated;
grant insert (report_id, item_type, item_code, display_label, quantity, unit, value_text, confidence, requires_review)
  on public.report_items to authenticated;
grant update (item_code, display_label, quantity, unit, value_text, confidence, requires_review)
  on public.report_items to authenticated;
grant delete on public.report_items to authenticated;
grant insert (inventory_item_id, quantity, observed_at, observed_by, source, batch_number, expiry_date, notes, data_mode)
  on public.inventory_snapshots to authenticated;
grant insert (facility_id, inventory_item_id, requested_quantity, status, created_by_user_id, source_report_id, on_hand_quantity, unit, note, data_mode)
  on public.replenishment_requests to authenticated;
grant update (status, note, dpdmis_reference,
              allocation_reference, dispatch_reference, receipt_reference, received_quantity)
  on public.replenishment_requests to authenticated;

grant execute on function app_private.current_profile_role() to authenticated;
grant execute on function app_private.profile_is_active() to authenticated;
grant execute on function app_private.has_facility_access(uuid,text[]) to authenticated;
grant execute on function app_private.auth_worker_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Row-level policies for identity, scope, reports, stock and operations
-- ---------------------------------------------------------------------------
alter table public.states enable row level security;
alter table public.districts enable row level security;
alter table public.blocks enable row level security;
alter table public.block_mapping_candidates enable row level security;
alter table public.janaushadhi_district_snapshots enable row level security;
alter table public.janaushadhi_state_snapshots enable row level security;
alter table public.janaushadhi_kendras enable row level security;
alter table public.profiles enable row level security;
alter table public.user_facility_assignments enable row level security;
alter table public.user_scope_assignments enable row level security;
alter table public.facilities enable row level security;
alter table public.workers enable row level security;
alter table public.reports enable row level security;
alter table public.report_items enable row level security;
alter table public.report_events enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_snapshots enable row level security;
alter table public.replenishment_requests enable row level security;
alter table public.replenishment_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ai_runs enable row level security;

create policy states_authenticated_read on public.states
  for select to authenticated using (true);
create policy districts_authenticated_read on public.districts
  for select to authenticated using (true);
create policy blocks_authenticated_read on public.blocks
  for select to authenticated using (true);
create policy block_mapping_candidates_authenticated_read on public.block_mapping_candidates
  for select to authenticated using (true);
create policy janaushadhi_district_snapshots_authenticated_read on public.janaushadhi_district_snapshots
  for select to authenticated using (true);
create policy janaushadhi_state_snapshots_authenticated_read on public.janaushadhi_state_snapshots
  for select to authenticated using (true);
create policy janaushadhi_kendras_authenticated_read on public.janaushadhi_kendras
  for select to authenticated using (true);

create policy profiles_self_select on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and status = 'active')
  with check (id = (select auth.uid()) and status = 'active');

create policy user_facility_assignments_self_select on public.user_facility_assignments
  for select to authenticated using (user_id = (select auth.uid()));
create policy user_scope_assignments_self_select on public.user_scope_assignments
  for select to authenticated using (user_id = (select auth.uid()));

create policy facilities_scoped_select on public.facilities
  for select to authenticated
  using (app_private.has_facility_access(id, null));

create policy workers_scoped_select on public.workers
  for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or app_private.has_facility_access(facility_id, array['supervisor','storekeeper','district_admin','state_admin']::text[])
  );
create policy workers_self_insert on public.workers
  for insert to authenticated
  with check (
    auth_user_id = (select auth.uid())
    and role = 'worker'
    and app_private.current_profile_role() = 'worker'
    and app_private.profile_is_active()
    and app_private.has_facility_access(facility_id, array['worker']::text[])
  );
create policy workers_self_update on public.workers
  for update to authenticated
  using (auth_user_id = (select auth.uid()) and app_private.current_profile_role() = 'worker')
  with check (auth_user_id = (select auth.uid()) and app_private.current_profile_role() = 'worker');

create policy reports_scoped_select on public.reports
  for select to authenticated
  using (
    worker_id = app_private.auth_worker_id()
    or app_private.has_facility_access(facility_id, array['supervisor','district_admin','state_admin']::text[])
  );
create policy reports_worker_insert on public.reports
  for insert to authenticated
  with check (
    worker_id = app_private.auth_worker_id()
    and status = 'draft'
    and app_private.current_profile_role() = 'worker'
    and app_private.has_facility_access(facility_id, array['worker']::text[])
  );
create policy reports_worker_update on public.reports
  for update to authenticated
  using (
    worker_id = app_private.auth_worker_id()
    and status in ('draft','correction_requested')
    and app_private.has_facility_access(facility_id, array['worker']::text[])
  )
  with check (
    worker_id = app_private.auth_worker_id()
    and status in ('draft','submitted','resubmitted','correction_requested')
    and app_private.has_facility_access(facility_id, array['worker']::text[])
  );
create policy reports_supervisor_update on public.reports
  for update to authenticated
  using (
    app_private.current_profile_role() = 'supervisor'
    and app_private.has_facility_access(facility_id, array['supervisor']::text[])
    and status in ('submitted','resubmitted','supervisor_verified','escalated')
  )
  with check (
    app_private.current_profile_role() = 'supervisor'
    and app_private.has_facility_access(facility_id, array['supervisor']::text[])
    and status in ('submitted','resubmitted','supervisor_verified','correction_requested','escalated','rejected','closed')
  );

create policy report_items_scoped_select on public.report_items
  for select to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id));
create policy report_items_worker_insert on public.report_items
  for insert to authenticated
  with check (exists (
    select 1 from public.reports r
    where r.id = report_id and r.worker_id = app_private.auth_worker_id()
      and r.status in ('draft','correction_requested')
  ));
create policy report_items_worker_update on public.report_items
  for update to authenticated
  using (exists (
    select 1 from public.reports r
    where r.id = report_id and r.worker_id = app_private.auth_worker_id()
      and r.status in ('draft','correction_requested')
  ))
  with check (exists (
    select 1 from public.reports r
    where r.id = report_id and r.worker_id = app_private.auth_worker_id()
      and r.status in ('draft','correction_requested')
  ));
create policy report_items_worker_delete on public.report_items
  for delete to authenticated
  using (exists (
    select 1 from public.reports r
    where r.id = report_id and r.worker_id = app_private.auth_worker_id()
      and r.status in ('draft','correction_requested')
  ));

create policy report_items_supervisor_update on public.report_items
  for update to authenticated
  using (exists (
    select 1 from public.reports r
    where r.id = report_id
      and r.status in ('submitted','resubmitted')
      and app_private.current_profile_role() = 'supervisor'
      and app_private.has_facility_access(r.facility_id, array['supervisor']::text[])
  ))
  with check (exists (
    select 1 from public.reports r
    where r.id = report_id
      and r.status in ('submitted','resubmitted')
      and app_private.current_profile_role() = 'supervisor'
      and app_private.has_facility_access(r.facility_id, array['supervisor']::text[])
  ));

create policy report_events_scoped_select on public.report_events
  for select to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id));

create policy inventory_items_assigned_select on public.inventory_items
  for select to authenticated
  using (is_active and app_private.has_facility_access(facility_id, null));

create policy inventory_snapshots_assigned_select on public.inventory_snapshots
  for select to authenticated
  using (exists (
    select 1 from public.inventory_items ii
    where ii.id = inventory_item_id
      and app_private.has_facility_access(ii.facility_id, null)
  ));
create policy inventory_snapshots_worker_insert on public.inventory_snapshots
  for insert to authenticated
  with check (
    source in ('worker_report','facility_count','storekeeper_count')
    and (
      (observed_by = app_private.auth_worker_id()
       and app_private.has_facility_access(
         (select ii.facility_id from public.inventory_items ii where ii.id = inventory_item_id),
         array['worker']::text[]))
      or app_private.has_facility_access(
         (select ii.facility_id from public.inventory_items ii where ii.id = inventory_item_id),
         array['storekeeper']::text[])
    )
  );

create policy replenishment_requests_scoped_select on public.replenishment_requests
  for select to authenticated
  using (app_private.has_facility_access(facility_id, array['supervisor','storekeeper','district_admin','state_admin']::text[]));
create policy replenishment_requests_supervisor_insert on public.replenishment_requests
  for insert to authenticated
  with check (
    created_by_user_id = (select auth.uid())
    and app_private.current_profile_role() = 'supervisor'
    and app_private.has_facility_access(facility_id, array['supervisor']::text[])
  );
create policy replenishment_requests_assigned_update on public.replenishment_requests
  for update to authenticated
  using (
    app_private.has_facility_access(facility_id, array['supervisor','storekeeper']::text[])
  )
  with check (
    app_private.has_facility_access(facility_id, array['supervisor','storekeeper']::text[])
  );

create policy replenishment_requests_worker_select on public.replenishment_requests
  for select to authenticated
  using (
    app_private.current_profile_role() = 'worker'
    and app_private.has_facility_access(facility_id, array['worker']::text[])
    and source_report_id is not null
    and exists (
      select 1 from public.reports r
      where r.id = source_report_id
        and r.facility_id = public.replenishment_requests.facility_id
        and r.worker_id = app_private.auth_worker_id()
    )
  );

create policy replenishment_events_scoped_select on public.replenishment_events
  for select to authenticated
  using (exists (
    select 1 from public.replenishment_requests rr
    where rr.id = replenishment_request_id
  ));

create policy audit_logs_scoped_select on public.audit_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.workers w
      where w.id = actor_worker_id
        and (
          w.auth_user_id = (select auth.uid())
          or app_private.has_facility_access(w.facility_id, array['supervisor','storekeeper','district_admin','state_admin']::text[])
        )
    )
  );

create policy conversations_worker_select on public.conversations
  for select to authenticated
  using (worker_id = app_private.auth_worker_id());

create policy messages_worker_select on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.worker_id = app_private.auth_worker_id()
  ));

create policy ai_runs_scoped_select on public.ai_runs
  for select to authenticated
  using (
    (report_id is not null and exists (select 1 from public.reports r where r.id = report_id))
    or (message_id is not null and exists (
      select 1 from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.id = message_id and c.worker_id = app_private.auth_worker_id()
    ))
  );

-- Indexes supporting the RLS joins and common inbox/stock queries.
create index if not exists reports_facility_worker_status_idx
  on public.reports(facility_id, worker_id, status, created_at desc);
create index if not exists report_events_actor_created_idx
  on public.report_events(actor_user_id, created_at desc);
create index if not exists replenishment_events_actor_created_idx
  on public.replenishment_events(actor_user_id, created_at desc);
create index if not exists inventory_snapshots_observer_idx
  on public.inventory_snapshots(observed_by, observed_at desc);
create index if not exists workers_auth_facility_idx
  on public.workers(auth_user_id, facility_id) where auth_user_id is not null;

-- Internal trigger/helper routines are not callable as an API.
revoke all on all functions in schema app_private from public, anon, authenticated;
grant execute on function app_private.current_profile_role() to authenticated;
grant execute on function app_private.profile_is_active() to authenticated;
grant execute on function app_private.has_facility_access(uuid,text[]) to authenticated;
grant execute on function app_private.auth_worker_id() to authenticated;

commit;
