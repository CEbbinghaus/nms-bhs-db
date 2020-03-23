'use strict'

// Copyright 2019-2020 Black Hole Suns
// Written by Stephen Piper

$(document).ready(() => {
    $("#javascript").remove()
    $("#jssite").show()

    $("body").tooltip({
        selector: '[data-toggle="tooltip"]'
    })

    $("#bhsmenus").load("bhsmenus.html", () => {
        $("#login").hide()

        let page = window.location.pathname.replace(/(.*)\//, "$1")
        let loc = $("[href='" + page + "']")
        $("#pagename").html(loc.text())

        $("#banner").on("load", () => {
            let width = $("body").width()
            loc = $("[src='images/bhs-banner.jpg']")
            let iwidth = loc.width()
            let iheight = loc.height() * width / iwidth

            loc.width(width)
            loc.height(iheight)
        })
    })

    $("#footer").load("footer.html")

   let gloc = $("[id='glyphbuttons']")
    addGlyphButtons(gloc, addGlyph)
    buildGlyphModal(dispGlyph)
})

function dispAddr(evt) {
    let loc = $(evt).closest(".card")
    let addr = loc.find("#id-addr").val()

    if (addr !== "") {
        addr = reformatAddress(addr)
        loc.find("#id-addr").val(addr)

        let planet = loc.find("#id-planet").val()
        let glyph = addrToGlyph(addr, planet)
        loc.find("#id-glyph").text(glyph)
        loc.find("#id-hex").text(glyph)
    }
}

function dispGlyph(evt) {
    let glyph = typeof evt === "string" ? evt : $(evt).val().toUpperCase()
    if (glyph !== "") {
        let addr = reformatAddress(glyph)
        let planet = glyph.slice(0, 1)
        let loc = $("#glyph-card")
        loc.find("#id-glyph").val(glyph)
        loc.find("#id-addr").text(addr)
        loc.find("#id-planet").text(planet)
    }
}

function addGlyph(evt) {
    let loc = $(evt).closest(".card").find("#id-glyph")
    let a = loc.val() + $(evt).text().trim().slice(0, 1)
    loc.val(a)

    if (a.length === 12)
        dispGlyph(loc)
}
