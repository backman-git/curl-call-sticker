// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child from 'child_process';
import { send } from 'process';


let commentID = 0;

class CurlComment implements vscode.Comment {
	id: number;
	curlText: string;

	constructor(
		public body: string,
		public mode: vscode.CommentMode,
		public author: vscode.CommentAuthorInformation,
		public parent?: vscode.CommentThread,
		public contextValue?: string
	) {
		this.id = commentID++;
		this.curlText = body;
	}
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const commentController = vscode.comments.createCommentController('curlCommentController', 'curl comment controller');
	context.subscriptions.push(commentController);
	commentController.commentingRangeProvider = {
		provideCommentingRanges(document: vscode.TextDocument, token: vscode.CancellationToken) {
			const lineCount = document.lineCount;
			return [new vscode.Range(0, 0, lineCount - 1, 0)];
		},
	};

	// create a request
	context.subscriptions.push(vscode.commands.registerCommand('curl-call-sticker.createQuery', (reply: vscode.CommentReply) => {
		const thread = reply.thread;
		const exeComment = reply.text;

		var response=sendCurlCommand(exeComment);

		const newRequestComment = new CurlComment(exeComment, vscode.CommentMode.Preview, { name: 'Request' }, thread);
		const newResponseComment = new CurlComment(response, vscode.CommentMode.Preview, { name: 'Response' }, thread);
		thread.comments = [...thread.comments, newRequestComment];
		thread.comments = [...thread.comments, newResponseComment];
	}));

	//delete a request
	context.subscriptions.push(vscode.commands.registerCommand('curl-call-sticker.deleteQuery', (comment: CurlComment) => {

		const thread = comment.parent;
		if (!thread) {
			return;
		}
		thread.comments =  thread.comments.filter(cmt => (cmt as CurlComment).id !== comment.id && (cmt as CurlComment).id!==comment.id+1);
		if (thread.comments.length === 0) {
			thread.dispose();
		}


	}));



	//edit a request
	context.subscriptions.push(vscode.commands.registerCommand('curl-call-sticker.editQuery', (comment: CurlComment) => {
		if (!comment.parent) {
			return;
		}



	}));


	context.subscriptions.push(vscode.commands.registerCommand('curl-call-sticker.updateQuery', (reply: vscode.CommentReply) => {
		const thread = reply.thread;
		const exeComment = reply.text;
		const newRequestComment = new CurlComment(exeComment, vscode.CommentMode.Preview, { name: 'Request' }, thread);

		// curl a thing
		var response: string;
		child.exec(exeComment, (err, stdout, stderr) => {

			if (err) {
				console.log(err);
				return;
			}
			response = stdout;
			const newResponseComment = new CurlComment(response, vscode.CommentMode.Preview, { name: 'Response' }, thread);
			thread.comments = [...thread.comments, newResponseComment];
		});





		thread.comments = [...thread.comments, newRequestComment];
	}));





}

// This method is called when your extension is deactivated
export function deactivate() { }



function sendCurlCommand (req:string):string{
	let response = child.execSync(req);
	return response.toString();
}