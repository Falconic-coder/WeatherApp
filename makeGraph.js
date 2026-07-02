let hourlyChart = null;

export function makeHourlyChart(temperatures) {
  const ctx = document.getElementById("hourlyChart");

  if (hourlyChart) {
    hourlyChart.destroy();
  }

  hourlyChart = new Chart(ctx, {
    type: "line",

    data: {
      // Create an empty label for each temperature
      labels: Array(temperatures.length).fill(""),

      datasets: [
        {
          data: temperatures,

          borderColor: "#3B82F6",
          borderWidth: 3,
          tension: 1,

          fill: false,

          pointRadius: 5,
          pointHoverRadius: 7,

          pointBackgroundColor: "#3B82F6",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          displayColors: false,
        },
      },

      scales: {
        x: {
          display: false,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },

        y: {
          display: false,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
      },

      elements: {
        line: {
          cubicInterpolationMode: "monotone",
        },
      },
    },
  });
}