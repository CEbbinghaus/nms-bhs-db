'use strict';

$(document).ready(function () {
    startUp();

    let loc = $("#pnl-user");

    bhs.buildMenu(loc, "Platform", platformList, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, true);

    Object.keys(panels).forEach(i => {
        let x = panels[i];
        bhs.buildPanel(x.name, x.id);
    });

    bhs.activatePanelGroup(0);

    bhs.buildUserTable();
    bhs.buildStats();

    $('#pnl-user #ck-singleSystem').change(function () {
        if (this.prop("checked"))
            bhs.activatePanelGroup(1);
        else
            bhs.activatePanelGroup(0);
    });

    $("#save").click(function () {
        bhs.save();
    });

    $("#delete").click(function () {
        if (("#ck-singleSystem").prop("checked")) {
            bhs.deleteEntry($("#pnl-" + "Single System".nameToId()).addr, bhs.user);
        } else {
            bhs.deleteEntry($("#pnl-" + "Black Hole System".nameToId()).addr, bhs.user);
            bhs.deleteEntry($("#pnl-" + "Exit System".nameToId()).addr, bhs.user);
        }

        bhs.clearPanels();
    });

    $("#clear").click(function () {
        bhs.clearPanels();
    });
})

const pnlBHIndex = 0;
const pnlExitIndex = 1;
const pnlSingleIndex = 2;

const panels = [{
    name: "Black Hole System",
    id: "pnl-BH",
    listid: "lst-BH",
    calc: true,
    group: 0
}, {
    name: "Exit System",
    id: "pnl-XS",
    listid: "lst-XS",
    calc: true,
    group: 0
}, {
    name: "Single System",
    id: "pnl-SS",
    listid: "lst-SS",
    calc: false,
    group: 1
}];

blackHoleSuns.prototype.activatePanelGroup = function (group) {
    Object.keys(panels).forEach(i => {
        let x = panels[i];
        if (x.group == group)
            $("#" + x.id).show();
        else
            $("#" + x.id).hide();
    });
}

blackHoleSuns.prototype.buildPanel = function (name, id) {
    const panel = `
        <div id="idname" class="card pad-bottom">
            <div class="h4 clr-dark-green card-header">heading</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-9 col-14">
                        <div class="card card-body no-border">
                            <div class="row">
                                <div class="col-md-5 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">Address</div>&nbsp;
                                        <input id="id-addr" class="rounded col-md-14 col-9" placeholder="0000:0000:0000:0000">
                                    </div>
                                </div>

                                <div class="col-md-4 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">System Name</div>&nbsp;
                                        <input id="id-sys" class="rounded col-md-14 col-9">
                                    </div>
                                </div>

                                <div class="col-md-5 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">Region Name</div>&nbsp;
                                        <input id="id-reg" class="rounded col-md-14 col-9">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-5 col-14">
                        <div class="card card-body no-border">
                            <div class="row">
                                <div id="id-Lifeform" class="col-md-4 col-14"></div>
                                <div id="id-Economy" class="col-md-4 col-14"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row container">
                    <label class="col-3 h6 clr-dark-green">
                        <input id="ck-hasbase" type="checkbox">
                        Has Base
                    </label>

                    <div class="col-10">
                        <div id="id-isbase" class="row" style="display:none">
                            <div class="col-4 h6 clr-dark-green">Name</div>&nbsp;
                            <input id="id-basename" class="rounded col-6">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div id="id-fmcenter" class="col-8 clr-dark-green" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right">Distance (ly): From Center&nbsp;</div>
                            <div id="fmcenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                        
                    <div id="id-tocenter" class="col-6 clr-dark-green" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right"> Towards Center&nbsp;</div>
                            <div id="tocenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    let h = /idname/g [Symbol.replace](panel, id);
    h = /heading/g [Symbol.replace](h, name);

    $("#panels").append(h);

    let loc = $("#" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);

    //loc.find("#id-addr").keydown(function (event) {
    //    return bhs.formatAddress(this, event);
    //});

    loc.find("#id-addr").blur(function () {
        let addr = bhs.reformatAddress($(this).val());
        $(this).val(addr);

        let pnl = $(this).closest("[id|='pnl'");
        if (pnl.find("#id-sys").val() != "" && pnl.find("#id-reg").val() != "")
            bhs.getEntry(addr, bhs.displaySingle, pnl);

        if (panels[bhs.getIndex(panels, "id", pnl.prop("id"))].calc)
            bhs.displayCalc();
    });

    loc.find('#ck-hasbase').change(function () {
        let pnl = $(this).closest("[id|='pnl'");

        if (this.prop("checked"))
            pnl.find("#id-isbase").show();
        else
            pnl.find("#id-isbase").hide();
    });
}

blackHoleSuns.prototype.displaySingle = function (loc, entry) {
    loc.find("#id-addr").val(entry.addr);
    loc.find("#id-sys").val(entry.sys);
    loc.find("#id-reg").val(entry.reg);
    loc.find("#btn-Lifeform").text(entry.life);

    let l = economyList[bhs.getIndex(economyList, "name", entry.econ)].level;
    loc.find("#btn-Economy").text(l + " " + entry.econ);
    loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");

    $("#delete").removeClass("disabled");
    $("#delete").removeAttr("disabled");
}

blackHoleSuns.prototype.buildStats = function () {
    let h = trStart;
    h += /label/ [Symbol.replace](thLine, "Black Holes");
    h += /label/ [Symbol.replace](thLine, "User");
    h += /label/ [Symbol.replace](thLine, "All Users");
    h += /label/ [Symbol.replace](thLine, "Top Contributors");
    h += trEnd;

    let pos = $("#statsHeader");
    pos.empty();
    pos.append(h);
}

blackHoleSuns.prototype.displayStats = function () {
    let p = bhs.user.platform;
    let g = bhs.user.galaxy;

    if (typeof bhs.user.totals === 'undefined' || typeof bhs.user.totals[g] === 'undefined' || typeof bhs.user.totals[g][p] === 'undefined')
        return;

    let h = trStart;
    h += /label/ [Symbol.replace](thLine, "Total [" + g + "]");
    h += /label/ [Symbol.replace](thLine, bhs.user.totals[g].totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals[g].totalBH);
    h += trEnd;

    h += trStart;
    h += /label/ [Symbol.replace](thLine, "Total [" + g + "][" + p + "]");
    h += /label/ [Symbol.replace](thLine, bhs.user.totals[g][p].totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals[g][p].totalBH);
    h += trEnd;

    h += trStart;
    h += /label/ [Symbol.replace](thLine, "Grand Total");
    h += /label/ [Symbol.replace](thLine, bhs.user.totals.totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals.totalBH);
    h += trEnd;

    h = /col/g [Symbol.replace](h, "row");

    let loc = $("#statsItems");
    loc.empty();
    loc.append(h);
}

blackHoleSuns.prototype.clearPanels = function () {
    Object.keys(panels).forEach(i => {
        let x = panels[i];
        bhs.clearPanel(x.id);
    });

    $("#delete").addClass("disabled");
    $("#delete").prop("disabled", true);
}

blackHoleSuns.prototype.clearPanel = function (id) {
    let pnl = $("#" + id);

    pnl.each(function () {
        $(this).find("[id|='inp'").each(function () {
            $(this).val("");
        });
        $(this).find("[id|='menu']").each(function () {
            $(this).find("[id|='btn']").text("");
        });
    });
}

blackHoleSuns.prototype.extractEntry = function (idx) {
    let pnl = $("#panels");
    let loc = pnl.find("#" + panels[idx].id);

    let entry = {};
    entry.addr = loc.find("#id-addr").val();

    entry.sys = loc.find("#id-sys").val();
    entry.reg = loc.find("#id-reg").val();
    entry.life = loc.find("#btn-Lifeform").text().stripNumber();
    entry.econ = loc.find("#btn-Economy").text().stripNumber();
    //    entry.hasBase = loc.find("#ck-hasbase").prop('checked');
    //    if (entry.hasBase)
    //        entry.basename = loc.find("#id-basename").val();

    entry.blackhole = idx == pnlBHIndex;
    entry.exit = idx == pnlExitIndex;

    if (panels[idx].group == 0) {
        if (idx == pnlBHIndex)
            loc = pnl.find("#" + panels[pnlExitIndex].id);
        else
            loc = pnl.find("#" + panels[pnlBHIndex].id);

        entry.connection = loc.find("#id-addr").val();
    }

    return entry;
}

blackHoleSuns.prototype.setEntries = function (sel) {
    let id = $(sel).prop("id").replace(/(.*?-.*?)-.*/, "$1");

    let x = bhs.getIndex(panels, "listid", id);
    let panel = panels[x];

    bhs.setEntry(sel, panel.id);

    if (panel.group == 0) {
        x = (x + 1) % 2;
        panel = panels[x];

        let id = panel.listid + "-" + $(sel).data("con");

        bhs.setEntry($("#" + id), panel.id);

        $("#ck-singleSystem").prop('checked', false);
    } else
        $("#ck-singleSystem").prop('checked', true);

    bhs.activatePanelGroup(panel.group);
}

blackHoleSuns.prototype.setEntry = function (sel, pnlid) {
    let loc = $(sel);
    let pnl = $("#" + pnlid);

    pnl.find("#id-addr").val(loc.find("#addr").text());
    pnl.find("#id-sys").val(loc.find("#sys").text());
    pnl.find("#id-reg").val(loc.find("#reg").text());
    pnl.find("#btn-Lifeform").text(loc.find("#life").text());

    let t = loc.find("#econ").text();
    if (t != "") {
        let l = economyList[bhs.getIndex(economyList, "name", t)].level;
        pnl.find("#btn-Economy").text(l + " " + t);
        pnl.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");
    } else pnl.find("#btn-Economy").text(t);

    pnl.find("#id-isbase").prop('checked', loc.find("#base").text() != "");
}

blackHoleSuns.prototype.save = function () {
    let entry = [];

    $("#status").empty();

    bhs.extractUser();
    let ok = bhs.validateUser();

    let group = $("#ck-singleSystem").prop('checked') ? 1 : 0;

    Object.keys(panels).forEach(i => {
        let x = panels[i];

        if (ok && x.group == group) {
            entry[i] = bhs.extractEntry(i);
            ok = bhs.validateEntry(entry[i]);
        }
    });

    Object.keys(panels).forEach(i => {
        let x = panels[i];

        if (ok && x.group == group)
            bhs.updateEntry(entry[i], panels[i].id);
    });
}