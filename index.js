console.log('loading...');

var random = require('node-random');
var mongo = require('mongodb').MongoClient, assert = require('assert');
var spawn = require('child_process').spawn;
var http = require('http');

console.log('loaded modules');

data_queue = [];
active = 0;

counter = 0;
//app_start();

setInterval(function(){
    console.log(counter + ' completed per minute');
    counter = 0;
}, 60000);

/*
 *
 *      Performance results for app_start (active < X)
 *
     *  100 : 212 pm
     *  1   : 56 pm
     *  2   : 99 pm
     *  3   : 140 pm
     *  4   : 185 pm
     *  5   : 196 pm  
     *
     *
     *  
     */


setInterval(app_start, 25);

function app_start(){
    if (active < 5) {
        //console.log('app_start');
        ++active;
        go('db');
    }    
    /*for (active=0; active<10; ++active){
        go('db');
    }*/
}

function go(db){            
    get_random_ip(do_hostname);
}

function get_random_ip(callback) {
   // console.log('get_random_ip');
    var seg1 = Math.floor( Math.random() * ( 1 + 255 - 1 ) ) + 1;
    var seg2 = Math.floor( Math.random() * ( 1 + 255 - 1 ) ) + 1;
    var seg3 = Math.floor( Math.random() * ( 1 + 255 - 1 ) ) + 1;
    var seg4 = Math.floor( Math.random() * ( 1 + 255 - 1 ) ) + 1;
    
    ip = seg1 + '.' + seg2 + '.' + seg3 + '.' + seg4;
    data_queue[ip] = {
        'ip': ip,
        'alive': false,
        'hostname': 'unknown',
        'jobs': {
            'ping': false,
            'hostname': false
        }
    }
    callback(ip, do_ping);
}

function do_hostname(ip, callback) {
    //console.log('do_hostname');

    callback(ip, store);
    
    var cmd = 'host';
    var child = spawn(cmd, [ip]);
    
    child.stdout.on('data', function(stdout){        
        stdout = String(stdout);        
        if (!stdout.match(/not found/)) {
            data_queue[ip].hostname = stdout.split(' ')[4].replace('.\n','').replace('\n','');            
        }
    });
    
    child.on('close', function(){
        data_queue[ip].jobs['hostname'] = true;
        //console.log("Setting hostname to complete (" + ip + ")");
    })
    
    child.stderr.on('data', function(stderr){
       
    });
    
    child.on('error', function(e){
       // data_queue[ip].jobs['hostname'] = true;
       // console.log("Setting hostname to complete (" + ip + ")");
    });
}

function do_ping(ip, callback) {
    //console.log('do_ping');
    callback(ip);
    
    var cmd = 'ping'; // + data.ip;           
    var child = spawn(cmd, ['-c','1','-w', '1', ip]);
    
    child.stdout.on('data', function(stdout){        
        stdout = String(stdout);        
        if (stdout.match(/bytes from/)) {            
            data_queue[ip].alive = true;                        
        }                
    });
    
    child.stderr.on('data', function(stderr){
     //  callback(data);
    });
    
    child.on('error', function(e){
      // callback(data);
    });
    
    child.on('close', function(){
       //console.log('closed');
       data_queue[ip].jobs['ping'] = true;
     //  console.log("Setting ping to complete (" + ip + ")");
    });
}

function store(ip){
    
    var store_interval;
    
    if ( (data_queue[ip].jobs['ping'] == true) && (data_queue[ip].jobs['hostname'] == true) ){
     //   console.log(data_queue[ip]);
        ++counter;
    }
    else {
            store_interval = setInterval(function(){
                if ( (data_queue[ip].jobs['ping'] == true) && (data_queue[ip].jobs['hostname'] == true) ){
                    clearInterval(store_interval);
                   // console.log(data_queue[ip]);
                    ++counter;
                    --active;                
                }
        }, 50);
    }
}

// Converted from: http://stackoverflow.com/questions/13818064/check-if-an-ip-address-is-private
function ip_is_private (ip) {    
    var pri_addrs = [
        '10.0.0.0|10.255.255.255',      // single class A network
        '172.16.0.0|172.31.255.255',    // 16 contiguous class B network
        '192.168.0.0|192.168.255.255',  // 256 contiguous class C network
        '169.254.0.0|169.254.255.255',  // Link-local address also refered to as Automatic Private IP Addressing
        '127.0.0.0|127.255.255.255'     // localhost
    ];
        
    var long_ip = ip2long(ip);
    if (long_ip != -1) {        
        for (var i=0; i<pri_addrs.length; ++i) {
            var start_end = pri_addrs[i].split("|");
            if (long_ip >= ip2long(start_end[0]) && long_ip <= ip2long(start_end[1])) {
                return true;
            }            
        }
    }

    return false;
}

// http://phpjs.org/functions/ip2long/
function ip2long(IP) {
  var i = 0;
  // PHP allows decimal, octal, and hexadecimal IP components.
  // PHP allows between 1 (e.g. 127) to 4 (e.g 127.0.0.1) components.
  IP = IP.match(
    /^([1-9]\d*|0[0-7]*|0x[\da-f]+)(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?$/i
  ); // Verify IP format.
  if (!IP) {
    return false; // Invalid format.
  }
  // Reuse IP variable for component counter.
  IP[0] = 0;
  for (i = 1; i < 5; i += 1) {
    IP[0] += !! ((IP[i] || '')
      .length);
    IP[i] = parseInt(IP[i]) || 0;
  }
  // Continue to use IP for overflow values.
  // PHP does not allow any component to overflow.
  IP.push(256, 256, 256, 256);
  // Recalculate overflow of last component supplied to make up for missing components.
  IP[4 + IP[0]] *= Math.pow(256, 4 - IP[0]);
  if (IP[1] >= IP[5] || IP[2] >= IP[6] || IP[3] >= IP[7] || IP[4] >= IP[8]) {
    return false;
  }
  return IP[1] * (IP[0] === 1 || 16777216) + IP[2] * (IP[0] <= 2 || 65536) + IP[3] * (IP[0] <= 3 || 256) + IP[4] * 1;
}