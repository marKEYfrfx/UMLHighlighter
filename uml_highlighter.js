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
					class_cell.style = class_cell.style + "fillColor=#f8cecc;strokeColor=#b85450;"
					model.setValue(class_cell, graph.getLabel(class_cell));
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
