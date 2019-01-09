/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.GISFile uses GISFile geocoding service
 * https://github.com/smeijer/leaflet.control.geosearch
 */

L.GeoSearch.Provider.NCS = L.Class.extend({
    options: {
        land : "Ділянка",
        cadnum : "Кадастр.номер",
        use : "Призначення",
        purpose : "Цільове призначення",
        area : "Площа",
        ownership : "Вид власника",
        add_date : "Дата створення",
        latitude : "Широта",
        longitude : "Довгота",
        ownerships : {100: "Приватна власність", 200: "Землі комунальної власності", 300: "Землі державної власності"}
    },

    initialize: function(options) {
        options = L.Util.setOptions(this, options);
    },

    GetMask: function() {
        if (!($.fn.inputmask === undefined)) { 
            $("#leaflet-control-geosearch-qry").inputmask({mask: "9999999999:99:999:9999", placeholder: " "});
        }
    },

    GetLocations: function(qry, callback) 
    {
        var results = [];
        var koatuu="",zone="",quartal="",parcel="",op=this.options;

        if (qry.trim().length == 22) 
        {
            var str = qry.split(":");
            
            if (str.length == 4) 
            {
                koatuu=str[0];
                zone=str[1];
                quartal=str[2];
                parcel=str[3];
            }
        }    
        
        if (koatuu.length == 10 && zone.length == 2 && quartal.length == 3 && parcel.length == 4) 
        {
            $.ajax({
                //url: 'http://gisfile.com/layer/cadmap/search?cadnum=' +qry,
				url: 'http://map.land.gov.ua/kadastrova-karta/find-Parcel?cadnum=' +qry +'&activeArchLayer=0',
                async: true,
                success: function(json) {
                    if (typeof json == 'string') {
                        json = JSON.parse(json);
                    }
                    
                    if (!json.data || json.data.length == 0)
                        return [];

                    var data = json.data;
                    
                    for (var i = 0; i < data.length; i++) 
                    {
                        if (data[i].st_xmin != null) 
                        {
                            var xy = [parseFloat(data[i].st_xmin) +(parseFloat(data[i].st_xmax) -parseFloat(data[i].st_xmin)) /2 -0.0017,
                                      parseFloat(data[i].st_ymin) +(parseFloat(data[i].st_ymax) -parseFloat(data[i].st_ymin)) /2 -0.0002];
                            
                            if (proj4) {
                                var ll = proj4("+proj=merc +a=6378137 +b=6378137 +lon_0=0 +x_0=0 +y_0=0 +k=1 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs", 
                                               "+proj=longlat +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                                               [xy[0], xy[1]]);

                                xy[0] = ll[0];
                                xy[1] = ll[1];
                            }
                            
                            $.ajax({
                                //url: 'http://gisfile.com/layer/cadmap/search?koatuu=' +koatuu +'&zone=' +zone +'&quartal=' +quartal +'&parcel=' +parcel,
								url: 'http://map.land.gov.ua/kadastrova-karta/get-parcel-Info?koatuu=' +koatuu +'&zone=' +zone +'&quartal=' +quartal +'&parcel=' +parcel,
                                async: true,
                                success: function(note) {
                                    if (typeof note == 'string') {
                                        note = JSON.parse(note);
                                    }
                                    
                                    var names = '', popup = '', oli = '<li><div class="label">', cdiv = ':</div>', cli = '</li>';

                                    if (note.data && note.data.length > 0) {
                                        //console.log( note.data);
                                        for (var j = 0; j < note.data.length; j++) {
                                            names = op.cadnum +': ' +note.data[j].cadnum +'<br>';
                                            popup = oli +op.cadnum +cdiv +note.data[j].cadnum +cli;
                                                
                                            if (note.data[j].use) {
                                                names = names +op.use +': ' +note.data[j].use +'<br>';
                                                popup = popup +oli +op.use +cdiv +note.data[j].use +cli;
                                            }
                                                
                                            if (note.data[j].purpose) {
                                                names = names +op.purpose +': ' +note.data[j].purpose +'<br>';
                                                popup = popup +oli +op.purpose +cdiv +note.data[j].purpose +cli;
                                            }
                                            
                                            if (note.data[j].ownershipcode) {
                                                var c = note.data[j].ownershipcode;
                                                names = names +op.ownership +': ' +(op.ownerships[c] ? ' ' +op.ownerships[c] : c) +'<br>';
                                                popup = popup +oli +op.ownership +cdiv +(op.ownerships[c] ? ' ' +op.ownerships[c] : c) +cli;
                                            }
                                                    
                                            if (note.data[j].add_date) {
                                                names = names +op.add_date +': ' +note.data[j].add_date +'';
                                                popup = popup +oli +op.add_date +cdiv +note.data[j].add_date +cli;
                                            }
                                            
                                            if (note.data[j].area && note.data[j].unit_area) {
                                                names = names +op.area +': ' +note.data[j].area +' ' +note.data[j].unit_area +'<br>';
                                                popup = popup +oli +op.area +cdiv +note.data[j].area +' ' +note.data[j].unit_area +cli;
                                            }
                                        }
                                    }
									
                                    popup = popup +oli +op.latitude +cdiv  +xy[1] +cli
                                                  +oli +op.longitude +cdiv +xy[0] +cli;
                                              
                                    results.push( new L.GeoSearch.Result( xy[0], xy[1], names.length > 0 ? names : qry, '<h3>' +op.land +'</h3>' +popup));
                                    
                                    if(typeof callback == 'function')
                                        callback(results);
                            }});
                        }
                    }
                }
            });
        } else {
            if(typeof callback == 'function')
                callback( results);
        }
    }
});