// Indicatifs internationaux (codes d'appel) par nom de pays (français).
export const DIAL_BY_COUNTRY = {
  "Afghanistan": "93", "Afrique du Sud": "27", "Albanie": "355", "Algérie": "213",
  "Allemagne": "49", "Andorre": "376", "Angola": "244", "Arabie Saoudite": "966",
  "Argentine": "54", "Arménie": "374", "Australie": "61", "Autriche": "43",
  "Azerbaïdjan": "994", "Bahamas": "1242", "Bangladesh": "880", "Barbade": "1246",
  "Belgique": "32", "Belize": "501", "Bénin": "229", "Bhoutan": "975",
  "Biélorussie": "375", "Bolivie": "591", "Bosnie-Herzégovine": "387",
  "Botswana": "267", "Brésil": "55", "Brunei": "673", "Bulgarie": "359",
  "Burkina Faso": "226", "Burundi": "257", "Cambodge": "855", "Cameroun": "237",
  "Canada": "1", "Cap-Vert": "238", "Chili": "56", "Chine": "86", "Chypre": "357",
  "Colombie": "57", "Comores": "269", "Congo": "242", "Corée du Nord": "850",
  "Corée du Sud": "82", "Costa Rica": "506", "Côte d'Ivoire": "225",
  "Croatie": "385", "Cuba": "53", "Danemark": "45", "Djibouti": "253",
  "Dominique": "1767", "Égypte": "20", "Émirats arabes unis": "971",
  "Équateur": "593", "Érythrée": "291", "Espagne": "34", "Estonie": "372",
  "Eswatini": "268", "États-Unis": "1", "Éthiopie": "251", "Fidji": "679",
  "Finlande": "358", "France": "33", "Gabon": "241", "Gambie": "220",
  "Géorgie": "995", "Ghana": "233", "Grèce": "30", "Grenade": "1473",
  "Guatemala": "502", "Guinée": "224", "Guinée-Bissau": "245",
  "Guinée équatoriale": "240", "Guyana": "592", "Haïti": "509", "Honduras": "504",
  "Hongrie": "36", "Inde": "91", "Indonésie": "62", "Iran": "98", "Iraq": "964",
  "Irlande": "353", "Islande": "354", "Israël": "972", "Italie": "39",
  "Jamaïque": "1876", "Japon": "81", "Jordanie": "962", "Kazakhstan": "7",
  "Kenya": "254", "Kirghizistan": "996", "Kiribati": "686", "Koweït": "965",
  "Laos": "856", "Lesotho": "266", "Lettonie": "371", "Liban": "961",
  "Liberia": "231", "Libye": "218", "Liechtenstein": "423", "Lituanie": "370",
  "Luxembourg": "352", "Macédoine du Nord": "389", "Madagascar": "261",
  "Malaisie": "60", "Malawi": "265", "Maldives": "960", "Mali": "223",
  "Malte": "356", "Maroc": "212", "Maurice": "230", "Mauritanie": "222",
  "Mexique": "52", "Micronésie": "691", "Moldavie": "373", "Monaco": "377",
  "Mongolie": "976", "Monténégro": "382", "Mozambique": "258", "Namibie": "264",
  "Nauru": "674", "Népal": "977", "Nicaragua": "505", "Niger": "227",
  "Nigeria": "234", "Niue": "683", "Norvège": "47", "Nouvelle-Zélande": "64",
  "Oman": "968", "Ouganda": "256", "Ouzbékistan": "998", "Pakistan": "92",
  "Palaos": "680", "Panama": "507", "Papouasie-Nouvelle-Guinée": "675",
  "Paraguay": "595", "Pays-Bas": "31", "Pérou": "51", "Philippines": "63",
  "Pologne": "48", "Portugal": "351", "Qatar": "974",
  "République centrafricaine": "236",
  "République démocratique du Congo": "243",
  "République dominicaine": "1809", "République tchèque": "420",
  "Roumanie": "40", "Royaume-Uni": "44", "Russie": "7", "Rwanda": "250",
  "Saint-Marin": "378", "Saint-Vincent-et-les-Grenadines": "1784",
  "Salomon": "677", "Salvador": "503", "Samoa": "685",
  "São Tomé-et-Principe": "239", "Sénégal": "221", "Serbie": "381",
  "Seychelles": "248", "Sierra Leone": "232", "Singapour": "65",
  "Slovaquie": "421", "Slovénie": "386", "Somalie": "252", "Soudan": "249",
  "Soudan du Sud": "211", "Sri Lanka": "94", "Suède": "46", "Suisse": "41",
  "Suriname": "597", "Syrie": "963", "Tadjikistan": "992", "Tanzanie": "255",
  "Tchad": "235", "Thaïlande": "66", "Timor oriental": "670", "Togo": "228",
  "Tonga": "676", "Trinité-et-Tobago": "1868", "Tunisie": "216",
  "Turkménistan": "993", "Turquie": "90", "Tuvalu": "688", "Ukraine": "380",
  "Uruguay": "598", "Vanuatu": "678", "Vatican": "39", "Venezuela": "58",
  "Vietnam": "84", "Yémen": "967", "Zambie": "260", "Zimbabwe": "263",
};

// Groupes de chiffres du numéro national (longueurs de chaque bloc).
export const GROUPS_BY_COUNTRY = {
  "France": [1, 2, 2, 2, 2],        // ex. +33 2 23 23 22 22
  "Madagascar": [2, 2, 3, 2],         // ex. +261 34 25 265 25
};

export function dialFor(country) {
  return DIAL_BY_COUNTRY[country] || "";
}

function applyGroups(national, groups) {
  const out = [];
  let i = 0;
  let g = 0;
  while (i < national.length) {
    const len = g < groups.length ? groups[g] : 2;
    out.push(national.slice(i, i + len));
    i += len;
    g++;
  }
  return out.join(" ");
}

// Formate le numéro selon le pays sélectionné (indicatif + groupes nationaux).
export function formatPhoneFor(country, raw) {
  const dial = dialFor(country);
  const allDigits = (raw || "").replace(/[^\d]/g, "");
  if (!dial) {
    // Aucun pays connu : format générique + puis groupes de 2.
    const d = allDigits;
    if (!d) return "+";
    const groups = [];
    let i = 0;
    if (d.length % 2 === 1) {
      groups.push(d[0]);
      i = 1;
    }
    for (; i < d.length; i += 2) groups.push(d.slice(i, i + 2));
    return "+" + groups.join(" ");
  }
  let national = allDigits.startsWith(dial) ? allDigits.slice(dial.length) : allDigits;
  const groups = GROUPS_BY_COUNTRY[country] || [2];
  const grouped = applyGroups(national, groups);
  return "+" + dial + (grouped ? " " + grouped : "");
}