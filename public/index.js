'use strict';

$(document).ready(function () {
    startUp();

    bhs.last = [];

    bhs.buildUserPanel();
    bhs.buildFilePanel();

    panels.forEach(function (p) {
        bhs.buildPanel(p.id);
    });

    $("#save").click(function () {
        bhs.save();
    });

    $("#delete").click(function () {
        $("#status").empty();
        bhs.deleteEntry(bhs.last[pnlTop], bhs.admin && bhs.role == "admin");
        bhs.deleteEntry(bhs.last[pnlBottom], bhs.admin && bhs.role == "admin");
    });

    $("#cancel").click(function () {
        bhs.clearPanels();
    });
})

const pnlTop = 0;
const pnlBottom = 1;

var panels = [{
    name: "Black Hole System",
    id: "pnl-S1",
    listid: "S1",
    calc: true,
}, {
    name: "Exit System",
    id: "pnl-S2",
    listid: "S2",
    calc: true,
}];

const ownershipList = [{
    name: "mine"
}, {
    name: "visited"
}, {
    name: "station"
}];

blackHoleSuns.prototype.buildPanel = function (id) {
    const panel = `
        <div id="idname" class="card pad-bottom bkg-trans-2">
            <div class="card-header txt-def h5">title</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-sm-4 col-7 h6 txt-inp-def">Coordinates&nbsp;</div>
                    <input id="id-addr" class="rounded col-sm-5 col-7" placeholder="0000:0000:0000:0000">
                </div>

                <div class="row">
                    <div class="col-sm-4 col-7 h6 txt-inp-def">Portal&nbsp;</div>
                    <div id="id-glyph" class="col-sm-5 col-7 h4 txt-inp-def glyph"></div>
                    <div id="id-hex" class="col-sm-5 col-14 text-center txt-inp-def"></div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-7  h6 txt-inp-def">System Name&nbsp;</div>
                    <input id="id-sys" class="rounded col-sm-5 col-7">
                </div>

                <div class="row">
                    <div class="col-sm-4 col-7 h6 txt-inp-def">Region Name&nbsp;</div>
                    <input id="id-reg" class="rounded col-sm-5 col-7">&nbsp;
                    <button id="btn-searchRegion" type="button" class="col-sm-2 col-4 btn-def btn btn-sm">Search</button>&nbsp;
                    </div>

                <div id="id-byrow" class="row">
                    <div class="col-sm-4 col-7  h6 txt-inp-def">Entered by&nbsp;</div>
                    <div id="id-by" class="col-sm-5 col-7 txt-inp-def"></div>
                </div>

                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Lifeform" class="col-11"></div>
                </div>
                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Economy" class="col-11"></div>
                </div>

                <div class="row">
                    <label class="col-7 h6 txt-inp-def">
                        <input id="ck-hasbase" type="checkbox">
                        Has Base
                    </label>
                </div>

                <div id="id-isbase" class="row" style="display:none">
                    <div class="col-sm-2 col-4 h6 txt-inp-def">Name</div>
                    <input id="id-basename" class="rounded col-6">
                    <div id="id-Owned" class="col-sm-3 col-9"></div>
                    <button id="btn-delbase" type="button" class="col-sm-2 col-5 btn-def btn btn-sm disabled" disabled>Delete Base</button>&nbsp;
                </div>

                <div id="id-pnl1-only" class="row">
                    <div class="col-5">
                        <label class="h6 txt-inp-def">
                            <input id="ck-single" type="checkbox">
                            Single System
                        </label>
                    </div>

                    <div class="col-5">
                        <label class="h6 txt-inp-def">
                            <input id="ck-isdz" type="checkbox">
                            Dead Zone
                        </label>
                    </div>

                    <div id="validate" class="col-4 hidden">
                        <label class="h6 txt-inp-def">
                            <input id="ck-valid" type="checkbox">
                            Verified
                        </label>
                    </div>
                </div>

                <div class="row">
                    <div id="id-fmcenter" class="col-4 txt-inp-def" style="display:none">
                        <div class="row">
                            <div class="col-7 text-right">To Center&nbsp;</div>
                            <div id="fmcenter" class="col-7 text-left h6"></div>
                        </div>
                    </div>
                        
                    <div id="id-traveled" class="col-5 txt-inp-def" style="display:none">
                        <div class="row">
                            <div class="col-8 text-right"> Traveled&nbsp;</div>
                            <div id="traveled" class="col-6 text-left h6"></div>
                        </div>
                    </div>

                   <div id="id-tocenter" class="col-5 txt-inp-def" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right"> Towards Center&nbsp;</div>
                            <div id="tocenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <br>`;

    let h = /idname/g [Symbol.replace](panel, id);
    h = /title/g [Symbol.replace](h, id == "pnl-S1" ? panels[pnlTop].name : panels[pnlBottom].name);

    $("#panels").append(h);

    let loc = $("#" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);
    bhs.buildMenu(loc, "Owned", ownershipList);

    loc.find("#id-addr").unbind("change");
    loc.find("#id-addr").change(function () {
        let addr = bhs.reformatAddress($(this).val());
        $(this).val(addr);

        let glyph = bhs.addrToGlyph(addr);

        let pnl = $(this).closest("[id|='pnl'");
        pnl.find("#id-glyph").text(glyph);
        pnl.find("#id-hex").text(glyph);

        bhs.getEntry(addr, bhs.displaySingle, 0);

        bhs.displayCalc();
    });

    loc.find('#ck-hasbase').unbind("change");
    loc.find('#ck-hasbase').change(function () {
        let pnl = $(this).closest("[id|='pnl'");

        if ($(this).prop("checked"))
            pnl.find("#id-isbase").show();
        else
            pnl.find("#id-isbase").hide();
    });

    $("#" + panels[pnlBottom].id + " #id-pnl1-only").hide();

    loc.find('#ck-single, #ck-isdz').unbind("change");
    loc.find('#ck-single, #ck-isdz').change(function () {
        let pnl = $("#" + panels[pnlBottom].id);
        if ($(this).prop("checked"))
            pnl.hide();
        else
            pnl.show();
    });

    loc.find("#btn-searchRegion").unbind("click");
    loc.find("#btn-searchRegion").click(function () {
        bhs.getEntryByRegion(loc.find("#id-reg").val(), bhs.displaySingle, 0);
    });

    loc.find("#btn-delbase").unbind("click");
    loc.find("#btn-delbase").click(function () {
        if (loc.find("#id-addr").val())
            bhs.deleteBase(loc.find("#id-addr").val());
        else
            bhs.status("No address to delete");
    });
}

blackHoleSuns.prototype.displayListEntry = function (entry) {
    if (entry.bh)
        bhs.displaySingle(entry.bh, pnlTop);
    if (entry.dz)
        bhs.displaySingle(entry.dz, pnlTop);
    if (entry.bhbase)
        bhs.displayBase(entry.bhbase, pnlTop);

    if (entry.bh || entry.dz || entry.bhbase) {
        $("#" + panels[pnlTop].id + " #ck-single").prop("checked", false);
        $("#" + panels[pnlTop].id).show();
    } else {
        $("#" + panels[pnlBottom].id + " #ck-single").prop("checked", true);
        $("#" + panels[pnlBottom].id).hide();
    }

    if (entry.exit)
        bhs.displaySingle(entry.exit, entry.bh ? pnlBottom : pnlTop);
    if (entry.exitbase)
        bhs.displayBase(entry.exitbase, entry.bh ? pnlBottom : pnlTop);
}

blackHoleSuns.prototype.displaySingle = function (entry, idx, zoom) {
    if (!entry)
        return;

    if (zoom) {
        $("#inp-ctrcord").val(entry.addr);
        bhs.changeMapLayout(true, true);
        bhs.traceZero(entry);
    }

    bhs.last[idx] = entry;

    bhs.drawSingle(entry);

    let loc = $("#" + panels[idx].id);

    loc.find("#id-addr").val(entry.addr);
    let glyph = bhs.addrToGlyph(entry.addr);
    loc.find("#id-glyph").text(glyph);
    loc.find("#id-hex").text(glyph);
    loc.find("#id-sys").val(entry.sys);
    loc.find("#id-reg").val(entry.reg);

    loc.find("#id-by").html("<h6>" + (entry._name ? entry._name : entry.player) + "</h6>");

    loc.find("#btn-Lifeform").text(entry.life);
    loc.find("#ck-isdz").prop("checked", entry.deadzone);
    loc.find("#ck-valid").prop("checked", entry.valid);

    loc.find("#ck-hasbase").prop("checked", false);
    loc.find("#id-isbase").hide();

    if (entry.econ) {
        let l = economyList[bhs.getIndex(economyList, "name", entry.econ)].number;
        loc.find("#btn-Economy").text(l + " " + entry.econ);
        loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");
    }

    $("#entrybuttons").show();
    $("#upload").hide();
    $("#ck-fileupload").prop("checked", false);

    bhs.displayCalc();

    $("#delete").removeClass("disabled");
    $("#delete").removeAttr("disabled");
}

blackHoleSuns.prototype.displayBase = function (entry, idx) {
    let pnl = $("#" + panels[idx].id);
    pnl.find("#id-isbase").show();
    pnl.find("#ck-hasbase").prop("checked", true);
    pnl.find("#id-basename").val(entry.basename);
    pnl.find("#btn-Owned").text(entry.owned);

    pnl.find("#btn-delbase").removeClass("disabled");
    pnl.find("#btn-delbase").removeAttr("disabled");
}

blackHoleSuns.prototype.clearPanels = function () {
    panels.forEach(function (d) {
        bhs.clearPanel(d.id);
    });

    $("#delete").addClass("disabled");
    $("#delete").prop("disabled", true);
}

blackHoleSuns.prototype.clearPanel = function (d) {
    bhs.last = [];

    let pnl = $("#" + d);

    pnl.find("input").each(function () {
        $(this).val("");
    });

    pnl.find("[id|='ck']").each(function () {
        $(this).prop("checked", false);
    });

    pnl.find("[id|='menu']").each(function () {
        $(this).find("[id|='btn']").text("");
    });

    pnl.find("#id-isbase").hide();
    pnl.find("#id-fmcenter").hide();
    pnl.find("#id-traveled").hide();
    pnl.find("#id-tocenter").hide();

    pnl.find("#btn-delbase").addClass("disabled");
    pnl.find("#btn-delbase").prop("disabled", true);
}

blackHoleSuns.prototype.extractEntry = async function (idx) {
    let pnl = $("#panels");
    let loc = pnl.find("#" + panels[idx].id);

    let entry = {};
    let lastentry = bhs.last[idx] ? bhs.last[idx] : null;

    if (!lastentry || lastentry.uid == bhs.user.uid) {
        entry._name = bhs.user._name;
        entry.org = bhs.user.org;
        entry.uid = bhs.user.uid;
        entry.platform = bhs.user.platform;
        entry.galaxy = bhs.user.galaxy;
    }

    if (lastentry) {
        let addr = loc.find("#id-addr").val();
        if (lastentry.addr != addr)
            bhs.deleteEntry(lastentry, bhs.admin && bhs.role == "admin");

        if (lastentry.uid != bhs.user.uid) {
            if (bhs.role == "checker" || bhs.role == "admin") {
                entry = lastentry;
                entry.valid = loc.find("#ck-valid").prop("checked");

                if (bhs.role == "checker") {
                    await bhs.updateEntry(entry, true);
                    return;
                }
            }
        }
    }

    entry.addr = loc.find("#id-addr").val();
    entry.sys = loc.find("#id-sys").val();
    entry.reg = loc.find("#id-reg").val();
    entry.life = loc.find("#btn-Lifeform").text().stripNumber();
    entry.econ = loc.find("#btn-Economy").text().stripNumber();
    entry.valid = loc.find("#ck-valid").prop("checked");

    entry.dist = bhs.calcDist(entry.addr);
    entry.xyzs = bhs.addressToXYZ(entry.addr);

    let hasbase = loc.find("#ck-hasbase").prop("checked");
    let single = loc.find("#ck-single").prop("checked");
    let deadzone = loc.find("#ck-isdz").prop("checked");

    if (idx == pnlTop) {
        entry.deadzone = deadzone;

        if (!deadzone && !single) {
            entry.blackhole = true;
            entry.connection = pnl.find("#" + panels[pnlBottom].id + " #id-addr").val();;
            entry.conxyzs = bhs.addressToXYZ(entry.connection);
            entry.towardsCtr = entry.dist - bhs.calcDist(entry.connection);
        }
    }

    let ok = true;
    if (ok = bhs.validateEntry(entry)) {
        if (entry.blackhole) {
            ok = bhs.validateDist(entry);

            if (ok)
                ok = bhs.extractEntry(pnlBottom);
        }

        if (ok) {
            if (bhs.contest)
                entry.contest = bhs.contest._name;

            await bhs.updateEntry(entry, bhs.admin && bhs.role == "admin");

            if (hasbase) {
                entry.basename = loc.find("#id-basename").val();
                entry.owned = loc.find("#btn-Owned").text().stripNumber();
                entry.owned = entry.owned ? entry.owned : "mine";
                await bhs.updateBase(entry)
            }

            if (entry.blackhole) {
                bhs.updateAllTotals(bhs.totals);
                bhs.totals = {};
            }
        }
    }

    return ok;
}

blackHoleSuns.prototype.save = async function () {
    $("#status").empty();

    if (!bhs.admin)
        bhs.saveUser();

    if (await bhs.extractEntry(pnlTop))
        bhs.clearPanels();

}

blackHoleSuns.prototype.displayCalc = function () {
    let top = $("#" + panels[pnlTop].id);
    let bottom = $("#" + panels[pnlBottom].id);

    let addr = top.find("#id-addr").val();
    let connection = bottom.find("#id-addr").val();

    let tdist = bhs.calcDist(addr);

    top.find("#fmcenter").text(tdist + "ly");
    top.find("#id-fmcenter").show();

    if (connection) {
        let bdist = bhs.calcDist(connection);

        bottom.find("#fmcenter").text(bdist + "ly");
        bottom.find("#id-fmcenter").show();

        bottom.find("#traveled").text(bhs.calcDist(addr, connection) + "ly");
        bottom.find("#id-traveled").show();

        bottom.find("#tocenter").text((tdist - bdist) + "ly");
        bottom.find("#id-tocenter").show();

        let entry = {};
        entry.addr = addr;
        entry.connection = connection;
        entry.dist = tdist;
        entry.towardsCtr = tdist - bdist;
        if (!bhs.validateDist(entry))
            bottom.find("#id-tocenter").addClass("text-danger");
        else
            bottom.find("#id-tocenter").removeClass("text-danger");
    }
}

blackHoleSuns.prototype.status = function (str) {
    $("#status").append("<h6>" + str + "</h6>");
    $("#filestatus").append("<h6>" + str + "</h6>");
}