/*
 * Handler that provides an interface for inspecting / modifying
 * a local LK workspace (changes, version control, ...)
 */
function WorkspaceHandler(modules, lkDir) {
    this.modules = modules;
    this.lkDir = lkDir;
}

WorkspaceHandler.prototype.registerWith = function(app) {
    getJSONRoute(app, this, '/workspace/workspace-dir', 'getLKDir');
    getJSONRoute(app, this, '/workspace/branches', 'getBranches');
    var handler = this;
    app.get('/workspace/log/:ref/:howMany', function(req, res) {
        handler.getLog(req.params.ref, req.params.howMany, function(json) { res.send(json); });
    });
}

WorkspaceHandler.prototype.git = function(cmd, whenDone) {
    this.modules.exec("git " + cmd, {cwd: this.lkDir}, whenDone)
}

// curl localhost:9001/workspace/workspace-dir | prettify_json.rb
WorkspaceHandler.prototype.getLKDir = function(whenDone) {
    whenDone({path: this.lkDir});
}

// curl localhost:9001/workspace/branches | prettify_json.rb
WorkspaceHandler.prototype.getBranches = function(whenDone) {
    this.git("branch -a --color=never", function(code, out, err) {
        if (code) { whenDone({error: code, out: out, err: err}); return }
        var lines = out.split('\n'),
            names = [], current;
        lines.forEach(function(line, i) {
            var match = line.match(/(\*?)\s*(.*)/);
            if (!match) return;
            if (match[1] && match[1].length > 0) current = names.length;
            names.push(match[2]);
        });
        whenDone({names: names, current: current});
    })
}

// curl localhost:9001/workspace/log/HEAD/10 | prettify_json.rb
WorkspaceHandler.prototype.getLog = function(fromRef, howMany, whenDone) {
    var cmd = "log --graph "
            + "--pretty=format:'%h -%d %s (%cr) <%an>' "
            + "--abbrev-commit "
            + "--date=relative "
            + (fromRef || "")
            + (howMany ? " -" + howMany : "");
    this.git(cmd, function(code, out, err) {
        if (code) { whenDone({error: code, out: out, err: err}); return }
        var lines = out.split('\n');
        whenDone({lines: lines});
    })
}

exports.WorkspaceHandler = WorkspaceHandler;