var DJB2 = (function() {
	var DJB2 = {	
    hash : function (str) {
        var hash = 0, i, char;
        if (str == 0) return hash;
        for (i = 0, l = str.length; i < l; i++) {
            char  = str.charCodeAt(i);
            hash  = ((hash<<5)-hash)+char;
            hash |= 0; // Convert to 32bit integer
        }

      hash &= 0xFFFFFFFF;
      var hex = hash.toString(16).toUpperCase();
      return ("00000000" + hex).slice(-8).replace("-","0");
    }
  }

  return DJB2;

})();

if (typeof define === 'function' && define.amd) {
  define(function () { return DJB2; });
} else if( typeof module !== 'undefined' && module != null ) {
  module.exports = DJB2;
} else if( typeof angular !== 'undefined' && angular != null ) {
  angular.module('DJB2', [])
  .factory('DJB2', function () {
    return DJB2;
  });
}
