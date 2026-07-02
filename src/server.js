import { weatherCodes } from "./weatherCode.js";
import { makeHourlyChart } from "./makeGraph.js";
dayjs.extend(window.dayjs_plugin_customParseFormat);

const input = document.getElementById("input");
const suggestions = document.getElementById("suggestions");
let coordinates = JSON.parse(localStorage.getItem("location")) || []; // stores [latitude, longitude, place]
const getLocationBtn = document.getElementById("getLocationBtn");
const searchSection = document.getElementById("search");
const weatherSection = document.getElementsByTagName("section")[0];
let is_night = false;


input.addEventListener("input", async function searchCity() {
  const place = input.value.trim();

  if (place.length < 2) {
    suggestions.classList.add("hidden");
    return;
  }

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${place}&count=5&language=en&format=json`,
  );

  const data = await response.json(); // fetching info

  if (place.length >= 2) suggestions.classList.remove("hidden");

  suggestions.querySelectorAll("p").forEach((item) => item.remove()); // keep clearing the p tags in suggestions div
  if ("results" in data) {
    data.results.forEach((city) => {
      const item = document.createElement("p");
      item.classList.add(
        "text-sm",
        "text-gray-500",
        "py-1",
        "hover:bg-gray-200/80",
        "cursor-pointer",
        "px-4",
        "flex",
        "items-center",
        "gap-3",
      );

      item.innerHTML = `<img src=https://hatscripts.github.io/circle-flags/flags/${city.country_code.toLowerCase()}.svg width="30"> ${city.name}, ${city.country}`;

      suggestions.appendChild(item);

      item.addEventListener("click", async () => {
        input.value = `${city.name}, ${city.country}`;
        suggestions.innerHTML = "";
        suggestions.classList.add("hidden");
        addCordsToArray(city);
        saveToLocalMemory(coordinates);
        await Promise.all([
      AddInfoToCard1(),
      AddInfoToCard2(),
      AddInfoToCard3(),
      AddInfoToCard4(),
    ]);
      });
    });
  }
});

getLocationBtn.addEventListener("click", async()=>{
  await IPlocation();
  await Promise.all([
      AddInfoToCard1(),
      AddInfoToCard2(),
      AddInfoToCard3(),
      AddInfoToCard4(),
    ]);
});

function saveToLocalMemory(info) {
  // Remove only the item with the key 'userToken'
  localStorage.removeItem("location"); 
  localStorage.setItem("location", JSON.stringify(info));
}

function addCordsToArray(arg) {
  coordinates = [];
  coordinates.push(arg.latitude);
  coordinates.push(arg.longitude);
  coordinates.push(input.value);
}

async function IPlocation() {
  const response = await fetch("https://ipapi.co/json");
  const data = await response.json();

  if (!suggestions.classList.contains("hidden"))
    suggestions.classList.add("hidden");
  input.value = `${data.city}, ${data.country_name}`;
  addCordsToArray(data);
  saveToLocalMemory(coordinates);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (coordinates.length == 3) {
    input.value = coordinates[2];
    
    await Promise.all([
      AddInfoToCard1(),
      AddInfoToCard2(),
      AddInfoToCard3(),
      AddInfoToCard4(),
    ]);
  } else { 
    await IPlocation(); // wait to get the IP
    input.value = coordinates[2];
    
    await Promise.all([
      AddInfoToCard1(),
      AddInfoToCard2(),
      AddInfoToCard3(),
      AddInfoToCard4(),
    ]);
  }
});

async function AddInfoToCard1() {
  const firstCard = weatherSection.children[0]; // getting the first card
  const firstCardHtml = loadingSkeleton(firstCard);

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coordinates[0]}&longitude=${coordinates[1]}&daily=sunrise,sunset,uv_index_max,uv_index_clear_sky_max&current=temperature_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code&timezone=auto&forecast_days=1&wind_speed_unit=ms`,
  );
  const data = await response.json();

  firstCard.innerHTML = "";
  firstCard.innerHTML = firstCardHtml;

  const code = data.current.weather_code;
  const is_day = Boolean(data.current.is_day);

  const date = new Date();
  const localTime = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const options = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };

  const formattedDate = date.toLocaleDateString("en-US", options);

  firstCard.children[0].children[1].textContent = coordinates[2]; // Changing the H2 in the first card
  firstCard.children[1].textContent = `${formattedDate} • ${localTime}`; //Adding the Date and time
  firstCard.children[2].children[1].textContent =
    weatherCodes[code].description; // Description of current weather

  // icon for the described weather condition. Different icons for night and day.
  if (is_day) {
    firstCard.children[2].children[0].setAttribute(
      "src",
      `./icons${weatherCodes[code].dayIcon}`,
    );
    firstCard.children[3].children[1].children[0].setAttribute(
      "src",
      `./icons${weatherCodes[code].dayIcon}`,
    );
  } else {
    firstCard.children[2].children[0].setAttribute(
      "src",
      `./icons${weatherCodes[code].nightIcon}`,
    );
    firstCard.children[3].children[1].children[0].setAttribute(
      "src",
      `./icons${weatherCodes[code].nightIcon}`,
    );
    is_night = true;
  }

  const temp_card = firstCard.children[3].children[0];
  temp_card.children[0].children[0].textContent = Math.round(
    data.current.temperature_2m,
  ); // set the temperature
  temp_card.children[1].children[0].textContent = `${Math.round(data.current.apparent_temperature)}°C`; // set the apparent temperature

  const bottom_info = firstCard.children[4];

  // set sunset and sunrise time

  const sunset_time = data.daily.sunset[0].split("T")[1];
  const sunrise_time = data.daily.sunrise[0].split("T")[1];

  bottom_info.children[0].children[2].textContent = `${dayjs(sunrise_time, "HH:mm").format("h:mm A")} `;
  bottom_info.children[1].children[2].textContent = `${dayjs(sunset_time, "HH:mm").format("h:mm A")}`;

  // set uv index
  const uv_index = data.daily.uv_index_max;
  bottom_info.children[2].children[2].textContent = uv_index;

  let uv_index_condition = "";

  if (uv_index <= 2) uv_index_condition = "Low";
  else if (uv_index <= 5) uv_index_condition = "Moderate";
  else if (uv_index <= 7) uv_index_condition = "High";
  else if (uv_index <= 10) uv_index_condition = "Extreme";
  else uv_index_condition = "Critical";

  bottom_info.children[2].children[3].children[0].children[1].children[0].textContent =
    uv_index_condition;
  bottom_info.children[2].children[3].children[0].children[1].children[1].textContent =
    "UV Index: " + uv_index;

  // air quality

  await AirQuality(bottom_info);
}

async function AirQuality(bottom_info) {
  const response = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coordinates[0]}&longitude=${coordinates[1]}&current=us_aqi`,
  );
  const data = await response.json();
  const aqi = data.current.us_aqi;
  bottom_info.children[3].children[2].textContent = aqi;

  let aqi_condition = "";

  if (aqi <= 50) aqi_condition = "Good";
  else if (aqi <= 100) aqi_condition = "Moderate";
  else if (aqi <= 150) aqi_condition = "Sensitive";
  else if (aqi <= 200) aqi_condition = "Unhealthy";
  else if (aqi <= 300) aqi_condition = " evere";
  else aqi_condition = "Hazardous";

  bottom_info.children[3].children[2].title = aqi_condition;

  bottom_info.children[3].children[3].children[0].children[1].children[0].textContent =
    aqi;
  bottom_info.children[3].children[3].children[0].children[1].children[1].textContent =
    "Air Quality: " + aqi_condition;
}

async function AddInfoToCard2() {
  const hourlyForecastContainer = document.getElementById("hourlyForecast");
  const hourlyForescatHtml = loadingSkeleton(hourlyForecastContainer);
  

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coordinates[0]}&longitude=${coordinates[1]}&hourly=wind_speed_10m,temperature_2m,weather_code&timezone=auto&forecast_days=2`,
  );
  const data = await response.json();
  hourlyForecastContainer.innerHTML = "";
  //hourlyForecastContainer.innerHTML = hourlyForescatHtml;

  const time = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
  });

  const hr = "T" + time + ":00";

  let i = 0;
  const times = data.hourly.time;

  for (i = 0; i < times.length; i++) {
    if (times[i].indexOf(hr) != -1) break;
  }


  const temperature_forcast_array = data.hourly.temperature_2m.slice(i, i + 6);
  makeHourlyChart(temperature_forcast_array);


  const weather_code_array = data.hourly.weather_code.slice(i, i + 6);
  const wind_speed_array = data.hourly.wind_speed_10m.slice(i, i + 6);

  for (let j = 0; j < 6; j++) {
    let src = "";
    if (is_night)
      src = "./icons" + weatherCodes[weather_code_array[j]].nightIcon;
    else src = "./icons" + weatherCodes[weather_code_array[j]].dayIcon;

    hourlyForecastContainer.innerHTML += `
            <div
              class="flex flex-col items-center rounded-2xl border border-[#E6EEF8] bg-[#F8FBFF] px-4 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-[0_14px_30px_rgba(59,130,246,0.10)] dark:border-slate-700 dark:bg-[#1A2438] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] dark:hover:border-blue-500/50 dark:hover:bg-[#1F2A42] dark:hover:shadow-[0_14px_30px_rgba(59,130,246,0.15)]"
            >
              <p
                class="text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                ${dayjs(times[j + i].split("T")[1], "HH:mm").format("h:mm A")}
              </p>

              <div class="my-5 flex h-14 items-center justify-center">
                <img
                  src=${src}
                  class="h-14 w-14 object-contain drop-shadow-md"
                />
              </div>

              <p class="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                ${Math.round(data.hourly.temperature_2m[j + i])}°
              </p>

              <div class="mt-5 flex h-14 items-center justify-center flex-col">
                <img
                  src="./icons/wind.png"
                  class="h-6 w-6 object-contain drop-shadow-md"
                />
                <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">${Math.round(wind_speed_array[j])} km/h</p>
              </div>

              
            </div>
    `;
  }

  hourlyForecastContainer.children[0].children[0].innerHTML = `<p
    class="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
  >
    Now
  </p>`;

  hourlyForecastContainer.children[0].className =
    "relative flex flex-col items-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white px-4 py-5 shadow-[0_12px_30px_rgba(59,130,246,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(59,130,246,0.18)] dark:border-blue-500/30 dark:from-blue-500/10 dark:to-[#1A2438] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] dark:hover:border-blue-500/50 dark:hover:shadow-[0_14px_30px_rgba(59,130,246,0.15)]";
}

async function AddInfoToCard3() {
  const card3 = document.getElementById("card3");
  const card3Html = loadingSkeleton(card3);
  const now_time = dayjs().format("YYYY-MM-DDTHH:00");
  
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coordinates[0]}&longitude=${coordinates[1]}&hourly=visibility&current=wind_speed_10m,wind_direction_10m,pressure_msl,relative_humidity_2m&timezone=auto&forecast_days=1`,
  );
  const data = await response.json();

  card3.innerHTML = "";
  card3.innerHTML = card3Html;

  const windSpeedCard = document.getElementById("windSpeedCard");
  const HumidityPerCard = document.getElementById("HumidityPerCard");
  const PressureCard = document.getElementById("PressureCard");
  const VisibilityCard = document.getElementById("VisibilityCard");

  const windSpeed = Math.round(data.current.wind_speed_10m);
  const HumidityPer = Math.round(data.current.relative_humidity_2m);
  const Pressure = Math.round(data.current.pressure_msl);
  const VisibilityArr = data.hourly.visibility;
  const visibility = VisibilityArr[data.hourly.time.indexOf(now_time)] / 1000;

  windSpeedCard.children[1].children[0].textContent = windSpeed + " km/h";
  HumidityPerCard.children[1].children[0].textContent = HumidityPer + "%";
  PressureCard.children[1].children[0].textContent = Pressure + " hPa";
  VisibilityCard.children[1].children[0].textContent =
    Math.round(visibility) + " km";

  // wind speed scale
  const windScale = windSpeedCard.children[1].children[1];

  if (windSpeed < 1) windScale.textContent = "Calm";
  else if (windSpeed <= 5) windScale.textContent = "Light Air";
  else if (windSpeed <= 11) windScale.textContent = "Light Breeze";
  else if (windSpeed <= 19) windScale.textContent = "Gentle Breeze";
  else if (windSpeed <= 28) windScale.textContent = "Moderate Breeze";
  else if (windSpeed <= 38) windScale.textContent = "Fresh Breeze";
  else if (windSpeed <= 49) windScale.textContent = "Strong Breeze";
  else if (windSpeed <= 61) windScale.textContent = "Moderate Gale";
  else if (windSpeed <= 74) windScale.textContent = "Fresh Gale";
  else if (windSpeed <= 88) windScale.textContent = "Strong Gale";
  else if (windSpeed <= 102) windScale.textContent = "Whole Gale";
  else if (windSpeed <= 117) windScale.textContent = "Storm";
  else windScale.textContent = "Hurricane";

  // Humidity scale
  const HumidityScale = HumidityPerCard.children[1].children[1];
  if (HumidityPer < 30) HumidityScale.textContent = "Dry";
  else if (HumidityPer < 50) HumidityScale.textContent = "Ideal";
  else if (HumidityPer < 60) HumidityScale.textContent = "Acceptable";
  else if (HumidityPer < 70) HumidityScale.textContent = "Damp";
  else HumidityScale.textContent = "Saturated";

  // Pressure Scale
  const pressureScale = PressureCard.children[1].children[1];
  if (Pressure < 1010) pressureScale.textContent = "Low";
  else if (Pressure < 1020) pressureScale.textContent = "Moderate";
  else pressureScale.textContent = "High";

  // visibility scale
  const visibilityScale = VisibilityCard.children[1].children[1];
  if (visibility < 2) visibilityScale.textContent = "Hazardous";
  else if (visibility < 10) visibilityScale.textContent = "Low";
  else if (visibility < 30) visibilityScale.textContent = "Good";
  else visibilityScale.textContent = "Excellent";
}

async function AddInfoToCard4() {
  const forecastCard = document.getElementById("forecastCard");
  const forecastCardHtml = loadingSkeleton(forecastCard);
  

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coordinates[0]}&longitude=${coordinates[1]}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto`,
  );
  const data = await response.json();

  forecastCard.innerHTML = "";
  forecastCard.innerHTML = forecastCardHtml;

  const dayMonthArr = data.daily.time.map((item) =>
    dayjs(item).format("ddd<br>D MMM"),
  );
  const weatherImgArr = data.daily.weather_code.map(
    (item) => "./icons" + weatherCodes[item].dayIcon,
  );
  const maxTempArr = data.daily.temperature_2m_max;
  const minTempArr = data.daily.temperature_2m_min;
  const humidityArr = data.daily.precipitation_probability_max;

  let tempDiffPer = [];
  for (let i = 0; i < 7; i++)
    tempDiffPer.push(
      Math.round(((maxTempArr[i] - minTempArr[i]) / maxTempArr[i]) * 100),
    );
  let ReltempDiffPer = tempDiffPer.map(
    (item) => (item += 100 - Math.max(...tempDiffPer)),
  );
  forecastCard.innerHTML = "";

  for (let j = 0; j < 7; j++) {
    forecastCard.innerHTML += `
            <div class="group flex items-center gap-2 sm:gap-4">

  <!-- Day -->
  <div class="w-8 sm:w-10 md:w-14 shrink-0">
    <p class="text-[11px] sm:text-sm text-slate-500">
      ${dayMonthArr[j]}
    </p>
  </div>

  <!-- Icon -->
  <div class="flex w-8 sm:w-10 md:w-14 shrink-0 justify-center">
    <img
      src="${weatherImgArr[j]}"
      class="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain"
    />
  </div>

  <!-- High -->
  <div class="w-8 sm:w-10 md:w-12 shrink-0 text-center">
    <span class="text-sm sm:text-base md:text-lg font-semibold text-slate-700 dark:text-slate-200">
      ${Math.round(maxTempArr[j])}°
    </span>
  </div>

  <!-- Progress -->
  <div class="flex-1 px-1 sm:px-2 md:px-3">
    <div class="h-1.5 sm:h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
      <div
        class="h-full rounded-full bg-linear-to-r from-blue-500 via-purple-500 to-orange-400"
        style="width:${ReltempDiffPer[j]}%"
      ></div>
    </div>
  </div>

  <!-- Low -->
  <div class="w-8 sm:w-10 md:w-12 shrink-0 text-center">
    <span class="text-sm sm:text-base md:text-lg font-semibold text-slate-700 dark:text-slate-200">
      ${Math.round(minTempArr[j])}°
    </span>
  </div>

  <!-- Rain -->
  <div class="flex w-10 sm:w-14 md:w-16 shrink-0 items-center justify-end gap-1 sm:gap-2 text-blue-500">
    <img
      src="./icons/raindrop.png"
      class="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5"
    />

    <span class="text-xs sm:text-sm font-semibold">
      ${humidityArr[j]}%
    </span>
  </div>

</div>
    `;
  }
}


function loadingSkeleton(card2) {
  const card2Html = card2.innerHTML;
  card2.innerHTML = "";
  card2.innerHTML = `<div class="w-full animate-pulse p-7">
    <div class="h-8 w-40 rounded bg-slate-200"></div>

    <div class="mt-8 h-6 w-28 rounded bg-slate-200"></div>

    <div class="mt-8 h-24 w-full rounded bg-slate-200"></div>

    <div class="mt-8 grid grid-cols-4 gap-4">
        <div class="h-16 rounded bg-slate-200"></div>
        <div class="h-16 rounded bg-slate-200"></div>
        <div class="h-16 rounded bg-slate-200"></div>
        <div class="h-16 rounded bg-slate-200"></div>
    </div>
</div>`
  return card2Html;
};