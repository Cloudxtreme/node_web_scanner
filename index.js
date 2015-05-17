// foreach random.ipaddress
// -- hostname
// -- ping
// -- portscan ports: 80,21,23,22,81,8080




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