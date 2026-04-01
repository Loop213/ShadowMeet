export const searchGifs = async (query) => {
  const apiKey = import.meta.env.VITE_GIPHY_API_KEY;
  if (!apiKey || !query) return [];

  const response = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=12&rating=pg-13`
  );
  const data = await response.json();
  return data.data || [];
};

