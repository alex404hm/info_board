import type { ImportantContact, Instructor } from "@/types"

/**
 * Important contacts displayed on the info board
 */
export const importantContacts: ImportantContact[] = [
  {
    name: "Service Desk",
    role: "Support og adgang",
    phone: "+45 38 17 70 00",
    email: "it-support@tec.dk",
    status: "Tilgængelig",
  },
  {
    name: "Vagtmester",
    role: "Lokaler og praktisk hjælp",
    phone: "+45 61 44 08 90",
    email: "service@tec.dk",
    status: "På campus",
  },
  {
    name: "Studievejledning",
    role: "LUP, ferie og elevforløb",
    phone: "+45 38 17 77 10",
    email: "vejledning@tec.dk",
    status: "Online",
  },
]

/**
 * List of instructors at TEC
 */
export const instructors: Instructor[] = [
  {
    id: "ahm",
    name: "Anders Holm",
    title: "Hovedinstruktør",
    area: "Auto",
    email: "anders.holm@tec.dk",
    phone: "+45 38 17 71 01",
    room: "A-201",
  },
  {
    id: "jso",
    name: "Julie Sorensen",
    title: "Instruktør",
    area: "El og energi",
    email: "julie.sorensen@tec.dk",
    phone: "+45 38 17 71 02",
    room: "B-114",
  },
  {
    id: "mni",
    name: "Mikkel Nielsen",
    title: "Instruktør",
    area: "VVS",
    email: "mikkel.nielsen@tec.dk",
    phone: "+45 38 17 71 03",
    room: "C-016",
  },
  {
    id: "lpe",
    name: "Lene Petersen",
    title: "Instruktør",
    area: "Byggeri",
    email: "lene.petersen@tec.dk",
    phone: "+45 38 17 71 04",
    room: "D-205",
  },
  {
    id: "rje",
    name: "Rasmus Jensen",
    title: "Instruktør",
    area: "Data og IT",
    email: "rasmus.jensen@tec.dk",
    phone: "+45 38 17 71 05",
    room: "E-110",
  },
  {
    id: "smo",
    name: "Sara Moller",
    title: "Instruktør",
    area: "Medie",
    email: "sara.moller@tec.dk",
    phone: "+45 38 17 71 06",
    room: "F-305",
  },
  {
    id: "tch",
    name: "Thomas Christensen",
    title: "Instruktør",
    area: "Industri",
    email: "thomas.christensen@tec.dk",
    phone: "+45 38 17 71 07",
    room: "G-118",
  },
  {
    id: "eka",
    name: "Emma Karlsson",
    title: "Instruktør",
    area: "Smed",
    email: "emma.karlsson@tec.dk",
    phone: "+45 38 17 71 08",
    room: "H-104",
  },
  {
    id: "nfr",
    name: "Niels Frederiksen",
    title: "Instruktør",
    area: "Transport",
    email: "niels.frederiksen@tec.dk",
    phone: "+45 38 17 71 09",
    room: "J-210",
  },
  {
    id: "ido",
    name: "Ida Olsen",
    title: "Instruktør",
    area: "Administration",
    email: "ida.olsen@tec.dk",
    phone: "+45 38 17 71 10",
    room: "K-122",
  },
]
