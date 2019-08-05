'use strict';

var bhs;
/*
ui.start('#firebaseui-auth-container', {
    signInOptions: [
        // List of OAuth providers supported.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        firebase.auth.GithubAuthProvider.PROVIDER_ID
    ],
});
*/
const fbconfig = {
    apiKey: FIREBASE_API,
    authDomain: "nms-bhs.firebaseapp.com",
    databaseURL: "https://nms-bhs.firebaseio.com",
    projectId: "nms-bhs",
    storageBucket: "nms-bhs.appspot.com",
    messagingSenderId: FIREBASE_MSGID
};

var starsCol = "stars5";
const usersCol = "users";

function startUp() {
    $("#javascript").empty();
    $("#jssite").show();

    bhs = new blackHoleSuns();

    bhs.init();
    bhs.initFirebase();

    if (starsCol != "stars5")
        $("body").css("background-color", "red");

    $("#login").click(function () {
        bhs.logIn();
    });

    $("#logout").click(function () {
        bhs.logOut();
    });
}

function blackHoleSuns() {
    this.user = {};
    this.unsub = {};
    this.fbauth = null;
    this.fs = null;
    this.fbstorage = null;
}

blackHoleSuns.prototype.initFirebase = function () {
    try {
        firebase.initializeApp(fbconfig);
    } catch (err) {
        if (!/already exists/.test(err.message))
            console.error("Firebase initialization error raised", err.stack)
    }

    bhs.fbauth = firebase.auth();
    bhs.fs = firebase.firestore();
    bhs.fbstorage = firebase.storage();
    bhs.fs.enablePersistence({
        synchronizeTabs: true
    });

    firebase.auth().getRedirectResult().then(function (result) {
        if (result.credential) {
            var token = result.credential.accessToken;
        }

        var user = result.user;
        bhs.onAuthStateChanged(user);
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        var email = error.email;
        var credential = error.credential;

        $("#loggedout").html("<h4>" + errorMessage + "</h4>");
    });

    bhs.fbauth.onAuthStateChanged(bhs.onAuthStateChanged.bind(bhs));
}

blackHoleSuns.prototype.logIn = function () {
    $("#loginpnl").show();
    $("#jssite").hide();

    $("#lcancel").click(function () {
        $("#loginpnl").hide();
        $("#jssite").show();
    });

    $("#lgoogle").click(function () {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        firebase.auth().signInWithRedirect(provider);
    });

    $("#lgithub").click(async function () {
        var provider = new firebase.auth.GithubAuthProvider();
        firebase.auth().signInWithRedirect(provider);
    });

    $("#ltwitch").click(function () {});

    $("#ldiscord").click(function () {});

    $("#lreddit").click(function () {});
}

blackHoleSuns.prototype.logOut = function () {
    bhs.unsubscribe();
    bhs.fbauth.signOut();
}

blackHoleSuns.prototype.onAuthStateChanged = function (usr) {
    if (usr) {
        let profilePicUrl = usr.photoURL;
        let userName = usr.displayName;

        let user = bhs.userInit();
        user.uid = usr.uid;

        $("#userpic").attr('src', profilePicUrl || '/images/body_image.png');
        $("#username").text(userName);

        $("#login").hide();
        $("#usermenu").show();

        // let ref = bhs.fs.collection("users").where("_name","==","wasim13dark");
        // ref.get().then(function(snapshot){
        //     if (!snapshot.empty)
        //         user = snapshot.docs[0].data();

        //      bhs.doLoggedin(user);
        //      bhs.navLoggedin();
        // });

        let ref = bhs.getUsersColRef(usr.uid);
        ref.get().then(function (doc) {
            if (doc.exists) {
                user = doc.data();
                user.lasttime = firebase.firestore.Timestamp.now();
                bhs.updateUser(user);
            } else {
                user.firsttime = firebase.firestore.Timestamp.now();
                user.lasttime = user.firsttime;
                bhs.updateUser(user, true);
            }

            bhs.doLoggedin(user);
            bhs.navLoggedin();

            if (document.domain == "localhost") {
                // var getDARC = firebase.functions().httpsCallable('getDARC');
                // getDARC()
                // .then(function (result) {
                //     console.log(result.data);
                // })
                // .catch(function (err) {
                //     console.log(err);
                // });
            }
        });
    } else {
        $("#usermenu").hide();
        $("#login").show();

        bhs.user = bhs.userInit();
        bhs.doLoggedout();
        bhs.navLoggedout();
    }
}

blackHoleSuns.prototype.init = function () {
    bhs.buildGalaxyInfo();
    bhs.user = bhs.userInit();
}

blackHoleSuns.prototype.userInit = function () {
    let user = {};
    user.uid = null;
    user._name = "";
    user.platform = "";
    user.galaxy = "";
    user.assigned = false;
    user.org = "";

    return user;
}

blackHoleSuns.prototype.navLoggedin = function () {
    $("#loggedout").hide();
    $("#loggedin").show();
}

blackHoleSuns.prototype.navLoggedout = function () {
    $("#loggedout").show();
    $("#loggedin").hide();
}

blackHoleSuns.prototype.updateUser = function (user, ifnew) {
    mergeObjects(bhs.user, user);
    delete bhs.user[starsCol];

    let ref = bhs.getUsersColRef(bhs.user.uid);
    if (ifnew)
        ref.set(bhs.user);
    else
        ref.update(bhs.user);
}

blackHoleSuns.prototype.changeName = function (loc, user) {
    if (user._name == bhs.user._name)
        return;

    if (user._name.match(/Unknown Traveler/i)) {
        $(loc).val(bhs.user._name);
        bhs.status("Player Name:" + user._name + " is restricted.", 0);
        return;
    }

    if (typeof user._name == "undefined" || user._name == "") {
        $(loc).val(bhs.user._name);
        bhs.status("Empty Player Name.", 0);
        return;
    }

    let ref = bhs.getUsersColRef().where("_name", "==", user._name);
    ref.get().then(async function (snapshot) {
        if (!snapshot.empty && snapshot.docs[0].data().uid != bhs.user.uid) {
            $(loc).val(bhs.user._name);
            bhs.status("Player Name:" + user._name + " is already taken.", 0);
        } else {
            bhs.user = mergeObjects(bhs.user, user);

            if (!bhs.user.assigned) {
                let ref = bhs.getStarsColRef("players");
                await ref.get().then(async function (doc) {
                    if (doc.exists) {
                        let d = doc.data();
                        if (typeof d[bhs.user._name] != "undefined") {
                            bhs.user[starsCol] = d[bhs.user._name];
                            bhs.user.assigned = true;
                            await bhs.assignUid(bhs.user);
                        }
                        bhs.user.assigned = true;
                    }
                });
            }

            let ref = bhs.getStarsColRef().where("totals.total", ">", 0);
            await ref.get().then(async function (snapshot) {
                for (let i = 0; i < snapshot.size; ++i) {
                    let doc = snapshot.docs[i];
                    let g = doc.data();

                    for (let k = 0; k < platformList.length; ++k) {
                        let ref = bhs.getStarsColRef(g.name, platformList[k].name);
                        ref = ref.where("uid", "==", bhs.user.uid);
                        await ref.get().then(async function (snapshot) {
                            for (let i = 0; i < snapshot.size; ++i) {
                                await snapshot.docs[i].ref.update({
                                    _name: user._name
                                });
                            }
                        });
                    }
                }
            });

            ref = bhs.getUsersColRef(bhs.user.uid);
            await ref.update(bhs.user);
        }
    });
}

blackHoleSuns.prototype.getEntry = function (addr, displayfcn, idx) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform, addr);
    ref.get().then(function (doc) {
        if (doc.exists) {
            let d = doc.data();
            displayfcn(d, d.blackhole ? 0 : 1);

            if (idx == 0) {
                if (!d.blackhole)
                    bhs.getEntryByConnection(d.addr, displayfcn, 1);
                else
                    bhs.getEntry(d.connection, displayfcn, 1);
            }
        }
    });
}

blackHoleSuns.prototype.getEntryByRegion = function (reg, displayfcn, idx) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform);
    ref = ref.where("reg", "==", reg);
    ref.get().then(function (snapshot) {
        if (!snapshot.empty) {
            let d = snapshot.docs[0].data();
            displayfcn(d, d.blackhole ? 0 : 1, $("#ck-zoomreg").prop("checked"));

            if (idx == 0) {
                if (!d.blackhole)
                    bhs.getEntryByConnection(d.addr, displayfcn, 1);
                else
                    bhs.getEntry(d.connection, displayfcn, 1);
            }
        }
    });
}

blackHoleSuns.prototype.getEntryByConnection = function (addr, displayfcn, idx) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform);
    ref = ref.where("connection", "==", addr);
    ref.get().then(function (snapshot) {
        if (!snapshot.empty) {
            let d = snapshot.docs[0].data();
            displayfcn(d, 0);
        }
    });
}

blackHoleSuns.prototype.updateEntry = async function (entry, admin) {
    entry.modded = firebase.firestore.Timestamp.now();
    entry.version = "next";

    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (doc.exists) {
            let existing = doc.data();
            if (existing.uid != bhs.user.uid && !admin) {
                bhs.status(entry.addr + " can only be edited by " + existing._name, 1);
                return;
            }
            
            entry = mergeObjects(existing, entry);
        } else
            entry.created = entry.modded;

        let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
        await ref.set(entry).then(function () {
            bhs.status(entry.addr + " saved.", 2);
        });
    });
}

blackHoleSuns.prototype.updateBase = function (entry) {
    entry.time = firebase.firestore.Timestamp.now();
    entry.version = "next";
    entry.xyzs = bhs.addressToXYZ(entry.addr);

    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr);
    ref.set(entry).then(function () {
        bhs.status(entry.addr + " base saved.", 2);
    });
}

blackHoleSuns.prototype.getBase = function (entry, displayfcn, idx) {
    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr);
    ref.get().then(function (doc) {
        if (doc.exists)
            displayfcn(doc.data(), idx);
    });
}

blackHoleSuns.prototype.deleteBase = function (addr) {
    let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform, addr);
    ref.delete().then(function () {
        bhs.status(addr + " base deleted.", 2);
    });
}

blackHoleSuns.prototype.getUsersColRef = function (uid, galaxy, platform, addr) {
    let ref = bhs.fs.collection(usersCol);
    if (uid) {
        ref = ref.doc(uid);
        if (galaxy) {
            ref = ref.collection(starsCol).doc(galaxy);
            if (platform) {
                ref = ref.collection(platform);
                if (addr) {
                    ref = ref.doc(addr);
                }
            }
        }
    }

    return ref;
}

blackHoleSuns.prototype.getStarsColRef = function (galaxy, platform, addr) {
    let ref = bhs.fs.collection(starsCol);
    if (galaxy) {
        ref = ref.doc(galaxy);
        if (platform) {
            ref = ref.collection(platform);
            if (addr) {
                ref = ref.doc(addr);
            }
        }
    }

    return ref;
}

blackHoleSuns.prototype.deleteEntry = async function (entry, admin) {
    if (entry) {
        let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
        await ref.get().then(async function (doc) {
            if (!doc.exists)
                bhs.status(entry.addr + " not found.", 0);
            else {
                let d = doc.data();
                if (d.uid == bhs.user.uid || admin) {
                    await ref.delete().then(async function () {
                        bhs.status(entry.addr + " deleted", 2);
                    });
                } else
                    bhs.status(entry.addr + " can only be deleted by " + d._name, 1);
            }
        });
    }
}

blackHoleSuns.prototype.assignUid = async function (entry) {
    let updt = {};
    updt.uid = entry.uid;
    updt._name = entry._name;

    let ref = bhs.getStarsColRef();
    ref = ref.where("totals.total", ">", 0);
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i) {
            if (snapshot.docs[i].id != "totals") {
                let g = snapshot.docs[i].data();

                for (let j = 0; j < platformList.length; ++j) {
                    let p = platformList[j];

                    let ref = bhs.getStarsColRef(g.name, p.name);
                    ref = ref.where("player", "==", entry._name)
                    await ref.get().then(async function (snapshot) {
                        if (!snapshot.empty) {
                            console.log(g.name + " " + p.name + " " + entry._name + " " + snapshot.size);

                            for (let k = 0; k < snapshot.size; ++k)
                                await bhs.batchUpdate(snapshot.docs[k].ref, updt);
                        }
                    });
                }
            }
        }
    });

    await bhs.checkBatchSize(true);
}

blackHoleSuns.prototype.getActiveContest = function (displayFcn) {
    bhs.contest = null;
    let now = (new Date()).getTime();

    let ref = bhs.fs.collection("contest");
    ref = ref.orderBy("start");
    ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.size; ++i) {
            let d = snapshot.docs[i].data();
            let start = d.start.toDate().getTime();
            let end = d.end.toDate().getTime();

            if (start < now && end > now || start > now || i == snapshot.size - 1) {
                bhs.subscribe("act-ctst", snapshot.docs[i].ref, displayFcn);
                break;
            }
        }
    });
}

blackHoleSuns.prototype.hideContest = function () {
    let now = (new Date()).getTime();

    let ref = bhs.fs.collection("contest");
    ref = ref.orderBy("start");
    ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.size; ++i) {
            let d = snapshot.docs[i].data();
            let start = d.start.toDate().getTime();
            let end = d.end.toDate().getTime();

            if (start < now && end > now || start > now) {
                d.hidden = true;
                snapshot.docs[i].ref.update(d);
                break;
            }
        }
    });
}

blackHoleSuns.prototype.listUsers = function () {
    let ref = bhs.getUsersColRef();
    ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.size; ++i) {
            let d = snapshot.docs[i].data();
            console.log(snapshot.docs[i].id + " " + d._name);
        }
    });
}

blackHoleSuns.prototype.searchTxt = async function () {
    let scount = {};
    let rcount = {};

    let ref = bhs.getStarsColRef();
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i) {
            let g = snapshot.docs[i].data()

            for (let j = 0; j < platformList.length; ++j) {
                let p = platformList[j];

                let ref = bhs.getStarsColRef(g.name, p.name);
                await ref.get().then(async function (snapshot) {
                    for (let i = 0; i < snapshot.size; ++i) {
                        let d = snapshot.docs[i].data();

                        if (!d.reg) {
                            console.log(d);
                            continue;
                        }

                        if (!d.sys) {
                            console.log(d);
                            continue;
                        }

                        let reg = d.reg.split(" ");
                        let r = reg.length > 1 ? reg[reg.length - 1] : "";

                        let sys = d.sys.split(" ");
                        let s = sys.length > 1 ? sys[sys.length - 1] : "";

                        if (r != "") {
                            if (typeof rcount[r] == "undefined")
                                rcount[r] = 0;
                            ++rcount[r];
                        }

                        if (s != "") {
                            if (typeof scount[s] == "undefined")
                                scount[s] = 0;
                            ++scount[s];
                        }
                    }
                });
            }
        }
    });

    Object.keys(rcount).forEach(r => {
        console.log("reg " + r + " " + rcount[r]);
    });
    Object.keys(scount).forEach(s => {
        console.log("sys " + s + " " + scount[s]);
    });
}

blackHoleSuns.prototype.updateDARC = async function () {
    var updateDARC = firebase.functions().httpsCallable('updateDARC');
    updateDARC()
        .then(function (result) {
            console.log(result.data);
        })
        .catch(function (err) {
            console.log(err);
        });
    return
}

blackHoleSuns.prototype.genDARC = async function () {
    var genDARC = firebase.functions().httpsCallable('genDARC');
    genDARC()
        .then(function (result) {
            console.log(result.data);
        })
        .catch(function (err) {
            console.log(err);
        });
    return
}

blackHoleSuns.prototype.testing = async function () {
    let ref = bhs.fs.collection("stars6")
    await ref.get().then(async snapshot => {
        let pr = []

        for (let gdoc of snapshot.docs) {
            for (let p of platformList) {
                let ref = gdoc.ref.collection(p.name);
                pr.push(ref.get().then(async snapshot => {
                    if (snapshot.size > 0) {
                        console.log(snapshot.docs[0].ref.parent.path, snapshot.size)

                        let count = 0
                        let b = bhs.fs.batch()

                        for (let doc of snapshot.docs) {
                            let e = doc.data()

                            let ref = bhs.fs.doc("stars5/" + e.galaxy + "/" + e.platform + "/" + e.addr)
                            await ref.get().then(doc => {
                                if (!doc.exists) {
                                    e.sys = typeof e.sys != "undefined" ? e.sys : ""
                                    e.reg = typeof e.reg != "undefined" ? e.reg : ""
                                    e.life = typeof e.life != "undefined" ? e.life : ""
                                    e.econ = typeof e.econ != "undefined" ? e.econ : ""
                                    e.blackhole = typeof e.blackhole != "undefined" ? e.blackhole : false
                                    e.deadzone = typeof e.deadzone != "undefined" ? e.deadzone : false

                                    delete e.conxyzs
                                    delete e.valid
                                    delete e.contest
                                    delete e.sun
                                    delete e.conflict

                                    if (++count >= 450) {
                                        b.commit().then(async () => {
                                            console.log(ref.path, count)
                                        })

                                        count = 0
                                        b = bhs.fs.batch()
                                    }

                                    b.set(ref, e)
                                }
                            })
                        }

                        return b.commit().then(async () => {
                            let doc = snapshot.docs[0]
                            let e = doc.data();

                            console.log("commit", doc.ref.parent.path, count)

                            let s5ref = bhs.fs.doc("stars5/" + e.galaxy)
                            let s6ref = bhs.fs.doc("stars6/" + e.galaxy)

                            return s6ref.get().then(async doc => {
                                if (doc.exists) {
                                    let e = doc.data();
                                    e.update = e.backup
                                    return s5ref.set(e)
                                }
                            })
                        })
                    }
                }))
            }
        }

        await Promise.all(pr).then((res) => {
            console.log("done")
        })
    })
}

// blackHoleSuns.prototype.checkDistance = async function () {
//     let t = {}
//     let start = 15000
//     let startOffset = 8600
//     let max = bhs.calcDist("07FF:007F:0000:0000")

//     let ref = bhs.getStarsColRef();
//     await ref.get().then(async snapshot => {
//         let pr = []

//         for (let i = 0; i < snapshot.docs.length; ++i) {
//             let g = snapshot.docs[i].data()

//             for (let j = 0; j < platformList.length; ++j) {
//                 let ref = bhs.getStarsColRef(g.name, platformList[j].name);
//                 ref = ref.where("blackhole", "==", true)
//                 pr.push(ref.get().then(async snapshot => {
//                     if (snapshot.size > 0) {
//                         console.log(snapshot.docs[0].ref.parent.path, snapshot.size)

//                         let r = e.dist
//                         let x = bhs.calcDist(e.connection)

//                         let c = r - start + startOffset

//                         if (r > 7500 && r < max && Math.abs(x - c) > 2000) {
//                             console.log(e.addr)
//                             list[e.connection] = {}
//                             list[e.connection].bh = e
//                             list[e.connection].bh.calc = c
//                             list[e.connection].bh.actual = x

//                             let ref = bhs.getStarsColRef("Euclid", "PC-XBox", e.connection);
//                             await ref.get().then(doc => {
//                                 if (doc.exists) {
//                                     list[e.connection].exit = doc.data()
//                                 }
//                             })
//                         }
//                     }
//                 }))
//             }
//         }

//         await Promise.all(pr).then((res) => {
//             console.log("done "+res.length)
//             return res
//         })
//     })
// }

blackHoleSuns.prototype.recalcTotals = function () {
    var recalcTotals = firebase.functions().httpsCallable('recalcTotals');
    recalcTotals()
        .then(function (result) {
            console.log(result.data);
        })
        .catch(function (err) {
            console.log(err);
        });
}

function addObjects(o, n) {
    if (typeof n != "object") {
        if (typeof n == "number") {
            if (typeof o == "undefined")
                o = 0;
            o += n;
        } else if (typeof n != "undefined")
            o = n;
    } else if (n) {
        if (typeof o == "undefined")
            o = {};
        let l = Object.keys(n);
        for (let i = 0; i < l.length; ++i) {
            let x = l[i];
            o[x] = addObjects(o[x], n[x]);
        }
    }

    return o;
}

blackHoleSuns.prototype.getEntries = async function (displayFcn, singleDispFcn, uid, galaxy, platform) {
    galaxy = galaxy ? galaxy : bhs.user.galaxy;
    platform = platform ? platform : bhs.user.platform;
    let complete = false;

    let ifindex = window.location.pathname == "/index.html" || window.location.pathname == "/";
    let ref = bhs.getStarsColRef(galaxy, platform);
    if (uid || ifindex) {
        ref = ref.where("uid", "==", uid ? uid : bhs.user.uid);
    } else
        complete = true;

    if (bhs.loaded && bhs.loaded[galaxy] && bhs.loaded[galaxy][platform]) {
        if (uid || ifindex) {
            uid = uid ? uid : bhs.user.uid;
            let list = Object.keys(bhs.list[galaxy][platform])
            for (let i = 0; i < list.length; ++i) {
                let e = bhs.list[galaxy][platform][list[i]];
                let k = Object.keys(e);
                if (e[k[0]].uid == uid)
                    bhs.entries[list[i]] = e;
            }
        } else
            bhs.entries = bhs.list[galaxy][platform];

        if (displayFcn)
            displayFcn(bhs.entries);
    } else {
        if (!bhs.list)
            bhs.list = {};
        if (!bhs.list[galaxy])
            bhs.list[galaxy] = {};
        if (!bhs.list[galaxy][platform])
            bhs.list[galaxy][platform] = {};

        let bhref = ref.where("blackhole", "==", true)
        await bhref.get().then(async function (snapshot) {
            for (let i = 0; i < snapshot.size; ++i)
                bhs.list[galaxy][platform][snapshot.docs[i].data().addr] = snapshot.docs[i].data()

            bhs.entries = bhs.list[galaxy][platform];

            if (complete) {
                if (typeof bhs.loaded == "undefined")
                    bhs.loaded = {};
                if (typeof bhs.loaded[galaxy] == "undefined")
                    bhs.loaded[galaxy] = {};

                bhs.loaded[galaxy][platform] = true;
            }

            if (ifindex)
                await blackHoleSuns.prototype.getBases(displayFcn, singleDispFcn);

            if (displayFcn)
                displayFcn(bhs.entries);
        });
    }

    if (singleDispFcn) {
        ref = ref.where("modded", ">", firebase.firestore.Timestamp.fromDate(new Date()));
        bhs.subscribe("entries", ref, singleDispFcn);
    }
}

blackHoleSuns.prototype.getOrgEntries = async function (displayFcn, singleFcn, name, galaxy, platform) {
    galaxy = galaxy ? galaxy : bhs.user.galaxy;
    platform = platform ? platform : bhs.user.platform;

    if (!bhs.loaded || !bhs.loaded[galaxy] || !bhs.loaded[galaxy][platform])
        await bhs.getEntries(displayFcn, singleFcn, null, galaxy, platform)

    let list = Object.keys(bhs.list[galaxy][platform])
    for (let i = 0; i < list.length; ++i) {
        let e = bhs.list[galaxy][platform][list[i]];
        let k = Object.keys(e);
        if (e[k[0]].org == name)
            bhs.entries[list[i]] = e;
    }

    if (displayFcn)
        displayFcn(bhs.entries);
}

blackHoleSuns.prototype.getBases = async function (displayFcn, singleDispFcn) {
    let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform);
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.size; ++i)
            bhs.entries = bhs.addBaseList(snapshot.docs[i].data(), bhs.entries)

        if (singleDispFcn) {
            let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform);
            ref = ref.where("modded", ">", firebase.firestore.Timestamp.fromDate(new Date()));
            bhs.subscribe("bases", ref, singleDispFcn);
        }
    });
}

blackHoleSuns.prototype.addBaseList = function (entry, list) {
    if (typeof list[entry.addr] == "undefined") {
        let found = false
        for (let k of Object.keys(list)) {
            let e = list[k]
            if (e.connection == entry.addr) {
                found = true
                e.x.basename = entry.basename
                e.x.owned = entry.owned
                break
            }
        }

        if (!found)
            list[entry.addr] = entry
    } else {
        list[entry.addr].basename = entry.basename
        list[entry.addr].owned = entry.owned
    }

    return list;
}

blackHoleSuns.prototype.dispBaseList = function (entry, id, displayFcn) {
    bhs.entries = bhs.addBaseList(entry, bhs.entries);
    displayFcn(bhs.entries);
}

blackHoleSuns.prototype.getUser = function (displayFcn) {
    let ref = bhs.getUsersColRef(bhs.user.uid);
    bhs.subscribe("user", ref, displayFcn);
}

blackHoleSuns.prototype.getOrgList = async function () {
    bhs.orgList = [];

    let ref = bhs.fs.collection("org")
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.size; ++i)
            bhs.orgList.push(snapshot.docs[i].data());

        await bhs.orgList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
            a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0);
    });
}

blackHoleSuns.prototype.getPoiList = async function () {
    bhs.poiList = [];

    let ref = bhs.fs.collection("poi")
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.size; ++i)
            bhs.poiList.push(snapshot.docs[i].data());

        await bhs.poiList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
            a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0);
    });
}

blackHoleSuns.prototype.getUserList = async function () {
    let list = [];

    let ref = bhs.fs.collection("users").orderBy("_name");
    await ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i) {
            let d = snapshot.docs[i].data();
            if (d._name != "" && d[starsCol] && d[starsCol].total > 0) {
                let u = {
                    name: d._name,
                    uid: d.uid
                };
                list.push(u);
            }
        }
    });

    return list;
}

blackHoleSuns.prototype.getTotals = async function (displayFcn, dispHtml) {
    let findex = window.location.pathname == "/index.html" || window.location.pathname == "/";
    let ftotals = window.location.pathname == "/totals.html";
    let fsearch = window.location.pathname == "/search.html";

    if (fsearch)
        return;

    var t = firebase.functions().httpsCallable('getTotals');

    if (ftotals) {
        t({
                view: "Galaxies"
            })
            .then(function (result) {
                dispHtml(result.data.html, "Galaxies")
            })
    }

    t({
            view: "Players"
        })
        .then(function (result) {
            dispHtml(result.data.html, "Players")
        })

    t({
            view: "Organizations"
        })
        .then(function (result) {
            dispHtml(result.data.html, "Organizations")
        })

    let ref = bhs.fs.doc("bhs/Totals")
    bhs.subscribe("tot-totals", ref, displayFcn)

    ref = bhs.fs.doc("bhs/Organizations")
    bhs.subscribe("tot-orgs", ref, displayFcn)

    if (findex) {
        ref = bhs.fs.doc("bhs/Players")
        bhs.subscribe("tot-players", ref, displayFcn)
    }

}

blackHoleSuns.prototype.subscribe = function (what, ref, displayFcn) {
    if (displayFcn) {
        bhs.unsubscribe(what);
        bhs.unsub[what] = ref.onSnapshot(function (snapshot) {
            if (snapshot.exists)
                displayFcn(snapshot.data(), snapshot.ref.path)
            else
                snapshot.docChanges().forEach(function (change) {
                    displayFcn(change.doc.data(), change.doc.ref.path);
                })
        })
    }
}

blackHoleSuns.prototype.unsubscribe = function (m) {
    let ulist = Object.keys(bhs.unsub);
    for (let i = 0; i < ulist.length; ++i) {
        let x = ulist[i];
        if (!m || x == m) {
            bhs.unsub[x]();
            delete bhs.unsub[x];
        }
    }
}

blackHoleSuns.prototype.validateUser = function (user) {
    let ok = true;

    if (!user._name || user._name == "" || user._name.match(/unknown traveler/i)) {
        bhs.status("Error: Missing or invalid player name. Changes not saved.", 0);
        ok = false;
    }

    if (ok && !user.galaxy) {
        bhs.status("Error: Missing galaxy. Changes not saved.", 0);
        ok = false;
    }

    if (ok && !user.platform) {
        bhs.status("Error: Missing platform. Changes not saved.", 0);
        ok = false;
    }

    return ok;
}

blackHoleSuns.prototype.validateEntry = function (entry) {
    let ok = true;
    let error = "";

    if (!entry.addr) {
        error += "Missing address. ";
        ok = false;
    }

    if (ok && !entry.sys) {
        error += "Missing system name. ";
        ok = false;
    }

    if (ok && !entry.reg) {
        error += "Missing region name. ";
        ok = false;
    }

    let str;
    if (ok && !entry.blackhole && !entry.deadzone && (str = validateExitAddress(entry.addr))) {
        error += "Invalid exit address. (" + str + ") ";
        ok = false;
    }

    if (ok && (entry.blackhole || entry.deadzone) && (str = validateBHAddress(entry.addr))) {
        error += "Invalid black hole address. (" + str + ") ";
        ok = false;
    }

    if (!ok)
        bhs.status("Error: " + error + "Changes not saved.", 0);

    return ok;
}

function loadHtml(url, alturl, selector) {
    loadFile(url, alturl, function (data) {
        let h = data.substring(data.indexOf("<body>") + 6, data.indexOf("</body>"));
        $(selector).html(h);

        if (selector === "#navbar") {
            $("#r2").css("margin-top", "30px");

            let navbarheight = $("#imported-navbar").outerHeight(true);
            $("#jssite").css("margin-top", navbarheight + "px");
            $("#loginpnl").css("margin-top", navbarheight + "px");

            $("#login").click(function () {
                bhs.logIn();
            });

            $("#logout").click(function () {
                bhs.logOut();
            });
        }
    });
}

function loadFile(url, alturl, fctn) {
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            fctn(data);
        },
        error: function (data) {
            if (alturl)
                loadFile(alturl, null, fctn);
        }
    });

    // let xhttp = new XMLHttpRequest();
    // xhttp.onreadystatechange = function () {
    //     if (this.readyState == 4) {
    //         if (this.status == 200)
    //             fctn(this.responseText);
    //         else if (alturl)
    //             loadFile(alturl, null, fctn);
    //     }
    // }
    // xhttp.open("GET", url, true);
    // xhttp.send();
}

function mergeObjects(o, n) {
    if (typeof n != "object") {
        o = n;
    } else if (n) {
        if (typeof o == "undefined")
            o = {};
        let l = Object.keys(n);
        for (let i = 0; i < l.length; ++i) {
            let x = l[i];
            o[x] = mergeObjects(o[x], n[x]);
        }
    }

    return o;
}

// String.prototype.idToName = function () {
//     let name = /--/g [Symbol.replace](this, "'");
//     name = /-/g [Symbol.replace](name, " ");

//     return name;
// }

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

String.prototype.nameToId = function () {
    let id = /[^a-z0-9_-]/ig [Symbol.replace](this, "-");
    return id;
}

function checkZeroAddress(addr) {
    return /(0{4}:){3}0{4}/.test(addr);
}

function reformatAddress(addr) {
    return bhs.reformatAddress(addr);
}

blackHoleSuns.prototype.reformatAddress = function (addr) {
    let str = /[^0-9A-F]+/g [Symbol.replace](addr.toUpperCase(), ":");
    str = str[0] == ":" ? str.slice(1) : str;
    let out = "";

    for (let i = 0; i < 4; ++i) {
        let idx = str.indexOf(":");
        let end = idx > 4 || idx == -1 ? 4 : idx;
        let s = str.slice(0, end);
        str = str.slice(end + (idx <= 4 && idx >= 0 ? 1 : 0));
        out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "");
    }

    return out;
}

String.prototype.stripColons = function () {
    return /:/g [Symbol.replace](this, "");
}

function validateAddress(addr, ck) {
    return bhs.validateAddress(addr, ck) == "";
}

function validateBHAddress(addr) {
    return bhs.validateAddress(addr, "bh");
}

function validateExitAddress(addr) {
    return bhs.validateAddress(addr, "exit");
}

blackHoleSuns.prototype.validateAddress = function (addr, ck) {
    let c = bhs.addressToXYZ(addr);
    let error = "";
    if (c.x > 0xfff) error = "x " + c.x.toString(16) + " > fff";
    else if (c.y > 0xff) error = "y " + c.y.toString(16) + " > ff";
    else if (c.z > 0xfff) error = "z " + c.z.toString(16) + " > fff";
    else if (c.s > 0x2ff) error = "system " + c.s.toString(16) + " > 2ff";
    else if (ck == "bh" && c.s != 0x79) error = ck + " system " + c.y.toString(16) + ' != 79';
    else if (ck == "exit" && c.y < 0x7B) error = ck + " y " + c.y.toString(16) + ' < 7b';
    else if (ck == "exit" && c.y > 0x83) error = ck + " y " + c.y.toString(16) + ' > 83';
    else if (ck == "exit" && c.s > 0x78) error = ck + " system " + c.s.toString(16) + ' > 78';

    return error;
}

blackHoleSuns.prototype.validateDist = function (entry, pstr, log) {
    let nok = false;
    let p = pstr ? pstr : "";
    if (nok = entry.dist < 3200)
        bhs.status(p + entry.addr + ` star in center void`, 0, log);
    else if (nok = (entry.dist > 3600 && entry.towardsCtr < 0))
        bhs.status(p + entry.addr + " => " + entry.connection + ` distance < 0`, 0, log);
    else if (nok = (entry.dist <= 3600 && entry.towardsCtr < -400))
        bhs.status(p + entry.addr + " => " + entry.connection + ` distance < -400`, 0, log);
    else if (nok = (entry.towardsCtr > 21000 && entry.dist <= 819200))
        bhs.status(p + entry.addr + " => " + entry.connection + ` distance > 21000`, 0, log);

    return !nok;
}

blackHoleSuns.prototype.makeBHAddress = function (addr) {
    return addr.toUpperCase().slice(0, 16) + "0079";
}

function tolower(val) {
    return val.toLowerCase();
}

String.prototype.stripID = function () {
    return this.replace(/^.*?-(.*)/, "$1");
}

String.prototype.stripMarginWS = function () {
    return this.replace(/^\s*(.*)\s*$/g, "$1");
}

function stripNumber(val) {
    return val.stripNumber();
}

String.prototype.stripNumber = function () {
    return this.replace(/\s*-?\d*\.*\s*(\D*)\s*/, "$1");
}

function formatEcon(val) {
    return bhs.formatListSel(val, economyList);
}

function formatConflict(val) {
    return bhs.formatListSel(val, conflictList);
}

function formatGalaxy(val) {
    return bhs.formatListSel(val, galaxyList);
}

function formatOrg(val) {
    return bhs.formatListSel(val, bhs.orgList);
}

blackHoleSuns.prototype.formatListSel = function (val, list) {
    let name = val.stripNumber();
    if (name == "") {
        let num = val.replace(/(\d+).*/, "$1");
        let idx = bhs.getIndex(list, "number", num);
        if (idx != -1)
            name = list[idx].name;
    } else {
        let idx = bhs.getIndex(list, "name", name);
        if (idx != -1)
            name = list[idx].name;
    }

    return name;
}

blackHoleSuns.prototype.getIndex = function (list, field, id) {
    if (!id)
        return -1;

    return list.map(function (x) {
        return typeof x[field] == "string" ? x[field].toLowerCase() : x[field];
    }).indexOf(id.toLowerCase());
}

blackHoleSuns.prototype.buildGalaxyInfo = function () {
    bhs.galaxyInfo = [];
    bhs.galaxyInfo[1] = {};
    bhs.galaxyInfo[1].color = "#ffffff";

    for (let i = 0; i < galaxyRaw.length; ++i) {
        for (let j = galaxyRaw[i].start, step = 0; j <= 256;) {
            if (typeof bhs.galaxyInfo[j] == "undefined") {
                bhs.galaxyInfo[j] = {};
                bhs.galaxyInfo[j].color = galaxyRaw[i].color;
            }

            j += step++ % 2 ? galaxyRaw[i].step1 : galaxyRaw[i].step2;
        }
    }
}

blackHoleSuns.prototype.getAngles = function (loc, dest) {

}


blackHoleSuns.prototype.addressToXYZ = function (addr) {
    let out = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    };

    // xxx:yyy:zzz:sss
    if (addr) {
        out.x = parseInt(addr.slice(0, 4), 16);
        out.y = parseInt(addr.slice(5, 9), 16);
        out.z = parseInt(addr.slice(10, 14), 16);
        out.s = parseInt(addr.slice(15), 16);
    }

    return out;
}

blackHoleSuns.prototype.xyzToAddress = function (xyz) {
    let x = xyz.x.toString(16);
    let z = xyz.y.toString(16);
    let y = xyz.z.toString(16);

    let addr = x + "." + y + "." + z + "." + "0";
    return bhs.reformatAddress(addr);
}

blackHoleSuns.prototype.addrToGlyph = function (addr) {
    let s = "";

    //const portalFormat = "psssyyxxxzzz";

    if (addr) {
        let xyz = bhs.addressToXYZ(addr);
        let xs = "00" + xyz.s.toString(16).toUpperCase();
        let xx = "00" + (xyz.x + 0x801).toString(16).toUpperCase();
        let xy = "00" + (xyz.y + 0x81).toString(16).toUpperCase();
        let xz = "00" + (xyz.z + 0x801).toString(16).toUpperCase();

        s = "0";
        s += xs.slice(xs.length - 3);
        s += xy.slice(xy.length - 2);
        s += xz.slice(xz.length - 3);
        s += xx.slice(xx.length - 3);
    }

    return s;
}

blackHoleSuns.prototype.calcDist = function (addr, addr2) {
    if (!addr)
        return addr;

    let cord = bhs.addressToXYZ(addr);
    let cord2 = addr2 ? bhs.addressToXYZ(addr2) : {
        x: 0x7ff,
        y: 0x7f,
        z: 0x7ff
    };
    let d = parseInt(Math.sqrt(Math.pow(cord2.x - cord.x, 2) + Math.pow(cord2.y - cord.y, 2) + Math.pow(cord2.z - cord.z, 2)) * 400);
    return d;
}

blackHoleSuns.prototype.calcXYZDist = function (xyz1, xyz2) {
    let d = parseInt(Math.sqrt(Math.pow(xyz1.x - xyz2.x, 2) + Math.pow(xyz1.y - xyz2.y, 2) + Math.pow(xyz1.z - xyz2.z, 2)));
    return d;
}

Date.prototype.toDateLocalTimeString = function () {
    let date = this;
    return date.getFullYear() +
        "-" + ten(date.getMonth() + 1) +
        "-" + ten(date.getDate()) +
        " " + ten(date.getHours()) +
        ":" + ten(date.getMinutes());
}

function ten(i) {
    return i < 10 ? '0' + i : i;
}

function formatLife(val) {
    if (val.match(/^g/i)) return "Gek";
    else if (val.match(/^k/i)) return "Korvax";
    else if (val.match(/^v/i)) return "Vy'keen";
    else return "";
}

function formatPlatform(val) {
    if (val.match(/^ps/i)) return "PS4";
    else return "PC-XBox";
}

function formatOwned(val) {
    if (val.match(/^s/i)) return ("station");
    if (val.match(/^v/i)) return ("visited");
    else return ("mine");
}

const lifeformList = [{
    name: "Vy'keen",
    match: /^v/i
}, {
    name: "Gek",
    match: /^g/i
}, {
    name: "Korvax",
    match: /^k/i
}, {
    name: "none"
}];

const platformList = [{
    name: "PC-XBox",
    match: /pc|xbox/i
}, {
    name: "PS4",
    match: /ps4/i
}];

const modeList = [{
    name: "Normal",
}, {
    name: "Survival",
}, {
    name: "Permadeath",
}, {
    name: "Creative",
}];

const economyList = [{
    name: "Declining",
    number: 1
}, {
    name: "Destitute",
    number: 1

}, {
    name: "Failing",
    number: 1

}, {
    name: "Fledgling",
    number: 1

}, {
    name: "Low supply",
    number: 1

}, {
    name: "Struggling",
    number: 1

}, {
    name: "Unpromising",
    number: 1

}, {
    name: "Unsuccessful",
    number: 1

}, {
    name: "Adequate",
    number: 2

}, {
    name: "Balanced",
    number: 2

}, {
    name: "Comfortable",
    number: 2

}, {
    name: "Developing",
    number: 2

}, {
    name: "Medium Supply",
    number: 2

}, {
    name: "Promising",
    number: 2

}, {
    name: "Satisfactory",
    number: 2

}, {
    name: "Sustainable",
    number: 2

}, {
    name: "Advanced",
    number: 3

}, {
    name: "Affluent",
    number: 3

}, {
    name: "Booming",
    number: 3

}, {
    name: "Flourishing",
    number: 3

}, {
    name: "High Supply",
    number: 3

}, {
    name: "Opulent",
    number: 3

}, {
    name: "Prosperous",
    number: 3

}, {
    name: "Wealthy",
    number: 3
}];

const conflictList = [{
    name: "Gentle",
    number: 1
}, {
    name: "Low",
    number: 1
}, {
    name: "Mild",
    number: 1
}, {
    name: "Peaceful",
    number: 1
}, {
    name: "Relaxed",
    number: 1
}, {
    name: "Stable",
    number: 1
}, {
    name: "Tranquil",
    number: 1
}, {
    name: "Trivial",
    number: 1
}, {
    name: "Unthreatening",
    number: 1
}, {
    name: "Untroubled",
    number: 1
}, {
    name: "Medium",
    number: 2
}, {
    name: "Belligerent",
    number: 2
}, {
    name: "Boisterous",
    number: 2
}, {
    name: "Fractious",
    number: 2
}, {
    name: "Intermittent",
    number: 2
}, {
    name: "Medium",
    number: 2
}, {
    name: "Rowdy",
    number: 2
}, {
    name: "Sporadic",
    number: 2
}, {
    name: "Testy",
    number: 2
}, {
    name: "Unruly",
    number: 2
}, {
    name: "Unstable",
    number: 2
}, {
    name: "High",
    number: 3
}, {
    name: "Aggressive",
    number: 3
}, {
    name: "Alarming",
    number: 3
}, {
    name: "At War",
    number: 3
}, {
    name: "Critical",
    number: 3
}, {
    name: "Dangerous",
    number: 3
}, {
    name: "Destructive",
    number: 3
}, {
    name: "Formidable",
    number: 3
}, {
    name: "High",
    number: 3
}, {
    name: "Lawless",
    number: 3
}, {
    name: "Perilous",
    number: 3
}];

const starClassPossible = "OBAFGKMLTYE"
const starOdditiesPossible = "efhkmnpqsvw";
const starTypeRegex = /[OBAFGKMLTYE][0-9][efhkmnpqsvw]*/i;
const levelRgb = ["#ffffff", "#ffc0c0", "#ffff00", "#c0ffc0"];

// from https://nomanssky.gamepedia.com/Galaxy
const galaxyRaw = [{
    name: "harsh",
    color: "#f3636b",
    start: 3,
    step1: 12,
    step2: 8
}, {
    name: "empty",
    color: "#65ccf4",
    start: 7,
    step1: 5,
    step2: 15
}, {
    name: "lush",
    color: "#62f97a",
    start: 9,
    step1: 9,
    step2: 11
}, {
    name: "norm",
    color: "#88fefa",
    start: 2,
    step1: 1,
    step2: 1
}];

const galaxyList = [{
    name: "Euclid",
    number: 1,
}, {
    name: "Hilbert Dimension",
    number: 2
}, {
    name: "Calypso",
    number: 3
}, {
    name: "Hesperius Dimension",
    number: 4
}, {
    name: "Hyades",
    number: 5
}, {
    name: "Ickjamatew",
    number: 6
}, {
    name: "Budullangr",
    number: 7
}, {
    name: "Kikolgallr",
    number: 8
}, {
    name: "Eltiensleen",
    number: 9
}, {
    name: "Eissentam",
    number: 10
}, {
    name: "Elkupalos",
    number: 11
}, {
    name: "Aptarkaba",
    number: 12
}, {
    name: "Ontiniangp",
    number: 13
}, {
    name: "Odiwagiri",
    number: 14
}, {
    name: "Ogtialabi",
    number: 15
}, {
    name: "Muhacksonto",
    number: 16
}, {
    name: "Hitonskyer",
    number: 17
}, {
    name: "Rerasmutul",
    number: 18
}, {
    name: "Isdoraijung",
    number: 19
}, {
    name: "Doctinawyra",
    number: 20
}, {
    name: "Loychazinq",
    number: 21
}, {
    name: "Zukasizawa",
    number: 22
}, {
    name: "Ekwathore",
    number: 23
}, {
    name: "Yeberhahne",
    number: 24
}, {
    name: "Twerbetek",
    number: 25
}, {
    name: "Sivarates",
    number: 26
}, {
    name: "Eajerandal",
    number: 27
}, {
    name: "Aldukesci",
    number: 28
}, {
    name: "Wotyarogii",
    number: 29
}, {
    name: "Sudzerbal",
    number: 30
}, {
    name: "Maupenzhay",
    number: 31
}, {
    name: "Sugueziume",
    number: 32
}, {
    name: "Brogoweldian",
    number: 33
}, {
    name: "Ehbogdenbu",
    number: 34
}, {
    name: "Ijsenufryos",
    number: 35
}, {
    name: "Nipikulha",
    number: 36
}, {
    name: "Autsurabin",
    number: 37
}, {
    name: "Lusontrygiamh",
    number: 38
}, {
    name: "Rewmanawa",
    number: 39
}, {
    name: "Ethiophodhe",
    number: 40
}, {
    name: "Urastrykle",
    number: 41
}, {
    name: "Xobeurindj",
    number: 42
}, {
    name: "Oniijialdu",
    number: 43
}, {
    name: "Wucetosucc",
    number: 44
}, {
    name: "Ebyeloofdud",
    number: 45
}, {
    name: "Odyavanta",
    number: 46
}, {
    name: "Milekistri",
    number: 47
}, {
    name: "Waferganh",
    number: 48
}, {
    name: "Agnusopwit",
    number: 49
}, {
    name: "Teyaypilny",
    number: 50
}, {
    name: "Zalienkosm",
    number: 51
}, {
    name: "Ladgudiraf",
    number: 52
}, {
    name: "Mushonponte",
    number: 53
}, {
    name: "Amsentisz",
    number: 54
}, {
    name: "Fladiselm",
    number: 55
}, {
    name: "Laanawemb",
    number: 56
}, {
    name: "Ilkerloor",
    number: 57
}, {
    name: "Davanossi",
    number: 58
}, {
    name: "Ploehrliou",
    number: 59
}, {
    name: "Corpinyaya",
    number: 60
}, {
    name: "Leckandmeram",
    number: 61
}, {
    name: "Quulngais",
    number: 62
}, {
    name: "Nokokipsechl",
    number: 63
}, {
    name: "Rinblodesa",
    number: 64
}, {
    name: "Loydporpen",
    number: 65
}, {
    name: "Ibtrevskip",
    number: 66
}, {
    name: "Elkowaldb",
    number: 67
}, {
    name: "Heholhofsko",
    number: 68
}, {
    name: "Yebrilowisod",
    number: 69
}, {
    name: "Husalvangewi",
    number: 70
}, {
    name: "Ovna'uesed",
    number: 71
}, {
    name: "Bahibusey",
    number: 72
}, {
    name: "Nuybeliaure",
    number: 73
}, {
    name: "Doshawchuc",
    number: 74
}, {
    name: "Ruckinarkh",
    number: 75
}, {
    name: "Thorettac",
    number: 76
}, {
    name: "Nuponoparau",
    number: 77
}, {
    name: "Moglaschil",
    number: 78
}, {
    name: "Uiweupose",
    number: 79
}, {
    name: "Nasmilete",
    number: 80
}, {
    name: "Ekdaluskin",
    number: 81
}, {
    name: "Hakapanasy",
    number: 82
}, {
    name: "Dimonimba",
    number: 83
}, {
    name: "Cajaccari",
    number: 84
}, {
    name: "Olonerovo",
    number: 85
}, {
    name: "Umlanswick",
    number: 86
}, {
    name: "Henayliszm",
    number: 87
}, {
    name: "Utzenmate",
    number: 88
}, {
    name: "Umirpaiya",
    number: 89
}, {
    name: "Paholiang",
    number: 90
}, {
    name: "Iaereznika",
    number: 91
}, {
    name: "Yudukagath",
    number: 92
}, {
    name: "Boealalosnj",
    number: 93
}, {
    name: "Yaevarcko",
    number: 94
}, {
    name: "Coellosipp",
    number: 95
}, {
    name: "Wayndohalou",
    number: 96
}, {
    name: "Smoduraykl",
    number: 97
}, {
    name: "Apmaneessu",
    number: 98
}, {
    name: "Hicanpaav",
    number: 99
}, {
    name: "Akvasanta",
    number: 100
}, {
    name: "Tuychelisaor",
    number: 101
}, {
    name: "Rivskimbe",
    number: 102
}, {
    name: "Daksanquix",
    number: 103
}, {
    name: "Kissonlin",
    number: 104
}, {
    name: "Aediabiel",
    number: 105
}, {
    name: "Ulosaginyik",
    number: 106
}, {
    name: "Roclaytonycar",
    number: 107
}, {
    name: "Kichiaroa",
    number: 108
}, {
    name: "Irceauffey",
    number: 109
}, {
    name: "Nudquathsenfe",
    number: 110
}, {
    name: "Getaizakaal",
    number: 111
}, {
    name: "Hansolmien",
    number: 112
}, {
    name: "Bloytisagra",
    number: 113
}, {
    name: "Ladsenlay",
    number: 114
}, {
    name: "Luyugoslasr",
    number: 115
}, {
    name: "Ubredhatk",
    number: 116
}, {
    name: "Cidoniana",
    number: 117
}, {
    name: "Jasinessa",
    number: 118
}, {
    name: "Torweierf",
    number: 119
}, {
    name: "Saffneckm",
    number: 120
}, {
    name: "Thnistner",
    number: 121
}, {
    name: "Dotusingg",
    number: 122
}, {
    name: "Luleukous",
    number: 123
}, {
    name: "Jelmandan",
    number: 124
}, {
    name: "Otimanaso",
    number: 125
}, {
    name: "Enjaxusanto",
    number: 126
}, {
    name: "Sezviktorew",
    number: 127
}, {
    name: "Zikehpm",
    number: 128
}, {
    name: "Bephembah",
    number: 129
}, {
    name: "Broomerrai",
    number: 130
}, {
    name: "Meximicka",
    number: 131
}, {
    name: "Venessika",
    number: 132
}, {
    name: "Gaiteseling",
    number: 133
}, {
    name: "Zosakasiro",
    number: 134
}, {
    name: "Drajayanes",
    number: 135
}, {
    name: "Ooibekuar",
    number: 136
}, {
    name: "Urckiansi",
    number: 137
}, {
    name: "Dozivadido",
    number: 138
}, {
    name: "Emiekereks",
    number: 139
}, {
    name: "Meykinunukur",
    number: 140
}, {
    name: "Kimycuristh",
    number: 141
}, {
    name: "Roansfien",
    number: 142
}, {
    name: "Isgarmeso",
    number: 143
}, {
    name: "Daitibeli",
    number: 144
}, {
    name: "Gucuttarik",
    number: 145
}, {
    name: "Enlaythie",
    number: 146
}, {
    name: "Drewweste",
    number: 147
}, {
    name: "Akbulkabi",
    number: 148
}, {
    name: "Homskiw",
    number: 149
}, {
    name: "Zavainlani",
    number: 150
}, {
    name: "Jewijkmas",
    number: 151
}, {
    name: "Itlhotagra",
    number: 152
}, {
    name: "Podalicess",
    number: 153
}, {
    name: "Hiviusauer",
    number: 154
}, {
    name: "Halsebenk",
    number: 155
}, {
    name: "Puikitoac",
    number: 156
}, {
    name: "Gaybakuaria",
    number: 157
}, {
    name: "Grbodubhe",
    number: 158
}, {
    name: "Rycempler",
    number: 159
}, {
    name: "Indjalala",
    number: 160
}, {
    name: "Fontenikk",
    number: 161
}, {
    name: "Pasycihelwhee",
    number: 162
}, {
    name: "Ikbaksmit",
    number: 163
}, {
    name: "Telicianses",
    number: 164
}, {
    name: "Oyleyzhan",
    number: 165
}, {
    name: "Uagerosat",
    number: 166
}, {
    name: "Impoxectin",
    number: 167
}, {
    name: "Twoodmand",
    number: 168
}, {
    name: "Hilfsesorbs",
    number: 169
}, {
    name: "Ezdaranit",
    number: 170
}, {
    name: "Wiensanshe",
    number: 171
}, {
    name: "Ewheelonc",
    number: 172
}, {
    name: "Litzmantufa",
    number: 173
}, {
    name: "Emarmatosi",
    number: 174
}, {
    name: "Mufimbomacvi",
    number: 175
}, {
    name: "Wongquarum",
    number: 176
}, {
    name: "Hapirajua",
    number: 177
}, {
    name: "Igbinduina",
    number: 178
}, {
    name: "Wepaitvas",
    number: 179
}, {
    name: "Sthatigudi",
    number: 180
}, {
    name: "Yekathsebehn",
    number: 181
}, {
    name: "Ebedeagurst",
    number: 182
}, {
    name: "Nolisonia",
    number: 183
}, {
    name: "Ulexovitab",
    number: 184
}, {
    name: "Iodhinxois",
    number: 185
}, {
    name: "Irroswitzs",
    number: 186
}, {
    name: "Bifredait",
    number: 187
}, {
    name: "Beiraghedwe",
    number: 188
}, {
    name: "Yeonatlak",
    number: 189
}, {
    name: "Cugnatachh",
    number: 190
}, {
    name: "Nozoryenki",
    number: 191
}, {
    name: "Ebralduri",
    number: 192
}, {
    name: "Evcickcandj",
    number: 193
}, {
    name: "Ziybosswin",
    number: 194
}, {
    name: "Heperclait",
    number: 195
}, {
    name: "Sugiuniam",
    number: 196
}, {
    name: "Aaseertush",
    number: 197
}, {
    name: "Uglyestemaa",
    number: 198
}, {
    name: "Horeroedsh",
    number: 199
}, {
    name: "Drundemiso",
    number: 200
}, {
    name: "Ityanianat",
    number: 201
}, {
    name: "Purneyrine",
    number: 202
}, {
    name: "Dokiessmat",
    number: 203
}, {
    name: "Nupiacheh",
    number: 204
}, {
    name: "Dihewsonj",
    number: 205
}, {
    name: "Rudrailhik",
    number: 206
}, {
    name: "Tweretnort",
    number: 207
}, {
    name: "Snatreetze",
    number: 208
}, {
    name: "Iwunddaracos",
    number: 209
}, {
    name: "Digarlewena",
    number: 210
}, {
    name: "Erquagsta",
    number: 211
}, {
    name: "Logovoloin",
    number: 212
}, {
    name: "Boyaghosganh",
    number: 213
}, {
    name: "Kuolungau",
    number: 214
}, {
    name: "Pehneldept",
    number: 215
}, {
    name: "Yevettiiqidcon",
    number: 216
}, {
    name: "Sahliacabru",
    number: 217
}, {
    name: "Noggalterpor",
    number: 218
}, {
    name: "Chmageaki",
    number: 219
}, {
    name: "Veticueca",
    number: 220
}, {
    name: "Vittesbursul",
    number: 221
}, {
    name: "Nootanore",
    number: 222
}, {
    name: "Innebdjerah",
    number: 223
}, {
    name: "Kisvarcini",
    number: 224
}, {
    name: "Cuzcogipper",
    number: 225
}, {
    name: "Pamanhermonsu",
    number: 226
}, {
    name: "Brotoghek",
    number: 227
}, {
    name: "Mibittara",
    number: 228
}, {
    name: "Huruahili",
    number: 229
}, {
    name: "Raldwicarn",
    number: 230
}, {
    name: "Ezdartlic",
    number: 231
}, {
    name: "Badesclema",
    number: 232
}, {
    name: "Isenkeyan",
    number: 233
}, {
    name: "Iadoitesu",
    number: 234
}, {
    name: "Yagrovoisi",
    number: 235
}, {
    name: "Ewcomechio",
    number: 236
}, {
    name: "Inunnunnoda",
    number: 237
}, {
    name: "Dischiutun",
    number: 238
}, {
    name: "Yuwarugha",
    number: 239
}, {
    name: "Ialmendra",
    number: 240
}, {
    name: "Reponudrle",
    number: 241
}, {
    name: "Rinjanagrbo",
    number: 242
}, {
    name: "Zeziceloh",
    number: 243
}, {
    name: "Oeileutasc",
    number: 244
}, {
    name: "Zicniijinis",
    number: 245
}, {
    name: "Dugnowarilda",
    number: 246
}, {
    name: "Neuxoisan",
    number: 247
}, {
    name: "Ilmenhorn",
    number: 248
}, {
    name: "Rukwatsuku",
    number: 249
}, {
    name: "Nepitzaspru",
    number: 250
}, {
    name: "Chcehoemig",
    number: 251
}, {
    name: "Haffneyrin",
    number: 252
}, {
    name: "Uliciawai",
    number: 253
}, {
    name: "Tuhgrespod",
    number: 254
}, {
    name: "Iousongola",
    number: 255
}, {
    name: "Odyalutai",
    number: 256
}, {
    name: "Yilsrussimil",
    number: 257
}, {
    name: "Loqvishess",
    number: -6
}, {
    name: "Enyokudohkiw",
    number: -5
}, {
    name: "Helqvishap",
    number: -4
}, {
    name: "Usgraikik",
    number: -3
}, {
    name: "Hiteshamij",
    number: -2
}, {
    name: "Uewamoisow",
    number: -1
}, {
    name: "Pequibanu",
    number: 0
}];

const starClassList = [{
    name: "O",
    temp: "≥ 30,000K",
    color: "blue"
}, {
    name: "B",
    temp: "10,000-30,000K",
    color: "blue white"
}, {
    name: "A",
    temp: "7,500-10,000K",
    color: "white"
}, {
    name: "F",
    temp: "6,000-7,500K",
    color: "yellow white"
}, {
    name: "G",
    temp: "5,200-6,000K",
    color: "yellow"
}, {
    name: "K",
    temp: "3,700-5,200K",
    color: "orange"
}, {
    name: "M",
    temp: "2,400-3,700K",
    color: "red"
}, {
    name: "L",
    temp: "1,300-2,400K",
    color: "red brown"
}, {
    name: "T",
    temp: "500-1,300K",
    color: "brown"
}, {
    name: "Y",
    temp: "≤ 500K",
    color: "dark brown"
}, {
    name: "E",
    temp: "unknown",
    color: "green"
}];

const starOdditiesList = [{
    name: "e",
    type: "Emission lines present"
}, {
    name: "f",
    type: "N III and He II emission"
}, {
    name: "h",
    type: "WR stars with emission lines due to hydrogen"
}, {
    name: "k",
    type: "Spectra with interstellar absorption features"
}, {
    name: "m",
    type: "Enhanced metal features"
}, {
    name: "n",
    type: "Broad ('nebulous') absorption due to spinning"
}, {
    name: "p",
    type: "Unspecified peculiarity"
}, {
    name: "q",
    type: "Red & blue shifts line present"
}, {
    name: "s",
    type: "Narrowly sharp absorption lines"
}, {
    name: "v",
    type: "Variable spectral feature"
}, {
    name: "w",
    type: "Weak lines"
}];