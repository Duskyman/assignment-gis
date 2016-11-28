// requires
var express    = require('express');
var dbhandlers = require('./dbhandlers.js');
var fs         = require('fs');
var bodyParser = require('body-parser');
// ----------

var app = express();

app.use(bodyParser.json({limit: '50mb'}));

// respond with html page
app.get(/^\/.*/, function (req, res) {
   console.log('GET request, url: "'+req.url+'"');
   getFileFromUrl(req.url, function(err, data, contentType, encoding){
   	if (err){
   		console.log(err);
   	}
   	else{
   		res.set('Content-Type', contentType);
	   	console.log('sending file with Content-Type: ' + contentType);
	   	res.send(new Buffer(data, encoding));
   	}
   });
});

// respond with GeoJSON data
app.post(/^\/.*/, function (req, res) {
	console.log('POST request, url: "'+req.url+'"');
	dbhandlers.handleRequest(req, res);
});

var server = app.listen(3000, function () {
	console.log("Server started");
});

function getFileFromUrl(url, fn){

	var map = {
		'/' : '/stranka.html'
	}

	var suffix = url.split('.');
	if (suffix.length > 1){
		suffix = suffix[suffix.length-1];
	}
	else{
		suffix = null;
	}

	var contentType = {
		'png':  'image/png',
		'ico':  'image/x-icon',
		'gif':  'image/gif',
		'css':  'text/css'
	}[suffix] || 'text/html';

	var encoding = (()=>{
		if (contentType.indexOf('text/') !== -1){
			return 'utf8';
		}
		else if (contentType.indexOf('image/') !== -1){
			return 'binary';
		}
		else{
			return 'utf8';
		}
	})();

	console.log('reading file with ' + encoding + ' encoding');

	fs.readFile('../client' + (map[url] || url), encoding, function (err, data) {
		fn(err, data, contentType, encoding);
	});
}
