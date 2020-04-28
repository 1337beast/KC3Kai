/**
 * kcs2_injectable.js
 * KC3改 KC Server Phase 2 injectable to access global context.
 *
 * Injected on URLs matching the same pattern with kcs2.js,
 * See kcs2.js and manifest.json
 *
 * Supports for improved usage of 3rd-party HTML5 components.
 */
(function () {
	"use strict";

	const maxRetries = 60;
	let checkerTimer = 0, retries = 0;

	const checkComponents = function () {
		console.log("Checking 3rd-party components...");
		retries += 1;
		const pixi = window.PIXI;
		const howler = window.Howler;
		if (!pixi || !howler) {
			if (retries > maxRetries) clearInterval(checkerTimer);
			return false;
		}

		// Hook and improve pixi.js if necessary?
		/*
		const originalRender = pixi.WebGLRenderer.prototype.render;
		pixi.WebGLRenderer.prototype.render = function() {
			// TODO stub
			return originalRender.apply(this, arguments);
		};
		*/

		// Hook and improve howler.js instance management: unload it on sound playback ended,
		// same sound will reload resource file again, but should hit browser's disk cache.
		// The game has added unload() invoking, but under some environment (some versions of Chromium),
		// although JS heap can be GC, but process memory used by buffer of downloaded files not released by browser.
		/*
		howler._howls._push = howler._howls.push;
		howler._howls.push = function () {
			const thisHowl = arguments[0];
			//thisHowl.on("play", (id) => {
			//	console.debug("Playing", id, thisHowl._src, thisHowl._duration);
			//});
			// To unload voices and SEs except looping BGM
			thisHowl.on("end", (id) => {
				if (thisHowl.state() === "loaded" && !thisHowl._loop) {
					thisHowl.unload();
					//console.debug("Unloaded OnEnd", id);
				}
			});
			// To unload previous BGM looped when new BGM started but old one not ended
			thisHowl.on("stop", (id) => {
				if (thisHowl.state() === "loaded") {
					thisHowl.unload();
					//console.debug("Unloaded OnStop", id);
				}
			});
			// To unload battle BGM faded out only without stop looping
			thisHowl.on("fade", (id) => {
				if (thisHowl.state() === "loaded" && thisHowl._volume <= 0) {
					thisHowl.unload();
					//console.debug("Unloaded OnFade", id);
				}
			});
			howler._howls._push.apply(this, arguments);
		};
		*/
	   
		var PIXIEventEmitter = PIXI.utils.EventEmitter;
		var _emit = PIXIEventEmitter.prototype.emit;
		var filterHooked = null;

		PIXIEventEmitter.prototype.emit = function EmitterHook(t, e, r, n, i, o){
			if( t == "pointerup" ){
				if( e && e.type == "pointerup" && e.currentTarget ){
					var targetWindow = window.parent.parent;
					if( e.currentTarget._page_no !== undefined ){
						targetWindow.postMessage({type: "questPage", page: e.currentTarget._page_no}, "*");
					}
					else if( e.currentTarget._filter !== undefined ){
						if( !e.currentTarget._selected )
							targetWindow.postMessage({type: "questFilter", filter: e.currentTarget._filter}, "*");
						else
							targetWindow.postMessage({type: "questFilter", filter: 0}, "*");
							
						var filterNode = e.currentTarget.parent;
						if( filterHooked != filterNode && filterNode._selected_filter !== undefined ){
							// Safeguard in case of function prototype undefined in the future
							if( filterNode.__proto__.dispose !== undefined ){
								// Hook dispose function that will be called with navigating away from quest page
								var _odisp = filterNode.__proto__.dispose;
								filterNode.__proto__.dispose = function(){
									// Reset filter on exiting
									targetWindow.postMessage({type: "questFilter", filter: 0}, "*");
									_odisp.apply( this, arguments );
								};
							}
							else
								console.warn( "Quest filter node dispose function not defined" );
							
							//console.log( "Quest filter hooked" );
							filterHooked = filterNode;
						}
					}
					else if( e.currentTarget.parent && e.currentTarget.parent._next == e.currentTarget ){
						targetWindow.postMessage({type: "questPage", page: "next"}, "*");
					}
					else if( e.currentTarget.parent && e.currentTarget.parent._prev == e.currentTarget ){
						targetWindow.postMessage({type: "questPage", page: "prev"}, "*");
					}
					else if( e.currentTarget.parent && e.currentTarget.parent._first == e.currentTarget ){
						targetWindow.postMessage({type: "questPage", page: "first"}, "*");
					}
					else if( e.currentTarget.parent && e.currentTarget.parent._last == e.currentTarget ){
						targetWindow.postMessage({type: "questPage", page: "last"}, "*");
					}
				}
			}
			_emit.apply( this, arguments );
		}

		console.log("Components hooked!");
		if (checkerTimer) clearInterval(checkerTimer);
		return true;
	};
	checkerTimer = setInterval(checkComponents, 1000);

})();