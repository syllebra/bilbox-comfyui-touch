import { app } from "../../../scripts/app.js";

var ENABLE_TOUCHSCREEN_SIMULATION=false // TODO: settings


// Adds mapping of touch events to mouse events for mobile. This isnt great but it is somewhat usable


// Framework for simulating touch events without a mobile device
// Trying to be compatible with
//  http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
// TODO: support more of the touch API: touch{enter, leave, cancel}
var tuio = {
	cursors: [],

  // Data structure for associating cursors with objects
	_data: {},

  _touchstart:    function(touch) {
    // Create a touchstart event
    this._create_event('touchstart', touch, {});
  },

  _touchmove: function(touch) {
    // Create a touchmove event
    this._create_event('touchmove', touch, {});
  },

  _touchend: function(touch) {
    // Create a touchend event
    this._create_event('touchend', touch, {});
  },

  _create_event: function(name, touch, attrs) {
    // Creates a custom DOM event
    var evt = document.createEvent('CustomEvent');
    evt.initEvent(name, true, true);
    // Attach basic touch lists
    evt.touches = this.cursors;
    // Get targetTouches on the event for the element
    evt.targetTouches = this._get_target_touches(touch.target);
    evt.changedTouches = [touch];
    // Attach custom attrs to the event
    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        evt[attr] = attrs[attr];
      }
    }
    // Dispatch the event
    if (touch.target) {
      touch.target.dispatchEvent(evt);
    } else {
      document.dispatchEvent(evt);
    }
  },

  _get_target_touches: function(element) {
    var targetTouches = [];
    for (var i = 0; i < this.cursors.length; i++) {
      var touch = this.cursors[i];
      if (touch.target == element) {
        targetTouches.push(touch);
      }
    }
    return targetTouches;
  },

	// Callback from the main event handler
	callback: function(type, sid, fid, x, y, angle) {
    //console.log('callback type: ' + type + ' sid: ' + sid + ' fid: ' + fid);
		var data;

		if (type !== 3) {
			data = this._data[sid];
		} else {
			data = {
				sid: sid,
				fid: fid
			};
			this._data[sid] = data;
		}

    // Some properties
    // See http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html

    data.identifier = sid;
    data.pageX = window.innerWidth * x;
    data.pageY = window.innerHeight * y;
    //element.getBoundingClientRect();
    data.clientX = data.pageX - document.documentElement.scrollLeft;// clientRect.left;
    data.clientY = data.pageY - document.documentElement.scrollTop;//clientRect.top;
    //data.target = document.elementFromPoint(data.pageX, data.pageY);
    data.target = document.getElementById("ts_simulator_canvas");

		switch (type) {
			case 3:
				this.cursors.push(data);
				this._touchstart(data);
				break;

			case 4:
				this._touchmove(data);
				break;

			case 5:
				this.cursors.splice(this.cursors.indexOf(data), 1);
				this._touchend(data);
				break;

			default:
				break;
		}

		// if (type === 5) {
		// 	delete this._data[sid];
		// }
	}

};

function tuio_callback(type, sid, fid, x, y, angle)	{
	tuio.callback(type, sid, fid, x, y, angle);
}

////////////////////////////////////////////////////////////////////////
// Debug drawing canvas
var canvas;
var ctx;
var w = 0;
var h = 0;

var timer;
var updateStarted = false;
var touches = [];


function update() {
	if (updateStarted) return;
	updateStarted = true;

	var nw = window.innerWidth;
	var nh = window.innerHeight;

	if ((w != nw) || (h != nh)) {
		w = nw;
		h = nh;
		canvas.style.width = w+'px';
		canvas.style.height = h+'px';
		canvas.width = w;
		canvas.height = h;
	}

	ctx.clearRect(0, 0, w, h);

	var i, len = touches.length;
	for (i=0; i<len; i++) {
		var touch = touches[i];
    var px = touch.pageX;
    var py = touch.pageY;

		ctx.beginPath();
		ctx.arc(px, py, 20, 0, 2*Math.PI, true);

		ctx.fillStyle = "rgba(200, 0, 200, 0.2)";
		ctx.fill();

		ctx.lineWidth = 2.0;
		ctx.strokeStyle = "rgba(200, 0, 200, 0.8)";
		ctx.stroke();
    //console.log('drawn circle at ' + px +',' + py);
	}

	updateStarted = false;
}

function ol() {
	canvas = document.getElementById('ts_simulator_canvas');
	ctx = canvas.getContext('2d');
	timer = setInterval(update, 15);

canvas.addEventListener('touchend', function(event) {
	ctx.clearRect(0, 0, w, h);
    //console.log('end');
});

canvas.addEventListener('touchmove', function(event) {
  event.preventDefault();
  touches = event.touches;
  //console.log('touchmove:',touches);
});

canvas.addEventListener('touchstart', function(event) {
  //console.log('start');
});
};

////////////////////////////////////////////////////////////////////////

function makeElementDraggable(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
      // if present, the header is where you move the DIV from:
      document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
      elementDrag.ontouchdown = dragMouseDown
    }
  
    function dragMouseDown(e) {
      if(e.fake)
        return;

      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;

      if(e.button==1) {
        if(elmnt.classList.contains("touch-down")){
            elmnt.classList.remove("touch-down")
            tuio_callback(5,elmnt.id,elmnt.id,elmnt.offsetLeft/window.innerWidth,elmnt.offsetTop/window.innerHeight,0)
        }
        else {
            elmnt.classList.add("touch-down")
            tuio_callback(3,elmnt.id,elmnt.id,elmnt.offsetLeft/window.innerWidth,elmnt.offsetTop/window.innerHeight,0)
        }
      }
    }
  
    function elementDrag(e) {
      if(e.fake)
        return;
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

      if(elmnt.classList.contains("touch-down"))
      {
        tuio_callback(4,elmnt.id,elmnt.id,elmnt.offsetLeft/window.innerWidth,elmnt.offsetTop/window.innerHeight,0)
      }
    }
  
    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
      //elmnt.classList.remove("touch-down")
    }
  }

app.registerExtension({
	name: "debug.SimulateTouchScreen",
    init(){
        if(ENABLE_TOUCHSCREEN_SIMULATION == false)
          return;
        document.head.innerHTML += '<link rel="stylesheet" type="text/css" href="./extensions/bilbox-comfyui-touch/multi_touch_sim.css" />'
        document.body.insertAdjacentHTML( 'beforeend','<canvas id="ts_simulator_canvas" width="100%" height="100%"></canvas>')
        
        document.body.insertAdjacentHTML( 'beforeend','<div class="touch-sim" id="touch-sim-1"</div>')
        document.body.insertAdjacentHTML( 'beforeend','<div class="touch-sim" id="touch-sim-2"</div>')
        document.body.insertAdjacentHTML( 'beforeend','<div class="touch-sim" id="touch-sim-3"</div>')
        var cpt = 0
        for (var el of document.getElementsByClassName("touch-sim"))
        {    
            // el.id_cpt = cpt
            // cpt = cpt +1
            makeElementDraggable(el)
        }

        ol()

    },
});
