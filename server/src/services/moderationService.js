const blockedTerms = ["kill yourself", "hate speech", "terror"];

export const moderateContent = (content = "") => {
  const normalized = content.toLowerCase();
  const flagged = blockedTerms.some((term) => normalized.includes(term));

  return {
    flagged,
    reason: flagged ? "Potential abuse detected" : null,
  };
};

