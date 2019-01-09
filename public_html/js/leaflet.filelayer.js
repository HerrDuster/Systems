/*
 * Load files *locally* (GeoJSON, KML, GPX) into the map
 * using the HTML5 File API.
 *
 * Requires Pavel Shramov's GPX.js
 * https://github.com/shramov/leaflet-plugins/blob/d74d67/layer/vector/GPX.js
 */
var FileLoader = L.Class.extend({
    includes: L.Mixin.Events,
    options: {
        layerOptions: {},
        fileSizeLimit: 1024 *1024 *1 //50
    },

    initialize: function (map, options) {
        this._map = map;
        L.Util.setOptions(this, options);

        this._parsers = {
            'geojson': this._loadGeoJSON,
            'gpx': this._convertToGeoJSON,
            'kml': this._convertToGeoJSON,
            'xml': this._convertToGeoJSON,
            'kmz': this._importKMZ,
            'csv': this._importCSV,
            'in4': this._importIN4
        };
        
        if(window.opera && opera.version() < 30){
            alert( 'Install the last version of Opera Stable or open this page in Google Chrome');
        }
    },

    load: function (file /* File */) {
        
        // Check file size
        var fileSize = (file.size / 1024).toFixed(4);
        if (fileSize > this.options.fileSizeLimit) {
            this.fire('data:error', {
                error: new Error('File size exceeds limit (' + fileSize + ' > ' +this.options.fileSizeLimit + 'kb)')
            });
            return;
        }
        
        // Check file extension
        if (file && file.name) 
        {
            var ext = file.name.split('.').pop(),
                parser = this._parsers[ext];
            if (!parser) {
                this.fire('data:error', {
                    error: new Error('Unsupported file type ' + file.type + '(' + ext + ')')
                });
                return;
            }
            
            // Read selected file using HTML5 File API
            if ( window.FileReader ) 
            {
                var reader = new FileReader();
                reader.onload = L.Util.bind(function (e) {
                    try {
                        this.options.filename = file.name;
                        this.fire('data:loading', {filename: file.name, format: ext});
                        var layer = parser.call(this, e.target.result, ext);
                        this.fire('data:loaded', {layer: layer, filename: file.name, format: ext});
                    }
                    catch (err) {
                        this.fire('data:error', {error: err});
                    }

                }, this);
                
                if (ext == 'kmz') 
                    reader.readAsBinaryString(file);
                else if (ext == 'in4') 
                    reader.readAsText(file, "windows-1251");
                else
                    reader.readAsText(file);
                
            } else {
                if (!this.isIE()) {
                    alert( 'Unsupported FileReader function! ' +'Update Internet Explorer or open this page in Google Chrome');
                } else {
                    alert( 'Unsupported FileReader function! ' +'Open this page in Google Chrome');
                }
            }

            return reader;
        }
    },

    _loadGeoJSON: function (content) {
        if (typeof content == 'string') {
            content = JSON.parse(content);
        }

        if (this.options.layerOptions.loadGeoJSON) {
            for (var i=0; i<content.length; i++) {            
                if (content[i].id) {
                    delete content[i].id;
                }
            }
            return this.options.layerOptions.loadGeoJSON(this, content);
        } else {
            var layer = L.geoJson(content, this.options.layerOptions);

            if (layer.getLayers().length === 0) {
                throw new Error('GeoJSON has no valid layers.');
            }
            
            if (this.options.addToMap) {
                layer.addTo(this._map);
            }
            return layer;
        }
    },

    _convertToGeoJSON: function (content, format) {
        // Format is either 'gpx' or 'kml'
        if (typeof content == 'string') {
            content = ( new window.DOMParser() ).parseFromString(content, "text/xml");
        }
        
        var geojson;
        
        if (format == 'xml') 
            geojson = toGeoJSON[format](content, this.options);
        else
            geojson = toGeoJSON[format](content);
        
        if (this.options.layerOptions.loadGeoJSON)
            return this.options.layerOptions.loadGeoJSON(this, geojson);
        else
            return this._loadGeoJSON(geojson);
    },

    _importKMZ: function (content, format) {
        if (JSZip) {
            var z = new JSZip();
            z.load(content);
            var k = z.file(/.*\.kml/)[0].asText();
            //var k = z.file("doc.kml").asText();

            if (k && k.length > 0) {
                content = k;
                format = 'kml';
                return this._convertToGeoJSON(content, format);
            }
        }
    },

    _importCSV: function (content, format) {
        // Format is either 'csv'
        var separator = ';';
        var allTextLines = content.split(/\r\n|\n/);
        var headers = allTextLines[0].split( separator);
        
        if (headers.length < allTextLines[0].split( '#').length) {
            separator = '#';
            headers = allTextLines[0].split( separator);
        }
        
        if (headers.length < allTextLines[0].split( ',').length) {
            separator = ',';
            headers = allTextLines[0].split( separator);
        }

        var lines = [];

        for (var i=1; i<allTextLines.length; i++) {
            var data = allTextLines[i].split( separator);
            if (data.length == headers.length) {
                var tarr = [];
                for (var j=0; j<headers.length; j++) {
                    tarr[ headers[j].toLowerCase()] = data[j];
                }
                lines.push(tarr);
            }
        }        

        if (this.options.layerOptions.loadCSV)
            return this.options.layerOptions.loadCSV(this, lines);
    },

    _importIN4: function (content, format) {
        // Format is either 'in4'
        var geojson = toGeoJSON[format](content, this.options);
        
        if (this.options.layerOptions.loadGeoJSON)
            return this.options.layerOptions.loadGeoJSON(this, geojson);
        else
            return this._loadGeoJSON(geojson);
    },
    
    isIE: function() {
        return navigator.appName == 'Microsoft Internet Explorer';
    }
});

L.Control.FileLayerLoad = L.Control.extend({
    statics: {
        TITLE: 'Load local file (GPX, KMZ, KML, XML, GeoJSON, CSV, IN4)',
        LABEL: '&#8965;'
    },
    options: {
        position: 'topleft',
        fitBounds: true,
        isEditor: false,
        layerOptions: {},
        addToMap: true,
        multiple: false,
        fileSizeLimit: 1024 *1024 *1 //50
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this.loader = null;
    },

    onAdd: function (map) {
        this.loader = new FileLoader(map, this.options);

        this.loader.on('data:loaded', function (e) {
            // Fit bounds after loading
            if (this.options.fitBounds) {
                window.setTimeout(function () {
                    if (e.layer != undefined)
                        map.fitBounds(e.layer.getBounds());
                }, 500);
            }
        }, this);

        // Initialize Drag-and-drop
        this._initDragAndDrop(map);

        // Initialize map control
        return this._initContainer(map);
    },

    _initDragAndDrop: function (map) {
        var fileLoader = this.loader,
            dropbox = map._container;

        var callbacks = {
            dragenter: function () {
                map.scrollWheelZoom.disable();
            },
            dragleave: function () {
                map.scrollWheelZoom.enable();
            },
            dragover: function (e) {
                e.stopPropagation();
                e.preventDefault();
            },
            drop: function (e) {
                e.stopPropagation();
                e.preventDefault();

                var files = Array.prototype.slice.apply(e.dataTransfer.files),
                    i = files.length;
                setTimeout(function(){
                    fileLoader.load(files.shift());
                    if (files.length > 0) {
                        setTimeout(arguments.callee, 25);
                    }
                }, 25);
                map.scrollWheelZoom.enable();
            }
        };
        for (var name in callbacks)
            dropbox.addEventListener(name, callbacks[name], false);
    },

    _initContainer: function (map) {
        // Create a button, and bind click on hidden file input
        var zoomName = 'leaflet-control-filelayer leaflet-control-zoom',
            barName = 'leaflet-bar',
            //partName = barName + '-part',
            className = 'leaflet-control-navbar-open';
            
        var container = map.gisfile ? map.gisfile : L.DomUtil.create('div', zoomName + ' ' + barName);
        var fileInput = L.DomUtil.create('input', 'hidden', container);
        //var link = L.DomUtil.create('a', zoomName + '-in ' + partName, className, container);
        var link = L.DomUtil.create('a', className, container);
        //link.innerHTML = L.Control.FileLayerLoad.LABEL;
        //link.href = '#';
        link.title = L.Control.FileLayerLoad.TITLE;

        // Create an invisible file input
        fileInput.type = 'file';
        fileInput.id = 'gfloader';
        fileInput.multiple = this.options.multiple;
        
        if (!this.options.formats) {
            fileInput.accept = '.gpx,.kmz,.kml,.xml,.geojson,.csv,.in4';
        } else {
            fileInput.accept = this.options.formats.join(',');
        }

        fileInput.style.display = 'none';
        // Load on file change
        var fileLoader = this.loader;
        fileInput.addEventListener("change", function (e) {
            var file;

            if (!this.files) {
                var name = $(this).val();
                // workaround for IE9
                file = [];            
                file.push({
                    name: name.substring(name.lastIndexOf("\\")+1),
                    size: 0,  // it's not possible to get file size w/o flash or so
                    type: name.substring(name.lastIndexOf(".")+1)
                });
            } else {
                file = this.files;
            }

            // do whatever you need to with the `files` variable
            for (var f in file) {
                fileLoader.load(file[f]);
            }
            // reset so that the user can upload the same file again if they want to
            this.value = '';
        }, false);

        L.DomEvent.disableClickPropagation(link);
        L.DomEvent.on(link, 'click', function (e) {
            fileInput.click();
            e.preventDefault();
        });
        return container;
    }
});

L.Control.fileLayerLoad = function (options) {
    return new L.Control.FileLayerLoad(options);
};
