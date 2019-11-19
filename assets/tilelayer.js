(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.cartoTileLayer = factory());
}(this, function () { 'use strict';

    var MapsApi = /** @class */ (function () {
        function MapsApi(apiKey, username) {
            this._apiKey = apiKey;
            this._username = username;
        }
        Object.defineProperty(MapsApi.prototype, "apiKey", {
            get: function () {
                return this._apiKey;
            },
            set: function (value) {
                this._apiKey = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MapsApi.prototype, "username", {
            get: function () {
                return this._username;
            },
            set: function (value) {
                this._username = value;
            },
            enumerable: true,
            configurable: true
        });
        MapsApi.prototype.instantiateMap = function (options) {
            var _this = this;
            var sql = options.sql, dataset = options.dataset;
            if (sql === undefined && dataset === undefined) {
                throw new Error('Please provide a dataset or a SQL query');
            }
            var mapParameters = {
                layers: [{
                        type: 'cartodb',
                        options: {
                            sql: sql || "select * from " + dataset
                        }
                    }],
                version: '1.3.1'
            };
            var requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mapParameters)
            };
            return fetch("https://" + this._username + ".carto.com/api/v1/map?api_key=" + this._apiKey, requestOptions)
                .then(function (response) { return response.json(); })
                .then(function (data) { return "https://" + _this._username + ".carto.com/api/v1/map/" + data.layergroupid + "/{z}/{x}/{y}.mvt?api_key=" + _this._apiKey; });
        };
        return MapsApi;
    }());

    class CartoTileLayer {
      constructor(options = {}) {
        const { mapOptions, deckInstance } = options;

        this.deck = window.deck || deckInstance;
        this.mapsApi = new MapsApi(mapOptions.apiKey, mapOptions.username);

        this.map = this.mapsApi.instantiateMap(mapOptions);
      }

      async createTileLayer(props = {}) {
        const { layerType, ...styleProps } = props;
        const deckLayer = layerType || this.deck.GeoJsonLayer;

        const urlTemplate = await this.map;

        return new deck.MVTTileLayer({
          ...styleProps,
          getLineColor: [192, 0, 0],
          getFillColor: [200, 120, 80],
          lineWidthMinPixels: 1,
          pointRadiusMinPixels: 5,
          urlTemplate,
          uniquePropertyName: 'cartodb_id',
          renderSubLayers: (props) => {
            return new deckLayer({
              ...props
            });
          }
        });
      }
    }

    return CartoTileLayer;

}));
