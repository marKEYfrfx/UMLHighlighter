/**
 * @file uml_highlighter.ts
 * @author Mark Ackerman
 * @email markeyhackerman@gmail.com
 * @description Draw.io Plugin to apply styling’s to differentiate the semantic meaning of text in a class diagram
 */

// Extend the Cell interface to include properties we use in our plugin.

Draw.loadPlugin((editorUi) => {
    const view : DrawioUI = editorUi;
    const editor : DrawioEditor = view.editor;
    const graph : DrawioGraph = editor.graph;
    const model : DrawioGraphModel = graph.model;

    mxResources.parse("UMLHighlighter=UML Highlighter");

    const cellRegex =
      /<[^>]*>|[a-zA-Z0-9]+\[[^\]]*\]|[^< >,!?+\-:\(\)]+|[<>,!?+\-:\(\)]/g;

    const beforeVar = ['<font face="Helvetica">', '<b>', '<font style="color: rgb(0, 0, 255);">'];
    const aferVar = ['</font>', '</b>', '</font>'];
    const beforeType = ['<font face="Courier New">', '<b>', '<font style="color: rgb(0,0,0);">'];
    const aferType = ['</font>', '</b>', '</font>'];

    function parseMethod(methodCell: DrawioCell): void {
        const cellLabel : string = graph.getLabel(methodCell);
        console.log(cellLabel);
        const rawMatches = (cellLabel || "").match(cellRegex) as string[];
        console.log(rawMatches);
        const methodTokens: string[] = (rawMatches).filter(
            (t) => t.charAt(0) !== "<"
        );

        console.log("methodTokens:" + methodTokens);
        const updatedMethodTokens: string[] = [];

        // States for method parsing.
        const states: string[] = ["q0", "q1", "q2", "q3", "q4", "q5", "q6"];
        let curState: string = states[0];

        methodTokens.forEach((curToken : string) => {
			switch (curState) {
				case states[0]:
					if (curToken === "(") {
                        updatedMethodTokens.push(curToken);
						curState = states[1];
					} else {
						updatedMethodTokens.push(curToken);
                        updatedMethodTokens.push(" ");
					}
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
						updatedMethodTokens.push(" ")
					} else if (curToken === ")"){
						curState = states[3];
						updatedMethodTokens.push(curToken)
					}
					else {
						updatedMethodTokens.push(" ")
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
					updatedMethodTokens.push(" ");
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
					updatedMethodTokens.splice(updatedMethodTokens.length, 0, ...beforeType);
					updatedMethodTokens.push(curToken);
					updatedMethodTokens.splice(updatedMethodTokens.length, 0, ...aferType);
					curState = states[2]
					break;
			}
		});
        console.log(updatedMethodTokens);
        // Update the cell value with the new tokens.
        model.setValue(methodCell, updatedMethodTokens.join(""));
    }

    function parseField(fieldCell: DrawioCell): void {
        const fieldTokens = (fieldCell.value?.match(cellRegex) || []).filter(
            (token: string) => token.charAt(0) !== "<"
        );
        const scopeIdx = fieldTokens.findIndex(
            (token: string) => token === "+" || token === "-"
        );
        const colonIdx = fieldTokens.findIndex((token: string) => token === ":");

        // Re-inject style tokens.
        fieldTokens.splice(fieldTokens.length, 0, ...aferType);
        fieldTokens.splice(colonIdx + 1, 0, ...beforeType);
        fieldTokens.splice(colonIdx, 0, ...aferVar);
        fieldTokens.splice(scopeIdx + 1, 0, ...beforeVar);

        model.setValue(fieldCell, fieldTokens.join(" "));
    }

	function parseClassMembers(memberCells : DrawioCell[]) {
		if (memberCells != null) {
			let memberFunc = (cell : DrawioCell) => parseField(cell);
			memberCells.forEach(function (member) {
				if (member.style.includes("line")) {
					memberFunc = (cell) => parseMethod(cell);
				} else {
					memberFunc(member);
					var tempStyle = member.style;
					if (tempStyle.includes("autosize")){
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

    editorUi.actions.addAction("UMLHighlighter", () => {
        const root: DrawioCell = model.cells["1"] as DrawioCell;

        model.beginUpdate();
        console.log("update");
        try {
            if (root && root.children) {
                root.children.forEach((cell: DrawioCell) => {
                    if (cell.style.includes("stackLayout")) {
                        parseClassMembers(cell.children || []);
                    }
                });
                graph.refresh();
                graph.autoSizeCell(root, true);
            }
        } finally {
            model.endUpdate();
        }
    });
    const menu = editorUi.menus.get("extras");
    const oldFunct = menu.funct;
    menu.funct = function (menuParam: any, parent: any) {
        oldFunct.apply(this, arguments);
        editorUi.menus.addMenuItems(menuParam, ["-", "UMLHighlighter"], parent);
    };
});
