/**
 * Where every ink drawing comes from. Each one is traced from a real work by scripts/build-sketches.ts, so what it shows
 * rests on that work, and the credit travels with it. Traces of CC BY and CC BY-SA works carry the same terms.
 */
export type SketchSource = {
  title: string;
  title_hi: string;
  /** Who made the work, and when. */
  made: string;
  made_hi: string;
  /** Who made the photograph or holds the work. */
  via: string;
  license: string;
  page: string;
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;

export const SKETCHES: Record<string, SketchSource> = {
  hero: {
    title: "Krishna and Arjuna on the chariot",
    title_hi: "रथ पर कृष्ण और अर्जुन",
    made: "ink on paper, India, 18th to 19th century",
    made_hi: "काग़ज़ पर स्याही, भारत, 18वीं से 19वीं सदी",
    via: "Freer Gallery of Art",
    license: "Public domain",
    page: commons("Krishna and Arjun on the chariot, Mahabharata, 18th-19th century, India.jpg"),
  },
  itihasa: {
    title: "Bharata meets Rama at Chitrakoot",
    title_hi: "चित्रकूट में भरत और राम का मिलन",
    made: "painting, c. 1740 to 1750, possibly by Guman",
    made_hi: "चित्र, लगभग 1740 से 1750, संभवतः गुमान का",
    via: "National Museum, New Delhi",
    license: "Public domain",
    page: commons("Bharata meets Rama in Chitrakoot.jpg"),
  },
  "indus-vedic": {
    title: "The Priest-King of Mohenjo-daro",
    title_hi: "मोहनजोदड़ो का पुरोहित-राजा",
    made: "museum cast of the Indus sculpture",
    made_hi: "सिंधु मूर्ति की संग्रहालय प्रतिकृति",
    via: "photo Umair Shaikh",
    license: "CC BY-SA 2.0",
    page: commons("King Priest, Pakistan.jpg"),
  },
  maurya: {
    title: "The Lion Capital of Ashoka, Sarnath",
    title_hi: "सारनाथ का अशोक स्तंभ-शीर्ष",
    made: "Mauryan, c. 250 BCE",
    made_hi: "मौर्य काल, लगभग 250 ईसा पूर्व",
    via: "photo Chrisi1964",
    license: "CC BY-SA 4.0",
    page: commons("Sarnath capital.jpg"),
  },
  classical: {
    title: "The preaching Buddha of Sarnath",
    title_hi: "सारनाथ के उपदेश देते बुद्ध",
    made: "Gupta period, c. 475",
    made_hi: "गुप्त काल, लगभग 475",
    via: "Sarnath Museum, photo Tevaprapas Makklay",
    license: "CC BY-SA 3.0",
    page: commons("Buddha in Sarnath Museum (Dhammajak Mutra).jpg"),
  },
  medieval: {
    title: "Shiva as the Lord of Dance",
    title_hi: "नटराज शिव",
    made: "Chola bronze, Tamil Nadu, c. 950 to 1000",
    made_hi: "चोल कांस्य, तमिलनाडु, लगभग 950 से 1000",
    via: "Los Angeles County Museum of Art",
    license: "Public domain",
    page: commons("Shiva as the Lord of Dance LACMA edit.jpg"),
  },
  mughal: {
    title: "The Taj Mahal, Agra",
    title_hi: "ताज महल, आगरा",
    made: "built under Shah Jahan",
    made_hi: "शाहजहाँ के समय बना",
    via: "photo Dhirad, edited by J. A. Knudsen",
    license: "CC BY-SA 3.0",
    page: commons("Taj Mahal in March 2004.jpg"),
  },
  company: {
    title: "Clive meeting Mir Jafar after Plassey",
    title_hi: "प्लासी के बाद क्लाइव और मीर जाफ़र",
    made: "Francis Hayman, c. 1760",
    made_hi: "फ़्रांसिस हेमैन, लगभग 1760",
    via: "National Portrait Gallery, London",
    license: "Public domain",
    page: commons("Lord Clive meeting with Mir Jafar after the Battle of Plassey.jpg"),
  },
  raj: {
    title: "Gandhi in London",
    title_hi: "लंदन में गांधी",
    made: "studio photograph, 1931",
    made_hi: "स्टूडियो तस्वीर, 1931",
    via: "Elliott & Fry",
    license: "Public domain",
    page: commons("Mahatma-Gandhi, studio, 1931.jpg"),
  },
  republic: {
    title: "Nehru signing the Constitution",
    title_hi: "संविधान पर हस्ताक्षर करते नेहरू",
    made: "photograph, New Delhi, 24 January 1950",
    made_hi: "तस्वीर, नई दिल्ली, 24 जनवरी 1950",
    via: "Wikimedia Commons",
    license: "Public domain in India",
    page: commons("Jawaharlal Nehru signing the Constitution of India, New Delhi, 24 January 1950.jpg"),
  },
};
