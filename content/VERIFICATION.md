> **Verification log, 2026-11-01 to 2026-11-02.** Working report of the historian-editor agent (`.claude/agents/content-verifier.md`) as it ran, kept verbatim. Scratchpad paths and "not committed" remarks refer to that session. The "could not fully verify" lists are the open backlog: each item names the source that would settle it. Good first issues.

# indianepics content verification report

Scope: 4 chapters (00-03), 28 events, 2 polities. Every in-scope file except maurya-260bce.json was edited. Nothing committed.

## Applies to every event
- Location names were unquoted inside YAML flow mappings, so YAML cut each name at its first comma ("Ayodhya, Uttar Pradesh" compiled to "Ayodhya"). I checked this in the compiled src/data/events.json and quoted every name.
- Every event now has a title_hi and summary_hi that match the English. All summaries are one sentence under 160 characters (longest is 141).

## Change log (one line per file)

### Chapters
- chapters/00-itihasa.md: Said yugas run on "hundreds of thousands of years", but Puranic yugas run 432,000 to 1,728,000 years each (standard Puranic count). Gave the actual range. Also changed the Kurukshetra war to "the junction of the Dvapara and the Kali", as the Mahabharata places it.
- chapters/01-maurya.md: Two problems. "Took Magadha and then the north-west" states an order of conquest that is contested (Thapar). "First Indian texts whose author we can name" is false, since Panini, for one, is named earlier. Rewrote both. Kicker changed from "c. 340 to 180 BCE" to "c. 321 to 185 BCE", the dynasty's conventional span. The scroll range of -340 to -180 is unchanged.
- chapters/02-mughal.md: "Ruled ... for two centuries" overstated it, given the Sur interregnum and the decline after 1707. Now "the better part of two centuries", and Babur's arrival is described concretely. Years and kicker checked and left alone.
- chapters/03-republic.md: "The north-east in 1971 and 1972" blurred two things: Himachal became a state in 1971 and Manipur, Tripura and Meghalaya in 1972 (North-Eastern Areas (Reorganisation) Act). "Ladakh in 2019" called a union territory a state; now "the division of Jammu and Kashmir". The rhetorical "map changed more in a week than in the previous century" is replaced with the Radcliffe awards.

### Polities
- polities/mughal-1700.json: Cited Schwartzberg plate VI.A.2, which is "The Mughal Empire, c. 1605". The DSAL scan's page header shows the 1605-1707 map (Jahangir, Shah Jahan, Aurangzib) is Plate VI.A.3, p. 46. Fixed the source text; ring untouched.
- polities/maurya-260bce.json: No change. Plate III.B.4 (p. 18) confirmed from the DSAL page header; name and year are fine.

### Events: tradition track
- ayodhya: The source note merged two excavations under "B. B. Lal; ASI report 2003". Split into Lal's 1975-80 project and the 2003 ASI excavation led by B. R. Mani. Body now says the archaeology reaches "at least" Northern Black Polished Ware, and states plainly where it parts from the Treta Yuga. Name quoted; Hindi tidied.
- dwarka: The sea taking Dwarka is told in the Mahabharata's Mausala Parva, which was not cited; added it. Body said offshore structures are of "historical date" without mentioning S. R. Rao's second-millennium BCE claim. Now gives both: Rao's claim, and the NIO dating to the historical and medieval periods (Gaur, Sundaresh and Tripati, Current Science 86(9), 2004), plus the 1963 Deccan College dig that found the town no older than about the 2nd century BCE. Added that source.
- kurukshetra: Facts held. Tightened the body, set the Gita before the first day's fighting, and made clear that PGW shows settlement, not the war. Name quoted.

### Events: Maurya
- chandragupta-magadha: Summary stated Chanakya's role as fact, but it comes only from much later Indian sources (Mudrarakshasa and others), not the Greeks. Now marked as later tradition. Uncertainty widened from ±3 to ±5 for the conventional 321 BCE. Added Justin 15.4. Megasthenes' Palimbothra detail added.
- seleucid-treaty: "Cedes the lands west of the Indus" overstated Strabo. Strabo 15.2.9 (Perseus text, read) says Seleucus gave "some of the countries situated along the Indus", "in part", among the Paropamisadae, Arachosia and Gedrosia, under a marriage contract, for 500 elephants. Appian, Syriaca 55 (Livius text, read) mentions only war, settlement and a marriage tie. Summary and body rewritten to say this and to note the debate over how much was ceded. Added source URLs, Plutarch Alex. 62 and Schwartzberg III.B.4, whose map marks the ceded limit.
- taxila-learning: The source URL (archive.org in.ernet.dli.2015.43829) is Mary Somerville's Physical Geography (1858), per archive.org metadata. Replaced with Marshall, Taxila vol. I (in.gov.ignca.27254). Dropped "Chandragupta's later base for taking the north-west", which only later legend supports. Added Kalinga Separate Edict I (Hultzsch), which names Takhasila as a prince's seat. The Aramaic and Kharoshthi claim was loose; now names the Mauryan Aramaic inscription from Sirkap. Date changed from -330..-320 ±10 to -326..-316 ±5, anchored on Alexander's documented 326 BCE visit (Arrian 5.8). The Hindi summary was missing half the English; fixed.
- kalinga-war: The Wikisource URL was a 404; now Hultzsch (archive.org, verified). Uncertainty ±1 was false precision, because the year hangs on Ashoka's uncertain consecration date; now ±4. The Dhauli omission claim checks out: RE XI-XIII are absent at Dhauli and Jaugada, with Separate Edicts in their place. The motive is now framed as "most likely". Added the RE XIII casualty figures and a note that the battlefield is unknown. RE XIII sites corrected to Shahbazgarhi, Mansehra, Kalsi, since Girnar's copy is badly damaged.
- ashoka-edicts: Hultzsch URL was a 404; now archive.org InscriptionsOfAsoka.NewEditionByE.Hultzsch (verified). Date changed from -257..-232 to -258..-242 ±3. The edicts are dated by regnal years 10 (Kandahar bilingual) to 27 (Pillar Edict VII), and 232 BCE is Ashoka's death, not an edict. Girnar point moved 2 km to the inscribed rock (21.525, 70.480, per the OSM rock site). "India's first dated texts" became "the oldest deciphered, datable writing". The Prinsep 1837 claim is now precise: he started from the Sanchi donor inscriptions, then read the Delhi pillar. Added Turnour (1837) and the Maski discovery (1915). Hindi title changed to अभिलेख.
- sanchi-stupa: The summary implied both the stone casing and the gateways were Satavahana. In fact the casing is 2nd century BCE (probably Shunga) and the gateways late 1st century BCE to early 1st century CE (Marshall and Foucher). Date changed from -250 ±15 to Ashoka's reign, -268..-232 ±10. The body's "every event here carries an uncertainty" was untrue; replaced with the basis for the Ashokan attribution (Schism-edict pillar) and the Satakarni gift inscription. Added a Marshall and Foucher archive.org URL and UNESCO 524.
- maurya-fall: "Shrunk to Magadha" was too narrow, and "the next chapter when it is written" is stale now that a classical chapter exists. Added Bana's army-review detail, the Puranic 137 years and an honest basis for the 185 date.

### Events: Mughal
- panipat-1526: The body gave 21 April. Babur dates the battle Friday 8 Rajab 932, Beveridge's translation gives 20 April 1526, and a weekday computation confirms 20 April 1526 (Julian) was a Friday. Body now gives 20 April and notes that 21 April is the common modern figure. Replaced the unverifiable "candour no Indian ruler had matched" with Babur's actual list of complaints and his own (victor's) troop numbers. Added a Beveridge archive.org URL.
- fatehpur-sikri: "Built in fourteen years" mistook 1571-85 for a construction period; it is the span the city was the capital. "Abandoned for want of water" is a disputed story, and Akbar left in 1585 for the north-west frontier. The Buland Darwaza is usually tied to Gujarat 1573, but its main inscription (1601) celebrates the conquest of Khandesh. All three now stated as such. Summary lists the Ibadat Khana participants accurately. Added Akbarnama vol. 3 and UNESCO 255.
- surat-factory: The cited Foster volume (English Factories 1618-21) cannot cover 1613, and its URL is a 404. Replaced with Foster (ed.), Voyage of Thomas Best 1612-14, and Letters Received vol. 1 (1602-13), both archive.org. Added Swally (November 1612) and the ratifying farman received January 1613 (Battle of Swally article). Also Aldworth, Roe 1615-19, and Surat giving way to Bombay in the 1680s.
- taj-mahal: The body credited Koch with 1653 for the whole complex; Koch's documented position is that 6 February 1643, the 12th urs, was the official completion. Body now says that, with the outer complex taking about ten more years (Aurangzeb's 1652 letter shows it standing). The date range 1632-1653 is kept. Removed the unverifiable "what a European kingdom spent on a war". Added Burhanpur 1631, Koch's full title and UNESCO 252.
- shivaji-coronation: Date 6 June 1674 confirmed (Jyeshtha shuddha 13, Shaka 1596). Body adds Gaga Bhatt, the regnal era, coinage and the second Tantric coronation after Jijabai's death. Summary rewritten.
- golconda-1687: Eight months confirmed (siege from early 1687 to its fall on about 21 September 1687, Siege of Golconda article). "The polygon is this moment" was wrong, since the polygon is c. 1700; fixed. Added Abul Hasan's end at Daulatabad and a Maasir-i-Alamgiri archive.org URL.
- khalsa-1699: "A century later, hold the Punjab against the Afghans" was off; the misls fought the Afghans in the 1750s-60s. Now "within a century", plus Ranjit Singh at Lahore in 1799. The body now says the 1699 accounts are traditional and not from eyewitnesses.
- plassey-1757: Coordinates (23.80, 88.25) match the battlefield coordinates and sit 4.3 km from OSM Palashi village; kept, and renamed "Plassey battlefield, near Palashi". "After Mir Jafar's defection" became "when Mir Jafar's troops stand aside", which is what happened. "Paid for everything" was toned down. Added 23 June, force sizes and Buxar 1764.

### Events: Republic
- independence-1947: "The flag went up on the Red Fort the next morning" was wrong. Nehru raised it at the Red Fort on 16 August (Nehru Archive, "The Honour of the Flag", 16 August 1947). "565 princely states still to be settled" was also wrong; most had acceded, and Junagadh, Hyderabad and Kashmir were in contention. Fixed both and added the Nehru Archive source. The legislation.gov.uk URL was verified (it resolves to ukpga/Geo6/10-11/30).
- partition-1947: The English said fourteen million and the Hindi said डेढ़ करोड़ (15 million). Both now give 14.5 million arrivals, sourced to Bharadwaj, Khwaja and Mian, "The Big March", EPW 2008 (14.5 million in, 17.9 million out, 3.4 million missing; HKS PDF). Added the death range and the 17 August publication date. "Largest migration in recorded history" became "one of the largest forced migrations".
- constitution-1950: The summary was clunky ("Ambedkar's drafting committee's text"). Rewritten. Added adoption on 26 November 1949 and the Purna Swaraj anniversary, and described Parts A-D accurately.
- states-reorganisation-1956: The India Code URL (handle 1684) is the PGIMER Chandigarh Act 1966 (Wayback title). Removed it and noted Act 37 of 1956. Andhra 1953 with Kurnool as capital confirmed. Added the 58-day fast, SRC members, the 1 November 1956 date, the capital moving to Hyderabad, and that the SRC rejected language as the sole test.
- bombay-split-1960: The India Code URL (handle 1543) is the Delhi Primary Education Act 1960 (Wayback title). Removed it and noted Act 11 of 1960 (25 April, in force 1 May). Added Ahmedabad as first capital and the police-firing deaths.
- green-revolution-1966: "Double Punjab's yields within five years and end the import of grain" did not hold up. Production went from 1.9 to 5.6 million tonnes in 1965-72 (Singh and Kohli, Journal of Punjab Studies 12(2), 2005), and grain imports did not end. Summary now uses the sourced production figure. "Made Haryana and Himachal from the old state" was wrong, since Himachal already existed and only received the hill districts; fixed. Pin moved to the PAU campus, which the text names. End date changed from 1970 to 1972 to match the data. Added the Singh and Kohli source.
- liberalisation-1991: Hugo quote, 24 July date and the 1 and 3 July devaluations all confirmed in the budget-speech PDF (para 153). "The cities on this map date from it" was an overclaim; removed. Added the industrial policy statement and the 1980s-versus-1991 debate.
- telangana-2014: The India Code URL (handle 2121) is the Land Acquisition Act 2013 (Wayback title). Removed it and noted Act 6 of 2014. "First created against the parent assembly's wishes" was unproven: the assembly's rejection on 30 January 2014 is confirmed (Al Jazeera, BBC, Indian Express), but the "first" is not, so it was dropped and Article 3 explained. "A decade of agitation" became "a movement going back to 1969". Added the joint capital's end in 2024 and the 28-state count left by the 2019 J&K reorganisation.
- ladakh-2019: The India Code URL (handle 13002) did not resolve; the Act is at handle 12030 (India Code search result and Wayback title "Jammu and Kashmir Reorganisation Act, 2019"). The summary implied Article 370 was read down on 31 October; now August for the presidential orders and 31 October for the UTs. "The most recent change to the internal map" was false, because the Dadra and Nagar Haveli and Daman and Diu merger came in January 2020; fixed. Added the December 2023 Supreme Court judgment.
- chandrayaan-3: "The first craft to land in the Moon's south polar region" was untrue. It landed at about 69°S, and IM-1 later landed near 80°S. Now "at the time the closest soft landing to the Moon's south pole". "Went up from Thumba on a bicycle" was wrong as written; now the November 1963 first sounding rocket. Launch 14 July and landing 23 August confirmed on the ISRO page. Added the landing coordinates, Shiv Shakti point and India as fourth country to soft-land.

## Claims I could not fully verify (and what would settle them)
- Taj Mahal: Koch's exact wording on 1643 and 1653. I took 1643 from a secondary page citing Koch; the body no longer credits 1653 to Koch. Needs Koch 2006, the chapter on construction chronology.
- Shivaji: 6 June 1674 is the conventional date. My new-moon computation puts Jyeshtha shuddha 13 on about 6-7 June Julian, roughly 16 June Gregorian, so "6 June" is probably Old Style. Left as is. Needs Swamikannu Pillai's Indian Ephemeris or Sarkar's note on the calendar.
- Panipat: 20 April rests on Beveridge's dating plus the weekday check; I did not check Thackston (1996).
- Telangana: whether any earlier Article 3 state was created over its parent assembly's rejection. Dropped the claim; a survey of Article 3 references would settle it.
- India Code handles for Acts 37/1956, 11/1960 and 6/2014. indiacode.nic.in times out from here (also via Firecrawl), so I removed the wrong URLs and could not find the right ones. Needs someone with access to look them up.
- Buland Darwaza: the dated 1601 Khandesh inscription is from memory plus one secondary snippet. Needs the ASI Fatehpur Sikri guide or Koch, Mughal Architecture.
- Fatehpur Sikri: that the water-shortage story is disputed and the 1585 move was frontier-driven is standard scholarship (Rizvi and Flynn 1975) but was not re-checked online.
- Khalsa 1699: the date and Anandpur are standard Sikh tradition. Checked against my knowledge of Grewal; not independently verified.
- From memory, not re-read in a primary text:
  - Ayodhya: B. B. Lal's 1975-80 dates, and B. R. Mani leading the 2003 ASI team.
  - Dwarka: the title of S. R. Rao's 1999 book.
  - Sanchi: the Satakarni gift inscription and the Shunga casing (Marshall).
  - Justin 15.4, Plutarch Alex. 62, and Megasthenes' timber walls.
  - Kalinga: the RE XI-XIII omission at Dhauli and Jaugada.
  - Taxila: the Mauryan-period Aramaic inscription from Sirkap.
  - Ashoka edicts: Turnour 1837 and Maski 1915.
  - Bombay: "more than a hundred" killed in police firing (the Hutatma Chowk count).
  - Green Revolution: the end of PL-480 food-aid dependence by the early 1970s.
- URLs I could not reach directly: the UNESCO pages (524 Sanchi, 255 Fatehpur Sikri, 252 Taj Mahal) and the Nehru Archive return 403 to scripted requests. The UNESCO IDs are from memory; the Nehru Archive URL came from a search result.
- Plassey: the battlefield monument's exact position was not confirmed (Overpass was at capacity). The pin matches the standard battlefield coordinates.

## Notes for the caller
- Other agents were writing to content/ while I worked: new chapters 10, 30, 40, 60 and 70, new events such as khajuraho, qutb-minar, tarain-1192 and somnath-1026, and new polities. I did not touch them. Each of my writes checked that the file was unchanged since I read it, and none had changed. The build counts below include their files.
- The chapter `order` values of my four chapters (0-3) sit oddly beside the new chapters (10-70). This is not my scope, and I did not change it.

## Build
`bun scripts/build-content.ts`, last line:
✓ 9 chapters, 88 events, 7 polities → /Users/saidevdhal/Desktop/Codes/indianepics/src/data

## Pass 2

Scope: 5 new chapters, 4 new polities (name, year and source text only; no rings redrawn), and 92 new events. Result: 88 files changed (5 chapters, 4 polities, 79 events). The other 13 new events were checked and needed no change. No pass-1 file, id, filename, chapter assignment or code was touched. Nothing is committed.

### Applies to every new event
- Started from the expansion report's "not fully sure of" list, then checked dates and pins, then copy and Hindi.
- Pins: every location name was geocoded with Nominatim, and each flag was rechecked by hand. All 92 pins are now within 5 km of the named site; the only one moved was Miani (sindh-1843).
- Present-tense wording ("now", "still", "remains", "today") is either anchored to a date or rewritten.
- Every summary is one sentence under 160 characters. Every event has title_hi and summary_hi in Devanagari, no more than 3 body paragraphs, no "arguably" and no questions. Every location name is quoted.
- URLs: I swept every source URL in the 92 files. Each one returns 200 except known bot blocks, which were read through Firecrawl or Crossref and are live:
  - UNESCO whc pages (403);
  - doi.org links (403; Crossref titles match the citations);
  - legislation.gov.uk (202);
  - UN Digital Library (202);
  - Britannica (403);
  - Reuters (401).
- Links to scans still in copyright in India were removed and the citation kept with a note: The Colas (1935), Habib's Khaza'in al-Futuh (1931), Sarkar's Swadeshi Movement (1973), and K. S. Singh on Birsa.

### Change log (one line per file)

**Chapters**
- content/chapters/10-indus-vedic.md: The Rigveda's date was stated flatly and "describes no cities" ignored its forts; the source is standard scholarship (c. 1500-1200 BCE, oral transmission). Now "probably composed... between about 1500 and 1200 BCE and handed down orally", "the oldest Indian text that can be read", "cattle-herding clans and no cities", "cannot be securely tied" to a site, "sixteen... of the Buddhist lists", and "no clear evidence" of a single Harappan state.
- content/chapters/30-classical.md: The Ajanta paintings were credited to the Gupta era though their patrons were the Vakatakas; Kalidasa's date was given as fact; and the Chalukyas and Pallavas were placed "after" the Guptas though they overlapped. Now "Ajanta paintings under Vakataka patrons", "on most scholars' dating, Kalidasa's poetry", and "In the seventh century Harsha ruled much of the north... while the Chalukyas of Badami and the Pallavas of Kanchi contested the south". The outline is "near its widest", and the Allahabad pillar inscription is attributed to Samudragupta.
- content/chapters/40-medieval.md: Five errors, each now corrected:
  - "No single power held the north for long" was wrong, since the Pratiharas held Kannauj for about two centuries. Now "held the whole north".
  - The Cholas "reached Southeast Asia". Now: conquered northern Sri Lanka and sent a naval expedition against Srivijaya.
  - "Outlasted five dynasties" now reads "passed through five dynasties", founded 1206.
  - "Further south than any northern state since the Mauryas" understated it, since Ma'bar lies south of Ashoka's reach. Now "than any earlier state based in the north".
  - The far south was lost to the Madurai sultans as well as Vijayanagara. The Sayyids are added before the Lodis, and Babur's 1526 is named.
- content/chapters/60-company.md: The list implied all of "Tipu's Mysore" was annexed in 1799, but a reduced Mysore went back to the Wodeyars. Now "large parts of Tipu's Mysore in 1792 and 1799". The diwani of 1765 is added, along with "Parliament transferred its territories to the Crown" in 1858, the Second Anglo-Maratha War dated 1803 to 1805, and the Schwartzberg plate named.
- content/chapters/70-raj.md: "Railways" was listed among the tools that "counted and mapped" the population; "ninety years" was loose; and Aden's status in 1909 was not given. Now "a census every ten years from 1881", "railways tied its provinces together", "nearly ninety years", and "Aden (part of British India until 1937)".

**Polities** (source text only; name, name_hi and year verified as correct)
- content/polities/gupta-400ce.json: Cited "section III.D". The DSAL page header shows Plate III.D.1, p. 25, "South Asia in the Gupta-Vakataka Age". The source now names that plate.
- content/polities/tughlaq-1330.json: Cited "section V". The DSAL page header shows Plate V.2, p. 38. Now cited as that plate.
- content/polities/british-india-1805.json: Cited "section VII.A". The DSAL page header shows Plate VII.A.2, p. 55, "The expansion of British power, 1766-1819". Now cited as that plate.
- content/polities/british-india-1909.json: Cited "section VIII.B". The DSAL page header shows Plate VIII.B.1, p. 65, "Territorial and administrative changes, 1857 to 1904". Now cited as that plate. The Imperial Gazetteer vol. 26 Atlas (1909) citation is correct.

**Events: indus-vedic and classical**
- dholavira.md:
  - The excavation years 1990-2005 are now 1989-2005, per UNESCO's thirteen seasons.
  - "Largest Indus inscription" is now "the largest signs known", each about 37 cm (harappa.com).
  - "Southern reach" was wrong, since Lothal lies further south. Now UNESCO's phrase, "the southern centre".
- mohenjo-daro.md: "Largest city" is now "one of the largest", since Rakhigarhi rivals it. Banerji began digging in 1922, and Marshall linked the site to Harappa in 1924. Hindi updated.
- harappa-decline.md: The Cemetery H sentence was garbled and the summary said the culture "gives way". Both are rewritten, the Hindi updated, and "current explanations" is now "later explanations". The pin is correct.
- rigveda-sapta-sindhu.md: Griffith vol. 2 holds Books 7-10, per the archive.org text. The source note now names hymns 7.18 and 10.75.
- painted-grey-ware.md: "Now known" is now "have been recorded".
- buddha-sarnath.md: "Two centuries later" fits only the short chronology, so it now reads "two to three centuries later". The emblem is "adopted as state emblem in 1950", and the short-chronology preference is dated "since the 1980s".
- sangam-madurai.md: The Keeladi dispute was misstated. The excavator dates the start to the 8th century BCE, and in May 2025 the ASI asked him to justify that, suggesting a start not much before 300 BCE. The body now says this, with Indian Express (25 May 2025) added as a source.
- satavahana-nashik.md: Gautamiputra's reign was given as 86-130 CE. Published proposals run from c. 60-85 to 106-130 CE (Sinopoli; Higham), so the uncertainty is widened from 20 to 50 years and the body gives the span. Nahapana is now only "before" Gautamiputra.
- kanishka-mathura.md: Time-dependent wording removed. The Rabatak city list now follows Sims-Williams' reading. The 78-278 CE debate range is confirmed by Cribb and Zeymal.
- nalanda.md: Four fixes, with Raverty and Roerich added as sources with archive.org links:
  - "Seven centuries" is now "until the 13th century" (UNESCO).
  - Kumaragupta I is argued from Mahendraditya = Shakraditya, the founder Xuanzang names.
  - The Bakhtiyar Khalji sack is labelled an inference: Minhaj (Raverty i, 551-2) names "Bihar", probably Odantapuri.
  - Dharmasvamin in 1234-36 found a 90-year-old abbot and about 70 monks (Roerich 1959).
- ajanta-caves.md: "Oldest surviving paintings" is now "the site's earliest paintings, in Caves 9 and 10". "Forgotten until a hunting party" is now "came to European notice in 1819" (John Smith).
- mamallapuram.md: The port is about 59 km east of Kanchipuram, not south; English and Hindi fixed. The rathas are now "five of them in one group". The scripts line names Khmer, Thai and Javanese, and the "still" wording is removed.

**Events: medieval**
- khajuraho.md: Kielhorn (Epigraphia Indica vol. I) dates the inscription to 953-54 CE and records Yashovarman's Vaikuntha temple, built under Dhanga; the text now says so. Burt "visited" the site in 1838.
- rajaraja-thanjavur-1010.md: The tower is about 60 m, not 66 m (UNESCO gives 59.82 m). South Indian Inscriptions vol. II no. 66 is added: 400 temple women, recorded on the enclosure wall, not the base. The Colas URL is removed (in copyright).
- rajendra-gangaikonda.md: The conquests now use the inscriptions' names: Srivijaya, Kadaram, Tambralinga. The Colas URL is removed (in copyright).
- somnath-1026.md: Per Ibn al-Athir: over 2 million dinars, over 50,000 dead, and a return through Sindh, not Kutch. Ellenborough's 1842 proclamation about the gates is named.
- tarain-1192.md: "Most Persian sources say vassal" was wrong. Now Minhaj (Prithviraj captured and killed) against Hasan Nizami (spared, later beheaded for plotting), with both readings of the joint coins.
- qutb-minar.md: The "five dynasties" did not build Siri, Tughlaqabad, Jahanpanah and Firozabad; the Khaljis and Tughluqs did. Now "later sultans", ruins "across Delhi", and Firuz Shah "replaced the top storey with two".
- alauddin-chittor-1303.md: "Eight-month siege" is now "seven months after leaving Delhi", from Khusrau's dates of 28 January and 26 August 1303 (weekdays checked). Padmini is labelled legend, and the 1318 annexation of Devagiri is named. The Habib translation URL is removed (in copyright).
- daulatabad-1327.md: Hindi title was ungrammatical; now "राजधानी दिल्ली से दौलताबाद". The Barani quote is confirmed.
- vijayanagara-1336.md: The 1346 Sringeri inscription is quoted. The conversion story now reads "historians are divided", and the city's size is anchored to the 15th-16th centuries.
- bahmani-1347.md: Gangu is now a Brahmin astrologer, as Firishta says. The Hijri date with its Friday gives 3 August 1347; the note explains Briggs's margin date of 12 August.
- timur-delhi-1398.md: The stonemasons sent to Samarkand are attributed to Yazdi's Zafarnama. "Founded Agra" is now "made Agra his capital", and "no Indian source checks them" is now "no independent count exists". The Malfuzat is flagged as of doubtful authorship.

**Events: company**
- sindh-1843.md: The pin sat on Hyderabad city, about 10 km from the battlefield. It is moved to Miani, about 6 miles north on the Fuleli (Encyclopedia Americana; OSM; Pakistan Horizon), and renamed "Miani, north of Hyderabad, Sindh (Pakistan)". Karachi became the Punjab's port once railways reached it, not "after 1849".
- vellore-mutiny-1806.md: Three battalions mutinied, not two (Mason). The order was to shave the chin, not trim beards. "Still argued" is now "historians disagree".
- srirangapatna-1799.md: The prince installed was Krishnaraja Wodeyar III, "a boy of nearly five". The politics line is anchored to Karnataka's Tipu Jayanti, held 2015-2019 (Frontline; Indian Express).
- maratha-war-1818.md: An unsourced "Maratha accounts say" claim is replaced. The Peshwa's troops broke off as General Joseph Smith approached (The Hindu, 2018), and whether Koregaon was a victory or a standoff is labelled disputed.
- bentinck-reforms-1829.md: Act XXIX of 1837 only empowered the government to replace Persian (Allahabad High Court history; Tariq Rahman). The Hindi "कार्यवृत्त" (meeting minutes) is now "शिक्षा संबंधी 'मिनट'". The 1830 sati bans in Madras and Bombay are confirmed.
- railway-1853.md: The telegraph figures rested on one source. A second is added: Shridharani, Story of the Indian Telegraphs (archive.org), giving the 1851 Diamond Harbour line and 4,000 miles by February 1856.
- punjab-annexation-1849.md: The Koh-i-Noor is anchored: in the crown jewels since 1850, claimed by India since 1947, and also claimed by Pakistan, Iran and Afghanistan. The summary now matches the Hindi.
- kanpur-1857.md: The Bibighar victims were "held captive", not all "taken from the boats". Havelock fought on 16 July and entered on 17 July. Nana Sahib's role is marked disputed, replacing "no evidence".
- delhi-1857.md: Hodson shot two of Zafar's sons and a grandson, not "his sons".
- doctrine-of-lapse.md: Wajid Ali Shah moved to Calcutta himself; he was not sent there.
- barrackpore-1857.md: "First violent act of 1857" ignored earlier arson; now "first armed attack on British officers". One unsourced interpretive sentence is removed.
- great-arc-1802.md: "Every modern map descends from it" is now "Survey of India maps built on it for more than a century".
- lucknow-1857.md: Mukherjee "argued", not "showed".
- lakshmibai-1858.md: Hindi "शहीद हुईं" is now "लड़ते हुए मारी गईं", matching the neutral English.

**Events: raj, first half**
- bardoli-1928.md: Five fixes, with the Indian Annual Register 1929 added as a second source and the summary and Hindi updated:
  - An unsourced claim about women's meetings is dropped.
  - The result is now "about 6 per cent, roughly a quarter of what the government had fixed", from Desai's totals.
  - The Broomfield-Maxwell report is dated May 1929.
  - The resignations are worded as Desai records them.
  - "Sardar" is credited to tradition.
- bengal-famine-1943.md: The army was brought in in November, not October (Famine Inquiry Commission 1945). The 1.5 million figure is now the Commission's excess deaths for 1943 to mid-1944.
- bengal-partition-1905.md: "Annulled at the Durbar" is now "its reversal was announced", since it took effect in 1912. The in-copyright Sarkar scan is unlinked, and Banglapedia's "Partition of Bengal, 1905" is added as a linked source.
- birsa-ulgulan.md: Per K. S. Singh (1983), cited without URL as in copyright:
  - The birthplace is disputed between Ulihatu and Chalkad, and the pin is explained.
  - The 9 January 1900 firing was on Sail Rakab beside Dombari Buru: officially 10 killed, 200 or more in Munda accounts.
  - He was captured in the Porahat forest.
  - The tenancy act is anchored to the 2016-17 amendments, which were returned and withdrawn.
- cabinet-mission-1946.md: Azad was misquoted. Now the 1960 edition's "one of those unfortunate events which changed the course of history".
- cellular-jail-1911.md: Dhingra shot Curzon Wyllie at the Imperial Institute, not India House.
- champaran-1917.md: "Three years" after Gandhi's return is now "two years", since he returned in January 1915. The autobiography link moved from a restricted lending scan to the open 1948 Navajivan edition.
- congress-1885.md: The press-act repeal year is dropped, since sources split between 1881 and 1882. Hume's "safety-valve" is quoted from Wedderburn 1913, which is added, and "most historians now" is anchored.
- dandi-1930.md: The Peshawar sequence was unsupported. Now troops fired and two platoons of the Garhwal Rifles refused.
- delhi-durbar-1911.md: "The only reigning British monarchs to visit India" is false, since Elizabeth II visited three times. Now "the only King-Emperor and Queen-Empress ever to visit India".
- famine-1876.md: The pin text no longer ties it to a Bellary drawing; the image is an ILN engraving of Bangalore. The toll now gives two figures: 5.25 million excess deaths in British territory (1880 Famine Commission) and 6.1-10.3 million for all India (Davis). Summary and Hindi read "an estimated 5 to 10 million".
- goi-act-1935.md: Four fixes:
  - The Act ended dyarchy in the provinces only.
  - The electorate is now "30 to 35 million".
  - The Congress won majorities in five provinces and formed ministries in eight of eleven.
  - The Lahore resolution was adopted on 24 March 1940.
- ina-1943.md: Two Historic Trials was compiled by Moti Ram, not Sahgal. The flag-raiser is "Shaukat Malik". The unverified "more died of hunger and disease than in battle" is now "many died". The politics line is anchored to the 2015-16 release of the Bose files.
- bhagat-singh-1931.md: The text is unchanged; its 23 March and Hussainiwala hedges are accurate. The Statutory Commission vol. 1 link sat in archive.org's temporary "adhoc-temp" collection, and is replaced by the stable Digital Library of India copy, in.ernet.dli.2015.81808.

**Events: raj, second half**
- poona-pact-1932.md: The Award gave 78 seats, not 71 (Ambedkar 1946, the cited source). The second vote and Ambedkar's phrase "the worst form of coercion" are added.
- vaikom-1924.md: Four fixes, with The Hindu (30 March 2023) added:
  - The roads opened on 23 November 1925, and the satyagraha was withdrawn a week later.
  - Periyar came from Erode that April.
  - Gandhi negotiated with the regent, Sethu Lakshmi Bayi, and orthodox leaders, not the priests.
  - The archive source is retitled as a Travancore Legislative Council question of 12 June 1924.
- rin-mutiny-1946.md: Four fixes, with Hansard of 22 February 1946 added:
  - "More than 200 killed" is now 228 civilians dead and 1,046 injured (Vitali 2018).
  - The INA sentence was passed on 31 December 1945 and remitted on 2 January 1946.
  - The trials book's compiler is Moti Ram.
  - The mutiny involved 10,000-20,000 ratings on up to 78 ships.
- jallianwala-1919.md: Per the Hunter report:
  - The Rowlatt Act passed against all non-official Indian members.
  - The hartal was India-wide.
  - Dyer's deployment is corrected.
  - Marcella Sherwood is named.
  - O'Dwyer was lieutenant-governor.
- komagata-maru-1914.md: The Budge Budge toll is "about twenty, most of them passengers", and the Sedition Committee's count of eighteen Sikh dead is noted.
- muzaffarpur-1908.md: Barindra's death sentence was commuted to transportation for life. "Songs are still sung" now names the song, "Ekbar biday de Ma". Hindi past tense.
- quit-india-1942.md: The official tolls differ (1,008; 1,028; at least 1,000), so the text says "about a thousand". Arrests are "tens of thousands, more than 100,000 by some counts". Britannica is added, since the cited 1943 pamphlet gives no figures.
- rampa-1922.md: Raju was "captured in the forest and shot dead at Koyyuru". A PIB release from 2022 is added.
- kakori-1925.md: The arrests "followed that autumn". Hindi title is now "काकोरी ट्रेन एक्शन". ANI (9 August 2021) is added for the renaming.
- muslim-league-1906.md: Banglapedia is added for the venue: Dhaka, 30 December, Shahbag.
- non-cooperation-1920.md: Gandhi's "The Crime of Chauri Chaura" (Collected Works vol. 22, archive.org) is added.
- phadke-chapekar.md: Plague "spread through Poona in 1897", per the Sedition Committee report.
- mahad-1927.md: "Still marked" is now "Ambedkarites mark 25 December as Manusmriti Dahan Din".
- queens-proclamation-1858.md: The park was Minto Park, later Madan Mohan Malaviya Park. The pillar is undated, since sources give both 1908 and 1910.
- surya-sen-chittagong-1930.md: Chittagong went to East Pakistan in 1947 and has been in Bangladesh since 1971. "The most ambitious" is now "among the most ambitious".
- lucknow-pact-1916.md: Hindi wording only.

**Events: republic**
- first-election-1951.md: The Hindi summary implied all 17.3 crore electors voted; now "17.3 crore voters". The English figures are confirmed (The Hindu, 24 October 2026).
- sino-indian-war-1962.md: "Today's maps" and "still argued" are rewritten, with the LAC as the working border. The Henderson Brooks-Bhagat report is anchored as "not officially released by 2026", per Kiren Rijiju in February 2026.
- bangladesh-1971.md: The MEA Simla Agreement link was a 404 and now points to MEA's bilateral-documents page. The death toll is attributed at both ends: 26,000 (Hamoodur Rahman Commission) and 3 million (Bangladesh official figure).
- pokhran-tests.md: The MEA link was a 404 and is replaced by UN document CD/1524, which was read. Now "weapon state"; no first use is dated to 2003; Pakistan's 30 May test was at Kharan, not Chagai.
- emergency-1975.md: "Still disputed" is now "has never been settled".
- bhopal-1984.md: "Never cleaned up" is updated: 337 tonnes of waste went to Pithampur in January 2025, but soil and groundwater were not covered (Reuters).
- ayodhya-1992.md: The riot toll of about 2,000 is confirmed (Al Jazeera). The 2020 acquittal of all 32 accused is added.
- kargil-1999.md: "More than five hundred" dead is now the official 527, with 545 in the PIB 2025 backgrounder. Pakistan's army chief's admission is dated September 2024 (The Hindu). The dispute over authorisation is attributed to Sharif and to Musharraf's army.
- aadhaar-2010.md: "Within a decade over a billion" is now "by April 2016", with the PIB release on the billionth number (4 April 2016) added. "Remains contested" is now "argued over ever since".
- galwan-2020.md: "Neither side patrols" is now "neither side was to patrol".
- operation-sindoor-2025.md: Five fixes:
  - The victims were 25 Indians, one of them a local pony operator, and one Nepali (MEA). The old text said 25 tourists.
  - India blamed the Lashkar-e-Taiba; Pakistan denied any part and asked for a neutral investigation (Al Jazeera).
  - "Pakistan-held" is now "Pakistan-administered".
  - The aircraft-loss claims are each attributed: Pakistan's six jets, the CDS's unspecified losses, and the IAF chief's five fighters plus one large aircraft. On mediation, Trump's claim is set against India's account of a direct agreement between the DGMOs.
  - The rivers "cross Indian-administered territory".
- census-2027.md: Caste is counted in phase two, not houselisting (PIB). Article 82 is anchored as "unchanged". The bill was defeated on 17 April 2026 (PRS: 850-seat cap, 2011 basis). PRS's seat-shift estimate is added (Tamil Nadu 39 to 32, Uttar Pradesh 80 to 89). The 2026 start year is defensible: Phase I began on 1 April 2026 (PIB).

- Follow-up after the forks (coordinator): birsa-ulgulan "It is still in force" is now "It survived an attempt to loosen it" (anchored to 2016-17). In ina-1943, the summary's "is still disputed" is now "has been disputed ever since", with the Hindi matched. The body already attributes the dispute: the Shah Nawaz (1956) and Khosla (1974) inquiries accepted the crash; the Mukherjee Commission (2005) did not, and the government rejected its finding.
- cellular-jail-1911: the Savarkar petitions are confirmed as written: contested and attributed ("Admirers read them as tactics... critics as a surrender").
- Kept on purpose: "still argued" in famine-1876 and bengal-famine-1943, and "remains disputed" in regulating-act-1773 (ongoing historians' debate); "now Sarnath", "now Coronation Park", "now Shadman Chowk" and "memorial now stands" (stable place names).

**Checked, no change (13):** lothal, rajagriha-magadha, gupta-era-320, allahabad-pillar, aryabhata-499, harsha-kannauj, buxar-1764, regulating-act-1773, permanent-settlement-1793 (the 1789-90 assessment is confirmed via Jon Wilson), kunwar-singh-1857, direct-action-1946, dominion-plan-1947, election-2024 (ECI turnout 65.79%; BJP 240, INC 99, SP 37 per PRS).

### Claims I could not fully verify (and what would settle them)

**Indus-vedic and classical**
- Dholavira's stream names, Manhar and Mansar: Bisht's 2015 ASI excavation report.
- The Korean monks at Nalanda: Yijing's Chinese Monks in India (Lahiri's translation).
- Painted Grey Ware's "more than a thousand sites": a recent site gazetteer.
- Lothal as dock or reservoir: contested and labelled so; new sediment studies would settle it.
- Keeladi's earliest phase: an ASI-approved final excavation report.

**Medieval**
- The Qutb's 1368 lightning repair, and the inscription's "twenty-seven temples" against UNESCO's "about twenty": Page's 1926 ASI memoir.
- Grants to Nagapattinam after 1025, and Gangaikonda as capital for about 250 years: the Leiden plates; Nilakanta Sastri.
- The two readings of the Tarain coins: Talbot (2016) or a numismatic paper.
- The Malfuzat's doubtful authorship, and the return to Delhi c. 1335: Jackson, The Delhi Sultanate.
- Burt's 1838 visit and the Kandariya date of c. 1030: Burt's 1839 article; Desai.
- Vijayanagara's "first secure records in the 1340s": Eaton.

**Company**
- The exact Miani battlefield point, probably within 2-3 km: the Imperial Gazetteer entry, or the plan in Napier's Conquest of Scinde. Dubba is described only as "near Hyderabad".
- The edition of Shridharani's telegraph history (probably 1953): its title page.
- The number of Bombay's 1830 sati regulation: the Bombay Regulations of 1830.

**Raj**
- The Bardoli enhancement (20 or 22 per cent) and the result of about 6 per cent: the Broomfield-Maxwell report of 1929.
- Direct Action Day's "more than 4,000" rests on Das, unread, while Azad says "hundreds". The timing of the army's deployment is also contested.
- Bengal 1943's later 2.1-3 million range: Sen, Maharatna and demographic studies.
- The INA's "many died of hunger and disease", and the dates of the Bose file releases: Fay; the 2015-16 government releases.
- The 1937 results and the 1935 Act's electorate: the 1937 election returns.
- Birsa's birth year, 1874 or c. 1875: Singh's argument.
- The Quit India Congress estimate of 4,000-10,000: a primary Congress source.
- The RIN's 10,000-20,000 ratings, where Hansard gives 7,000 in Bombay by 20 February: Admiralty or RIN records.
- Chittagong rests on Kalpana Dutt alone, and Kakori has a single web link: a second independent account for each.
- The Dyer fund of £26,000: the Morning Post figures.
- Lenin on the 1908 strike: "Inflammable Material in World Politics".
- Tilak's "three trials" is shaky, since the 1916 case had no conviction: the trial records.
- "Command performance": Mohamed Ali's 1923 address.
- The details of the Rampa raids: Arnold, "Rebellious Hillmen".
- The Ghadar rising of 21 February 1915 and Sarabha's hanging on 16 November 1915: any standard Ghadar history.
- Shahid Amin's Chauri Chaura argument: the book (Event, Metaphor, Memory).
- The Lucknow Pact's dates: checked from memory.
- The ANI and Britannica pages were read only as search excerpts.
- Webb Miller, Tara Chand, Savarkar's memoir, Hirschmann and Noorani are cited without links and unread.

**Republic**
- Bangladesh 1971's 26,000: the casualty chapter of the Hamoodur Rahman report.
- The Kharan test site and the 2003 doctrine date: Pakistan's statement of 30 May 1998; India's release of 4 January 2003.
- Ayodhya's 2.77 acres and the "egregious violation" quote: a text search of the 2019 judgment.
- Galwan's "change the status quo" wording, and China's February 2021 admission of four dead: the MEA statement of 16 June 2020; the PLA Daily report of February 2021. MEA pages render only via JavaScript, so only their titles were confirmed.

### Notes for the caller
- The raj chapter has 32 events, above the expansion target of 24-30. Its report suggests folding lucknow-pact-1916 into muslim-league-1906, and vaikom-1924 into mahad-1927, if 30 is a hard cap. That is an editorial call; I did not merge, since it would mean deleting ids.
- Same-year order still depends on filenames. An optional month field would fix it, but that is a schema change and I have not made it.

### Build (Pass 2)
`bun scripts/build-content.ts`, last line:
✓ 9 chapters, 120 events, 7 polities → /Users/saidevdhal/Desktop/Codes/indianepics/src/data
