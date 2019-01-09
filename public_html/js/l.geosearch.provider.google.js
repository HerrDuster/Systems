/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.Google uses google geocoding service
 * https://github.com/smeijer/leaflet.control.geosearch
 */

onLoadGoogleApiCallback = function() {
    L.GeoSearch.Provider.Google.Geocoder = new google.maps.Geocoder();
    document.body.removeChild(document.getElementById('load_google_api'));
};

L.GeoSearch.Provider.Google = L.Class.extend({
    options: {

    },

    initialize: function(options) {
        options = L.Util.setOptions(this, options);
    },

    GetLocations: function(qry, callback) {
        $.ajax({
            url: "https://maps.googleapis.com/maps/api/geocode/json?sensor=false" +(this.options.key ? "&key=" +this.options.key : "") +'&address=' +qry,
            async: true,
            type: 'GET',
            success: function(response) {
                if (response.status && response.status == 'OK') 
                {
                    var data = response.results;
                    
                    if (data.length == 0)
                        return [];
                    
                    var results = [];
                    for (var i = 0; i < data.length; i++) 
                        results.push(new L.GeoSearch.Result(
                            data[i].geometry.location.lng, 
                            data[i].geometry.location.lat, 
                            data[i].formatted_address
                        ));

                    if(typeof callback == 'function')
                        callback(results);
                } 
            }
        });
    }
});
