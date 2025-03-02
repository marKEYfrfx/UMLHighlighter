/**
 * @file uml_highlighter.ts
 * @author Mark Ackerman
 * @email markeyhackerman@gmail.com
 * @description Draw.io Plugin to apply styling’s to differentiate the semantic meaning of text in a class diagram
 */

// Extend the Cell interface to include properties we use in our plugin.

Draw.loadPlugin((editorUi) => {
    editorUi.parseXml("UMLHighlighter=UML Highlighter");

    const cellRegex =
      /<[^>]*>|[a-zA-Z0-9]+\[[^\]]*\]|[^< >,!?+\-:\(\)]+|[<>,!?+\-:\(\)]/g;

    const beforeVar = ['<font face="Helvetica">', '<b>', '<font style="color: rgb(0, 0, 255);">'];
    const aferVar = ['</font>', '</b>', '</font>'];
    const beforeType = ['<font face="Courier New">', '<b>', '<font style="color: rgb(0,0,0);">'];
    const aferType = ['</font>', '</b>', '</font>'];

    function parseMethod(methodCell: Cell): void {
        const graph: max.Graph | any = editorUi.editor.graph;
        const model: max.GraphDataModel = graph.model;

        const cellLabel : string = graph.getLabel(methodCell);
        const rawMatches = (cellLabel || "").match(cellRegex) as string[] | null;
        const methodTokens: string[] = (rawMatches ?? []).filter(
            (t) => t.charAt(0) !== "<"
        );

        console.log("methodTokens:" + methodTokens);
        const updatedMethodTokens: string[] = [];
        // States for method parsing.
        const states: string[] = ["q0", "q1", "q2", "q3", "q4", "q5", "q6"];
        let curState: string = states[0];

        while (methodTokens.length > 0) {
            let curToken: string = methodTokens.shift() as string;

            switch (curState) {
                case states[0]:
                    if (curToken === "(") {
                        curState = states[1];
                    } else {
                        updatedMethodTokens.push(curToken);
                        updatedMethodTokens.push(" ");
                        curToken = methodTokens.shift() as string;
                    }
                    updatedMethodTokens.push(curToken);
                    break;

                case states[1]:
                    if (curToken === ")") {
                        curState = states[3];
                        updatedMethodTokens.push(curToken);
                    } else {
                        updatedMethodTokens.push(curToken);
                        curState = states[2];
                    }
                    break;

                case states[2]:
                    if (curToken === ",") {
                        curState = states[6];
                        updatedMethodTokens.push(curToken);
                        updatedMethodTokens.push(" ");
                    } else if (curToken === ")") {
                        curState = states[3];
                        updatedMethodTokens.push(curToken);
                    } else {
                        updatedMethodTokens.push(" ");
                        updatedMethodTokens.push(curToken);
                        curState = states[5];
                    }
                    break;

                case states[3]:
                    curState = states[4];
                    updatedMethodTokens.push(curToken);
                    break;

                case states[4]:
                    updatedMethodTokens.push(" ");
                    updatedMethodTokens.push(curToken);
                    break;

                case states[5]:
                    if (curToken === ",") {
                        curState = states[6];
                    } else if (curToken === ")") {
                        curState = states[3];
                    }
                    updatedMethodTokens.push(curToken);
                    break;

                case states[6]:
                    if (curToken === ")") {
                        curState = states[3];
                    }
                    updatedMethodTokens.push(curToken);
                    curState = states[2];
                    break;
            }
        }
        // Update the cell value with the new tokens.
        model.setValue(methodCell, updatedMethodTokens.join(""));
    }

    function parseField(fieldCell: max.Cell): void {
        const graph : any = editorUi.editor.graph;
        const model : max.GraphDataModel = graph.model;

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

    function parseClassMembers(memberCells: max.Cell[]): void {
        const graph = editorUi.editor.graph;
        const model = graph.model;

        if (memberCells != null) {
            memberCells.forEach((member: max.Cell) => {
                let memStyle : max.CellStyle = member.getStyle();
                let styles : string = memStyle.baseStyleNames;
                if (styles.includes('childLayout')) {
                    parseClassMembers(member.children || []);
                } else if (memStyle.style("line")) {
                    parseMethod(member);
                } else {
                    parseField(member);
                    let tempStyle = member.style;
                    if (tempStyle.includes("autosize")) {
                        model.setStyle(
                            member,
                            tempStyle.replace("autosize=0", "autosize=1")
                        );
                    } else {
                        if (!tempStyle.endsWith(";")) {
                            tempStyle += ";";
                        }
                        model.setStyle(member, tempStyle + "autosize=1;");
                    }
                }
            });
        }
    }

    editorUi.actions.addAction("UMLHighlighter", () => {
        const graph: Graph = editorUi.editor.graph;
        const model: GraphModel = graph.model;
        const root: Cell = model.cells["1"] as Cell;

        model.beginUpdate();
        console.log("update");
        try {
            if (root && root.children) {
                root.children.forEach((cell: Cell) => {
                    if (cell.style.includes("stackLayout")) {
                        parseClassMembers(cell.children || []);
                    }
                });
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
