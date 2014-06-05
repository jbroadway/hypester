# Hypester

**Status: Alpha**

A JavaScript library to help with common forms of interactivity in the Tumult Hype HTML5 editor.

Note: Requires [jQuery 1.8+](http://jquery.com)

## Setup

1. Include jQuery in your Hype resource library
2. Include hypester.js in your Hype resource library
3. Call the appropriate functions below

## Features

### Initializing a new scene

To initialize a new scene, create a timeline action on the first frame that calls
this function with your scene settings:

```javascript
hypester.init ({
	hype: hypeDocument,                 // a copy of the hypeDocument object
	hidden_elements: 2,                 // how many hidden elements to find in the scene
	alert_timeline: 'alert-incomplete', // the timeline of the alert message
	next_scene: 'next',                 // the next scene to load
	completed: false                    // mark the activity not completed
});
```

This does several things:

1. If a `#scene-name` hash is added to the end of a URL, it will jump to that scene immediately.
2. Initializes the number of hidden elements to find in the scene, for use with `hypester.next()`.
3. Initializes the scene history for dynamic "Previous" buttons in branching scenes.

If no hidden elements are present in the scene, the defaults should not cause any
behaviour issues for other scene types. Alternately, you can use the shorter form
of the function call like this:

```javascript
hypester.init ({hype: hypeDocument});
```

### Navigating to a specific scene from another file

To send a user to a specific scene within a Hype file, make sure the file you're
navigating to uses the `hypester.init()` function in the first scene, then link
to it with the scene name in the URL's inner anchor value, like this:

```
my-hype-activity.html#scene-name
```

### Triggering the next scene

To trigger the next scene, while ensuring all elements were clicked and/or the
activity has been marked completed, attach a callback action to the "Next" button
that calls this function:

```javascript
hypester.next (hypeDocument);
```

### Marking the scene completed

Trigger this when the activity has been completed so `hypester.next()` knows to
continue to the next scene.

```javascript
hypester.completed ();
```

### Marking a hidden element as clicked

To mark a hidden element as clicked, call this in a callback function on the mouse
click event for each element, numbering them from 0 to 11 (instead of 1 to 12):

```javascript
hypester.clicked (0);
```

### Go to the previous scene in a branching scenario

To go to the previous scene in the history of a branching scenario, attach a
callback action to your "Previous" button that calls this function:

```javascript
hypester.previous (hypeDocument);
```

-----

Brought to you by [The Campfire Union](https://www.campfireunion.com)
