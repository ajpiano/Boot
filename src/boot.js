/*
	BOOT UTILITY LIBRARY
	Version 0.1
*/
(function( namespace, window, undefined ){
	
		// Initialize the library's namespace.
		// This is controlled via arguments injected
		// into the closure at the bottom of this script.
	var global = window[ namespace ] || ( window[ namespace ] = {} ),
		
		// Localize global objects and functions for better compression.
		document = window.document,
		JSON = window.JSON,
		SetTimeout = setTimeout,
		
		// String compression optimizations for the library.
		strLoad = "load",
		strString = "string",
		strFunction = "function",
		strObject = "object",
		strNumber = "number",
		strBoolean = "boolean",
		
		strScript = "script",
		strReadyState = "readyState",
		strOnReadyStateChange = "onreadystatechange",
		strOnLoad = "onload",
		strComplete = "complete";

/*
	Function: Boot.now
	
	Gets a current timestamp.
	
	Returns:
	
	Timestamp
*/
	function now() {
		return new Date().getTime();
	}
	global.now = now;
	
/*
	Function: Boot.log
	
	Simple method for keeping a log and outputting to the screen.
	
	Parameters:
	
		message - String of the message to log.
	
	Returns:
	
	Boot
*/
	var logList,
		body,
		logItems = [],
		startTime = now(),
		logEnabled = 0;
		
	function log( msg, ul ) {
		
		body || (body = document.body);
		
		logItems.push( (now() - startTime) + "ms: " + msg );
		
		if ( logEnabled ) {	
			if ( logList || 
			   ( logList = ul ) || 
			   ( body && ( logList = document.createElement("div")) && body.insertBefore( logList, body.firstChild) ) ) {
				logList.innerHTML = ["<ul><li>", logItems.join("</li><li>"), "</li></ul>"].join('');
			}
		}
	};
	
	log.init = function( options ) {
		logEnabled = 1;
		logList = options.elem;
	};
	
	global.log = log;

/*
	Boot.extend
	
	Merge the contents of two or more objects together into the first object.
	
	Boot.extend( target, [object1], [objectN] )
	
	Parameters
	
		target -  An object that will receive the new properties if additional 
		          objects are passed in [or that will extend the Boot namespace 
				  if it is the sole argument].
		object1 - An object containing additional properties to merge in.
		objectN - Additional objects containing properties to merge in.

*/
	function extend() {

		var args = arguments,
			target = args[0],
			name, 
			source,
			i = 1, // Source pointer.
			l = args.length;

	/*
		// If the length is 1, extend Boot, and 
		// set the source to thefirst argument.
		//
		// Artz: Removing this, think this is not 
		// worth the bytes and/or non-intuitive.
		
		if ( l === i ) {
			target = global;
			i = 0;
		}
	*/
		for (; i < l; i++ ) {
			source = args[i];
			for ( name in source ) {
				if ( source.hasOwnProperty(name) ) {
					if ( isObject( source[name] ) ) {
						target[name] = isArray( source[name] ) ? [] : {};
						extend( target[name], source[name] );
					} else {
						target[name] = source[name];
					}
				}
			}
		}

		return target;
	}
	global.extend = extend;

/*
	Function: Boot.ready
	
	Cross-browser DOMContentLoaded event binder.
	
	Parameters:
	
		callback - The function to execute after the document is ready.
	
	Returns:
	
	Boot
	
	See Also:
	
	<Boot.load>

	Usage:
	
	Boot.ready( function(){ ... } );
	
	Research:
	
	* http://dean.edwards.name/web// log/2005/09/busted/
	  Probably the first experiment; cannot use because of document.write.
	
	* http://www.thefutureoftheweb.com/b// log/adddomloadevent
	  Uses our approach but for some reason didn't make Safari's 
	  detection the same as IE.  My testing showed readyState to 
	  be reliable acrosss IE browsers.
	  /test/readyState.php
	
	* http://javascript.nwbox.com/IEContentLoaded/
	  This one is included in jQuery. The doScroll event is 
	  much less efficient than checking readyState. 
	  /test/regex-vs-indexof.html
	
	* http://www.dustindiaz.com/smallest-domready-ever
	  This was interesting but upon closer inspection, doesn't work.
*/
	var isReady = 0,
		isReadyBound = 0,
		readyQueue = [],
		
		checkReady = function(){
			// Browsers go through 3 readyStates:
			// 1 - loading
			// 2 - loaded (Safari) or interactive (everyone else)
			// 3 - complete
			// This check looks for #2, the equivalent of DOM ready.
			// Needs to be "interactive" or "loaded" (Safari) or "complete" (catch all)
			// "e" fits the bill nicely.
			// indexOf is much faster than regex or doScroll hack in Safari and IE (see /test/regex-vs-indexof.html)
			return contains( document.readyState, "e" );
		},
/*
	Replaced this with Boot.poll. So far so good!
		pollReadyState = function(){
			if ( checkReady() ) {
				execReady();
			} else {
				SetTimeout( pollReadyState, 50 );
			}
		},
*/
		execReady = function(){
			
			isReady = 1;
			
			each( readyQueue, function(i){
				SetTimeout(readyQueue[i], 0);
			});

			// Clear the queue.
			readyQueue = [];
		},
		
		// Internal reference.
		ready = function( callback ){
		
			if ( isReady ) {
				
				// Execute callback immediately in the next UI thread.	
			//	console.log("Executing in the next cycle.");
				SetTimeout( callback, 0 );	
						
			} else {
	
				if ( isReadyBound ) {
				//	log("Pushing ready callback.");
					// Push function into the queue.
					readyQueue.push( callback );
					
				} else {
				//	log("Binding ready.");
					isReadyBound = 1;
					
					// Add this callback to our queue to
					// be executed when ready.
					readyQueue = [ callback ];
					
					if ( checkReady() ) {
					//	log("Already ready.");
						// It is ready right now, execute ready.
						execReady();
					} else {	
						// Good browsers.
						if ( document.addEventListener ) {
				//			console.log("Binding DOMContentLoaded.");
							document.addEventListener( "DOMContentLoaded", execReady, false ); 
						// IE.
						} else {
							poll( checkReady, execReady, 50 );
						}
					}
				}
			}
			
			
		};
	
	// Public reference.
	global.ready = ready;

/*
	Function: Boot.bind
	
	Cross browser method for binding events.
	
	Parameters:
	
		object - The object to bind the method to.
		event - The event to bind the method to.
		callback - The method to fire on the event.
	 
	Returns:
	
	Boot
*/
	function bind( object, event, callback ) {
		if (object.attachEvent) {
			object.attachEvent("on" + event, callback);
		} else if (object.addEventListener) {
			object.addEventListener(event, callback, false);
		}
		
	}
	global.bind = bind;

/*
	Function: Boot.load
	
	Cross-browser window load event binder.
	Includes a convenient check for if 
	the window has already loaded and 
	executes the function immediately if it is.
	
	Parameters:
	
		callback - The function to execute after the window has loaded.
	
	Returns:
	
	Boot
	
	See Also:
	
	<Boot.load>
*/
	var isLoaded = 0;
	function load( callback ) {

		// When loaded, set the internal flag and do the callback.
		function loaded(){
			
			// Ensure we process our ready queue before stuff 
			// bound to window.load.
			execReady();
			
			isLoaded = 1;
			
			SetTimeout( callback, 0 );
		}
		
		// Browsers go through 3 readyStates:
		// 1 - loading
		// 2 - loaded (Safari) or interactive (everyone else)
		// 3 - complete
		// This check looks for #3, the equivalent of window.onload.
		// "m" fits the bill nicely.
		// indexOf is much faster than regex in Safari and IE (see /test/regex-vs-indexof-vs-doscroll.html)
		if ( contains( document.readyState, "m" ) ) {
			loaded();
		} else {
			bind( window, strLoad, loaded );
		}
		
	}
	global.load = load;
	
/*
	Function: Boot.attr
	
	Shorthand for setting and retrieving an attribute from an element.
	
	Parameters:
	
		elem - The object with the attribute to fetch.
		attribute - The attribute to fetch.
		value - The value to set.
	
	Returns:
	
	Attribute value (getting) or Boot (setting)
*/
	var styleNode = document.createElement("style"); // Alose used in Boot.inlineCSS.

	function attr( elem, attribute, value ){
		
		if ( value !== undefined ) {
		
			if ( value === null ) {
				elem.removeAttribute( attribute );
			} else if ( attribute === "style" && styleNode.styleSheet ) {
				elem.cssText = value;
			} else {
				elem.setAttribute( attribute, value );
			}	

		} else {
			return elem.getAttribute( attribute );
		}
		
	}
	global.attr = attr;
/*
	Function: Boot.each
	
	Simple function for iterating through an array.
	
	Parameters:
	
		array - The array to iterate over.
		callback - The callback to apply to each item in the array.
	
	Returns:
	
	Boot
*/
	function each( array, callback ) {
	// Anything break if I comment this out?  Dummy protection needed?
	//	if ( array && array.length ) {  
			for (var i = 0, l = array.length; i < l; i++ ) {
				callback.call( array, i, array[i] );
			}
	//	}
		
	}
	global.each = each;

/*
	Function: Boot.globalEval
	
	Evaluates code in the global scope.
	
	Parameters:
	
		src - The source code to execute.
	 
	Returns:
	
	Boot
	
	Research:
	http://web// logs.java.net/b// log/driscoll/archive/2009/09/08/eval-javascript-global-context
*/
	function globalEval( data ) {

		( window.execScript || function( data ) {
			window[ "eval" ].call( window, data );
		} )( data );
		
		
	}
	global.globalEval = globalEval;
	
/*
	Function: Boot.isArray
	
	Determines if the given object is an array.
	
	Parameters:
	
		obj - The object to test.
	 
	Returns:
	
	Boolean
*/
	// String optimizations.
	function is( str, type ) {
		return typeof str === type;
	}

	function isArray( obj ) {
		return obj && contains( obj.constructor.toString(), "rray" );
	}
	global.isArray = isArray;
	
	function isObject( obj ) {
		return is( obj, strObject );
	}
	global.isObject = isObject;
	
	function isString( obj ) {
		return is( obj, strString );
	}
	global.isString = isString;
	
	function isBoolean( obj ) {
		return is( obj, strBoolean );
	}
	global.isBoolean = isBoolean;
	
	function isFunction( obj ) {
		return is( obj, strFunction );
	}
	global.isFunction = isFunction;
	
	function isNumber( obj ) {
		return is( obj, strNumber );
	}
	global.isNumber = isNumber;

/*
	Function: Boot.trim
	
	Trims whitespace before and after a string.
	
	Parameters
	
		str - The string to trim leading whitespace.
	
	Returns
	
	String - The trimmed string.
*/
	function trim( str ) {
		return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
	}
	global.trim = trim;
	
/* 
	Function: Boot.parseJSON
	
	Parses a valid JSON string into a JavaScript object. Thanks, jQuery!
	
	Parameters
	
		data - The string of data to parse.
	 
	Returns:
	
	Object - Parsed JSON object.
*/
/*
	Removing because it's too heavy and developers need to be smart.
	var rvalidchars = /^[\],:{}\s]*$/,
		rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
		rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
		rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
*/
	function parseJSON( data ) {
		try {
			// Make sure leading/trailing whitespace is removed (IE can't handle it)
			data = trim( data );
					
			// Attempt to parse using the native JSON parser first
			if ( JSON && JSON.parse ) {
				return JSON.parse( data );
			}
	
			// Make sure the incoming data is actual JSON
			// // logic borrowed from http://json.org/json2.js
			// *Removing this to decrease weight of the library.
		//	if ( rvalidchars.test( 
		//			data.replace( rvalidescape, "@" )
		//				.replace( rvalidtokens, "]" )
		//				.replace( rvalidbraces, "") ) ) {
		
			return (new Function( "return " + data ))();
	
		//	}
		} catch (e) {
			// This function may raise eyebrows so be sure to 
			// inform developers why it failed.
			if ( window.console ) {
				console.log( "Bad JSON: " + data );
			}
		}
	};
	global.parseJSON = parseJSON;
	
/*
	Function: Boot.contains
	
	Determines if the given string contains given text.
	
	Parameters:
		
		haystack - The string to search inside.
		needle - The string to find.
	 
	Returns:
	
	Boolean
	
	Usage:
	if ( contains( "a", "abcde" ) ) {
		// true
		Do something knowing this value contains it.
	}
*/
	function contains( haystack, needle ){
		return haystack && haystack.indexOf( needle ) !== -1;
	}
	global.contains = contains;

/*
	Function: Boot.cacheScript
	
	Asynchronous JavaScript cacher.
	
	Parameters:
	
		src - The script resource to cache.
	 
	Returns:
	
	Boot	
	
	Notes:
	
	Consider making this a generic cacheResource function that can cache CSS too?
	Or we can simply do cacheCSS = cacheScript (or cacheJS?)
*/
	function cacheScript( src, delay ){
		
		// log( "Boot.getJS (cacheScript): Caching script (" + src + ")" );
		var elem;
		
		body || (body = document.body);
		
		if ( delay ) {
			// Convert delay to seconds.
			delay = delay * 1000;
		}
		
		// Body element is required for this to work.
		if ( body ) {
			
			// Cache the script after the optional delay.
			SetTimeout(function(){
				// Gecko gets an object, everyone else gets an image.
				// See /test/boot.cachescript.html
				elem = document.createElement( isGecko ? strObject : "img" );
	
				// Set the src (image) and data (object).
				elem.src = elem.data = src;
				
				// Hide element from view.
				elem.alt = ""; // So screen readers don't hit it.
				elem.width = elem.height = 0;
				elem.style.position = "absolute"; // Probably overkill, but fully ensures layout is unharmed.
	
				// Using setTimeout here will cause Firefox to 
				// hang perpetually, making users sad. :(
				
				body.appendChild( elem );
				
			}, delay || 0 );

		}
		
	}
	global.cacheScript = cacheScript;
	
/*
	Function: Boot.getScript
	
	Loads a script node into the DOM. Note this is different than Boot.getJS, which
	has full functionality for dealing with script dependencies and preserving
	execution order across browsers.
	
	Parameters:
	
		src - The script to load.
		callback - The function to invoke after the script has loaded.
		options - Options for the script element:
			type - The script type, useful for caching scripts.
			text - The text to load into the node.
			async - Value of the async param, default is false.
	 
	Returns:
	
	Boot
*/
	var fauxFunction = function(){},
		
		// Script collection on the page.
		scripts = document.getElementsByTagName( strScript ),
		
		// The first script on the page.
		firstScript = scripts[0],
		firstScriptParent = firstScript.parentNode;

	function getScript ( src, callback, options ) { // type, text ) {
	
		var	script = document.createElement( strScript ),
			done = 0;
		
		// Ensure our arguments are what they proclaim to be.
		options = options || callback || {};
		callback = isFunction( callback ) ? callback : fauxFunction;
	
		// Set the source of the script.
		script.src = src;
		
		// Set the type.
		// Controlling this is useful for caching scripts.
		script.type = options.type || "";  // Using "" assumes text/javascript.
		
		// Sometimes nodes need to have text inside (rare).
		options.text && ( script.innerHTML = options.text );
		
		// This is for Firefox 4
		// https://developer.mozilla.org/En/HTML/Element/Script
		// We basically make it synchronously like in FF3.
		// Not ideal, but we found <object> to be MUCH slower
		// DOM nodes in Firefox.
		// Check out /test/benchmarks/speed-test-* (need to update files)
		script.async = options.async || false;
		
		// Attach handlers for all browsers
		script[ strOnLoad ] = script[ strOnReadyStateChange ] = function(){
	
			if ( !done && (!script[ strReadyState ] ||
					script[ strReadyState ] === "loaded" || script[ strReadyState ] === strComplete) ) {
						
				// log( "Boot.getJS (getScript): Done loading <b>" + src + "</b>." );	
				
				// Tell global scripts object this script has loaded.
				// Set scriptDone to prevent this function from being called twice.
				done = 1;
	
			//	if ( callback ) {
				callback( src );
			//	}
				
				// Handle memory leak in IE
				script[ strOnLoad ] = script[ strOnReadyStateChange ] = null;
				
				// Remove this script in the next available UI thread.
				// * Removing this to reduce KB.  If people really care, we will add back.
	//			SetTimeout(function(){
	//				firstScriptParent.removeChild( script );
	//			}, 0);
			}
		};
		
		// This is the safest insertion point to assume.
		// We use a setTimeout to ensure non-blocking behavior.
		SetTimeout(function(){
			firstScriptParent.insertBefore( script, firstScript );
		}, 0);
		
		
	}
	global.getScript = getScript;

/*
	Function: Boot.getJS
	
	Asynchronous JavaScript loader.
	
	Parameters:
	
		url
		callback
		options
		 
	Returns:
	
	Boot
	
	To Do:
	* Consider adding document.write prevention.
*/
	var isScriptLoading = {},
		isScriptDone = {},
		isScriptExecuted = {},
		
		execScriptQueue = [],
		readyScriptQueue = [],
		loadScriptQueue = [],
	
		lastScript,
		
		docElem = document.documentElement,
		isGecko = "MozAppearance" in docElem.style,
		
		// If the browser supports asynchronous executing scripts. (Firefox 3.6, Opera, Chrome 12)
		isScriptAsync = isGecko || window.opera || document.createElement( strScript ).async === true,
		
		scriptType = isScriptAsync ? "" : "c";
	
	// log( "Boot.getJS: Script <b>is " + (isScriptAsync ? "" : "not") + "</b> asynchronous." );

	function shiftScripts() {
//		log( "Shifting! " + execScriptQueue[0] + " to " + execScriptQueue[1] );
		execScriptQueue.shift();
		execScripts();
	}
	
	function execScripts( src ){

			// Get the first script object in the queue.
		var nextScriptObject = execScriptQueue[0] || {},
		
			// Look if next script object is a script or callback.
			nextScript = nextScriptObject.src || nextScriptObject;
		
		// Remember the script we were passed is loaded.
		isScriptDone[ src ] = 1;
	
		if ( isScriptDone[ nextScript ] && ! isScriptExecuted[ nextScript ] ) {
			
			// Remember the last script we executed.
			lastScript = nextScript;
			
			isScriptExecuted[ nextScript ] = 1;
			
			// If browser supports asynch execution, continue.
			if ( isScriptAsync ) {
				shiftScripts();
			// Otherwise fetch this script and shift it out when executed.
			} else {
				getScript( nextScript, shiftScripts );
			}
			 
		} else if ( isFunction( nextScript ) ) {
			// We handle things differently for async browsers, since
			// we want to be sure to execute the callback immediately
			// after the script downloads.
			if ( isScriptAsync ) {
				nextScript( lastScript )
			} else {
				// For other browsers, we continue to manage things
				// manually using paced SetTimeouts.  IE likes it.
				SetTimeout(function(){
					nextScript( lastScript )
				}, 0);	
			}
			shiftScripts();
		}		
	}

	function dispatchScriptQueue( queue ) {
		
		// Call getJS on each item in the queue.
		while ( queue[0] ) {
			getJS( queue[0] );			
			queue.shift();
		}
	}
	
	function getJS ( /* url, callback, or options */ ) {
		
		each( arguments, function( i, arg ) {

			var options = {},
				defer,
				src,
				callback;
				
			// Convert the string or function
			// into the object.
			switch ( typeof arg ) {
				case strString:
					options.src = arg;
					break;
				case strFunction:
					options.callback = arg;
					break;
				case strObject:
					options = arg;
					
					// Remember defer setting.
					defer = options.defer;
					
					// Should we have a callback.
					callback = options.callback;
					
					// Reset it so it loads normally next time.
					options.defer = undefined; 
			}

			// Defer these options until document is ready.
			if ( defer === "ready" ) {
				// Push options into queue for later processing.
				readyScriptQueue.push( options );

			//	log( "Boot.getJS: Pushing script to ready event." );
				// On the ready event, dispatch the ready queue.
				ready(function(){
					dispatchScriptQueue( readyScriptQueue );
				});
				
			// Defer these options until document is complete.
			} else if ( defer === strLoad ) {

				// Push options into queue for later processing.
				loadScriptQueue.push( options );
				
			//	log( "Boot.getJS: Pushing script to load event." );
				// On the load event, dispatch the load queue.
				load(function(){
					dispatchScriptQueue( loadScriptQueue );
				});
			
			// Proceed as normal.
			} else {
				
				// Localize the source.
				src = options.src;

				// Localize the callback.
				callback = options.callback;
				
				// We don't need the callback, we will handle
				// this manually via the execution queue.
				options.callback = undefined;
				
				// If the type is set to cache, do so immediately.
				if ( contains( options.type, "cache" ) ) {
					
					// If this is a script and it hasn't been 
					// loaded yet, fetch it now.
					if ( src && ! isScriptLoading[ src ] ) {
					//	log( "Boot.getJS: Caching script: " + src);
						cacheScript( src, options.delay );
					}
					
				// Otherwise proceed through our queue system.	
				} else if ( src && ! isScriptLoading[ src ] ) {

					// Push the script options into our execution queue.
					execScriptQueue.push( options );
					
					// If this is a script, and it hasn't 
					// been loaded yet, fetch it now.
				
					// log( "Boot.getJS: Loading script: " + src);
					// Look into letting getScript accept an options {}.
					getScript( src, execScripts, { type: scriptType } );
					
				}
				
				// Push the callback into the queue if we had one.
				if ( callback ) {			
					// log( "Boot.getJS: Pushing callback function into queue.");
					execScriptQueue.push( callback );
				}
			}
			
			// Execute any scripts in our queue.
			execScripts();

		});
		
	}
	global.getJS = getJS;

	// log("Boot library initialized.");

/*
	Function: Boot.on
	
	Subscribes to an event, fires a callback once it is emitted.
	http://en.wikipedia.org/wiki/Publish/subscribe
	
	Parameters:
	
	event
	callback
*/
	var events = {};
	function on( event, callback ){
		
		var eventQueue = events[ event ] || ( events[ event ] = [] );
		
		eventQueue.push( callback );
		
	}
	global.on = on;

/*
	Function: Boot.emit
	
	Publishes an event, passing an optional object of data.
	Triggers any events attached to the event.
	http://en.wikipedia.org/wiki/Publish/subscribe
	
	Parameters:
		- event
		- data
		
	Returns:
	
	Boot

*/
	function emit( event, data ){
		
		var eventQueue = events[ event ];
		
		if ( eventQueue ) {
			each( eventQueue, function(i){
				eventQueue[i].call( data, data );
			});
		}
		
	}
	global.emit = emit;

/*
	Boot.inlineCSS
	
	Thanks Stoyan!

 if (attr == "style" && this.userAgent_.getName() == "MSIE") {
          domElement.style.cssText = opt_attr[attr];
        } else {
          domElement.setAttribute(attr, opt_attr[attr]);
        }

*/
	function inlineCSS( css ){

		var style = styleNode.cloneNode(0),
			styleSheet = style.styleSheet,
			textNode;
	
//		attr( style, "type", "text/css" ); // Not needed in HTML5 :D
		
		// IE
		if ( styleSheet ) { 
			styleSheet.cssText = css;
		// The World
		} else { 
			textNode = document.createTextNode( css );
			style.appendChild( textNode );
		}
		
		firstScriptParent.insertBefore( style, firstScript );
	}
	global.inlineCSS = inlineCSS;

/*
	Boot.createNode
*/
	function createNode( html ) {	
		var div = document.createElement("div");
		div.innerHTML = html;
		return div.firstChild;
	}
	// Valuable publicly as Boot.createNode? jQuery's territory?
/*
	Boot.poll
	
	Function useful for checking/polling something
	and then executing a callback once it's done.
*/
	var timers = {},
		timerId = 0;

	function poll( check, callback, delay, timeout ){

		var name = timerId++,
			start = now(),
			time,
			isTimeout = false;
		
		timers[ name ] = setInterval(function(){
			
			time = now() - start;
			
			if ( check() || ( timeout && ( isTimeout = time > timeout )) ) {
				callback.call( window, isTimeout, time );
				clearInterval( timers[ name ] );
			}
			
		}, delay );
		 
	}
	global.poll = poll;
	
/*
	Boot.getFont
*/
	var getFontOptions = {
			namespace: "wf-",
			path: "fonts/{f}/{f}-webfont",
			fontface: "@font-face { font-family: '{f}'; src: url('{p}.eot'); src: url('{p}.eot?#iefix') format('embedded-opentype'), url('{p}.woff') format('woff'), url('{p}.ttf') format('truetype'), url('{p}.svg#{f}') format('svg'); font-weight: normal; font-style: normal; }"
		},
		testDiv, // Keep it empty until invoked the first time.
		strLoading = "-loading",
		strActive = "-active",
		strInactive = "-inactive", 
		
		// Valuable as Boot.removeClass / Boot.addClass or jQuery's job?
		addClass = function( object, className ) {
			object.className += " " + className;
		},
		removeClass = function ( object, className ) {
			className = new RegExp( "\\b" + className + "\\b" );
			object.className = object.className.replace( className, "" );
    	};
	
	function getFont( /* options, options, ... */ ) {
		
		if ( ! testDiv ) {
			
			testDiv = createNode("<div style=\"position:absolute;top:-999px;left:-999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;font-family:serif\">BESs</div>" );
			
			docElem.appendChild( testDiv );
			
		}
		
		for ( var args = arguments,
				options = getFontOptions,
				fontTemplate = /{f}/g,
				fontPathTemplate = /{p}/g,
				fontDiv,
//				testDiv = hiddenDiv.cloneNode(),
				fontName,
				namespacedFontName,
				fontPath,
				fontFace,
				fontfaceCSS = [],
				i = 0, 
				l = args.length; i < l; i++ ) {
			
			fontName = args[i].toLowerCase();
			
//			Boot.log( "Getting font: <b>" + fontName + "</b>" );
			
			fontPath = options.path.replace( fontTemplate, fontName );
			
//			Boot.log( "Setting font URL: <b>" + fontPath + "</b>" );
			
			fontFace = options.fontface.replace( fontTemplate, fontName ).replace( fontPathTemplate, fontPath );
			
//			Boot.log( "Generating @fontface: <b>" + fontFace + "</b>");
			
			fontfaceCSS.push( fontFace );
			
			fontDiv = testDiv.cloneNode( true );
			
			fontDiv.style.fontFamily = "'" + fontName + "',serif";
						
			docElem.appendChild( fontDiv );
						
			namespacedFontName = options.namespace + fontName;
			
			emit( namespacedFontName + strLoading );
						
			addClass( docElem, namespacedFontName + strLoading );
			
			(function( fontDiv, namespacedFontName ) {
				
				poll( function( time ){
//					Boot.log( "Test width: " + testDiv.offsetWidth + ", " + fontName + ": " + fontDiv.offsetWidth );
					return testDiv.offsetWidth !== fontDiv.offsetWidth;
				}, function( isTimeout, time){ 
//					Boot.log("Different widths detected in " + time + "ms. Timeout? " + isTimeout); 
					if ( isTimeout ) {
						
						removeClass( docElem, namespacedFontName + strLoading );
						addClass( docElem, namespacedFontName + strInactive );

						emit( namespacedFontName + strInactive );
//						emit( "get-font-inactive", { name: fontName } );
// 						window.console && console.log( "Font timeout: " + namespacedFontName );
					} else {
					
						removeClass( docElem, namespacedFontName + strLoading );
						addClass( docElem, namespacedFontName + strActive );
						
						emit( namespacedFontName + strActive );
//						emit( "get-font-active", { name: fontName } );
					}
//					fontDiv.parentNode.removeChild( fontDiv ); // Unnecessary expense?
				}, 25, 10000 );
				
			})( fontDiv, namespacedFontName );
			
		}
		
		inlineCSS( fontfaceCSS.join("") );
		
	}
/*	
	Allow customizable settings someday maybe.
	getFont.set = function( options ) {
		
	};
*/	
	global.getFont = getFont;

/*
	Screen Size Detection
	Thanks Tero Piirainen! http://headjs.com
*/
	var screens = [ 320, 480, 640, 768, 1024, 1280, 1440, 1680, 1920 ];
	
	
	
	/*
		To Do
		- Screen detection.
		- Browser targeting for CSS (.ie, .ie6, .ie7, .ie8, .ie9, .ie10, .ff, .ff3, .ff4, .ff5, .ff3-5, .ff3-5-1, .sa, .sa4, .sa5 .ch ...)
		? Boot.once - Do a callback once only.
		? Boot.off / Boot.removeEvent - Remove custom event.
	*/
	
})("Boot", this);