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

/**
 * This class simply overrides its toString() method to
 * return the value from the hypester_labels for its
 * label property (set via the constructor), so that
 * outputting an instance of it as a string will return
 * the desired string instead of `[object Object]`.
 */
function HypesterElement (label) {
	this.label = label;
}

/**
 * Overrides toString() for HypesterElement.
 */
HypesterElement.prototype.toString = function () {
	return hypester_labels[this.label];
};

/**
 * The hypester object.
 */
var hypester = (function ($) {
	var self = {},
		settings = {
			hype: null,
			hidden_elements: 0,
			alert_timeline: 'alert',
			next_scene: 'next',
			draggable: {
				elements: 0,
				completed_timeline: 'complete',
				dropzones: [
					//{ id: 'drop1', bg_off: 'drop1_off.png', bg_on: 'drop1_on.png' },
					//{ id: 'drop2', bg_off: 'drop2_off.png', bg_on: 'drop2_on.png' }
				]
			},
			base_url: 'http://www.example.com/',
			clicked_on: [],
			draggable_completed: 0,
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
	 * - draggable: Settings related to the `hypester.drag_handler()` and
	     `hypester.drag_completed()` functions.
	 *   - draggable.elements: The number of draggable elements that should be sorted
	 *     in this scene. Works with `hypester.drag_handler()`.
	 *   - draggable.completed_timeline: The timeline to play in `hypester.drag_completed()`
	 *     when all draggable elements have been dropped in their correct locations.
	 *   - draggable.dropzones: A list of elements that draggable items can be dropped onto.
	 *     Each has an `id` that must match the ID value for the element, and optionally
	 *     `bg_off` and `bg_on` properties which specify background image resources to
	 *     switch between when an element is dragged over it, aka toggled on hover state.
	 */
	self.init = function (options) {
		var defaults = {
			hype: null,
			hidden_elements: 0,
			draggable_elements: 0,
			alert_timeline: 'alert',
			next_scene: 'next',
			draggable: {
				elements: 0,
				completed_timeline: 'complete',
				dropzones: [
					//{ id: 'drop1', bg_off: 'drop1_off.png', bg_on: 'drop1_on.png' },
					//{ id: 'drop2', bg_off: 'drop2_off.png', bg_on: 'drop2_on.png' }
				]
			},
			base_url: 'http://www.example.com/',
			clicked_on: [],
			draggable_completed: 0,
			completed: true
		};
		
		settings = $.extend (defaults, options);
		
		// if a #scene-name is found, jump to that scene
		/*if (! hype_loaded) {
			var hash = window.location.hash.substring (1);
			for (var i = 0; i < settings.hype.sceneNames ().length; i++) {
				if (settings.hype.sceneNames ()[i] == hash) {
					settings.hype.showSceneNamed (hash);
					break;
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
		
		// initialize dropzone element nodes
		for (var i = 0; i < settings.draggable.dropzones.length; i++) {
			settings.draggable.dropzones[i].element = document.getElementById (settings.draggable.dropzones[i].id);
		}*/
		
		// initialize any elements with template tags
		self.init_elements ();
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

	/**
	 * Drag elements onto one or more dropzones, one of which is the correct choice.
	 *
	 * Trigger this on the drag event for the element to be dragged. Adjust the
	 * various parameters via the options passed to the function.
	 * 
	 * Note that you will need to create a timeline for each draggable element that
	 * keyframes its origin left and origin top position in the first frame of the
	 * timeline, which will be called to reset its position on an incorrect choice.
	 */
	self.drag_handler = function (options) {
		var defaults = {
				hype: null,
				element: null,
				event: null,
				correct_answer: 'drop1',
				correct_timeline: 'correct',
				incorrect_timeline: 'incorrect',
				reset_timeline: 'reset'
			},
			opts = $.extend (defaults, options),
			coords = opts.event.touches
				? (opts.event.touches[0] ? opts.event.touches[0] : opts.event.changedTouches[0])
				: opts.event;

		if (opts.event['hypeGesturePhase'] == opts.hype.kHypeGesturePhaseStart) {
			// reset everything
			for (var i = 0; i < settings.draggable.dropzones.length; i++) {
				if (settings.draggable.dropzones[i].hasOwnProperty ('bg_off')) {
					settings.draggable.dropzones[i].element.style.backgroundImage = 'url(' + opts.hype.resourcesFolderURL () + '/' + settings.draggable.dropzones[i].bg_off + ')';
				}
			}
			opts.hype.goToTimeInTimelineNamed(0, opts.correct_timeline);

		} else if (opts.event['hypeGesturePhase'] == opts.hype.kHypeGesturePhaseMove) {
			// while drag is occurring, see if the element is over a dropzone and adjust its bg image
			for (var i = 0; i < settings.draggable.dropzones.length; i++) {
				if (! settings.draggable.dropzones[i].hasOwnProperty ('bg_on')) {
					continue;
				}

				if (! settings.draggable.dropzones[i].hasOwnProperty ('element')) {
					settings.draggable.dropzones[i].element = document.getElementById (settings.draggable.dropzones[i].id);
				}

				if (self.inside (coords, settings.draggable.dropzones[i].element)) {
					settings.draggable.dropzones[i].element.style.backgroundImage = 'url(' + opts.hype.resourcesFolderURL () + '/' + settings.draggable.dropzones[i].bg_on + ')';
				} else {
					settings.draggable.dropzones[i].element.style.backgroundImage = 'url(' + opts.hype.resourcesFolderURL () + '/' + settings.draggable.dropzones[i].style.bg_off + ')';
				}
			}

		} else if (opts.event['hypeGesturePhase'] == opts.hype.kHypeGesturePhaseEnd) {
			// once the drag ends, see if the element is over a dropzone and respond appropriately

			var matched = false,
				correct = false;

			for (var i = 0; i < settings.draggable.dropzones.length; i++) {
				if (self.inside (coords, settings.draggable.dropzones[i].element)) {
					if (
						opts.correct_answer === settings.draggable.dropzones[i].id ||
						(
							(opts.correct_answer instanceof Array) &&
							$.inArray (settings.draggable.dropzones[i].id, opts.correct_answer) >= 0
						)
					) {
						// user chose the correct answer
						opts.hype.startTimelineNamed (opts.correct_timeline);
						correct = true;

						// keep track of how many draggables have been completed
						settings.draggable_completed++;
						if (settings.draggable_completed.length >= settings.draggable.elements) {
							settings.completed = true;
						}
						break;

					} else {
						matched = true;
						break;
					}
				}
			}
			
			if (! correct) {
				// reset element by going to 0 on main timeline
				for (var i = 0; i < settings.draggable.dropzones.length; i++) {
					if (settings.draggable.dropzones[i].hasOwnProperty ('bg_off')) {
						settings.draggable.dropzones[i].element.style.backgroundImage = 'url(' + opts.hype.resourcesFolderURL () + '/' + settings.draggable.dropzones[i].bg_off + ')';
					}
				}
				opts.hype.goToTimeInTimelineNamed (0, 'Main Timeline');
				if (matched) {
					opts.hype.startTimelineNamed (opts.incorrect_timeline);
				}
				opts.hype.startTimelineNamed (opts.reset_timeline);
			}

		}
	};

	/**
	 * Checks whether all draggable elements have been dropped on the correct
	 * dropzone and triggers the `settings.drag_completed_timeline` timeline.
	 *
	 * This is handled separately from `hypester.drag_handler()` so that the
	 * `correct_timeline` can play, followed by the `drag_completed_timeline`.
	 * Trigger this at the end of each `correct_timeline` timeline like this:
	 *
	 *     hypester.drag_completed (hypeDocument);
	 */
	self.drag_completed = function (hype) {
		if (settings.draggable_completed >= settings.draggable.elements) {
			hype.startTimelineNamed (settings.draggable.completed_timeline);
		}
	};
	
	/**
	 * Checks whether the coordinates of an object are inside of the boundaries
	 * of the specified element.
	 *
	 * To get the `coords` object, use:
	 *
	 *     var coords = event.touches
	 *         ? (event.touches[0] ? event.touches[0] : event.changedTouches[0])
	 *         : event;
	 */
	self.inside = function (coords, element) {
		if (
			coords.pageX >= element.offsetLeft && 
			coords.pageX <= element.offsetLeft + element.offsetWidth &&
			coords.pageY >= element.offsetTop &&
			coords.pageY <= element.offsetTop + element.offsetHeight
		) {
			return true;
		}
		return false;
	};

	/**
	 * Initializes template tags found in the text or value attribute of
	 * any HTML elements on the page. Tags take the form `{tag_name}`,
	 * for example:
	 *
	 *     <span>{span_text}</span>
	 *     <input type="text" value="{input_value}" />
	 *
	 * `hypester.init()` will call this so that subsequent calls to
	 * `hypester_update_elements()` or `hypester.update_element(tag, new_value)`
	 * will result in updates across all DOM nodes that should be refreshed.
	 */	
	self.init_elements = function () {
		var elements = document.getElementsByTagName ('*');
		for (var i = 0; i < elements.length; i++) {
			var $this = $(elements[i]),
				tagName = $this.prop ('tagName').toLowerCase ();
			
			switch (tagName) {
				case 'html':
				case 'head':
				case 'title':
				case 'meta':
				case 'style':
				case 'script':
				case 'link':
				case 'body':
					continue;
				case 'input':
				case 'textarea':
				case 'select':
					var text = $this.val ();
					break;
				case 'img':
					var text = $this.attr ('src');
					break;
				default:
					var text = $this // trick to get text without text of children
						.clone ()
						.children ()
						.remove ()
						.end ()
						.text ();
					break;
			}
			
			if (text.substr (0, 1) === '{' && text.substr (text.lastIndexOf ('}')) === '}') {
				var tag = text.substr (1, text.length - 2);
				elements[i].setAttribute ('data-hypester-label', tag);
			
				switch (tagName) {
					case 'input':
					case 'textarea':
					case 'select':
						$this.val (hypester_labels[tag]);
						break;
					case 'img':
						$this.attr ('src', hypester_labels[tag]);
					default:
						$this.text (hypester_labels[tag]);
				}
			}
		}
	};

	/**
	 * Update all tags across all HypesterElement objects, which will refresh
	 * the value of each element with a template tag found in its inner text or
	 * value attribute (depending on the tag type). Input, select and textarea are
	 * the three that have their value attribute set. The rest replace their
	 * inner text.
	 */
	self.update_elements = function () {
		$('[data-hypester-label]').each (function () {
			var $this = $(this),
				tagName = $this.prop ('tagName').toLowerCase ();

			switch (tagName) {
				case 'input':
				case 'textarea':
				case 'select':
					$this.val (hypester_labels[$this.data ('hypester-label')]);
					break;
				case 'img':
					$this.attr ('src', hypester_labels[$this.data ('hypester-label')]);
				default:
					$this.text (hypester_labels[$this.data ('hypester-label')]);
			}
		});
	};

	/**
	 * Update an individual tag across all HypesterElement objects, which will
	 * update any elements with template tags found in their text or value
	 * attribute (depending on the tag type). Input, select and textarea are
	 * the three that have their value attribute set. The rest replace their
	 * inner text.
	 */
	self.update_element = function (tag, new_value) {
		hypester_labels[tag] = new_value;

		$('[data-hypester-label="' + tag + '"]').each (function () {
			var $this = $(this),
				tagName = $this.prop ('tagName').toLowerCase ();
		
			switch (tagName) {
				case 'input':
				case 'textarea':
				case 'select':
					if (! $this.is (':focus')) {
						$this.val (new_value);
					}
					break;
				case 'img':
					$this.attr ('src', new_value);
					break;
				default:
					$this.text (new_value);
			}
		});
	};
	
	return self;
})(jQuery);