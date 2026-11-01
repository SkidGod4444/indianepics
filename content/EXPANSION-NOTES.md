# indianepics content expansion report

Final build: `✓ 9 chapters, 120 events, 7 polities → src/data` (was 4 chapters, 28 events, 2 polities).
Only new files were created under content/. No existing chapter, event or polity file was edited. src/, next.config.ts and package.json were not touched. Nothing is committed. scripts/fetch-images.ts: 80 keys appended to WANTED; no existing key removed or changed.

## Chapters added
| id | order | years | polity | image |
|---|---|---|---|---|
| indus-vedic | 10 | -2600..-400 | none (no boundary drawn, on purpose) | indus-unicorn-seal |
| classical | 30 | -180..750 | gupta-400ce | ajanta-padmapani |
| medieval | 40 | 750..1500 | tughlaq-1330 | chola-nataraja |
| company | 60 | 1757..1858 | british-india-1805 | diwani-clive |
| raj | 70 | 1858..1947 | british-india-1909 | victoria-memorial |

Polities added (all approximate:true, clockwise, 34-60 points, source names the Schwartzberg plate, "Good first issue: trace properly from the DSAL scan"):
- gupta-400ce (34 pts): Schwartzberg III.D, c. 400-415 under Chandragupta II, Malwa and Gujarat included.
- tughlaq-1330 (55): Schwartzberg V (Khaljis and Tughluqs, c. 1290-1390). Ma'bar and Bengal in. Kashmir, Orissa, the Gond forests, Kerala and Assam out.
- british-india-1805 (52): Schwartzberg VII.A. Eastern contiguous block. Awadh, Mysore and Travancore/Cochin are cut out as notches. Hyderabad, the Marathas and the Bombay/Gujarat holdings are omitted.
- british-india-1909 (60): Imperial Gazetteer Atlas (1909) plus Schwartzberg VIII.B. Princely states, Burma, Baluchistan and NWFP to the Durand Line are in. Aden, the islands, the French/Portuguese enclaves, Ceylon, Nepal and Bhutan are out.
Point-in-polygon spot tests pass for both British rings.

## Events: 92 new
- indus-vedic (8): dholavira, mohenjo-daro, lothal, harappa-decline, rigveda-sapta-sindhu, painted-grey-ware, rajagriha-magadha, buddha-sarnath
- classical (10): sangam-madurai, satavahana-nashik, kanishka-mathura, gupta-era-320, allahabad-pillar, nalanda, ajanta-caves, aryabhata-499, harsha-kannauj, mamallapuram
- medieval (11): khajuraho, rajaraja-thanjavur-1010, rajendra-gangaikonda, somnath-1026, tarain-1192, qutb-minar, alauddin-chittor-1303, daulatabad-1327, vijayanagara-1336, bahmani-1347, timur-delhi-1398
- company (18): buxar-1764, regulating-act-1773, permanent-settlement-1793, srirangapatna-1799, great-arc-1802, vellore-mutiny-1806, maratha-war-1818, bentinck-reforms-1829, sindh-1843, doctrine-of-lapse, punjab-annexation-1849, railway-1853, barrackpore-1857, delhi-1857, kanpur-1857, kunwar-singh-1857, lucknow-1857, lakshmibai-1858
- raj (32): queens-proclamation-1858, famine-1876, phadke-chapekar, congress-1885, birsa-ulgulan, bengal-partition-1905, muslim-league-1906, muzaffarpur-1908, cellular-jail-1911, delhi-durbar-1911, komagata-maru-1914, lucknow-pact-1916, champaran-1917, jallianwala-1919, non-cooperation-1920, rampa-1922, vaikom-1924, kakori-1925, mahad-1927, bardoli-1928, bhagat-singh-1931, dandi-1930, surya-sen-chittagong-1930, poona-pact-1932, goi-act-1935, quit-india-1942, bengal-famine-1943, ina-1943, cabinet-mission-1946, rin-mutiny-1946, direct-action-1946, dominion-plan-1947
- republic (+13, now 23): first-election-1951, sino-indian-war-1962, bangladesh-1971, pokhran-tests, emergency-1975, bhopal-1984, ayodhya-1992, kargil-1999, aadhaar-2010, galwan-2020, election-2024, operation-sindoor-2025, census-2027

Plassey, independence-1947 and partition-1947 are not duplicated. Merges keep the counts down: sati with Macaulay's Minute; Awadh 1856 with the doctrine of lapse; Tatya Tope with Lakshmibai; Zafar's trial with Delhi 1857; Koregaon with 1818; Home Rule with the Lucknow Pact; Kheda with Champaran; Rowlatt with Jallianwala; Simon with Bhagat Singh; the INA trials with the RIN mutiny; Lahore 1940 with the 1935 Act; UPI and Puttaswamy with Aadhaar; the 2019 verdict and 2024 consecration with Ayodhya 1992; the Indus Waters Treaty abeyance with Sindoor; the April 2026 delimitation bill with census-2027.

Checks on all 120 compiled events:
- Every summary is under 160 characters.
- Every pin is inside the map frame.
- No body has markup, questions or "arguably", and none runs past 3 paragraphs.
- Every event has at least one source and its Hindi fields.
- Every compiled location name is whole, after the comma-quoting fix described below.

## Images
- 80 Commons keys added, all PD, CC0, CC BY or CC BY-SA. The manifest now has 103 entries.
- I looked at every doubtful pick before using it, and dropped wrong or poor ones: tamil-brahmi, byculla-station, chapekar-brothers, bardoli-1928, hmis-talwar.
- Used on all 5 new chapters and on 77 of the 92 new events. election-2024 and goi-act-1935 reuse the existing parliament-house-delhi key.
- The 15 new events with no image, because Commons had no clean or correct match: tarain-1192, permanent-settlement-1793, doctrine-of-lapse, barrackpore-1857 (the only Mangal Pandey image is a modern drawing), phadke-chapekar, lucknow-pact-1916, kakori-1925, bardoli-1928, rin-mutiny-1946, dominion-plan-1947, pokhran-tests, emergency-1975, aadhaar-2010, galwan-2020, census-2027.
- Note for maintainers: fetch-images.ts takes the first licence-clean hit in page-id order, not search rank, and Commons search is not fully deterministic, so a query can return a different file on a fresh clone. The manifest pins the file actually used.

## Deviations and things to know
1. indus-vedic ends at -400, not -600. The validator rejects an event whose start is outside its chapter's years, and the Buddha (short chronology) and Mahavira need dates after -600.
2. Counts above the targets: classical 10 (target 8-9), medieval 11 (9-10), republic +13 (10-12), raj 32 (24-30). If 30 is a hard cap for raj, fold lucknow-pact-1916 into muslim-league-1906 and vaikom-1924 into mahad-1927.
3. Events are ordered by start year, and ties fall back to filename order. I chose or renamed ids so same-year events sort in true order: mangal-pandey-1857 became barrackpore-1857, meerut-delhi-1857 became delhi-1857, and 3-june-plan-1947 became dominion-plan-1947, so no id starts with a digit and it sorts before independence-1947 and partition-1947. A real fix would be an optional month field in the schema, which is a src/ change.
4. A YAML bug in existing files, outside my scope: an unquoted comma inside a flow-style location ends the value. kalinga-war compiled as "Dhauli" and plassey as "Palashi". The other agent has since quoted kalinga-war. All new files quote their names.
5. Links to in-copyright lending scans on archive.org were removed, and the citation kept without a URL: Thapar, Maxwell, Davis, Hirschmann, Amin, Tara Chand vol. 4, Webb Miller, Sen, Noorani, S. Das, and the Savarkar translation. Kept: Ancient India 10-11 (an ASI publication from 1954-55, out of copyright).
6. URL sweep over all 117 source links in the 92 new events, run after every rename and unlinking: 110 return 200. The other 7 are bot blocks on live pages: two doi.org links for PNAS and JICH (403), and five legislation.gov.uk Act pages (202, confirmed live by scrape).

## Claims I am not fully sure of (hedged in the text)
- Dates are ranges, not points:
  - Mohenjo-daro, Dholavira and Lothal are mature-Harappan ranges ±100.
  - The Rigveda is c. 1500-1200 ±200. Its pin is the Ravi, standing for a region rather than a site.
  - The Buddha's sermon spans the long and short chronologies (-530..-440).
  - Gautamiputra Satakarni follows the short chronology.
  - Kanishka follows Falk's 127 CE.
  - Sangam is -100..250, with the Keeladi radiocarbon claims flagged as disputed.
  - Ajanta follows Spink's 460-480, and the text notes that others date it later.
- Lothal's dock against the reservoir reading; Nalanda's founder identified as Kumaragupta I, and the Khalji attribution of its sack; Mamallapuram's relief read two ways.
- Medieval, from the fork's notes:
  - The coins pairing Prithviraj with Muhammad are cited second-hand.
  - The Thanjavur temple-servant lists and Timur taking stonemasons to Samarkand are standard but were not checked against primary text.
  - Vijayanagara is given as 1336-1346, with the traditional date labelled as such.
- Company:
  - From memory and unchecked: the Permanent Settlement fixed at the 1789-90 assessment, the sati bans in Madras and Bombay in 1830, and Persian dropped from the courts in 1837.
  - The telegraph mileage rests on a single source.
  - The Miani pin is Hyderabad, Sindh, because Wikipedia's coordinates for the battlefield are wrong.
- Raj:
  - Death tolls are given as ranges: famine of 1876-78, Jallianwala, Quit India, Direct Action Day, Bengal 1943.
  - Contested points are written as contested: Bhagat Singh hanged on the 23rd instead of the announced 24th, and the Hussainiwala remains; Bose's death (Shah Nawaz and Khosla against Mukherjee); how Alluri died; Savarkar's petitions; the Muslim League's 1906 venue; the RIN figure of "more than 200 killed".
  - Vaikom, Rampa, Birsa and Bardoli each rest on a single source.
- Republic, 2025-2026:
  - Sindoor: MEA briefings of 23 April and 7 and 10 May 2025. Aircraft losses and mediation are written as disputed.
  - Census 2027: PIB releases. The Constitution (131st Amendment) Bill was introduced on 16 April 2026 and defeated on 17 April 2026, which I confirmed on PRS.
  - Kargil dead are given as "more than five hundred".
  - The 1971 and 1992 tolls are from standard secondary sources.
