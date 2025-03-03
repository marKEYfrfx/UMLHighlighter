# UML Highlighter for VSCode Drawio Integration

This plugin highlights the types and variable names of UML diagrams.

## Overview

* Can highlight entire UML diagram
![Highlight Diagram](/doc/whole-diagram.gif)

* 
![Highlight Diagram](/doc/types-and-vars.gif)

## Install

![Prerequisite VSCode Drawio Integration Plugin](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)

![Download Plugin for VSCode](https://marketplace.visualstudio.com/items?itemName=MarKEYfrfx.umlhighlighter)

## Compile
Must make sure to clone with `--recursive` to ensure submodule is cloned.
```
git clone --recursive https://github.com/marKEYfrfx/UMLHighlighter.git
npm install
npm run vscode:package
```