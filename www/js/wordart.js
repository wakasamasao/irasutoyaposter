/*
   wordart.js

   Copyright(C) 2013 aike

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
function wordart(text, parent, x, y, r) {
	var hsv2rgb = function(h, s, v) {
		var f, i, p, q, t;
		var rgb = [0,0,0];
		i = Math.floor(h / 60.0) % 6;
		f = (h / 60.0) - Math.floor(h / 60.0);
		p = Math.round(v * (1.0 - (s / 255.0)));
		q = Math.round(v * (1.0 - (s / 255.0) * f));
		t = Math.round(v * (1.0 - (s / 255.0) * (1.0 - f)));

		switch (i) {
			case 0 : rgb[0] = v; rgb[1] = t; rgb[2] = p; break;
			case 1 : rgb[0] = q; rgb[1] = v; rgb[2] = p; break;
			case 2 : rgb[0] = p; rgb[1] = v; rgb[2] = t; break;
			case 3 : rgb[0] = p; rgb[1] = q; rgb[2] = v; break;
			case 4 : rgb[0] = t; rgb[1] = p; rgb[2] = v; break;
			case 5 : rgb[0] = v; rgb[1] = p; rgb[2] = q; break;
		}
		return rgb;
	};

	for (var i = 0; i < text.length; i++) {
		var xpos = -10 * i;
		var ypos = -0.3 * Math.sin(Math.PI * i / (text.length - 1)) * r + 40;
		var rot = -1.4 - 0.3 * (i / text.length - 1);
		var skew = 75 + 5 * (i / text.length - 1);
		$('<div>')
		.css({
			position: 'absolute',
			left: x + 45 * i,
			top: y,
			fontSize: 40,
			fontFamily: 'sans-serif',
			fontWeight: 'bolder',
			webkitTransform: 'translate(' + xpos + 'px, ' + ypos + 'px) skew(' + skew + 'deg) scale(1.0, 0.5)',
			transform: 'translate(' + xpos + 'px, ' + ypos + 'px) skew(' + skew + 'deg) scale(1.0, 0.5)',
			width: 50,
			height: 50,
			color: 'rgba(200,200,200,0.8)'
		})
		.text(text.charAt(i))
		.appendTo(parent);
	}

	for (var i = 0; i < text.length; i++) {
		var xpos = 0;
		var ypos = -1 * Math.sin(Math.PI * i / (text.length - 1)) * r + 0.1;
		var rot = 0.3 * Math.PI * i / (text.length - 1) - Math.PI / 2 * 0.3;

		var deg = 270 * (i + 1) / (text.length - 1);
		var rgb = hsv2rgb(deg, 255, 220);
		$('<div>')
		.css({
			position: 'absolute',
			left: x + 45 * i,
			top: y,
			fontSize: 40,
			fontFamily: 'sans-serif',
			fontWeight: 'bolder',
			webkitTransform: 'translate(' + xpos + 'px, ' + ypos + 'px) rotate(' + rot + 'rad) scale(1.0, 2.5)',
			transform: 'translate(' + xpos + 'px, ' + ypos + 'px) rotate(' + rot + 'rad) scale(1.0, 2.5)',
			width: 50,
			height: 50,
			color: 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'
		})
		.text(text.charAt(i))
		.appendTo(parent);

		deg = 270 * (i) / (text.length - 1);
		rgb = hsv2rgb(deg, 255, 220);
		$('<div>')
		.css({
			position: 'absolute',
			left: x + 45 * i,
			top: y,
			fontSize: 40,
			fontFamily: 'sans-serif',
			fontWeight: 'bolder',
			webkitTransform: 'translate(' + xpos + 'px, ' + ypos + 'px) rotate(' + rot + 'rad) scale(1.0, 2.5)',
			transform: 'translate(' + xpos + 'px, ' + ypos + 'px) rotate(' + rot + 'rad) scale(1.0, 2.5)',
			width: 50,
			height: 50,
			color: 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')',
			webkitMaskImage: '-webkit-linear-gradient(0deg, rgba(0,0,0,1.0), rgba(0,0,0,0.0) 50%)',
			maskImage: '-linear-gradient(0deg, rgba(0,0,0,1.0), rgba(0,0,0,0.0) 70%)'
		})
		.text(text.charAt(i))
		.appendTo(parent);
	}
}
