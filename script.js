const apiKey = "121ec5cdb0f8017e3302fcf216316e40"; // REPLACE THIS WITH YOUR API KEY
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q=";
const aqiUrl = "https://api.openweathermap.org/data/2.5/air_pollution?";

const searchBox = document.querySelector(".search-box input");
const searchBtn = document.querySelector(".search-box button");
const weatherIcon = document.querySelector("#icon");
const errorMessage = document.querySelector("#error-message");
const weatherInfo = document.querySelector("#weather-info");
const forecastContainer = document.querySelector("#forecast-container");
const forecastList = document.querySelector("#forecast-list");
const unitToggleBtn = document.querySelector("#unit-toggle");
const unitDisplay = document.querySelector("#unit-display");

let currentUnit = "metric"; // 'metric' for Celsius, 'imperial' for Fahrenheit
let currentCity = "";

async function checkWeather(city) {
    if (!city) return;
    currentCity = city;

    try {
        const response = await fetch(`${apiUrl}${city}&units=${currentUnit}&appid=${apiKey}`);

        if (response.status == 404) {
            errorMessage.style.display = "block";
            weatherInfo.style.display = "none";
            forecastContainer.style.display = "none";
        } else if (response.status == 401) {
            console.warn("API Key invalid. Switching to Demo Mode.");
            showDemoData(city);
            alert("API Key is currently invalid or inactive. Showing DEMO DATA so you can see the design.");
        } else {
            var data = await response.json();
            updateWeatherUI(data);
            getForecast(city);
            getAQI(data.coord.lat, data.coord.lon);
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("Network error. Check console.");
    }
}

async function getForecast(city) {
    try {
        const response = await fetch(`${forecastUrl}${city}&units=${currentUnit}&appid=${apiKey}`);
        const data = await response.json();

        // Filter for one forecast per day (e.g., around 12:00 PM)
        const dailyForecast = data.list.filter(item => item.dt_txt.includes("12:00:00"));
        updateForecastUI(dailyForecast);
    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

async function getAQI(lat, lon) {
    try {
        const response = await fetch(`${aqiUrl}lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const data = await response.json();
        const aqi = data.list[0].main.aqi;
        updateAQIUI(aqi);
    } catch (error) {
        console.error("Error fetching AQI:", error);
        document.querySelector("#aqi").innerHTML = "--";
    }
}

function updateWeatherUI(data) {
    document.querySelector("#temp").innerHTML = Math.round(data.main.temp);
    document.querySelector("#description").innerHTML = data.weather[0].description;
    document.querySelector("#humidity").innerHTML = data.main.humidity + "%";
    document.querySelector("#wind").innerHTML = Math.round(data.wind.speed) + (currentUnit === "metric" ? " km/h" : " mph");
    document.querySelector("#feels-like").innerHTML = Math.round(data.main.feels_like) + "°";

    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    unitDisplay.innerHTML = currentUnit === "metric" ? "°C" : "°F";

    weatherInfo.style.display = "flex";
    errorMessage.style.display = "none";
}

function updateAQIUI(aqi) {
    const aqiElement = document.querySelector("#aqi");
    const aqiLabels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
    aqiElement.innerHTML = aqiLabels[aqi] || aqi;
}

function updateForecastUI(forecastData) {
    forecastList.innerHTML = ""; // Clear previous
    forecastContainer.style.display = "block";

    forecastData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const temp = Math.round(item.main.temp);
        const iconCode = item.weather[0].icon;

        const forecastItem = document.createElement("div");
        forecastItem.classList.add("forecast-item");
        forecastItem.innerHTML = `
            <p class="day">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="icon">
            <p class="temp">${temp}°</p>
        `;
        forecastList.appendChild(forecastItem);
    });
}

function showDemoData(city) {
    // Fake current weather
    const demoData = {
        main: { temp: currentUnit === "metric" ? 22 : 72, humidity: 65, feels_like: currentUnit === "metric" ? 24 : 75 },
        weather: [{ description: "demo clear sky", icon: "01d" }],
        wind: { speed: 5.5 },
        coord: { lat: 0, lon: 0 } // Dummy coords
    };
    updateWeatherUI(demoData);
    updateAQIUI(1); // Demo Good AQI

    // Fake forecast data
    const demoForecast = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    for (let i = 0; i < 5; i++) {
        demoForecast.push({
            dt: Date.now() / 1000 + (i + 1) * 86400, // Next 5 days
            main: { temp: (currentUnit === "metric" ? 20 : 68) + i },
            weather: [{ icon: "02d" }]
        });
    }

    forecastList.innerHTML = "";
    forecastContainer.style.display = "block";

    demoForecast.forEach((item, index) => {
        const forecastItem = document.createElement("div");
        forecastItem.classList.add("forecast-item");
        forecastItem.innerHTML = `
            <p class="day">${days[index]}</p>
            <img src="https://openweathermap.org/img/wn/02d.png" alt="icon">
            <p class="temp">${Math.round(item.main.temp)}°</p>
        `;
        forecastList.appendChild(forecastItem);
    });
}

function toggleUnit() {
    currentUnit = currentUnit === "metric" ? "imperial" : "metric";
    unitToggleBtn.innerHTML = currentUnit === "metric" ? "°C / °F" : "°F / °C";

    if (currentCity) {
        checkWeather(currentCity);
    }
}

searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value);
});

searchBox.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        checkWeather(searchBox.value);
    }
});

unitToggleBtn.addEventListener("click", toggleUnit);
