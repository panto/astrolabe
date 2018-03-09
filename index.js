var cPos = {
  sun: [[138, 29, 9]],
  mon: [[198, 20, 47]],
  mer: [[153, 0.1]],
  ven: [[118, 55.8], true],
  mar: [[159, 55.5]],
  jup: [[263, 35.8], true],
  sat: [[102, 35.3]]
};
var nPos = {
  sun: [[139, 29, 29]],
  mon: [[210, 44, 30]],
  mer: [[154, 29.1]],
  ven: [[118, 37.7], true],
  mar: [[160, 39.4]],
  jup: [[263, 34.3], true],
  sat: [[102, 41.8]]
};
//var ascArr = [
//[0,[
//0,55,110,165,220,275,330,386,441,496,551,607,662,718,773
//]]
//]
Date.prototype.stdTimezoneOffset = function () {
  var jan = new Date(this.getFullYear(), 0, 1);
  var jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};
Date.prototype.dst = function () {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
};
// create current time
var lat = 0;//42.36;
var lon = 0;//-71.1;
function setLatLon(pos) {
  lat = pos.coords.latitude;
  lon = pos.coords.longitude;
}

function handleErr(err) {
  alert(err.code);
}

navigator.geolocation.getCurrentPosition(setLatLon, handleErr);

function calcAsc() {
  var curT = new Date();
  var curSec = (curT.getHours() * 3600) + (curT.getMinutes() * 60) + curT.getSeconds();
  var gmtSec = curSec + (curT.stdTimezoneOffset() * 60);
  var locSec = gmtSec + (Math.round(lon) * 4 * 60);
  //now calc star time using local time and longitude
  // yesterday's sidereal time 3:16.12
  // today's sidereal time 3:20.8
  var sidT1 = (((3 * 60) + 20) * 60) + 8;
  // Add 10 sec for every 15 deg lon west (sub east)
  var sidT2 = sidT1 + Math.round((-lon / 15) * 10);
  // Add Local Time
  var sidT3 = sidT2 + locSec;
  // Add 10 seconds for ever hour of local time
  var sidT = sidT3 + Math.round(((locSec / 60) / 60) * 10);
  // Subtract 24 hours for true local sidereal time, if needed
  if (sidT > (24 * 60 * 60)) sidT -= (24 * 60 * 60);
  // Get degrees to rotate,(assuming equator, even houses)
  var curDeg = (sidT / 60) / 4;
  var degs = {
    sid: curDeg
  };
  var planets = ['sun', 'mon', 'mer', 'ven', 'mar', 'jup', 'sat'];
  for (var y = 0; y < planets.length; y++) {
    var s1 = (((cPos[planets[y]][0][0] * 60) + cPos[planets[y]][0][1]) * 60);
    if (cPos[planets[y]][0][2]) s1 += cPos[planets[y]][0][2];
    var s2 = (((nPos[planets[y]][0][0] * 60) + nPos[planets[y]][0][1]) * 60);
    if (nPos[planets[y]][0][2]) s2 += nPos[planets[y]][0][2];
    var f = ((gmtSec / 60) / 60) / 24;
    var d = s2 - s1; //Add logic to reverse this if retrograde
    var p = d * f;
    var s = s1 + p;
    degs[planets[y]] = (s / 60) / 60;
  }
  return degs;
}

// Here's the rendering stuff
function loadSprites(imgs, callback) {
  function loadNext(arr) {
    if (arr.length) {
      var i = arr.pop();
      var img = new Image();
      img.onload = function () {
        sprites[i[0]] = [this, i[2], i[3]];
        loadNext(arr);
      };
      img.onerror = function () {
        loadNext(arr)
      };
      img.src = i[1];
    } else {
      callback();
    }
  }

  var x,
    arr = [];
  for (x in imgs) {
    var i = imgs[x];
    arr.push([x, i[0], i[1], i[2]]);
  }
  loadNext(arr);
}

function toRads(deg) {
  return (Math.PI / 180) * deg
}

function radLine(a, p1, p2, deg) {
  var theta = toRads(deg);
  var x = Math.sin(theta);
  var y = Math.cos(theta);
  a.beginPath();
  a.moveTo(250 + (p1 * x), 250 + (p1 * y));
  a.lineTo(250 + (p2 * x), 250 + (p2 * y));
  a.closePath();
  a.stroke();
}

function makeCirc(a, x, y, rad) {
  a.beginPath();
  a.arc(x, y, rad, 0, toRads(360));
  a.stroke();
}

function makeDegs(a, o) {
  for (var d = 0; d < 360; d++) {

    if (d % 30 === 0) {
      radLine(a, 200, 250, d + o);
    } else if (d % 5 === 0) {
      radLine(a, 200, 212.5, d + o);
    } else {
      radLine(a, 200, 206.25, d + o);
    }
  }
}

function makeHouses(a) {
  for (var d = 0; d < 360; d += 30) {
    radLine(a, 100, 200, d);
  }
}

function drawImg(a, img, pdis, pdeg, ox, oy) {
  var theta = toRads(pdeg);
  var x = Math.sin(theta);
  var y = Math.cos(theta);
  a.drawImage(img, 250 + ox + (pdis * x), 250 + oy + (pdis * y));
}

function makeSigns(a, o) {
  var signs = ['ares', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  var signCount = -1;
  for (var p = 15; p < 375; p += 30) {
    drawImg(a, sprites[signs[++signCount]][0], 231, p + o, -15, -15);
  }
}

function drawChart() {
  var a = document.getElementById('astrolabe').getContext('2d');
  var degs = calcAsc();
  a.clearRect(0, 0, 500, 500);
  makeCirc(a, 250, 250, 250);
  makeCirc(a, 250, 250, 212.5);
  makeCirc(a, 250, 250, 200);
  makeCirc(a, 250, 250, 100);
  makeHouses(a);
  makeDegs(a, 270 - degs.sid);
  makeSigns(a, 270 - degs.sid);
  drawImg(a, sprites['sun'][0], 175, degs.sun - degs.sid, -15, -15);
  radLine(a, 195, 200, degs.sun - degs.sid);
  drawImg(a, sprites['moon'][0], 175, degs.mon - degs.sid, -15, -15);
  radLine(a, 195, 200, degs.mon - degs.sid);
  drawImg(a, sprites['mercury'][0], 175, degs.mer - degs.sid, -15, -15);
  radLine(a, 195, 200, degs.mer - degs.sid);
  drawImg(a, sprites['venus'][0], 175, degs.ven - degs.sid, -15, -15);
  radLine(a, 195, 200, degs.ven - degs.sid);
  drawImg(a, sprites['mars'][0], 175, degs.mar - degs.sid, -15, -15);
  radLine(a, 195, 200, degs.mar - degs.sid);
  drawImg(a, sprites['jupiter'][0], 175, degs.jup - degs.sid, -15, -15);
  radLine(a, 195, 200, degs.jup - degs.sid);
  drawImg(a, sprites['saturn'][0], 175, degs.sat - degs.sid, -15, -15);
  radLine(a, 195, 200, degs.sat - degs.sid);
}

var sprites = {};
loadSprites({
  ares: ['images/sprites/ares.png', 30, 30],
  taurus: ['images/sprites/taurus.png', 30, 30],
  gemini: ['images/sprites/gemini.png', 30, 30],
  cancer: ['images/sprites/cancer.png', 30, 30],
  leo: ['images/sprites/leo.png', 30, 30],
  virgo: ['images/sprites/virgo.png', 30, 30],
  libra: ['images/sprites/libra.png', 30, 30],
  scorpio: ['images/sprites/scorpio.png', 30, 30],
  sagittarius: ['images/sprites/sagittarius.png', 30, 30],
  capricorn: ['images/sprites/capricorn.png', 30, 30],
  aquarius: ['images/sprites/aquarius.png', 30, 30],
  pisces: ['images/sprites/pisces.png', 30, 30],
  sun: ['images/sprites/sun.png', 30, 30],
  moon: ['images/sprites/moon.png', 30, 30],
  mercury: ['images/sprites/mercury.png', 30, 30],
  venus: ['images/sprites/venus.png', 30, 30],
  mars: ['images/sprites/mars.png', 30, 30],
  jupiter: ['images/sprites/jupiter.png', 30, 30],
  saturn: ['images/sprites/saturn.png', 30, 30]
}, function () {
  window.setInterval(drawChart, 1000);
});
