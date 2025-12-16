let map, heatmap, markerCluster;
let markers = [];
let darkMode = false;

// DARK MODE STYLE
const darkStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
];

// CUSTOM ICONS
const icons = {
  power: "icons/power.png",
  water: "icons/water.png",
  internet: "icons/internet.png",
  roads: "icons/roads.png"
};

// INITIALIZE MAP
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 3.848, lng: 11.502 },
    zoom: 13
  });

  initSearch();
  fetchReports();
}

window.onload = initMap;

// 🔍 SEARCH BAR (PLACES API)
function initSearch() {
  const input = document.getElementById("search");
  const searchBox = new google.maps.places.SearchBox(input);

  searchBox.addListener("places_changed", () => {
    const place = searchBox.getPlaces()[0];
    if (!place.geometry) return;
    map.panTo(place.geometry.location);
    map.setZoom(15);
  });
}

// 🌐 CONNECT TO REAL BACKEND API
function fetchReports() {
  fetch("http://localhost:5000/api/reports") // change to your backend URL
    .then(res => res.json())
    .then(data => loadMarkers(data))
    .catch(() => {
      // fallback sample data
      loadMarkers([
        { type:"power", lat:3.848, lng:11.502, desc:"Blackout", confirms:12 },
        { type:"water", lat:3.855, lng:11.510, desc:"Pipe leak", confirms:4 },
        { type:"internet", lat:3.860, lng:11.520, desc:"MTN down", confirms:9 },
        { type:"roads", lat:3.842, lng:11.498, desc:"Road blocked", confirms:2 }
      ]);
    });
}

// 📍 MARKERS + ANIMATION
function loadMarkers(reports) {
  markers = [];
  const heatData = [];
  document.getElementById("reportList").innerHTML = "";

  reports.forEach(report => {
    const marker = new google.maps.Marker({
      position: { lat: report.lat, lng: report.lng },
      map,
      icon: icons[report.type],
      animation: google.maps.Animation.DROP
    });

    marker.serviceType = report.type;

    const info = new google.maps.InfoWindow({
      content: `<strong>${report.type.toUpperCase()}</strong><br>${report.desc}<br>${report.confirms} confirms`
    });

    marker.addListener("click", () => info.open(map, marker));
    markers.push(marker);

    heatData.push(new google.maps.LatLng(report.lat, report.lng));

    // SIDEBAR LIST
    const div = document.createElement("div");
    div.className = "report";
    div.innerText = `${report.type.toUpperCase()} - ${report.desc}`;
    div.onclick = () => map.panTo(marker.getPosition());
    document.getElementById("reportList").appendChild(div);
  });

  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatData,
    map: null
  });
}

// 🔘 FILTERS
function filterMarkers(type) {
  markers.forEach(m => {
    m.setVisible(type === "all" || m.serviceType === type);
  });
}

// 🔥 HEATMAP
function toggleHeatmap() {
  heatmap.setMap(heatmap.getMap() ? null : map);
}

// 🌙 DARK MODE
function toggleDarkMode() {
  darkMode = !darkMode;
  map.setOptions({ styles: darkMode ? darkStyle : [] });
}