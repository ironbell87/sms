// cbl = cable, wgt = weight = pendulum
const g_bg_sz = [700, 1000]; // size of svg for problem
const g_mat = [["A", "B", "C", "D", "E"],
               [2200, 3150, 4660, 5219, 6000]];
let g_setting = { A: 3.0, L: 60.0, P: 500.0, E: 2200.0 };
let g_scaler;

$(document).ready(function () {
    // update sectional area
    $(document).on("input", "#input_M", function () {
        var mat_idx = parseInt($(this).val());
        g_setting.E = g_mat[1][mat_idx];
        $("#label_M").html("Type " + g_mat[0][mat_idx]);
        draw_setting();
    });
    $(document).on("input", "#input_L", function () {
        g_setting.L = parseFloat($(this).val());
        $("#label_L").html(g_setting.L.toFixed(g_digit) + " mm");
        draw_setting();
    });
    $(document).on("input", "#input_P", function () {
        g_setting.P = parseFloat($(this).val());
        $("#label_P").html(g_setting.P.toFixed(g_digit) + " N");
        draw_setting();
    });
    $(document).on("input", "#input_A", function () {
        g_setting.A = parseFloat($(this).val());
        $("#label_A").html(g_setting.A.toFixed(g_digit) + " mm<sup>2</sup>");
        draw_setting();
    });

    // initialize svg
    $("#prob_svg").empty(); // delete the existing child svgs for all svgs
    var sx = g_bg_sz[0] / 2, sy = gv_ele_unit;
    g_structure = d3.select("#prob_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + ", " + sy + ")");
    g_scaler = d3.scaleLinear().domain([0, 120]).range([0, g_bg_sz[1] - 2 * gv_ele_unit]); // scale domain to pixel

    // draw scale
    g_structure.append("g").classed("major_axis", true)
        .call(d3.axisRight(g_scaler).ticks(40).tickSize(20));
    g_structure.append("g").classed("minor_axis", true)
        .call(d3.axisLeft(g_scaler).ticks(200).tickSize(20).tickPadding(600));

    // draw
    draw_setting();
});

function draw_setting() {
    // prepare data
    var sp = { x: 0, y: 0 }, ep = { x: 0, y: g_scaler(g_setting.L) }; // length
    var dia = Math.sqrt(g_scaler(g_setting.A)); // diameter
    var wgt = Math.sqrt(g_scaler(g_setting.P)); // tension
    var dot_radius = gv_ele_unit / 6;
    var dt = g_setting.P * g_setting.L / (g_setting.E * g_setting.A); // axial displacement
    var delta = g_scaler(dt + get_random(-dt * 0.05, dt * 0.05));

    // draw cbl
    g_structure.selectAll(".cbl").data([g_setting]).join("rect").classed("cbl", true)
        .attr("x", -dia / 2).attr("y", 0)
        .attr("width", dia).attr("height", ep.y)
        .attr("style", "fill:lightgrey; stroke:dimgrey");
    //var defs = g_structure.append("defs");
    //var filter = defs.append("filter")
    //    .attr("id", "svg_blur").attr("width", "250%");
    //filter.append("feGaussianBlur")
    //    .attr("in", "SourceAlpha").attr("stdDeviation", 15);
    g_structure.selectAll(".delta").data([g_setting]).join("rect").classed("delta", true)
        //.attr("transform", cbl => "translate(" + cbl.seg.sp.x + ", " + cbl.seg.sp.y + ") rotate(" + cbl.seg.ng + ")") // do not know why "rotate and then translate" does not work!!
        .attr("x", -dia / 2).attr("y", ep.y)
        .attr("width", dia).attr("height", delta)
        //.attr("style", "fill:#ff6f6f; stroke:red; filter:'url(#svg_blur)'");
        .attr("style", "fill:#ff6f6f; stroke:red;");

    // draw pin (support)
    g_structure.selectAll(".pin").data([g_setting]).join("circle") // pin for support
        .classed("pin", true)
        .attr("cx", 0).attr("cy", 0)
        .attr("r", gv_ele_unit / 2)
        .attr("style", "fill:lightgrey; stroke-width:2; stroke:dimgrey");

    // draw wgt
    g_structure.selectAll(".wgt").data([wgt]).join("rect")
        .classed("wgt", true)
        .attr("x", -wgt / 2).attr("y", ep.y + delta)
        .attr("width", wgt).attr("height", wgt)
        .attr("style", "fill:lightgrey; stroke:dimgrey; opacity:0.7");
}