export const formatTime = (value) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export const buildDmId = (userA, userB) => [userA, userB].sort().join(":");

