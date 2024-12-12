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

// Satellite Layer
var satelliteLayer = new ol.layer.Tile({
    title: 'Satellite View',
    visible: false,  // Hidden by default
    source: new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        crossOrigin: 'anonymous' // Enables canvas usage
    })
});
map.addLayer(satelliteLayer);

// Button for Satellite View
document.getElementById('satellite-view').addEventListener('click', function () {
    // Check if satellite view is active
    const isSatelliteActive = satelliteLayer.getVisible();

    // Toggle satellite layer visibility
    satelliteLayer.setVisible(!isSatelliteActive);

    if (!isSatelliteActive) {
        // If activating satellite view, deactivate other layers
        osmTile.setVisible(false);
        streetViewLayer.setVisible(false);
    } else {
        // If deactivating satellite view, reactivate the default OSM layer
        osmTile.setVisible(true);
    }
});

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
    document.getElementById('popup-content').innerHTML = content;
}

// Re-enable popup functionality
function enablePopup() {
    popupActive = true;
    var content = `
        <div style="position: relative; text-align: left;">
            <!-- Logo -->
            <img id="popup-image" src="./image/jio.png" alt="Location Image" 
                style="width: 80px; height: 80px; border-radius: 50%; 
                    position: absolute; top: -40px; left: 50%; transform: translateX(-50%); 
                    border: 2px solid white; background: white; box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);">
            
            <!-- Popup Content -->
            <div style="padding-top: 50px; text-align: left; font-family: Arial, sans-serif;">
                <strong>Click on the map to get location information.</strong><br>
            </div>
        </div>
    `;
    
    // Set the content for the popup
    document.getElementById('popup-content').innerHTML = content;
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

            var content = `
            <div style="position: relative; text-align: left;">
                <!-- Logo -->
                <img id="popup-image" src="./image/jio.png" alt="Location Image" 
                     style="width: 80px; height: 80px; border-radius: 50%; 
                            position: absolute; top: -40px; left: 50%; transform: translateX(-50%); 
                            border: 2px solid white; background: white; box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);">
                
                <!-- Popup Content -->
                <div style="padding-top: 50px; text-align: left; font-family: Arial, sans-serif;">
                    <strong>Location Information</strong><br>
                    Country: ${country}<br>
                    State: ${state}<br>
                    District: ${district}<br>
                    Latitude: ${lonLat[1].toFixed(4)}<br>
                    Longitude: ${lonLat[0].toFixed(4)}
                </div>
            </div>
        `;
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
    <div style="position: relative; text-align: left;">
        <!-- Logo -->
        <img id="popup-image" src="./image/jio.png" alt="Location Image" 
             style="width: 80px; height: 80px; border-radius: 50%; 
                    position: absolute; top: -40px; left: 50%; transform: translateX(-50%); 
                    border: 2px solid white; background: white; box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);">
        
        <!-- Popup Content -->
        <div style="padding-top: 50px; text-align: left; font-family: Arial, sans-serif;">
            <strong>Location Found</strong><br>
            ${location.display_name}<br>
            Latitude: ${parseFloat(location.lat).toFixed(4)}<br>
            Longitude: ${parseFloat(location.lon).toFixed(4)}
        </div>
    </div>
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
            <div style="position: relative; text-align: left;">
                <!-- Logo -->
                <img id="popup-image" src="./image/jio.png" alt="Location Image" 
                     style="width: 80px; height: 80px; border-radius: 50%; 
                            position: absolute; top: -40px; left: 50%; transform: translateX(-50%); 
                            border: 2px solid white; background: white; box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);">
                
                <!-- Popup Content -->
                <div style="padding-top: 50px; text-align: left; font-family: Arial, sans-serif;">
                    <strong>Your Location</strong><br>
                    Latitude: ${latitude.toFixed(4)}<br>
                    Longitude: ${longitude.toFixed(4)}
                </div>
            </div>
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
// Logout button functionality
document.getElementById('logout-button').onclick = function () {
    var content = `
        <div style="position: relative; text-align: left; width: 300px; margin: auto; border: 1px solid #ccc; border-radius: 8px; background: #fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); padding: 20px;">
            <!-- Logo -->
            <img id="popup-image" src="./image/jio.png" alt="Jio Logo" 
                 style="width: 80px; height: 80px; border-radius: 50%; 
                        display: block; margin: 0 auto; 
                        border: 2px solid white; background: white; box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);">
            
            <!-- Popup Content -->
            <div style="text-align: center; font-family: Arial, sans-serif; margin-top: 20px;">
                <strong>Are you sure you want to logout?</strong><br><br>
                <button id="confirm-logout" style="background: #f44336; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Logout</button>
                <button id="cancel-logout" style="background: #4caf50; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Cancel</button>
            </div>
        </div>
    `;

    // Add the popup to the DOM
    const popupContainer = document.createElement('div');
    popupContainer.id = 'logout-popup';
    popupContainer.style.position = 'fixed';
    popupContainer.style.top = '0';
    popupContainer.style.left = '0';
    popupContainer.style.width = '100%';
    popupContainer.style.height = '100%';
    popupContainer.style.background = 'rgba(0, 0, 0, 0.5)';
    popupContainer.style.display = 'flex';
    popupContainer.style.alignItems = 'center';
    popupContainer.style.justifyContent = 'center';
    popupContainer.innerHTML = content;

    document.body.appendChild(popupContainer);

    // Add functionality to buttons
    document.getElementById('confirm-logout').onclick = function () {
        // Redirect to the login page
        window.location.href = 'Login & SignUp/jio_login.html'; // Adjust the path if necessary
    };

    document.getElementById('cancel-logout').onclick = function () {
        // Remove the popup from the DOM
        document.body.removeChild(popupContainer);
    };
};

// Show the zoom-to-coordinates popup when the button is clicked
// document.getElementById('zoom-to-coordinates').onclick = function () {
//     document.getElementById('coordinate-input').style.display = 'block';  // Show the input form
// };

// // Function to hide the input form when clicking "Deactivate" or any other button
// document.getElementById('deactivate').onclick = function () {
//     // Hide the input form when deactivating
//     document.getElementById('coordinate-input').style.display = 'none';

//     // You can also include other deactivate logic here if needed
//     if (currentInteraction) {
//         map.removeInteraction(currentInteraction);
//         currentInteraction = null;
//         measureType = null;
//         document.getElementById('popup-content').innerHTML = "Functionality deactivated.";
//     }

//     enablePopup();  // Re-enable popup
// };

// // Function to handle finding the location from coordinates
// document.getElementById('find-location').onclick = function () {
//     var lat = parseFloat(document.getElementById('latitude').value);
//     var lon = parseFloat(document.getElementById('longitude').value);
    
//     if (isNaN(lat) || isNaN(lon)) {
//         alert("Please enter valid coordinates.");
//         return;
//     }

//     // Zoom the map to the entered coordinates
//     var coordinate = ol.proj.fromLonLat([lon, lat]);
//     map.getView().setCenter(coordinate);
//     map.getView().setZoom(12);  // Set a zoom level for better visibility

//     // Optionally, display a message indicating the location was reached
//     document.getElementById('popup-content').innerHTML = "Reached the location!";
// };


document.getElementById('scale-select').onclick = function () {
    const scaleSelector = document.getElementById('scale-selector');
    if (scaleSelector.style.display === 'block') {
        scaleSelector.style.display = 'none';
    } else {
        scaleSelector.style.display = 'block';
    }
};

// Handle scale change and apply zoom
document.getElementById('scale-dropdown').onchange = function () {
    const selectedScale = this.value;

    if (selectedScale) {
        // Logic to set zoom based on selected scale
        const scaleToZoomMapping = {
            36979000: 2,  // 1:36,979,000
            18489000: 3,  // 1:18,489,000
            9245000: 4,   // 1:9,245,000
            4622000: 5,   // 1:4,622,000
            2311000: 6,   // 1:2,311,000
            1156000: 7,   // 1:1,156,000
            578000: 8,    // 1:578,000
            289000: 9,    // 1:289,000
            144000: 10,   // 1:144,000
            72000: 11,    // 1:72,000
            36000: 12,    // 1:36,000
            18000: 13,    // 1:18,000
            9000: 14,     // 1:9,000
            5000: 15,     // 1:5,000
            2000: 16,     // 1:2,000
            1000: 17      // 1:1,000
        };

        // Convert selected scale to number
        const scale = parseInt(selectedScale, 10);
        const zoom = scaleToZoomMapping[scale];

        if (zoom !== undefined) {
            map.getView().setZoom(zoom);
        } else {
            console.error('Scale not found in mapping:', scale);
        }
    }
};

document.getElementById('snapshot-button').onclick = function () {
    // Add a flash effect
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.background = 'white';
    flash.style.opacity = '0.8';
    flash.style.zIndex = '9999'; // Ensure it overlays the map
    flash.style.transition = 'opacity 0.5s ease-out';
    document.body.appendChild(flash);

    // Remove the flash after the effect
    setTimeout(() => {
        flash.style.opacity = '0'; // Fade out
        setTimeout(() => {
            document.body.removeChild(flash); // Remove element after fade
        }, 500);
    }, 200);

    // Create a canvas to combine map layers
    const mapCanvas = document.createElement('canvas');
    const size = map.getSize(); // Get the map size
    mapCanvas.width = size[0];
    mapCanvas.height = size[1];

    const context = mapCanvas.getContext('2d');
    const mapViewport = map.getViewport();
    const mapCanvasChildren = mapViewport.querySelectorAll('canvas');

    // Check if there are canvases to draw
    if (mapCanvasChildren.length === 0) {
        console.error("No canvases found in the map viewport.");
        alert("Snapshot cannot be created. Make sure map layers are loaded.");
        return;
    }

    // Draw all canvas layers onto the snapshot canvas
    mapCanvasChildren.forEach((canvas) => {
        try {
            if (canvas.width > 0 && canvas.height > 0) {
                context.drawImage(canvas, 0, 0);
            }
        } catch (error) {
            console.error("Error drawing canvas:", error);
            alert("Unable to capture some layers due to cross-origin restrictions.");
        }
    });

    // Generate image from the canvas
    const imageData = mapCanvas.toDataURL('image/png');

    // Trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = imageData;
    downloadLink.download = 'map-snapshot.png';
    downloadLink.click();
};
