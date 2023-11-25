function setValue(selector, value, { parent = document } = {}) {
  parent.getElementById(selector).innerText = value;
}

const dayNames = Array.from(document.getElementsByClassName("dayName"));
const dayValues = Array.from(document.getElementsByClassName("dayValue"));

const getWeather = async (lat, lon, timezone) => {
  const url = `https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&timeformat=unixtime&latitude=${lat}&longitude=${lon}&timezone=${timezone}`;

  const response = await fetch(url);
  const data = await response.json();

  return data;
};

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      getWeather(
        latitude,
        longitude,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      ).then((data) => {
        document.getElementById("main_icon").src = getIconUrl(
          parseCurrentWeather(data).iconCode
        );
        setValue(
          "current_temp",
          parseCurrentWeather(data).currentTemp +
            data.current_units.temperature_2m
        );
        setValue(
          "high_value",
          parseCurrentWeather(data).highTemp + data.current_units.temperature_2m
        );
        setValue(
          "low_value",
          parseCurrentWeather(data).lowTemp + data.current_units.temperature_2m
        );
        setValue(
          "fl_high_value",
          parseCurrentWeather(data).highFeelsLike +
            data.current_units.temperature_2m
        );
        setValue(
          "fl_low_value",
          parseCurrentWeather(data).lowFeelsLike +
            data.current_units.temperature_2m
        );
        setValue(
          "wind_value",
          parseCurrentWeather(data).windSpeed +
            data.current_units.wind_speed_10m
        );
        setValue(
          "precip_value",
          parseCurrentWeather(data).precip + data.daily_units.precipitation_sum
        );

        for (let i = 0; i < data.daily.time.length; i++) {
          const date = new Date(data.daily.time[i] * 1000);
          const dayOfWeek = new Intl.DateTimeFormat(undefined, {
            weekday: "long",
          }).format(date);
          const maxTemperature = data.daily.temperature_2m_max[i];

          const dayNameVal = `${dayOfWeek}`;
          const dayTempVal = `${Math.round(maxTemperature)}${
            data.daily_units.temperature_2m_max
          }`;

          dayNames[i].innerText = dayNameVal;
          dayValues[i].innerText = dayTempVal;
          document.getElementById("location_title").innerText =
            Intl.DateTimeFormat().resolvedOptions().timeZone;

          document.body.classList.remove("blurred");
        }
      });
    },
    (error) => {
      console.error("Error getting geolocation:", error);
    }
  );
} else {
  console.error("Geolocation is not supported in this browser");
}

function parseCurrentWeather({ current, daily }) {
  const {
    temperature_2m: currentTemp,
    wind_speed_10m: windSpeed,
    weather_code: iconCode,
  } = current;
  const {
    temperature_2m_max: [maxTemp],
    temperature_2m_min: [minTemp],
    apparent_temperature_max: [maxFeelsLike],
    apparent_temperature_min: [minFeelsLike],
    precipitation_sum: [precip],
  } = daily;

  return {
    currentTemp: Math.round(currentTemp),
    highTemp: Math.round(maxTemp),
    lowTemp: Math.round(minTemp),
    highFeelsLike: Math.round(maxFeelsLike),
    lowFeelsLike: Math.round(minFeelsLike),
    windSpeed: Math.round(windSpeed),
    precip: precip.toFixed(1),
    iconCode,
  };
}

const ICON_MAP = new Map();

function addMapping(values, icon) {
  values.forEach((value) => {
    ICON_MAP.set(value, icon);
  });
}

addMapping([0, 1], "sun");
addMapping([2], "cloud-sun");
addMapping([3], "cloud");
addMapping([45, 48], "smog");
addMapping(
  [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  "cloud-showers-heavy"
);
addMapping([71, 73, 75, 77, 85, 86], "snowflake");
addMapping([95, 96, 99], "cloud-bolt");

function getIconUrl(iconCode) {
  return `./img/${ICON_MAP.get(iconCode)}.svg`;
}
