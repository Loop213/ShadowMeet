const adjectives = [
  "Cool",
  "Velvet",
  "Midnight",
  "Cosmic",
  "Electric",
  "Lucky",
  "Neon",
  "Wild",
  "Golden",
  "Radiant",
];

const animals = [
  "Tiger",
  "Falcon",
  "Otter",
  "Phoenix",
  "Panther",
  "Fox",
  "Wolf",
  "Lynx",
  "Dolphin",
  "Panda",
];

export const buildCandidateUsername = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${adjective}${animal}${suffix}`;
};

