/* L.Control.Gisfile.js - v 1.0.5 - 2017-07-13
 http://gisfile.com
 L.Control.Gisfile, an extended controls for Leaflet maps
 Copyright 2017, GISFile; Licensed BSD
*/

L.Control.Gisfile = L.Control.extend({
    options: {
        position: 'topleft',
        home: true,
        save: false,
        del: false,
        homeTitle: 'Home',
        saveTitle: 'Save',
        deleteTitle: 'Delete',
        search: true,
        searchTitle: 'Search'
    },
    initialize: function (options) {
        if (options.onHome) {
            var btnHome = { 'onClick': options.onHome};
            this._btnHome = btnHome;
        }
        
        if (options.onSave) {
            var btnSave = { 'onClick': options.onSave};
            this._btnSave = btnSave;
        }
        
        if (options.onDelete) {
            var btnDelete = { 'onClick': options.onDelete};
            this._btnDelete = btnDelete;
        }

        if (options.home != undefined)
            this.options.home = options.home;
        
        if (options.homeTitle)
            this.options.homeTitle = options.homeTitle;

        if (options.save != undefined)
            this.options.save = options.save;

        if (options.saveTitle)
            this.options.saveTitle = options.saveTitle;

        if (options.del != undefined)
            this.options.del = options.del;

        if (options.deleteTitle)
            this.options.deleteTitle = options.deleteTitle;

        if (options.search != undefined)
            this.options.search = options.search;

        if (options.searchTitle != undefined)
            this.options.searchTitle = options.searchTitle;
    },    
    onAdd: function(map) {
        //var self = this;
        var controlName = 'leaflet-control-navbar'; 
        var container = L.DomUtil.create('div', controlName + ' leaflet-bar'); //'leaflet-control-shels-view'); //
        
        map.gisfile = this._container = container;
        var options = this.options; 
        
        if (this.options.home)
            this._homeButton   = this._createButton( options.homeTitle, controlName +'-home', container, this._btnHome.onClick);
        
        if (this.options.save)
            this._saveButton   = this._createButton( options.saveTitle, controlName +'-save', container, this._btnSave.onClick);         
        
        if (this.options.del)
            this._deleteButton = this._createButton( options.deleteTitle, controlName +'-del', container, this._btnDelete.onClick);         

        if (this.options.search)
            this._searchButton = this._createButton( options.searchTitle, controlName +'-search', container, this._btnSearch);
        
        return container;
    },
    _createButton: function(title, className, container, fn) {
      var link = L.DomUtil.create('a', className, container);
      link.href = '#';
      link.title = title;

      L.DomEvent
        .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
        .on(link, 'click', L.DomEvent.stop)
        .on(link, 'click', fn, this)
        .on(link, 'click', this._refocusOnMap, this);
      
      return link;
    },
    _btnSearch: function() {
        if (map.geosearch) {
            if (!map.geosearch.style || !map.geosearch.style.display) {
                map.geosearch.style.display = "none";
                this._searchButton.className = 'leaflet-control-navbar-search-disabled';
            } else {
                map.geosearch.style.display = "";
                this._searchButton.className = 'leaflet-control-navbar-search';
            }
        }
    },
    visibleSave: function() {
        if (this._saveButton)
        return !L.DomUtil.hasClass( this._saveButton, 'leaflet-disabled');
    },
    visibleDelete: function() {
        if (this._deleteButton)
            return !L.DomUtil.hasClass( this._deleteButton, 'leaflet-disabled');
    },
    hideDelete: function() {
        if (this._deleteButton) {
            //var fwdDisabled = 'leaflet-control-navbar-del';
            //L.DomUtil.removeClass(this._deleteButton, fwdDisabled);
            //var leafletDisabled = 'leaflet-disabled';
            //var delDisabled = 'leaflet-control-navbar-del-disabled';
            this._deleteButton.className = 'leaflet-control-navbar-del-disabled leaflet-disabled';
            //L.DomUtil.addClass( this._deleteButton, delDisabled);
            //L.DomUtil.addClass( this._deleteButton, leafletDisabled);
            L.DomEvent.off( this._deleteButton, 'click', this._btnDelete.onClick);
        }
    },
    showDelete: function() {
        if (this._deleteButton) {
            //var leafletDisabled = 'leaflet-disabled';
            //var delDisabled = 'leaflet-control-navbar-del-disabled';
            this._deleteButton.className = 'leaflet-control-navbar-del';
            //L.DomUtil.removeClass( this._deleteButton, delDisabled);
            //L.DomUtil.removeClass( this._deleteButton, leafletDisabled);
            L.DomEvent.on( this._deleteButton, 'click', this._btnDelete.onClick, this);
        }
    },
    hideSave: function() {
        if (this._saveButton) {
            //var fwdDisabled = 'leaflet-control-navbar-save';
            //L.DomUtil.removeClass(this._deleteButton, fwdDisabled);
            //var leafletDisabled = 'leaflet-disabled';
            //var delDisabled = 'leaflet-control-navbar-del-disabled';
            this._saveButton.className = 'leaflet-control-navbar-save-disabled leaflet-disabled';
            //L.DomUtil.addClass( this._deleteButton, delDisabled);
            //L.DomUtil.addClass( this._deleteButton, leafletDisabled);
            L.DomEvent.off( this._saveButton, 'click', this._btnSave.onClick);
        }
    },
    showSave: function() {
        if (this._saveButton) {
            //var leafletDisabled = 'leaflet-disabled';
            //var delDisabled = 'leaflet-control-navbar-del-disabled';
            this._saveButton.className = 'leaflet-control-navbar-save';
            //L.DomUtil.removeClass( this._deleteButton, delDisabled);
            //L.DomUtil.removeClass( this._deleteButton, leafletDisabled); 
            L.DomEvent.on( this._saveButton, 'click', this._btnSave.onClick, this);
        }
    }
});

// ------------------------- Locate Control ------------------------------------

L.Control.Locate = L.Control.extend({
    options: {
        position: 'topleft',
        drawCircle: true,
        follow: false,  // follow with zoom and pan the user's location
        stopFollowingOnDrag: false, // if follow is true, stop following when map is dragged
        // range circle
        circleStyle: {
            color: '#136AEC',
            fillColor: '#136AEC',
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.5
        },
        // inner marker
        markerStyle: {
            color: '#136AEC',
            fillColor: '#2A93EE',
            fillOpacity: 0.7,
            weight: 2,
            opacity: 0.9,
            radius: 5
        },
        // changes to range circle and inner marker while following
        // it is only necessary to provide the things that should change
        followCircleStyle: {},
        followMarkerStyle: {
            //color: '#FFA500',
            //fillColor: '#FFB000'
        },
        metric: true,
        onLocationError: function(err) {
            // this event is called in case of any location error
            // that is not a time out error.
            //alert(err.message);
        },
        onLocationOutsideMapBounds: function(context) {
            // this event is repeatedly called when the location changes
            alert(context.options.strings.outsideMapBoundsMsg);
        },
        setView: true, // automatically sets the map view to the user's location
        strings: {
            title: "Where am I?",
            popup: "You are within {distance} {unit} from this point",
            outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
        },
        locateOptions: {}
    },
    onAdd: function (map) {
        var className = 'leaflet-control-locate',
            classNames = className; // +' leaflet-bar leaflet-control';
            
        var container = map.gisfile ? map.gisfile : L.DomUtil.create('div', classNames);

        var self = this;
        this._layer = new L.LayerGroup();
        this._layer.addTo(map);
        this._event = undefined;

        this._locateOptions = {
            watch: true  // if you overwrite this, visualization cannot be updated
        };
        L.extend(this._locateOptions, this.options.locateOptions);
        L.extend(this._locateOptions, {
            setView: false // have to set this to false because we have to
                           // do setView manually
        });

        // extend the follow marker style and circle from the normal style
        var tmp = {};
        L.extend(tmp, this.options.markerStyle, this.options.followMarkerStyle);
        this.options.followMarkerStyle = tmp;
        tmp = {};
        L.extend(tmp, this.options.circleStyle, this.options.followCircleStyle);
        this.options.followCircleStyle = tmp;

        var link = L.DomUtil.create('a', className , container); //+' leaflet-bar-part leaflet-bar-part-single'
        link.href = '#';
        link.title = this.options.strings.title;
        this._locate = link;
        
        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', function() {
                var options = self.options;
                if (self._active && (map.getBounds().contains(self._event.latlng) || !options.setView ||
                    isOutsideMapBounds())) {
                    stopLocate();
                } else {
                    if (options.setView) {
                        self._locateOnNextLocationFound = true;
                    }
                    if(!self._active) {
                        map.locate(self._locateOptions);
                    }
                    self._active = true;
                    if (options.follow) {
                        startFollowing();
                    }
                    if (!self._event) {
                        self._locate.className = classNames + " requesting";
                    } else {
                        visualizeLocation();
                    }
                }
            })
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        var onLocationFound = function (e) {
            // no need to do anything if the location has not changed
            if (self._event &&
                (self._event.latlng.lat == e.latlng.lat &&
                 self._event.latlng.lng == e.latlng.lng)) {
                return;
            }

            self._event = e;

            if (self.options.follow && self._following) {
                self._locateOnNextLocationFound = true;
            }

            visualizeLocation();
        };

        var startFollowing = function() {
            self._following = true;
            if (self.options.stopFollowingOnDrag) {
                map.on('dragstart', stopFollowing);
            }
        };

        var stopFollowing = function() {
            self._following = false;
            if (self.options.stopFollowingOnDrag) {
                map.off('dragstart', stopFollowing);
            }
            visualizeLocation();
        };

        var isOutsideMapBounds = function () {
            if (self._event === undefined)
                return false;
            return map.options.maxBounds &&
                !map.options.maxBounds.contains(self._event.latlng);
        };

        var visualizeLocation = function() {
            if (self._event.accuracy === undefined)
                self._event.accuracy = 0;

            self._layer.clearLayers();

            var radius = self._event.accuracy / 2;
            if (self._locateOnNextLocationFound) {
                if (isOutsideMapBounds()) {
                    self.options.onLocationOutsideMapBounds(self);
                } else {
                    map.fitBounds(self._event.bounds);
                }
                self._locateOnNextLocationFound = false;
            }

            // circle with the radius of the location's accuracy
            var style;
            if (self.options.drawCircle) {
                if (self._following) {
                    style = self.options.followCircleStyle;
                } else {
                    style = self.options.circleStyle;
                }

                L.circle(self._event.latlng, radius, style)
                    .addTo(self._layer);
            }

            var distance, unit;
            if (self.options.metric) {
                distance = radius.toFixed(0);
                unit = "meters";
            } else {
                distance = (radius * 3.2808399).toFixed(0);
                unit = "feet";
            }

            // small inner marker
            var m;
            if (self._following) {
                m = self.options.followMarkerStyle;
            } else {
                m = self.options.markerStyle;
            }

            var t = self.options.strings.popup;
            L.circleMarker(self._event.latlng, m)
                .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                .addTo(self._layer);

            if (hasFlash()) 
            {
                var marker = new L.Icon.Div( "<object classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' codebase='http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0' width='50' height='50' id='Banner' align='middle'> \n\
                                            <param name='Movie' value='img/marker.swf'> \n\
                                            <param name='Quality' value='High'> \n\
                                            <param name='wmode' value='transparent'> \n\
                                            <embed src='../img/marker.swf' quality='high' wmode='transparent' width='50' height='50' name='Banner' align='middle' type='application/x-shockwave-flash' pluginspage='http://www.macromedia.com/go/getflashplayer' /> \n\
                                            </object>", {iconSize: [50, 50], iconAnchor: [25,25]});

                new L.Marker( self._event.latlng, {icon: marker, draggable: false, opacity: 0.7}).addTo(self._layer);
            }

            if (!self._container)
                return;
            if (self._following) {
                self._locate.className = classNames + " active following";
            } else {
                self._locate.className = classNames + " active";
            }
        };

        var resetVariables = function() {
            self._active = false;
            self._locateOnNextLocationFound = self.options.setView;
            self._following = false;
        };

        resetVariables();

        var stopLocate = function() {
            map.stopLocate();
            map.off('dragstart', stopFollowing);

            self._locate.className = classNames;
            resetVariables();

            self._layer.clearLayers();
        };

        var onLocationError = function (err) {
            // ignore time out error if the location is watched
            if (err.code == 3 && this._locateOptions.watch) {
                return;
            }

            stopLocate();
            self.options.onLocationError(err);
        };

        // event hooks
        map.on('locationfound', onLocationFound, self);
        map.on('locationerror', onLocationError, self);

        return container;
    }
});

L.Map.addInitHook(function () {
    if (this.options.locateControl) {
        this.locateControl = L.control.locate();
        this.addControl(this.locateControl);
    }
});

L.control.locate = function (options) {
    return new L.Control.Locate(options);
};

// ------------------------- MousePosition Control -----------------------------

L.Control.MousePosition = L.Control.extend({
    options: {
      position: 'bottomleft',
      separator: '  ', //<br>
      emptyString: '',
      lngFirst: false,
      numDigits: 5,
      fixDigits: true,
      lngFormatter: undefined,
      latFormatter: undefined,
      prefix: "",
      endtxt: "",
      lngtxt: "",
      lattxt: "",
      zoom: true,
      zoomtxt: ""
    },

    onAdd: function (map) {
      this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
      L.DomEvent.disableClickPropagation(this._container);
      //this._container.style.clear = 'none';
      map.on('mousemove', this._onMouseMove, this);
      map.on('zoomend', this._updateInfo, this);

      this._container.innerHTML=this.options.emptyString;
      return this._container;
    },

    onRemove: function (map) {
      map.off('mousemove', this._onMouseMove)
      map.off('zoomend', this._updateInfo);
    },

    _onMouseMove: function (e) {
        this._event = e;
        this._updateInfo();
    },

    setInfo: function (t) {
      this.options.endtxt = t;
      this._updateInfo();
    },

    _updateInfo: function () {
        var e = this._event;
        if (e != undefined) {
            var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : (this.options.fixDigits ? e.latlng.lng.toFixed( this.options.numDigits) : L.Util.formatNum(e.latlng.lng, this.options.numDigits));
            var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : (this.options.fixDigits ? e.latlng.lat.toFixed( this.options.numDigits) : L.Util.formatNum(e.latlng.lat, this.options.numDigits));
            var value = this.options.lngFirst ? this.options.lngtxt +lng + this.options.separator + this.options.lattxt +lat : this.options.lattxt +lat + this.options.separator + this.options.lngtxt +lng;
            var zoom = this.options.zoom ? this.options.zoomtxt +e.target._zoom : '';
            var prefixAndValue = this.options.prefix + ' ' + value +' ' +zoom +' ' +this.options.endtxt;
            this._container.innerHTML = prefixAndValue;
        }
    }
});

L.Map.mergeOptions({
    positionControl: false
});

L.Map.addInitHook(function () {
    if (this.options.positionControl) {
        this.positionControl = new L.Control.MousePosition();
        this.addControl(this.positionControl);
    }
});

L.control.mousePosition = function (options) {
    return new L.Control.MousePosition(options);
};

// ------------------------- Info Control -----------------------------

L.Control.Info = L.Control.extend({
  options: {
    position: 'bottomleft',
    className: '',
    string: '',
    link: '#'
  },

  onAdd: function (map) {
    this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
    L.DomEvent.disableClickPropagation(this._container);
    this._container.style.clear = 'none';
    this._container.innerHTML=this.options.string;
    return this._container;
  },

  onRemove: function (map) {
    map.off('mousemove', this._onMouseMove)
  }    
});

L.control.info = function (options) {
    return new L.Control.Info(options);
};

// ------------------------- Marker Text -----------------------------

L.Icon.Div = L.Icon.extend({
    
        initialize: function (text, options) {
            L.extend(this.options, options);
            this._text = text;
	},    
        
	options: {
            iconSize: new L.Point(20, 20), // Have to be supplied
            /*
            iconAnchor: (Point)
            popupAnchor: (Point)
            */
            className: 'leaflet-canvas-icon'
	},

	createIcon: function () {
            var e = document.createElement('div');
            this._setIconStyles(e, 'icon');
            e.innerHTML = this._text;
            
            var off = new L.Point( 10, 10);
            L.DomUtil.setPosition(e, off);
            
            return e;
	},

	createShadow: function () {
            return null;
	}
});

function hasIEPlugin(objname){
    try {
        new ActiveXObject(objname);
        return true;
    } catch (ex) {
        return false;
    }
}

function hasFlash() {
    for (var i=0; i < navigator.plugins.length; i++) { if (navigator.plugins[i].name.toLowerCase().indexOf("flash") > -1){ return true; } }
    return hasIEPlugin("ShockwaveFlash.ShockwaveFlash");
}

// ------------------------- Map Layer Control -----------------------------

L.Control.Layers.Minimap = L.Control.Layers.extend({
    options: {
        position: 'topright',
        context: '',
        myclass: 'leaflet-control-layers-minimap',
        topPadding: 10,
        bottomPadding: 10,
        overlayBackgroundLayer: L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-base/{z}/{x}/{y}.png', {
            attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
            subdomains: '0123',
            minZoom: 2,
            maxZoom: 18
        })
    },
    
    isCollapsed: function () {
        return !L.DomUtil.hasClass(this._container, 'leaflet-control-layers-expanded');
    },

    _expand: function () {
        L.Control.Layers.prototype._expand.call(this);
        this._onResize();
        this._onListScroll();
    },

    _initLayout: function () {
        L.Control.Layers.prototype._initLayout.call(this);

        L.DomUtil.addClass(this._container, this.options.myclass);
        L.DomEvent.on(this._container, 'scroll', this._onListScroll, this);

        if (this.options.context.length > 0) 
        {
            var btn = this._container.firstChild;
            btn.text = this.options.context;
            btn.style.color = "#000";
        }
    },

    _update: function () {
        L.Control.Layers.prototype._update.call(this);

        this._map.on('resize', this._onResize, this);
        this._onResize();

        this._map.whenReady(this._onListScroll, this);
    },

    _addItem: function (obj) {
        var container = obj.overlay ? this._overlaysList : this._baseLayersList;
        
        var label = L.DomUtil.create( 'label', 'leaflet-minimap-container', container);
        label._layerName = obj.name;
        var checked = this._map.hasLayer(obj.layer);
        
        //var div = L.DomUtil.create( 'div', 'leaflet-minimap-div', label);
        
        //if (obj.layer.options && obj.layer.options.imageUrl) {
        //    div.src = obj.layer.options.imageUrl;
        //}
        
        var span = L.DomUtil.create('span', 'leaflet-minimap-label', label);

        var input;
        if (obj.overlay) {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'leaflet-control-layers-selector';
            input.defaultChecked = checked;
        } else {
            input = this._createRadioElement('leaflet-base-layers', checked);
        }
        input.layerId = L.stamp(obj.layer);
        span.appendChild(input);

        L.DomEvent.on(label, 'click', this._onInputClick, this);

        var name = L.DomUtil.create('span', 'leaflet-control-layers-text', span);
        name.innerHTML = obj.name;

        return label;
    },

    _onResize: function () {
        if (this._map && this._map.getContainer()) 
        {
            var mapHeight = this._map.getContainer().clientHeight;
            var controlHeight = this._container.scrollHeight && this._container.scrollHeight > this._container.clientHeight ? this._container.scrollHeight : this._container.clientHeight;
            
            if (mapHeight -this.options.bottomPadding > 0 && controlHeight > mapHeight - this.options.bottomPadding) {
                this._container.style.overflowY = 'scroll';
                
                var elements = this._container.getElementsByClassName('leaflet-control-layers-list');
                var list = elements[0];
                list.style.overflowY = 'scroll';
            }
            this._container.style.maxHeight = (mapHeight - this.options.bottomPadding - this.options.topPadding) + 'px';
        }
    },

    _onListScroll: function () {
        var minimaps = document.querySelectorAll('label[class="leaflet-minimap-container"]');
        if (minimaps.length === 0) {
            return;
        }

        var first, last;
        if (this.isCollapsed()) {
            first = last = -1;
        } else {
            var minimapHeight = minimaps.item(0).clientHeight;
            var container = this._container;
            var listHeight = container.clientHeight;
            var scrollTop = container.scrollTop;

            first = Math.floor(scrollTop / minimapHeight);
            last = Math.ceil((scrollTop + listHeight) / minimapHeight);
        }
    }
});

L.control.layers.minimap = function (baseLayers, overlays, options) {
    return new L.Control.Layers.Minimap(baseLayers, overlays, options);
};

// ------------------------- Ncs - Wms Layer -----------------------------

L.TileLayer.NCS = L.TileLayer.WMS.extend({

    options: {
        maxDrawZoom: 18
    },

    getTileUrl: function (tilePoint) {
        var map = this._map,
            tileSize = this._getTileSize(),
            nwPoint = tilePoint.multiplyBy(tileSize),
            sePoint = nwPoint.add([tileSize, tileSize]),

            nw = this._crs.project(map.unproject(nwPoint, tilePoint.z)),
            se = this._crs.project(map.unproject(sePoint, tilePoint.z));

        var bbox = this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ?
                [se.y, nw.x, nw.y, se.x].join(',') :
                [nw.x, se.y, se.x, nw.y].join(','),
            url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});
            
        return url + L.Util.getParamString(this.wmsParams, url, true) + '&BBOX=' + bbox;
    },
    createTile: function(t, i) {
        //console.log( window.document.referrer);
        //Object.defineProperty(document, "referrer", {get : function(){ return "http://cadmap.ua/"; }});
        /*
        delete window.document.referrer;
        window.document.__defineGetter__('referrer', function () {
            return "http://cadmap.ua/";
        });
        */
        var n = document.createElement("img"), 
            url = this.getTileUrl(t);
            
        n.onload = L.bind(this._tileOnLoad, this, i, n), 
        n.onerror = L.bind(this._tileOnError, this, i, n), 
        this.options.crossOrigin && (n.crossOrigin = ""), 
        n.alt = "", 
        n.src = url;
        
        /*
        $.ajax({
            url: url,
            dataType: "image/png",
            headers: { 
                'Referer': "http://localhost/",
                'X-Alt-Referer': "http://localhost/"
            },
            success: function(data){
              console.log(data);
            }
        });
        */        
        /*
        var request = new XMLHttpRequest();
        request.onreadystatechange=state_change;

        request.open("GET", url, true);
        request.setRequestHeader("Referer", "http://www.google.com");
        //request.setRequestHeader("User-Agent", "Mozilla/5.0");
        //request.setRequestHeader("Accept","image/png");
        request.setRequestHeader("Content-Type","image/png");

        request.send(null);
        function state_change()
        {
            if (request.readyState==4)
            {// 4 = "loaded"
                if (request.status==200)
                {// 200 = OK
                    // ...our code here...
                    alert('ok');
                } else {
                    //alert("Problem retrieving XML data");
                }
            }
        }
        */
        return n
    }        
});

L.tileLayer.ncs = function (url, options) {
    return new L.TileLayer.NCS(url, options);
};

// ------------------------- Gis - Tile Layer -----------------------------

L.TileLayer.GIS = L.TileLayer.extend({
    
    options: {
        maxDrawZoom: 18
    },

    _getTileSize: function () {
        var map = this._map,
            options = this.options,
            zoom = map.getZoom() + options.zoomOffset,
            zoomN = options.maxNativeZoom;
            z = options.maxDrawZoom ? zoom -options.maxDrawZoom : 0;
        
        if (z == 4) z = 8;
        else if (z == 3) z = 4;

        return options.maxDrawZoom && zoom > options.maxDrawZoom ? options.tileSize *2 *z:
               (zoomN && zoom > zoomN ? Math.round(map.getZoomScale(zoomN, zoom) * options.tileSize) : options.tileSize);
    }
});

L.tileLayer.gis = function (url, options) {
    return new L.TileLayer.GIS(url, options);
};

// ------------------------- Label Overlay -----------------------------

L.LabelOverlay = L.Class.extend({
    options: {
        offset: new L.Point(-10,8),
        minZoom: 10,
        maxZoom: 20
    },
    initialize: function(/*LatLng*/ latLng, /*String*/ label, options) {
        this._latlng = latLng;
        this._label = label;
        L.Util.setOptions(this, options);
    },
    onAdd: function(map) {
        this._map = map;
        if (!this._container) {
            this._initLayout();
        }
        map.getPanes().overlayPane.appendChild(this._container);
        this._container.innerHTML = this._label;
        
        if (this.options.minZoom > this._map.getZoom() || this.options.maxZoom < this._map.getZoom()) 
           L.DomUtil.addClass( this._container, 'hide');
       
        map.on('viewreset', this._reset, this);
        map.on('zoomend', this._update, this);
        this._reset();
    },
    onRemove: function(map) {
        map.getPanes().overlayPane.removeChild(this._container);
        map.off('viewreset', this._reset, this);
        map.off('zoomend', this._update, this);
    },
    _reset: function() {
        var pos = this._map.latLngToLayerPoint(this._latlng);
        var op = new L.Point(pos.x + this.options.offset.x, pos.y - this.options.offset.y);
        L.DomUtil.setPosition(this._container, op);
    },
    _update: function() {
        if (this.options.minZoom > this._map.getZoom() || this.options.maxZoom < this._map.getZoom()) 
           L.DomUtil.addClass( this._container, 'hide');
        else
           L.DomUtil.removeClass( this._container, 'hide');
    },
    _initLayout: function() {
        this._container = L.DomUtil.create('div', 'leaflet-label-overlay');
    }
});  

// ------------------------- Control Button -----------------------------

L.Control.Button = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'topright'
    },
    initialize: function (options) {
        L.setOptions(this, options);
    },
    onAdd: function (map) {
        var controlName = 'leaflet-control-navbar'; 
        var container = L.DomUtil.create('div', controlName + ' leaflet-bar');
        
        this._container = container;
        this._map = map;
        var options = this.options; 
        
        var button = this._button = L.DomUtil.create('a', options.className, container)
        if (options.text) button.innerHTML = options.text;
        if (options.title) button.title = options.title;

        L.DomUtil.addClass(button, options.position);

        if (options.onClick)
            L.DomEvent.on(this._button, 'click', options.onClick, this);
        else 
            L.DomEvent.on(this._button, 'click', this._fireClick, this);
        
        var stop = L.DomEvent.stopPropagation;
        L.DomEvent.on(this._container, 'mousedown', stop)
                  .on(this._container, 'touchstart', stop)
                  .on(this._container, 'dblclick', stop)
                  .on(this._container, 'mousewheel', stop)
                  .on(this._container, 'MozMozMousePixelScroll', stop)
        this.fire('load');
        return container;
    },
    isToggled: function () {
        return L.DomUtil.hasClass(this._container, this.options.toggleButton);
    },
    _fireClick: function (e) {
        this.fire('click');

        if (this.options.toggleButton) {
            if (this.isToggled()) {
                L.DomUtil.removeClass(this._container, this.options.toggleButton);
            } else {
                L.DomUtil.addClass(this._container, this.options.toggleButton);
            }
        }
    },
    onRemove: function (map) {
        if (this._container && this._map) {
            var options = this.options;
            
            if (options.onClick)
                L.DomEvent.off(this._button, 'click', options.onClick, this);
            else 
                L.DomEvent.off(this._button, 'click', this._fireClick, this);
        
            L.DomEvent.off(this._container, 'mousedown', stop)
                      .off(this._container, 'touchstart', stop)
                      .off(this._container, 'dblclick', stop)
                      .off(this._container, 'mousewheel', stop)
                      .off(this._container, 'MozMozMousePixelScroll', stop)

            this.fire('unload');
            this._map = null;
        }

        return this;
    }
});

L.control.button = function (label, options) {
    return new L.Control.Button(label, options);
};

// ------------------------- Country Selector -----------------------------

L.Control.Country = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'topright'
    },
    initialize: function (options) {
        L.setOptions(this, options);
    },
    onAdd: function (map) {
        var controlName = 'leaflet-control-navbar'; 
        var container = L.DomUtil.create('div'); //, controlName + ' leaflet-bar');
        
        this._container = container;
        this._map = map;
        var options = this.options; 
        
        var button = this._button = L.DomUtil.create('select', options.className, container)
        button.style.width = 'auto';
        button.innerHTML = '<option value="UK" selected="selected">Ukraine</option>' +
                           '<option value="BY">Belarus</option>' +
                           '<option value="RU">Russia</option>';
        
        if (options.title) button.title = options.title;

        L.DomUtil.addClass(button, options.position);

        if (options.onClick)
            L.DomEvent.on(this._button, 'click', options.onClick, this);
        else 
            L.DomEvent.on(this._button, 'click', this._fireClick, this);
        
        var stop = L.DomEvent.stopPropagation;
        L.DomEvent.on(this._container, 'mousedown', stop)
                  .on(this._container, 'touchstart', stop)
                  .on(this._container, 'dblclick', stop)
                  .on(this._container, 'mousewheel', stop)
                  .on(this._container, 'MozMozMousePixelScroll', stop)
        this.fire('load');
        return container;
    },
    isToggled: function () {
        return L.DomUtil.hasClass(this._container, this.options.toggleButton);
    },
    _fireClick: function (e) {
        this.fire('click');

        if (this.options.toggleButton) {
            if (this.isToggled()) {
                L.DomUtil.removeClass(this._container, this.options.toggleButton);
            } else {
                L.DomUtil.addClass(this._container, this.options.toggleButton);
            }
        }
    },
    onRemove: function (map) {
        if (this._container && this._map) {
            var options = this.options;
            
            if (options.onClick)
                L.DomEvent.off(this._button, 'click', options.onClick, this);
            else 
                L.DomEvent.off(this._button, 'click', this._fireClick, this);
        
            L.DomEvent.off(this._container, 'mousedown', stop)
                      .off(this._container, 'touchstart', stop)
                      .off(this._container, 'dblclick', stop)
                      .off(this._container, 'mousewheel', stop)
                      .off(this._container, 'MozMozMousePixelScroll', stop)

            this.fire('unload');
            this._map = null;
        }

        return this;
    }
});

L.control.country = function (options) {
    return new L.Control.Country(options);
};

// ------------------------- Popup functions -----------------------------

function getFieldTitle(fields, name, param)
{
    if (fields && fields.fields)
    {
        for (var rows in fields.fields) 
        { 
            var row = fields.fields[ rows];
            if (row[ 0]) {
                var field = row[ 0];

                if (field.name && field[ param ] && field.name.toLowerCase() == name.toLowerCase()) {
                    return field[ param ];
                }
            }
        }
    }    

    return name;
}

function existsField(fields, name)
{
    if (fields && fields.fields)
    {
        for (var rows in fields.fields) 
        { 
            var row = fields.fields[ rows];
            if (row[ 0]) {
                var field = row[ 0];

                if (field.name && field.title && field.name.toLowerCase() == name.toLowerCase()) {
                    return true;
                }
            }
        }
    }    

    return false;
}

function getItems(fields, data, exists, domain) 
{
    var items = [];
    var imgUrl = "";
    var imgParam = "";
    var url = "";

    items.push( "<table>");
    for (var key in data) {
        var val = data[ key];
    
        if (exists || existsField( fields, key)) {
            if ( val.length >0 ) {
                if (getFieldTitle( fields, key, "type") == "image" && getFieldTitle( fields, key, "title") ) {
                    if ( imgUrl == "" ) {
                        if (checkUrl(val)) {
                            imgUrl = val;
                            if (val.indexOf("?") == -1 && val.indexOf( domain) > -1) {
                                imgParam = "?t=1";
                            }
                        }
                    }
                } else if (getFieldTitle( fields, key, "type") == "url" && getFieldTitle( fields, key, "title") ) {
                    if ( url == "" ) {
                        if (checkUrl (val)) {
                            url = val;
                        }
                    }
                } else {
                    items.push( "<tr class='popup-row'><td class='popup-label'>" +getFieldTitle( fields, key, "title") +":<td><td class='popup-value'>" + val + "</td></tr>" );
                }
            }
        }
    };

    items.push( "</table>");

    if (imgUrl.length > 0) {
        if (url.length > 0) { 
            items.push("<div class='text-center' style='margin-top: 5px;'><a href='" + url + "' target='_blank'><img src='" + imgUrl + imgParam + "' style='max-height: 140px; max-width: 280px;'></a></div>");
        } else {
            items.push("<div class='text-center' style='margin-top: 5px;'><a href='" + imgUrl + "' target='_blank'><img src='" + imgUrl + imgParam + "' style='max-height: 140px; max-width: 280px'></a></div>");
        }
    } else if (url.length > 0) {
        items.push("<a href='" + url + "' target='_blank' class='pull-right '>${More}...</a>");
    }

    return items;
}

function checkUrl(val){
    var regExp = /http(s?):\/\/[-\w\.]{3,}\.[A-Za-z]{2,3}/;
    return regExp.test(val);
}
