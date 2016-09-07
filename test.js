var map;
var directionsService;
var clickCount = 0;
$(function(){


  function initialize() {
    var mapOptions = {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: {lat: 47.59916, lng: -122.333689},
      zoom: 13
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    directionsService = new google.maps.DirectionsService();
    calcRoute();
    initMap();
  }

  function calcRoute() {
    var request = {
      origin: $('#origin').val(),
      destination: $('#destination').val(),
      travelMode: google.maps.TravelMode.WALKING
    };

    console.log(request);
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        map.fitBounds(response.routes[0].bounds);
        createPolyline(response);
      }
    });
  }
  //
  function createPolyline(directionResult) {
    var line = new google.maps.Polyline({
      path: directionResult.routes[0].overview_path,
      strokeColor: '#FF0000',
      strokeOpacity: 0.5,
      strokeWeight: 0
    });

    line.setMap(map);

    for (var i = 0; i < line.getPath().length; i++) {
      // console.log(line.getPath().getAt(i));
      // console.log(line.getPath().getAt(i).lat(arguments));        //YES
      // console.log(line.getPath().getAt(i).lng(arguments));        //YES
      var marker = new google.maps.Marker({
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3
        },
        position: line.getPath().getAt(i),

        map: map
      });
    }
  }


  google.maps.event.addDomListener(window, 'load', initialize);

  $('button').on('click', function (event) {
    event.preventDefault();
    $('#map-canvas').empty();
    initialize();
  })

  function getLatLngFromClick (map){
  google.maps.event.addListener(map, "click", function (event) {
    // debugger;
      //lat and lng is available in event object

      var latLng = event.latLng;
      console.log("Click event at: ");
      console.log(latLng);

      console.log("Lat: ");
      console.log(latLng.lat(arguments));
      console.log("Lng: ");
      console.log(latLng.lng(arguments));

      if (clickCount === 0){
        $('#origin').val('');
        $('#origin').val(latLng.lat(arguments) + "," + latLng.lng(arguments));
      } else if (clickCount === 1){
        $('#destination').val('');
        $('#destination').val(latLng.lat(arguments) + "," + latLng.lng(arguments));
      } else if (clickCount === 2){
        alert('Bing!');
        clickCount = 0;
        initialize();
      }

  });
      clickCount++
  }

  function initMap() {
    var markerArray = [];
  //
  //   // Instantiate a directions service.
  //   var directionsService = new google.maps.DirectionsService;
  //
  //   // Create a map and center it on Manhattan.
  //   var map = new google.maps.Map(document.getElementById('map'), {
  //     zoom: 13,
  //     center: {lat: 40.771, lng: -73.974}
  //   });
  //
    // Create a renderer for directions and bind it to the map.
    var directionsDisplay = new google.maps.DirectionsRenderer({map: map});

    // Instantiate an info window to hold step text.
    var stepDisplay = new google.maps.InfoWindow;

    // Display the route between the initial start and end selections.
    calculateAndDisplayRoute(
        directionsDisplay, directionsService, markerArray, stepDisplay, map);
    // Listen to change events from the start and end lists.
    var onChangeHandler = function() {
      calculateAndDisplayRoute(
          directionsDisplay, directionsService, markerArray, stepDisplay, map);
    };
    $('button').on('click', onChangeHandler);
    // document.getElementById('destination').addEventListener('change', onChangeHandler);
  }
  //
  function calculateAndDisplayRoute(directionsDisplay, directionsService,
      markerArray, stepDisplay, map) {
    // First, remove any existing markers from the map.
    for (var i = 0; i < markerArray.length; i++) {
      markerArray[i].setMap(null);
      // console.log(markerArray)
    }

    // Retrieve the start and end locations and create a DirectionsRequest using
    // WALKING directions.
    directionsService.route({
      origin: $('#origin').val(),
      destination: $('#destination').val(),
      travelMode: 'WALKING'
    }, function(response, status) {
      // Route the directions and pass the response to a function to create
      // markers for each step.
      if (status === 'OK') {
        // document.getElementById('warnings-panel').innerHTML =
        //     '<b>' + response.routes[0].warnings + '</b>';
        directionsDisplay.setDirections(response);
        showSteps(response, markerArray, stepDisplay, map);
      }
    });
  }

  function showSteps(directionResult, markerArray, stepDisplay, map) {
    // For each step, place a marker, and add the text to the marker's infowindow.
    // Also attach the marker to an array so we can keep track of it and remove it
    // when calculating new routes.
    var myRoute = directionResult.routes[0].legs[0];
    for (var i = 0; i < myRoute.steps.length; i++) {
      var marker = markerArray[i] = markerArray[i] || new google.maps.Marker({
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3
        }});
      marker.setMap(map);
      marker.setPosition(myRoute.steps[i].start_location);                      //lat and lon here
      attachInstructionText(
          stepDisplay, marker, myRoute.steps[i].instructions, map);
    }
      getLatLngFromClick (map);
  }

  function attachInstructionText(stepDisplay, marker, text, map) {
    google.maps.event.addListener(marker, 'click', function() {
      // Open an info window when the marker is clicked on, containing the text
      // of the step.
      stepDisplay.setContent(text);
      stepDisplay.open(map, marker);
    });
  }


})
