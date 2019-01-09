L.Control.SlideMenu = L.Control.extend({
    options: {
        layers : [],
        name : "Name",
        title : "Menu",
        open : "Open",
        position: 'topleft',
        width: '300px',
        height: '100%',
        delay: '10'
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this._startPosition = -(parseInt(this.options.width, 10));
        this._isLeftPosition = false; //this.options.position == 'topleft' || this.options.position == 'buttomleft' ? true : false;
    },

    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-slidemenu leaflet-bar leaflet-control');
        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-bar-slidemenu', this._container);
        link.title = this.options.title;
        L.DomUtil.create('span', '', link);

        this._menu = L.DomUtil.create('div', 'leaflet-menu', document.getElementsByClassName('leaflet-container')[0]);    
        this._menu.style.width = this.options.width;
        this._menu.style.height = this.options.height;
        this._menu.style.paddingLeft = 0; 
        this._menu.style.paddingRight = 0;
        this._menu.style.display = 'none';

        var closeButton = L.DomUtil.create('button', 'leaflet-menu-close-button', this._menu);
        closeButton.innerHTML = 'x';

        if (this._isLeftPosition) {
            this._menu.style.left = '-' + this.options.width;
            closeButton.style.float = 'right';
            //L.DomUtil.addClass(closeButton, 'fa-chevron-left');
        }
        else {
            this._menu.style.right = '-' + this.options.width;
            closeButton.style.float = 'left';
            //L.DomUtil.addClass(closeButton, 'fa-chevron-right');
        }

        this._contents = L.DomUtil.create('div', 'leaflet-menu-contents', this._menu);
        //this._contents.innerHTML = this._innerHTML;
        this._contents.innerHTML = this.options.text;
        this._contents.style.clear = 'both';

        // Make sure we don't drag the map when we interact with the content
        var stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(this._menu, 'contextmenu', stop)
            .on(this._menu, 'click', stop)
            .on(this._menu, 'mousedown', stop)
            .on(this._menu, 'touchstart', stop)
            .on(this._menu, 'dblclick', stop)
            .on(this._menu, 'mousewheel', stop)
            .on(this._menu, 'MozMousePixelScroll', stop);

        //L.DomEvent.disableClickPropagation(this._menu);
        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', function() {
                // Open
                if (this._menu.style.display == 'none')
                    this.show();
                else 
                    this.hide();
            }, this)
            .on(closeButton, 'click', L.DomEvent.stopPropagation)
            .on(closeButton, 'click', function() {
                // Close
                this.hide();
            }, this);
            
        return this._container;
    },

    setContents: function(innerHTML) {
        this._innerHTML = innerHTML;
        this._contents.innerHTML = this._innerHTML;
    },

    _animate: function(menu, from, to, isOpen) {

        if(isOpen ? from > to : from < to) {
            return;
        }

        if (this._isLeftPosition) {
            menu.style.left = from + "px";
        }
        else {
            menu.style.right = from + "px";
        }

        setTimeout(function(slideMenu) {
            var value = isOpen ? from + 10 : from - 10;
            slideMenu._animate(slideMenu._menu, value, to, isOpen);
        }, this.options.delay, this);
    },
    
    press: function (e) {
        var esc = 27;       
        if (e.keyCode === esc) {
            this.hide();
        }
    },
    
    show: function (e) {
        if (this._menu.style.display != 'block') {
            this._animate(this._menu, this._startPosition, 0, true);
            this._menu.style.display = 'block';
        }
    },
    
    hide: function (e) {
        if (this._menu.style.display != 'none') {
            this._animate(this._menu, 0, this._startPosition, false);
            this._menu.style.display = 'none';
        }
    }  
});

L.control.slideMenu = function(options) {
    return new L.Control.SlideMenu(options);
}