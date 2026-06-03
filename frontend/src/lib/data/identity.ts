const AGENT_NAMES = [
  "Aaliyah Alvarez",
  "Adrian Bennett",
  "Bella Chen",
  "Caleb Desai",
  "Danica El-Sayed",
  "Elias Fletcher",
  "Farah Gupta",
  "Gianna Hassan",
  "Hugo Iqbal",
  "Imani Johnson",
  "Jalen Khan",
  "Keira Laurent",
  "Lucian Morales",
  "Mireya Nakamura",
  "Nadia Osei",
  "Omar Patel",
  "Priya Quinn",
  "Rowan Rivera",
  "Samir Silva",
  "Talia Thompson",
  "Valeria Ueda",
  "Wen Vasquez",
  "Xavier Williams",
  "Yara Zhao",
  "Zuri Anderson",
  "Amir Bose",
  "Leila Chowdhury",
  "Noah Diaz",
];

export const AGENT_ROSTER_SIZE = 28;

export function buildAgentName(index: number) {
  if (index < AGENT_NAMES.length) return AGENT_NAMES[index];
  const base = AGENT_NAMES[index % AGENT_NAMES.length];
  return `${base} ${Math.floor(index / AGENT_NAMES.length) + 2}`;
}

export function formatCallId(index: number) {
  return `CALL_${String(index + 1).padStart(4, "0")}`;
}

export function normalizeCallId(value: string) {
  return value.toUpperCase();
}
