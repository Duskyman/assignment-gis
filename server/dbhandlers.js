// Requires
var pg = require('pg');
var fs = require('fs');
// ----------

// Globals
var pool;

// initialization
(()=>{
	fs.readFile('dbconfig.txt', 'utf8', function (err,data) {
	  if (err) {
	    return console.log(err);
	  }
	  var lines    = data.split(/\r*\n/);
	  var dbconfig = lines.reduce((result,line)=>{
	  	var words  = line.split(/\s+/);
	  	if (words.length >= 2) {
	  		result[words[0]] = words[1];
	  	}
	  	return result;
	  },{});

	  pool = new pg.Pool({
	  	user:     dbconfig['user'],
	  	password: dbconfig['password'],
	  	host:     dbconfig['host'],
	  	database: dbconfig['database'],
	  	idleTimeoutMillis: 1000
	  });

	  pool.on('error', function(e, client){
	  	console.log('POOL.ON ERROR');
	  	console.log(e);
	  });

	  console.log('Pool created');
	});
})();

exports.handleRequest = (req, res) => {
	var handler = req.url.substr(1);
	if (handlers[handler]){
		handlers[handler](req, res);
	}
};

var handlers = {};

handlers.findpath = (req, res) => {
	pool.connect((err, client, done)=>{
		if (err){
			return done(err);
		}

		var point1 = req.body[0];
		var point2 = req.body[1];

		var pathQuery = `with point1 as (
	select source
	from ways
	where class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401
	order by st_distance(
		(select st_makepoint(` + point1[0] + `, ` + point1[1] + `, 4326)::geography),
		the_geom
	) limit 1
),
point2 as (
	select source
	from ways
	where class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401
	order by st_distance(
		(select st_makepoint(` + point2[0] + `, ` + point2[1] + `, 4326)::geography),
		the_geom
	) limit 1
)
select st_AsGeoJson(the_geom) geojson, length_m/1000 as length, maxspeed_forward, length_m/1000/maxspeed_forward as elapsed_time from pgr_dijkstra(
	'select gid as id, source, target, cost_s as cost from ways where class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401',
	(select source from point1),
	(select source from point2),
	false
)
join ways on (edge = gid)`;

		client.query(pathQuery,(err, result)=>{
			if (err){
				return done(err);
			}
			done();
			res.set('Content-Type', 'text/plain');

			var length       = result.rows.reduce((x,y)=>{return x + y.length},0);
			var elapsed_time = result.rows.reduce((x,y)=>{return x + y.elapsed_time},0);



			//console.log(result.rows[0].geojson);

			console.log("elapsed time: " + elapsed_time);
			console.log("dlzka cesty:  " + length);

			console.log('hotovo, posielam response');
			// res.send(result.rows[0].geojson);
			res.send(JSON.stringify(result.rows));
		});

	});
};

handlers.finditems = (req, res)=>{

	var makeLineStr = `	select ST_setSRID(ST_MakeLine(ARRAY[`;
	req.body.path.forEach((x,y)=>{makeLineStr += "ST_MakePoint("+x[0]+"), ST_MakePoint("+x[1]+")" + ((y+1 !== req.body.path.length)?',':'')});
	makeLineStr += "]),4326)::geography l";

	makeLineStr = `with line as(
` + makeLineStr + `
)
`;

	pool.connect((err, client, done)=>{
		if (err){
			return done(err);
		}

		var iterator = 0;
		var max = 0;
		var obj = {};

		req.body.checkboxes.forEach((x)=>{
			if (x.checked){
				max++;
			}
		});

		console.log("pocet zaskrtnutych = " + max);

		req.body.checkboxes.forEach((x)=>{
			if (x.checked){
				var qs;
				if (x.id === "sleep"){
							qs = `select name, st_asGeoJson(st_transform(way,4326)) geojson
							from planet_osm_point
							where tourism in('hotel', 'penzion')
							AND st_distance(ST_Transform(way,4326),(select l from line)) < 2000`;
						}
						else if (x.id === "pump"){
							qs = `select name, st_asGeoJson(st_transform(way,4326)) geojson
							from planet_osm_point
							where amenity='fuel'
							AND st_distance(ST_Transform(way,4326),(select l from line)) < 2000`;
						}
						else if (x.id === "food"){
							qs = `select name, st_asGeoJson(st_transform(way,4326)) geojson
							from planet_osm_point
							where amenity in('restaurant', 'fast_food')
							AND st_distance(ST_Transform(way,4326),(select l from line)) < 2000`;
						}
						else if (x.id === "history"){
							qs = `select name, st_asGeoJson(st_transform(way,4326)) geojson
							from planet_osm_point
							where historic in('ruins', 'castle', 'monastery', 'church')
							AND st_distance(ST_Transform(way,4326),(select l from line)) < 10000`;
						}
					//console.log(makeLineStr + qs);
					console.log("spustam query pre " + x.id);
					client.query(makeLineStr+qs,(err, result)=>{
						if (err){
							console.log(err);
							return done(err);
						}
						checkStatus(result, x.id);
					});
			}
		});

		function checkStatus(result, id){

			obj[id] = result.rows;

			iterator++;
			if (iterator === max){
				done();
				res.set('Content-Type', 'text/plain');
				res.send(JSON.stringify(obj));
			}
		}
	});
};
