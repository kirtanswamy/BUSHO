/* Chhattisgarh administrative development-block reference.
 * Source: Government of Chhattisgarh, Industrial Development Policy 2024-30,
 * Reference Guide (English), Annexure "Categorization of Development Blocks",
 * pages 15-16. 33 districts / 146 blocks. Not a health-facility register.
 */
(() => {
  const source = {
    title: 'Chhattisgarh Industrial Development Policy 2024-30 · Reference Guide',
    url: 'https://invest.cg.gov.in/policy-documents/402/view',
    pages: '15-16',
    retrieved: '2026-11-06',
    note: 'Administrative development-block reference only. Verify against the current Local Government Directory before production use.'
  };

  const rows = [
    ['Raipur', [['Dharsiva',1],['Tilda',2],['Arang',2],['Abhanpur',2]]],
    ['Gariyaband', [['Gariyaband',2],['Fingeshwar',2],['Chhura',3],['Deobhog',3],['Mainpur',3]]],
    ['Balodabazar-Bhatapara', [['Balodabazar',1],['Bhatapara',1],['Simga',1],['Palari',2],['Kasdol',2]]],
    ['Mahasamund', [['Mahasamund',2],['Saraipali',2],['Pithora',2],['Bagbahara',3],['Basna',3]]],
    ['Dhamtari', [['Dhamtari',2],['Kurud',2],['Magarlod',3],['Nagari',3]]],
    ['Durg', [['Durg',1],['Dhamdha',1],['Patan',1]]],
    ['Balod', [['Balod',2],['Gundardehi',2],['Gurur',2],['Dondi',2],['Dondi-Lohara',3]]],
    ['Bemetara', [['Bemetara',2],['Saja',2],['Berla',2],['Nawagarh',2]]],
    ['Rajnandgaon', [['Rajnandgaon',2],['Dongargarh',2],['Dongargaon',2],['Churiya',3]]],
    ['Khairagarh-Chhuikhadan-Gandai', [['Khairagarh',2],['Chhuikhadan',2]]],
    ['Mohla-Manpur-Ambagarh Chowki', [['Ambagarh Chowki',3],['Manpur',3],['Mohla',3]]],
    ['Kabirdham', [['Kawardha',2],['Bodla',2],['Sahaspur Lohara',2],['Pandariya',3]]],
    ['Bilaspur', [['Bilha',2],['Takhatpur',2],['Masturi',2],['Kota',2]]],
    ['Mungeli', [['Mungeli',2],['Patharia',2],['Lormi',2]]],
    ['Gaurella-Pendra-Marwahi', [['Pendra Road',2],['Pendra',2],['Marwahi',3]]],
    ['Raigarh', [['Raigarh',1],['Kharsia',2],['Tamnar',2],['Gharghoda',2],['Pusaur',2],['Dharamjaygarh',2],['Lailunga',2]]],
    ['Sarangarh-Bilaigarh', [['Sarangarh',2],['Baramkela',2],['Bilaigarh',3]]],
    ['Janjgir-Champa', [['Akaltara',1],['Bamhanidih',2],['Nawagarh',2],['Baloda',2],['Pamgarh',2]]],
    ['Sakti', [['Sakti',2],['Jaijaipur',2],['Malkharoda',2],['Dabhra',2]]],
    ['Korba', [['Korba',1],['Katghora',2],['Pali',3],['Kartala',3],['Podhi-Uprora',3]]],
    ['Surguja', [['Ambikapur',2],['Lundra',3],['Lakhanpur',3],['Sitapur',3],['Batoli',3],['Udaipur',3],['Mainpat',3]]],
    ['Surajpur', [['Surajpur',2],['Pratappur',3],['Premnagar',3],['Bhaiyathan',3],['Odagi',3],['Ramanujnagar',3]]],
    ['Balrampur', [['Balrampur',3],['Kusmi',3],['Rajpur',3],['Ramchandrapur',3],['Shankargarh',3],['Wadrafnagar',3]]],
    ['Jashpur', [['Jashpur',3],['Pathalgaon',3],['Kunkuri',3],['Bagicha',3],['Duldula',3],['Manora',3],['Kansabel',3],['Farsabahar',3]]],
    ['Koriya', [['Baikunthpur',3],['Sonhat',3]]],
    ['Manendragarh-Chirmiri-Bharatpur', [['Manendragarh',3],['Bharatpur',3],['Khadgawan',3]]],
    ['Bastar', [['Jagdalpur',2],['Bakawand',3],['Bastanar',3],['Darbha',3],['Lohandiguda',3],['Bastar',3],['Tokapal',3]]],
    ['Dantewada', [['Dantewada',3],['Geedam',3],['Katekalyan',3],['Kuakonda',3]]],
    ['Sukma', [['Konta',3],['Chhindgarh',3],['Sukma',3]]],
    ['Kanker', [['Kanker',2],['Charama',2],['Antagarh',3],['Bhanupratappur',3],['Durgukondal',3],['Narharpur',3],['Koyalibeda',3]]],
    ['Kondagaon', [['Kondagaon',2],['Keshkal',3],['Baderajpur',3],['Makdi',3],['Farasgaon',3]]],
    ['Bijapur', [['Bijapur',3],['Bhairamgarh',3],['Bhopalpatnam',3],['Usur',3]]],
    ['Narayanpur', [['Narayanpur',3],['Orchha',3]]]
  ];

  const slug = value => String(value).normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const districts = rows.map(([name, blocks], index) => ({
    id: slug(name), name, sourceOrder: index + 1,
    blocks: blocks.map(([blockName, group]) => ({
      id: slug(blockName), name: blockName, policyGroup: group
    }))
  }));
  const allBlocks = districts.flatMap(district => district.blocks.map(block => ({
    ...block, districtId: district.id, districtName: district.name
  })));

  const demoFacility = Object.freeze({
    id: 'demo-hwc-dhamtari',
    name: 'Rampur HWC · Synthetic demo facility',
    shortName: 'Rampur HWC',
    districtId: 'dhamtari',
    districtName: 'Dhamtari',
    blockId: 'dhamtari',
    blockName: 'Dhamtari',
    type: 'Sub Health Centre · HWC',
    synthetic: true,
    source: 'BUSHO-created demonstration record. Not an official facility listing.'
  });

  const facilities = [demoFacility];

  window.BUSHO_DIRECTORY = Object.freeze({
    source,
    getDistricts() { return districts.map(d => ({...d, blocks:d.blocks.map(b=>({...b}))})); },
    getBlocks(districtId) {
      return allBlocks.filter(b => !districtId || b.districtId === districtId).map(b => ({...b}));
    },
    getDistrict(id) {
      const district = districts.find(d => d.id === id);
      return district ? {...district, blocks:district.blocks.map(b=>({...b}))} : null;
    },
    getBlock(id) {
      const block = allBlocks.find(b => b.id === id);
      return block ? {...block} : null;
    },
    getFacilities() { return facilities.map(f=>({...f})); },
    getDemoFacility() { return {...demoFacility}; },
    getFacilityCountForBlock(blockId) {
      return facilities.filter(f=>f.blockId===blockId).length;
    },
    getWorkerCountForBlock(blockId) {
      return blockId === demoFacility.blockId ? 1 : 0;
    }
  });
})();
