# Angular Walkthrough - An AngularJS directive to easily create walkthrough tours of your website. 

## Demo

To see this live, check out <http://amajedi.github.io/angular-walkthrough/>

## Tested on

* Chrome
* Firefox
* Safari
* IE 9+

## Install
	bower install angular-walkthrough --save

## Setup

Angular Walkthrough has a dependency on bootstrap for tooltip and popover.

Add dependencies:

	<link rel="stylesheet" href="bower_components/bootstrap/dist/css/bootstrap.min.css"></link>
	<link rel="stylesheet" href="bower_components/angular-walkthrough/dist/angular-walkthrough.min.css"></link>

	<script src="bower_components/jquery/jquery.js"></script>
	<script src="bower_components/angular/angular.js"></script>
	<script src="bower_components/bootstrap/dist/js/bootstrap.min.js"></script>
	<script src="bower_components/angular-walkthrough/dist/angular-walkthrough-tpls.min.js"></script>

Don't forget to add angular-walkthrough as a dependency to your angular module:

	angular.module('myApp', ['angular-walkthrough']);


## Usage

Add the "walkthrough" directive to parent element containing all steps, this is usually the body. This is where the backdrop will be placed.

Additionally, functions are exposed to programmatically perform actions such as starting/stopping the walkthrough, moving to the next/previous step, as well as checking to see if a walkthrough step is currently active. You can expose these functions onto your scope by the wtStart, wtCancel, wtNext, wtPrev, and wtActive attribute directives.

To create a step, simply add the wtStep directive to any target element specifying the step number as the value. To have multiple walkthroughs, name your walkthrough using the wtGroup directive. You can start a specific walkthrough by passing the name to the start function. To specify HTML content to go inside the popover, add the wtStepContent directive as a child of wtStep and add the content in there. If you don't want to mess with that, you can also specify text content by using the wtText directive.

To control the popover position, use wtPosition, supported values are: left, top, right, bottom.


## Customization

By using the wtStepContent directive, you define the HTML for the step's content.

You can also define your own template to use for the toolbar which displays the step number and next/finish buttons. To do this, use the non-templated version of the code and define your own template with the name "wt-popover-toolbar.html" in the $templateCache. You may also define your own CSS file.

## License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).

