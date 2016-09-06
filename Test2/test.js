$(function(){
  var map;
  var directionsService;

                      var markerArray = [];
                      var directionsService = new google.maps.DirectionsService;
                      var directionsDisplay = new google.maps.DirectionsRenderer({map: map});
                      var stepDisplay = new google.maps.InfoWindow;

  function initialize() {
    var mapOptions = {
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    directionsService = new google.maps.DirectionsService();
    calcRoute();
  }

  function calcRoute() {
    var request = {
      origin: $('#origin').val(),
      destination: $('#destination').val(),
      travelMode: google.maps.TravelMode.WALKING
    };

    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        map.fitBounds(response.routes[0].bounds);
        createPolyline(response);
      }
    });
  }

  function createPolyline(directionResult) {
    var line = new google.maps.Polyline({
      path: directionResult.routes[0].overview_path,
      strokeColor: '#FF0000',
      strokeOpacity: 0.5,
      strokeWeight: 10
    });

    line.setMap(map);

    for (var i = 0; i < line.getPath().length; i++) {
      var marker = new google.maps.Marker({
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3
        },
        position: line.getPath().getAt(i),
        map: map
      });
    }
                                calculateAndDisplayRoute(directionsDisplay, directionsService, markerArray, stepDisplay, map)
  }

  google.maps.event.addDomListener(window, 'load', initialize);

  $('button').on('click', function (event) {
    event.preventDefault();
    $('#map-canvas').empty();
    initialize();
  })

})

  //
  // function initMap() {
  //
  //   // Instantiate a directions service.
  //
  //   // Create a map and center it on Manhattan.
  //   var map = new google.maps.Map(document.getElementById('map'), {
  //     zoom: 13,
  //     center: {lat: 40.771, lng: -73.974}
  //   });
  //
  //   // Create a renderer for directions and bind it to the map.
  //
  //   // Instantiate an info window to hold step text.
  //
  //   // Display the route between the initial start and end selections.
  //   calculateAndDisplayRoute(
  //       directionsDisplay, directionsService, markerArray, stepDisplay, map);
  //   // Listen to change events from the start and end lists.
  //   var onChangeHandler = function() {
  //     calculateAndDisplayRoute(
  //         directionsDisplay, directionsService, markerArray, stepDisplay, map);
  //   };
  //   document.getElementById('start').addEventListener('change', onChangeHandler);
  //   document.getElementById('end').addEventListener('change', onChangeHandler);
  // }




  function calculateAndDisplayRoute(directionsDisplay, directionsService,
      markerArray, stepDisplay, map) {
    // First, remove any existing markers from the map.
    for (var i = 0; i < markerArray.length; i++) {
      markerArray[i].setMap(null);
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
        document.getElementById('warnings-panel').innerHTML =
            '<b>' + response.routes[0].warnings + '</b>';
        directionsDisplay.setDirections(response);
        showSteps(response, markerArray, stepDisplay, map);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }

  function showSteps(directionResult, markerArray, stepDisplay, map) {
    // For each step, place a marker, and add the text to the marker's infowindow.
    // Also attach the marker to an array so we can keep track of it and remove it
    // when calculating new routes.
    var myRoute = directionResult.routes[0].legs[0];
    for (var i = 0; i < myRoute.steps.length; i++) {
      var marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
      marker.setMap(map);
      marker.setPosition(myRoute.steps[i].start_location);
      attachInstructionText(
          stepDisplay, marker, myRoute.steps[i].instructions, map);
    }
  }

  function attachInstructionText(stepDisplay, marker, text, map) {
    google.maps.event.addListener(marker, 'click', function() {
      // Open an info window when the marker is clicked on, containing the text
      // of the step.
      stepDisplay.setContent(text);
      stepDisplay.open(map, marker);
    });
  }
