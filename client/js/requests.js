var result;

this.Requests = new (function(){

	function getSpeedColor(speed){
		if (speed > 90){
			return '#00b000';
		}
		else if (speed > 50) {
			return '#709000';
		}
		else if (speed === 50){
			return '#c0c000';
		}
		else{
			return '#c00000';
		}
	}

	this.findPathRequest = ()=>{

		if (lines.length > 0){
			lines.forEach((x)=>{
				map.removeLayer(x);
			});
			lines = [];
		}

		if (startMarker === null || finishMarker === null){
			alert('Zadajte pociatocny a koncovy bod.');
			return;
		}

		var a = startMarker.getLatLng();
		var b = finishMarker.getLatLng();

		fetch('findpath',{
			method: 'POST',
			headers: new Headers({'Content-Type': 'application/json'}),
			body: JSON.stringify([[a.lng,a.lat],[b.lng,b.lat]])
		}).then((response)=>{
			response.json().then((json)=>{
				// vykresli cestu
				json.forEach((row)=>{
					var coordinates = JSON.parse(row.geojson).coordinates.map((x)=>{return [x[1],x[0]]});
					var polyline = L.polyline(coordinates, {color: getSpeedColor(row.maxspeed_forward)}).addTo(map);
					lines.push(polyline);
				});

				// vypise metadata
				var length       = json.reduce((x,y)=>{return x + y.length},0);
				var elapsed_time = json.reduce((x,y)=>{return x + y.elapsed_time},0);
				var hours   = Math.floor(elapsed_time);
				var minutes = Math.floor((elapsed_time % 1) * 60);
				document.getElementById('travel-distance').textContent = Math.round(length);
				document.getElementById('travel-duration').textContent = hours + ":" + ((minutes < 10) ? '0' + minutes : minutes);
			});
		},errorHandler);
	}bde99Zbi

	this.findItemsRequest = ()=>{
		if (markers.length > 0){
			markers.forEach((x)=>{
				map.removeLayer(x);
			});
			markers = [];
		}

		var checkboxes = document.querySelectorAll('.checkbox.flexcheck')[0].querySelectorAll('input[type=checkbox]');
		var checkboxes = Array.prototype.map.call(checkboxes,(x)=>{return {id:x.id,checked:x.checked}});

		var body = {
			start: [startMarker.getLatLng().lng, startMarker.getLatLng().lat],
			finish: [finishMarker.getLatLng().lng, finishMarker.getLatLng().lat],
			path: lines.map((x)=>{return x.getLatLngs().map((x)=>{return [x.lng,x.lat]})}),
			checkboxes: checkboxes,
			length: Number(document.getElementById('travel-distance').textContent)
		}
		fetch('finditems',{
			method: 'POST',
			headers: new Headers({'Content-Type': 'application/json'}),
			body: JSON.stringify(body)
		}).then((response)=>{
			response.json().then((json)=>{
				console.log("som tu");
				if (json['pump']){
					showPoints(json,'pump');
				}
				if (json['sleep']){
					showPoints(json,'sleep');
				}
				if (json['food']){
					showPoints(json,'food');
				}
				if (json['history']){
					showPoints(json,'history');
				}
			});
		});

		function showPoints(json, id){

			var symbol = {
				'sleep' : 'lodging',
				'pump' : 'fuel',
				'history': 'town-hall',
				'food': 'restaurant'
			}

			var color = {
				'sleep' : '#ffffff',
				'pump' : '#000000',
				'history': '#701000',
				'food': '#ffa010'
			}

			json[id].forEach((x)=>{
				var coords = JSON.parse(x.geojson).coordinates;
				coords = [coords[1],coords[0]];

				var marker = new L.marker(coords, {
					icon: L.mapbox.marker.icon({
						'marker-size': 'large',
						'marker-symbol': symbol[id],
						'marker-color': color[id]
					})
				}).addTo(map);

				marker.bindPopup('<span>'+x.name+'</span>');
				markers.push(marker);
			});
		}
	};


	function errorHandler(res){
		console.log("Request failed!");
		console.log(response);
	}
})();
