let form = document.getElementById("myForm");
let input = document.getElementById("cityInput");
let msg = document.getElementById("msg");

async function getCityLatLon(city) {
  let res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
  let data = await res.json();

  if (!data.results) {
    throw new Error("City nahi mili, naam sahi likho");
  }
  return data.results[0];
}

async function getMausam(lat, lon) {
  let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
  let res = await fetch(url);
  let data = await res.json();
  return data;
}

function getDesc(code) {
  if (code == 0) return "Saaf Aasman ☀️";
  if (code == 1 || code == 2) return "Halke Baadal ⛅";
  if (code == 3) return "Baadal ☁️";
  if (code == 45 || code == 48) return "Dhund 🌫️";
  if (code >= 51 && code <= 67) return "Barish 🌧️";
  if (code >= 71 && code <= 77) return "Baraf ❄️";
  if (code >= 95) return "Toofan ⛈️";
  return "Mausam";
}

async function showWeather(cityName) {
  let city = cityName.trim();
  if (city == "") {
    msg.innerText = "Pehle city likho";
    return;
  }

  msg.innerText = "Loading...";
  try {
    let cityInfo = await getCityLatLon(city);
    let weather = await getMausam(cityInfo.latitude, cityInfo.longitude);

    document.getElementById("weatherBox").style.display = "block";
    document.getElementById("cityName").innerText = cityInfo.name;
    document.getElementById("country").innerText = cityInfo.country;
    document.getElementById("temp").innerText = Math.round(weather.current.temperature_2m) + "°C";
    document.getElementById("desc").innerText = getDesc(weather.current.weather_code);
    document.getElementById("feels").innerText = Math.round(weather.current.apparent_temperature) + "°C";
    document.getElementById("hum").innerText = weather.current.relative_humidity_2m + "%";
    document.getElementById("wind").innerText = Math.round(weather.current.wind_speed_10m) + " km/h";
    document.getElementById("rain").innerText = weather.current.precipitation + " mm";

    let daysDiv = document.getElementById("days");
    daysDiv.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      let date = new Date(weather.daily.time[i]);
      let dayName = i == 0 ? "Today" : date.toLocaleDateString("en", { weekday: "short" });
      daysDiv.innerHTML += `
        <div class="day-card">
          <b>${dayName}</b><br>
          ${getDesc(weather.daily.weather_code[i])}<br>
          ${Math.round(weather.daily.temperature_2m_max[i])}° / ${Math.round(weather.daily.temperature_2m_min[i])}°
        </div>`;
    }

    msg.innerText = "";
  } catch (err) {
    msg.innerText = err.message;
  }
}

function quickSearch(city) {
  input.value = city;
  showWeather(city);
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  showWeather(input.value);
});

showWeather("Karachi");
