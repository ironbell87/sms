const g_target = ["σ<sub>x</sub> (bending stress)", "τ<sub>xy</sub> (shear stress)"];

$(document).ready(function () {
    // update setting
    $(document).on("input", "#input_Layer", function () {
        g_setting.Layer = parseInt($(this).val());
        $("#label_Layer").html(g_setting.Layer);
        draw_measurement();
    });
    $(document).on("input", "#input_Target", function () {
        var target_idx = parseInt($(this).val());
        g_setting.Target = g_target[target_idx];
        $("#label_Target").html(g_setting.Target);
        draw_measurement();
    });

    // initialize svg
    initialize_svg();
    $("#gauge_sapce").css("height", "140px");
    g_setting.L = g_span = 360.0; g_loc_fr = g_loc_to = 180;
    g_setting.P = g_load = 20000.0;
    g_setting.b = 25.00, g_setting.h = 50.00;
    g_setting.Layer = 10;
    g_setting.Target = "σ<sub>x</sub> (bending stress)";

    // draw section and problem
    draw_section();
    draw_beam_problem();
    draw_measurement();
});

function draw_measurement() {
    // initialize svg
    $("#deflection_svg").empty();
    g_deflection = d3.select("#deflection_svg").append("g") // set svg group
        .attr("transform", "translate(100, " + 5 * gv_ele_unit + ")");

    // set scaler
    g_beam_scaler = d3.scaleLinear().domain([0, g_setting.L]).range([0, gv_span]); // scale domain to pixel
    g_defl_scaler = d3.scaleLinear().domain([0, g_setting.L * 2 / 5]).range([0, gv_span * 2 / 5]); // scale domain to pixel

    // draw outline path
    if (g_setting.Layer == undefined) g_setting.Layer = 7;
    var inc = Math.max(round_by_unit((g_setting.h / g_setting.Layer), 2), 2);
    var xxs = d3.range(0, g_setting.L + inc, inc); // 0, 1*inc, 2*inc, 3*inc, ... g_setting.L
    var yys = Array(xxs.length).fill(0); //get_deflections(xxs);
    var neu_path = top_path = btm_path = "M0,0";
    yys.forEach(function (yy, i) {
        var top_pnt = rotate_xy(0, -g_setting.h / 2, 0); //, get_rotation(xxs[i]));
        neu_path += "L" + g_beam_scaler(xxs[i]) + "," + g_beam_scaler(yy);
        top_path += "L" + g_beam_scaler(xxs[i] + top_pnt.x) + "," + g_beam_scaler(yy + top_pnt.y);
        btm_path += "L" + g_beam_scaler(xxs[i] - top_pnt.x) + "," + g_beam_scaler(yy - top_pnt.y);
    });
    top_path += "L" + g_beam_scaler(last_of(xxs)) + "," + g_beam_scaler(last_of(yys));
    btm_path += "L" + g_beam_scaler(last_of(xxs)) + "," + g_beam_scaler(last_of(yys));
    g_deflection.selectAll(".defl_path").data([neu_path, top_path, btm_path]).join("path").classed("defl_path", true)
        .attr("style", "stroke:dimgrey; stroke-width:2; fill:transparent")
        .attr("d", d => d);

    // solve and prepare data
    xxs.shift(), yys.shift(); // remove the first element
    var lys = d3.range(0, g_setting.Layer); // 0, 1, 2, ... g_num_layer - 1
    var bm_lyrs = [], inc = g_setting.h / g_setting.Layer;
    lys.forEach(function (lyr, ii) {
        var elv = (ii + 1 / 2) * inc - g_setting.h / 2; // elevation; from top to bottom
        var pre = create_point(0, 0);//get_deflection(0));
        yys.forEach(function (def_y, i) {
            // basic position of rectangle
            var nxt = create_point(xxs[i], yys[i]);
            var ref = create_point((pre.x + nxt.x) / 2, elv); // reference(center) x for calculation of bending stress
            var top = create_point(0, elv - inc / 2);
            var btm = create_point(0, elv + inc / 2);
            // rotated and moved position of quadrilateral
            var pre_top = move_xy(rotate_point(top, 0), pre.x, pre.y);//get_rotation(pre.x)), pre.x, pre.y);
            var nxt_top = move_xy(rotate_point(top, 0), nxt.x, nxt.y);//get_rotation(nxt.x)), nxt.x, nxt.y);
            var pre_btm = move_xy(rotate_point(btm, 0), pre.x, pre.y);//get_rotation(pre.x)), pre.x, pre.y);
            var nxt_btm = move_xy(rotate_point(btm, 0), nxt.x, nxt.y);//get_rotation(nxt.x)), nxt.x, nxt.y);
            // scale from real to svg
            pre_top = scale_point(pre_top, g_beam_scaler);
            nxt_top = scale_point(nxt_top, g_beam_scaler);
            pre_btm = scale_point(pre_btm, g_beam_scaler);
            nxt_btm = scale_point(nxt_btm, g_beam_scaler);
            // create beam layer and add to array
            bm_lyrs.push(create_beam_layer(ref, pre_top, pre_btm, nxt_top, nxt_btm));
            pre = nxt;
        });
    });

    // draw beam layrs
    var color_scaler = d3.scaleLinear().domain([-1, 1]).range([0, 1]); // scale domain to pixel
    //var sigma_max = get_sigma_max(40000); // 40000 = max of load P
    var sigma_max = 6 * (40000 * 480 / 4) / (20 * 40 * 40); // sigma_max = M_max/S_min = 6*(PL/4)/(b*h*h)
    if (g_setting.Support == g_support[1]) sigma_max = 6 * (40000 * 480) / (20 * 40 * 40); // sigma_max = M_max/S_min = 6*(PL)/(b*h*h)
    var tau_max = (40000 / 2) * (20 * 40 * 40 / 8) / (20 * 40 * 40 * 40 / 12) / 20; // tau_max = V_max*G_max/(I*b) = (P/2)(b*h*h/8)/(b*h*h*h/12)/b
    if (g_setting.Support == g_support[1]) tau_max = (40000) * (20 * 40 * 40 / 8) / (20 * 40 * 40 * 40 / 12) / 20; // tau_max = V_max*G_max/(I*b) = (P)(b*h*h/8)/(b*h*h*h/12)/b
    g_deflection.selectAll(".beam_layer").data(bm_lyrs).join("path").classed("beam_layer", true)
        .attr("style", "stroke-width:0.5; stroke:lightgrey")
        .style("fill", lyr => (g_setting.Target == g_target[0]) ? d3.interpolateSpectral(color_scaler(lyr.sigma / sigma_max * 5)) : d3.interpolateSpectral(color_scaler(lyr.tau / (0.25 * sigma_max) * 5)))
        .attr("d", lyr => "M" + lyr.pt.x + "," + lyr.pt.y + "L" + lyr.pb.x + "," + lyr.pb.y + " " + lyr.nb.x + "," + lyr.nb.y + " " + lyr.nt.x + "," + lyr.nt.y + "Z")
        .on("mouseenter", function () { mouse_enter(d3.select(this)); })
        .on("mouseleave", function () { mouse_leave(d3.select(this)); });
}

function create_beam_layer(p_ref, p_pt, p_pb, p_nt, p_nb) {
    return {
        ref: p_ref, // center of rectangle
        pt: p_pt, pb: p_pb, nt: p_nt, nb: p_nb, // vertex of quadrilateral
        cnt: create_point((p_pt.x + p_pb.x + p_nt.x + p_nb.x) / 4, (p_pt.y + p_pb.y + p_nt.y + p_nb.y) / 4), // center of quadrilateral
        moment: get_moment(p_ref.x), shear: get_shear(p_ref.x), y: p_ref.y, I: g_setting.I(),
        sigma: get_sigma(p_ref.x, p_ref.y), tau: get_tau(p_ref.x, p_ref.y)
    };
}

function get_moment(p_xx) { // valid for point load at center or tip
    // coefficients of moment curve
    var cfs = [g_setting.P, -g_setting.P * g_setting.L]; // cantilever
    if (g_setting.Support == g_support[0]) cfs = [g_setting.P / 2, 0]; // simple beam

    // get moment
    if (g_setting.Support == g_support[0]) { // simple beam
        if (p_xx <= g_setting.L / 2) return poly_val(cfs, p_xx);
        else return poly_val(cfs, (g_setting.L - p_xx)); // deflection is symmetric
    }
    else { // cantilever
        return poly_val(cfs, p_xx); // poly_val for p_xx
    }
}

function get_moment_max(p_load) {
    if (p_load == undefined) p_load = g_setting.P;
    var mnt = p_load * g_setting.L; // cantilever
    if (g_setting.Support == g_support[0]) mnt = p_load * g_setting.L / 4; // simple beam
    return mnt;
}

function get_shear(p_xx) { // valid for point load at center or tip
    if (g_setting.Support == g_support[0]) { // simple beam
        if (p_xx <= g_setting.L / 2) return g_setting.P / 2;
        else return -g_setting.P / 2;
    }
    else { // cantilever
        return g_setting.P;
    }
}

function get_shear_max(p_load) {
    if (p_load == undefined) p_load = g_setting.P;
    var shr = p_load; // cantilever
    if (g_setting.Support == g_support[0]) shr = p_load / 2; // simple beam
    return shr;
}

function get_sigma(p_xx, p_y) { // p_y = normal distance from neutral axis
    return get_moment(p_xx) * p_y / g_setting.I();
}

function get_sigma_max(p_load) {
    return get_moment_max(p_load) * (g_setting.h / 2) / g_setting.I();
}

function get_tau(p_xx, p_y) { // p_y = normal distance from neutral axis
    var h = g_setting.h / 2 - p_y, b = g_setting.b;
    var G = b * h * (h / 2 + p_y);
    return get_shear(p_xx) * G / (g_setting.I() * b);
}

function get_tau_max(p_load) {
    var h = g_setting.h / 2, b = g_setting.b;
    var G = b * h * (h / 2);
    return get_shear_max(p_load) * G / (g_setting.I() * b);
}

function mouse_enter(p_d3) {
    // add, scale, and move selected piece
    var scale_rto = 3;
    var lyr = p_d3.datum();
    p_d3.clone(true).raise().attr("id", "zoomed")
        .style("stroke", "purple").style("stroke-width", "0.5").style("opacity", .7)
        .attr("transform", "translate(" + -lyr.cnt.x * (scale_rto - 1) + "," + -lyr.cnt.y * (scale_rto - 1) + ") scale(" + scale_rto + "," + scale_rto + ")");

    // show tooltip
    var err_max = lyr.sigma * 0.025; // +-2.5%
    if (g_setting.Target == g_target[1]) err_max = lyr.tau * 0.025; // +-2.5%
    var err = get_random(-err_max, err_max); // err = 0; // comment out this for the exact values
    var tooltip_text = "σ<sub_white>x</sub_white> = " + (lyr.sigma + err).toFixed(g_digit * 2) + " MPa<br />at (" + (lyr.ref.x).toFixed(g_digit) + ", " + (-lyr.ref.y).toFixed(g_digit) + ")";
    if (g_setting.Target == g_target[1]) tooltip_text = "τ<sub_white>xy</sub_white> = " + (lyr.tau + err).toFixed(g_digit * 2) + " MPa<br />at (" + (lyr.ref.x).toFixed(g_digit) + ", " + (-lyr.ref.y).toFixed(g_digit) + ")";
    g_tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div").classed("tooltip", true)
        .style("left", (d3.event.pageX - 70).toString() + "px")
        .style("top", (d3.event.pageY - 70).toString() + "px")
        .style("width", "170px").style("height", "56px")
        .style("opacity", .8)
        .html(tooltip_text);
}

function mouse_leave(p_d3) {
    // remove pointed line piece
    d3.select("#zoomed").remove();

    // hide tooltip
    g_tooltip.style("opacity", 0);
    g_tooltip = undefined;
}