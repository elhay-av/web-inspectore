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
		idCounter = 0,
		chiledPositions = {},
		dragHelper = {
			isInDrag: false,
			$origEl: '',
			$shaddowEl: '',
			elId: '',
			$hoverOn: '',
			hasChildes: false
		};

	function getColorByName(name) {
		var charCode = '';

		if (colors[name]) {
			return colors[name];
		}
		for (var i in name) {
			charCode += name.charCodeAt(i);
		}

		return (colors[name]) ? colors[name] : colors[name] = '#' + ('000000' + charCode.toString(16)).slice(-6);
	}

	function getBgColorByIndex(index) {
		return config.hoverColorTpl.replace('{OPACITY}', '' + (1 + parseInt(index) * 10));
	}

	function onMouseDown(event) {
		event.stopPropagation();

		cacheNodes.inspector.addEventListener('mouseup', moseUp);
		cacheNodes.inspector.addEventListener('mousemove', onMouseMove);

		dragHelper.elId = event.target.getAttribute('i-id');
		dragHelper.$origEl = connections[dragHelper.elId].inspect;
		dragHelper.$shaddowEl = dragHelper.$origEl.cloneNode(true);

		dragHelper.$origEl.classList.add('original-while-dragging');
		dragHelper.$shaddowEl.classList.add('active-drag');
		cacheNodes.inspector.appendChild(dragHelper.$shaddowEl);
		cacheNodes.inspector.classList.add('in-drag');

		attacheElToMouse(dragHelper.$shaddowEl, event);

		return false;
	}

	function attacheElToMouse(el, event){
		el.style.top = event.y - cacheNodes.inspectorPosition.top - 20 + 'px';
		el.style.left = event.x - 20 + 'px';
	}

	function onMouseMove(event) {
		if(!dragHelper.isInDrag){
			dragHelper.isInDrag = true;
			clearHoverState(document.getElementsByClassName('hover'));
		}
		attacheElToMouse(dragHelper.$shaddowEl, event);

		if(dragHelper.hasChildes){
			gelLeftHoverIndex(event);
		}
	}

	function clearLastDrag(){
		cacheNodes.inspector.removeEventListener('mouseup', moseUp);
		cacheNodes.inspector.removeEventListener('mousemove', onMouseMove);

		if(cacheNodes.inspector.classList.contains('in-drag')){
			cacheNodes.inspector.classList.remove('in-drag');
		}

		if(dragHelper.$origEl.classList.contains('original-while-dragging')) {
			dragHelper.$origEl.classList.remove('original-while-dragging');
		}

		dragHelper.$shaddowEl.remove();

		chiledPositions = {};
		dragHelper = {
			isInDrag: false,
			$origEl: '',
			$shaddowEl: '',
			elId: '',
			$hoverOn: '',
			hasChildes: false
		};
	}

	function moseUp(event) {
		var hoverElId;

		// calculate elements new position
		if(!dragHelper.$hoverOn) {
			clearLastDrag();
			return;
		}

		hoverElId = dragHelper.$hoverOn.getAttribute('i-id');

		if(hoverElId == dragHelper.elId){
			clearLastDrag();
			return;
		}

		if (dragHelper.$hoverOn.classList.contains('drag-hover-left')) {
			connections[ hoverElId ].el.parentNode.insertBefore(connections[dragHelper.elId].el, connections[ hoverElId ].el);
		} else {
			connections[ hoverElId ].el.appendChild(connections[dragHelper.elId].el);
		}

		clearLastDrag();

		treeBuilder('', document.body.parentNode, 0);
	}

	function onHover(event) {

		if (dragHelper.isInDrag) {
			beforeDropHover(event)
		}

		return normalHover(event);
	}

	function clearHoverState($elList){
		var whileIndex = 0;
		while (whileIndex < $elList.length) {
			if (!$elList.length) {
				break;
			}

			connections[$elList[whileIndex].getAttribute('i-id')].el.style.backgroundColor = '';
			$elList[whileIndex].classList.remove('hover');
			whileIndex++;
		}
	}

	function normalHover(event) {
		var oldHover = [], whileIndex = 0,
			$element = event.target,
			elId = $element.getAttribute('i-id');

		if (!elId) {
			return true;
		}
		if (!$element.parentNode.classList.contains('hover')) {
			oldHover = document.getElementsByClassName('hover');
		} else if (!$element.classList.contains('hover')) {
			oldHover = $element.parentNode.getElementsByClassName('hover');
		}

		clearHoverState(oldHover);

		$element.classList.add('hover');
		connections[$element.getAttribute('i-id')].el.style.backgroundColor = getBgColorByIndex($element.getAttribute('i-child'));
		return false;
	}

	function beforeDropHover(event) {
		var whileIndex = 0,
			$elList = [];
		$elList = $elList.concat([].slice.call(document.getElementsByClassName('drag-hover')));

		$elList = $elList.concat([].slice.call(document.getElementsByClassName('drag-hover-left')));

		while (whileIndex < $elList.length) {
			if (!$elList.length) {
				break;
			}

			if($elList[whileIndex].classList.contains('drag-hover')) {
				$elList[whileIndex].classList.remove('drag-hover');
			}
			if($elList[whileIndex].classList.contains('drag-hover-left')) {
				$elList[whileIndex].classList.remove('drag-hover-left');
			}
			whileIndex++;
		}

		if(event.target.childNodes.length > 1){
			// calculate position inside element
			dragHelper.hasChildes = true;
			calculateChildsPosition(event.target);
			gelLeftHoverIndex(event);
		} else {
			dragHelper.hasChildes = false;
			event.target.classList.add('drag-hover');
			dragHelper.$hoverOn = event.target;
		}
	}

	function gelLeftHoverIndex(event){
		var i = 0,
			shaddowElLeft = dragHelper.$shaddowEl.getBoundingClientRect().left,
			elementId = event.target.getAttribute('i-id');

		while(i < chiledPositions[elementId].length){
			if(i == 0 && chiledPositions[elementId][i].left > shaddowElLeft && event.target.childNodes[i+1].getAttribute('i-id') != dragHelper.elId){
				dragHelper.$hoverOn = event.target.childNodes[i+1];
				dragHelper.$hoverOn.classList.add('drag-hover-left');
				break;
			}
			if(chiledPositions[elementId][i].left > shaddowElLeft &&
				chiledPositions[elementId][i - 1].left < shaddowElLeft &&
				event.target.childNodes[i+1].getAttribute('i-id') != dragHelper.elId ){
				dragHelper.$hoverOn = event.target.childNodes[i+1];
				dragHelper.$hoverOn.classList.add('drag-hover-left');
				break;
			}
			i++;
		}
	}

	function calculateChildsPosition($element){
		var i = 0,
			$elements = $element.childNodes,
			elementId = $element.getAttribute('i-id');

		if(chiledPositions[elementId]){
			return;
		}

		chiledPositions[elementId] = [];
		while(i < $elements.length){
			var elId = $elements[i].getAttribute('i-id');

			if(elId){
				chiledPositions[elementId].push($elements[i].getBoundingClientRect());
			}
			i++;
		}

	}

	function createInspector() {
		cacheNodes.inspector = document.createElement('div');
		cacheNodes.inspector.id = config.inspectorId;
		document.body.appendChild(cacheNodes.inspector);
		cacheNodes.inspectorPosition = cacheNodes.inspector.getBoundingClientRect();
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
				treeBuilder(elementId, $childs[i], treePosition + 1);
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
			innerText.classList.add('i-text');

			innerText.appendChild(document.createTextNode($element.nodeName));

			if (!parentId) {
				connections[id].inspect.classList.add('not-draggable');
			}
			connections[id].inspect.style.backgroundColor = getColorByName($element.nodeName);
			connections[id].inspect.classList.add('i-element');
			connections[id].inspect.appendChild(innerText);
		}

		attachEvents(connections[id].inspect);
		connections[id].inspect.setAttribute('i-child', treePosition);
		$parent.appendChild(connections[id].inspect);
	}

	function attachEvents($element) {

		$element.removeEventListener('mouseover', onHover);
		$element.addEventListener('mouseover', onHover);
		$element.removeEventListener('mousedown', onMouseDown);
		$element.addEventListener('mousedown', onMouseDown);

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