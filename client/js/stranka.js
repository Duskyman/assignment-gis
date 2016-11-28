var map;
var initial_coords = {lat: 48.15, lng: 17.11};
var initial_zoom = 12;

// specialne markery
var mapMarker = null;
var startMarker = null;
var finishMarker = null;

// vyselectovane markery
var lines   = [];
var markers = [];

 document.addEventListener("DOMContentLoaded", function(event) {
 	init();
 });

 function init(){

	L.mapbox.accessToken = 'pk.eyJ1IjoiZHVza3ltYW4iLCJhIjoiY2l2YjExc2lkMDAzeDJvbGFoMGd5bXE4eCJ9.i4-RBGH5AtH-79WmQ9UJPQ';
  map = L.mapbox.map('map', 'mapbox.streets').setView([initial_coords.lat,initial_coords.lng], initial_zoom);
 	initUI();
 }

// inicializacia tlacitok
 function initUI(){
   // vyber startu cesty
   document.getElementById('BTN-setstart').addEventListener('click',()=>{
     map.off('click');
     map.once('click', (e)=>{
       if (startMarker !== null){
         map.removeLayer(startMarker);
       }
       startMarker = L.marker([e.latlng.lat,e.latlng.lng], {
         icon: L.mapbox.marker.icon({
           'marker-size': 'large',
           'marker-color': '#0000ff',
           'marker-symbol': 'heart'
         })
       }).addTo(map);
     });
   });

   // vyber konca cesty
   document.getElementById('BTN-setfinish').addEventListener('click',()=>{
     map.off('click');
     map.once('click', (e)=>{
       if (finishMarker !== null){
         map.removeLayer(finishMarker);
       }
       finishMarker = L.marker([e.latlng.lat,e.latlng.lng], {
         icon: L.mapbox.marker.icon({
           'marker-size': 'large',
           'marker-color': '#0000ff',
           'marker-symbol': 'campsite'
         })
       }).addTo(map);
     });
   });

   // spustenie vyhladavania cesty
   document.getElementById('BTN-findpath').addEventListener('click', ()=>{
     Requests.findPathRequest();
   });

   // spustenie vyhladavania points of interest
   document.getElementById('BTN-finditems').addEventListener('click', ()=>{
     Requests.findItemsRequest();
   });
 }
