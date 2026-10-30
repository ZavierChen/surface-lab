using System;
using System.IO;
using System.Drawing;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle(Program.Title)]
[assembly: AssemblyDescription("Offline Calculus III surface and cross-section explorer")]
[assembly: AssemblyProduct(Program.Title)]
[assembly: AssemblyVersion("2.6.0.0")]
static class Program {
#if ENGLISH
 public const string Title="Surface Lab — Calculus III Demo";
 public const string Locale="en-US";
 public const string ProductFolder="SurfaceLabEN";
 public static string Localized(string zh,string en){return en;}
#else
 public const string Title="三维曲面实验室";
 public const string Locale="zh-CN";
 public const string ProductFolder="SurfaceLabCN";
 public static string Localized(string zh,string en){return zh;}
#endif
 public static string AppRoot;
 public static string SelfTest;
 [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool SetDllDirectory(string path);
 [STAThread] static void Main(string[] args){
  Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
  try{
   byte[] html=ReadResource("surface.html");string version;
   using(var hash=SHA256.Create())version=BitConverter.ToString(hash.ComputeHash(html)).Replace("-","").Substring(0,16);
   AppRoot=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),Program.ProductFolder,"app-"+version);
   Directory.CreateDirectory(AppRoot);
   WriteIfDifferent(Path.Combine(AppRoot,"surface.html"),html);
   WriteIfDifferent(Path.Combine(AppRoot,"WebView2Loader.dll"),ReadResource("WebView2Loader.dll"));
   WriteIfDifferent(Path.Combine(AppRoot,"WebView2-LICENSE.txt"),ReadResource("WebView2-LICENSE.txt"));
   WriteIfDifferent(Path.Combine(AppRoot,"WebView2-NOTICE.txt"),ReadResource("WebView2-NOTICE.txt"));
   SetDllDirectory(AppRoot);
   AppDomain.CurrentDomain.AssemblyResolve+=(sender,e)=>{string name=new AssemblyName(e.Name).Name+".dll";if(name=="Microsoft.Web.WebView2.Core.dll"||name=="Microsoft.Web.WebView2.WinForms.dll")return Assembly.Load(ReadResource(name));return null;};
   if(args.Length==2&&args[0]=="--self-test")SelfTest=Path.GetFullPath(args[1]);
   Run();
  }catch(Exception ex){if(SelfTest!=null){Directory.CreateDirectory(SelfTest);File.WriteAllText(Path.Combine(SelfTest,"error.txt"),ex.ToString());Environment.ExitCode=1;}else MessageBox.Show(Program.Localized("启动失败：","Unable to start: ")+ex.Message,Program.Title,MessageBoxButtons.OK,MessageBoxIcon.Error);}
 }
 [MethodImpl(MethodImplOptions.NoInlining)] static void Run(){Application.Run(new LabWindow());}
 public static byte[] ReadResource(string name){using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream(name)){if(stream==null)throw new Exception(Program.Localized("缺少程序资源：","Missing resource: ")+name);using(var memory=new MemoryStream()){stream.CopyTo(memory);return memory.ToArray();}}}
 static void WriteIfDifferent(string file,byte[] data){if(File.Exists(file)){byte[] existing=File.ReadAllBytes(file);if(existing.Length==data.Length){bool equal=true;for(int i=0;i<data.Length;i++)if(existing[i]!=data[i]){equal=false;break;}if(equal)return;}}File.WriteAllBytes(file,data);}
}
sealed class LabWindow:Form {
 WebView2 web;Label loading;
 public LabWindow(){
  Text=Program.Title;ClientSize=new Size(1440,920);MinimumSize=new Size(1000,700);StartPosition=FormStartPosition.CenterScreen;BackColor=Color.FromArgb(11,19,33);AutoScaleMode=AutoScaleMode.Dpi;
  using(var iconStream=new MemoryStream(Program.ReadResource("app.ico")))Icon=new Icon(iconStream);
  loading=new Label{Dock=DockStyle.Fill,Text=Program.Localized("正在打开三维曲面实验室…","Opening Surface Lab…"),ForeColor=Color.FromArgb(118,228,208),TextAlign=ContentAlignment.MiddleCenter,Font=new Font("Microsoft YaHei UI",16)};Controls.Add(loading);
  web=new WebView2{Dock=DockStyle.Fill,DefaultBackgroundColor=BackColor};Controls.Add(web);web.BringToFront();Shown+=async(sender,e)=>await Start();
  if(Program.SelfTest!=null){ShowInTaskbar=false;WindowState=FormWindowState.Minimized;}else WindowState=FormWindowState.Maximized;
 }
 async Task Start(){try{
  var options=new CoreWebView2EnvironmentOptions();options.Language=Program.Locale;
  string profile=Program.SelfTest!=null?Path.Combine(Program.SelfTest,"profile"):Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),Program.ProductFolder,"profile");
  var env=await CoreWebView2Environment.CreateAsync(null,profile,options);await web.EnsureCoreWebView2Async(env);
  web.CoreWebView2.Settings.AreDefaultContextMenusEnabled=false;web.CoreWebView2.Settings.IsStatusBarEnabled=false;
  web.CoreWebView2.NewWindowRequested+=(sender,e)=>{e.Handled=true;Uri uri;if(Uri.TryCreate(e.Uri,UriKind.Absolute,out uri)&&(uri.Scheme=="https"||uri.Scheme=="http"))System.Diagnostics.Process.Start(uri.AbsoluteUri);};
  web.CoreWebView2.NavigationCompleted+=async(sender,e)=>{if(!e.IsSuccess){Fail(new Exception(Program.Localized("页面加载失败：","Unable to load the page: ")+e.WebErrorStatus));return;}loading.Hide();if(Program.SelfTest!=null)await Test();};
  web.CoreWebView2.Navigate(new Uri(Path.Combine(Program.AppRoot,"surface.html")).AbsoluteUri);
 }catch(Exception ex){Fail(ex);}}
 async Task Test(){try{
  Directory.CreateDirectory(Program.SelfTest);
  for(int i=0;i<150;i++){if(await web.CoreWebView2.ExecuteScriptAsync("Boolean(window.__lastResult)")=="true")break;await Task.Delay(200);}
  string initial=await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify({title:document.title,result:window.__lastResult,error:document.getElementById('error').innerText,width:innerWidth,height:innerHeight})");File.WriteAllText(Path.Combine(Program.SelfTest,"initial.json"),initial);
  if(await web.CoreWebView2.ExecuteScriptAsync("Boolean(window.__lastResult && !document.getElementById('error').innerText)")!="true")throw new Exception("首屏绘图未完成");
  await web.CoreWebView2.ExecuteScriptAsync("window.__nativeTest={done:false};(async()=>{try{let names=[];for(let i=0;i<8;i++){Lab.applyPreset(i);await Lab.flush();if(document.getElementById('error').innerText)throw Error(document.getElementById('error').innerText);names.push(document.getElementById('className').innerText);}Lab.applyPreset(2);await Lab.flush();window.__nativeTest={done:true,passed:true,names};}catch(e){window.__nativeTest={done:true,passed:false,error:e.message};}})()");
  for(int i=0;i<150;i++){if(await web.CoreWebView2.ExecuteScriptAsync("window.__nativeTest.done")=="true")break;await Task.Delay(200);}
  File.WriteAllText(Path.Combine(Program.SelfTest,"presets.json"),await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(window.__nativeTest)"));
  if(await web.CoreWebView2.ExecuteScriptAsync("window.__nativeTest.passed")!="true")throw new Exception("预设测试未通过");
  File.WriteAllText(Path.Combine(Program.SelfTest,"PASS.txt"),"WebView2 原生窗口启动成功；中文界面及全部 8 个预设绘图通过。");Close();
 }catch(Exception ex){Fail(ex);}}
 void Fail(Exception ex){if(Program.SelfTest!=null){Directory.CreateDirectory(Program.SelfTest);File.WriteAllText(Path.Combine(Program.SelfTest,"error.txt"),ex.ToString());Environment.ExitCode=1;Close();}else{MessageBox.Show(this,Program.Localized("无法打开曲面实验室。\n","Unable to open Surface Lab.\n")+ex.Message+Program.Localized("\n请确认本机可正常使用 Microsoft Edge WebView2。","\nPlease check that Microsoft Edge WebView2 Runtime is installed."),Program.Title,MessageBoxButtons.OK,MessageBoxIcon.Error);Close();}}
 protected override void Dispose(bool disposing){if(disposing&&web!=null)web.Dispose();base.Dispose(disposing);}
}
