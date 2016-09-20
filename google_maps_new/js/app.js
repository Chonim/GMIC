var map;
var myLatLng;
var gasMap;
var infowindow;
var mapCanvasId;
var marker;
var place;

var input;
var autocompletePlaceName;
var autocompleteLocation;
var address;
var destinationDetails;
var directionsDisplay;
var directionsService;
var steps;
var line;

var currentLocationArray = [];
var gasStationTextArray = [];
var gasStationLatlngArray = [];
var distanceMatrixArray = [];
var markersArray = [];
var getEstimatedDetailsResponse = [];

var autocomplete = null;
var isWaypoint = false;
var autocompleteClicked = 0;
var currentLocation = {lat: 37.7749295, lng: -122.4194155};
var countryRestrict = {'country': 'us'};

var date = new Date();

// Map style
var styleArray = [
  {
    featureType: 'all',
    stylers: [
      { saturation: -80 }
    ]
  },{
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [
      { hue: '#00ffee' },
      { saturation: 50 }
    ]
  },{
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      { visibility: 'on' },
      { color: '#D6EBEF' },
      { hue : '#D6EBEF' }
    ]
  }
];

function initMap() {
  currentLocation = {lat: 37.7749295, lng: -122.4194155}
  var viewportHeight = window.innerHeight;
  $('#map').css('height', viewportHeight-60);
  mapCanvasId = 'map'
  var mapOptions = {
    center: currentLocation,
    zoom: 19,
    styles: styleArray
  }

  map = new google.maps.Map(document.getElementById(mapCanvasId),
    mapOptions
  );

  infowindow = new google.maps.InfoWindow();

  marker = new google.maps.Marker({
  map: map,
  icon: {
    path: google.maps.SymbolPath.CIRCLE,
    strokeColor: "#73C3D6",
    scale: 8
  },
  position: currentLocation
    // anchorPoint: new google.maps.Point(0, -29)


  });

  var circle = new google.maps.Circle({
    radius: 30,
    center: currentLocation,
    map: map,
    fillColor: '#333333',
    fillOpacity: 0.15,
    strokeColor: '#333333',
    strokeOpacity: 0.6
  });
  markersArray.push(marker);

  // Traffic Layer 추가
  var trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);

  // 밤낮 에이어 추가
  // new DayNightOverlay({
  //     map: map
  // });

  // Get current location
  addYourLocationButton(map, marker);
}

function addYourLocationButton(map, marker) {
    var controlDiv = document.createElement('div');

    var firstChild = document.createElement('button');
    firstChild.style.backgroundColor = '#fff';
    firstChild.style.border = 'none';
    firstChild.style.outline = 'none';
    firstChild.style.width = '28px';
    firstChild.style.height = '28px';
    firstChild.style.borderRadius = '2px';
    firstChild.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
    firstChild.style.cursor = 'pointer';
    firstChild.style.marginRight = '10px';
    firstChild.style.padding = '0px';
    firstChild.title = 'Your Location';
    controlDiv.appendChild(firstChild);

    var secondChild = document.createElement('div');
    secondChild.style.margin = '0px';
    secondChild.style.width = '32px';
    secondChild.style.height = '32px';
    secondChild.style.backgroundImage = 'url(image/located.png)';
    secondChild.style.backgroundSize = '32px 32px';
    secondChild.style.backgroundPosition = '0px 0px';
    secondChild.style.backgroundRepeat = 'no-repeat';
    secondChild.id = 'you_location_img';
    firstChild.appendChild(secondChild);

    firstChild.addEventListener('click', function() {
        var imgX = '0';
        var animationInterval = setInterval(function(){
            if(imgX == '-18') imgX = '0';
            else imgX = '-18';
            $('#you_location_img').css('background-position', imgX+'px 0px');
        }, 500);
        var latlng = new google.maps.LatLng(currentLocation);
        marker.setPosition(latlng);
        map.setCenter(latlng);
        map.setZoom(20);
        clearInterval(animationInterval);
        // $('#you_location_img').css('background-position', '-144px 0px');
    });

    controlDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(controlDiv);
}

function autoComplete() {
  input = /** @type {!HTMLInputElement} */(
            document.getElementById('pac-input'));
  // Autocomplete
  autocomplete = new google.maps.places.Autocomplete(input, {
    componentRestrictions: countryRestrict
  });
  autocomplete.bindTo('bounds', map);
  autocomplete.addListener('place_changed', function() {
    getAutocompleteResult()
  });
}

function getAutocompleteResult() {
  closeNav();
  $('#map').css('float', 'left');
  $('#mySidenav').css('width', '0%');
  // $('#goToAutocomplete').show();
  $('#bottomBar').hide();

  // When a place clicked
  openRightBar();

  setTimeout(
    function()
    {

      //do something special
      infowindow.close();
      marker.setVisible(true);
      console.log(autocomplete);
      if (autocomplete !== null) {
        place = autocomplete.getPlace();
        getPlaceAddress();

        autocompletePlaceName = place.name;
        autocompleteLocation = place.geometry.location;
      } else {
        // Set autocompletePlaceName, autocompleteLocation and address beforehand
      }

      marker = new google.maps.Marker({
        map: map,
        position: autocompleteLocation
      });
      deleteMarkers(markersArray);
      markersArray.push(marker);

      $('#autocompletePlaceName').html(autocompletePlaceName);
      $('#autocompletePlaceCity').html(address);

      // Change star color if exists
      if (localStorage.getItem(autocompletePlaceName) !== null) {
        $('#favoriteAddBtn > a').html("&#9733;");
      }

      infowindow.setContent('<div><strong>' + autocompletePlaceName + '</strong><br>' + address);
      infowindow.open(map, marker);

      // Decide if there is a waypoint
      console.log(isWaypoint);
      if (isWaypoint == true) {
        getEstimatedDetails(autocompleteLocation);
      } else {
        getEstimatedDetails();
      }

    }, 800);
}

function getPlaceAddress() {
  address = '';
  if (place.address_components) {
    address = [
      (place.address_components[0] && place.address_components[0].short_name || ''),
      (place.address_components[1] && place.address_components[1].short_name || ''),
      (place.address_components[2] && place.address_components[2].short_name || '')
    ].join(' ');
  }
}

function showPlaceInfo(index) {
  $('.favoriteListCloseBtn').trigger("click");
  var localStorageItem = JSON.parse(localStorage.getItem(localStorage.key(index)));

  autocompletePlaceName = localStorageItem.name;
  address = localStorageItem.address;
  autocompleteLocation = localStorageItem.coords;

  getAutocompleteResult();
}

//////////////////////////////////////////////////////// MAP ////////////////////////////////////////////////////////////////////
function gasMap() {

  $('#map').css('float', 'left');
  $('#map').css('width', '45%');
  $('#header-title').html('주유소');
  $('#header').show('fast');
  $('#gasStationInfoBar').show('fast');
  $('#gasStationInfoBar').css('width', '55%');
  if (typeof directionsDisplay !== "undefined") {
    directionsDisplay.setMap(null);
  }
  infowindow = new google.maps.InfoWindow();

  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: currentLocation,
    radius: 3000,
    types: ['gas_station']
  }, callback);
}

// Place Search Start
function callback(results, status) {

  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < 10; i++) {
      createMarker(results[i]);
    }

    map.setZoom(14);
    resizeMap();
    distanceMatrix();
  }
}

function createMarker(place) {
  if (currentLocationArray.length < 10) {
    currentLocationArray.push(currentLocation);
    gasStationLatlngArray.push(place.geometry.location);
    gasStationTextArray.push([place.name, place.vicinity])
  }
  var marker = new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    icon: 'image/gas-station.png'
    // icon: place.icon
  });
  markersArray.push(marker);
  console.log(place.vicinity);
  // console.log(place);

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent("<p><b>"+ place.name + "</b></p>" + "<p>" + place.vicinity + "<p>");
    input = place.name;
    autocomplete = place.vicinity;
    infowindow.open(map, this);
  });
}
// Place Search End

function distanceMatrix() {
  var geocoder = new google.maps.Geocoder;
  var service = new google.maps.DistanceMatrixService;
  service.getDistanceMatrix({
    origins: currentLocationArray,
    destinations:  gasStationLatlngArray,
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: false,
    avoidTolls: false
  }, function(response, status) {
    if (status !== google.maps.DistanceMatrixStatus.OK) {
      alert('Error was: ' + status);
    } else {
      var originList = response.originAddresses;
      var destinationList = response.destinationAddresses;
      var outputDiv = document.getElementById('output');

      for (var i = 0; i < originList.length; i++) {
        var results = response.rows[i].elements;
        for (var j = 0; j < results.length; j++) {
          if (distanceMatrixArray.length < 10) {
            distanceMatrixArray.push([results[j].distance.text, results[j].duration.text]);
          }
        }
      }

      // Show gas stations info
      showGasStationsInfo();
    }
  });
}

function showGasStationsInfo() {
  for (i=0; i<distanceMatrixArray.length; i++) {
    var gasStationText = "<div class='gasStation col-sm-10'><img src='image/gas-station.png' />"
                       + "<span width='60%'><strong>" + gasStationTextArray[i][0] + "</strong><br />" // 이름
                       + gasStationTextArray[i][1] + "</span><span>" // 주소
                       + distanceMatrixArray[i][0] + "<br />" // 거리
                       + distanceMatrixArray[i][1] + "</span>" // 시간
                       + "</div>";
    $('#gasInfoPanel').append(gasStationText);
    console.log(gasStationTextArray[i][0] + gasStationTextArray[i][1] + gasStationLatlngArray[i] + distanceMatrixArray[i][0] + distanceMatrixArray[i][1]);
  }
}

function backFromGas() {
  initMap();
  $('#header').hide('fast');
  $('#gasStationInfoBar').hide('fast');
  openNav();
}

function deleteMarkers(markersArray) {
  for (var i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
  markersArray = [];
}

// Sidebar start
function openNav() {
  if (autocompleteClicked == 1) {
    $('#mySidenav').css('width', '100%');
  } else {
    $('#mySidenav').css('width', '90%');
  }
  $('#microphone').css('height', '80%');
  $('#map').css('float', 'right');
  $('#map').css('width', '10%');
  // $('#bottomBar').css('width', '10%');
  $('#menuList').show("fast");
}

function closeNav() {
  $('#microphone').css('height', '0%');
  if($('#mySidenav').width() > 1) {
    resizeMap();
  }
  $('#mySidenav').css('width', '0%');
  $('#bottomBar').css('width', '100%');
  $('#map').css('width', '100%');
  $('#menuList').hide("slow");
}
// Sidebar end

function openRightBar() {
  $('#map').css('width', '35%');
  $('#rightBar').css('width', '65%');
  // console.log(map.getBounds())
}

function closeRightBar() {
  $('#rightBar').css('width', '0%');
  $('#map').css('width', '100%');
  $('#map').css('float', 'right');
  resizeMap();
}

function inputFocusOrGoToAutocomplete() {
  $('#mySidenav').css('width', '100%');
  $('#pac-input').css('width', '85%');
  $('#cancelBtn').show();
  $('#mySidenav').css('background-color', '#D4E1E4');
  $('.gasMenu').show();
  $('#favoriteAddBtn > a').html("&#9734;");
}

function navigationBottomBarToggle(e) {
  if ($('#navigationBottomBar').height() < 60) {
    $('#navigationBottomBar').css('height','680px');
  } else {
    $('#navigationBottomBar').css('height','50px');
  }
}

function getEstimatedDetails(wypts) {
  var wayPoints = [];
  if (wypts !== null) {
    wayPoints.push({
      location : wypts,
      stopover : true
    });
  } else {
    // wayPoints.push({
    //   location : null,
    //   stopover : false
    // });
  }
  directionsService = null; // reset directions
  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer;
  directionsService.route({
    origin: currentLocation,
    // waypoints: wayPoints,
    destination: autocompleteLocation,
    unitSystem: google.maps.UnitSystem.METRIC,
    travelMode: google.maps.TravelMode.DRIVING
  }, function(response) {
      map.setZoom(20);
      directionsDisplay.setMap(map);
      destinationDetails = response.routes[0].legs[0];
      // directionsDisplay.setMap(map);
      directionsDisplay.setDirections(response);
      steps = destinationDetails.steps;
        // console.log(steps[i].maneuver + steps[i].distance.text + steps[i].instructions);
      $('#autocompletePlaceDistance').html(destinationDetails.distance.text + " 떨어져 있음");
      getEstimatedDetailsResponse = response;
  });
  map.setCenter(autocompleteLocation);
  google.maps.event.trigger(map, "resize");
}

function createPolyline(directionResult) {
  line = null;
  line = new google.maps.Polyline({
      path: [],
      strokeColor: '#FF0000',
      strokeOpacity: 0.5,
      strokeWeight: 4,
      icons: [{
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            strokeColor: '#393'
          },
          offset: '100%'
        }]
  });
  var bounds = new google.maps.LatLngBounds();
  var entirePath = [];
  var legs = directionResult.routes[0].legs;
  for (i=0;i<legs.length;i++) {
    var steps = legs[i].steps;
    for (j=0;j<steps.length;j++) {
      var nextSegment = steps[j].path;
      for (k=0;k<nextSegment.length;k++) {
        line.getPath().push(nextSegment[k]);
        bounds.extend(nextSegment[k]);
        entirePath.push(nextSegment[k]);
      }
    }
  }

  line.setMap(map);
  map.fitBounds(bounds);
  // animate(directionResult.routes[0].overview_path);
  animate(entirePath);
  console.log(entirePath.length);
};

function animate(path) {
    var i = 0;
    var leg = 0;
    // console.log(path[5].toString())
    map.setZoom(18);
    var animatePath = setInterval(function() {
      // console.log(path[i].toString())
      if (path[i].toString() == steps[leg].path[0].toString()) {
        $('#header').show();
        if (leg < steps.length) {
          $('#header-title').html(steps[leg].instructions);

          var text = $('#header-title').text();
          var voices;
          var msg;

          function loadVoices() {
            voices = speechSynthesis.getVoices();
            // console.log(voices);

            msg.voice = voices[2];
            msg.volume = 3;

            console.log(msg.text);
            // Speak only if it's a new one
            if (msg.text !== text) {
              msg.text = text;

              // Queue this utterance.
              window.speechSynthesis.speak(msg);
              // console.log(msg);
            }
          }

          msg = new SpeechSynthesisUtterance();
          // console.log(msg.voice);

          window.speechSynthesis.onvoiceschanged = function(e) {
            loadVoices();
          };
          loadVoices();
          leg++;
          if (leg == steps.length) {
            leg = 0;
            // i = 0;
          }
        }
      }
      i++;
      if (i == path.length) {
        clearInterval(animatePath);
        i=0;
        $('#goToAutocomplete').hide('fast');
        $('#header').hide('fast');
        $('#navigationBottomBar').hide('fast');
        $('#bottomBar').show('fast');
        initMap();
      } else {
        infowindow.close();
        map.panTo(path[i]);
        marker.setPosition(path[i]);
      }
  }, 30); // default: 300
};

// Shows route and text 1 by 1
function simulateRoute() {
  $('#header').show();
  var index = steps.length;
  map.setZoom(10);
  for (var i = 0; i < steps.length; i++) {
    // $('#header-title').append('<br />' + steps[i].instructions);
  }
  window.setInterval(function(){
    // console.log(steps.length);
    // console.log(steps.length - index);
    if (index > 0) {
      map.setZoom(17);
      // map.panTo(steps[steps.length - index].start_location);
      marker = null;
      marker = new google.maps.Marker({
        map: map,
        position: steps[steps.length - index].start_location
        // anchorPoint: new google.maps.Point(0, -29)
      });
      console.log(index)
      $('#header-title').html(steps[steps.length - index].instructions);
      var text = $('#header-title').text();

      var voices;
      var msg;

      function loadVoices() {
        voices = speechSynthesis.getVoices();
        // console.log(voices);

        msg.voice = voices[2];
        msg.text = text;
        msg.volume = 3;

        // Queue this utterance.
        window.speechSynthesis.speak(msg);
        // console.log(msg);
      }

      msg = new SpeechSynthesisUtterance();
      // console.log(msg.voice);
      window.speechSynthesis.onvoiceschanged = function(e) {
        loadVoices();
      };
      loadVoices();

      index--;
    } else {
      index = steps.length;
    }
  }, 2000); // Ideal: 5000ms
}

function showTravelDetails() {
  // Time and Distance
  var currentHours = date.getHours();
  var currentMinutes = date.getMinutes();
  var arrivalHours = 0;
  var arrivalMinutes = 0;
  var estimatedTime = destinationDetails.duration.value;
  var estimatedHours = estimatedTime/3600;
  var estimatedMinutes = parseInt(estimatedTime/60);
  var durationText = '';

  durationText = destinationDetails.duration.text;
  durationText.replace("hour", "시간");
  var mapObj = {
    days:"일",
    day:"일",
    hours:"시간",
    hour:"시간",
    mins:"분",
    min:"분",
  }
  durationText = durationText.replace(/days|day|hours|hour|mins|min/gi, function(matched) {
    return mapObj[matched];
  })
  $('#estimatedTime').html(durationText);

  arrivalMinutes = estimatedMinutes + currentMinutes;
  arrivalHours = estimatedHours + currentHours;
  if (arrivalMinutes > 59) {
    arrivalHours++;
    arrivalMinutes = arrivalMinutes % 60;
  }
  if (arrivalHours > 23) {
    arrivalHours = (arrivalHours % 24) - 1;
  }

  // console.log(destinationDetails.duration);
  console.log(arrivalMinutes);

  // Panel body

  $('.showTime').html(parseInt(arrivalHours) + ":"+ (arrivalMinutes < 10 ? "0" + arrivalMinutes : arrivalMinutes));
  // $('.showTime').html(destinationDetails.duration.text);
  $('#estimatedDistance').html(destinationDetails.distance.text);
  $('#destinationName').html(autocompletePlaceName);
}

function resizeMap() {
  window.setTimeout(function() {
    google.maps.event.trigger(map, "resize");
    map.setCenter(currentLocation);
  }, 500);
}

$(document).ready(function() {

  initMap();

  $('#cancelBtn').hide();
  $('.gasMenu').hide();
  $("#bottomDest").hide();
  $('#menuList').hide();
  $('#navigationBottomBar').hide();
  $('#header').hide();

  $('.openFavoriteList').click(function() {
    if ($('#favoriteListContents > a').html() == null) {
      for(var i = 0; i < localStorage.length; i++) {
        $('#favoriteListContents').append('<a href="#" class="favoriteListContentsItem" onclick="showPlaceInfo(\'' + i + '\')">&#9733; ' + localStorage.key(i) + '</a>');
      }
    }
  })

  $('.favoriteListContentsItem').click(function() {
    $('.favoriteListCloseBtn').trigger("click");
  })

  $('#map').click(function() {
    closeNav();
    // window.setTimeout(function() {
    //   google.maps.event.trigger(map, "resize");
    //   map.setCenter(currentLocation);
    // }, 500);
    // $('#map').css('width', '100%');
  });

  $('#pac-input').focus(function() {
    $('.headerBox').css('height', '0');
    $('.menuDefault').hide();
    autoComplete();
    inputFocusOrGoToAutocomplete()
  });

  $('#pac-input').focus(function() {
    autocomplete = null;
  });

  $('#cancelBtn').click(function() {
    $('.headerBox').css('height', '100px');
    $('.menuDefault').show();
    $('#mySidenav').css('width', '90%');
    $('#pac-input').css('width', '90%');
    $('#cancelBtn').hide();
    $('#mySidenav').css('background-color', '#FFF');
    $('.gasMenu').hide()
  })

  $('.gasMenu').click(function() {
    closeNav();
    gasMap();
  })

  $('#goToAutocomplete').click(function() {
    $('#rightBar').css('width', '0%');
    $('#menuList').show("fast");
    inputFocusOrGoToAutocomplete()
  })

  $('#closeRightSidebarBtn').click(function() {
    closeRightBar();
    $('#bottomBar').show();
    $('#goToAutocomplete').hide();
    autocompleteClicked = 1;
    var marker = new google.maps.Marker({
      map: map,
      position: currentLocation
      // anchorPoint: new google.maps.Point(0, -29)
    });
  });

  $('#OpenFavoriteAskModal').click(function() {
    $('#favoriteName').val(autocompletePlaceName);
  })

  $('#favoriteNameComplete').click(function() {
    var favoriteName = $('#favoriteName').val();
    var favoriteObject = {'name': favoriteName, 'coords': autocompleteLocation, 'address': address};

    if (localStorage.getItem(favoriteName) === null) {
      localStorage.setItem(favoriteName, JSON.stringify(favoriteObject));
      // localStorage.setItem(favoriteName, favoriteObject);
      $('#favoriteAddBtn > a').html("&#9733;");
    } else {
      alert("즐겨찾기가 이미 존재합니다");
    }
  })

  $('#departureBtn').click(function() {
    showTravelDetails();
    $('#navigationBottomBar').show('slow');
    navigationBottomBarToggle();
  })

  $('.navigationBottomBarTitle').click(function() {
    navigationBottomBarToggle();
    if ($('.navigationBottomBarBody').height() < 60) {
      // $('.navigationBottomBarBody').css('height','680px');
      // $('.navigationBottomBarBody').show('fast');
    } else {
      // $('.navigationBottomBarBody').css('height','0px');
      // $('.navigationBottomBarBody').hide('slow');
    }
  })

  $('#realDeparture').click(function() {
    closeRightBar();
    navigationBottomBarToggle();
    resizeMap();
    // simulateRoute();
    getEstimatedDetails();
    createPolyline(getEstimatedDetailsResponse);

    map.setZoom(20);
    $('#realDeparture').html("닫기");
  });

  $('#pac-input').keypress(function(e) {
    if (e.which == 13) {
      // When enter pressed
    }
  })

  $('#header-back').click(function() {
    backFromGas();
  })

  $('.gasStation').click(function() {
    console.log(this);
  })

  $('.home-office').click(function() {
    $('#header').show('fast');
    $('#header-title').html('집 & 직장');
  })

  $('#navagationClose').click(function() {
    closeRightBar();
    initMap();
    $('#navigationBottomBar').hide();
    $('#bottomBar').show();
    $('#realDeparture').html("출발");
  })

  $('.close-home-work').click(function() {
    $('#header').hide('fast');
  })

  $('#header-close').click(function() {
    $('#header').hide('fast');
    $('#gasStationInfoBar').css('width', '0%');
    $('#map').css('width', '100%');
    initMap();
    resizeMap();
  })

  $('#favoriteListContents > a').click(function() {
    console.log(this);
  })

  $('#addWaypoints').click(function() {
    isWaypoint = true;
    navigationBottomBarToggle();
    closeRightBar();
    openNav();
  })
})
