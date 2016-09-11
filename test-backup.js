$(function () {
  function initAutocomplete(map) { //--> This initializes the autocomplete forms
    var input2 = document.getElementById('origin');
    var input3 = document.getElementById('destination');
    var searchBox2 = new google.maps.places.SearchBox(input2);
    var searchBox3 = new google.maps.places.SearchBox(input3);
    var originFormattedAddress;
    var destinationFormattedAddress;

    searchBox2.addListener('places_changed', function () {
      originFormattedAddress = searchBox2.getPlaces()[0].formatted_address; //console.log(searchBox2.getPlaces()[0].formatted_address);
    });
    searchBox3.addListener('places_changed', function () {
      destinationFormattedAddress = searchBox3.getPlaces()[0].formatted_address;

    });

    searchBox2.addListener('places_changed', function () {
      var places = searchBox2.getPlaces();
      if (places.length === 0) {
        return;
      }
    });
    searchBox3.addListener('places_changed', function () {
      var places = searchBox3.getPlaces();
      if (places.length === 0) {
        return;
      }
    });

    $('#searchbutton').on('click', function () {
      event.preventDefault();
      if (typeof originFormattedAddress === 'string' && typeof destinationFormattedAddress === 'string') { /// REPLACE
        initialize(originFormattedAddress, destinationFormattedAddress, map);
      }
    });
  }

  function initialize(originFormattedAddress, destinationFormattedAddress, map) { //  ---->  This is the function that generates map and directions
    $('#currentconditions').empty();
    $('#weatherlisting').empty();
    $('#hourlyForecast').empty();

    var mapOptions = {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: {
        lat: 47.59916,
        lng: -122.333689
      },
      zoom: 13
    };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions); //Create map at #map-canvas
    directionsService = new google.maps.DirectionsService(); //Initialize directions service
    calcRoute(directionsService, map, originFormattedAddress, destinationFormattedAddress);
    // initMap(map);
  }

  function calcRoute(directionsService, map, originFormattedAddress, destinationFormattedAddress) { // ----> This calculates the route using user-selected addresses
    var modeOfTransport;
    var transportChoices = document.getElementsByName('transport');

    for (var i = 0; i < transportChoices.length; i++) {
      if (transportChoices[i].checked) {
        modeOfTransport = transportChoices[i].id;
        break;
      }
    }

    if (modeOfTransport === 'WALKING') {
      var request = {
        origin: originFormattedAddress,
        destination: destinationFormattedAddress,
        travelMode: google.maps.TravelMode.WALKING
      };
    } else if (modeOfTransport === 'BICYCLING') {
      var request = {
        origin: originFormattedAddress,
        destination: destinationFormattedAddress,
        travelMode: google.maps.TravelMode.BICYCLING
      };
    } else if (modeOfTransport === 'DRIVING') {
      var request = {
        origin: originFormattedAddress,
        destination: destinationFormattedAddress,
        travelMode: google.maps.TravelMode.WALKING
      };
    }

    directionsService.route(request, function (response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        map.fitBounds(response.routes[0].bounds);
        createPolyline(response, modeOfTransport, map);
      }
      var newLatCenter = (map.getBounds().f.b + map.getBounds().f.f) / 2;
      var newLngCenter = Math.max(map.getBounds().b.f, map.getBounds().b.b) - Math.abs((map.getBounds().b.f - map.getBounds().b.b) / 2.85);
      map.setCenter({
        'lat': newLatCenter,
        'lng': newLngCenter
      });
    });
  }

  function createPolyline(directionResult, modeOfTransport, map) { // ----> This function creates polyLines

    var latitudes = [];
    var longitudes = []; // console.log(directionResult.routes[0].overview_path) // console.log(directionResult.routes)

    var line = new google.maps.Polyline({ // This draws lines between parts of directions; I've disabled it for now
      path: directionResult.routes[0].overview_path,
      strokeColor: '#0000aa',
      strokeOpacity: 0.5,
      strokeWeight: 10
    }); // console.log(directionResult.routes[0])

    line.setMap(map);

    for (var i = 0; i < line.getPath().length; i++) { // Loop returns and stores latitudes and longitudes; I should filter these according to distance
      latitudes.push(line.getPath().getAt(i).lat(arguments)); //  console.log(line.getPath().getAt(i).lng(arguments)); // Longitude -- difficult to figure out how to retrieve
      longitudes.push(line.getPath().getAt(i).lng(arguments));
    }

    var centerLatitude = (latitudes[0] + latitudes[latitudes.length - 1]) / 2;
    var centerLongitude = (longitudes[0] + longitudes[longitudes.length - 1]) / 2;

    markersAndForecast(line, centerLatitude, centerLongitude, modeOfTransport, latitudes, longitudes, map);
  }

  // function showSteps(directionResult, markerArray, stepDisplay, map) { // ----> Put markers on map
  //
  //   var myRoute = directionResult.routes[0].legs[0];
  // }

   //function initMap(map) { ----> This function displays route

    // var directionsDisplay = new google.maps.DirectionsRenderer({
    //   map: map
    // });
    // var stepDisplay = new google.maps.InfoWindow;
  // }

  // function attachInstructionText(stepDisplay, marker, text, map) { ----> Create infowindow for markers and attach instructions
    // google.maps.event.addListener(marker, 'click', function () { // Open an info window when the marker is clicked on, containing the text of the step.
    //   stepDisplay.setContent(text);
    //   stepDisplay.open(map, marker);
    // });
  // }

  function markersAndForecast(line, centerLatitude, centerLongitude, modeOfTransport, latitudes, longitudes, map) { // ----> API Request to forecastIO at passed coordinates, returns minute by minute forecast // console.log("FORECAST.IOOOOOOOOOOOOOOOOO");

    // var minutelyData = [];
    var $xhr = $.getJSON('https://crossorigin.me/https://api.forecast.io/forecast/a50acefa997f6fe98380aba1808cab6e/' + centerLatitude + ',' + centerLongitude);
    $xhr.done(function (xhrdata) {
      // var minutely = xhrdata.minutely;
      createHourlyChart(xhrdata);
      appendSummary(xhrdata);
      whereToMark(line, xhrdata, modeOfTransport, latitudes, longitudes, map);
      createDailyChart(xhrdata);
    });
  }

  function whereToMark(line, xhrdata, modeOfTransport, latitudes, longitudes, map) {
    var totalDistance = 0;
    var minuteCount = 0;
    var distanceStorage = 0;
    var distancePerMinute = 0;

    if (modeOfTransport === 'WALKING') {
      distancePerMinute = 272.8002;
    } else if (modeOfTransport === 'BICYCLING') {
      distancePerMinute = 660;
    } else if (modeOfTransport === 'DRIVING') {
      distancePerMinute = 1320;
    }

    var ul = document.createElement('ul');
    ul.className = 'collection';
    ul.id = 'showresults';

    for (var i = 0; i < latitudes.length; i++) {
      var distanceBetween = earthDistance({
        lat: latitudes[i],
        lon: longitudes[i]
      }, {
        lat: latitudes[i + 1],
        lon: longitudes[i + 1]
      }) * 5280; // console.log(distanceBetween)

      if (i === latitudes.length - 1) {
        distanceBetween = 0;
      }
      if ((distanceStorage) > (distancePerMinute) || i === 0 || i === latitudes.length - 1) {
        if ((distanceStorage) > (distancePerMinute)) {
          distanceStorage = distanceStorage % (distancePerMinute);
        } else {
          distanceStorage += distanceBetween;
        }
        minuteCount = Math.round(totalDistance / (distancePerMinute));
        totalDistance += distanceBetween;
        createMarkers(xhrdata, minuteCount, line, i, map);
        fetchAndAppendData(xhrdata, minuteCount, latitudes[i], longitudes[i], ul);
      } else {
        distanceStorage += distanceBetween;
        totalDistance += distanceBetween;
      }
    }
    $('#weatherlisting').append(ul);
  }

  function createMarkers(xhrdata, minuteCount, line, i, map) {
    new google.maps.Marker({ // Create marker when distanceStorage exceeds 272.80002
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 3
      },
      position: line.getPath().getAt(i),
      animation: google.maps.Animation.DROP,
      map: map
    });
  }

  function fetchAndAppendData(xhrdata, minuteCount, latitude, longitude, ul) {
    var li = document.createElement('li');
    li.className = 'alisting collection-item row container col l12';

    var animdiv = document.createElement('div');
    animdiv.className = 'containingdiv';
    var span = document.createElement('span');
    var span2 = document.createElement('span');
    span.className = 'span1';
    span2.className = 'span2';

    var convertTime = new Date();
    var minutes = convertTime.getMinutes() + minuteCount;
    var hours = convertTime.getHours();
    var theTime = '';
    if (minutes > 59) {
      minutes = minutes - 60;
      hours += 1;
    }
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    if (hours < 13) {
      theTime = hours + ':' + minutes + ' am';
    } else {
      theTime = hours - 12 + ':' + minutes + ' pm';
    }
    var div1 = document.createElement('div');
    var p1 = document.createElement('p');

    p1.textContent = theTime;
    p1.className = 'time col l3';
    div1.appendChild(p1);
    span.appendChild(div1);

    // var probabilityArray = [];
    // var precipIntensityArray = [];

    var div2 = document.createElement('div');
    var p2 = document.createElement('p');
    var probability = Number(xhrdata.minutely.data[minuteCount].precipProbability) * 100;
    p2.textContent = probability + '%';
    p2.className = 'probability col l1';
    div2.appendChild(p2);
    span.appendChild(div2);

    var div3 = document.createElement('div');
    var p3 = document.createElement('p');
    p3.textContent = xhrdata.minutely.data[minuteCount].precipIntensity + ' in/hr';
    // var rainRate = xhrdata.minutely.data[minuteCount].precipIntensity;
    p3.className = 'precipIntensity col l2';
    div3.appendChild(p3);
    span.appendChild(div3);

    // var div4 = document.createElement('div');
    var address = '';
    $geocode = $.getJSON('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&sensor=false');
    $geocode.done(function (data) { // API call to retrieve human-readable address for lat,lng
      var p4 = document.createElement('p');
      p4.className = 'address col l6';
      for (var k = 0; k < 2; k++) {
        address = data.results[0].address_components[k].short_name;
        p4.textContent += address + ' ';
        span.appendChild(p4);
        li.appendChild(span2);
      }
      li.appendChild(span);
    });

    ul.appendChild(li);
  }

  function appendSummary(xhrdata) {
    var icons = new Skycons({
      'color': 'black'
    });
    var xhrIcon = xhrdata.currently.icon.toUpperCase().replace('-', '_');
    icons.set('skycon1', Skycons[xhrIcon]);
    icons.play();

    var table1 = document.createElement('table');
    table1.className = 'highlight';
    table1.id = 'currentdata';
    var tbody = document.createElement('tbody');
    for (key in xhrdata.currently) {
      var tr = document.createElement('tr');
      var td1 = document.createElement('td');
      td1.textContent = key;
      td1.style.fontWeight = 500;
      var td2 = document.createElement('td');
      if (key === 'time') {
        var convertTime = new Date(); //>>>>>>>>>>> Hideous
        var minutes = convertTime.getMinutes();
        var hours = convertTime.getHours();
        var theTime = '';
        if (minutes > 59) {
          minutes = minutes - 60;
          hours += 1;
        }
        if (minutes < 10) {
          minutes = '0' + minutes;
        }
        if (hours < 13) {
          theTime = hours + ':' + minutes + ' am';
        } else {
          theTime = hours - 12 + ':' + minutes + ' pm';
        }
        td2.textContent = theTime;
      } else if (key !== 'icon' || key !== 'ozone') {
        td2.textContent = xhrdata.currently[key];
      }
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
      table1.appendChild(tbody);
      document.getElementById('currentconditions').appendChild(table1);

    }
    var div = document.createElement('div');
    div.className = 'alisting';
    var hourSummary = document.createElement('p');
    hourSummary.textContent = xhrdata.minutely.summary;
    hourSummary.className = 'col l12';
    (div).appendChild(hourSummary);
    var weatherlisting = document.getElementById('weatherlisting');
    weatherlisting.appendChild(div);

    // if (hourSummary.textContent.indexOf('cloudy') !== -1) {
    //
    // }

  }

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

  // navigator.geolocation.watchPosition(function (position) {
  //   map = new google.maps.Map(document.getElementById('map-canvas'), { // This creates the initial map
  //     center: {
  //       lat: position.coords.latitude,
  //       lng: position.coords.longitude
  //     },
  //     disableDefaultUI: true,
  //     zoom: 12
  //   });
  // })
  ///MOVE

  function createHourlyChart(xhrdata) {
    var table1 = document.createElement('table');
    table1.className = 'highlight hourlyData';
    var thead = document.createElement('thead');
    var trhead = document.createElement('tr');
    var keys = ['time', 'summary', 'precipProbability', 'temperature', 'cloudCover'];
    var th = document.createElement('th');
    for (var j = 0; i < keys.length; j++) {
      th.textContent = key;
      trhead.appendChild(th);
      thead.appendChild(trhead);
    }
    table1.appendChild(thead);

    var tbody = document.createElement('tbody');
    for (var i = 0; i < xhrdata.hourly.data.length; i++) {
      var tr = document.createElement('tr');
      for (key in xhrdata.hourly.data[i]) {
        var td = document.createElement('td');
        if (key === 'time') {
          // console.log(moment.unix(xhrdata.hourly.data[i].time)._d);
          td.style.fontWeight = 500;
          td.textContent = moment.unix(xhrdata.hourly.data[i].time)._d;
        } else if (keys.indexOf(key) !== -1) {
          td.textContent = xhrdata.hourly.data[i][key];
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table1.appendChild(tbody);
    document.getElementById('hourlyForecast').appendChild(table1);
  }

  function createDailyChart(xhrdata) {
    // var summaryDiv = document.createElement('div');
    var p = document.createElement('p');
    var table1 = document.createElement('table');
    var thead = document.createElement('thead');
    var trhead = document.createElement('tr');
    var dailyForecast = document.getElementById('dailyForecast');

    p.textContent = xhrdata.daily.summary;

    dailyForecast.appendChild(p);
    table1.className = 'highlight dailyData';
    // var keys = ["time", "summary", "precipProbability", "temperature", "cloudCover", "temperatureMin", "temperatureMinTime", "temperatureMax"]
    var keys = ['time', 'summary', 'precipProbability', 'temperature', 'temperatureMin', 'temperatureMax'];
    var th = document.createElement('th');
    for (var j = 0; i < keys.length; j++) {
      th.textContent = key;
      trhead.appendChild(th);
      thead.appendChild(trhead);
    }
    table1.appendChild(thead);
    var tbody = document.createElement('tbody');
    for (var i = 0; i < xhrdata.daily.data.length; i++) {
      var tr = document.createElement('tr');
      for (key in xhrdata.daily.data[i]) {
        var td = document.createElement('td');
        if (key === 'time') {
          td.style.fontWeight = 500;
          td.textContent = moment.unix(xhrdata.daily.data[i].time)._d;
        } else if (keys.indexOf(key) !== -1) {
          td.textContent = xhrdata.daily.data[i][key];
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table1.appendChild(tbody);
    document.getElementById('dailyForecast').appendChild(table1);
  }

  // function init(latitude, longitude) {
  //   // Center  ( mercator coordinates )
  //   var lat = merc_x(longitude);
  //   var lon = merc_y(latitude);
  //
  //   // if  you use WGS 1984 coordinate you should  convert to mercator
  //   //	lonlat.transform(
  //   //		new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
  //   //		new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
  //   //	);
  //
  //   var lonlat = new OpenLayers.LonLat(lon, lat);
  //
  //   var weathermap = new OpenLayers.Map('basicMap');
  //
  //   // Create overlays
  //   // map layer OSM
  //   var mapnik = new OpenLayers.Layer.OSM();
  //   // Create station layer
  //   var stations = new OpenLayers.Layer.Vector.OWMStations('Stations');
  //   // Create weather layer
  //   var city = new OpenLayers.Layer.Vector.OWMWeather('Weather');
  //
  //   //connect layers to map
  //   weathermap.addLayers([mapnik, stations, city]);
  //
  //   // Add Layer switcher
  //   weathermap.addControl(new OpenLayers.Control.LayerSwitcher());
  //
  //   weathermap.setCenter(lonlat, 10);
  // }

  // function merc(x, y) {
  //   return [merc_x(x), merc_y(y)];
  // }

  function toStart (){
    var map = new google.maps.Map(document.getElementById('map-canvas'), { // This creates the initial map
      center: {
        lat: 47.59916,
        lng: -122.263689
      },
      disableDefaultUI: true,
      zoom: 12
    });

    $(document).ready(function () {
      $('ul.tabs').tabs();
    });
    initAutocomplete(map);
  }

  toStart();
});
