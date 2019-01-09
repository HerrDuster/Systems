/*
 * L.Control.GeoSearch - search for an address and zoom to its location
 * https://github.com/smeijer/leaflet.control.geosearch
 */

L.GeoSearch = {};
L.GeoSearch.Provider = {};

L.GeoSearch.Result = function (x, y, label) {
    this.X = x;
    this.Y = y;
    this.Label = label;
    this.Popup = '';
};

L.GeoSearch.Result = function (x, y, label, popup) {
    this.X = x;
    this.Y = y;
    this.Label = label;
    this.Popup = popup;
};

L.Control.GeoSearch = L.Control.extend({
    options: {
        position: 'topcenter',
        showMarker: true
    },

    _config: {
        country: '',
        searchLabel: 'search for address ...',
        notFoundMessage: 'Sorry, that address could not be found.',
        messageHideDelay: 3000 *100,
        zoomLevel: 15,
        selected: 0,
        providers: []
    },

    initialize: function (options) {
        L.Util.extend(this.options, options);
        L.Util.extend(this._config, options);
        
        if (this._config.providers != undefined && this._config.providers.length > 0) {
            this._config.provider = this._config.providers[ this._config.selected].provider;
        }
    },

    onAdd: function (map) {
        var $controlContainer = map._controlContainer,
            nodes = $controlContainer.childNodes,
            topCenter = false, topLeft = false;
            
        for (var i = 0, len = nodes.length; i < len; i++) {
            var klass = nodes[i].className;
            if (/leaflet-top/.test(klass) && /leaflet-center/.test(klass)) {
                topCenter = true;
                break;
            }
            if (/leaflet-top/.test(klass) && /leaflet-left/.test(klass)) {
                topLeft = true;
                break;
            }
        }
        /*
        if (!topCenter) {
            var tc = document.createElement('div');
            tc.className += 'leaflet-top leaflet-center';
            $controlContainer.appendChild(tc);
            map._controlCorners.topcenter = tc;
        }
        
        if (topLeft) {
            var tc = document.createElement('div');
            tc.className += 'leaflet-top leaflet-left leaflet-control-geosearch-left';
            $controlContainer.appendChild(tc);
            map._controlCorners.topleft = tc;
        }
        */
        this._map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-geosearch');
        
        if (topLeft) {
            //this._container.className += 'leaflet-control-geosearch-left';
            L.DomUtil.addClass( this._container, 'leaflet-control-geosearch-left');
        }
        
        map.geosearch = this._container;
        
        var searchbox = document.createElement('input');
        searchbox.id = 'leaflet-control-geosearch-qry';
        searchbox.type = 'text';
        
        if (this._config.providers != undefined && this._config.providers.length > 0) 
            searchbox.style.cssText = 'width:69%;padding:0px; margin:0px';
        else
            searchbox.style.cssText = 'width:100%;padding:0px; margin:0px';
    
        searchbox.placeholder = this._config.searchLabel;
        this._searchbox = searchbox;

        var close = this._close = L.DomUtil.create('div');
        close.className = "hide";
        close.style.cssText = 'width:12px;padding-top:5px;margin:0px;float: right;'; //position: relative;
        close.innerHTML = '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
        L.DomEvent.on(close, 'click', this._hideResults, this);

        if (this._config.providers != undefined && this._config.providers.length > 0) 
        {
            var selectbox = document.createElement('select');
            selectbox.id = 'leaflet-control-geosearch-sel';
            //selectbox.className = '';
            selectbox.style.cssText = 'width:29%;padding:0px; margin:0px;margin-right: 1%';
            var options_str = "", i = 0, j = this._config.selected;
            
            this._config.providers.forEach( function(provider) 
            {
                var s = "";
                if (j == i) s = "selected";
                //options_str += '<option ' +s +' value="' +i.toString() + '">' + provider.name + '</option>';
              
                var a = document.createElement('option');
                a.value = i.toString();
                a.text = provider.name;
                selectbox.appendChild( a);
                
                i++;
            });
            selectbox.selectedIndex = j;
            //selectbox.innerHTML = options_str;
            this._selectbox = selectbox;
            
            this._container.appendChild(this._selectbox);
            L.DomEvent.addListener(this._selectbox, 'change', this._onSelect, this);
        }
        
        var msgbox = document.createElement('div');
        msgbox.id = 'leaflet-control-geosearch-msg';
        msgbox.className = 'leaflet-control-geosearch-msg';
        this._msgbox = msgbox;

        var resultslist = document.createElement('ul');
        resultslist.id = 'leaflet-control-geosearch-results';
        this._resultslist = resultslist;

        this._container.appendChild(this._close);
        this._msgbox.appendChild(this._resultslist);
        this._container.appendChild(this._searchbox);
        this._container.appendChild(this._msgbox);

        L.DomEvent
          .addListener(this._container, 'click', L.DomEvent.stop)
          .addListener(this._searchbox, 'keypress', this._onKeyPress, this)
          .addListener(this._searchbox, 'keyup', this._onKeyUp, this)
          .addListener(this._container, 'mouseover', function (e) {
             if (map.contextmenu) {
                 map.contextmenu.hide();
                 map.contextmenu.removeHooks();
             }
          }, this)
          .addListener(this._container, 'mouseout', function (e) {
             if (map.contextmenu) {
                 map.contextmenu.addHooks();
             }
          }, this)
          
        L.DomEvent.disableClickPropagation(this._container);

        this._show = false;

        return this._container;
    },

    geosearch: function (qry, _show) 
    {
        if (qry.length > 1)
        try {
            this._show = _show;
            var provider = this._config.provider;

            if(typeof provider.GetLocations == 'function') {
                var results = provider.GetLocations(qry, function(results) {
                    this._processResults( results);
                }.bind(this));
            }
            else {
                var url = provider.GetServiceUrl(qry);
                this.sendRequest(provider, url);
            }
        }
        catch (error) {
            this._printError(error);
        }
    },

    sendRequest: function (provider, url) {
        var that = this;
        
        window.parseLocation = function (response) {
            var results = provider.ParseJSON(response);
            that._processResults(results);

            document.body.removeChild(document.getElementById('getJsonP'));
            delete window.parseLocation;
        };

        function getJsonP (url) {
            url = url + '&callback=parseLocation'
            var script = document.createElement('script');
            script.id = 'getJsonP';
            script.src = url;
            script.async = true;
            document.body.appendChild(script);
        }
        
        if (XMLHttpRequest) 
        {
            var xhr = new XMLHttpRequest();
            
            if ('withCredentials' in xhr) 
            {
                var xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.responseText.substr( 0, 1) != '?') {
                        if (xhr.status == 200) {
                            var response = JSON.parse(xhr.responseText),
                                results = provider.ParseJSON(response);

                            that._processResults(results);
                        } else if (xhr.status == 0 || xhr.status == 400) {
                            getJsonP(url);
                        } else {
                            that._printError(xhr.responseText);
                        }
                    }
                };

                xhr.open('GET', url, true);
                xhr.send();
            } else if (XDomainRequest) {
                var xdr = new XDomainRequest();

                xdr.onerror = function (err) {
                    that._printError(err);
                };

                xdr.onload = function () {
                    var response = JSON.parse(xdr.responseText),
                        results = provider.ParseJSON(response);

                    that._processResults(results);
                };

                xdr.open('GET', url);
                xdr.send();
            } else {
                getJsonP(url);
            }
        }
    },

    _processResults: function(results)  
    {
        if (results.length > 0) {
            this._map.fireEvent('geosearch_foundlocations', {Locations: results});
            this._showLocations( results);
            
            if (this._show)
                this._showLocation(results[0]);
        } else {
            this._printError(this._config.notFoundMessage);
        }
    },

    _showLocations: function (results) 
    {
        this._results = results; 
        var that = this;

        this._close.className = "show";
        this._searchbox.style.width = '65%';

        var elem = this._resultslist;
        elem.innerHTML = '';
        elem.style.display = 'block';
        
        for (var p in results) 
        {
            var res = results[ p];
            var li = document.createElement( 'li');
            li.id = 'leaflet-control-geosearch-result_' +p;
            li.innerHTML = res.Label;
            li.onclick = function (e) { that._selectLocation( e); };
            
            if (p < 5)
                elem.appendChild( li);
        }
        
        setTimeout(function () {
            elem.style.display = 'none';
        }, 3000 *100);
    },

    _selectLocation: function ( e) 
    {
        if (e && e.target) {
            var str = e.target.id;
            
            if (str.indexOf("_") >= 0) 
            {
                str = str.substr( str.indexOf("_") +1);
            
                if (str.length > 0)
                    this._showLocation( this._results[ str]);
            }
        }
    },

    _showLocation: function (location) {
        if (this.options.showMarker == true) {
            if (typeof this._positionMarker === 'undefined')
                this._positionMarker = L.marker([location.Y, location.X]).addTo(this._map);
            else
                this._positionMarker.setLatLng([location.Y, location.X]);
            if (location.Popup && location.Popup.length > 0) {
                this._positionMarker.bindPopup( location.Popup);
            } else {
                this._positionMarker.unbindPopup();
            }
        }

        if (this._config.zoomLevel > 0)
            this._map.setView([location.Y, location.X], this._config.zoomLevel, false);
        else
            this._map.panTo([location.Y, location.X]);
        
        this._map.fireEvent('geosearch_showlocation', {Location: location});
        
        //var elem = this._resultslist;
        //elem.style.display = 'none';
        this._hideResults();
    },

    _printError: function(message) {
        var elem = this._resultslist;
        elem.innerHTML = '<li>' + message + '</li>';
        elem.style.display = 'block';

        setTimeout(function () {
            elem.style.display = 'none';
        }, 3000 *100);
    },
    
    _onKeyPress: function (e) {
        var esc = 27,
            enter = 13,
            queryBox = document.getElementById('leaflet-control-geosearch-qry');
        
        if (queryBox.length < 2)
           this._resultslist.style.display = 'none';
        
        if (e.keyCode === esc) { // escape key detection is unreliable
            queryBox.value = '';
            this._map._container.focus();
        } else if (e.keyCode === enter) {
            this.geosearch(queryBox.value, true);
        }
    },
    
    _onKeyUp: function (e) {
        var esc = 27,
            enter = 13,
            queryBox = document.getElementById('leaflet-control-geosearch-qry');
        
        if (queryBox.length < 2)
           this._resultslist.style.display = 'none';
        
        if (e.keyCode === esc) {
            
        } else if (e.keyCode === enter) {
            
        } else {
            this.geosearch(queryBox.value, false);
        }
    },

    _hideResults: function () {
        this._resultslist.style.display = 'none';
        this._close.className = "hide";
        this._searchbox.style.width = '69%';
    },

    _onSelect: function (e) {
        var rec = this._selectbox; 
        if (rec.value != 'none') {
            var i = parseInt( rec.value);
            //console.log(i);
            this._config.selected = i;
            this._config.provider = this._config.providers[ i].provider;
            
            var provider = this._config.provider;

            if(typeof provider.GetMask == 'function') {
                provider.GetMask();
            } else {
                if (!($.fn.inputmask === undefined)) { 
                    $("#leaflet-control-geosearch-qry").inputmask('remove');
                }
            }
        }
    }
});