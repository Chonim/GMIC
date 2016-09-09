var map;
var myLatLng;
var gasMap;
var infowindow;
var mapCanvasId;
var marker;

var autocompletePlaceName;
var autocompleteLocation;
var address;
var destinationDetails;

var autocompleteClicked = 0;
var currentLocation = {lat: 37.7749295, lng: -122.4194155};
var date = new Date();

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
    position: currentLocation
    // anchorPoint: new google.maps.Point(0, -29)
  });

  // Traffic Layer 추가
  var trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);

  // 밤낮 에이어 추가
  // new DayNightOverlay({
  //     map: map
  // });

  autoComplete();
}

function autoComplete() {

  var input = /** @type {!HTMLInputElement} */(
            document.getElementById('pac-input'));

  // Autocomplete
  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);
  autocomplete.addListener('place_changed', function() {

    closeNav();
    $('#map').css('transition', '0');
    $('#map').css('float', 'left');
    $('#mySidenav').css('width', '0%');
    $('#map').css('width', '35%');
    $('#goToAutocomplete').show();
    $('#bottomBar').hide();

    // When a place clicked

    openRightBar();

    setTimeout(
      function()
      {
        //do something special
        infowindow.close();
        marker.setVisible(false);
        var place = autocomplete.getPlace();
        if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);  // Why 17? Because it looks good.
        }
        // marker.setIcon(/** @type {google.maps.Icon} */({
        //   url: place.icon,
        //   size: new google.maps.Size(71, 71),
        //   origin: new google.maps.Point(0, 0),
        //   anchor: new google.maps.Point(17, 34),
        //   scaledSize: new google.maps.Size(35, 35)
        // }));
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        address = '';
        if (place.address_components) {
          address = [
            (place.address_components[0] && place.address_components[0].short_name || ''),
            (place.address_components[1] && place.address_components[1].short_name || ''),
            (place.address_components[2] && place.address_components[2].short_name || '')
          ].join(' ');
        }

        autocompletePlaceName = place.name;
        autocompleteLocation = place.geometry.location;

        $('#autocompletePlaceName').html(place.name);
        $('#autocompletePlaceCity').html(address);

        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
        infowindow.open(map, marker);

        getEstimatedDetails();

      }, 500);
    // $("#bottomDest").show();

  });
}

//////////////////////////////////////////////////////// MAP ////////////////////////////////////////////////////////////////////

function gasMap() {
  mapCanvasId = 'gasMap';

  map = new google.maps.Map(document.getElementById(mapCanvasId), {
    center: currentLocation,
    zoom: 15
  });

  infowindow = new google.maps.InfoWindow();

  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: currentLocation,
    radius: 500,
    types: ['gas_station']
  }, callback);
}

// Place Search Start
function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
      console.log(results[i]);
    }
  }
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
    map.setCenter(this.getPosition());
    map.setZoom(10);
  });
}
// Place Search End

// Sidebar start
function openNav() {
  if (autocompleteClicked == 1) {
    $('#mySidenav').css('width', '100%');
  } else {
    $('#mySidenav').css('width', '90%');
  }
  $('#microphone').css('height', '80%');
  $('#map').css('width', '10%');
  // $('#bottomBar').css('width', '10%');
  $('#menuList').show("fast");
}

function closeNav() {
  $('#microphone').css('height', '0%');
  $('#mySidenav').css('width', '0%');
  $('#map').css('width', '100%');
  $('#bottomBar').css('width', '100%');
  $('#menuList').hide("slow");
}
// Sidebar end

function openRightBar() {
  $('#rightBar').css('width', '65%');
}

function closeRightBar() {
  $('#rightBar').css('width', '0%');
  $('#map').css('width', '100%');
  $('#map').css('float', 'right');
  map.panTo(currentLocation);
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

function getEstimatedDetails() {
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  directionsService.route({
    origin: currentLocation,
    destination: autocompleteLocation,
    unitSystem: google.maps.UnitSystem.METRIC,
    travelMode: google.maps.TravelMode.DRIVING
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      destinationDetails = response.routes[0].legs[0];
      directionsDisplay.setMap(map);
      directionsDisplay.setDirections(response);
      map.setZoom(20);
      // console.log(response.routes[0].legs[0]);
      console.log(destinationDetails);
      console.log(directionsDisplay);
      $('#autocompletePlaceDistance').html(destinationDetails.distance.text + " 떨어져 있음");
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
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

  if (estimatedHours < 1) {
    $('#estimatedTime').html(estimatedMinutes + "분");
  } else {
    $('#estimatedTime').html(estimatedHours + "시간 " + estimatedMinutes + "분");
  }

  arrivalMinutes = estimatedMinutes + currentMinutes;
  arrivalHours = estimatedHours + currentHours;

  if (arrivalMinutes > 59) {
    arrivalHours++;
    arrivalMinutes-=60;
  }

  // Panel body


  // $('#estimatedTime')
  $('.showTime').html(parseInt(arrivalHours) + ":"+ (arrivalMinutes < 10 ? "0" + arrivalMinutes : arrivalMinutes));
  $('#estimatedDistance').html(destinationDetails.distance.text);
  $('#destinationName').html(autocompletePlaceName);

}

$(document).ready(function() {
  initMap();
  // gasMap();

  $('#cancelBtn').hide();
  $('.gasMenu').hide();
  $("#bottomDest").hide();
  $('#menuList').hide();
  $('#goToAutocomplete').hide();
  $('#navigationBottomBar').hide();

  $('.openFavoriteList').click(function() {
    if ($('#favoriteListContents > a').html() == null) {
      for(var i = 0; i < localStorage.length; i++) {
        $('#favoriteListContents').append('<a href="#" class="favoriteListContentsItem">&#9733; ' + localStorage.key(i) + '</a>');
        console.log(localStorage.key(i));
      }
    }
  })

  $('.favoriteListContentsItem').click(function() {
    $('.favoriteListCloseBtn').trigger("click");
  })

  $('#map').click(function() {
    closeNav();
  });

  $('#pac-input').focus(function() {
    $('.headerBox').css('height', '0');
    $('.menuDefault').hide();
    inputFocusOrGoToAutocomplete()
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
    gasMap();
  })

  $("#bottomDest").click(function() {
    // alert($("#bottomDest").height());
    if ($("#bottomDest").height() == 48) {
      $("#bottomDest").animate (
        { height: "500px"}
      )
    } else if ($("#bottomDest").height() == 498) {
      $("#bottomDest").animate (
        { height: "50px"}
      )
    }
  })

  $('#goToAutocomplete').click(function() {
    $('#rightBar').css('width', '0%');
    $('#menuList').show("fast");
    $('#favoritesModal').show();
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
    var favoriteObject = { 'name': favoriteName, 'coords': autocompleteLocation, 'address': address };

    if (localStorage.getItem(favoriteName) === null) {
      localStorage.setItem(favoriteName, JSON.stringify(favoriteObject));
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
      $('.navigationBottomBarBody').css('height','680px');
      $('.navigationBottomBarBody').show('fast');
    } else {
      $('.navigationBottomBarBody').css('height','0px');
      $('.navigationBottomBarBody').hide('slow');
    }
  })

  $('#realDeparture').click(function() {
    closeRightBar();
    navigationBottomBarToggle();
    $('#realDeparture').html("닫기");
  })

  // $("#bottomDestContainer").hover(function(){
  //     $("#bottomDest").slideToggle();
  // }, function(){
  //     $("#bottomDest").slideToggle();
  // });

})
