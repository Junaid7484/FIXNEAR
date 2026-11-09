const axios = require("axios");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const CACHE_TTL = 24 * 60 * 60 * 1000;
const cache = new Map();

let lastRequestAt = 0;
let requestQueue = Promise.resolve();

// Keep requests to the public Nominatim server at or below
// one request per second for this running backend process.
async function nominatimRequest(url, params) {
  const task = requestQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastRequestAt));

    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    lastRequestAt = Date.now();

    const response = await axios.get(url, {
      params,
      timeout: 12000,
      headers: {
        "User-Agent": process.env.NOMINATIM_USER_AGENT,
        "Accept-Language": "en",
      },
    });

    return response.data;
  });

  // Keep the queue usable if a request fails.
  requestQueue = task.catch(() => {});
  return task;
}

function getCached(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() - item.createdAt > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function setCached(key, value) {
  cache.set(key, {
    value,
    createdAt: Date.now(),
  });
}

function validCoordinates(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function makeLocationResult(result) {
  return {
    success: true,
    address: result.display_name,
    location: {
      type: "Point",
      // GeoJSON order is [longitude, latitude].
      coordinates: [Number(result.lon), Number(result.lat)],
    },
    attribution: "© OpenStreetMap contributors",
  };
}

function sendLocationError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

// POST /api/location/reverse
async function reverseGeocode(req, res) {
  try {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);

    if (
      req.body.latitude === undefined ||
      req.body.longitude === undefined ||
      req.body.latitude === "" ||
      req.body.longitude === "" ||
      !validCoordinates(latitude, longitude)
    ) {
      return sendLocationError(
        res,
        400,
        "Valid latitude and longitude are required.",
      );
    }

    const key = `reverse:${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
    const cached = getCached(key);

    if (cached) return res.json(cached);

    const result = await nominatimRequest(`${NOMINATIM_URL}/reverse`, {
      format: "jsonv2",
      lat: latitude,
      lon: longitude,
      addressdetails: 1,
      zoom: 18,
      email: process.env.NOMINATIM_EMAIL || undefined,
    });

    if (!result || !result.display_name || !result.lon || !result.lat) {
      return sendLocationError(
        res,
        404,
        "No address was found for these coordinates. Please enter your address manually.",
      );
    }

    const data = makeLocationResult(result);
    setCached(key, data);

    return res.json(data);
  } catch (error) {
    console.error(
      "Reverse geocoding error:",
      error.response?.status,
      error.response?.data || error.message,
    );

    return sendLocationError(
      res,
      502,
      "Address lookup service is temporarily unavailable. You can enter your address manually.",
    );
  }
}

// POST /api/location/geocode
async function geocodeAddress(req, res) {
  try {
    const address = String(req.body.address || "").trim();

    if (address.length < 3) {
      return sendLocationError(
        res,
        400,
        "Please enter a complete business address.",
      );
    }

    const key = `geocode:${address.toLowerCase()}`;
    const cached = getCached(key);

    if (cached) return res.json(cached);

    const result = await nominatimRequest(`${NOMINATIM_URL}/search`, {
      format: "jsonv2",
      q: address,
      countrycodes: "in",
      limit: 1,
      addressdetails: 1,
      email: process.env.NOMINATIM_EMAIL || undefined,
    });

    if (!Array.isArray(result) || result.length === 0) {
      return sendLocationError(
        res,
        404,
        "Address not found. Add your city, state, and PIN code, then try again.",
      );
    }

    const data = makeLocationResult(result[0]);
    setCached(key, data);

    return res.json(data);
  } catch (error) {
    console.error(
      "Address geocoding error:",
      error.response?.status,
      error.response?.data || error.message,
    );

    return sendLocationError(
      res,
      502,
      "Address lookup service is temporarily unavailable. Please try again later.",
    );
  }
}

module.exports = {
  reverseGeocode,
  geocodeAddress,
};
