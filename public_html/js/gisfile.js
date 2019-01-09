/* gisfile.js - v 1.0.8 - 2017-09-08
 http://gisfile.com
 gisfile, a JavaScript library for publish interactive maps
 Copyright 2017, GISFile; Licensed BSD
*/

L.gis = function(t, e) {
    return new L.Gis(t, e);
}

L.Gis = L.Map.extend({
    layer: function( n, o) {
        var l = new L.GisFile.Layer( n, o);
        this.addLayer(l);
        return l;
    },
    map: function( n, o) {
        var l = new L.GisFile.Map( n, o);
        this.addLayer(l);
        return l;
    }
});

L.GisFile = L.Class.extend(
{
    options: {
        url: '//gisfile.com/',
        domain: 'gisfile',
        controlLayers : true
    },  

    initialize: function ( options) 
    {
        var m = window.location.protocol === "file:" ? "http:" : "";
        that.options.url = m +that.options.url;        
        L.setOptions(this, options);
    },    

    highlightFeature: function(e) 
    {
        var layer = e.target;

        if (e.layer || e._layers)
        {
            layer.setStyle({
                weight: 1,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }
        }
    },

    resetHighlight: function(e) 
    {
        var layer = e.target;

        if (e.layer || e._layers)
        {
            layer.setStyle({
                weight: 1,
                color: '#FFF',
                dashArray: '',
                fillOpacity: 0.7
            });                            
        }
    },
    
    zoomToFeature: function(e) {
        this._map.fitBounds(e.target.getBounds());
    },

    getAjax: function(url, async, cb) 
    {
        if (window.XMLHttpRequest === undefined) 
        {
            window.XMLHttpRequest = function() {
                try {
                    return new ActiveXObject("Microsoft.XMLHTTP.6.0");
                }
                catch (e1) {
                    try {
                        return new ActiveXObject("Microsoft.XMLHTTP.3.0");
                    }
                    catch (e2) {
                        throw new Error("XMLHttpRequest is not supported");
                    }
                }
            };
        }

        var request = new XMLHttpRequest();
        request.open('GET', url, async);

        request.onreadystatechange = function() 
        {
            var response = {};
            if (request.readyState === 4 && request.status === 200) {
                try {
                    if(window.JSON) {
                        response = JSON.parse(request.responseText);
                    } else {
                        response = eval("("+ request.responseText + ")");
                    }
                } catch(err) {
                    console.info(err);
                    response = {};
                }
                cb(response);
            }
        };

        request.send();
        return request;   
    },
    
    getItems: function(that, fields, data) 
    {
        var items = [];
        var imgUrl = "";
        var imgParam = "";
        var url = "";

        items.push( "<table>");
        for (var key in data) {
            var val = data[ key];
            if ( val.length >0 ) {
                if (that.getFieldTitle( fields, key, "type") == "image" && that.getFieldTitle( fields, key, "title") ) {
                    if ( imgUrl == "" ) {
                        if (that.checkUrl(val)) {
                            imgUrl = val;
                            if (val.indexOf("?") == -1 && val.indexOf( that.options.domain) > -1) {
                                imgParam = "?t=1";
                            }
                        }
                    }
                } else if (that.getFieldTitle( fields, key, "type") == "url" && that.getFieldTitle( fields, key, "title") ) {
                    if ( url == "" ) {
                        if (that.checkUrl (val)) {
                            url = val;
                        }
                    }
                } else {
                    items.push( "<tr class='popup-row'><td class='popup-label'>" +that.getFieldTitle( fields, key, "title") +":<td><td class='popup-value'>" + val + "</td></tr>" );
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
    },
         
    getFieldTitle: function(fields, name, param)
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
    },     

    checkUrl: function(val){
        var regExp = /http(s?):\/\/[-\w\.]{3,}\.[A-Za-z]{2,3}/;
        return regExp.test(val);
    }    
});

L.GisFile.Layer = L.GisFile.extend(
{
    initialize: function(n, options) 
    {
        var that = this;
        var o = L.setOptions(this, options);
        o.layer = n;

        var now = new Date();
        var str = '&datetime=' +now.getTime();
                    
        this._url = o.url;
        this._urj = o.url +'api/' +o.layer +'/json';
        this._urf = o.url +'api?json=fields&layer=' +o.layer +str;
        
        if (o.marker) 
            this.markers = L.markerClusterGroup();
        
        if (o.icon) 
        {
            var u = o.icon;

            if (u.length == 0) {
                u = 'marker-icon';
            }

            if (u.length > 0) 
            {
                if (u.indexOf( "/") == -1)
                    u = o.url +"css/icons/" +u;

                if (o.icon.indexOf( ".") == -1)
                    u = u +".png";

                var img = new Image();
                img.onload = function() {
                    that._icon = L.icon({ iconUrl: u, iconSize: [this.width, this.height], iconAnchor: [this.width/2 -1, +this.height -1], popupAnchor: [0, -this.height +5]});
                }
                img.src = u;
            }
        }
    },

    onAdd: function(map) 
    {
        var that = this;
        this._map = map;

        if (this.options.marker) 
            map.addLayer(this.markers); 

        this.getAjax( this._urj, true, function(data) {
            var layer = that._layer = L.geoJson( data, { that: that, style: that.getStyle, onEachFeature: that.onEachFeature});
            
            if (!that.options.marker) 
                layer.addTo(map);
        });
        
        this.getAjax( this._urf, true, function(data) {
            that.fields = data;
        })
    },
    
    onRemove: function(e) {
        var map = this._map;
        if (map.hasLayer( this._layer)) {
            map.removeLayer( this._layer);
        }
    }, 
	
    getStyle: function(feature) 
    {
        function getColor(d) 
        {
            return d > 1000 ? '#800026' :
                   d > 500  ? '#BD0026' :
                   d > 200  ? '#E31A1C' :
                   d > 100  ? '#FC4E2A' :
                   d > 50   ? '#FD8D3C' :
                   d > 20   ? '#FEB24C' :
                   d > 10   ? '#FED976' :
                              '#FFEDA0';
        }
    
        var fillcolor = getColor(feature.id);
        return {
            fillColor: fillcolor,
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '',
            fillOpacity: 0.7
        };
    },

    onEachFeature: function(feature, layer) 
    {
        var that = this.that;
        var items = that.getItems( that, that.fields, feature.properties);
        var popupContent = "<div class='modal-body' style='width: 287px'>" +
                           "<p>" +items.join( "") +"</p>" +
                           "</div>";

        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup( feature.properties.popupContent);
        }

        layer.bindPopup(popupContent);
        
        if (that._icon) 
        {
            if (layer._layers)
               layer._layers[ layer._leaflet_id -1].setIcon( that._icon);
            else
               layer.setIcon( that._icon);
        }

        layer.on({
            mouseover: this.that.highlightFeature,
            mouseout: this.that.resetHighlight
        });                            
        
        if (that.options.marker)
            that.markers.addLayer(layer);
    }
});

L.GisFile.Map = L.GisFile.extend(
{
    initialize: function(n, options) 
    {
        var o = L.setOptions(this, options);
        o.map = n;
        
        this._url = o.url;
        this._urp = o.url +'map/' +o.map +'/json';
        
        this.defaultIcon = L.Icon.Default.extend({ options: { iconUrl: o.url +'css/icons/marker-icon.png' } });
        this.layerIcon = new this.defaultIcon();
        
        var that = this;
        that.baseMaps = {}; //{'OpenStreetMap': that.options.osm};
        that.overlayMaps = {};
        that.geojsonLayers = [];
        that.lableLayers = new L.FeatureGroup();
    },

    onAdd: function(map) 
    {
        var that = this;
        var o = that.options;
        that._map = map;

        if (that.geojsonLayers.length == 0) {
            this.getAjax( this._urp, true, function(data) 
            {
                var layers = data;
                that._layers = layers;
                var setview = (o.setview != undefined ? o.setview : true);
                var setviewf = false, field = '';
                var i = 1000, x = 1;
                var baseMaps = that.baseMaps;
                var overlayMaps = that.overlayMaps;
                var geojsonLayers = that.geojsonLayers;

                for (var layer in layers) 
                {
                    if (layers[ layer].style) 
                    {
                        if (layers[ layer].style.setview)
                            setview = layers[ layer].style.setview;
                        
                        if (setview == true && layers[ layer].style.lat && layers[ layer].style.lng && layers[ layer].style.zoom) {
                            map.setView([layers[ layer].style.lat, layers[ layer].style.lng], layers[ layer].style.zoom);
                            setviewf = true;
                        }
                        /*
                        if (layers[ layer].style.legend) {
                            var info = that._info = L.control({position: 'bottomleft'});
                            var iurl = o.url + layers[ layer].style.legend;

                            info.onAdd = function (map) {
                                var div = L.DomUtil.create('div', 'leaflet-control-attribution');
                                div.id = 'form';
                                div.style.height = 'auto';
                                div.style.margin = '5px';
                                div.style.padding = '5px';
                                div.style.position = 'absolut';
                                div.style.cssFloat = 'none';
                                div.innerHTML = '<img id="soya" src="' +iurl +'" style="max-height:300px; max-width:300px">';

                                L.DomEvent.disableClickPropagation(div);

                                return div;
                            };

                            info.addTo(map);
                            info.options.visible = true;
                        }
                        */
                    }

                    if (layers[ layer].lable) 
                    {
                        if (layers[ layer].lable.field) {
                            field = layers[ layer].lable.field;
                        }
                    }

                    if (layers[ layer].show && Boolean( layers[ layer].show) == true) 
                    {
                        // Tiles layer

                        if (layers[ layer].type && (layers[ layer].type.indexOf("TileLayer") >= 0 || layers[ layer].type.indexOf("TileImage") >= 0)) 
                        {                            
                            if (layers[ layer].layer) 
                            {
                                var props = {minZoom: 0, maxZoom: 20};
                                if (layers[ layer].zoom && layers[ layer].zoom == true) {
                                    props.minZoom = layers[ layer].minZoom;
                                    props.maxZoom = layers[ layer].maxZoom;
                                }
                                
                                if (layers[ layer].type == "TileImage" && layers[ layer].url) {
                                    if (layers[ layer].maxZoom && layers[ layer].maxZoom > 18 && L.TileLayer.GIS) {
                                        props.maxDrawZoom = 18;
                                        props.maxNativeZoom = 18;
                                        geojsonLayers[ layer] = L.tileLayer.gis( layers[ layer].url, props);
                                    } else {
                                        geojsonLayers[ layer] = new L.TileLayer( layers[ layer].url, props);
                                    }                                    
                                    if (layers[ layer].style && layers[ layer].style.opacity)
                                        geojsonLayers[ layer].setOpacity( layers[ layer].style.opacity);                                    
                                }

                                if (layers[ layer].type == "TileLayer" && layers[ layer].url)
                                    geojsonLayers[ layer] = new L.TileLayer( layers[ layer].url, props);

                                if (layers[ layer].type == "TileLayerGoogle")
                                    geojsonLayers[ layer] = new L.Google( layers[ layer].subType);

                                if (layers[ layer].type == "TileLayerYandex")
                                    geojsonLayers[ layer] = new L.Yandex( layers[ layer].subType);

                                geojsonLayers[ layer].addTo( map);
                                geojsonLayers[ layer].setZIndex(x);

                                var lName = layers[ layer].layer;

                                if (layers[ layer].name)
                                    lName = layers[ layer].name;

                                overlayMaps[ lName] = geojsonLayers[ layer];
                            }
                        }
                        
                        if (layers[ layer].type && (layers[ layer].type.indexOf("TileOverlay") >= 0)) 
                        {                            
                            if (layers[ layer].layer) 
                            {
                                geojsonLayers[ layer] = new L.layerGroup();
                                
                                that.getImages( that._url +'layer/' +layers[ layer].layer +'/json', geojsonLayers[ layer], that);

                                geojsonLayers[ layer].addTo( map);
                                geojsonLayers[ layer].setZIndex(x);
                                
                                var lName = layers[ layer].layer;

                                if (layers[ layer].name)
                                    lName = layers[ layer].name;

                                overlayMaps[ lName] = geojsonLayers[ layer];
                            }
                        }

                        // Objects Layer

                        if (!layers[ layer].type || layers[ layer].type.indexOf("Overlay") == 0) 
                        {                            
                            if (layers[ layer].layer) 
                            {
                                geojsonLayers[ layer] = new L.geoJson();
                                var filter = '';

                                if (layers[ layer].filter)
                                try {
                                    filter = JSON.stringify( layers[ layer].filter,null,null);
                                    if (filter.length == 2 || Object.keys(filter).length == 0) {
                                        filter = '';
                                    } else {
                                        filter = filter.replace("{", "(").replace("}", ")");
                                    }
                                } catch (e) {
                                    
                                }
                                that.getJson( that._url +'layer/' +layers[ layer].layer, filter, geojsonLayers[ layer], layers[ layer], that);

                                geojsonLayers[ layer].addTo( map);
                                geojsonLayers[ layer].setZIndex(x);
                                
                                var lName = layers[ layer].layer;

                                if (layers[ layer].name)
                                    lName = layers[ layer].name;

                                overlayMaps[ lName] = geojsonLayers[ layer];
                            }
                        }
                        
                        if (!layers[ layer].type || layers[ layer].type.indexOf("File") >= 0) 
                        {                            
                            if (layers[ layer].layer) 
                            {
                                geojsonLayers[ layer] = new L.geoJson();

                                that.getGisJson( that._url +'layer/' +layers[ layer].layer +'/json', '', geojsonLayers[ layer], layers[ layer], that);

                                geojsonLayers[ layer].addTo( map);
                                geojsonLayers[ layer].setZIndex(x);
                                
                                var lName = layers[ layer].layer;

                                if (layers[ layer].name)
                                    lName = layers[ layer].name;

                                overlayMaps[ lName] = geojsonLayers[ layer];
                            }
                        }
                    }
                    
                    x++;
                }

                if (o.controlLayers) {
                    that._control = new L.Control.Layers( baseMaps, overlayMaps, {autoZIndex: false});
                    map.addControl( that._control); //.addTo( map);
                    map.on('overlayadd', function(e){ that.updateMapList(e)});
                }

                map.addLayer(that.lableLayers);
            });
        } else {
            for (var layer in that.geojsonLayers) {
                if (!map.hasLayer( that.geojsonLayers[ layer])) {
                    map.addLayer( that.geojsonLayers[ layer]);
                }
            }        

            if (!map.hasLayer( that.lableLayers)) {
                map.addLayer(that.lableLayers);
            }
        }
        
        map.on('zoomend', this._update, this);        
    },
    
    onRemove: function( e) {
        var that = this;
        
        for (var layer in that.geojsonLayers) {
            if (map.hasLayer( that.geojsonLayers[ layer])) {
                map.removeLayer( that.geojsonLayers[ layer]);
            }
        }        
        
        if (map.hasLayer( that.lableLayers)) {
            map.removeLayer(that.lableLayers);
        }

        if (that._info) {
            map.removeControl(that._info);
            that._info.options.visible = false;
        }

        map.off('zoomend', this._update, this);
    },
    
    _update: function() {
        var layers = this._layers;
        
        for (var layer in layers) {
            if (this.geojsonLayers[ layer]) {
                if (layers[ layer].zoom && layers[ layer].zoom == true) {
                    if (map.getZoom() >= layers[ layer].minZoom && map.getZoom() <= layers[ layer].maxZoom) {
                        if (!map.hasLayer(this.geojsonLayers[ layer]))
                            map.addLayer(this.geojsonLayers[ layer]);
                    } else {
                        if (map.hasLayer(this.geojsonLayers[ layer]))
                            map.removeLayer(this.geojsonLayers[ layer]);
                    }
                }
            }
        } 
    },
    
    updateMapList: function( e) 
    {
        var that = this;
        var map = this._map;
        var overlayMaps = this.overlayMaps;
        
        if (that._info && that._info.options.visible == false) {
            map.addControl(that._info);
            that._info.options.visible = true;
        }
        
        try {
            map.off('overlayadd');
            
            for (var layer in overlayMaps) 
            {
                if (map.hasLayer( overlayMaps[ layer]) && overlayMaps[ layer]._map != null) {
                    map.removeLayer( overlayMaps[ layer]);
                    map.addLayer( overlayMaps[ layer]);
                }
            }
        } finally {
            map.on('overlayadd', function(e){ that.updateMapList(e)});
        }
    },

    getGisJson: function(url, filter, layer, param, that)
    {
        var f = filter && filter != '{}' && filter.length > 0 ? '?filter=' +filter : '';		
        this.getAjax( url +f, true, function(data) 
        {       
            var layerStyle = param.styles;
            //var layerFields = param.fields;

            if (param.style && param.style.icon && param.style.icon.url)
            {
                if (param.style.icon.width && param.style.icon.height) {
                    that.setIcon( that._url +param.style.icon.url, param.style.icon.width, param.style.icon.height);
                } else {
                    that.setIcon( that._url +param.style.icon.url, 36, 36);
                }

                var img = new Image();
                img.onload = function() {
                    that.setIcon( that._url +param.style.icon.url, img.width, img.height);
                }
                img.src = that._url +param.style.icon.url;

            } else {
               that.layerIcon = new that.defaultIcon();
            }
            
            var jLayer = L.geoJson( data, { param: param, that: that, style: function(f) {return that.style(f, that, param.styles)}, onEachFeature: that.onEachFeature }).addTo(layer);

            if (param && param.style)
            {
                if (param.style.weight)
                    jLayer.setStyle({weight: param.style.weight});

                if (param.style.color)
                    jLayer.setStyle({color: that.valColor( param.style.color)});

                if (!layerStyle && param.style.fillColor) {
                    if (param.style.fillColor == "none")
                        jLayer.setStyle({fillColor: param.style.fillColor});
                    else
                        jLayer.setStyle({fillColor: that.valColor( param.style.fillColor)});
                }

                if (param.style.fillOpacity)
                    jLayer.setStyle({fillOpacity: param.style.fillOpacity});
            }
            
            that.updateMapList();
        });
    },
    
    getImages: function(url, layer, that)
    {
        this.getAjax( url, true, function(data) 
        {       
            for (var rec in data) {
                var json = data[ rec];
                
                if (json.geometry && json.properties && json.properties.size && json.properties.url && json.properties.size < 10*1024*1024) {
                    var now = (new Date()).getTime();
                    var c = json.geometry.coordinates;
                    var bounds = [[c[0][1],c[0][0]],[c[1][1],c[1][0]]];
                    var img = that._url +json.properties.url +'?time=' +now;
                    L.imageOverlay( img, bounds).addTo(layer);
                }
            } 
            
            that.updateMapList();
        });
    },    

    getJson: function(url, filter, layer, param, that)
    { 
        that.getAjax( url +'/fields', true, function(data) {       
            param.fields = data;
            that.getGisJson( url +'/json', filter, layer, param, that);
        });
    },
    /*
    getFieldTitle: function(name, fields)
    {
        if (fields && fields.fields)
        {
            for (var rows in fields.fields) 
            { 
                var row = fields.fields[ rows];
                if (row[ 0]) {
                    var field = row[ 0];

                    if (field.name && field.title && field.name.toLowerCase() == name.toLowerCase()) {
                       return field.title;
                    }
                }
            }
        }  
                        
        return name;
    },     
    
    getItems: function(that, data, fields) 
    {
        var items = [];
        items.push( "<table>"); 
        for (var key in data) {
            var val = data[ key];
            items.push( "<tr style='min-height:20px'><td style='width:50%'><b>" +that.getFieldTitle( key, fields) +":</b></td><td style='padding-left:10px'>" + val + "</td></tr>" );  
        };  
        items.push( "</table>"); 
        return items;
    },
    */        
    iconCount: function( childCount, color) 
    {
        var c = ' marker-cluster-';
        
        if (childCount < 10) {
            c += 'small';
        } else if (childCount < 100) {
            c += 'medium';
        } else {
            c += 'large';
        }

        return new L.DivIcon({ html: '<button style="background-color:' +color +';width:40px;height:40px;border-radius:20px;"><div style="margin: 0px;background-color:' +color +'"><span>' + childCount + '</span></div></button>', className: 'thrumbal', iconSize: new L.Point(40, 40) });
    },
    
    getStyle: function(val, layerStyle) 
    {
        //var that = this;
        var prior = undefined; 

        if (layerStyle) {
            var tod = 24 *60 *60 *1000;
            var mask = layerStyle.mask ? layerStyle.mask : "";
            var now = new Date();

            if (layerStyle.type == 'int' || layerStyle.type == 'float' || layerStyle.type == 'double') {
                val = parseFloat( val);
            } else if (layerStyle.type == 'date') {
                val = this.parseDate( val, mask).getTime() /tod;

                if (layerStyle.format && layerStyle.format == 1) {
                    val = val -now.getTime() /tod;
                }
            }
            
            for (var iStyle in layerStyle.style) 
            {
                var style = layerStyle.style[ iStyle];
                var value = "" +style.value;
                var sep = value.indexOf(" - ", 1) > 0 ? " - " : "-";

                if (value.length > 0 && value.indexOf(sep, 1) > 0 && layerStyle.type != 'string')
                {
                    var from = value.substr(0, value.indexOf(sep, 1)).trim();
                    var upto = value.substr(value.indexOf(sep, 1) +sep.length).trim();

                    if (layerStyle.type == 'int' || layerStyle.type == 'float' || layerStyle.type == 'double') 
                    {
                        from = parseFloat( from);
                        upto = parseFloat( upto);
                        val = parseFloat( val);

                        if (val >= from && val <= upto) {
                            return style;
                        }
                    } else if (layerStyle.type == 'date') {
                        if (layerStyle.format && layerStyle.format == 1) {
                            from = parseFloat( from);
                            upto = parseFloat( upto);
                        } else {
                            from = this.parseDate( from, mask).getTime() /tod;
                            upto = this.parseDate( upto, mask).getTime() /tod;                                                        
                        }

                        if (val >= from && val <= upto) {
                            return style;
                        }
                    } else {
                        if (val == from || val == upto) {
                            return style;
                        }
                    }
                } else {
                    if (layerStyle.type == 'int' || layerStyle.type == 'float' || layerStyle.type == 'double') 
                    { 
                        if (val == style.value || (prior && val > prior && val < style.value)) {
                            return style;
                        }
                    } else if (layerStyle.type == 'date') {
                            val = this.parseDate( val, mask).getTime() /tod;
                            var from = prior, upto = style.value; 

                            if (layerStyle.format && layerStyle.format == 1) {
                                from = parseFloat( from);
                                upto = parseFloat( upto);
                                val = val -now.getTime() /tod;
                            } else {
                                from = this.parseDate( from, mask).getTime() /tod;
                                upto = this.parseDate( upto, mask).getTime() /tod;                                                        
                            }

                            if (val == upto || (from && val > from && val < upto)) {
                                return style;
                            }
                    } else {
                        if (val == style.value) {
                            return style;
                        }
                    }
                }

                prior = style.value;
            }
        }
    },
    
    parseDate: function(s,f){
        if (!s) return new Date();
        f = (f != undefined && f.length > 0 ? f.toLowerCase() : f = 'dd.mm.yyyy');
        if (typeof s === 'string' || s instanceof String) {		
            var r = '', o = '';
            if (s) {
                if (s.indexOf( '.') > -1) r = '.';
                if (s.indexOf( '-') > -1) r = '-';
                if (s.indexOf( '/') > -1) r = '/';
            }
            if (f) {
                if (f.indexOf( '.') > -1) o = '.';                
                if (f.indexOf( '-') > -1) o = '-';
                if (f.indexOf( '/') > -1) o = '/';
            }
            
            var ss = new Array, ff = new Array;
            
            if ( r == "" || o == "" ) {
                this.splitArrays(ss,ff,s,f);
            } else {
                ss = (s.split(r));
                ff = (f.split(o));  
            }
                    
            var fd=0, fm=1, fy=2;                     
            for (var i in ff) {
                if (ff[i].indexOf( 'd') > -1) fd = i;
                if (ff[i].indexOf( 'm') > -1) fm = i;
                if (ff[i].indexOf( 'y') > -1) fy = i;
            }
            var d = ss.length == 3 ? parseInt(ss[fd],10) : NaN;
            var m = ss.length == 3 ? parseInt(ss[fm],10) : NaN;
            var y = ss.length == 3 ? parseInt(ss[fy],10) : NaN;
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
                if (y < 50) y += 2000;
                return new Date(y,m-1,d);
            } else {
                try {
                    //Date.parseLocale('20-Mar-2012', 'dd-MMM-yyyy');
                    return Date.parse(s);
                } catch (e) {
                    return new Date();
                }
            }
        } else {
            return new Date();
        }			
    },
    
    splitArrays: function(ss,ff,s,f) {
        var index=0, count=0;   
        var a = ["d","m","y"];
        a.forEach(function(item){
            if (f.indexOf( item) > -1) {
                index = f.indexOf( item); 
                count = this.countChar(f,item);
                ff.push(f.substring(index,index+count)); 
                ss.push(s.substring(index,index+count)); 
            }
        });
    },

    countChar: function(s,c){
        var count = s.length;
        var res = 0;
        for(var i=0; i < count; i++){
            if(s.charAt(i) == c){
                res++;
            }
        }
        return res;
    },
    
    onEachFeature: function(feature, layer) 
    {
        var that = this.that;
        var layerStyle = this.param.styles;
        var layerLable = this.param.lable;
        var layerContent = this.param.content;
        var data = feature.properties;
        var items = [];
        
        if (layerContent == 'Images') {
            if (data.filename) items.push( "<a href='" +that.options.url +data.filename +"' target='_blank'><img src='" +that.options.url +data.filename +"?t=2'></a>");
            if (data.filenote) items.push( "<br><div class='lead'>" +data.filenote +"</div>");
        } else {
            items = that.getItems( that, this.param && this.param.fields ? this.param.fields : undefined, data);
        }
        
        var popupContent = "<div class='modal-body' style='width: 287px;padding:0px'>" +
                           "<p>" +items.join( "") +"</p>" +"</div>";

        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }

        layer.bindPopup(popupContent);

        if (layer.feature && layer.feature.geometry)
        {
            var type = layer.feature.geometry.type;

            if (type == 'Marker' || type == 'MultiPoint' || type == 'Point') 
            {
                if (layerStyle && layerStyle.style) 
                {
                    var val = feature.properties[ layerStyle.field];
                    var style = that.getStyle( val, layerStyle);

                    if (style) 
                    {
                        if (layer._layers)
                           layer._layers[ layer._leaflet_id -1].options.icon = that.iconCount( val, that.valColor( style.color));
                        else
                           layer.options.icon = that.iconCount( val, that.valColor( style.color));
                    }

                } else {
                    if (layer._layers)
                       layer._layers[ layer._leaflet_id -1].setIcon( that.layerIcon);
                    else
                       layer.setIcon( that.layerIcon);
                }
            }
            
            if (feature.properties && type == 'Polygon' && layerLable && layerLable.field) {
                var s = feature.properties[ layerLable.field.toLowerCase()];
                var l = that.getWidthOfText( s, 'leaflet-label-overlay') /2;
                var labelTitle = new L.LabelOverlay( layer.getBounds().getCenter(), s, {offset: new L.Point(-l, 8), 
                                                        minZoom: layerLable.minZoom ? layerLable.minZoom : 10, 
                                                        maxZoom: layerLable.maxZoom ? layerLable.maxZoom : 20});
                that.lableLayers.addLayer( labelTitle);
            }                    
        }
        
        layer.on({
            //mouseover: highlightFeature,
            //mouseout: resetHighlight,
            //click: zoomToFeature
        });                            
    },
    
    getWidthOfText: function(str, nameClass){
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext("2d");
        ctx.font = '12px/1.4 "Helvetica Neue", Arial, Helvetica, sans-serif;';
        var width = ctx.measureText(str).width;
        return width;
    },      
    
    valColor: function( c)
    {
        if (c && c.indexOf( "#") == -1)
            return '#' +c;
        else
            return c;
    },
    
    getColor: function(d, layerStyle) 
    {
        var that = this;
        
        if (layerStyle && layerStyle.style)
            {
                var style = that.getStyle( d, layerStyle); 

                if (style != undefined)
                    return that.valColor( style.color);
            }
        else    
        return d > 1000 ? '#800026' :
               d > 500  ? '#BD0026' :
               d > 200  ? '#E31A1C' :
               d > 100  ? '#FC4E2A' :
               d > 50   ? '#FD8D3C' :
               d > 20   ? '#FEB24C' :
               d > 10   ? '#FED976' :
                          '#FFEDA0';
    },
    
    style: function(feature, that, layerStyle) 
    {
        var value = feature.id; 

        if (layerStyle && layerStyle.field) {
            if (feature.properties[ layerStyle.field.toLowerCase()] != undefined) {
               value = feature.properties[ layerStyle.field.toLowerCase()];
            }
        }

        return {
            fillColor: that.getColor( value, layerStyle),
            weight: 1,
            opacity: 1,
            //zIndex: 100000 -value,
            color: 'white',
            dashArray: '',
            fillOpacity: 0.7
        };
    },    
    
    setIcon: function( url, width, height)
    {
        var userIcon = L.Icon.extend({ options: {iconUrl: url, iconSize: [width, height], iconAnchor: [ Math.round( width/2), height -1], popupAnchor: [0, -height +Math.round( width/2)]}});
        this.layerIcon = new userIcon();
    }
});

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
        
        if (this.options.isArea && this.options.isArea == true && this.options.area) {
            var label = L.DomUtil.create( 'label', '', this._container);
            label.innerHTML = this.options.area;
            label.style.whiteSpace = 'nowrap';
        }
        
        map.on('viewreset', this._reset, this);
        map.on('zoomend', this._update, this);
        
        if (this.options.minZoom > this._map.getZoom() || this.options.maxZoom < this._map.getZoom()) 
           L.DomUtil.addClass( this._container, 'hide');
        
        this._reset();
        this._update();
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