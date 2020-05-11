// cbl = cable, wgt = weight = pendulum
const g_bg_sz = [700, 1000]; // size of svg for problem
const g_mat = [["A", "B", "C", "D", "E"],
               [2200, 3150, 4660, 5219, 6000]];
const g_support = ["Simple support", "Cantilever"];
let g_setting = { b: 30.0, h: 50.0, L: 600.0, P: 100.0, E: 2200.0, Support: "Simple support", I: function () { return this.b * Math.pow(this.h, 3) / 12; } };
let g_section, g_deflection, g_section_scaler, g_beam_scaler, g_defl_scaler, g_scale_x = gv_span / 2;

$(document).ready(function () {
    // update setting
    $(document).on("input", "#input_S", function () {
        var spt_idx = parseInt($(this).val());
        g_setting.Support = g_support[spt_idx];
        if (g_setting.Support == g_support[0]) g_loc_fr = g_loc_to = g_span / 2; // in simple beam, load at beam center
        else g_loc_fr = g_loc_to = g_span; // in cantilever beam, load at beam tip
        $("#label_S").html(g_setting.Support);
        draw_problem();
        draw_measurement();
    });
    $(document).on("input", "#input_M", function () {
        var mat_idx = parseInt($(this).val());
        g_setting.E = g_mat[1][mat_idx];
        $("#label_M").html("Type " + g_mat[0][mat_idx]);
        draw_measurement();
    });
    $(document).on("input", "#input_E", function () { // this part is used in "51.deflection.html"
        g_setting.E = parseFloat($(this).val());
        $("#label_E").html(g_setting.E.toFixed(g_digit) + " MPa");
        draw_measurement();
    });
    $(document).on("input", "#input_L", function () {
        g_setting.L = parseFloat($(this).val());
        $("#label_L").html(g_setting.L.toFixed(g_digit) + " mm");
        var ratio = g_setting.L / g_span;
        g_span = g_setting.L;
        g_loc_fr = g_loc_fr * ratio; // rounding to 0, 5, 10, ... makes large error
        g_loc_to = g_loc_to * ratio;
        draw_problem();
        draw_measurement();
    });
    $(document).on("input", "#input_P", function () {
        g_setting.P = parseFloat($(this).val());
        $("#label_P").html(g_setting.P.toFixed(g_digit) + " N");
        g_load = g_setting.P;
        draw_problem();
        draw_measurement();
    });
    $(document).on("input", "#input_b", function () {
        g_setting.b = parseFloat($(this).val());
        $("#label_b").html(g_setting.b.toFixed(g_digit) + " mm");
        draw_section();
        draw_problem();
        draw_measurement();
    });
    $(document).on("input", "#input_h", function () {
        g_setting.h = parseFloat($(this).val());
        $("#label_h").html(g_setting.h.toFixed(g_digit) + " mm");
        draw_section();
        draw_problem();
        draw_measurement();
    });

    // initialize svg
    initialize_svg();

    // draw section and problem
    draw_section();
    draw_problem();
    draw_measurement();
});

function drag_load_started() {
    // intentionally do nothing to override this function at "21.simple_beam.js"
}
function drag_load_ing() {
    // intentionally do nothing to override this function at "21.simple_beam.js"
}
function drag_load_ended() {
    // intentionally do nothing to override this function at "21.simple_beam.js"
}

function initialize_svg() {
    $("#setting_space").css("width", "350px");

    var sx = g_bg_sz[0] / 2, sy = gv_ele_unit;
    $("#section_svg, #prob_svg, #deflection_svg").empty();
    g_section = d3.select("#section_svg").append("g") // set svg group
        .attr("transform", "translate(150, 175)");
    g_structure = d3.select("#prob_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + ", " + sy + ")");
}

function draw_section() {
    // set scaler
    g_section_scaler = d3.scaleLinear().domain([0, 60]).range([0, 200]); // scale domain to pixel

    // prepare data
    var b = g_section_scaler(g_setting.b);
    var h = g_section_scaler(g_setting.h);

    // draw section
    g_section.selectAll(".section").data([g_setting]).join("rect").classed("section", true)
        .attr("x", -b / 2).attr("y", -h / 2)
        .attr("width", b).attr("height", h)
        .attr("style", "fill:lightgrey; stroke:dimgrey");
    g_section.selectAll(".centroid").data([g_setting]).join("line").classed("centroid", true)
        .attr("x1", -b / 2 - gv_ele_unit).attr("y1", 0)
        .attr("x2", b / 2 + gv_ele_unit).attr("y2", 0)
        .attr("stroke-dasharray", "16 4 4 4") // line 16, space 4, line 4, space 4, repeat; line-dot-line
        .attr("style", "stroke:dimgrey");

    // dimensions
    gv_ratio_len = b / g_setting.b; // used in draw_dimensions
    draw_dimensions(g_section, -b / 2, 0, 0, "b_dim", [g_setting.b], h / 2 + gv_margin_unit, "mm", "dn", false);
    draw_dimensions(g_section, 0, h / 2, -90, "h_dim", [g_setting.h], b / 2 + 2 * gv_margin_unit, "mm", "dn", false);
}

function draw_problem() {
    if (g_setting.Support == g_support[0]) draw_simple_beam_problem();
    else draw_cantilever_beam_problem();
}

function draw_measurement() {
    // initialize svg
    $("#deflection_svg").empty();
    g_deflection = d3.select("#deflection_svg").append("g") // set svg group
        .attr("transform", "translate(100, " + 4 * gv_ele_unit + ")");

    // set scaler
    var xxs = d3.range(0, g_setting.L + 5, 5); // 0, 1, 2, 3, ... g_setting.L
    var yys = get_deflections(xxs);
    var defl_max = Math.max(...yys); // ... spread operator : spread all the element
    g_beam_scaler = d3.scaleLinear().domain([0, g_setting.L]).range([0, gv_span]); // scale domain to pixel
    g_defl_scaler = d3.scaleLinear().domain([0, defl_max * 1.2]).range([0, 200]); // scale domain to pixel
    if (g_setting.P == 0) { g_defl_scaler = d3.scaleLinear().domain([0, defl_max * 1.2]).range([0, 0]); } // in case of no load

    // path string
    var defl_path = "M0,0";
    yys.forEach(function (yy, i) { defl_path += "L" + g_beam_scaler(xxs[i]) + "," + g_defl_scaler(yy); });
    g_deflection.selectAll(".defl_path").data([defl_path]).join("path").classed("defl_path", true)
        .attr("style", "stroke:dimgrey; stroke-width:2; fill:transparent")
        .attr("d", d_path => d_path);

    // draw pin, scale and tangent line
    draw_gauges();
}

function draw_gauges() {
    // draw pin (support)
    g_deflection.selectAll(".pin").data([0, gv_span]).join("circle") // pin for support
        .classed("pin", true)
        .attr("cx", x => x).attr("cy", 0)
        .attr("r", gv_ele_unit / 6)
        .attr("style", "fill:lightgrey; stroke-width:2; stroke:dimgrey");

    // draw scale
    g_deflection.selectAll(".major_x_axis").data([0]).join("g").classed("major_x_axis", true)
        .call(d3.axisTop(g_beam_scaler).ticks(6).tickSize(10));
    g_deflection.selectAll(".minor_x_axis").data([0]).join("g").classed("minor_x_axis", true)
        .call(d3.axisBottom(g_beam_scaler).ticks(120).tickSize(5).tickPadding(600));
    var d3_y_axis = g_deflection.selectAll(".y_axis").data([0]).join("g").classed("y_axis", true)
        .attr("transform", "translate(" + g_scale_x + ", 0)");
    d3_y_axis.selectAll(".major_y_axis").data([0]).join("g").classed("major_y_axis", true)
        .call(d3.axisRight(g_defl_scaler).ticks(10).tickSize(10));
    d3_y_axis.selectAll(".minor_y_axis").data([0]).join("g").classed("minor_y_axis", true)
        .call(d3.axisLeft(g_defl_scaler).ticks(20).tickSize(5).tickPadding(600).tickFormat(5, ".5s"));
    d3_y_axis.selectAll(".holder").data([gv_span]).join("circle") // pin for support
        .classed("holder", true)
        .attr("cx", 0).attr("cy", 0)
        .attr("r", gv_ele_unit / 3)
        .attr("style", "cursor:pointer; fill:lightgrey; stroke-width:2; stroke:dimgrey")
        .call(d3.drag()
            .container(g_deflection.node())
            .on("start", drag_scale_started)
            .on("drag", drag_scale_ing)
            .on("end", drag_scale_ended));

    // get and draw tangent line
    var lines = get_tangent_line();
    draw_tangent_line(d3_y_axis, lines);
}

function draw_tangent_line(p_d3, p_data) {
    p_d3.selectAll(".tangent_line").data(p_data).join("line")
        .classed("tangent_line", true).lower()
        .attr("x1", ln => g_beam_scaler(ln.sx) - g_scale_x).attr("y1", ln => g_defl_scaler(ln.sy))
        .attr("x2", ln => g_beam_scaler(ln.ex) - g_scale_x).attr("y2", ln => g_defl_scaler(ln.ey))
        .attr("stroke-dasharray", "3 3") // line 3, space 3; line-line
        .attr("style", "stroke:#ff6f6f; stroke-width:2;");
    p_d3.selectAll(".slope_text").data([p_data[1]]).join("text")
        .classed("slope_text", true).lower()
        .attr("x", ln => g_beam_scaler(ln.sx) - g_scale_x).attr("y", ln => g_defl_scaler((ln.sy + ln.ey) / 2) + 20)
        .text(ln => (ln.slp * get_random(0.995, 1.005)).toExponential(5)); // -5% ~ +5%
}

function get_rotation(p_xx) {
    // coefficients for slope curve
    var cfs = [-1 / 2, g_setting.L, 0]; // cantilever
    if (g_setting.Support == g_support[0]) cfs = [-1 / 4, 0, Math.pow(g_setting.L, 2) / 16]; // simple beam

    // multiply P / EI
    var P_EI = g_setting.P / (g_setting.E * g_setting.I()); // P / EI
    cfs.forEach(function (c, i, arr) { arr[i] *= P_EI; }); // c won't modified

    // get slope
    if (g_setting.Support == g_support[0]) { // simple beam
        if (p_xx <= g_setting.L / 2) return poly_val(cfs, p_xx);
        else return -poly_val(cfs, (g_setting.L - p_xx)); // slope is asymmetric
    }
    else { // cantilever
        return poly_val(cfs, p_xx); // poly_val for p_xx
    }
}

function get_deflection(p_xx) {
    // coefficients of deflection curve
    var cfs = [-1 / 6, g_setting.L / 2, 0, 0]; // cantilever
    if (g_setting.Support == g_support[0]) cfs = [-1 / 12, 0, Math.pow(g_setting.L, 2) / 16, 0]; // simple beam

    // multiply P / EI
    var P_EI = g_setting.P / (g_setting.E * g_setting.I()); // P / EI
    cfs.forEach(function (c, i, arr) { arr[i] *= P_EI; }); // c won't modified

    // get deflection
    if (g_setting.Support == g_support[0]) { // simple beam
        if (p_xx <= g_setting.L / 2) return poly_val(cfs, p_xx);
        else return poly_val(cfs, (g_setting.L - p_xx)); // deflection is symmetric
    }
    else { // cantilever
        return poly_val(cfs, p_xx); // poly_val for p_xx
    }
}

function get_deflections(p_xxs) {
    var crds = [];
    p_xxs.forEach(function (xx) {
        crds.push(get_deflection(xx));
    });
    return crds;

    //// coefficients of deflection curve
    //var cfs = [-1 / 6, g_setting.L / 2, 0, 0]; // cantilever
    //var new_xxs = p_xxs.slice(0); // copy array (shallow copy)
    //if (g_setting.Support == g_support[0]) {
    //    cfs = [-1 / 12, 0, Math.pow(g_setting.L, 2) / 16, 0]; // simple beam
    //    for (var i = Math.ceil(p_xxs.length / 2); i < p_xxs.length; i++) new_xxs.push()[i] = (g_setting.L - p_xxs[i]); // deflection is symmetric
    //}

    //// multiply P / EI
    //var P_EI = g_setting.P / (g_setting.E * (g_setting.b * Math.pow(g_setting.h, 3) / 12)); // P / EI
    //cfs.forEach(function (c, i, arr) { arr[i] *= P_EI; }); // c won't modified

    //// get deflection
    //if (g_setting.Support == g_support[0]) return poly_vals(cfs, new_xxs); // simple beam
    //else return poly_vals(cfs, p_xxs); // cantilever
}

function get_tangent_line() {
    var x = Math.round(g_beam_scaler.invert(g_scale_x)), y = get_deflection(x);
    var a = get_rotation(x), b = -a * x + y;
    var ref_line = {
        sx: -0.2 * g_setting.L + x, sy: y,
        ex: x + 0.2 * g_setting.L, ey: y,
        slp: 0
    };
    var tngt_line = {
        sx: ref_line.sx, sy: poly_val([a, b], ref_line.sx),
        ex: ref_line.ex, ey: poly_val([a, b], ref_line.ex),
        slp: a
    };
    return [ref_line, tngt_line];
}

function drag_scale_started() { }
function drag_scale_ing() {
    // limit the dragging scope
    if (d3.event.x < 0) return;
    if (gv_span < d3.event.x) return;
    g_scale_x = Math.round(d3.event.x); // round to integer

    // update tangent line
    var lines = get_tangent_line();
    draw_tangent_line(d3.select(this.parentNode), lines);

    // drag
    d3.select(this.parentNode).attr("transform", "translate(" + g_scale_x + ", 0)");
}
function drag_scale_ended() { }