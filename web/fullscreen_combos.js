import { app } from "../../../scripts/app.js";
import { addStylesheet } from "../../../scripts/utils.js";

addStylesheet('./extensions/bilbox-comfyui-touch/fullscreen_combos.css');

app.registerExtension({
	name: "bilbox.FullscreenCombos",
    init(){

        document.body.insertAdjacentHTML( 'beforeend','<div class="fullscreen-combo-modal" id="bilbox-fullscreen-combo"><div class="fullscreen-combo-container"><ul class="scroller" id="bilbox-fullscreen-combo-holder"></ul></div></div>' )

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if(document.getElementById("bilbox-fullscreen-combo").style.visibility != 'hidden')
                        document.getElementById("bilbox-fullscreen-combo").style.visibility = 'hidden';
            }
          })

        // document.getElementById("bilbox-fullscreen-combo").onclick = function() {
        //     document.getElementById("bilbox-fullscreen-combo").style.visibility = 'hidden';
        // }

        function pop(combo, callback) {
            var holder = document.getElementById("bilbox-fullscreen-combo-holder")
            holder.replaceChildren();          
            
            for(var i =0;i<40;i++ )
            {
                var num = Math.floor(Math.random() * 40) + 20
                var str = Array(num).fill().map(()=>"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.random()*62)).join("")
            }

            holder.style.pointerEvents = "none"
            for(var opt of combo.options.values)
            {
                var el = document.createElement('li')
                el.innerHTML = opt
                el.addEventListener("click", function(e) {
                    document.getElementById("bilbox-fullscreen-combo").style.visibility = 'hidden'
                    console.log(this.innerHTML)
                    callback(this.innerHTML)
                });
                holder.appendChild(el)
            }
            setTimeout(() => {holder.style.pointerEvents = null},1200); // delay to avoid immediate click on pointerup
            document.getElementById("bilbox-fullscreen-combo").style.visibility = 'visible'
        }


        // Override "bind" function to grasp the callback combo
        if(!Function.prototype.__bind__) {
            Function.prototype.__bind__ = Function.prototype.bind;
            Function.prototype.bind = function(object) {
            var fn = this.__bind__(object);
            fn.getThis = function () {
            return object;
            }
            return fn;
            }
        }

        // We also need to patch the ContextMenu constructor to unwrap the parent else it fails a LiteGraph type check
        const ctxMenu = LiteGraph.ContextMenu;
		LiteGraph.ContextMenu = function (values, options, ref_window) {
            console.log("CALLBACK", values, options, ref_window)
			ctxMenu.call(this, values, options,ref_window);
            if(options.callback && options.callback.getThis)
                if(options.callback.getThis().type && options.callback.getThis().type == "combo")
                {
                    options.event.preventDefault()
                    options.event.stopPropagation();
                    //console.log(options.callback.getThis())
                    pop(options.callback.getThis(), options.callback)
                    this.close()
                }
		};
		LiteGraph.ContextMenu.prototype = ctxMenu.prototype;
    },
});
