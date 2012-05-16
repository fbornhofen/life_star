/*global exports, require, JSON*/

// continously run with:
// nodemon nodeunit tests/workspace-test.js

var testHelper = require('./test-helper'),
    WorkspaceHandler = require('../lib/workspace').WorkspaceHandler,
    testSuite = {};

/*
 * Workspace tests
 */
var handler, lkDir = "foo/bar/", modules;
testSuite.WorkspaceHandlerTest = {

    setUp: function(run) {
        modules = {};
        handler = new WorkspaceHandler(modules, lkDir);
        run();
    },

    tearDown: function(run) { run(); },

    "get lk core dir": function(test) {
        handler.getLKDir(function(json) {
            test.equals(json.path, lkDir);
            test.done();
        });
    },

    "get branches": function(test) {
        modules.exec = testHelper.execForTest(test).expect(
            {cmd: 'git branch -a --color=never', cwd: lkDir,
             out: "  foo\n* master\n  baz\n  remotes/origin/master\n  remotes/origin/bla"});
        var expected = {
            names: ["foo", "master", "baz", "remotes/origin/master", "remotes/origin/bla"],
            current: 1
        };
        handler.getBranches(function(json) {
            test.deepEqual(json, expected);
            modules.exec.assertAllCalled(test);
            test.done();
        });
    },

    "get log": function(test) {
        var log = "* bdece40 - (HEAD, origin/master, master) yoy (2 hours ago) <tuetata>\n"
                + "* 9e0ab4c - abc (7 weeks ago) <Foo bar>\n"
                + "* 0ab7f5c - def (7 weeks ago) <Baz Bla>\n"
                + "*   6fe108d - Merge pull request #28 from xxx (7 weeks ago) <Foo bar>\n"
                + "|\  \n"
                + "| * 7027758 - (origin/yyy, xxx) blupf bla (8 weeks ago) <baz napf>";
        modules.exec = testHelper.execForTest(test).expect(
            {cmd: "git log --graph --pretty=format:'%h -%d %s (%cr) <%an>' "
                  + "--abbrev-commit --date=relative "
                  + "HEAD -10", cwd: lkDir, out: log});
        var expected = {lines: log.split('\n')};
        handler.getLog('HEAD', 10, function(json) {
            test.deepEqual(json, expected);
            modules.exec.assertAllCalled(test);
            test.done();
        });
    }
}

exports.testSuite = testSuite;
