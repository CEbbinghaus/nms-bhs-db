'use strict';

blackHoleSuns.prototype.buildFilePanel=function(){
 const panel = `
    <div id="upload" class="card card-body" style="display:none">
        <div class="row">
            <div class="col-9">
                <input type="file" id="uploadedFile" class="form-control form-control-sm" accept=".csv">
            </div>
            <button id="check" type="button" class="col-2 btn border btn-sm txt-def btn-def">Check</button>&nbsp;
            <button id="submit" type="button" class="col-2 btn border btn-sm txt-def btn-def">Submit</button>&nbsp;
        </div>
        <br>

        <div class="progress">
            <div id="progress" class="progress-bar progress-bar-striped bg-success progress-bar-animated"
                role="progressbar" style="width: 0%; display:none" aria-valuenow="0" aria-valuemin="0"
                aria-valuemax="100"></div>
            </div>
        </div>
    </div>`;

    $("#panels").append(panel);

    $("#submit").click(function () {
        if (bhs.fileSelected)
            bhs.readTextFile(bhs.fileSelected);
        else
            $("#status").prepend("<h7>No file selected</h7>");
    });

    $("#check").click(function () {
        if (bhs.fileSelected)
            bhs.readTextFile(bhs.fileSelected, true);
        else
            $("#status").prepend("<h7>No file selected</h7>");
    });

    $("#uploadedFile").change(function () {
        bhs.fileSelected = this;
    });
}

const inpCoordIdx = 6;
var importTable = [{
    match: /platform/i,
    field: "platform",
    group: 0
}, {
    match: /galaxy/i,
    field: "galaxy",
    format: formatGalaxy,
    group: 0
}, {
    match: /org/i,
    field: "org",
    format: formatOrg,
    group: 0
}, {
    match: /type/i,
    field: "type",
    group: 0
}, {
    match: /own/i,
    field: "owned",
    format: formatOwned,
    group: 0
}, {
    match: /traveler|player|your/i,
    field: "player",
    group: 0
}, { // 1st match
    match: /coord|addr/i,
    field: "addr",
    required: true,
    format: reformatAddress,
    validate: validateAddress,
    group: 1
}, {
    match: /econ/i,
    field: "econ",
    format: formatEcon,
    group: 1
}, {
    match: /reg/i,
    field: "reg",
    required: true,
    group: 1
}, {
    match: /sys/i,
    field: "sys",
    required: true,
    group: 1
}, {
    match: /sun/i,
    field: "sun",
    group: 1
}, {
    match: /life/i,
    field: "life",
    format: formatLife,
    group: 1
}, {
    match: /conf/i,
    field: "conflict",
    format: formatConflict,
    group: 1
}, { // 2nd match
    match: /coord|addr/i,
    field: "addr",
    format: reformatAddress,
    validate: validateAddress,
    group: 2
}, {
    match: /econ/i,
    field: "econ",
    format: formatEcon,
    group: 2
}, {
    match: /reg/i,
    field: "reg",
    checkreq: checkZeroAddress,
    checkval: 10,
    checkgrp: 2,
    group: 2
}, {
    match: /sys/i,
    field: "sys",
    checkreq: checkZeroAddress,
    checkval: 10,
    checkgrp: 2,
    group: 2
}, {
    match: /sun/i,
    field: "sun",
    group: 2
}, {
    match: /life/i,
    field: "life",
    format: formatLife,
    group: 2
}, {
    match: /conf/i,
    field: "conflict",
    format: formatConflict,
    group: 2
}];

/* type menu from spreadsheet
Black Hole
Base Mine
Base Visited
Base Station
DeadZone 
Single System
Edit
Delete
*/

blackHoleSuns.prototype.readTextFile = function (f, check) {
    let file = f.files[0];
    let reader = new FileReader();

    reader.onload = async function () {
        let allrows = reader.result.split(/\r?\n|\r/);

        // if (file.name.match(/\.txt/i)) {
        //     let ref = bhs.fbfs.collection("org")
        //     for (let i = 0; i < allrows.length; ++i) {
        //         if (allrows[i] != "") {
        //             let org = {};
        //             org.name = allrows[i];
        //             ref.add(org);
        //         }
        //     }

        //     return;
        // }

        let b = {};
        b.batch = bhs.fbfs.batch();
        b.batchcount = 0;

        let errorLog = "";

        let step = 1 / allrows.length * 100;
        let width = 1;
        let progress = $("#progress");
        progress.prop("width", width + "%");
        progress.show();

        let k = 0;
        let found = false;

        for (; k < allrows.length && !found; ++k) {
            found = true;
            let row = allrows[k].split(/[,\t]/);

            for (let i = 0; i < importTable.length; ++i) {
                importTable[i].index = -1;

                for (let j = 0; j < row.length; ++j) {
                    if (row[j].search(importTable[i].match) != -1) {
                        importTable[i].index = j;
                        row[j] = "";
                        break;
                    }
                }

                if (importTable[i].required && importTable[i].index == -1) {
                    found = false;
                    continue;
                }
            }
        }

        if (!found) {
            errorLog = bhs.status("Missing required column labels.", 0, errorLog);
            await bhs.batchWriteLog(b, file.name, errorLog);
            await bhs.checkBatchSize(b, true);
            return;
        }

        var entry = [];

        for (let ok = true, i = k; i < allrows.length && ok; ++i, ok = true) {
            entry[1] = {};
            entry[2] = {};

            entry[0] = {};
            entry[0].player = bhs.user.player;
            entry[0].org = bhs.user.org ? bhs.user.org : "";
            entry[0].uid = bhs.user.uid;
            entry[0].galaxy = bhs.user.galaxy;
            entry[0].platform = bhs.user.platform;
            entry[0].type = "x";
            entry[0].owned = "x";
            entry[0].version = "next";

            width = Math.ceil(i * step);
            progress.css("width", width + "%");
            progress.text(i);

            let row = allrows[i].split(/[,\t]/);

            if (row.length < 3 || row[importTable[inpCoordIdx].index] == "")
                ok = false;

            for (let j = 0; j < importTable.length && ok; ++j) {
                let idx = importTable[j].index;
                if (idx >= 0) {
                    if (row[idx] == "") {
                        let grp = importTable[j].checkgrp;
                        let val = importTable[j].checkval;
                        if (importTable[j].required || importTable[j].checkreq &&
                            importTable[j].checkreq(entry[importTable[grp].group][importTable[val].field])) {
                            errorLog = bhs.status("row: " + (i + 1) + " missing " + importTable[j].match, 0, errorLog);
                            errorLog = bhs.status("row: " + (i + 1) + " " + allrows[i], 2, errorLog);
                            ok = false;
                        }
                    } else {
                        let v = row[idx];
                        if (importTable[j].format)
                            v = importTable[j].format(v);

                        if (importTable[j].validate)
                            ok = importTable[j].validate(v);

                        entry[importTable[j].group][importTable[j].field] = v;

                        if (!ok) {
                            let s = importTable[j].group == 1 ? "bh " : importTable[j].group == 2 ? "exit " : "";
                            errorLog = bhs.status("row: " + (i + 1) + " invalid value " + s + importTable[j].match + " " + entry[importTable[j].group][importTable[j].field], 0, errorLog);
                            errorLog = bhs.status("row: " + (i + 1) + " " + allrows[i], 2, errorLog);
                        }
                    }
                }
            }

            if (ok) {
                entry[0].platform = entry[0].platform.match(/pc/i) ||
                    entry[0].platform.match(/xbox/i) ? "PC-XBox" : entry[0].platform.toUpperCase();

                if (entry[0].player != bhs.user.player)
                    delete entry[0].uid;

                entry[1] = mergeObjects(entry[1], entry[0]);
                entry[2] = mergeObjects(entry[2], entry[0]);

                entry[1].dist = bhs.calcDist(entry[1].addr);
                entry[2].dist = bhs.calcDist(entry[2].addr);

                if (entry[0].type.match(/edit/i))
                    await bhs.batchEdit(b, entry[1], entry[2].addr ? entry[2].addr : null, check);

                else if (entry[0].type.match(/delete/i))
                    await bhs.batchDelete(b, entry[1], check);

                else if (entry[0].type.match(/single/i) || !entry[2].addr) {
                    await bhs.batchUpdate(b, entry[1], check); // don't overwrite bh info if it exists

                } else if (entry[0].type.match(/base/i) || entry[2].addr == "0000:0000:0000:0000") {
                    let base = entry[2].sys ? entry[2].sys : entry[2].reg;
                    entry[2] = {};
                    entry[2].basename = base;
                    entry[2].addr = entry[1].addr;

                    if (entry[0].type.match(/visit/i))
                        entry[2].owned = "visited";
                    else if (entry[0].type.match(/station/i))
                        entry[2].owned = "station";

                    entry[2] = mergeObjects(entry[2], entry[0]);
                    await bhs.batchWriteBase(b, entry[2], check);

                    entry[1].hasbase = true;
                    await bhs.batchUpdate(b, entry[1], check); // don't overwrite bh info if it exists
                } else {
                    entry[1].deadzone = entry[0].type.match(/dead/i) || entry[2].addr == entry[1].addr;
                    entry[1].blackhole = !entry[1].deadzone;

                    if (entry[1].blackhole || entry[1].deadzone) {
                        if (!(ok = validateBHAddress(entry[1].addr))) {
                            errorLog = bhs.status("row: " + (i + 1) + " invalid black hole address " + entry[1].addr, 0, errorLog);
                            errorLog = bhs.status("row: " + (i + 1) + " " + allrows[i], 2, errorLog);
                        }

                        if (ok && entry[1].blackhole) {
                            entry[1].connection = entry[2].addr;
                            entry[1].towardsCtr = entry[1].dist - entry[2].dist;
                            if (!(ok = validateExitAddress(entry[2].addr))) {
                                errorLog = bhs.status("row: " + (i + 1) + " invalid exit address " + entry[1].addr, 0, errorLog);
                                errorLog = bhs.status("row: " + (i + 1) + " " + allrows[i], 2, errorLog);
                            }
                        }

                        if (ok && !(ok = bhs.validateDist(entry[1], "row: " + (i + 1) + " ", 0, errorLog)))
                            errorLog = bhs.status("row: " + (i + 1) + " " + allrows[i], 2, errorLog);

                        if (ok) {
                            await bhs.batchUpdate(b, entry[1], check); // don't overwrite existing base or creation dates
                            if (entry[1].blackhole)
                                await bhs.batchUpdate(b, entry[2], check);
                        }
                    }
                }

            }
        }

        await bhs.batchWriteLog(b, file.name, errorLog);
        await bhs.checkBatchSize(b, true);

        progress.css("width", 100 + "%");
        progress.text("commit");

        if (!check)
            await bhs.updateAllTotals(bhs.totals);

        progress.css("width", 100 + "%");
        progress.text("done");
    }

    reader.readAsText(file);
}

blackHoleSuns.prototype.batchWriteLog = async function (b, filename, errorlog) {
    if (errorlog) {
        let ref = bhs.fbfs.collection("log").doc(filename);
        let data = {};
        data.error += errorlog;

        await b.batch.set(ref, data);
        b = await bhs.checkBatchSize(b);
    }

    return b;
}

blackHoleSuns.prototype.batchUpdate = async function (b, entry, check) {
    delete entry.type;
    delete entry.owned;
    entry.modded = firebase.firestore.Timestamp.fromDate(new Date());

    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists) {
            entry.created = entry.modded;
            if (!check) {
                await b.batch.set(ref, entry);
                bhs.totals = bhs.incTotals(bhs.totals, entry);
                bhs.status(entry.addr + " added", 2);
            }
        } else {
            let d = doc.data()
            if (d.uid == bhs.user.uid) {
                if (!check) {
                    await b.batch.update(ref, entry);
                    bhs.status(entry.addr + " updated", 2);
                }
            } else
                bhs.status(entry.addr + " can only be edited by owner", 1);
        }

        b = await bhs.checkBatchSize(b);
    });

    return b;
}

blackHoleSuns.prototype.batchEdit = async function (b, entry, old, check) {
    delete entry.type;
    delete entry.owned;
    entry.modded = firebase.firestore.Timestamp.fromDate(new Date());

    let addr = old ? old : entry.addr;
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists) {
            bhs.status(entry.addr + " doesn't exist for edit.", 1);
        } else {
            if (!check) {
                if (old) {
                    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, addr);
                    await ref.delete();
                }

                let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
                await b.batch.set(ref, entry);

                bhs.status(entry.addr + " edited", 2);
                b = await bhs.checkBatchSize(b);
            }
        }
    });

    return b;
}

blackHoleSuns.prototype.batchDelete = async function (b, entry, check) {
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists)
            bhs.status(entry.addr + " doesn't exist for delete.", 0);
        else {
            let d = doc.data();
            if (d.uid == bhs.user.uid) {
                if (!check)
                    await ref.delete().then(function () {
                        bhs.totals = bhs.incTotals(bhs.totals, entry, -1);
                        bhs.status(entry.addr + " deleted", 2);
                    });
            } else
                bhs.status(entry.addr + " can only be deleted by owner", 1);
        }
    });

    return b;
}

blackHoleSuns.prototype.batchWriteBase = async function (b, entry, check) {
    delete entry.type;
    entry.modded = firebase.firestore.Timestamp.fromDate(new Date());
    if (!check) {
        let ref = bhs.getUsersColRef().where("player", "==", entry.player);
        await ref.get().then(async function (snapshot) {
            if (!snapshot.empty) {
                let ref = bhs.getUsersColRef(snapshot.docs[0].id, entry.galaxy, entry.platform, entry.addr);
                await b.batch.set(ref, entry);

                bhs.status(entry.addr + " base saved.", 2);
                b = await bhs.checkBatchSize(b);
            }
        });
    }

    return b;
}

blackHoleSuns.prototype.status = function (str, lvl, buf) {
    if (typeof buf != "undefined")
        buf += bhs.user.player+" "+str + ";";

    if (lvl == 0 || $("#ck-verbose").prop("checked") && lvl == 1 || $("#ck-vverbose").prop("checked") && lvl == 2)
        $("#status").append("<h7>" + str + "</h7>");

    return buf;
}