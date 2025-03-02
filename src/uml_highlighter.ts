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
        const rawMatches = (cellLabel || "").match(cellRegex) as string[];
        const methodTokens: string[] = (rawMatches).filter(
            (t) => t.charAt(0) !== "<"
        );
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

    function parseStyleString(styleStr: string): Map<string, string | undefined> {
        const styleObj: Map<string, string | undefined> = new Map<string, string | undefined>();
      
        styleStr.split(';').forEach(pair => {
          const trimmedPair = pair.trim();
          if (!trimmedPair) {
            return;
          }
      
          // We may have "key=value" or just "key" (with no equals sign)
          const splitPair = trimmedPair.split('=');
          const key = splitPair[0]?.trim();
          const val = (splitPair.length > 1) ? splitPair[1]?.trim() : undefined;
      
          if (key) {
            styleObj.set(key, val);
          }
        });
        return styleObj;
      }
      

      function styleObjectToString(styleObj: Map<string, string | undefined>): string {
        const parts = Array.from(styleObj.entries()).map(([key, val]) => {
          return val === undefined ? key : `${key}=${val}`;
        });
        return parts.join(';') + ';';
      }
      

	function parseClassMembers(memberCells : DrawioCell[]) {
		if (memberCells != null) {
			let memberFunc = (cell : DrawioCell) => parseField(cell);
			memberCells.forEach(function (member) {
                let memStyle = parseStyleString(member.style);
				if (memStyle.has("line")) {
					memberFunc = (cell) => parseMethod(cell);
				} else {
                    memStyle.set("autosize", "1");
                    memStyle.set("html", "1");
                    model.setStyle(member, styleObjectToString(memStyle));
                    memberFunc(member);
				}
			}
			)
		}
	}

    editorUi.actions.addAction("UMLHighlighter", () => {
        model.beginUpdate();
        console.log("update");
        try {
            const vertices = Object.values(graph.model.cells)
            .filter((c) => graph.model.isVertex(c))
            .filter((c) => c.style.includes("stackLayout"))
            .map((c: any) => ({ id: c.id, label: graph.getLabel(c) }));
            vertices.forEach((vert) => {parseClassMembers(model.cells[vert.id].children || []);});
            graph.refresh();
            graph.autoSizeCell(model.root, true);
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
