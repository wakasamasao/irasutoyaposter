var sphero = require("sphero");
var orb = sphero("COM7");

orb.connect(function() {
  // roll orb in a random direction, changing direction every second
  setInterval(function() {
    var direction = Math.floor(Math.random() * 360);
    direction=0;
    orb.roll(150, direction);
  }, 1000);
});
