/**
 * Created by elhay on 25/12/2015.
 */

(function () {
	'use strict';

	var config = {
		inspectorId: 'inspector',
		excludedTags: ['link', 'style', 'script']
	},
	cacheNodes = {},
	connections = {},
	idCounter = 0;

	// TODO: Tag color selector

	// TODO: inline style

	// TODO: handle hover events

	function createInspector(){
		cacheNodes.inspector = document.createElement('div');
		cacheNodes.inspector.id = config.inspectorId;
		document.body.appendChild(cacheNodes.inspector);
	}
	function treeBuilder(parentId, $parent){
		var $childs = $parent.childNodes;

		for(var i in $childs){
			var elementId;

			if(!$childs[i].attributes){
				continue;
			}
			if(config.excludedTags.indexOf($childs[i].nodeName.toLowerCase()) > -1){
				continue;
			}
			if($childs[i].id === config.inspectorId){
				continue;
			}

			elementId = $childs[i].getAttribute('i-id');

			if(!elementId){
				elementId = $childs[i].nodeName + (idCounter ++);
				$childs[i].setAttribute('i-id', elementId);
			}

			addElement(parentId, $childs[i], elementId);

			if($childs[i].childNodes){
				treeBuilder(elementId, $childs[i]);
			}
		}
	}
	function addElement(parentId, $element, id){
		var $parent = (parentId)? connections[parentId].inspect: cacheNodes.inspector,
			innerText;

		if(!connections[id]){
			connections[id] = {
				inspect: document.createElement('div'),
				el: $element
			};
			connections[id].inspect.setAttribute('i-id', id);

			// text tag
			innerText = document.createElement('div');
			innerText.setAttribute('class', 'i-text');
			innerText.appendChild(document.createTextNode($element.nodeName));

			connections[id].inspect.setAttribute('class', 'i-element');
			connections[id].inspect.appendChild(innerText);
		}
		$parent.appendChild(connections[id].inspect);
	}
	function init() {
		createInspector();
		treeBuilder('', document.body);
		console.log(connections);
	}

	init();
})();