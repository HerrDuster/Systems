toGeoJSON = (function() {
    'use strict';

    var removeSpace = (/\s*/g),
        trimSpace = (/^\s*|\s*$/g),
        splitSpace = (/\s+/);
    // generate a short, numeric hash of a string
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        } return h;
    }
    // all Y children of X
    function get(x, y) { return x.getElementsByTagName(y); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(attr(x, y)); }
    // one Y child of X, if any, otherwise null
    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
    // cast array x into numbers
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }
    function clean(x) {
        var o = {};
        for (var i in x) if (x[i]) o[i] = x[i];
        return o;
    }
    // get the content of a text node, if any
    function nodeVal(x) {
        if (x) { norm(x); }
        return (x && x.firstChild && x.firstChild.nodeValue) || '';
    }
    // get one coordinate from a coordinate array, if any
    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
    // get all coordinates from a coordinate array as [[],[]]
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace),
            o = [];
        for (var i = 0; i < coords.length; i++) {
            o.push(coord1(coords[i]));
        }
        return o;
    }
    function coordPair(x) {
        var ll = [attrf(x, 'lon'), attrf(x, 'lat')],
            ele = get1(x, 'ele');
        if (ele) ll.push(parseFloat(nodeVal(ele)));
        return ll;
    }

    // create a new feature collection parent object
    function fc() {
        return {
            type: 'FeatureCollection',
            features: [],
            styles: []
        };
    }

    function getXmlStr(xml) {
      if (window.ActiveXObject) { return xml.xml; }
      var str = new XMLSerializer().serializeToString(xml);
      str = str.split(" ").join("");
      return '<xmp>' +str +'</xmp>';
    }
    
    var serializer;
    if (typeof XMLSerializer !== 'undefined') {
        serializer = new XMLSerializer();
    // only require xmldom in a node environment
    } else if (typeof exports === 'object' && typeof process === 'object' && !process.browser) {
        serializer = new (require('xmldom').XMLSerializer)();
    }
    function xml2str(str) { return serializer.serializeToString(str); }
            
    var t = {
        in4: function(doc, opt) {
            var separator = ',', Block = '', CS = '';
            var txt = doc.split(/\r\n|\n/);
            var polygons = [], points = [], coords = [], values = {}, BL = {};

            for (var i=1; i<txt.length; i++) 
            {
                var s = txt[i];
                
                if (s.length > 0 && s.charAt( 0) != "#") 
                {
                    var d = s.split( separator);
                    
                    if (s.indexOf( "CS=") == 0)
                    {
                        if (s.indexOf( "CS=\"0,") == 0 || s.indexOf( "CS=\"1,") == 0) CS = '42';
                        if (s.indexOf( "CS=\"2,") == 0) CS = '63';
                    }
                    
                    if (s.indexOf( "N=") == 0)
                    {
                        var p = {};
                        
                        for (var j in d) 
                        {
                            var SStr = d[ j];
                            
                            if (SStr.indexOf( "=") != -1)
                            { 
                                var A = {};
                                A.Name  = SStr.substr( 0, SStr.indexOf( "=")).toUpperCase();
                           	A.Value = SStr.substr( SStr.indexOf( "=") +1);
                 				
                                //if (A.Name == "NP") p.id = A.Value;
                 		if (A.Name == "X")  p.x = parseFloat( A.Value);
                 		if (A.Name == "Y")  p.y = parseFloat( A.Value);
                 		//if (A.Name == "H")  p.h = parseFloat( A.Value);
                            }
                        }
                        
                        if (p.x != 0 || p.y != 0) {
                            coords.push( [p.x, p.y]);
                        }
                        
                        var l = coords.length -1;
                        
                        if (coords.length > 2 && coords[0][0] == coords[l][0] && coords[0][1] == coords[l][1]) {
                            points.push( coords);
                            coords = [];
                        }
                        
                    } else if (s.indexOf( "=") > 0 && d.length > 0) 
                    {
                        for (var j in d) 
                        {
                            var SStr = d[ j];
                            
                            if (SStr.indexOf( "=") != -1)
                            { 
                                var A = {};
                                A.Name  = SStr.substr( 0, SStr.indexOf( "=")).toUpperCase();
                           	A.Value = SStr.substr( SStr.indexOf( "=") +1);
                                A.Value = A.Value.replace(/"/g, '').replace(/\\/g, '');
                                values[ A.Name] = A.Value;
                            }
                        }
                    }

                    if (s.indexOf( "=") == -1 && d.length > 0) 
                    {
                        if (Block == 'BL' || values.DS) BL = values;
                        if (coords.length > 2) points.push( coords);
                        
                        if (points.length > 0 && CS.length > 0) {
                            if (!opt.isEditor || Block == 'SR' || Block == 'ST') {
                                polygons.push( toFeature( Block, in4Coords( CS, points), values));
                            }
                        }

                        points = [];
                        coords = [];
                        values = {};
                        
                        Block = d[ 0].toUpperCase();
                    }
                }

                //var data = s.split( separator);
            }        

            if (Block.length > 0) 
            {
                if (Block == 'BL' || values.DS) BL = values;
                if (coords.length > 2) points.push( coords);

                if (points.length > 0 && CS.length > 0) {
                    if (!opt.isEditor || Block == 'SR' || Block == 'ST') {
                        polygons.push( toFeature( Block, in4Coords( CS, points), values));
                    }
                }
                
                points = [];
                coords = [];
                values = {};
            }

            return polygons;
            
            function toFeature( name, points, values) 
            {
                values.name = opt.filename;
                
                if (BL.DS && BL.SD & BL.BC &values.SC) values.IKN = BL.DS +":" +BL.SD +":" +BL.BC +":" +values.SC.substring(3, 7);
                if (values.AS && BL.SZ) values.AS += " " +BL.SZ;
                if (BL.CS) values.CS = BL.CS;
                if (BL.HS) values.HS = BL.HS;
                if (BL.GL) values.GL = BL.GL;
                if (BL.ZM) values.ZM = BL.ZM;
                
                var styles = {color:'Black',weight:3,fillOpacity:0.3};
                if (name == 'BL') {styles = {color:'Red',weight:5,fill:"false"}};
                if (name == 'SR' || name == 'ST') {};
                if (name == 'CL') {styles = {color:'Blue',weight:2,fill:"false"}};

                if (name == 'NB') {
                    styles = {color:'Black',weight:1,fillOpacity:0.3};
                    var polygon = { type: 'Feature',
                                    properties: values,
                                    styles: styles,
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: points[0]
                                    }
                                  };
                } else {
                    var polygon = { type: 'Feature',
                                    properties: values,
                                    styles: styles,
                                    geometry: {
                                        type: 'Polygon',
                                        coordinates: points
                                    }
                                  };
                }
                              
                return polygon;
            } 
        
            function in4Coords( sc, points) 
            {
                if (proj4 && points.length > 0 && sc.length > 0) 
                {
                    var size = 500000, crc, wgs = "+proj=longlat +ellps=WGS84 +datum=WGS84";
                    if (sc == '63') crc = getSK63Zone( points[ 0][ 0][1]);
                    if (sc == '42') crc = getSK42Zone( points[ 0][ 0][1]);

                    if (crc != undefined) {
                        //console.log( sc, crc);
                        for (var p in points) {
                            var coords = points[ p];
                            for (var c in coords) {
                                if (coords[c][1] > size && coords[c][0] > size) {
                                    var ll = proj4(crc, wgs, [coords[c][1], coords[c][0]]);
                                    coords[c][0] = ll[0];
                                    coords[c][1] = ll[1];
                                }
                            }
                        }
                    }
                }
                
                return points;
            }
            
            function getSK63Zone( x) 
            {
                var size = 500000, lon0 = 0, x0 = 0;

                if (x >= 1300000 -size && x < 1300000 +size) {lon0 = 23.5, x0 = 1300000};
                if (x >= 2300000 -size && x < 2300000 +size) {lon0 = 26.5, x0 = 2300000};
                if (x >= 3300000 -size && x < 3300000 +size) {lon0 = 29.5, x0 = 3300000};
                if (x >= 4300000 -size && x < 4300000 +size) {lon0 = 32.5, x0 = 4300000};
                if (x >= 5300000 -size && x < 5300000 +size) {lon0 = 35.5, x0 = 5300000};
                if (x >= 6300000 -size && x < 6300000 +size) {lon0 = 38.5, x0 = 6300000};
                if (x >= 7300000 -size && x < 7300000 +size) {lon0 = 41.5, x0 = 7300000};

                return "+proj=tmerc +ellps=krass +lon_0=" +lon0 +" +lat_0=0 +k=1 +x_0=" +x0 +" +y_0=-9214.69 +towgs84=23.92,-141.27,-80.9,0,0.35,0.82,-0.12 +units=m +no_defs";
            }
            
            function getSK42Zone( x) 
            {
                var size = 500000, lon0 = 0, x0 = 0;

                if (x >= 4500000 -size && x < 4500000 +size) {lon0 = 21, x0 = 4500000};
                if (x >= 5500000 -size && x < 5500000 +size) {lon0 = 27, x0 = 5500000};
                if (x >= 6500000 -size && x < 6500000 +size) {lon0 = 33, x0 = 6500000};
                if (x >= 7500000 -size && x < 7500000 +size) {lon0 = 39, x0 = 7500000};

                return "+proj=tmerc +ellps=krass +lon_0=" +lon0 +" +lat_0=0 +k=1 +x_0=" +x0 +" +y_0=0 +towgs84=23.92,-141.27,-80.9,0,0.35,0.82,-0.12 +units=m +no_defs";
            }        
        },        
        xml: function(doc, opt) {
            var ukr = get(doc, 'UkrainianCadastralExchangeFile');
            
            if (ukr != undefined && ukr.length > 0) 
            {
                var sc63 = get( doc, 'SC63'),
                    sc42 = get( doc, 'SC42'),
                    pt = get( doc, 'Point'),
                    pl = get( doc, 'PL'),
                    points = [],
                    lands = [];

                for (var t in pt) {
                    if (pt[t].nodeName != undefined && pt[t].nodeName == 'Point') {
                        var id = get1( pt[ t], 'UIDP').textContent;
                        var n = get1( pt[ t], 'PN') ? get1( pt[ t], 'PN').textContent : '';
                        var x = get1( pt[ t], 'X').textContent;
                        var y = get1( pt[ t], 'Y').textContent;
                        var d = get1( pt[ t], 'Description') ? get1( pt[ t], 'Description').textContent : '';
                        points[ id] = {'x':x, 'y':y, 'n':n, 'd':d};
                    }
                }

                for (var l in pl) {
                    if (pl[l].nodeName != undefined && pl[l].nodeName == 'PL') {
                        var id = get1( pl[ l], 'ULID').textContent;
                        var pnt = get( pl[ l], 'P');
                        lands[ id] = [];
                        
                        for (var p in pnt) {
                            if (pnt[p].nodeName != undefined && pnt[p].nodeName == 'P') {
                                lands[ id].push( pnt[ p].textContent);
                            }
                        }
                    }
                }
                
                var polygons = [];
                    
                if ((sc63.length > 0 || sc42.length > 0) && pl.length > 0) 
                {
                    var czi = get( doc, 'CadastralZoneInfo');

                    for (var z = 0; z < czi.length; z++) 
                    {
                        var cqi = get( czi[z], 'CadastralQuarterInfo');

                        for (var q = 0; q < cqi.length; q++) 
                        {
                            var pi = get( cqi[q], 'ParcelInfo');
                            
                            for (var o = 0; o < pi.length; o++) 
                            {
                                var metrics = get( pi[ o], 'ParcelMetricInfo');
                                var poly = [];
                                var prop = {};
                                
                                // Участок
                                try {
                                    for (var p = 0; p < metrics.length; p++) 
                                    {
                                        var externals = get( metrics[ p], 'Externals');

                                        for (var e = 0; e < externals.length; e++) 
                                        {
                                            var boundary = get( externals[ e], 'Boundary');

                                            for (var b = 0; b < boundary.length; b++) {
                                                var lines = get1( boundary[ b], 'Lines');
                                                var coords = xmlCoords( lines, lands, points);
                                                poly.push( coords);
                                            }

                                            var internals = get( externals[ e], 'Internals');

                                            for (var e = 0; e < internals.length; e++) {
                                                var boundary = get( internals[ e], 'Boundary');

                                                for (var b = 0; b < boundary.length; b++) {
                                                    var lines = get1( boundary[ b], 'Lines');
                                                    var coords = xmlCoords( lines, lands, points);
                                                    poly.push( coords);
                                                }
                                            }
                                        }
                                    }

                                    var pmi = get1( pi[ o], 'ParcelMetricInfo');

                                    if (pmi) {
                                        var ikn = nodeVal( get1( czi[z], 'KOATUU'));
                                        ikn += ":" +nodeVal( get1( czi[z], 'CadastralZoneNumber'));
                                        ikn += ":" +nodeVal( get1( cqi[q], 'CadastralQuarterNumber'));
                                        ikn += ":" +nodeVal( get1( pmi, 'ParcelID'));
                                        
                                        if (!opt.isEditor)
                                            prop[ "Кадастр.номер"] = ikn;
                                        else
                                            prop[ "IKN"] = ikn;

                                        var cpi = get1( pi[ o], 'CategoryPurposeInfo');

                                        if (cpi) {
                                            var use = nodeVal( get1( cpi, 'Use'));
                                            use += " " +nodeVal( get1( cpi, 'Purpose'));
                                            
                                            if (!opt.isEditor)
                                                prop[ "Цільове призначення"] = use;
                                            else
                                                prop[ "CV"] = use;
                                        }

                                        var area = get1( pmi, 'Area');

                                        if (area) {
                                            var s = nodeVal( get1( area, 'Size'));
                                            s += " " +nodeVal( get1( area, 'MeasurementUnit'));
                                            
                                            if (!opt.isEditor)
                                                prop[ "Площа"] = s;
                                            else
                                                prop[ "AS"] = s;
                                        }

                                        var pri = get( pi[ o], 'ProprietorInfo');

                                        for (var r = 0; r < pri.length; r++) 
                                        {                                    
                                            var au = get1( pri[r], 'Authentication');

                                            if (au) {
                                                var user = "";
                                                var np = get1( au, 'NaturalPerson');
                                                var le = get1( au, 'LegalEntity');

                                                if (np) {
                                                    var fn = get1( np, 'FullName');
                                                    if (fn) {
                                                        if (get1( fn, 'LastName')) user += " " +nodeVal( get1( fn, 'LastName')); 
                                                        if (get1( fn, 'FirstName')) user += " " +nodeVal( get1( fn, 'FirstName')); 
                                                        if (get1( fn, 'MiddleName')) user += " " +nodeVal( get1( fn, 'MiddleName')); 
                                                    }
                                                }                                            
                                                if (le) {
                                                    if (get1( le, 'Name')) user += nodeVal( get1( le, 'Name')); 
                                                }

                                                if (user.length > 0) {
                                                    if (!opt.isEditor)
                                                        prop[ "Власник"] = user;
                                                    else
                                                        prop[ "NM"] = user;
                                                }
                                            }
                                        }
                                        
                                        if (!opt.isEditor) {
                                            var users = get1( pi[ o], 'Proprietors');

                                            if (users) {
                                                prop[ "XML"] = getXmlStr( users);
                                            }
                                        } else {
                                            prop[ "name"] = opt.filename;
                                            
                                            var osi = get1( pi[ o], 'OwnershipInfo');

                                            if (osi) {
                                                var code = nodeVal( get1( osi, 'Code'));
                                                prop[ "PF"] = code;
                                            }
                                            
                                            var pli = get1( pi[ o], 'ParcelLocationInfo');

                                            if (pli) {
                                                var adr = "";
                                                adr = addVal( adr, pli, 'Settlement');
                                                
                                                var pa = get1( pli, 'ParcelAddress');
                                                
                                                if (pa) {
                                                    adr = addVal( adr, pa, 'StreetType');
                                                    adr = addVal( adr, pa, 'StreetName');
                                                    adr = addVal( adr, pa, 'Building');
                                                    adr = addVal( adr, pa, 'Block');
                                                }

                                                adr = addVal( adr, pli, 'District');
                                                adr = addVal( adr, pli, 'Region');

                                                prop[ "AD"] = adr.trim();
                                            }
                                            
                                            var pri = get1( pi[ o], 'ProprietorInfo');
                                            
                                            if (pri) {
                                                var dec = "";
                                                var aib = get1( pri, 'AdditionalInfoBlock');
                                                
                                                if (aib) {
                                                    //AdditionalInfo
                                                }
                                                
                                                var paj = get1( pri, 'PropertyAcquisitionJustification');
                                                
                                                if (paj) {
                                                    //Document
                                                    dec = addVal( dec, paj, 'DocumentDate');
                                                    dec = addVal( dec, paj, 'DocumentNumber');
                                                    dec = addVal( dec, paj, 'ApprovalAuthority');
                                                }
                                                
                                                prop[ "PZ"] = dec.trim();
                                            }
                                        }
                                    }

                                    var polygon = { type: 'Feature',
                                                    properties: prop,
                                                    styles: {color:'Black',weight:3,fillOpacity:0.3},
                                                    geometry: {
                                                        type: 'Polygon',
                                                        coordinates: poly
                                                    }
                                                  };

                                    polygons.push( polygon);
                                } catch (err) {
                                    console.log( err);
                                }

                                // Угодья
                                if (!opt.isEditor)
                                try {
                                    var lpi = get( pi[ o], 'LandParcelInfo');

                                    for (var r = 0; r < lpi.length; r++) 
                                    {                                    
                                        var lmi = get1( lpi[ r], 'MetricInfo');

                                        if (lmi) 
                                        {
                                            poly = [];
                                            prop = {};

                                            var landcode = get1( lpi[ r], 'LandCode');

                                            if (landcode) {
                                                prop[ "Код угіддя"] = nodeVal( landcode);
                                            }

                                            var area = get1( lmi, 'Area');

                                            if (area) {
                                                var s = nodeVal( get1( area, 'Size'));
                                                s += " " +nodeVal( get1( area, 'MeasurementUnit'));
                                                prop[ "Площа"] = s;
                                            }

                                            var len = get1( lmi, 'Perimeter');

                                            if (len) {
                                                prop[ "Периметр"] = nodeVal( len) +" м";
                                            }

                                            var externals = get( lpi[ r], 'Externals');

                                            for (var e = 0; e < externals.length; e++) {
                                                var boundary = get( externals[ e], 'Boundary');

                                                for (var b = 0; b < boundary.length; b++) {
                                                    var lines = get1( boundary[ b], 'Lines');
                                                    var coords = xmlCoords( lines, lands, points);
                                                    poly.push( coords);
                                                }

                                                var internals = get( externals[ e], 'Internals');

                                                for (var e = 0; e < internals.length; e++) {
                                                    var boundary = get( internals[ e], 'Boundary');

                                                    for (var b = 0; b < boundary.length; b++) {
                                                        var lines = get1( boundary[ b], 'Lines');
                                                        var coords = xmlCoords( lines, lands, points);
                                                        poly.push( coords);
                                                    }
                                                }
                                            }

                                            var polygon = { type: 'Feature',
                                                            properties: prop,
                                                            styles: {color:'Blue',weight:2,fillOpacity:0.3,fill:"false"},
                                                            geometry: {
                                                                type: 'Polygon',
                                                                coordinates: poly
                                                            }
                                                          };

                                            polygons.push( polygon);
                                        }
                                    }
                                } catch (err) {
                                    console.log( err);
                                }
                                
                                // Смежества
                                if (!opt.isEditor)
                                try {
                                    var au = get( pi[ o], 'AdjacentUnits');

                                    for (var u = 0; u < au.length; u++) 
                                    {                                    
                                        var aui = get( au[ u], 'AdjacentUnitInfo');
                                        
                                        for (var ui = 0; ui < aui.length; ui++) 
                                        {         
                                            var unit = aui[ ui]
                                                
                                            poly = [];
                                            prop = {};
                                            
                                            var boundary = get( unit, 'AdjacentBoundary');

                                            for (var b = 0; b < boundary.length; b++) {
                                                var lines = get1( boundary[ b], 'Lines');
                                                var coords = xmlCoords( lines, lands, points);
                                                poly.push( coords);
                                            }
                                            
                                            var cadn = get1( unit, 'CadastralNumber');

                                            if (cadn) {
                                                var s = nodeVal( cadn);
                                                prop[ "CadastralNumber"] = s;
                                            }          
                                            
                                            var users = get1( unit, 'Proprietor');
                                            
                                            if (users) {
                                                prop[ "XML"] = getXmlStr( users);
                                            }
                                            
                                            var polygon = { type: 'Feature',
                                                            properties: prop,
                                                            styles: {color:'Black',weight:1,fillOpacity:0.3},
                                                            geometry: {
                                                                type: 'LineString',
                                                                coordinates: poly[0]
                                                            }
                                                          };

                                            polygons.push( polygon);
                                        }
                                    }

                                } catch (err) {
                                    console.log( err);
                                }
                            }
                        }
                    }
                }
                
                return polygons;
            }

            function addVal( s, t, n)  {
                if (get1( t, n)) { 
                    var str = nodeVal( get1( t, n));
                    if (str.length > 0) {
                        if (s.length > 0) s += ", ";
                        s += str;
                    }
                };
                return s;
            }  

            function xmlCoords(lines, lands, points) 
            {
                var size = 500000, coords = [];
                var line = get( lines, 'Line');

                for (var l = 0; l < line.length; l++) 
                {
                    var ln = line[ l];

                    var ulid = get1( ln, 'ULID').textContent,
                        fp = get1( ln, 'FP') ? get1( ln, 'FP').textContent : 0,
                        tp = get1( ln, 'TP') ? get1( ln, 'TP').textContent : 0,
                        land = lands[ ulid];

                    if (fp != tp && fp == land[ land.length -1]) {
                        for (var j = land.length -1; j >= 0; j--) {
                            coords.push( [points[ land[j]].x, points[ land[j]].y]);
                        }
                    } else {
                        for (var j = 0; j < land.length; j++) {
                            coords.push( [points[ land[j]].x, points[ land[j]].y]);
                        }
                    }
                }
                
                if (proj4 && coords.length > 0) 
                {
                    var crc;
                    if (sc63.length > 0) crc = getSK63Zone( coords[ 0][1]);
                    if (sc42.length > 0) crc = getSK42Zone( coords[ 0][1]);

                    if (crc != undefined) {
                        for (var c in coords) {
                            if (coords[c][1] > size && coords[c][0] > size) {
                                var ll = proj4(crc, "+proj=longlat +ellps=WGS84 +datum=WGS84", [coords[c][1], coords[c][0]]);
                                coords[c][0] = ll[0];
                                coords[c][1] = ll[1];
                            }
                        }
                    }
                }
                
                return coords;
            }
            
            function getSK63Zone( x) 
            {
                var zone = 4, size = 500000, lon0 = 0, x0 = 0;

                if (x >= 1300000 -size && x < 1300000 +size) {zone = 1, lon0 = 23.5, x0 = 1300000};
                if (x >= 2300000 -size && x < 2300000 +size) {zone = 2, lon0 = 26.5, x0 = 2300000};
                if (x >= 3300000 -size && x < 3300000 +size) {zone = 3, lon0 = 29.5, x0 = 3300000};
                if (x >= 4300000 -size && x < 4300000 +size) {zone = 4, lon0 = 32.5, x0 = 4300000};
                if (x >= 5300000 -size && x < 5300000 +size) {zone = 5, lon0 = 35.5, x0 = 5300000};
                if (x >= 6300000 -size && x < 6300000 +size) {zone = 6, lon0 = 38.5, x0 = 6300000};
                if (x >= 7300000 -size && x < 7300000 +size) {zone = 7, lon0 = 41.5, x0 = 7300000};

                return "+proj=tmerc +ellps=krass +lon_0=" +lon0 +" +lat_0=0 +k=1 +x_0=" +x0 +" +y_0=-9214.69 +towgs84=23.92,-141.27,-80.9,0,0.35,0.82,-0.12 +units=m +no_defs";
            }
            
            function getSK42Zone( x) 
            {
                var zone = 6, size = 500000, lon0 = 0, x0 = 0;

                if (x >= 4500000 -size && x < 4500000 +size) {zone = 4, lon0 = 21, x0 = 4500000};
                if (x >= 5500000 -size && x < 5500000 +size) {zone = 5, lon0 = 27, x0 = 5500000};
                if (x >= 6500000 -size && x < 6500000 +size) {zone = 6, lon0 = 33, x0 = 6500000};
                if (x >= 7500000 -size && x < 7500000 +size) {zone = 7, lon0 = 39, x0 = 7500000};

                return "+proj=tmerc +ellps=krass +lon_0=" +lon0 +" +lat_0=0 +k=1 +x_0=" +x0 +" +y_0=0 +towgs84=23.92,-141.27,-80.9,0,0.35,0.82,-0.12 +units=m +no_defs";
            }
        },
        kml: function(doc) {
            var gj = fc(),
                // styleindex keeps track of hashed styles in order to match features
                styleIndex = {},
                // atomic geospatial types supported by KML - MultiGeometry is
                // handled separately
                geotypes = ['Polygon', 'LineString', 'Point', 'Track', 'gx:Track'],
                // all root placemarks in the file
                placemarks = get(doc, 'Placemark'),
                styles = get(doc, 'Style'),
                folders = get(doc, 'Folder'),
                names = get(doc, 'name'),
                descriptions = get(doc, 'description'),
                uid;

            if (!uid && names && names.length > 0) 
            {
                var s = names[0].textContent.split(" ");
                if (s.length > 0) {
                    uid = s[ s.length -1];
                } else {
                    uid = names[0].textContent;
                }
            }
            /*
            if (!uid && descriptions && descriptions.length > 0) 
            {
                var s = descriptions[0].textContent.split("/");
                if (s.length > 0) {
                    uid = s[ s.length -1];
                }
            }
            */
            if (!uid && folders && folders.length > 0) 
            {
                var f = folders[0];
                if (get1(f, 'name')) {
                    uid = nodeVal( get1(f, 'name'));
                }
            }

            for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + attr(styles[k], 'id')] = styles[k]; //okhash(xml2str(styles[k])).toString(16);
                //gj.styles = gj.styles.concat(styles[k]);
                //gj.styles[ styles[k].id] = styles[k];
            }
            
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j], uid));
            }
            
            function kmlColor(v) {
                var color, opacity;
                v = v || "";
                if (v.substr(0, 1) === "#") v = v.substr(1);
                if (v.length === 6 || v.length === 3) color = v;
                if (v.length === 8) {
                    opacity = parseInt(v.substr(0, 2), 16) / 255;
                    color = v.substr(2);
                }
                
                if (color.length == 6) {
                    color = "#" +color.substr(4, 2) +color.substr(2, 2) +color.substr(0, 2);
                }
                
                return [color, isNaN(opacity) ? undefined : opacity];
            }
            function gxCoord(v) { return numarray(v.split(' ')); }
            function gxCoords(root) {
                var elems = get(root, 'coord', 'gx'), coords = [];
                if (elems.length === 0) elems = get(root, 'gx:coord');
                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                return coords;
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                if (get1(root, 'MultiTrack')) return getGeometry(get1(root, 'MultiTrack'));
                if (get1(root, 'gx:MultiTrack')) return getGeometry(get1(root, 'gx:MultiTrack'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({
                                    type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'),
                                    coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({
                                    type: 'Polygon',
                                    coordinates: coords
                                });
                            } else if (geotypes[i] == 'Track' ||
                                geotypes[i] == 'gx:Track') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: gxCoords(geomNode)
                                });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root, uid) {
                var geoms = getGeometry(root), i, properties = {}, styles = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    description = nodeVal(get1(root, 'description')),
                    timeSpan = get1(root, 'TimeSpan'),
                    extendedData = get1(root, 'ExtendedData'),
                    lineStyle = get1(root, 'LineStyle'),
                    polyStyle = get1(root, 'PolyStyle');
                    
                    if (description.indexOf( "<table") == -1 && description.indexOf( "<br") == -1)
                        description = description.replace(/(\r\n|\n|\r)/gm, "<br>");

                if (!geoms.length) return [];
                if (name) properties.name = name;
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    //properties.styleHash = styleIndex[styleUrl];
                    var style = styleIndex[styleUrl];
                    lineStyle = get1(style, 'LineStyle'),
                    polyStyle = get1(style, 'PolyStyle');
                }
                if (description) properties.description = description;
                if (timeSpan) {
                    var begin = nodeVal(get1(timeSpan, 'begin'));
                    var end = nodeVal(get1(timeSpan, 'end'));
                    properties.timespan = { begin: begin, end: end };
                }
                if (uid) properties.uid = uid;
                if (lineStyle) {
                    var c = get1(lineStyle, 'color');
                    var linestyles = c ? kmlColor(nodeVal(get1(lineStyle, 'color'))) : undefined,
                        color = linestyles ? linestyles[0] : undefined,
                        opacity = linestyles ? linestyles[1] : undefined,
                        width = parseFloat(nodeVal(get1(lineStyle, 'width')));
                    
                    if (color) styles.color = color;
                    if (!isNaN(opacity)) styles['opacity'] = opacity;
                    if (!isNaN(width)) styles['weight'] = width;
                    //stroke, Boolean, true 
                }
                if (polyStyle) {
                    var c = get1(polyStyle, 'color');
                    var polystyles = c ? kmlColor(nodeVal(get1(polyStyle, 'color'))) : undefined,
                        pcolor = polystyles ? polystyles[0] : undefined,
                        popacity = polystyles ? polystyles[1] : undefined,
                        fill = nodeVal(get1(polyStyle, 'fill')),
                        outline = nodeVal(get1(polyStyle, 'outline'));

                    if (pcolor) styles.fillColor = pcolor;
                    if (!isNaN(popacity)) styles['fillOpacity'] = popacity; 
                    else if (fill) styles['fillOpacity'] = fill === "1" ? 1 : 0;
                    if (outline && !styles['opacity']) styles['opacity'] = outline === "1" ? 1 : 0;
                    //fill, Boolean
                }
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');

                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                }
                return [{
                    type: 'Feature',
                    geometry: (geoms.length === 1) ? geoms[0] : {
                        type: 'GeometryCollection',
                        geometries: geoms
                    },
                    properties: properties,
                    styles: styles
                }];
            }
            return gj;
        },
        gpx: function(doc) {
            var i,
                tracks = get(doc, 'trk'),
                routes = get(doc, 'rte'),
                waypoints = get(doc, 'wpt'),
                polylines = get(doc, 'polyline'),
                // a feature collection
                gj = fc(),
                feature;
            for (i = 0; i < tracks.length; i++) {
                feature = getTrack(tracks[i]);
                if (feature) gj.features.push(feature);
            }
            for (i = 0; i < routes.length; i++) {
                feature = getRoute(routes[i]);
                if (feature) gj.features.push(feature);
            }
            for (i = 0; i < waypoints.length; i++) {
                gj.features.push(getPoint(waypoints[i]));
            }
            for (i = 0; i < polylines.length; i++) {
                feature = getPolyline(polylines[i]);
                if (feature) gj.features.push(feature);
            }
            function getPoints(node, pointname) {
                var pts = get(node, pointname), line = [],
                    l = pts.length;
                if (l < 2) return;  // Invalid line in GeoJSON
                for (var i = 0; i < l; i++) {
                    line.push(coordPair(pts[i]));
                }
                return line;
            }
            function getPolyline(node) {
                var segments = get(node, 'points'), track = [], line;
                for (var i = 0; i < segments.length; i++) {
                    line = getPoints(segments[i], 'pt');
                    if (line) track.push(line);
                }
                if (track.length === 0) return;
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: track.length === 1 ? 'LineString' : 'MultiLineString',
                        coordinates: track.length === 1 ? track[0] : track
                    }
                };
            }
            function getTrack(node) {
                var segments = get(node, 'trkseg'), track = [], line;
                for (var i = 0; i < segments.length; i++) {
                    line = getPoints(segments[i], 'trkpt');
                    if (line) track.push(line);
                }
                if (track.length === 0) return;
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: track.length === 1 ? 'LineString' : 'MultiLineString',
                        coordinates: track.length === 1 ? track[0] : track
                    }
                };
            }
            function getRoute(node) {
                var line = getPoints(node, 'rtept');
                if (!line) return;
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: 'LineString',
                        coordinates: line
                    }
                };
            }
            function getPoint(node) {
                var prop = getProperties(node);
                prop.sym = nodeVal(get1(node, 'sym'));
                return {
                    type: 'Feature',
                    properties: prop,
                    geometry: {
                        type: 'Point',
                        coordinates: coordPair(node)
                    }
                };
            }
            function getProperties(node) {
                var meta = ['name', 'desc', 'author', 'copyright', 'link',
                            'time', 'keywords'],
                    prop = {},
                    k;
                for (k = 0; k < meta.length; k++) {
                    prop[meta[k]] = nodeVal(get1(node, meta[k]));
                }
                return clean(prop);
            }
            return gj;
        }
    };
    return t;
})();

if (typeof module !== 'undefined') module.exports = toGeoJSON;