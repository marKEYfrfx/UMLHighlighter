/**
 * Explore plugin.
 */
Draw.loadPlugin(function(editorUi)
{
	
	// Adds resource for action
	mxResources.parse('UMLHighlighter=UML Highlighter');

	// Adds action
	editorUi.actions.addAction('UMLHighlighter', function()
	{
		var graph = editorUi.editor.graph;
		var model = graph.model;
		
		model.beginUpdate();
		try
		{
			let class_names = new Array();
			let class_fields = new Array();
			for (var id in model.cells)
			{
				var cell = model.cells[id];
				let cell_style = cell.style;
				if (cell_style != null)
				{
					if (cell_style.includes("childLayout"))
						{
							class_names.push(cell)
						}
				}
			}
			console.log(class_names)
			class_names.forEach(function(class_cell)
				{
					class_cell.style = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fontFamily=Courier New;fillColor=#f5f5f5;fontColor=#333333;strokeColor=#666666;"
					model.setValue(class_cell, graph.getLabel(class_cell));
					class_fields.push(class_cell.children)
				}
			)
			console.log(class_fields)
			class_fields.forEach(function(field_set)
			{
				if(field_set != null)
					{
						let field_style = "text;strokeColor=#9673a6;fillColor=#e1d5e7;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;fontFamily=Times New Roman;fontStyle=0"
						field_set.forEach(function(field)
						{
							if(field.style.includes("line"))
								{
									field_style = "text;strokeColor=#82b366;fillColor=#d5e8d4;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;fontFamily=Times New Roman;fontStyle=2;"
								} else {
									field.style = field_style;
								}
								model.setValue(field, graph.getLabel(field));
						}
					)
						}
				}
		)
		}
		finally
		{
			model.endUpdate();
		}
		graph.refresh();
	});
	
	var menu = editorUi.menus.get('extras');
	var oldFunct = menu.funct;
	
	menu.funct = function(menu, parent)
	{
		oldFunct.apply(this, arguments);
		
		editorUi.menus.addMenuItems(menu, ['-', 'UMLHighlighter'], parent);
	};

});
