/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.GISFile uses GISFile geocoding service
 * https://github.com/smeijer/leaflet.control.geosearch
 */

L.GeoSearch.Provider.GISFile = L.Class.extend({
    options: {
        type : 'layer',
        name : 'world',
        typeseek : 1
    },

    initialize: function(options) {
        options = L.Util.setOptions(this, options);
    },

    GetLocations: function(qry, callback) 
    {
        $.ajax({
            url: 'http://' +location.host +'/' +this.options.type +'/' +this.options.name +'/search', // +'?q=' +qry, 
            async: true,
            type: 'POST',
            data: 'q=' +qry +'&t=' +this.options.typeseek,
            success: function(response) {
                var data = JSON.parse( response);
                //console.log( data);
                if (data.length == 0)
                    return [];

                var results = [];
                for (var i = 0; i < data.length; i++) 
                    results.push(new L.GeoSearch.Result(
                        data[i].lon, 
                        data[i].lat, 
                        data[i].display_name
                    ));

                if(typeof callback == 'function')
                    callback(results);
            }
        });
    }
});