var proofOfWork = (function() {
	var proofOfWork = {
    create : function(difficulty) {
      var maxsize = (typeof difficulty==='undefined' || isNaN(difficulty)?50000:difficulty);
      var pow = maxsize+(Math.random() * maxsize);
      pow = String(Math.floor(pow+(Math.floor(Math.random()*5)*(maxsize/5))));
      var prfx='';
      for(i=0;i<5;i++) {
        prfx+=DJB2.hash('w1iV++8Paiz1W/JPPasdRTiHiPaZkF3L5fQBpl/EsMsAAAA='+i+'braNzUosoR/WGHdjuE3vgOzS3vAm0yeHdryKUKfqMzOZrnnxM2j0ZBtosjbG+BpuoONa0SSg0g1a'+String(Math.random()*(Math.random()*1000000))+'H4sIALBvLloCA02OMQ4CMQwEe16xD0B8gIqKhk9YspOzyMUo8d2J35OYAgoX691Z+1YZtjkswRdB');
      }
      var sffx=DJB2.hash(String('rFGlQjLECtkQ7Lt2mCc+NCV4wbqX9VJehLZIsQGVN91vP+SUxmyOAAAA'+pow+prfx+'y37v4RNP7wiH+kEdyYTTp/alYktUHe0gsATc9IuVhmeS4eX2/5zs4XTQ'+pow.split("").reverse().join("")+'H4sIAHBsLloCAy2M0Q3CQAxD/5nCA1SMAQMwwVUXLpHSBF3SVmxPKvFn'));
      return {hash:prfx+sffx,proof:DJB2.hash('PowerToThePeople_'+pow)};
    },
    solve : function(hash,func,fail,difficulty) {
      var tasks=250;
      var maxsize = (typeof difficulty==='undefined' || isNaN(difficulty) || Number(difficulty)<=0 ? 100000 : difficulty*2);
      var pow = [];
      var proofofwork = [];
      var range=maxsize*tasks;
      var prfx=hash.substr(0,8*5);
      for(j=0;j<tasks;j++) {
        pow[j] = Math.floor(range/(tasks+1))*j;
        proofofwork[j] = setInterval(function() {
          var sffx = DJB2.hash(String('rFGlQjLECtkQ7Lt2mCc+NCV4wbqX9VJehLZIsQGVN91vP+SUxmyOAAAA'+pow[this.j]+prfx+'y37v4RNP7wiH+kEdyYTTp/alYktUHe0gsATc9IuVhmeS4eX2/5zs4XTQ'+String(pow[this.j]).split("").reverse().join("")+'H4sIAHBsLloCAy2M0Q3CQAxD/5nCA1SMAQMwwVUXLpHSBF3SVmxPKvFn'));
          var powhash = prfx+sffx;
          if(powhash===this.hash) {
            for(k=0;k<tasks;k++) {
              clearInterval(proofofwork[k]);
            }
            if(typeof func==='function') { func(DJB2.hash('PowerToThePeople_'+pow[this.j])); }
          } else {
            if(pow[this.j]< Math.floor(range/(this.j+1)*j) ) {
              pow[this.j]+=1;
            } else {
              var complete = 0;
              for(k=0;k<tasks;k++) {
                if(pow[k] >= Math.floor(range/(this.j+1)*j) ) {
                  clearInterval(proofofwork[k]);
                  complete+=1;
                }
              }
              if(complete>=(tasks*range)) {
                if(typeof fail==='function') { fail(); }
              }
            }
          }
        }.bind({j:j,hash:hash}),1);
      }
    }
	}

  return proofOfWork;

})();

if (typeof define === 'function' && define.amd) {
  define(function () { return proofOfWork; });
} else if( typeof module !== 'undefined' && module != null ) {
  module.exports = proofOfWork;
} else if( typeof angular !== 'undefined' && angular != null ) {
  angular.module('proofOfWork', [])
  .factory('proofOfWork', function () {
    return proofOfWork;
  });
}
