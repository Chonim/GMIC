var map;
var myLatLng;
var gasMap;
var infowindow;
var mapCanvasId;
var marker;
var place;
var circle;

var input;
var autocompletePlaceName;
var finalDestinationCoords;
var address;
var directionsDisplay;
var directionsService;
var line;
var animatePath;
var previousPage;
var localStorageLength;
var triggerRealDeparture;
var remainDistance;
var remainTime;
var waypointCoords;

var steps = [];
var destinationDetails = [];
var currentLocationArray = [];
var gasStationTextArray = [];
var gasStationLatlngArray = [];
var distanceMatrixArray = [];
var markersArray = [];
var getEstimatedDetailsResponse = [];

var mapTypeId = 'roadmap';
var autocomplete = null;
var isWaypoint = false;
var autocompleteClicked = 0;
var currentLocation = {lat: 37.7749295, lng: -122.4194155};
var countryRestrict = {'country': 'us'};
var voicesIndex = 2;

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
  isWaypoint = false;
  // console.log(viewportHeight);
  var viewportHeight = window.innerHeight;
  $('#map').css('height', viewportHeight-40);
  $('#openNav > span').show();
  mapCanvasId = 'map'
  var mapOptions = {
    center: currentLocation,
    zoom: 19,
    styles: styleArray,
    mapTypeId: mapTypeId
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

  // Draw circle around a marker
  drawCircle();

  map.setCenter(currentLocation);
  markersArray.push(marker);

  map.addListener('maptypeid_changed', function() {
    mapTypeId = map.getMapTypeId();
  })

  // Traffic Layer 추가
  // var trafficLayer = new google.maps.TrafficLayer();
  // trafficLayer.setMap(map);

  // 밤낮 에이어 추가
  // new DayNightOverlay({
  //     map: map
  // });

  // Get current location
  addYourLocationButton(map, marker);
}

function drawCircle() {
  circle = null;
  circle = new google.maps.Circle({
    radius: 30,
    center: currentLocation,
    map: map,
    fillColor: '#333333',
    fillOpacity: 0.15,
    strokeColor: '#333333',
    strokeOpacity: 0.6
  });
}

function addYourLocationButton(map, marker) {
    var controlDiv = document.createElement('div');
    var firstChild = document.createElement('button');
    firstChild.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    firstChild.style.border = 'none';
    firstChild.style.outline = 'none';
    firstChild.style.width = '28px';
    firstChild.style.height = '28px';
    firstChild.style.cursor = 'pointer';
    firstChild.style.marginRight = '10px';
    firstChild.style.padding = '0px';
    firstChild.title = 'My Location';
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
        var latlng = currentLocation;
        marker.setPosition(latlng);
        map.setCenter(latlng);
        map.setZoom(18);
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

// Show place info with right nav
function getAutocompleteResult() {
  previousPage = "autocomplete";
  closeNav();
  $('#map').css('width', '35%');
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
      if (autocomplete !== null) {
        place = autocomplete.getPlace();
        console.log(place);
        getPlaceAddress();

        autocompletePlaceName = place.name;
        if (isWaypoint == false) {
          finalDestinationCoords = place.geometry.location;
          marker = new google.maps.Marker({
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              strokeColor: "#73C3D6",
              scale: 8
            },
            position: finalDestinationCoords
          });
        } else {
          // Add as a waypoint
          console.log("wayway!");
          waypointCoords = place.geometry.location
          marker = new google.maps.Marker({
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              strokeColor: "#73C3D6",
              scale: 8
            },
            position: waypointCoords
          });
        }
      } else {  // autocomplete == null
        console.log("c");
        marker = new google.maps.Marker({
          map: map,
          position: currentLocation
        });
        // Set autocompletePlaceName, finalDestinationCoords and address beforehand
      }


      deleteMarkers(markersArray);
      markersArray.push(marker);

      $('#autocompletePlaceName').html(autocompletePlaceName);
      $('#autocompletePlaceCity').html(address);

      // Change star color if exists
      if (localStorage.getItem(autocompletePlaceName) !== null) {
        $('#favoriteAddBtn > a').html("&#9733;");
      }

      infowindow.setContent('<div><strong>' + autocompletePlaceName + '</strong><br>' + address);
      // infowindow.open(map, marker);

      // Decide if there is a waypoint
      console.log(isWaypoint);
      $('#map').css('width', '35%');
      if (isWaypoint == true) {
        // var waypoint = place.geometry.location;
        console.log(waypointCoords);
        getEstimatedDetails(waypointCoords);
      } else {
        getEstimatedDetails();
      }

      autocomplete = null;

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

// Show location of favorite item
function showPlaceInfo(index) {
  previousPage = "favorite";
  $('.favoriteListCloseBtn').trigger("click");
  var localStorageItem = JSON.parse(localStorage.getItem(localStorage.key(index)));

  autocompletePlaceName = localStorageItem.name;
  address = localStorageItem.address;
  if (isWaypoint == false) {
    finalDestinationCoords = localStorageItem.coords;
  } else {
    waypointCoords = localStorageItem.coords;
  }

  getAutocompleteResult();
}

//////////////////////////////////////////////////////// MAP ////////////////////////////////////////////////////////////////////
function gasMap() {
  previousPage = "gasMap";


  $('#map').css('float', 'left');
  $('#map').css('width', '45%');
  $('#header-title').html('주유소');
  $('#header').show('fast');
  $('#gasStationInfoBar').show('fast');
  $('#gasStationInfoBar').css('width', '55%');

  // Reset directions
  turnOffDirections();
  directionsDisplay = new google.maps.DirectionsRenderer;
  if (typeof directionsDisplay !== "undefined") {
    directionsDisplay.setMap(map);
  }
  infowindow = new google.maps.InfoWindow();

  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: currentLocation,
    radius: 3000,
    types: ['gas_station']
  }, gasMapCallback);
}

// Place Search Start
function gasMapCallback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < 10; i++) {
      createMarker(results[i]);
    }
    map.setZoom(13);
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
    autocompletePlaceName = place.name;
    address = place.vicinity;
    finalDestinationCoords = place.geometry.location;
    infowindow.setContent("<p><b>"+ place.name + "</b></p>" +
                          "<p>" + place.vicinity + "<p>" +
                          "<p><button onclick='markerOnClick()'>목적지로 설정</button><p>");
    infowindow.open(map, this);
  });
}
// Place Search End
function markerOnClick() {
  $('#gasStationInfoBar').hide('fast');
  $('#header').hide('fast');
  $('#map').css('float', 'right');
  getAutocompleteResult();

  resizeMap();
  // resizeMap();
}

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
  if ($('#mySidenav').width() == 864) {
    $('#map').css('width', '100%');
  }
  $('#menuList').hide("slow");
}
// Sidebar end

function openRightBar() {
  loadingImage();
  $('#map').css('width', '35%');
  $('#rightBar').css('width', '65%');
  $('#realDeparture').html("출발");
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
    $('#navigationBottomBar').css('height','100%');
  } else {
    $('#navigationBottomBar').css('height','50px');
  }
}

function getEstimatedDetails(wypts) {
  google.maps.event.trigger(map, "resize");
  var wayPoints = [];
  if (typeof wypts !== 'undefined') {
    wayPoints.push({
      location : wypts,
      stopover : true
    });
  }
  turnOffDirections(); // reset directions

  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer;

  var request = {
    origin: currentLocation,
    waypoints: wayPoints,
    destination: finalDestinationCoords,
    unitSystem: google.maps.UnitSystem.METRIC,
    travelMode: google.maps.TravelMode.DRIVING
  }

  directionsService.route(request, function(response) {
    console.log(response);
    // for (i = 0; i < response.routes[0].legs.length; i++) {
    //   destinationDetails.push(response.routes[0].legs[i])
    // }
    destinationDetails = response.routes[0].legs[0];
    console.log(destinationDetails)
    directionsDisplay.setDirections(response);
    directionsDisplay.setMap(map);
    steps = destinationDetails.steps;
    $('#autocompletePlaceDistance').html(destinationDetails.distance.text + " 떨어져 있음");
    getEstimatedDetailsResponse = response;
  });
  // map.setZoom(20);
  // map.setCenter(finalDestinationCoords);

  // Save recent destination in sessionStorage
  var recentDesination = JSON.stringify({'name': autocompletePlaceName, 'coords': finalDestinationCoords, 'address': address});
  sessionStorage.setItem(autocompletePlaceName, recentDesination);
  autocomplete = null;
}

function turnOffDirections() {
  directionsService = null;
  directionsDisplay = null;
}

function createPolyline(directionResult) {
  if (isWaypoint == true) {
    clearInterval(animatePath);
  }
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
  // for(var j=1; j=10; j++){
  //   var subLat = (path[i].lat()+path[i+1].lat())/2;
  //   var subLng = (path[i].lat()+path[i+1].lng())/2;
  //   console.log(new google.maps.LatLng(subLat, subLng));
  //   // map.setCenter(new google.maps.LatLng(subLat, subLng));
  //   map.setCenter(path[i]);
  //   marker.setPosition(path[i]);
  //   sleep(30);
  // }

  line.setMap(map);
  map.fitBounds(bounds);
  map.setZoom(18);
  animate(entirePath);
};

function animate(path) {
    var i = 0;
    var leg = 0;
    console.log(map.getZoom());
    $('#header').show();
    animatePath = setInterval(function() {
      // if (i = 0) {
      //   map.setZoom(17);
      // }
      if (path[i].toString() == steps[leg].path[0].toString()) {
        // Change zoom when there is an instruction
        if (map.getZoom() !== 17) {
          map.setZoom(17);
        }
        if (leg < steps.length) {
          $('#header-title').html(steps[leg].instructions);

          var text = $('#header-title').text();
          var voices;
          var msg;

          function loadVoices() {
            voices = speechSynthesis.getVoices();
            // console.log(voices[i].name);

            msg.voice = voices[voicesIndex];
            msg.volume = 3;

            // Optional

            // Speak only if it's a new one
            if (msg.text !== text) {
              msg.text = text;
              console.log(msg.text);

              // Queue this utterance.
              window.speechSynthesis.speak(msg);
              // console.log(msg);
            }
          }
          msg = new SpeechSynthesisUtterance();

          if ( window.speechSynthesis.onvoiceschanged == null) {
            window.speechSynthesis.onvoiceschanged = function(e) {
              loadVoices();
            };
          } else {
            loadVoices();
          }

          leg++;

          if (leg == steps.length) {
            leg = 0;
            // i = 0;
          }
        }
      }
      i++;

      // Close when reached a destination
      if (i == path.length) {
        currentLocation = path[i-1];
        clearInterval(animatePath);
        i=0;
        $('#estimatedTime').html(0 + " 분");
        $('#estimatedDistance').html(0 + " m");
        $('#goToAutocomplete').hide('fast');
        $('#header').hide('fast');
        $('#header-title').html("");
        $('#navigationBottomBar').hide('fast');
        $('#bottomBar').show('fast');
        initMap();
      } else {
        marker.setPosition(path[i]);
        currentLocation = path[i];
        infowindow.close();
        map.setCenter(path[i]);

        var remainMinutes = (remainTime-remainTime*(i/path.length))/60;
        var remainHours = parseInt(remainMinutes/60);
        var remainDays = parseInt(remainMinutes/60/24);

        // Calculate and display remain time
        if (remainMinutes >= 60*24) {
          if (remainDays > 0) {
            $('#estimatedTime').html(remainDays + " 일 " + remainHours%24 + " 시간")
          } else if (remainHours > 0) {
            $('#estimatedTime').html(remainHours + " 시간 " + parseInt(remainMinutes%60) + " 분");
          } else {
            $('#estimatedTime').html(parseInt(remainMinutes%60) + " 분");
          }
        } else if (remainMinutes >= 60) {
          if (remainHours < 1) {
            $('#estimatedTime').html(parseInt(remainMinutes%60) + " 분");
          } else {
            $('#estimatedTime').html(remainHours + " 시간 " + parseInt(remainMinutes%60) + " 분");
          }
        } else if (remainMinutes >= 0) {
          $('#estimatedTime').html(parseInt(remainMinutes) + " 분");
        }

        // Calculate and display remain distance
        if (parseInt((remainDistance-remainDistance*(i/path.length))/1000) >= 1) {
          $('#estimatedDistance').html(parseInt((remainDistance-remainDistance*(i/path.length))/1000).toLocaleString() + " km");
        } else {
          $('#estimatedDistance').html(parseInt(remainDistance-remainDistance*(i/path.length)) + " m");
        }
      }
  }, 200); // default: 200
};

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
  var totalDistance = 0;

  var originalRoutes = getEstimatedDetailsResponse.routes[0];
  console.log(originalRoutes);
  steps = [];
  var originalLegs = originalRoutes.legs;
  for (i=0;i<originalLegs.length;i++) {
    totalDistance += originalRoutes.legs[i].distance.value;
    durationText += originalRoutes.legs[i].duration.value;
    // destinationDetails.push(originalLegs);
    var originalSteps = originalRoutes.legs[i].steps;
    for (j=0;j<originalSteps.length;j++) {
      steps.push(originalSteps);
      // var nextSegment = steps[j].path;
      // for (k=0;k<nextSegment.length;k++) {
      //   entirePath.push(nextSegment[k]);
      // }
    }
  }

  // parse distance
  if (totalDistance >= 1000) {
    $('#estimatedDistance').html(parseInt((totalDistance/1000)).toLocaleString() + " km");
  } else {
    $('#estimatedDistance').html(totalDistance + " m");
  }

  remainTime = durationText;
  remainDistance = totalDistance;

  var remainMinutes = remainTime/60;
  var remainHours = parseInt(remainMinutes/60);
  var remainDays = parseInt(remainMinutes/60/24);

  if (remainMinutes >= 60*24) {
    if (remainDays > 0) {
      $('#estimatedTime').html(remainDays + " 일 " + remainHours%24 + " 시간")
    } else if (remainHours > 0) {
      $('#estimatedTime').html(remainHours + " 시간 " + parseInt(remainMinutes%60) + " 분");
    } else {
      $('#estimatedTime').html(parseInt(remainMinutes%60) + " 분");
    }
  } else if (remainMinutes >= 60) {
    if (remainHours < 1) {
      $('#estimatedTime').html(parseInt(remainMinutes%60) + " 분");
    } else {
      $('#estimatedTime').html(remainHours + " 시간 " + parseInt(remainMinutes%60) + " 분");
    }
  } else if (remainMinutes >= 0) {
    $('#estimatedTime').html(parseInt(remainMinutes) + " 분");
  }

  arrivalMinutes = estimatedMinutes + currentMinutes;
  arrivalHours = estimatedHours + currentHours;

  if (arrivalMinutes > 59) {
    arrivalHours++;
    arrivalMinutes = arrivalMinutes % 60;
  }
  if (arrivalHours > 23) {
    arrivalHours = (arrivalHours % 24) - 1;
  }

  // Panel body
  $('.showTime').html(parseInt(arrivalHours) + ":"+ (arrivalMinutes < 10 ? "0" + arrivalMinutes : arrivalMinutes));
  $('#destinationName').html(autocompletePlaceName);


  // Get street view panorama
  var panorama = new google.maps.StreetViewPanorama(
    document.getElementById('destinationPanorama'), {
      position: finalDestinationCoords,
      pov: {
        heading: 34,
        pitch: 10
      }
    }
  );
  map.setStreetView(panorama);
  //
  // $('#destinationRoutes').html("<img src='https://maps.googleapis.com/maps/api/streetview?size=500x500&location="
  //               							+ finalDestinationCoords
  //               							+ "&heading=151.78&pitch=-0.76&key=AIzaSyBsYVLaGllEz-XZYoF6xv_wqPsrG0k7oFs"
  //               							+ "'>")
}

function getPlaceDetails() {
  var request = {
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4'
  };

  service = new google.maps.places.PlacesService(map);
  service.getDetails(request, callback);

  function callback(place, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      createMarker(place);
      console.log(place)
    }
  }
}

function resizeMap() {
  window.setTimeout(function() {
    google.maps.event.trigger(map, "resize");
    map.setCenter(currentLocation);
  }, 500);
}

function loadingImage() {
  $('#loadingDialog').modal('show');
  setTimeout(function() {
    $('#loadingDialog').modal('hide');
  }, 2000);
}

$(document).ready(function() {

  initMap();

  $('#cancelBtn').hide();
  $('.gasMenu').hide();
  $("#bottomDest").hide();
  $('#menuList').hide();
  $('#navigationBottomBar').hide();
  $('#header').hide();
  $('#header-title').html("");

  $('.openFavoriteList').click(function() {
    if ($('#favoriteListContents > a').html() !== null) {
      $('.favoriteListContentsItem').remove();
    }
    for(var i = 0; i < localStorage.length; i++) {
      $('#favoriteListContents').append('<a href="#" class="favoriteListContentsItem" onclick="showPlaceInfo(\'' + i + '\')">&#9733; ' + localStorage.key(i) + '</a>');
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
    inputFocusOrGoToAutocomplete();
  });

  $('#pac-input').keypress(function() {
    if (autocomplete == null) {
      autoComplete();
    }
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
    clearInterval(animatePath);
    clearTimeout(triggerRealDeparture);
    turnOffDirections();
    if (previousPage == "favorite") {
      $('.openFavoriteList').trigger("click");
      initMap();
    } else if (previousPage == "gasMap") {
      $('.gasMenu').trigger("click");
      // $('#map').css('width', '45%');
      // initMap();
    } else if (previousPage == "autocomplete") {
      initMap();
      openNav();
    }
    closeRightBar();
    $('#bottomBar').show();
    $('#navigationBottomBar').hide();
    $('#goToAutocomplete').hide();
    autocompleteClicked = 1;
  });

  $('#OpenFavoriteAskModal').click(function() {
    $('#favoriteName').val(autocompletePlaceName);
  })

  $('#favoriteNameComplete').click(function() {
    var favoriteName = $('#favoriteName').val();
    var favoriteObject = {'name': favoriteName, 'coords': finalDestinationCoords, 'address': address};

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
    $('#openNav > span').hide();
    $('#navigationBottomBar').css('height','100%');
    $('#navigationBottomBar').show('fast');

    // Automatic transition to navigation
    triggerRealDeparture = setTimeout(function() {
      $('#realDeparture').trigger("click");
    }, 10000);
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
    if ($('#realDeparture').html() == "닫기" && isWaypoint == false) {
      // $('#navigationBottomBar').hide('fast');
      // $('#bottomBar').show('fast');
      console.log("close clicked")
    } else {
      console.log(getEstimatedDetailsResponse);
      closeRightBar();
      resizeMap();
      getEstimatedDetails();
      createPolyline(getEstimatedDetailsResponse);
      map.setZoom(20);
      isWaypoint = false;
    }
    clearTimeout(triggerRealDeparture);
    navigationBottomBarToggle();
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
    // $('#header').show('fast');
    $('#header-title').html('집 & 직장');
  })

  $('#navagationClose').click(function() {
    clearInterval(animatePath);
    closeRightBar();
    initMap();
    $('#header').hide('fast');
    $('#navigationBottomBar').hide();
    $('#bottomBar').show();
    $('#realDeparture').html("출발");
  })

  $('.close-home-work').click(function() {
    $('#header').hide('fast');
  })

  $('#header-close').click(function() {
    // $('#closeAskModal').trigger("click");
    if (confirm('정말 종료하시겠습니까?')) {
      clearInterval(animatePath);
      closeRightBar();
      $('#header').hide('fast');
      $('#gasStationInfoBar').css('width', '0%');
      $('#map').css('width', '100%');
      $('#navigationBottomBar').hide('fast');
      $('#bottomBar').show('fast');
      initMap();
      resizeMap();
    } else {
      // Keep navigating
    }
  })

  $('#addWaypoints').click(function() {
    clearTimeout(triggerRealDeparture);
    isWaypoint = true;
    navigationBottomBarToggle();
    closeRightBar();
    openNav();
  })

  $('#microphone').click(function() {
    $("#waitDialog").trigger("click");
    startButton(event);
  })
})
