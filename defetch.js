// can remove if using in browser
if(typeof window === 'undefined') {
  fetch=require('node-fetch');
  // FIXME: include Ramda!
  // FIXME: include RxJs!
}

// test call
var config = {
      nodes:['http://127.0.0.1:8080','https://wallet1.internetofcoins.org'],
      routes:{ ballots:{} }
    }
var input = 'hybridd://api/asset/btc/fee';  // just a test fee call for now
var init = { method:'GET' };

// log what happens
console.log(defetch(input,init,config));

function response(body) {
 console.log(body);
}

// defetch function
function defetch(input,init,config) {
  if(input.substr(0,10)==='hybridd://') {
    var node = config.nodes[0]; // TODO: decentralize/mixer
    var path = input.substr(9);
    console.log(node+path);
    
    return new Promise((resolve, reject) => {
      var options = {
              "host": node.split(':')[0]+':'+node.split(':')[1],
              "port": node.split(':')[2],
              path
            };
      // FIXME: this quick and dirty http testcall must be done using hybriddcall!
      var req = require('http').get(options, function (response) {
          if (typeof response.error === 'undefined' || response.error) {
            reject(response.data?response.data:'Bad server reply!');
          } else {
            resolve(response);
          }
      });
      req.on("error", function (err) {
        reject(err);
      });
    });

  }
}

    

/*
  return new Promise((resolve, reject) => {
    if (init.method === 'GET') {
      
    window.setTimeout(

    () => {
            resolve(
                if (data === VaasDefetchConfig.routes.votes.show) {
                new Response(JSON.stringify(data), {status: 200})
            );
            if (input === VaasDefetchConfig.routes.votes.show) {
                resolve(
                    new Response(JSON.stringify(voteDemo), {status: 200})
                );
            }
            reject(new Error('Unknown GET route'));
        } else if (init.method === 'PUT') {
            if (input === VaasDefetchConfig.routes.ballots.new) {
                resolve(
                    new Response(JSON.stringify(ballotDemo), {status: 200})
                );
            }
            if (input === VaasDefetchConfig.routes.votes.new) {
                resolve(
                    new Response(JSON.stringify(voteDemo), {status: 200})
                );
            }
            reject(new Error('Unknown PUT route'));
        } else {
            reject(new Error('Use a correct method'));
        }
    }
    
    ,
    200);
*/
