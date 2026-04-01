import { api } from "./api";

export const uploadAsset = async (file) => {
  const { data } = await api.get("/uploads/cloudinary-signature");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", data.apiKey);
  formData.append("timestamp", data.timestamp);
  formData.append("signature", data.signature);
  formData.append("folder", data.folder);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const uploadData = await uploadResponse.json();
  return uploadData.secure_url;
};

