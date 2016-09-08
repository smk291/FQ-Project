var map;
var directionsService;
var clickCount = 0;
var coordinates = [];
var directionsCenterLatitude;
var directionsCenterLongitude;
var latitudes = [];
var longitudes = [];
var directionsDistanceText = [];
var directionsDurationText = [];
var addresses = []
var distanceBetweenPoints = 0;
var markerArray = [];
var minutelyData = [];

$(function () {

  function initAutocomplete() {
    // var controlDiv1 = document.createElement('div'); // This creates the first autocompete input
    var input2 = document.getElementById('origin');
    // input2.style.placeholder = 'Origin';
    input2.style.paddingLeft = '10px';
    var searchBox2 = new google.maps.places.SearchBox(input2);
    searchBox2.addListener('places_changed', function (event) {
      // event.preventDefault();
      coordinates[0] = searchBox2.getPlaces()[0].formatted_address;
      // console.log(searchBox2.getPlaces());
      console.log(searchBox2.getPlaces()[0].formatted_address);
      if (typeof coordinates[0] === 'string' && typeof coordinates[1] === 'string') {
            // debugger;
            // $('#map-canvas').empty();
        initialize();
          // initAutocomplete();
      }
    })
    // controlDiv1.style.boxShadow = '0 12px 15px 0 rgba(0,0,0,0.24),0 17px 50px 0 rgba(0,0,0,0.19)';
    // controlDiv1.style.marginTop = '.5%';
    // controlDiv1.style.marginLeft = '.5%';
          // controlDiv1.appendChild(input2);
          // map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv1);
          // document.getElementById('search').appendChild(controlDiv1);

    var controlDiv2 = document.createElement('div'); // This creates the second
    var input3 = document.getElementById('destination');
    input3.style.paddingLeft = '10px';
    input3.style.left = '325px';
    var searchBox3 = new google.maps.places.SearchBox(input3);
    searchBox3.addListener('places_changed', function (event) {
      // event.preventDefault();
      coordinates[1] = searchBox3.getPlaces()[0].formatted_address;
      // console.log(searchBox2.getPlaces());
      console.log(searchBox3.getPlaces()[0].formatted_address);
      if (typeof coordinates[0] === 'string' && typeof coordinates[1] === 'string') {
        // debugger;
        // $('#map-canvas').empty();
        initialize();
        // initAutocomplete();
      }
    })
    controlDiv2.style.boxShadow = '0 12px 15px 0 rgba(0,0,0,0.24),0 17px 50px 0 rgba(0,0,0,0.19)';
    controlDiv2.style.marginTop = '.5%';
    controlDiv2.style.marginLeft = '.5%';
    controlDiv2.style.left = '325px';
    controlDiv2.appendChild(input3);
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv2);
    document.getElementById('search').appendChild(controlDiv2);
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv2);

    var controlDiv3 = document.createElement('div'); // This creates the search button
    var searchButton = document.createElement('button');
    searchButton.className = 'btn waves-effect waves-light';
    searchButton.setAttribute('type', 'submit');
    searchButton.setAttribute('name', 'action');
    searchButton.style.top = '5px';
    searchButton.id = 'searchButton';
    var searchIcon = document.createElement('i');
    searchIcon.className = "material-icons center";
    searchIcon.textContent = "send";
    searchButton.appendChild(searchIcon);
    controlDiv3.appendChild(searchButton);
    controlDiv3.style.marginTop = '.5%';
    controlDiv3.style.marginLeft = '.5%';
    controlDiv3.style.left = '650px';
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv3);
    document.getElementById('search').appendChild(controlDiv3);

    searchBox2.addListener('places_changed', function () {
      var places = searchBox2.getPlaces();
      if (places.length == 0) {
        return;
      }
    });
    searchBox3.addListener('places_changed', function () {
      var places = searchBox3.getPlaces();

      if (places.length == 0) {
        return;
      }
    });
  }


  function initialize() { //  ---->  This is the primary map and directions generating function
    var mapOptions = { // Sets initial conditions for map
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: {
          lat: 47.59916,
          lng: -122.333689
        },
        zoom: 13
      }
      // initAutocomplete();
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions); //Create map at #map-canvas
    directionsService = new google.maps.DirectionsService(); //Initialize directions service
    calcRoute();
    initMap();
  }

  function calcRoute() { // ----> Calculate route using user-selected addresses
    var request = {
      origin: coordinates[0],
      destination: coordinates[1],
      travelMode: google.maps.TravelMode.WALKING // >>>>>>>>>>> SET OPTION
    };

    // coordinates[0] = $('#origin').val();
    // coordinates[1] = $('#destination').val();                                       // console.log(coordinates);

    directionsService.route(request, function (response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        map.fitBounds(response.routes[0].bounds);
        createPolyline(response);
      }
    });
  }

  function createPolyline(directionResult) { // ----> This function creates polyLines
    latitudes = []; // Array storing list of latitudes
    longitudes = []; // Array storing list of all longitudes -- equal in length to latitude list
    var line = new google.maps.Polyline({ // This draws lines between parts of directions; I've disabled it for now
      path: directionResult.routes[0].overview_path,
      strokeColor: '#0000FF',
      strokeOpacity: 0.5,
      strokeWeight: 10
    });

    console.log(directionResult.routes[0])

    line.setMap(map);

    for (var i = 0; i < line.getPath().length; i++) { // Loop returns and stores latitudes and longitudes; I should filter these according to distance
      console.log(line.getPath().getAt(i));
      console.log(line.getPath().getAt(i).lat(arguments)); // Latitude -- difficult to figure out how to retrieve
      latitudes.push(line.getPath().getAt(i).lat(arguments))
      console.log(line.getPath().getAt(i).lng(arguments)); // Longitude -- difficult to figure out how to retrieve
      longitudes.push(line.getPath().getAt(i).lng(arguments))
    }

    var totalDistance = 0;
    var minuteCount = 0;
    directionsCenterLatitude = (latitudes[0] + latitudes[latitudes.length - 1]) / 2; // Store average of start latitude and end latitude
    directionsCenterLongitude = (longitudes[0] + longitudes[longitudes.length - 1]) / 2; //Store average of start longitude and end longitude
    getForecastIO(directionsCenterLatitude, directionsCenterLongitude);
    var distanceStorage = 0;
    for (var i = 0; i < latitudes.length; i++) {
      var distanceBetween = earthDistance({
        lat: latitudes[i],
        lon: longitudes[i]
      }, {
        lat: latitudes[i + 1],
        lon: longitudes[i + 1]
      }) * 5280;
      if (i === latitudes.length - 1) {
        distanceBetween = 0;
      }
      if ((distanceBetween + distanceStorage) > 545.6004 || i === 0 || i === latitudes.length - 1) {
        if ((distanceBetween + distanceStorage) > 545.6004) {
          distanceStorage = 0;
        } else {
          distanceStorage += distanceBetween;
        }
        // console.log("It's above the limit.")
        minuteCount = Math.round(totalDistance / 545.6004) * 2;
        console.log("MinuteCount: " + minuteCount);
        console.log(distanceStorage);
        totalDistance += distanceBetween;
        console.log("TotalDistance: " + totalDistance)
        distanceStorage = distanceStorage % 545.6004;
        console.log("New distanceStorage is: " + distanceStorage);
        var marker = new google.maps.Marker({ // Create marker when distanceStorage exceeds 272.80002
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 3
          },
          position: line.getPath().getAt(i),
          map: map
        });
        // weatherlisting.appendChild(minutelyData[minuteCount]);
      } else {
        console.log("It's below the limit");
        distanceStorage += distanceBetween;
        console.log("New distanceStorage is: " + distanceStorage);
        totalDistance += distanceBetween;
        console.log("TotalDistance: " + totalDistance)
      }
    }
  }

  function getLatLngFromClick(map) { // ----> This function gets latitude and longitude from click on map
    google.maps.event.addListener(map, "click", function (event) {
      var latLng = event.latLng;
      if (clickCount === 0) {
        $('#origin').val('');
        $('#origin').val(latLng.lat(arguments) + "," + latLng.lng(arguments));
      } else if (clickCount === 1) {
        $('#destination').val('');
        $('#destination').val(latLng.lat(arguments) + "," + latLng.lng(arguments));
      } else if (clickCount === 2) {
        alert('Bing!');
        clickCount = 0;
        initialize();
      }

    });
    clickCount++
  }

  function showSteps(directionResult, markerArray, stepDisplay, map) { // ----> Put markers on map
    var myRoute = directionResult.routes[0].legs[0]; // // For each step, place a marker, and add the text to the marker's infowindo, attach the marker to an array so we can keep track of it and remove it when calculating new routes.
    // console.log(myRoute);
    // console.log(myRoute.steps);
    for (var i = 0; i < myRoute.steps.length; i++) {
      // console.log(myRoute.steps[i].distance.text);                               // This gets distance per 'step' as a string
      // console.log(myRoute.steps[i].distance.value);                          // Not sure what this value is; it's connected to the distance text -- if i can figure it out, I'll save myself some work
      // console.log(myRoute.steps[i].duration.text);                           // This gets duration per 'step' a string
      // console.log(myRoute.steps[i].duration.value);                          // Not sure what this value is; it's connected to duration text
      directionsDistanceText.push(myRoute.steps[i].distance.text); // Push each text value to the corresponding array
      directionsDurationText.push(myRoute.steps[i].duration.text);
    }
    // console.log(directionsDistanceText);
    // console.log(directionsDurationText);

    for (var i = 0; i < myRoute.steps.length; i++) {                            // =====>>>>>>>>>>>>>>>> This puts markers on map. FILTER HERE?
      var marker = markerArray[i] = markerArray[i] || new google.maps.Marker({
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3
        }
      });
      marker.setMap(map);
      marker.setPosition(myRoute.steps[i].start_location);                          // Get lat and lng here
      attachInstructionText(                                                        // =====>>>>>>>>>>>>>>>>>>>>> Instruction text is present on only SOME
        stepDisplay, marker, myRoute.steps[i].instructions, map);                   // =====>>>>>>>>>>>>>>>>>>>>> FIX THAT
    }
    getLatLngFromClick(map);
  }


  function initMap() { // ----> This function displays route
    var directionsDisplay = new google.maps.DirectionsRenderer({ // Create a renderer for directions and bind it to the map.
      map: map
    });

    var stepDisplay = new google.maps.InfoWindow; // Instantiate an info window to hold step text.

    calculateAndDisplayRoute( // Display the route between the initial start and end selections.
      directionsDisplay, directionsService, markerArray, stepDisplay, map); // Listen to change events from the start and end lists.
    var onChangeHandler = function () {
      calculateAndDisplayRoute(
        directionsDisplay, directionsService, markerArray, stepDisplay, map);
    };
    $('button').on('click', onChangeHandler); // execute 'calculateAndDisplayRoute' when button clicked
  } // Unused -- document.getElementById('destination').addEventListener('change', onChangeHandler);

  function calculateAndDisplayRoute(directionsDisplay, directionsService, // ----> Creates array of markers -- maybe make that array global for ease
    markerArray, stepDisplay, map) {
    for (var i = 0; i < markerArray.length; i++) { // Remove existing markers from the map.
      markerArray[i].setMap(null);
      // console.log(markerArray)
    }

    directionsService.route({ // Retrieve start and end locations and create a directionsRequest using WALKING directions.
      origin: coordinates[0],
      destination: coordinates[1],
      travelMode: 'WALKING' // ------->>>>>>>>>>>>>>>>>SPECIFY MODE OF TRANSPORT HERE
    }, function (response, status) { // Cal back gets directions and sends to function to create markers for each step.
      if (status === 'OK') { // Warning message, not used // document.getElementById('warnings-panel').innerHTML =//     '<b>' + response.routes[0].warnings + '</b>';
        directionsDisplay.setDirections(response);
        showSteps(response, markerArray, stepDisplay, map);
        // console.log(markerArray);
      }
    });
  }

  function attachInstructionText(stepDisplay, marker, text, map) { // ----> Create infowindow for markers and attach instructions
    google.maps.event.addListener(marker, 'click', function () { // Open an info window when the marker is clicked on, containing the text of the step.
      stepDisplay.setContent(text);
      stepDisplay.open(map, marker);
    });
  }

  function getForecastIO(latitude, longitude) { // ----> API Request to forecastIO at passed coordinates, returns minute by minute forecast
    // console.log("FORECAST.IOOOOOOOOOOOOOOOOO");
    minutelyData = [];
    var $xhr = $.getJSON('https://crossorigin.me/https://api.forecast.io/forecast/a50acefa997f6fe98380aba1808cab6e/' + latitude + ',' + longitude)
    $xhr.done(function (xhrdata) {

        var div = document.createElement('div')
        div.className = 'alisting';
        var hourSummary = document.createElement('p');
        hourSummary.textContent = xhrdata.minutely.summary;
        hourSummary.className = 'col l12';
        (div).appendChild(hourSummary);
        var weatherlisting = document.getElementById('weatherlisting')
        weatherlisting.appendChild(div);

        var minutely = xhrdata.minutely;

        for (var i = 0; i < minutely.data.length; i++) {
          var div = document.createElement('div')
          div.className = 'alisting row container col l12';

          var p0 = document.createElement('p');
          p0.textContent = xhrdata.minutely.data[i].time;
          p0.className = 'time col l4';

          (div).appendChild(p0);

          var p1 = document.createElement('p1');
          var probability = Number(xhrdata.minutely.data[i].precipProbability) * 100;
          p1.textContent = probability + "%";
          p1.className = 'probability col l4';

          var p2 = document.createElement('p');
          p2.textContent = xhrdata.minutely.data[i].precipIntensity + 'in/hr';
          p2.className = 'precipIntensity col l4';

          (div).appendChild(p0);
          (div).appendChild(p1);
          (div).appendChild(p2);
          var weatherlisting = document.getElementById('weatherlisting')
          weatherlisting.appendChild(div);
          minutelyData.push(div);
        }
        console.log(minutelyData);
      })
    }
  initAutocomplete();
})

function earthDistance(coord1, coord2) {
  var RADIUS_OF_EARTH = 3961; // miles
  var lat1 = coord1.lat * Math.PI / 180;
  var lat2 = coord2.lat * Math.PI / 180;
  var lon1 = coord1.lon * Math.PI / 180;
  var lon2 = coord2.lon * Math.PI / 180;

  var dlon = lon2 - lon1;
  var dlat = lat2 - lat1;

  var a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) *
    Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RADIUS_OF_EARTH * c;
}

map = new google.maps.Map(document.getElementById('map-canvas'), { // This creates the initial map
  center: {
    lat: 47.59916,
    lng: -122.333689
  },
  disableDefaultUI: true,
  zoom: 13
});
