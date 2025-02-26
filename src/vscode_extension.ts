import { ExtensionContext } from 'vscode';
import DrawioExtensionApi from 'raw-loader!./../vscode-drawio/src/DrawioExtensionApi';
import DocumentContext from 'raw-loader!./../vscode-drawio/src/DrawioExtensionApi';
import drawio_plugin from 'raw-loader!./../dist/uml_highlighter.webpack.js';

export function activate(context: ExtensionContext) {
	let api: DrawioExtensionApi;
	api = {
		drawioExtensionV1: {
			getDrawioPlugins(context: DocumentContext) {
				return new Promise((resolve, reject) => {
					resolve([{ jsCode: drawio_plugin}]);
				})
			}
		}
	}
	return api;
};

