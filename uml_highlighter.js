/**
 * Explore plugin.
 */
Draw.loadPlugin(function (editorUi) {

	// Adds resource for action
	mxResources.parse('UMLHighlighter=UML Highlighter');


	const cellRegex = /<[^>]*>|[^< >,!?+-:\(\)]+|[<>,!?+-:\(\)]/g;
	const beforeVar = [
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


	function parseMethod(methodCell) {
		var graph = editorUi.editor.graph;
		var model = graph.model;
		let methodTokens = methodCell.value.match(cellRegex).filter(token => token.charAt(0) != '<');
		let updatedMethodTokens = [];
		let states = ["q0", "q1", "q2", "q3", "q4", "q5", "q6"];
		curState = states[0];
		while (methodTokens.length > 0) {
			let curToken = methodTokens.shift();
			switch (curState) {
				case states[0]:
					if (curToken === "(") {
						curState = states[1];
					}
					updatedMethodTokens.push(curToken);
					break;
				case states[1]:
					if (curToken === ")") {
						curState = states[3];
						updatedMethodTokens.push(curToken);
					} else {
						updatedMethodTokens.splice(updatedMethodTokens.length, 0, ...beforeType);
						updatedMethodTokens.push(curToken);
						updatedMethodTokens.splice(updatedMethodTokens.length, 0, ...aferType);
						curState = states[2];
					}
					break;
				case states[2]:
					if (curToken === ",") {
						curState = states[6];
						updatedMethodTokens.push(curToken)
					} else if (curToken === ")"){
						curState = states[3];
						updatedMethodTokens.push(curToken)
					}
					else {
						updatedMethodTokens.splice(updatedMethodTokens.length, 0, ...beforeVar);
						updatedMethodTokens.push(curToken);
						updatedMethodTokens.splice(updatedMethodTokens.length, 0, ...aferVar);
						curState = states[5];
					}
					break;
				case states[3]:
					curState = states[4]
					updatedMethodTokens.push(curToken)
					break;
				case states[4]:
					updatedMethodTokens.splice(updatedMethodTokens.length, 0, ...beforeType);
					updatedMethodTokens.push(curToken);
					updatedMethodTokens.splice(updatedMethodTokens.length, 0, ...aferType);
					break;
				case states[5]:
					if (curToken === ",") {
						curState = states[6];
					} else if (curToken === ")") {
						curState = states[3];
					}
					updatedMethodTokens.push(curToken)
					break;
				case states[6]:
					if (curToken === ")") {
						curState = states[3]
					}
					updatedMethodTokens.push(curToken)
					break;
			}
		}
		console.log(updatedMethodTokens);
		model.setValue(methodCell, updatedMethodTokens.join(" "));
	}

	function parseField(fieldCell) {
		var graph = editorUi.editor.graph;
		var model = graph.model;
		let fieldTokens = fieldCell.value.match(cellRegex).filter(token => token.charAt(0) != '<');
		let scopeIdx = fieldTokens.findIndex(token => token == "+" || token == "-");
		let colonIdx = fieldTokens.findIndex(token => token == ":");
		fieldTokens.splice(fieldTokens.length, 0, ...aferType);
		fieldTokens.splice(colonIdx + 1, 0, ...beforeType);
		fieldTokens.splice(colonIdx, 0, ...aferVar);
		fieldTokens.splice(scopeIdx + 1, 0, ...beforeVar)
		model.setValue(fieldCell, fieldTokens.join(" "));
	}

	function parseClassMembers(memberCells) {
		var graph = editorUi.editor.graph;
		var model = graph.model;
		if (memberCells != null) {
			let memberFunc = (cell) => parseField(cell);
			memberCells.forEach(function (member) {
				if (member.style.includes("line")) {
					memberFunc = (cell) => parseMethod(cell);
				} else {
					memberFunc(member);
					var tempStyle = member.style;
					if (tempStyle.includes("autosize")){
						var tempIdx = tempStyle.indexOf("autosize=");
						model.setStyle(member, tempStyle.replace("autosize=0", "autosize=1"));
					}
					if (tempStyle.endsWith(';')){
						model.setStyle(member, tempStyle.concat("autosize=1;"));
					} else {
						model.setStyle(member, tempStyle.concat(";autosize=1;"));
					}
				}
			}
			)
		}
	}

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
						parseClassMembers(cell.children)
					}
				}
			})
			graph.refresh();
			graph.autoSizeCell(root, true);
		}
		finally {
			model.endUpdate();
		}
	});

	var menu = editorUi.menus.get('extras');
	var oldFunct = menu.funct;

	menu.funct = function (menu, parent) {
		oldFunct.apply(this, arguments);

		editorUi.menus.addMenuItems(menu, ['-', 'UMLHighlighter'], parent);
	};

});
