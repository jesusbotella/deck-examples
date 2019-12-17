(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.cartoTileLayer = factory());
}(this, function () { 'use strict';

    var MapsApi = /** @class */ (function () {
        function MapsApi(apiKey, username, serverURL) {
            this._apiKey = apiKey;
            this._username = username;
            this._serverURL = serverURL;
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
            var sql = options.sql, dataset = options.dataset;
            if (sql === undefined && dataset === undefined) {
                throw new Error('Please provide a dataset or a SQL query');
            }
            var mapParameters = {
                buffersize: { mvt: 1 },
                layers: [{
                        type: 'cartodb',
                        options: Object.assign({}, options, {
                            sql: sql || "select * from " + dataset
                        })
                    }],
                version: '1.3.1'
            };
            var requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mapParameters)
            };
            var serverURL = this._serverURL || ('https://' + this._username + '.carto.com');
            return fetch(serverURL + "/api/v1/map?api_key=" + this._apiKey, requestOptions)
                .then(function (response) { return response.json(); })
                .then(function (data) {
                var urlData = data.metadata.url.vector;
                return urlData.subdomains.map(function (subdomain) { return urlData.urlTemplate.replace('{s}', subdomain); });
            });
        };
        return MapsApi;
    }());

    class CartoTileLayer {
      constructor(options = {}) {
        const { mapOptions, deckInstance } = options;

        this.deck = window.deck || deckInstance;
        this.mapsApi = new MapsApi(mapOptions.apiKey, mapOptions.username, mapOptions.serverURL);

        const mapInstantiationOptions = Object.assign({}, mapOptions, {
          vector_extent: 2048,
          vector_simplify_extent: 2048
        });

        this.map = this.mapsApi.instantiateMap(mapInstantiationOptions);
      }

      async createTileLayer(props = {}) {
        const layerType = props.layerType;
        const styleProps = Object.assign({}, props, { layerType: undefined });

        const deckLayer = layerType || this.deck.GeoJsonLayer;

        const urlTemplates = await this.map;

        return new deck.MVTTileLayer(
          Object.assign({}, styleProps, {
          getLineColor: [192, 0, 0],
          getFillColor: [200, 120, 80],
          lineWidthMinPixels: 1,
          pointRadiusMinPixels: 5,
          urlTemplates,
          uniquePropertyName: 'cartodb_id',
          // renderSubLayers: (props) => {
          //   return new deckLayer({
          //     ...props
          //   });
          // }
          })
        );
      }
    }

    return CartoTileLayer;

}));
