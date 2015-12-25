/**
 * Created by elhay on 25/12/2015.
 */

(function () {
	'use strict';

	var config = {
			inspectorId: 'inspector',
			excludedTags: ['link', 'style', 'script', 'head'],
			hoverColorTpl: 'rgba(00,255,00, .{OPACITY})'
		},
		cacheNodes = {},
		connections = {},
		colors = {},
		idCounter = 0;

	function getColorByName(name) {
		var charCode = '';

		if(colors[name]){
			return colors[name];
		}
		for(var i in name){
			charCode += name.charCodeAt(i);
		}

		return (colors[name])? colors[name]: colors[name] = '#' + ('000000' + charCode.toString(16)).slice(-6);
	}

	function getBgColorByIndex(index){
		return config.hoverColorTpl.replace('{OPACITY}', '' + (1 + parseInt(index) * 10));
	}

	// TODO: inline style

	// TODO: drag & drop 

	function onHover(event){
		var oldHover = [], whileIndex = 0,
			$element = event.target,
			elId = $element.getAttribute('i-id');

		if(!elId){
			return true;
		}
		if(!$element.parentNode.classList.contains('hover')) {
			oldHover = document.getElementsByClassName('hover');
		} else if(!$element.classList.contains('hover')){
			oldHover = $element.parentNode.getElementsByClassName('hover');
		}
		while(whileIndex < oldHover.length) {
			if(!oldHover.length){break;}

			connections[oldHover[ whileIndex ].getAttribute('i-id')].el.style.backgroundColor = '';
			oldHover[ whileIndex ].classList.remove('hover');
			whileIndex++;
		}

		$element.classList.add('hover');
		connections[$element.getAttribute('i-id')].el.style.backgroundColor = getBgColorByIndex($element.getAttribute('i-child'));
		return false;
	}

	function createInspector() {
		cacheNodes.inspector = document.createElement('div');
		cacheNodes.inspector.id = config.inspectorId;
		document.body.appendChild(cacheNodes.inspector);
	}

	function treeBuilder(parentId, $parent, treePosition) {
		var $childs = $parent.childNodes;

		for (var i in $childs) {
			var elementId;

			if (!$childs[i].attributes) {
				continue;
			}
			if (config.excludedTags.indexOf($childs[i].nodeName.toLowerCase()) > -1) {
				continue;
			}
			if ($childs[i].id === config.inspectorId) {
				continue;
			}

			elementId = $childs[i].getAttribute('i-id');

			if (!elementId) {
				elementId = $childs[i].nodeName + (idCounter++);
				$childs[i].setAttribute('i-id', elementId);
			}

			addElement(parentId, $childs[i], elementId, treePosition);

			if ($childs[i].childNodes) {
				treeBuilder(elementId, $childs[i], treePosition+1);
			}
		}
	}

	function addElement(parentId, $element, id, treePosition) {
		var $parent = (parentId) ? connections[parentId].inspect : cacheNodes.inspector,
			innerText;

		if (!connections[id]) {
			connections[id] = {
				inspect: document.createElement('div'),
				el: $element
			};
			connections[id].inspect.setAttribute('i-id', id);

			// text tag
			innerText = document.createElement('div');
			innerText.setAttribute('class', 'i-text');
			innerText.appendChild(document.createTextNode($element.nodeName));

			connections[id].inspect.style.backgroundColor = getColorByName($element.nodeName);
			connections[id].inspect.setAttribute('class', 'i-element');
			connections[id].inspect.appendChild(innerText);
		}

		connections[id].inspect.addEventListener('mouseover', onHover);
		connections[id].inspect.setAttribute('i-child', treePosition);
		$parent.appendChild(connections[id].inspect);
	}

	function init() {
		createInspector();
		treeBuilder('', document.body.parentNode, 0);
	}

	window.testInspect = {
		onHover: onHover
	};
	init();
})();