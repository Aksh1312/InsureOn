import logging
from typing import Optional
import httpx

logger = logging.getLogger("uvicorn.error")

CITY_COORDS: dict[str, tuple[float, float]] = {
    "Chennai": (13.0827, 80.2707),
    "Bengaluru": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.6139, 77.2090),
    "Pune": (18.5204, 73.8567),
    "Kolkata": (22.5726, 88.3639),
    "Ahmedabad": (23.0225, 72.5714),
    "Jaipur": (26.9124, 75.7873),
    "Kochi": (9.9312, 76.2673),
    "Bhubaneswar": (20.2961, 85.8245),
    "Visakhapatnam": (17.6868, 83.2185),
    "Surat": (21.1702, 72.8311),
    "Nagpur": (21.1458, 79.0882),
    "Lucknow": (26.8467, 80.9462),
    "Chandigarh": (30.7333, 76.7794),
    "Indore": (22.7196, 75.8577),
}

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

WEATHER_RISK_LEVELS = [
    ("LOW",    0, 10,   "Weather conditions look favorable.",                  "Normal delivery schedule."),
    ("MEDIUM", 10, 30,  "Moderate rainfall expected.",                         "Prefer daytime delivery slots."),
    ("HIGH",   30, 60,  "Heavy rainfall expected.",                            "Avoid peak storm periods."),
    ("SEVERE", 60, None,"Extreme rainfall forecast.",                          "Avoid non-essential delivery shifts."),
]

def _get_risk_level(rainfall_mm: Optional[float]) -> tuple[str, str, str]:
    if rainfall_mm is None:
        return ("UNKNOWN", "Weather data unavailable.", "No recommendation available.")
    for level, lo, hi, summary, recommendation in WEATHER_RISK_LEVELS:
        if lo <= rainfall_mm < (hi if hi is not None else float("inf")):
            return (level, summary, recommendation)
    return ("SEVERE", "Extreme rainfall forecast.", "Avoid non-essential delivery shifts.")


def get_weather_advisory(city: str) -> dict:
    city_clean = city.strip().lower()
    coords = None
    for k, v in CITY_COORDS.items():
        if k.lower() == city_clean:
            coords = v
            break

    # Dynamic geocoding fallback using Open-Meteo Geocoding API
    if not coords:
        try:
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            geo_params = {"name": city, "count": 1, "language": "en", "format": "json"}
            resp = httpx.get(geo_url, params=geo_params, timeout=5.0)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    lat = results[0]["latitude"]
                    lon = results[0]["longitude"]
                    coords = (lat, lon)
                    logger.info("Dynamically geocoded coords for '%s': (%s, %s)", city, lat, lon)
        except Exception as exc:
            logger.warning("Geocoding fallback failed for '%s': %s", city, exc)

    if not coords:
        logger.warning("Unknown city requested: %s", city)
        return {
            "city": city,
            "temperature": None,
            "rainfall_mm": None,
            "risk_level": "UNKNOWN",
            "summary": "Weather data unavailable.",
            "recommendation": "No recommendation available.",
        }

    lat, lon = coords
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m",
        "daily": "precipitation_sum",
        "forecast_days": 1,
        "timezone": "auto",
    }

    try:
        resp = httpx.get(OPEN_METEO_URL, params=params, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.error("Open-Meteo API failure for %s: %s", city, exc)
        return {
            "city": city,
            "temperature": None,
            "rainfall_mm": None,
            "risk_level": "UNKNOWN",
            "summary": "Weather data unavailable.",
            "recommendation": "No recommendation available.",
        }

    temperature = data.get("current", {}).get("temperature_2m")
    daily = data.get("daily", {})
    rainfall_mm = None
    if daily.get("precipitation_sum") and len(daily["precipitation_sum"]) > 0:
        rainfall_mm = daily["precipitation_sum"][0]

    risk_level, summary, recommendation = _get_risk_level(rainfall_mm)

    return {
        "city": city,
        "temperature": temperature,
        "rainfall_mm": rainfall_mm,
        "risk_level": risk_level,
        "summary": summary,
        "recommendation": recommendation,
    }
