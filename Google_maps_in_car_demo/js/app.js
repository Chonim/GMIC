// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});

var map;
var pyrmont = {lat: 36.579, lng: -118.292};

// 지도 초기화
function initMap() {
  // The following path marks a path from Mt. Whitney, the highest point in the
  // continental United States to Badwater, Death Valley, the lowest point.
  var path = [
      {lat: 36.579, lng: -118.292},  // Mt. Whitney
      {lat: 36.606, lng: -118.0638},  // Lone Pine
      {lat: 36.433, lng: -117.951},  // Owens Lake
      {lat: 36.588, lng: -116.943},  // Beatty Junction
      {lat: 36.34, lng: -117.468},  // Panama Mint Springs
      {lat: 36.24, lng: -116.832}];  // Badwater, Death Valley

  pyrmont = path[1];

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 8,
    center: pyrmont,
    mapTypeId: 'terrain', //
    rotateControl: true,
    mapTypeControl: true,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    },
    scaleControl: true,
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
    }
  });

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);

  // Create an ElevationService.
  var elevator = new google.maps.ElevationService;
  var markers = [];

  // Places 객체 생성
  var service = new google.maps.places.PlacesService(map);
  service.textSearch({
    location: pyrmont,
    radius: 500,
    types: ['store']
  }, processResults);

  // Traffic Layer 추가
  var trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);

  // 밤낮 에이어 추가
  new DayNightOverlay({
      map: map
  });


  // Autocomplete 검색 박스 넣기
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // 버튼 생성 테스트
  var getCurrentCarPositionButton = document.getElementById('ccp-button');
  getCurrentCarPositionButton.style.height = "20px";
  getCurrentCarPositionButton.style.width = "20px";
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(getCurrentCarPositionButton);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });

  // Draw the path, using the Visualization API and the Elevation service.
  displayPathElevation(path, elevator, map);
}

function processResults(results, status, pagination) {
  if (status !== google.maps.places.PlacesServiceStatus.OK) {
    return;
  } else {
    createMarkers(results);

    if (pagination.hasNextPage) {
      var moreButton = document.getElementById('more');

      moreButton.disabled = false;

      moreButton.addEventListener('click', function() {
        moreButton.disabled = true;
        pagination.nextPage();
      });
    }
  }
}

// Places search 마커 생성
function createMarkers(places) {
  var bounds = new google.maps.LatLngBounds();
  var placesList = document.getElementById('places');

  for (var i = 0, place; place = places[i]; i++) {
    var image = {
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(25, 25)
    };

    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      title: place.name,
      position: place.geometry.location
    });

    placesList.innerHTML += '<li>' + place.name + '</li>';

    bounds.extend(place.geometry.location);
  }
  // map.fitBounds(bounds);
}

// 경로 고도 표시
function displayPathElevation(path, elevator, map) {
  // Display a polyline of the elevation path.
  new google.maps.Polyline({
    path: path,
    strokeColor: '#0000CC',
    opacity: 0.4,
    map: map
  });

  // Create a PathElevationRequest object using this array.
  // Ask for 256 samples along that path.
  // Initiate the path request.
  elevator.getElevationAlongPath({
    'path': path,
    'samples': 256
  }, plotElevation);

}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(elevations, status) {
  var chartDiv = document.getElementById('elevation_chart');
  // var chartDiv = document.createElement('div');
  if (status !== google.maps.ElevationStatus.OK) {
    // Show the error code inside the chartDiv.
    chartDiv.innerHTML = 'Cannot show elevation: request failed because ' +
        status;
    return;
  }
  // Create a new chart in the elevation_chart DIV.
  var chart = new google.visualization.ColumnChart(chartDiv);

  // Extract the data from which to populate the chart.
  // Because the samples are equidistant, the 'Sample'
  // column here does double duty as distance along the
  // X axis.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Sample');
  data.addColumn('number', 'Elevation');
  for (var i = 0; i < elevations.length; i++) {
    data.addRow(['', elevations[i].elevation]);
  }

  // Draw the chart using the data within its DIV.
  chart.draw(data, {
    height: 150,
    legend: 'none',
    titleY: 'Elevation (m)'
  });

  // map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(chartDiv);
}

function getCurrentCarPosition() {

}

$(document).ready(function() {
  initMap();
  startButton(event);

  // $("#pac-input").on('change', function() {
  //   var e = $.Event( "keypress", { which: 13 } );
  //   $('#pac-input').trigger(e);
  //   console.log('뭐야');
  // });

  // trigger enter
  // var e = jQuery.Event("keydown");
  // e.which = 13; // # Some key code value
  // $("#pac-input").trigger(e);

  $('#ccp-button').click(function() {
    map.setCenter(pyrmont);
  })
})
