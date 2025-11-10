import path from 'node:path';
import {readFile,glob} from 'node:fs/promises';
import * as vscode from 'vscode';
interface Runner {
  relative_filename: string;
  full_filename: string;
  run_dir: string; // same as full_filename, except trims last leg if it is '/bin'
}
async function get_sub_workspaces(folder:string){
  try{
    const file_name=path.join(folder,'package.json')
    const content=await readFile(file_name,'utf8')
    const {workspaces} = JSON.parse(content);
    if (!Array.isArray(workspaces))
      return []
    return workspaces.filter(x=>typeof x==='string').map(x=>path.join(folder,x))
  }catch(_ex:unknown){
    return []
  }
}
function getCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";
  if (paths.length === 1) return paths[0];

  // Split each path into parts (e.g., by "/" or "\\")
  const splitPaths = paths.map(p => p.split(/[\\/]+/));

  const commonParts: string[] = [];
  const first = splitPaths[0];

  for (let i = 0; i < first.length; i++) {
    const part = first[i];
    if (splitPaths.every(p => p[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  // Join back with "/" (or use path.join for platform-specific behavior)
  return commonParts.join("/");
}
async function get_dirs(top_workspaces:string[]){

  const dirs=new Set<string>
  for (const top_workspace of top_workspaces){
    const normalized=path.normalize(top_workspace)
    dirs.add(normalized)
    for (const sub of await get_sub_workspaces(normalized)){
      dirs.add(path.normalize(sub))
    }
  }
  return [...dirs]
}

async function get_runners(top_workspaces:string[]){
  const ans:Runner[]=[]
  const common=getCommonPrefix(top_workspaces)  
  const dirs=await get_dirs(top_workspaces)
  for (const run_dir of dirs){
    for (const base of ['','bin']){
      const glob_pat=path.join(run_dir,base,'watch_*.{ts,js,mjs}')
      console.log(glob_pat)
      for await (const full_filename of glob(glob_pat)) {
        console.log(full_filename)
        const relative_filename=path.relative(common,full_filename)
        ans.push({relative_filename,full_filename,run_dir})

      }
    }
  }
  return ans
}

export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "helloworld-sample" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('WatchRunner.run',async  () => {
    const outputChannel = vscode.window.createOutputChannel("aaaWatchRunner");
    const {workspaceFolders}=vscode.workspace
    const folders=/*['c:\\yigal\\watch_runner_extension']//*/(workspaceFolders||[]).map(x=>x.uri.fsPath)
    const runners=await get_runners(folders)
    outputChannel.append(JSON.stringify({runners,folders},null,2))
    // The code you place here will be executed every time your command is executed
    
//    const ans=get_all_runners(outputChannel)
  //  const json_msg=JSON.stringify(ans,null,2)
    //outputChannel.append(json_msg)
    //vscode.window.showInformationMessage(json_msg);
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

