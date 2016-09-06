// https://crossorigin.me/https://maps.googleapis.com/maps/api/directions/json?origin=Galvanize+Pioneer+Square&destination=Seattle+Art+Museum&mode=walking&key=AIzaSyAjLzjdU4yR3wLHAupDzHJZTAjNdX8bZtU'
//
// var map;
// var service;
// var infowindow;
//
// function initialize() {
//   var pyrmont = new google.maps.LatLng(-33.8665433,151.1956316);
//
//   map = new google.maps.Map(document.getElementById('map'), {
//       center: pyrmont,
//       zoom: 15
//     });
//
//   var request = {
//     location: pyrmont,
//     radius: '500',
//     types: ['store']
//   };
//
//   service = new google.maps.places.PlacesService(map);
//   service.nearbySearch(request, callback);
// }
//
// function callback(results, status) {
//   if (status == google.maps.places.PlacesServiceStatus.OK) {
//     for (var i = 0; i < results.length; i++) {
//       var place = results[i];
//       createMarker(results[i]);
//     }
//   }
// }

// <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk&callback=initMap"></script>

$(function () {

    $('button').on('click', function (event) {
      event.preventDefault();
      console.log($('#origin').val());
      console.log($('#destination').val());

      $div = $('<div>')
      $div.id = 'map';

      $iframe = $('<iframe width="800px" height="700px" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyAjLzjdU4yR3wLHAupDzHJZTAjNdX8bZtU&origin=' + $('#origin').val() + '&destination=' + $('#destination').val() + '&mode=walking&callback=initMap" allowfullscreen></iframe>')

      $xhr = $.getJSON('https://crossorigin.me/https://maps.googleapis.com/maps/api/directions/json?origin=' + $('#origin').val() + '&destination=' + $('#destination').val() + '&mode=walking&key=AIzaSyAjLzjdU4yR3wLHAupDzHJZTAjNdX8bZtU')

      coordinates = [];

      $xhr.done(function (data) {
        var legs = data.routes[0].legs[0]
        coordinates.push(legs.start_location);

        for (var i = 0; i < legs.steps.length; i++) {
          // console.log(legs.steps[i].end_location);
          coordinates.push(legs.steps[i].end_location);

        }
        coordinates.push(legs.end_location)
        console.log("start");
        console.log(legs.start_location);
        console.log("end");
        console.log(legs.end_location);

        var center = {
          lat: ((legs.start_location.lat + legs.end_location.lat) / 2),
          lng: ((legs.start_location.lng + legs.end_location.lng) / 2)
        };
        console.log('center');
        console.log(center);

        $('.map').remove();
        $div.append($iframe);
        $('body').append($div);

        function initMap() {
          var markerArray = [];

          var directionsService = new google.maps.DirectionsService;

          var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 13,
            center: center
          });

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

        // var map = new google.maps.Map(document.getElementsByClassName('map')[0], {
        //   zoom: 5,
        //   center: center
        // });

        // for (var i = 0; i < coordinates.length; i++) {
        //   var marker = new google.maps.Marker({
        //     position: myLatLng,
        //     map: map,
        //     title: 'Hello World!'
        //   });

        // }

      })

    })
  })
  // console.log("from data start ");
  // console.log(legs.start_location);
  // console.log("from array start ");
  // console.log(coordinates[0]);
  // console.log("from data end ");
  // console.log(legs.end_location);
  // console.log("from array end ");
  // console.log(coordinates[coordinates.length - 1]);

// function initialize() {
//     var map;
//     var bounds = new google.maps.LatLngBounds();
//     var mapOptions = {
//         mapTypeId: 'roadmap'
//     };
//
//     // Display a map on the page
//     map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
//     map.setTilt(45);
//
//     // Multiple Markers
//     var markers = [
//         ['London Eye, London', 51.503454,-0.119562],
//         ['Palace of Westminster, London', 51.499633,-0.124755]
//     ];
//
//     // Info Window Content
//     var infoWindowContent = [
//         ['<div class="info_content">' +
//         '<h3>London Eye</h3>' +
//         '<p>The London Eye is a giant Ferris wheel situated on the banks of the River Thames. The entire structure is 135 metres (443 ft) tall and the wheel has a diameter of 120 metres (394 ft).</p>' +        '</div>'],
//         ['<div class="info_content">' +
//         '<h3>Palace of Westminster</h3>' +
//         '<p>The Palace of Westminster is the meeting place of the House of Commons and the House of Lords, the two houses of the Parliament of the United Kingdom. Commonly known as the Houses of Parliament after its tenants.</p>' +
//         '</div>']
//     ];
//
//     // Display multiple markers on a map
//     var infoWindow = new google.maps.InfoWindow(), marker, i;
//
//     // Loop through our array of markers & place each one on the map
//     for( i = 0; i < markers.length; i++ ) {
//         var position = new google.maps.LatLng(markers[i][1], markers[i][2]);
//         bounds.extend(position);
//         marker = new google.maps.Marker({
//             position: position,
//             map: map,
//             title: markers[i][0]
//         });
//
//         // Allow each marker to have an info window
//         google.maps.event.addListener(marker, 'click', (function(marker, i) {
//             return function() {
//                 infoWindow.setContent(infoWindowContent[i][0]);
//                 infoWindow.open(map, marker);
//             }
//         })(marker, i));
//
//         // Automatically center the map fitting all markers on the screen
//         map.fitBounds(bounds);
//     }
//
//     // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
//     var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
//         this.setZoom(14);
//         google.maps.event.removeListener(boundsListener);
//     });
//
// }

// marker = new google.maps.Marker({
//   position: data.routes[0].legs[0].steps[i].end_location,
//   map: map
// })
// console.log(data.routes[0].legs[0].end_location);
// var map = document.getElementsByClassName('map')[0];
//
// var infowindow = new google.maps.InfoWindow({
//   content: "Hi!"
// });
// var marker = new google.maps.Marker({
//   position: coordinates[i]["Step"],
//   map: map,
//   title: 'Step ' + (i + 1)
// });
// marker.addListener('click', function() {
//   infowindow.open(map, marker);
// });
// var marker = new google.maps.Marker({
//        position: data.routes[0].legs[0].steps[i].end_location,
//        setMap: map,
//        title: "Index is " + i + "!"
//    });

//
//       function initMap() {
//         var myLatLng = {lat: -25.363, lng: 131.044};
//
//         var map = new google.maps.Map(document.getElementById('map'), {
//           zoom: 4,
//           center: myLatLng
//         });
//
//         var marker = new google.maps.Marker({
//           position: myLatLng,
//           map: map,
//           title: 'Hello World!'
//         });
//       }
//
//
//
// <div class="gm-style" style="position: absolute; left: 0px; top: 0px; overflow: hidden; width: 100%; height: 100%; z-index: 0;"><div style="position: absolute; left: 0px; top: 0px; overflow: hidden; width: 100%; height: 100%; z-index: 0; cursor:
//

//
// $('button').on('click', function(event){
//     event.preventDefault();
//
//     if (!(movieRequest.val().length > 0)){
//         movieRequest.addClass('invalid');
//         movieRequest[0].placeholder = 'Please enter a movie title.';
//     } else{
//         movieRequest.removeClass('invalid');
//     }
// });

// console.log($xhr);
// console.log(data);
// console.log(data.geocoded_waypoints);
// console.log(data.routes);
// console.log(data.routes[0]);
// console.log(data.routes[0].legs[0]);
// // console.log(data.routes[0].legs[0].steps[0]);
// console.log(data.routes[0].legs[0].steps[0].end_location);
// // console.log(data.routes[0].legs[0].steps[1]);
// console.log(data.routes[0].legs[0].steps[1].end_location);
// // console.log(data.routes[0].legs[0].steps[2]);
// console.log(data.routes[0].legs[0].steps[2].end_location);

// $xhr = $.getJSON('')
//
// console.log($xhr);
