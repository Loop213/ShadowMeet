import { nanoid } from "nanoid";

const waitingQueue = [];
const activeSessions = new Map();

const normalizeInterests = (interests = []) =>
  interests.map((interest) => `${interest}`.trim().toLowerCase()).filter(Boolean);

const overlap = (a = [], b = []) => {
  const left = new Set(normalizeInterests(a));
  return normalizeInterests(b).filter((item) => left.has(item));
};

const isCompatible = (candidate, seeker, blockedMap) => {
  if (candidate.userId === seeker.userId) return false;
  if (candidate.mode !== seeker.mode) return false;
  if (blockedMap.get(candidate.userId)?.has(seeker.userId)) return false;
  if (blockedMap.get(seeker.userId)?.has(candidate.userId)) return false;
  if (seeker.genderFilter && seeker.genderFilter !== "any" && candidate.gender !== seeker.genderFilter) {
    return false;
  }
  return true;
};

export const createMatchmakingService = () => {
  const blockedMap = new Map();

  const setBlockedUsers = (userId, blockedUserIds = []) => {
    blockedMap.set(`${userId}`, new Set(blockedUserIds.map((item) => `${item}`)));
  };

  const removeFromQueue = (userId) => {
    const index = waitingQueue.findIndex((entry) => entry.userId === `${userId}`);
    if (index >= 0) waitingQueue.splice(index, 1);
  };

  const findPartner = ({ userId, interests = [], mode = "text", gender = "", genderFilter = "any" }) => {
    removeFromQueue(userId);

    const seeker = {
      queueId: nanoid(),
      userId: `${userId}`,
      interests: normalizeInterests(interests),
      mode,
      gender,
      genderFilter,
      joinedAt: Date.now(),
    };

    const partnerIndex = waitingQueue.findIndex((candidate) =>
      isCompatible(candidate, seeker, blockedMap)
    );

    if (partnerIndex === -1) {
      waitingQueue.push(seeker);
      return null;
    }

    const partner = waitingQueue.splice(partnerIndex, 1)[0];

    return {
      userA: seeker.userId,
      userB: partner.userId,
      mode: seeker.mode,
      matchedInterests: overlap(seeker.interests, partner.interests),
    };
  };

  const registerSession = (sessionId, userA, userB) => {
    activeSessions.set(`${userA}`, { sessionId, partnerId: `${userB}` });
    activeSessions.set(`${userB}`, { sessionId, partnerId: `${userA}` });
  };

  const clearSession = (userId) => {
    const active = activeSessions.get(`${userId}`);
    if (!active) return null;
    activeSessions.delete(`${userId}`);
    activeSessions.delete(active.partnerId);
    return active;
  };

  const getActiveSessionForUser = (userId) => activeSessions.get(`${userId}`) || null;

  const getQueueSize = () => waitingQueue.length;

  return {
    clearSession,
    findPartner,
    getActiveSessionForUser,
    getQueueSize,
    registerSession,
    removeFromQueue,
    setBlockedUsers,
  };
};
