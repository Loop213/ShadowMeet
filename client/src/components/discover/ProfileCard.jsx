import { useState } from "react";
import Button from "../common/Button";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

function ProfileCard() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [bio, setBio] = useState(user?.bio || "");
  const [interests, setInterests] = useState((user?.interests || []).join(", "));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { data } = await api.patch("/users/me", {
      bio,
      interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
      avatarUrl: user?.avatarUrl || "",
    });
    updateUser(data.user);
    setSaving(false);
  };

  return (
    <div className="glass-panel rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Public profile</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{user?.randomUsername}</h3>
      <p className="mt-1 text-sm text-slate-400">Only your anonymous identity is visible to other users.</p>
      <div className="mt-4 space-y-3">
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={280}
          rows={4}
          className="w-full rounded-2xl border border-line bg-slate-900 px-4 py-3 text-sm outline-none"
          placeholder="Write a short anonymous intro..."
        />
        <input
          value={interests}
          onChange={(event) => setInterests(event.target.value)}
          className="w-full rounded-2xl border border-line bg-slate-900 px-4 py-3 text-sm outline-none"
          placeholder="Interests separated by commas"
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

export default ProfileCard;

