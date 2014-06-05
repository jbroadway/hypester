/**
 * Hypester
 *
 * A JavaScript library to help with common forms of interactivity in the
 * Tumult Hype HTML5 editor.
 *
 * https://github.com/jbroadway/hypester
 *
 * Note: Requires jQuery 1.8+
 *
 * Brought to you by The Campfire Union (https://www.campfireunion.com)
 */
var hypester = (function ($) {
	var self = {},
		settings = {
			hype: null,
			hidden_elements: 0,
			alert_timeline: 'alert',
			next_scene: 'next',
			clicked_on: [],
			base_url: 'http://www.example.com/',
			completed: true
		},
		scene_history = [],
		hype_loaded = false;
	
	/**
	 * Append a variable to the `#debug` element, for debugging JavaScript
	 * in the iOS simulator.
	 */
	self.debug = function (val) {
		$('#debug').append (val + '<br>');
	};
	
	/**
	 * Initialize a scene. This should be triggered on first loading a scene,
	 * after which everything should reference frame 1 of the main timeline
	 * and not go back to frame 0.
	 *
	 * Also redirects to the correct scene if a `#scene-name` is appended
	 * to the URL on initial page load, and initializes the scene history
	 * for dynamic "Previous" buttons for branching scenes.
	 *
	 * Usage:
	 *
	 *     hypester.init ({
	 *         hype: hypeDocument,
	 *         clicks: 1,
	 *         alert_timeline: 'alert',
	 *         next_scene: 'next'
	 *     });
	 *
	 * Options:
	 *
	 * - hype: The hypeDocument object.
	 * - hidden_elements: The number of hidden elements to be found in the scene.
	 *   Works with `hypester.clicked()` and `hypester.next()`.
	 * - alert_timeline: The timeline to start when "Next" is clicked but not all
	 *   hidden elements have been found.
	 * - next_scene: The next scene to show when all hidden elements have been found.
	 *   If the value is `next`, the next scene will be shown; if it ends in `.html`
	 *   it will redirect to that URL; otherwise specify the name of a scene.
	 * - base_url: The base URL for any AJAX requests.
	 * - completed: Whether the activity in the current scene has been completed or
	 *   not. Use this to prevent users from progressing to the next scene until an
	 *   activity has been finished first.
	 */
	self.init = function (options) {
		var defaults = {
			hype: null,
			hidden_elements: 0,
			alert_timeline: 'alert',
			next_scene: 'next',
			clicked_on: [],
			base_url: 'http://www.example.com/',
			completed: true
		};
		
		settings = $.extend (defaults, options);
		
		// if a #scene-name is found, jump to that scene
		if (! hype_loaded) {
			var hash = window.location.hash.substring (1);
			for (var i = 0; i < settings.hype.sceneNames ().length; i++) {
				if (settings.hype.sceneNames ().length; i++) {
					if (settings.hype.sceneNames ()[i] == hash) {
						settings.hype.showSceneNamed (hash);
						break;
					}
				}
			}
			hype_loaded = true;
		}

		// initialize scene history
		var current = settings.hype.currentSceneName ();
		history.pushState (null, null, '#' + current);
		
		if (scene_history[scene_history.length - 1] != current) {
			scene_history.push (current);
		}
	};
	
	/**
	 * Sends the user back to the proper previous scene based on their
	 * scene history from `hypester.init()`. Trigger this on clicking
	 * any "Previous" button in a branching scenes scenario.
	 */
	self.previous = function (hype) {
		var current = hype.currentSceneName (),
			last = scene_history.pop (),
			prev = (scene_history.length > 0)
				? scene_history[scene_history.length - 1]
				: false;
		
		if (prev === false) {
			// safeguard in case of empty array
			hype.showSceneNamed (hype.sceneNames ()[0], settings.hype.kSceneTransitionPushLeftToRight);
		} else {
			hype.showSceneNamed (prev, settings.hype.kSceneTransitionPushLeftToRight);
		}
	};
	
	/**
	 * Trigger this on clicking the "Next" button, sends the user to
	 * the next scene only if all hidden elements have been found.
	 *
	 * Usage:
	 *
	 *     hypester.next (hypeDocument);
	 */
	self.next = function (hype) {
		if (settings.clicks > 0 && settings.clicked_on.length >= settings.hidden_elements) {
			settings.completed = true;
		}
		
		if (settings.completed) {
			if (settings.next_scene === 'next') {
				hype.showNextScene (hype.kSceneTransitionPushRightToLeft);
			} else if (settings.next_scene.match (/\.html$/)) {
				window.location.href = settings.next_scene;
			} else {
				hype.showSceneNamed (settings.next_scene, hype.kSceneTransitionPushRightToLeft);
			}
		} else {
			hype.startTimelineNamed (settings.alert_timeline);
		}
	};
	
	/**
	 * Marks a hidden element as clicked. Call this in the mouse click event
	 * for the appropriate element via:
	 *
	 *     hypester.clicked (0);
	 *
	 * Note: Numbers begin at 0 and not 1.
	 */
	self.clicked = function (num) {
		var which = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
		if (settings.clicked_on.indexOf (which[num]) === -1) {
			settings.clicked_on.push (which[num]);
		}
	};

	/**
	 * Trigger this when the activity has been completed so `hypester.next()`
	 * knows to continue to the next scene.
	 */
	self.completed = function () {
		settings.completed = true;
	};
	
	return self;
})(jQuery);