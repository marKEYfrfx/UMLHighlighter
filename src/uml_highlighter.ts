/**
 * @file uml_highlighter.ts
 * @author Mark Ackerman
 * @email markeyhackerman@gmail.com
 * @description Draw.io Plugin to apply styling's to differentiate the semantic meaning of text in a class diagram
 */

Draw.loadPlugin((editorUi: DrawioUI) => {
  mxResources.parse("UMLHighlighter=UML Highlighter");

  const cellRegex =
    /<[^>]*>|[a-zA-Z0-9]+\[[^\]]*\]|[^< >,!?+\-:\(\)]+|[<>,!?+\-:\(\)]/g;

  const beforeVar = ['<font face="Helvetica" color="#3d0dff">', "<b>", "<i>"];
  const aferVar = ["</i>", "</b>", "</font>"];
  const beforeType = ['<font face="Courier New">', "<b>"];
  const aferType = ["</b>", "</font>"];

  function parseMethod(methodCell: DrawioCell): void {
    const graph: DrawioGraph = editorUi.editor.graph;
    const model: DrawioGraphModel = graph.model;

  // Force TS to treat these match results as string[]
  const rawMatches = methodCell.value.match(cellRegex) as string[] | null;
  const methodTokens: string[] = (rawMatches ?? []).filter(
    (t) => t.charAt(0) !== "<"
  );


    const updatedMethodTokens: string[] = [];

    // States for method parsing
    const states : string[] = ["q0", "q1", "q2", "q3", "q4", "q5", "q6"];
    let curState : string = states[0];

    while (methodTokens.length > 0 ) {
      let curToken : string = methodTokens.shift() as string;

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
            updatedMethodTokens.push(...beforeType, curToken, ...aferType);
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
            updatedMethodTokens.push(...beforeVar, curToken, ...aferVar);
            curState = states[5];
          }
          break;

        case states[3]:
          curState = states[4];
          updatedMethodTokens.push(curToken);
          break;

        case states[4]:
          updatedMethodTokens.push(" ");
          updatedMethodTokens.push(...beforeType, curToken, ...aferType);
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
          updatedMethodTokens.push(...beforeType, curToken, ...aferType);
          curState = states[2];
          break;
      }
    }

    // Update the cell value with the new tokens
    model.setValue(methodCell, updatedMethodTokens.join(""));
  }

  function parseField(fieldCell: any): void {
    const graph = editorUi.editor.graph;
    const model = graph.model;

    const fieldTokens = (fieldCell.value.match(cellRegex) || []).filter(
      (token: string) => token.charAt(0) !== "<"
    );
    const scopeIdx = fieldTokens.findIndex(
      (token: string) => token === "+" || token === "-"
    );
    const colonIdx = fieldTokens.findIndex((token: string) => token === ":");

    // Re-inject style tokens
    fieldTokens.splice(fieldTokens.length, 0, ...aferType);
    fieldTokens.splice(colonIdx + 1, 0, ...beforeType);
    fieldTokens.splice(colonIdx, 0, ...aferVar);
    fieldTokens.splice(scopeIdx + 1, 0, ...beforeVar);

    model.setValue(fieldCell, fieldTokens.join(" "));
  }

  function parseClassMembers(memberCells: any[]): void {
    const graph = editorUi.editor.graph;
    const model = graph.model;

    if (memberCells != null) {
      let memberFunc = (cell: any) => parseField(cell);

      memberCells.forEach((member: any) => {
        if (member.style.includes("line")) {
          memberFunc = (cell: any) => parseMethod(cell);
        } else {
          memberFunc(member);

          // Ensure autosize is enabled
          let tempStyle = member.style;
          if (tempStyle.includes("autosize")) {
            const tempIdx = tempStyle.indexOf("autosize=");
            model.setStyle(
              member,
              tempStyle.replace("autosize=0", "autosize=1")
            );
          } else {
            // Just append autosize if not present
            if (!tempStyle.endsWith(";")) {
              tempStyle += ";";
            }
            model.setStyle(member, tempStyle + "autosize=1;");
          }
        }
      });
    }
  }

  // Adds static button on top toolbar to process UML diagrams.
  editorUi.actions.addAction("UMLHighlighter", () => {
    const graph: DrawioGraph = editorUi.editor.graph;
    const model: DrawioGraphModel = graph.model;
    const root: DrawioCell = model.getCell(1); // Root is 1, not 0.

    model.beginUpdate();
    try {
      if (root.children) {
        root.children.forEach((cell: any) => {
          if (cell?.style?.includes("childLayout")) {
            parseClassMembers(cell.children);
          }
        });
      }
      graph.refresh();
      graph.autoSizeCell(root, true);
    } finally {
      model.endUpdate();
    }
  });

  // Add item to the "Extras" menu
  const menu = editorUi.menus.get("extras");
  const oldFunct = menu.funct;

  menu.funct = function (menuParam: any, parent: any) {
    oldFunct.apply(this, arguments);
    editorUi.menus.addMenuItems(menuParam, ["-", "UMLHighlighter"], parent);
  };
});
