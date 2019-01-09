L.Control.SelectBox = L.Control.extend({
    _active: false,
    _map: null,
    includes: L.Mixin.Events,
    options: {
        position: 'topleft',
        className: 'leaflet-control-navbar-select',
        modal: false,
        features: null
    },
    onAdd: function (map) {
        this._map = map;
        //this._container = map.gisfile ? map.gisfile : L.DomUtil.create('div', 'leaflet-zoom-box-control leaflet-bar');
        this._container = L.DomUtil.create('div', 'leaflet-zoom-box-control leaflet-bar');
        
        this._visible = L.DomUtil.create('a', 'leaflet-control-navbar-snap leaflet-control-navbar-visible active', this._container);
        this._visible.title = "Visible layer";
        
        this._link = L.DomUtil.create('a', this.options.className, this._container);
        this._link.title = "Select objects";

        if (gpcas != undefined) 
        {
            var form = this._form = this._form = document.createElement('div', 'leaflet-control');
            L.DomUtil.addClass( form, 'leaflet-bar');
            form.style.display = 'none';
            form.style.position = 'absolute';
            form.style.left = '30px';
            form.style.top = '0px';
            form.style.zIndex = -10;
            this._container.appendChild( form);

            this._difference = L.DomUtil.create('a', 'leaflet-control-gpc-diff', form);
            this._difference.title = "difference";
            L.DomEvent.on(this._difference, 'click', this.difference, this);

            this._intersection = L.DomUtil.create('a', 'leaflet-control-gpc-intersec', form);
            this._intersection.title = "intersection";
            L.DomEvent.on(this._intersection, 'click', this.intersection, this);
            
            this._union = L.DomUtil.create('a', 'leaflet-control-gpc-union', form);
            this._union.title = "union";
            L.DomEvent.on(this._union, 'click', this.union, this);

            //this._xor = L.DomUtil.create('a', '', form);
            //this._xor.title = "xor";
            
            this._collapse();
        }

        this._psnap = L.DomUtil.create('a', 'leaflet-control-navbar-snap leaflet-control-navbar-snap-point', this._container);
        this._psnap.title = "Snapping points";

        this._lsnap = L.DomUtil.create('a', 'leaflet-control-navbar-snap leaflet-control-navbar-snap-line leaflet-disabled', this._container);
        this._lsnap.title = "Snapping lines";

        L.DomEvent
                .on(this._container, 'click', L.DomEvent.stop)
                .on(this._container, 'mousedown', L.DomEvent.stop)
                .on(this._container, 'dblclick', L.DomEvent.stop)
                .on(this._container, 'contextmenu', L.DomEvent.stop);

        L.DomEvent
            .on(this._container, 'dblclick', L.DomEvent.stop)
            .on(this._link, 'click', L.DomEvent.stop)
            .on(this._link, 'click', function(){
                this._active = !this._active;
                if (this._active) {
                    this.activate();
                }
                else {
                    this.deactivate();
                }
            }, this)
            .on(this._psnap, 'click', function(){
                if (!L.DomUtil.hasClass(this._psnap, 'active')) {
                    L.DomUtil.addClass(this._psnap, 'active');
                    this._map.options.snapping.enabled = true;
                    
                    L.DomUtil.removeClass(this._lsnap, 'leaflet-disabled');
                }
                else {
                    L.DomUtil.removeClass(this._psnap, 'active');
                    this._map.options.snapping.enabled = false;
                    
                    L.DomUtil.addClass(this._lsnap, 'leaflet-disabled');
                    //this._map.options.snapping.vertexonly = true;
                }
            }, this)
            .on(this._lsnap, 'click', function(){
                if (L.DomUtil.hasClass(this._psnap, 'active')) {
                if (!L.DomUtil.hasClass(this._lsnap, 'active')) {
                    L.DomUtil.addClass(this._lsnap, 'active');
                    this._map.options.snapping.vertexonly = false;
                }
                else {
                    L.DomUtil.removeClass(this._lsnap, 'active');
                    this._map.options.snapping.vertexonly = true;
                }}
            }, this)
            .on(this._visible, 'click', function(){
                if (!L.DomUtil.hasClass(this._visible, 'active')) {
                    L.DomUtil.addClass(this._visible, 'active');
                    if (!this._map.hasLayer(geojsonLayer))
                        this._map.addLayer(geojsonLayer)
                    L.DomUtil.removeClass(this._visible, 'leaflet-disabled');
                }
                else {
                    L.DomUtil.removeClass(this._visible, 'active');
                    if (this._map.hasLayer(geojsonLayer))
                        this._map.removeLayer(geojsonLayer)
                    L.DomUtil.addClass(this._visible, 'leaflet-disabled');
                }
            }, this);

        return this._container;
    },
    createPoly: function(coords) {
        var res = new PolyDefault();
        for (var o=0; o<coords.length; o++) {   
            var obj = coords[ o];            
            for (var c=0; c<obj.length; c++) {   
                var points = obj[ c];
                if (points.lat == undefined) {
                    for(var i=0; i<points.length; i++) {    
                        res.addPoint(new Point(points[i][1],points[i][0]));
                    }
                } else {
                    var point = points;
                    res.addPoint(new Point(point.lat,point.lng));
                }
            } 
        }
        return res;
    },
    _collapse: function() {
        var that = this, count = 0;
        
        for (var l in that._select) 
        {
            var layer = that._select[ l];
            if (layer.feature && !layer.feature.deleted) 
            {
                var type = layer.feature.geometry.type;
                if (type == 'Polygon' || type == 'MultiPolygon')
                {
                    count++;
                }
            }
        }
        
        if (this._active && count > 1) {
            this._form.style.display = 'block';
        } else {
            this._form.style.display = 'none';
        }
    },     
    difference: function( e) {
        this._gps( 'difference');
    },
    intersection: function( e) {
        this._gps( 'intersection');
    },
    union: function( e) {
        this._gps( 'union');
    },
    _gps: function( operation) {
        var poly = null, that = this, count = 0, diff = null;
        for (var l in that._select) 
        {
            var layer = that._select[ l];
            if (layer.feature && !layer.feature.deleted) 
            {
                var type = layer.feature.geometry.type;
                if (type == 'Polygon' || type == 'MultiPolygon')
                {
                    //var coords = layer.feature.geometry.coordinates, i;
                    var coords = layer.getLatLngs(), i;
                    if (type == 'Polygon' || type == 'MultiPolygon')
                    {
                        var p = type == 'Polygon' ? that.createPoly( [coords]) : that.createPoly( coords);
                        if (count > 0) {
                            if (operation == 'difference')
                                diff = diff.difference( p);
                            else if (operation == 'intersection')
                                diff = diff.intersection( p); 
                            else if (operation == 'union')
                                diff = diff.union( p);
                            //diff = diff.xor(p); 
                        } else {
                            poly = layer;
                            diff = p;
                        }
                        
                        count++;
                    }
                }
            }
        }
        
        if (count > 1 && diff != null && poly != null) 
        {
            var layer = poly;
            var num = diff.getNumInnerPoly();
            var newLatLngs = [];
	
            for(var i=0;i<num;i++) {
		var pol = diff.getInnerPoly(i);
		var vertices  = getPolygonVertices(pol);

                for(var j=1;j<vertices.length;j++) { 
                    newLatLngs.push( vertices[j]);
                }
                
                newLatLngs.push( vertices[0]);
            } 

            layer.setLatLngs( newLatLngs);
            layer.editing.disable();
            layer.editing.enable();
            layer.feature[ 'update'] = true;
                
            if (updateButtons)
                updateButtons();
        }
    },
    defaultSelects: function() 
    {
        var that = this;
        that._select = [];
        
        that._map.eachLayer(function(layer) 
        {
            if (layer.feature && !layer.feature.deleted) 
            {
                var type = layer.feature.geometry.type;
                if ((type == 'Marker' || type == 'Point' || type == 'MultiPoint') && layer.dragging._enabled) {
                    that._select[L.stamp(layer)] = layer;
                } else if (layer.editing._enabled) {
                    that._select[L.stamp(layer)] = layer;
                }
            }
        })
    },
    moveObjects: function (k) {
        var map = this._map;
        
        if (k.type == "keydown") {
            if (k.shiftKey && k.charCode == 0) {
                //if (map.dragging.enabled())
                //    map.dragging.disable();
                if (map.keyboard.enabled())
                    map.keyboard.disable();
                
                var panKey = [0,0];

                for (var i in map.keyboard._panKeys) {
                    if (k.keyCode == i) {
                        panKey = map.keyboard._panKeys[ i];
                    }
                }
                this.shiftObjects( panKey);
            }
            
            if (!k.shiftKey && k.keyCode === 46) {
                this.deleteObjects();
            }
        } else {
            if (!k.shiftKey && k.charCode == 0) {
                //if (!map.dragging.enabled())
                //    map.dragging.enable();
                if (!map.keyboard.enabled())
                    map.keyboard.enable();
                
                //document.getElementById('dgLayer').focus();
                //document.getElementById('map').focus();
                map.keyboard._focused = true;
		map.fire('focus');
            }
        } 
    },
    shiftObjects: function( panKey) 
    {
        var map = this._map;
        var a = map.layerPointToLatLng( [0, 0]);
        var b = map.layerPointToLatLng( [panKey[0] /40 *-1, panKey[1] /40 *-1]);
        var xy = L.latLng( a.lat -b.lat, a.lng -b.lng);
        
        for (var l in this._select) 
        {
            var layer = this._select[ l];
            
            if (layer.feature && !layer.feature.deleted) 
            {
                var coords = layer.feature.geometry.coordinates;
                var type = layer.feature.geometry.type;
                
                switch (type) {
                  case 'Point':
                    //coords = [ coords ];
                    var p = layer.getLatLng();
                    layer.setLatLng( L.latLng( p.lat +xy.lat, p.lng +xy.lng));
                    break;
                    // fall through
                  case 'MultiPoint':
                    for (var i in layer._layers) 
                    {
                        var p = layer._layers[ i].getLatLng();
                        layer._layers[ i].setLatLng( L.latLng( p.lat +xy.lat, p.lng +xy.lng));
                    }
                    break;

                  case 'LineString':
                    //coords = [ coords ];
                    // fall through
                  case 'MultiLineString':
                    //for (i=0; i<coords.length; i++) {
                      //if (selectBounds.intersects(layer.getBounds()) && self._lineStringsIntersect(selectBoundsCoords, coords[i])) {
                    //}
                    //break;
                  case 'Polygon':
                    //coords = [ coords ];
                    // fall through
                  case 'MultiPolygon':
                    coords = layer.getLatLngs();
                    var newLatLngs = [];
                    for (var i in coords) 
                    {
                        var p = coords[i];
                        newLatLngs.push([p.lat +xy.lat, p.lng +xy.lng]);
                    }
                    coords = null;
                    layer.setLatLngs( newLatLngs);
                    
                    layer.editing.disable();
                    layer.editing.enable();
                    break;
                }
                
                layer.feature[ 'update'] = true;
                
                if (updateButtons)
                    updateButtons();
            }
        }
    },
    deleteObjects: function() 
    {
        var that = this;
        $('#delModalBody').text( 'Delete selected objects?');
        $('#delConfirm').modal();
        $('#onConfirm').click( function () { that.deletingObjects() });
    },
    deletingObjects: function() 
    {
        //var map = this._map;
        
        for (var l in this._select) 
        {
            propid = l;
            $('#dgLayer').datagrid('selectRecord', l);
            //console.log( l);
            var layer = this._select[ l];
            
            if (layer.feature && !layer.feature.deleted) 
            {
                if (layer.feature.id && layer.feature.id > 0) {
                    recordDeleting( layer.feature.id, l);
                } else {
                    deleteRecord( l);
                }
                
                if (updateButtons)
                    updateButtons();
            }
        }
    },
    activate: function() {
        L.DomUtil.addClass(this._link, 'active');
        
        var map = this._map;
        var that = this;
        this._origonMouseUp = map.boxZoom._onMouseUp;
        this._origMouseDown = map.boxZoom._onMouseDown;
        
        var _origMouseDown = map.boxZoom._onMouseDown;
        var _selectFeature = this._selectFeature;

        map.boxZoom._onMouseDown = function(e){
            if (that._active) {
                _origMouseDown.call(map.boxZoom, {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    which: 1,
                    shiftKey: true
                });
                this._startPoint = this._map.mouseEventToContainerPoint(e);
            }
        };

        map.boxZoom._onMouseUp = function(e){
            if (that._active) {
                this._point = this._map.mouseEventToContainerPoint(e);
                this._bounds = new L.LatLngBounds( this._map.containerPointToLatLng(this._startPoint),
                                                   this._map.containerPointToLatLng(this._point));
                this._center = this._map.getCenter();

                map.boxZoom._finish();
                _selectFeature( e, this, that);
            }
        };

        L.DomEvent.addListener(this._map.getContainer(), "keydown", this.moveObjects, this);
        L.DomEvent.addListener(this._map.getContainer(), "keyup", this.moveObjects, this);
        
        //L.DomEvent.on(this._container, 'keyup', this.moveObjects, this);
            
        this._map.dragging.disable();
        //this._map.keyboard.disable();
        this._map.boxZoom.addHooks();
        //L.DomUtil.addClass(this._map.getContainer(), 'leaflet-zoom-box-crosshair');
        
        this.defaultSelects();
        this._collapse();
    },
    deactivate: function() {
        L.DomUtil.removeClass(this._link, 'active');

        var map = this._map;
        map.boxZoom._onMouseDown = this._origMouseDown;
        map.boxZoom._onMouseUp = this._origonMouseUp;

        L.DomEvent.removeListener(this._map.getContainer(), "keydown", this.moveObjects, this);
        L.DomEvent.removeListener(this._map.getContainer(), "keyup", this.moveObjects, this);
        
        //L.DomEvent.off(this._container, 'keyup', this.moveObjects, this);
        
        this._map.dragging.enable();
        //this._map.keyboard.enable();
        this._map.boxZoom.removeHooks();
        //L.DomUtil.removeClass(this._map.getContainer(), 'leaflet-zoom-box-crosshair');
        this._active = false;
        this._map.boxZoom._moved = false;
        //console.log( this._map.boxZoom);
        
        this._collapse();
    },
    _lineStringsIntersect: function (c1, c2) {
        for (var i = 0; i <= c1.length - 2; ++i) {
          for (var j = 0; j <= c2.length - 2; ++j) {
            var a1 = {x: c1[i][1], y: c1[i][0] },
              a2 = {x: c1[i + 1][1], y: c1[i + 1][0] },
              b1 = {x: c2[j][1], y: c2[j][0] },
              b2 = {x: c2[j + 1][1], y: c2[j + 1][0] },

              ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
              ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
              u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

            if (u_b !== 0) {
              var ua = ua_t / u_b,
                ub = ub_t / u_b;
              if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                return true;
              }
            }
          }
        }

        return false;
    },    
    _pointInPolygon: function(x, y, polyCoords) {
      var inside = false,
          intersects, i, j;

      for (i = 0, j = polyCoords.length - 1; i < polyCoords.length; j = i++) {
        var xi = polyCoords[i][0], yi = polyCoords[i][1];
        var xj = polyCoords[j][0], yj = polyCoords[j][1];

        intersects = ((yi > y) !== (yj > y)) &&
                         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersects) {
          inside = !inside;
        }
      }

      return inside;
    },
    _selectFeature: function( k, that, self)
    {
        /*
        if (k.type == "mouseup" && k.shiftKey && k.charCode == 0) 
        if (k.type == "mouseup" && k.ctrlKey && k.charCode == 0) 
        */
        var selectBounds = that._bounds;
        var map = that._map;
        
        var selectBoundsCoords = L.rectangle( selectBounds).toGeoJSON().geometry.coordinates[0];
        
        that.justSelected = [];
        that.justUnselected = [];
        that.layers = [];
        
        if (k.shiftKey) {
            that.layers = self._select;
        }
        
        map.eachLayer(function(layer) 
        {
            if (layer.feature && !layer.feature.deleted) 
            {
                var coords = layer.feature.geometry.coordinates, i, intersects = false;
                var type = layer.feature.geometry.type;
                
                switch (type) {
                  case 'Point':
                    coords = [ coords ];
                    // fall through
                  case 'MultiPoint':
                    for (i=0; i<coords.length; i++) {
                      if (selectBounds.contains(L.latLng([coords[i][1], coords[i][0]])))  {
                        intersects = true;
                      }
                    }
                    break;

                  case 'LineString':
                    coords = [ coords ];
                    // fall through
                  case 'MultiLineString':
                    for (i=0; i<coords.length; i++) {
                      if (selectBounds.intersects(layer.getBounds()) && self._lineStringsIntersect(selectBoundsCoords, coords[i])) {
                        intersects = true;
                      }
                    }
                    break;

                  case 'Polygon':
                    coords = [ coords ];
                    // fall through
                  case 'MultiPolygon':
                    var poly = layer.getLatLngs();  
                    coords = [];
                    for (var i in poly) coords.push([poly[i].lng, poly[i].lat]);
                    coords = [[coords]];
                    poly = null;
                      
                    for (i=0; i<coords.length; i++) {
                      if (selectBounds.intersects(layer.getBounds())) {
                        if (!k.ctrlKey && self._lineStringsIntersect(selectBoundsCoords, coords[i][0])) {
                            intersects = true;
                            break
                        } else {
                            if (selectBoundsCoords[0][0] != selectBoundsCoords[1][0] || selectBoundsCoords[0][1] != selectBoundsCoords[1][1]) 
                            {
                                var ip = 0;
                                for (j=0; j<coords[i][0].length; j++) {   
                                    var p = coords[i][0][ j];
                                    if (self._pointInPolygon( p[0], p[1], selectBoundsCoords)) {
                                        if (!k.ctrlKey) {
                                            intersects = true;
                                            break
                                        } else {
                                            ip++;
                                        }
                                    }
                                }
                                
                                if (k.ctrlKey && ip == coords[i][0].length) {
                                    intersects = true;
                                    break
                                }

                                if (layer.options && layer.options.fill == 'true' && layer.options.fillOpacity > 0 && 
                                    ((layer.options.fillColor && layer.options.fillColor != 'note') || (layer.options.fillcolor && layer.options.fillcolor != 'note'))) {
                                //console.log( type, intersects, L.stamp(layer), layer.options, coords, selectBoundsCoords);
                                for (j=0; j<selectBoundsCoords.length; j++) {   
                                    var p = selectBoundsCoords[ j];
                                    if (self._pointInPolygon( p[0], p[1], coords[i][0])) {
                                        intersects = true;
                                        break
                                    }
                                }}
                            } else {
                                if (layer.options && layer.options.fill == true  && layer.options.fillOpacity > 0 && 
                                    ((layer.options.fillColor && layer.options.fillColor != 'note') || (layer.options.fillcolor && layer.options.fillcolor != 'note'))) {
                                //console.log( type, intersects, L.stamp(layer), layer.options, coords, selectBoundsCoords);
                                if (self._pointInPolygon( selectBoundsCoords[0][0], selectBoundsCoords[0][1], coords[i][0])) {
                                    intersects = true;
                                    break
                                }}
                            }                        
                        }
                      }
                    }
                    break;
                }

                var remove = false;

                if (intersects) {
                    if (!this.layers[L.stamp(layer)]) {
                        this.layers[L.stamp(layer)] = layer;
                        this.justSelected.push(layer);
                        
                        if (type == 'Marker' || type == 'Point') {
                            layer.dragging.enable(); 
                        } else if (type == 'MultiPoint') {
                            for (var l in layer._layers) {
                                layer._layers[ l].dragging.enable(); 
                            }
                        } else {
                            layer.editing.enable();
                        }
                    } else if (k.shiftKey) {
                        //remove = true;
                    }
                } else if (!k.shiftKey) {
                    remove = true;
                }
                
                if (remove) 
                {
                    if (this.layers[L.stamp(layer)]) {
                        delete this.layers[L.stamp(layer)];
                        this.justUnselected.push(layer);
                    }
                        
                    if (type == 'Marker' || type == 'Point') {
                        layer.dragging.disable(); 
                    } else if (type == 'MultiPoint') {
                        for (var l in layer._layers) {
                            layer._layers[ l].dragging.disable(); 
                        }
                    } else {
                        layer.editing.disable();
                    }
                }
            }
            /*
            if (this.justSelected.length) {
              map.fire('select', {
                layers: this.justSelected
              });
            }
            if (this.justUnselected.length) {
              map.fire('unselect', {
                layers: this.justUnselected
              });
            }
            */
        }, that);
        
        self._select = that.layers;
        self._collapse();
    }
});

L.control.selectBox = function (options) {
  return new L.Control.SelectBox(options);
};