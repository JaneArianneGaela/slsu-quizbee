export type Officer = {
  name: string;
  role: string;
  /** file name in /public/officers (without folder) */
  photo: string;
  /** optional small badge shown under the role */
  note?: string;
};

export type OfficerGroup = {
  id: "advisers" | "exec" | "comm" | "col";
  title: string;
  members: Officer[];
};

export const OFFICER_GROUPS: OfficerGroup[] = [
  {
    id: "advisers",
    title: "Advisers",
    members: [
      { name: "Ms. Geraldine C. Bacagan", role: "Adviser", photo: "geraldine-c-bacagan.jpg" },
      { name: "Mr. Zoren P. Mabunga", role: "Co-Adviser", photo: "zoren-p-mabunga.jpg" },
    ],
  },
  {
    id: "exec",
    title: "Executive Officers",
    members: [
      {
        name: "Jane Arianne A. Gaela",
        role: "President",
        photo: "jane-arianne-a-gaela.jpg",
        note: "★ Developer of this app",
      },
      { name: "Sydric D. Eleazar", role: "VP · Internal Affairs", photo: "sydric-d-eleazar.jpg" },
      { name: "Raphael S. Lunar", role: "VP · External Affairs", photo: "raphael-s-lunar.jpg" },
      { name: "Nhadine A. Angeles", role: "Executive Secretary", photo: "nhadine-a-angeles.jpg" },
      { name: "Jhasmine N. Bungubung", role: "Secretary · Internal", photo: "jhasmine-n-bungubung.jpg" },
      { name: "Jazthyne L. Alpay", role: "Secretary · External", photo: "jazthyne-l-alpay.jpg" },
      { name: "Jessie V. Panganiban", role: "Treasurer", photo: "jessie-v-panganiban.jpg" },
      { name: "Ace Erick F. Perlas", role: "Auditor", photo: "ace-erick-f-perlas.jpg" },
    ],
  },
  {
    id: "comm",
    title: "Committee Heads",
    members: [
      { name: "Cailee P. Villasanta", role: "Education & Research Head", photo: "cailee-p-villasanta.jpg" },
      { name: "Jedrick Angelo L. Manaog", role: "Events & Logistics Head", photo: "jedrick-angelo-l-manaog.jpg" },
      { name: "Annielene Faye D. De Veluz", role: "Health & Environment Head", photo: "annielene-faye-d-de-veluz.jpg" },
      { name: "Sofia Lizbeth R. Cada", role: "Publicity & Media Head", photo: "sofia-lizbeth-r-cada.jpg" },
      { name: "Vance Leuther Q. Labso", role: "Technical Head", photo: "vance-leuther-q-labso.jpg" },
      { name: "Andrea Nicole C. Fernandez", role: "Documentation Head", photo: "andrea-nicole-c-fernandez.jpg" },
      { name: "Louisiana A. Valerio", role: "Membership & Disciplinary Head", photo: "louisiana-a-valerio.jpg" },
    ],
  },
  {
    id: "col",
    title: "College Representatives",
    members: [
      { name: "Dion Edrick C. Ignacio", role: "CAG Representative", photo: "dion-edrick-c-ignacio.jpg" },
      { name: "Ernest Jonel F. Capco", role: "CAS Representative", photo: "ernest-jonel-f-capco.jpg" },
      { name: "Renzo Ruiz M. Taladtad", role: "CEN Representative", photo: "renzo-ruiz-m-taladtad.jpg" },
      { name: "Kharl Christian D. Dirain", role: "CIT Representative", photo: "kharl-christian-d-dirain.jpg" },
      { name: "Jhowella Mariz S. Jornales", role: "CTE Representative", photo: "jhowella-mariz-s-jornales.jpg" },
      { name: "Adrienne Renee C. Aguila", role: "Satellite Campus Representative", photo: "adrienne-renee-c-aguila.jpg" },
    ],
  },
];