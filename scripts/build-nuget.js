"use strict";

var path = require("path"),
    fs = require("fs"),
    utils = require("../lib/utils"),
    Jscex = utils.Jscex,
	execAsync = Jscex.Async.Binding.fromCallback(require('child_process').exec, "_ignored_", "stdout", "stderr"),
    _ = Jscex._;

var devDir = path.join(__dirname, "../bin/nuget");
var srcDir = path.join(__dirname, "../src");
var filelist = [];

if (path.existsSync(devDir)) {
    utils.rmdirSync(devDir);
}

fs.mkdirSync(devDir);

var coreName = "jscex-" + Jscex.coreVersion + ".js"
utils.copySync(path.join(srcDir, "jscex.js"), path.join(devDir, coreName));
console.log(coreName + " generated.");
filelist.push(coreName);

var moduleList = ["parser", "jit", "builderbase", "async", "async-powerpack", "promise"];

_.each(moduleList, function (i, module) {
    var fullName = "jscex-" + module;
    var version = Jscex.modules[module].version;
    var outputName = fullName + "-" + version + ".js";
    utils.copySync(path.join(srcDir, fullName + ".js"), path.join(devDir, outputName));
    console.log(outputName + " generated.");
    filelist.push(outputName);
});

// Build nuget config -- jscex.x.x.x.nuspec 
var buildConfig = function (version, files) {
    var config = "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
	<package xmlns=\"http://schemas.microsoft.com/packaging/2011/08/nuspec.xsd\"> \
		<metadata> \
			<id>jscex</id> \
			<version>" + version + "</version> \
			<authors>Jeffrey Zhao</authors> \
			<owners>Jeffrey Zhao</owners> \
			<licenseUrl>https://github.com/JeffreyZhao/jscex</licenseUrl> \
			<projectUrl>https://github.com/JeffreyZhao/jscex</projectUrl> \
			<requireLicenseAcceptance>false</requireLicenseAcceptance> \
			<description>Jscex provides a monadic extensions for JavaScript language and would significantly improve your programming life in certain scenarios.</description> \
			<summary>Jscex provides a monadic extensions for JavaScript language and would significantly improve your programming life in certain scenarios.</summary> \
			<releaseNotes>" + version + "</releaseNotes> \
			<copyright>Copyright 2012</copyright> \
			<language>en-US</language> \
			<tags>Javascript</tags> \
		</metadata> \
		<files>";

    _.each(files, function (i, file) {
        config = config + "<file src=\"" + file + "\" target=\"content\\Scripts\\" + file + "\" />";
    });

    config = config + "</files> \
	</package>";

    fs.writeFileSync(path.join(devDir, "jscex." + version + ".nuspec"), config, "utf8");
};

// Build nuget package -- jscex.x.x.x.nupkg	
var buildPackage = eval(Jscex.compile("async", function (module) {
    var nugetPath = "\"../lib/Nuget.exe\"";
    var specPath = path.join(devDir, "jscex." + Jscex.coreVersion + ".nuspec");
    var command = _.format(
        "{0} pack {1} -OutputDirectory {2}",
        nugetPath,
        specPath,
		devDir);

    utils.stdout(command);
    utils.stdout("Packaging {0}...", specPath);

    var r = $await(execAsync(command));
    if (r.stderr) {
        utils.stdout("failed.\n");
        utils.stderr(r.stderr + "\n");
    } else {
        utils.stdout("done.\n");
    }
}));

buildConfig(Jscex.coreVersion, filelist);
buildPackage().start();

        
    
