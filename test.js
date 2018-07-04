function go(){
  function init(callback){


    var assetDetails = {"fee":"0.00100000","factor":"8","contract":"undefined","symbol":"waves","name":"Waves","mode":"waves","unified-symbols":"undefined","fee-symbol":"waves","keygen-base":"waves","generated":"never"};

    //{"fee":"0.00002500","factor":"8","contract":"Not yet implemented!","symbol":"btc","name":"Bitcoin","mode":"bitcoinjslib.bitcoin","unified-symbols":"undefined","fee-symbol":"btc","keygen-base":"btc","generated":"never"};

    ioc.login("POMEW4B5XACN3ZCX","TVZS7LODA5CSGP6U");

    var query = 's/deterministic/code/'+assetDetails.mode.split(".")[0];

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = e => {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var responseObject = JSON.parse(xhr.responseText);//JSON.parse
        if(responseObject.hasOwnProperty("id") && responseObject.id === "id"){
          setTimeout(function(){
            xhr.open('GET', "http://localhost:1111/p/"+responseObject.data, true);
            xhr.send();
          },1000);
        }else{

          ioc.initAsset(assetDetails,responseObject.data);
          console.log(ioc.getAddress(assetDetails.symbol));
        }
      }
    }

    xhr.open('GET', "http://localhost:1111/"+query, true);
    xhr.send();

  }

  var ioc = new IoC();

  ioc.init(init);
}
