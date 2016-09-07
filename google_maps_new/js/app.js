var map;
var myLatLng;
var gasMap;
var infowindow;
var mapCanvasId;
var currentLocation = {lat: 37.7749295, lng: -122.4194155};

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

  var marker = new google.maps.Marker({
    map: map,
    position: currentLocation
    // anchorPoint: new google.maps.Point(0, -29)
  });

  var input = /** @type {!HTMLInputElement} */(
            document.getElementById('pac-input'));

  // Traffic Layer 추가
  var trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);

  // 밤낮 에이어 추가
  // new DayNightOverlay({
  //     map: map
  // });

  // Autocomplete
  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  autocomplete.addListener('place_changed', function() {

    $('#mySidenav').css('width', '0%');
    console.log('dd');
    // $('#map').css('width', '100%');
    $('#bottomBar').hide();

    // When a place clicked
    closeNav();
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

        console.log(place.geometry.location);
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

        var address = '';
        if (place.address_components) {
          address = [
            (place.address_components[0] && place.address_components[0].short_name || ''),
            (place.address_components[1] && place.address_components[1].short_name || ''),
            (place.address_components[2] && place.address_components[2].short_name || '')
          ].join(' ');
        }

        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
        infowindow.open(map, marker);
      }, 500);
    // $("#bottomDest").show();

  });
}

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
  });
}
// Place Search End

// Sidebar start
function openNav() {
  $('#microphone').css('height', '80%');
  $('#mySidenav').css('width', '90%');
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
  $('#rightBar').css('width', '50%');
}

$(document).ready(function() {
  initMap();

  $('#cancelBtn').hide();
  $('.gasMenu').hide();
  $("#bottomDest").hide();
  $('#menuList').hide();

  $('#map').click(function() {
    closeNav();
  });

  $('#pac-input').focus(function() {
    $('.headerBox').css('height', '0');
    $('.menuDefault').hide();
    $('#mySidenav').css('width', '100%');
    $('#pac-input').css('width', '85%');
    $('#microphone').css('width', '6%');
    $('#cancelBtn').show();
    $('#mySidenav').css('background-color', '#D4E1E4');
    $('.gasMenu').show();
  });

  $('#cancelBtn').click(function() {
    $('.headerBox').css('height', '100px');
    $('.menuDefault').show();
    $('#mySidenav').css('width', '90%');
    $('#pac-input').css('width', '90%');
    $('#microphone').css({"height":"80%", "width":"7%"});
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

  // $("#bottomDestContainer").hover(function(){
  //     $("#bottomDest").slideToggle();
  // }, function(){
  //     $("#bottomDest").slideToggle();
  // });


})
