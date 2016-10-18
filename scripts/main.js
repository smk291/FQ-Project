$(function () {
  function initAutocomplete(map) { //--> This initializes the autocomplete forms
    let input2 = document.getElementById('origin');
    let input3 = document.getElementById('destination');
    let searchBox2 = new google.maps.places.SearchBox(input2);
    let searchBox3 = new google.maps.places.SearchBox(input3);
    let originFormattedAddress;
    let destinationFormattedAddress;

    searchBox2.addListener('places_changed', function () {
      originFormattedAddress = searchBox2.getPlaces()[0].formatted_address;
    });
    searchBox3.addListener('places_changed', function () {
      destinationFormattedAddress = searchBox3.getPlaces()[0].formatted_address;

    });

    searchBox2.addListener('places_changed', function () {
      let places = searchBox2.getPlaces();
      if (places.length === 0) {
        return;
      }
    });
    searchBox3.addListener('places_changed', function () {
      let places = searchBox3.getPlaces();
      if (places.length === 0) {
        return;
      }
    });

    $('#searchbutton').on('click', function () {
      event.preventDefault();
      if (typeof originFormattedAddress === 'string' && typeof destinationFormattedAddress === 'string') {
        initialize(originFormattedAddress, destinationFormattedAddress, map);
      }
    });
  }

  function initialize(originFormattedAddress, destinationFormattedAddress, map) { //  ---->  This is the function that generates map and directions
    $('#currentconditions').empty();
    $('#weatherlisting').empty();
    $('#hourlyForecast').empty();

    let mapOptions = {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: {
        lat: 47.59916,
        lng: -122.333689
      },
      zoom: 13
    };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    directionsService = new google.maps.DirectionsService();
    calcRoute(directionsService, map, originFormattedAddress, destinationFormattedAddress);
  }

  function calcRoute(directionsService, map, originFormattedAddress, destinationFormattedAddress) { // ----> This calculates the route using user-selected addresses
    let modeOfTransport;
    let transportChoices = document.getElementsByName('transport');

    for (let i = 0; i < transportChoices.length; i++) {
      if (transportChoices[i].checked) {
        modeOfTransport = transportChoices[i].id;
        break;
      }
    }

    let request;

    if (modeOfTransport === 'WALKING') {
      request = {
        origin: originFormattedAddress,
        destination: destinationFormattedAddress,
        travelMode: google.maps.TravelMode.WALKING
      };
    } else if (modeOfTransport === 'BICYCLING') {
      request = {
        origin: originFormattedAddress,
        destination: destinationFormattedAddress,
        travelMode: google.maps.TravelMode.BICYCLING
      };
    } else if (modeOfTransport === 'DRIVING') {
      request = {
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
      let newLatCenter = (map.getBounds().f.b + map.getBounds().f.f) / 2;
      let newLngCenter = Math.max(map.getBounds().b.f, map.getBounds().b.b) - Math.abs((map.getBounds().b.f - map.getBounds().b.b) / 2.85);
      map.setCenter({
        'lat': newLatCenter,
        'lng': newLngCenter
      });
    });
  }

  function createPolyline(directionResult, modeOfTransport, map) { // ----> This function creates polyLines

    let latitudes = [];
    let longitudes = [];

    let line = new google.maps.Polyline({
      path: directionResult.routes[0].overview_path,
      strokeColor: '#0000aa',
      strokeOpacity: 0.5,
      strokeWeight: 10
    });

    line.setMap(map);

    for (let i = 0; i < line.getPath().length; i++) {
      latitudes.push(line.getPath().getAt(i).lat(arguments));
      longitudes.push(line.getPath().getAt(i).lng(arguments));
    }

    let centerLatitude = (latitudes[0] + latitudes[latitudes.length - 1]) / 2;
    let centerLongitude = (longitudes[0] + longitudes[longitudes.length - 1]) / 2;

    markersAndForecast(line, centerLatitude, centerLongitude, modeOfTransport, latitudes, longitudes, map);
  }

  function markersAndForecast(line, centerLatitude, centerLongitude, modeOfTransport, latitudes, longitudes, map) { // ----> API Request to forecastIO at passed coordinates

    let $xhr = $.getJSON('https://crossorigin.me/https://api.forecast.io/forecast//' + centerLatitude + ',' + centerLongitude);
    $xhr.done(function (xhrdata) {
      createHourlyChart(xhrdata);
      appendSummary(xhrdata);
      whereToMark(line, xhrdata, modeOfTransport, latitudes, longitudes, map);
      createDailyChart(xhrdata);
    });
  }

  function whereToMark(line, xhrdata, modeOfTransport, latitudes, longitudes, map) {
    let totalDistance = 0;
    let minuteCount = 0;
    let distanceStorage = 0;
    let distancePerMinute = 0;

    if (modeOfTransport === 'WALKING') {
      distancePerMinute = 272.8002;
    } else if (modeOfTransport === 'BICYCLING') {
      distancePerMinute = 660;
    } else if (modeOfTransport === 'DRIVING') {
      distancePerMinute = 1320;
    }

    let ul = document.createElement('ul');
    ul.className = 'collection';
    ul.id = 'showresults';

    for (let i = 0; i < latitudes.length; i++) {
      let distanceBetween = earthDistance({
        lat: latitudes[i],
        lon: longitudes[i]
      }, {
        lat: latitudes[i + 1],
        lon: longitudes[i + 1]
      }) * 5280;

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
    new google.maps.Marker({
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
    let li = document.createElement('li');
    li.className = 'alisting collection-item row container col l12';

    let animdiv = document.createElement('div');
    animdiv.className = 'containingdiv';
    let span = document.createElement('span');
    let span2 = document.createElement('span');
    span.className = 'span1';
    span2.className = 'span2';

    let convertTime = new Date();
    let minutes = convertTime.getMinutes() + minuteCount;
    let hours = convertTime.getHours();
    let theTime = '';
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
    let div1 = document.createElement('div');
    let p1 = document.createElement('p');

    p1.textContent = theTime;
    p1.className = 'time col l3';
    div1.appendChild(p1);
    span.appendChild(div1);

    let div2 = document.createElement('div');
    let p2 = document.createElement('p');
    let probability = Number(xhrdata.minutely.data[minuteCount].precipProbability) * 100;
    p2.textContent = probability + '%';
    p2.className = 'probability col l1';
    div2.appendChild(p2);
    span.appendChild(div2);

    let div3 = document.createElement('div');
    let p3 = document.createElement('p');
    p3.textContent = xhrdata.minutely.data[minuteCount].precipIntensity + ' in/hr';
    p3.className = 'precipIntensity col l2';
    div3.appendChild(p3);
    span.appendChild(div3);

    let address = '';
    $geocode = $.getJSON('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&sensor=false');
    $geocode.done(function (data) {
      let p4 = document.createElement('p');
      p4.className = 'address col l6';
      for (let k = 0; k < 2; k++) {
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
    let icons = new Skycons({
      'color': 'black'
    });
    let xhrIcon = xhrdata.currently.icon.toUpperCase().replace('-', '_');
    icons.set('skycon1', Skycons[xhrIcon]);
    icons.play();

    let table1 = document.createElement('table');
    table1.className = 'highlight';
    table1.id = 'currentdata';
    let tbody = document.createElement('tbody');
    for (key in xhrdata.currently) {
      let tr = document.createElement('tr');
      let td1 = document.createElement('td');
      td1.textContent = key;
      td1.style.fontWeight = 500;
      let td2 = document.createElement('td');
      if (key === 'time') {
        let convertTime = new Date();
        let minutes = convertTime.getMinutes();
        let hours = convertTime.getHours();
        let theTime = '';
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
    let div = document.createElement('div');
    div.className = 'alisting';
    let hourSummary = document.createElement('p');
    hourSummary.textContent = xhrdata.minutely.summary;
    hourSummary.className = 'col l12';
    (div).appendChild(hourSummary);
    let weatherlisting = document.getElementById('weatherlisting');
    weatherlisting.appendChild(div);
  }

  function earthDistance(coord1, coord2) {
    let RADIUS_OF_EARTH = 3961; // miles
    let lat1 = coord1.lat * Math.PI / 180;
    let lat2 = coord2.lat * Math.PI / 180;
    let lon1 = coord1.lon * Math.PI / 180;
    let lon2 = coord2.lon * Math.PI / 180;

    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;

    let a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) *
      Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return RADIUS_OF_EARTH * c;
  }

  function createHourlyChart(xhrdata) {
    let table1 = document.createElement('table');
    table1.className = 'highlight hourlyData';
    let thead = document.createElement('thead');
    let trhead = document.createElement('tr');
    let keys = ['time', 'summary', 'precipProbability', 'temperature', 'cloudCover'];
    let th = document.createElement('th');
    for (let j = 0; j < keys.length; j++) {
      th.textContent = keys[j];
      trhead.appendChild(th);
      thead.appendChild(trhead);
    }
    table1.appendChild(thead);

    let tbody = document.createElement('tbody');
    for (let i = 0; i < xhrdata.hourly.data.length; i++) {
      let tr = document.createElement('tr');
      for (key in xhrdata.hourly.data[i]) {
        let td = document.createElement('td');
        if (key === 'time') {
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
    let p = document.createElement('p');
    let table1 = document.createElement('table');
    let tbody = document.createElement('tbody');
    let dailyForecast = document.getElementById('dailyForecast');
    let tr1 = document.createElement('tr');

    p.textContent = xhrdata.daily.summary;
    dailyForecast.appendChild(p);
    table1.className = 'highlight dailyData';

    let keys = ['time', 'summary', 'precipProbability', 'temperature', 'temperatureMin', 'temperatureMax'];

    for (let i = 0; i < xhrdata.daily.data.length; i++) {
      let tr = document.createElement('tr');
      for (key in xhrdata.daily.data[i]) {
        let td = document.createElement('td');
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

  function toStart (){
    let map = new google.maps.Map(document.getElementById('map-canvas'), {
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
