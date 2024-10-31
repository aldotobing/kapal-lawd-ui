// Fungsi untuk memuat cuaca dan menampilkan widget dengan efek fade in
async function loadWeather() {
  const weatherWidget = document.getElementById("weather-widget");

  // Misal ambil data cuaca di sini
  // const weatherData = await fetchWeatherData();

  // Setelah data cuaca dimuat, tampilkan widget
  weatherWidget.style.opacity = "1"; // Ubah opasitas menjadi 1 untuk efek fade in
}

// Panggil fungsi loadWeather saat halaman siap
document.addEventListener("DOMContentLoaded", loadWeather);
