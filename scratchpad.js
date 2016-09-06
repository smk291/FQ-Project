// <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk&callback=initMap"></script>

$(function () {

    $('button').on('click', function (event) {
      event.preventDefault();
      console.log($('#origin').val());
      console.log($('#destination').val());

      $div = $('<div>');
      $div.id = 'map';

      $iframe = $('<iframe width="800px" height="700px" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyAjLzjdU4yR3wLHAupDzHJZTAjNdX8bZtU&origin=' + $('#origin').val() + '&destination=' + $('#destination').val() + '&mode=walking&callback=initMap" allowfullscreen></iframe>')
      //
      // $xhr = $.getJSON('https://crossorigin.me/https://maps.googleapis.com/maps/api/directions/json?origin=' + $('#origin').val() + '&destination=' + $('#destination').val() + '&mode=walking&key=AIzaSyAjLzjdU4yR3wLHAupDzHJZTAjNdX8bZtU')
      //
      // coordinates = [];
      //
      // $xhr.done(function (data) {
      //   var legs = data.routes[0].legs[0]
      //   coordinates.push(legs.start_location);
      //
      //   for (var i = 0; i < legs.steps.length; i++) {
      //     // console.log(legs.steps[i].end_location);
      //     coordinates.push(legs.steps[i].end_location);
      //
      //   }
      //   coordinates.push(legs.end_location)
      //   console.log("start");
      //   console.log(legs.start_location);
      //   console.log("end");
      //   console.log(legs.end_location);
      //
      //   var center = {
      //     lat: ((legs.start_location.lat + legs.end_location.lat) / 2),
      //     lng: ((legs.start_location.lng + legs.end_location.lng) / 2)
      //   };
      //   console.log('center');
      //   console.log(center);
      //
        $('.map').remove();
        $div.append($iframe);
        $('body').append($div);
    // })

        function initMap() {
          var markerArray = [];

          var directionsService = new google.maps.DirectionsService;

          // Create a map and center it on Manhattan.
          var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 13,
            center: center
          });

          // Create a map and center it on Manhattan.
          var directionsDisplay = new google.maps.DirectionsRenderer({
            map: map
          });

          // Instantiate an info window to hold step text.
          var stepDisplay = new google.maps.InfoWindow;

          // Display the route between the initial start and end selections.
          calculateAndDisplayRoute(
            directionsDisplay, directionsService, markerArray, stepDisplay, map);
          // Listen to change events from the start and end lists.
          var onChangeHandler = function () {
            calculateAndDisplayRoute(
              directionsDisplay, directionsService, markerArray, stepDisplay, map);
          };
          document.getElementById($('#origin').val()).addEventListener('change', onChangeHandler);
          document.getElementById($('#destination').val()).addEventListener('change', onChangeHandler);
        }

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
          }, function (response, status) {
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
          google.maps.event.addListener(marker, 'click', function () {
            // Open an info window when the marker is clicked on, containing the text
            // of the step.
            stepDisplay.setContent(text);
            stepDisplay.open(map, marker);
          });
        }


    })
  })
