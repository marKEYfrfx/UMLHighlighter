const cellRegex = /<[^>]*>|[^< >,!?+-:\(\)]+|[<>,!?+-:\(\)]/g;
const beforeVar = [
    "-",
    "<font face=\"Helvetica\" color=\"#3d0dff\">",
    "<b>",
    "<i>"
]
const aferVar = [
    "</i>",
    "</b>",
    "</font>"
]
const beforeType = [
    "<font face=\"Courier New\">",
    "<b>"
]
const aferType = [
    "</b>",
    "</font>"
]


function parseMethod(methodCell, graph, model) {
	let methodTokens = methodCell.value.match(cellRegex).filter(token => token.charAt(0) != '<');
	let scopeIdx = methodTokens.findIndex(token => token == "+" || token == "-");
}

function parseField(fieldCell, graph, model) {
	let fieldTokens = fieldCell.value.match(cellRegex).filter(token => token.charAt(0) != '<');
	let scopeIdx = fieldTokens.findIndex(token => token == "+" || token == "-");
	let colonIdx = fieldTokens.findIndex(token => token == ":");
	fieldTokens.splice(fieldTokens.length, 0, ...aferType);
	fieldTokens.splice(colonIdx + 1, 0, ...beforeType);
	fieldTokens.splice(colonIdx, 0, ...aferVar);
	fieldTokens.splice(scopeIdx, 0, ...beforeVar)
	console.log(fieldTokens);
	fieldCell.value = fieldTokens.join(" ");
	model.setValue(fieldCell, graph.getLabel(fieldCell));
}

function parseClassMembers(memberCells, graph, model) {
	if (memberCells != null) {
		let memberFunc = (cell, graph, model) => parseField(cell, graph, model);
		memberCells.forEach(function (member) {
			if (member.style.includes("line")) {
				memberFunc = (cell, graph, model) => parseMethod(cell, graph, model);
			} else {
				memberFunc(member, graph, model)
			}
		}
		)
	}
}

function parseClassCell(classCell, graph, model) {
	parseClassMembers(classCell.children, graph, model)
}

/**
 * Explore plugin.
 */
Draw.loadPlugin(function (editorUi) {

	// Adds resource for action
	mxResources.parse('UMLHighlighter=UML Highlighter');

	// Adds action
	editorUi.actions.addAction('UMLHighlighter', function () {
		var graph = editorUi.editor.graph;
		var model = graph.model;
		var root = model.getCell(1); //Don't know why but root sin't actually root?!??!
		model.beginUpdate();
		try {
			root.children.forEach(function (cell) {
				if (cell != null) {
					if (cell.style.includes("childLayout")) {
						parseClassCell(cell, graph, model)
					}
				}
			})
		}
		finally {
			model.endUpdate();
		}
		graph.refresh();
	});

	var menu = editorUi.menus.get('extras');
	var oldFunct = menu.funct;

	menu.funct = function (menu, parent) {
		oldFunct.apply(this, arguments);

		editorUi.menus.addMenuItems(menu, ['-', 'UMLHighlighter'], parent);
	};

});
