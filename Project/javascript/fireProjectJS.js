var map = L.map('mapid').setView([42.5065, 27.4729], 13); 

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


L.marker([42.5065, 27.4729]).addTo(map)
    .bindPopup('A pretty little map of Burgas.')
    .openPopup();

function toggleColorMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('colorMode', isDark ? 'dark' : 'light');
}

// Apply saved mode on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode === 'dark') {
        document.body.classList.add('dark-mode');
    }
});
