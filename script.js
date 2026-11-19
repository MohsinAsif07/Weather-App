let form = document.getElementById("searchForm");
let input = document.getElementById("cityInput");
let btn = document.getElementById("searchBtn");
let msg = document.getElementById("msg");
let empty = document.getElementById("empty");
let panel = document.getElementById("panel");
let daysBox = document.getElementById("days");

async function getCity(cityName) {
  let res = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + cityName + "&count=1&language=en&format=json");
  let data = await res.json();
  if (!data.results) {
    throw new Error("City nahi mili");
  }
  return data.results[0];
}

async function getWeather(lat, lon) {
  let url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5";
  let res = await fetch(url);
  let data = await res.json();
  return data;
}

function getInfo(code, isDay) {
  if (code == 0) return ["Clear sky", isDay ? "☀️" : "🌙"];
  if (code == 1) return ["Mainly clear", "🌤️"];
  if (code == 2) return ["Partly cloudy", "⛅"];
  if (code == 3) return ["Overcast", "☁️"];
  if (code == 45 || code == 48) return ["Foggy", "🌫️"];
  if (code >= 51 && code <= 57) return ["Drizzle", "🌦️"];
  if (code >= 61 && code <= 67) return ["Rainy", "🌧️"];
  if (code >= 71 && code <= 77) return ["Snowy", "❄️"];
  if (code >= 80 && code <= 82) return ["Rain showers", "🌦️"];
  if (code >= 95) return ["Thunderstorm", "⛈️"];
  return ["Weather", "🌤️"];
}

function show(city, data) {
  let cur = data.current;
  let info = getInfo(cur.weather_code, cur.is_day == 1);

  document.getElementById("cityName").innerText = city.name;
  document.getElementById("countryName").innerText = city.admin1 + ", " + city.country;
  document.getElementById("localTime").innerText = cur.time.split("T")[1] + " local";
  document.getElementById("temp").innerText = Math.round(cur.temperature_2m) + "°";
  document.getElementById("desc").innerText = info[0];
  document.getElementById("icon").innerText = info[1];
  document.getElementById("feels").innerText = Math.round(cur.apparent_temperature) + "°C";
  document.getElementById("summary").innerText = info[0] + " in " + city.name + " today";
  document.getElementById("hum").innerText = Math.round(cur.relative_humidity_2m) + "%";
  document.getElementById("wind").innerText = Math.round(cur.wind_speed_10m) + " km/h";
  document.getElementById("rain").innerText = cur.precipitation + " mm";

  daysBox.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    let date = new Date(data.daily.time[i] + "T12:00:00");
    let dayName = "Today";
    if (i != 0) {
      dayName = date.toLocaleDateString("en", { weekday: "short" });
    }
    let dateText = date.toLocaleDateString("en", { month: "short", day: "numeric" });
    let dinfo = getInfo(data.daily.weather_code[i], true);

    daysBox.innerHTML += `
      <div class="day">
        <p><b>${dayName}</b></p>
        <p class="date">${dateText}</p>
        <p class="big">${dinfo[1]}</p>
        <p>${dinfo[0]}</p>
        <p><b>${Math.round(data.daily.temperature_2m_max[i])}°</b> <span>${Math.round(data.daily.temperature_2m_min[i])}°</span></p>
      </div>`;
  }

  empty.hidden = true;
  panel.hidden = false;
}

async function search(cityName) {
  let city = cityName.trim();
  if (city == "") {
    msg.hidden = false;
    msg.innerText = "Please enter a city name.";
    return;
  }

  btn.disabled = true;
  btn.innerText = "Loading...";
  msg.hidden = false;
  msg.innerText = "Finding weather for " + city + "...";

  try {
    let c = await getCity(city);
    let w = await getWeather(c.latitude, c.longitude);
    show(c, w);
    msg.hidden = true;
  } catch (e) {
    msg.hidden = false;
    msg.innerText = e.message;
  }

  btn.disabled = false;
  btn.innerText = "Get weather ↗";
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  search(input.value);
});

let chips = document.querySelectorAll(".chips button");
for (let i = 0; i < chips.length; i++) {
  chips[i].addEventListener("click", function () {
    input.value = chips[i].dataset.city;
    search(chips[i].dataset.city);
  });
}

input.value = "Karachi";
search("Karachi");
