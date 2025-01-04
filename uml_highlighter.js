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
			// Queue used to fix ancestor placeholders
			var queue = [];	

			for (var id in model.cells)
			{
				var cell = model.cells[id];
				let cell_style = cell.style
				if (cell_style != null)
				{
					if (cell_style.includes("childLayout"))
						{
							console.log(cell.value)
						}
				}
				var label = graph.getLabel(cell);
				queue.push({cell: cell, label: label});
			}
			
			for (var i = 0; i < queue.length; i++)
			{
				model.setValue(queue[i].cell, queue[i].label);
			}
		}
		finally
		{
			model.endUpdate();
		}
	});
	
	var menu = editorUi.menus.get('extras');
	var oldFunct = menu.funct;
	
	menu.funct = function(menu, parent)
	{
		oldFunct.apply(this, arguments);
		
		editorUi.menus.addMenuItems(menu, ['-', 'UMLHighlighter'], parent);
	};

});
