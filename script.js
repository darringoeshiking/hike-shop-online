let trails = [];

// DOM elements
const trailList = document.getElementById('trail-list');
const searchInput = document.getElementById('search');
const regionFilter = document.getElementById('region-filter');
const difficultyFilter = document.getElementById('difficulty-filter');
const featureFilters = document.querySelectorAll('#feature-filters input[type="checkbox"]');

// Load trails.json
fetch('trails.json')
  .then(response => response.json())
  .then(data => {
    trails = data;
    displayTrails(trails);
  })
  .catch(err => console.error('Error loading trails.json:', err));

// Display trails
function displayTrails(list) {
  trailList.innerHTML = '';

  list.forEach(trail => {
    const card = document.createElement('div');
    card.className = 'trail-card';

    // Trail Name
    const header = document.createElement('h2');
    header.textContent = trail.trail_name || 'Unnamed Trail';
    header.style.textAlign = 'center';
    card.appendChild(header);

    // Map container with unique ID
    const mapDiv = document.createElement('div');
    mapDiv.style.width = '100%';
    mapDiv.style.height = '200px';
    mapDiv.style.marginBottom = '10px';
    const mapId = 'map-' + Math.random().toString(36).substr(2, 9);
    mapDiv.id = mapId;
    card.appendChild(mapDiv);

    // Trail Info: Region, Difficulty, Length
    const info = document.createElement('p');
    info.textContent = `Region: ${trail.region || 'N/A'} | Difficulty: ${trail.difficulty || 'N/A'} | Length: ${trail.length_miles?.toFixed(1) || 'N/A'} miles`;
    info.style.textAlign = 'center';
    card.appendChild(info);

    // Feature Buttons
    const featuresDiv = document.createElement('div');
    featuresDiv.className = 'features';
    const featureKeys = ['waterfall','overlook_vista','stream_crossing','rock_scramble','wildlife','historic','fall_foliage_favorite','permit'];
    const activeFeatures = featureKeys.filter(f => trail[f]);

    const featureButton = document.createElement('button');
    featureButton.className = 'expand-btn';
    featureButton.textContent = activeFeatures.length > 0 ? 'Show Features' : 'No Features';
    featuresDiv.appendChild(featureButton);

    const featureList = document.createElement('div');
    featureList.className = 'feature-list';
    featureList.style.display = 'none';
    featureList.style.flexWrap = 'wrap';
    featureList.style.justifyContent = 'center';
    featureList.style.gap = '5px';

    activeFeatures.forEach(f => {
      const btn = document.createElement('button');
      btn.textContent = f.replace(/_/g, ' ');
      btn.className = 'feature-tag';
      featureList.appendChild(btn);
    });

    featuresDiv.appendChild(featureList);
    card.appendChild(featuresDiv);

    // Expand/collapse logic
    featureButton.addEventListener('click', () => {
      featureList.style.display = featureList.style.display === 'none' ? 'flex' : 'none';
      featureButton.textContent = featureList.style.display === 'none' ? 'Show Features' : 'Hide Features';
    });

    // Append card first so Leaflet can render properly
    trailList.appendChild(card);

    // Initialize map after card is in DOM
    const lat = parseFloat(trail.trailhead_coordinates_latitude);
    const lng = parseFloat(trail.trailhead_coordinates_longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      requestAnimationFrame(() => {
        const map = L.map(mapId, { scrollWheelZoom: false }).setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Marker at trailhead
        L.marker([lat, lng]).addTo(map).bindPopup(trail.trail_name || '');

        // Load GPX if available
        if (trail.gpx_url) {
          try {
            new L.GPX(trail.gpx_url, {
              async: true,
              marker_options: {
                startIconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                endIconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
              }
            }).on('loaded', function(e) {
              map.fitBounds(e.target.getBounds());
            }).addTo(map);
          } catch (err) {
            console.warn(`Failed to load GPX for ${trail.trail_name}:`, err);
          }
        }
      });
    } else {
      mapDiv.textContent = 'Map not available';
      mapDiv.style.display = 'flex';
      mapDiv.style.justifyContent = 'center';
      mapDiv.style.alignItems = 'center';
      mapDiv.style.color = '#333';
      mapDiv.style.fontWeight = 'bold';
      mapDiv.style.backgroundColor = '#c0c090';
      mapDiv.style.borderRadius = '5px';
    }
  });
}

// Apply filters
function applyFilters() {
  let filtered = trails;

  // Search
  const term = searchInput.value.toLowerCase();
  if (term) {
    filtered = filtered.filter(t => t.trail_name && t.trail_name.toLowerCase().includes(term));
  }

  // Region
  const regionVal = regionFilter.value;
  if (regionVal) {
    filtered = filtered.filter(t => t.region === regionVal);
  }

  // Difficulty
  const difficultyVal = difficultyFilter.value;
  if (difficultyVal) {
    filtered = filtered.filter(t => t.difficulty === difficultyVal);
  }

  // Features
  const selectedFeatures = Array.from(featureFilters)
    .filter(f => f.checked)
    .map(f => f.value);

  if (selectedFeatures.length > 0) {
    filtered = filtered.filter(trail =>
      selectedFeatures.every(f => trail[f])
    );
  }

  displayTrails(filtered);
}

// Event listeners
searchInput.addEventListener('input', applyFilters);
regionFilter.addEventListener('change', applyFilters);
difficultyFilter.addEventListener('change', applyFilters);
featureFilters.forEach(f => f.addEventListener('change', applyFilters));
