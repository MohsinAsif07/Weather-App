
"use strict";

// STEP 1: Select HTML elements
const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const searchButton = document.querySelector("#searchButton");
const searchButtonText = document.querySelector("#searchButtonText");
const searchSpinner = document.querySelector("#searchSpinner");

const statusMessage = document.querySelector("#statusMessage");
const emptyState = document.querySelector("#emptyState");
const weatherPanel = document.querySelector("#weatherPanel");
const forecastList = document.querySelector("#forecastList");

let activeController = null;


// STEP 2: Fetch JSON data from API
async function fetchJSON(url, signal) {

    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}. Please try again.`);
    }

    return response.json();
}


// STEP 3: Find city coordinates
async function findCity(cityName, signal) {

    const params = new URLSearchParams({
        name: cityName,
        count: "1",
        language: "en",
        format: "json"
    });

    const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;

    const data = await fetchJSON(url, signal);

    if (!Array.isArray(data.results) || data.results.length === 0) {
        throw new Error(`No city found for "${cityName}". Please check the spelling.`);
    }

    return data.results[0];
}


// STEP 4: Get current weather and five-day forecast
async function getWeather(latitude, longitude, signal) {

    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),

        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",

        daily: "weather_code,temperature_2m_max,temperature_2m_min",

        timezone: "auto",
        forecast_days: "5",
        temperature_unit: "celsius",
        wind_speed_unit: "kmh"
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params}`;

    const weatherData = await fetchJSON(url, signal);

    if (!weatherData.current || !weatherData.daily || !Array.isArray(weatherData.daily.time)) {
        throw new Error("Weather data is unavailable right now. Please try later.");
    }

    return weatherData;
}


// STEP 5: Get weather description and icon
function getWeatherInfo(code, isDay = true) {

    if (code === 0) {
        return { description: "Clear sky", icon: isDay ? "☀️" : "🌙" };
    }

    if (code === 1) {
        return { description: "Mainly clear", icon: isDay ? "🌤️" : "🌙" };
    }

    if (code === 2) {
        return { description: "Partly cloudy", icon: "⛅" };
    }

    if (code === 3) {
        return { description: "Overcast", icon: "☁️" };
    }

    if ([45, 48].includes(code)) {
        return { description: "Foggy", icon: "🌫️" };
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return { description: "Drizzle", icon: "🌦️" };
    }

    if ([61, 63, 65, 66, 67].includes(code)) {
        return { description: "Rainy", icon: "🌧️" };
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return { description: "Snowy", icon: "❄️" };
    }

    if ([80, 81, 82].includes(code)) {
        return { description: "Rain showers", icon: "🌦️" };
    }

    if ([95, 96, 99].includes(code)) {
        return { description: "Thunderstorm", icon: "⛈️" };
    }

    return { description: "Weather conditions", icon: "🌤️" };
}


// STEP 6: Format forecast date
function formatForecastDate(dateString, options) {

    return new Intl.DateTimeFormat("en-US", options).format(
        new Date(`${dateString}T12:00:00`)
    );
}


// Show loading and error messages
function setStatus(message, isError = false) {

    statusMessage.textContent = message;
    statusMessage.classList.toggle("is-error", isError);
    statusMessage.hidden = !message;
}


// Show loading spinner
function setLoading(isLoading) {

    searchButton.disabled = isLoading;

    searchButtonText.textContent = isLoading ? "Loading..." : "Get weather";

    searchSpinner.hidden = !isLoading;

    searchForm.setAttribute("aria-busy", String(isLoading));
}


// Update HTML text
function setText(selector, value) {

    document.querySelector(selector).textContent = value;
}


// STEP 7: Display weather on website
function showWeather(city, data) {

    const current = data.current;

    const isDay = current.is_day === 1;

    const condition = getWeatherInfo(current.weather_code, isDay);


    // Current weather information
    setText("#current-heading", city.name);

    setText(
        "#countryName",
        [city.admin1, city.country].filter(Boolean).join(", ")
    );

    setText(
        "#localTime",
        `${(current.time || "").split("T")[1] || "Now"} local`
    );

    setText("#temperature", `${Math.round(current.temperature_2m)}°`);

    setText("#weatherDescription", condition.description);

    setText("#feelsLike", `${Math.round(current.apparent_temperature)}°C`);

    setText("#conditionSummary", `${condition.description} in ${city.name} today`);

    setText("#humidity", `${Math.round(current.relative_humidity_2m)}%`);

    setText("#windSpeed", `${Math.round(current.wind_speed_10m)} km/h`);

    setText("#precipitation", `${current.precipitation} mm`);

    setText("#weatherIcon", condition.icon);

    document.querySelector("#weatherIcon").setAttribute(
        "aria-label",
        condition.description
    );

    document.body.dataset.theme = isDay ? "day" : "night";


    // Five-day forecast
    forecastList.replaceChildren();

    const days = data.daily.time;

    days.forEach((date, index) => {

        const info = getWeatherInfo(data.daily.weather_code[index]);

        const article = document.createElement("article");

        article.className = "forecast-day";


        const dayName = document.createElement("p");

        dayName.className = "forecast-name";

        dayName.textContent = index === 0
            ? "Today"
            : formatForecastDate(date, { weekday: "short" });


        const calendarDate = document.createElement("p");

        calendarDate.className = "forecast-date";

        calendarDate.textContent = formatForecastDate(date, {
            month: "short",
            day: "numeric"
        });


        const icon = document.createElement("p");

        icon.className = "forecast-icon";

        icon.textContent = info.icon;

        icon.setAttribute("role", "img");

        icon.setAttribute("aria-label", info.description);


        const description = document.createElement("p");

        description.className = "forecast-condition";

        description.textContent = info.description;


        const temps = document.createElement("div");

        temps.className = "forecast-temps";


        const high = document.createElement("span");

        high.textContent = `${Math.round(data.daily.temperature_2m_max[index])}°`;


        const low = document.createElement("span");

        low.className = "forecast-low";

        low.textContent = `${Math.round(data.daily.temperature_2m_min[index])}°`;


        temps.append(high, low);

        article.append(dayName, calendarDate, icon, description, temps);

        forecastList.append(article);

    });


    emptyState.hidden = true;

    weatherPanel.hidden = false;

}


// STEP 8: Main weather search function
async function searchWeather(cityName) {

    const cleanCity = cityName.trim();

    if (!cleanCity) {

        setStatus("Please enter a city name.", true);

        cityInput.focus();

        return;
    }


    // Cancel previous search if it is still running
    if (activeController) {
        activeController.abort();
    }

    const controller = new AbortController();

    activeController = controller;


    setLoading(true);

    setStatus(`Finding weather for ${cleanCity}...`);


    try {

        // First find city coordinates
        const city = await findCity(cleanCity, controller.signal);

        // Then get weather using coordinates
        const weather = await getWeather(
            city.latitude,
            city.longitude,
            controller.signal
        );

        // Display weather
        showWeather(city, weather);

        setStatus("");

    } catch (error) {

        if (error.name !== "AbortError") {

            setStatus(
                error.message || "Something went wrong. Please try again.",
                true
            );

        }

    } finally {

        if (activeController === controller) {

            setLoading(false);

            activeController = null;

        }

    }

}


// STEP 9: Search form event
searchForm.addEventListener("submit", function(event) {

    event.preventDefault();

    searchWeather(cityInput.value);

});


// STEP 10: Popular city buttons
document.querySelectorAll(".city-chip").forEach(function(button) {

    button.addEventListener("click", function() {

        cityInput.value = button.dataset.city;

        searchWeather(cityInput.value);

    });

});


// STEP 11: Show Karachi weather when website opens
cityInput.value = "Karachi";

searchWeather("Karachi");
