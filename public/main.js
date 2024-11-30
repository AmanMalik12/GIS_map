// Map view setup
var mapView = new ol.View({
    center: ol.proj.fromLonLat([72.585717, 23.021245]),
    zoom: 8
});

var map = new ol.Map({
    target: 'map',
    view: mapView
});

var osmTile = new ol.layer.Tile({
    title: 'Open Street Map',
    visible: true,
    source: new ol.source.OSM()
});

map.addLayer(osmTile);

var streetViewLayer = new ol.layer.Tile({
    title: 'Street View Layer',
    visible: false, // Hidden by default
    source: new ol.source.OSM({
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    })
});
map.addLayer(streetViewLayer);

// Mouse Position control
var mousePositionControl = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326',
    className: 'mouse-position',
    target: document.getElementById('mouse-position'),
    undefinedHTML: '&nbsp;'
});

map.addControl(mousePositionControl);

// Scale Line control
var scaleLineControl = new ol.control.ScaleLine();
map.addControl(scaleLineControl);

// Popup Overlay
var popup = new ol.Overlay({
    element: document.getElementById('popup'),
    positioning: 'bottom-center',
    stopEvent: false,
    offset: [0, -10]
});
map.addOverlay(popup);

// Popup active flag
var popupActive = true;  // Default is true, meaning popup is active

// Button click event handlers to disable popup during measurement or zooming
function disablePopup() {
    popupActive = false;
    document.getElementById('popup-content').innerHTML = "Popup is disabled while using other functionalities.";
}

// Re-enable popup functionality
function enablePopup() {
    popupActive = true;
    document.getElementById('popup-content').innerHTML = "Click on the map to get location information.";
}

// Measurement variables
var draw;
var measureType = null;
var currentInteraction = null;

// Format length function
function formatLength(line) {
    var length = ol.sphere.getLength(line);
    return length > 1000 ? (length / 1000).toFixed(2) + ' km' : length.toFixed(2) + ' m';
}

// Format area function
function formatArea(polygon) {
    var area = ol.sphere.getArea(polygon);
    return area > 1000000 ? (area / 1000000).toFixed(2) + ' km²' : area.toFixed(2) + ' m²';
}

// Add Drawing Interaction for Measurement
function addInteraction() {
    if (currentInteraction) {
        map.removeInteraction(currentInteraction);
    }

    draw = new ol.interaction.Draw({
        source: new ol.source.Vector(),
        type: measureType
    });

    map.addInteraction(draw);
    currentInteraction = draw;

    draw.on('drawend', function (event) {
        var geom = event.feature.getGeometry();
        var output;

        if (measureType === 'Polygon') {
            output = formatArea(geom);
        } else if (measureType === 'LineString') {
            output = formatLength(geom);
        }

        document.getElementById('popup-content').innerHTML = `<strong>Measurement</strong><br>${output}`;
        popup.setPosition(geom.getLastCoordinate());
    });
}

// Button for Length Measurement
document.getElementById('measure-length').onclick = function () {
    measureType = 'LineString';
    addInteraction();
    disablePopup();  // Disable popup while measuring
};

// Button for Area Measurement
document.getElementById('measure-area').onclick = function () {
    measureType = 'Polygon';
    addInteraction();
    disablePopup();  // Disable popup while measuring
};

// Rectangle Zoom In
document.getElementById('rectangle-zoom-in').onclick = function () {
    measureType = null;
    addRectangleZoomInInteraction();
    disablePopup();  // Disable popup while zooming
};

// Rectangle Zoom Out
document.getElementById('rectangle-zoom-out').onclick = function () {
    measureType = null;
    addRectangleZoomOutInteraction();
    disablePopup();  // Disable popup while zooming
};

// Deactivate current interaction and re-enable popup
document.getElementById('deactivate').onclick = function () {
    if (currentInteraction) {
        map.removeInteraction(currentInteraction);
        currentInteraction = null;
        measureType = null;
        document.getElementById('popup-content').innerHTML = "Functionality deactivated.";
    }

    enablePopup();  // Re-enable popup
};

// Street View Toggle
document.getElementById('street-view').onclick = function () {
    var isVisible = streetViewLayer.getVisible();
    streetViewLayer.setVisible(!isVisible); // Toggle visibility
    if (!isVisible) {
        mapView.setZoom(16);  // Zoom in for a more street-level view
    } else {
        mapView.setZoom(8);   // Zoom out to original zoom level
    }
};

// Rectangle Zoom In interaction
function addRectangleZoomInInteraction() {
    if (currentInteraction) {
        map.removeInteraction(currentInteraction);
    }

    draw = new ol.interaction.Draw({
        source: new ol.source.Vector(),
        type: 'Circle',
        geometryFunction: ol.interaction.Draw.createBox()
    });

    map.addInteraction(draw);
    currentInteraction = draw;

    draw.on('drawend', function (event) {
        var geom = event.feature.getGeometry();
        var extent = geom.getExtent();
        mapView.fit(extent, { duration: 500 });
    });
}

// Rectangle Zoom Out interaction
function addRectangleZoomOutInteraction() {
    if (currentInteraction) {
        map.removeInteraction(currentInteraction);
    }

    draw = new ol.interaction.Draw({
        source: new ol.source.Vector(),
        type: 'Circle',
        geometryFunction: ol.interaction.Draw.createBox()
    });

    map.addInteraction(draw);
    currentInteraction = draw;

    draw.on('drawend', function (event) {
        var geom = event.feature.getGeometry();
        var extent = geom.getExtent();
        var center = ol.extent.getCenter(extent);
        var zoomOutFactor = 2;
        var newExtent = [
            center[0] - (extent[2] - extent[0]) * zoomOutFactor / 2,
            center[1] - (extent[3] - extent[1]) * zoomOutFactor / 2,
            center[0] + (extent[2] - extent[0]) * zoomOutFactor / 2,
            center[1] + (extent[3] - extent[1]) * zoomOutFactor / 2
        ];

        mapView.fit(newExtent, { duration: 300 });
    });
}

// Reverse Geocoding on Map Click
map.on('singleclick', function (event) {
    if (!popupActive) return;  // Don't show popup if it's disabled

    var coordinate = event.coordinate;
    var lonLat = ol.proj.toLonLat(coordinate);

    var url = `https://nominatim.openstreetmap.org/reverse?lat=${lonLat[1]}&lon=${lonLat[0]}&format=json`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var country = data.address.country || "Country not found";
            var state = data.address.state || "State not found";
            var district = data.address.county || data.address.city || "District not found";

            var content = `<strong>Location Information</strong><br>
                           Country: ${country}<br>
                           State: ${state}<br>
                           District: ${district}<br>
                           Latitude: ${lonLat[1].toFixed(4)}<br>
                           Longitude: ${lonLat[0].toFixed(4)}`;
            
            document.getElementById('popup-content').innerHTML = content;
            popup.setPosition(coordinate);
        })
        .catch(error => {
            console.error('Error fetching location data:', error);
            document.getElementById('popup-content').innerHTML = "Location information unavailable.";
            popup.setPosition(coordinate);
        });
});

// Search Location
// Search Location
function searchLocation(query) {
    var urlIndia = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=IN&limit=1`;

    fetch(urlIndia)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                displayLocation(data[0]);
            } else {
                var urlGlobal = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`;

                fetch(urlGlobal)
                    .then(response => response.json())
                    .then(data => {
                        if (data.length > 0) {
                            displayLocation(data[0]);
                        } else {
                            alert("Location not found. Please try another search.");
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching global location data:', error);
                        alert("An error occurred while searching for the location.");
                    });
            }
        })
        .catch(error => {
            console.error('Error fetching India location data:', error);
            alert("An error occurred while searching for the location.");
        });
}

// Center map on found location
function displayLocation(location) {
    var lonLat = [parseFloat(location.lon), parseFloat(location.lat)];
    var coordinate = ol.proj.fromLonLat(lonLat);

    // Zoom the map to the location
    mapView.animate({
        center: coordinate,
        duration: 1000,
        zoom: 12
    });

    // Set the popup content and position
    var content = `
        <strong>Location Found</strong><br>
        ${location.display_name}
        <br>Latitude: ${parseFloat(location.lat).toFixed(4)}<br>
        Longitude: ${parseFloat(location.lon).toFixed(4)}
    `;
    document.getElementById('popup-content').innerHTML = content;
    popup.setPosition(coordinate);
}

// Attach to the search button
document.getElementById('search-button').onclick = function () {
    var query = document.getElementById('search-input').value;
    if (query) {
        searchLocation(query);
    } else {
        alert("Please enter a location to search.");
    }
};

// Center map on found location
function displayLocation(location) {
    var lonLat = [parseFloat(location.lon), parseFloat(location.lat)];
    var coordinate = ol.proj.fromLonLat(lonLat);
    mapView.animate({
        center: coordinate,
        duration: 1000,
        zoom: 10
    });
    popup.setPosition(coordinate);
    document.getElementById('popup-content').innerHTML = `<strong>Location Found</strong><br>${location.display_name}`;
}

// Find My Location Button functionality
document.getElementById('find-my-location').onclick = function () {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;
            var coordinate = ol.proj.fromLonLat([longitude, latitude]);

            mapView.animate({
                center: coordinate,
                duration: 1000,
                zoom: 12
            });

            var content = `
                <strong>Your Location</strong><br>
                Latitude: ${latitude.toFixed(4)}<br>
                Longitude: ${longitude.toFixed(4)}
            `;
            document.getElementById('popup-content').innerHTML = content;
            popup.setPosition(coordinate);
        }, function (error) {
            console.error('Error getting geolocation:', error);
            alert("Unable to retrieve your location. Please ensure location services are enabled.");
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
};

// Logout button functionality
document.getElementById('logout-button').onclick = function () {
    // Redirect to the login page
    window.location.href = '../Login & SignUp/jio_login.html';  // Adjust the path if necessary
};