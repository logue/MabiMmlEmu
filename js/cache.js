(function (definition) {
    // CommonJS
    if (typeof exports === "object") {
        module.exports = definition();

        // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

        // <script>
    } else {
        CacheHandler = definition();
    }
})(function () {
    /**
     * コンストラクタです。
     * @constructor
     */
    var CacheHandler = function () { }
    /**
     * HTML5 localStorage からキーに対応するデータを取得します。
     * @param storageKey キー
     * @returns {*} JSON
     */
    CacheHandler.prototype.getCache = function (storageKey) {
        return angular.fromJson(sessionStorage.getItem(storageKey));
    };

    /**
     * HTML5 localStorage にデータを格納します。
     * @param storageKey キー
     * @param data JSON
     */
    CacheHandler.prototype.setCache = function (storageKey, data) {
        sessionStorage.setItem(storageKey, angular.toJson(data));
    };

    /**
     * HTML5 localStorage のデータを削除します。
     * @param storageKey キー
     */
    CacheHandler.prototype.removeCache = function (storageKey) {
        sessionStorage.removeItem(storageKey);
    };
    // Export the class into the global namespace or for CommonJs
    return CacheHandler;
});