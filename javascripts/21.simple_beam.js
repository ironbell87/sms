var g_span = 600, g_load = 100, g_load_type = "point", g_loc_fr = 300, g_loc_to = 300;
var g_V_a = 50, g_V_b = 50, g_H = 0;
var gv_pre_x, gv_pre_y, gv_pre_load_width; // for dragging

$(document).ready(function () {
    // check input value, initializing, get input data, draw simple beam, loads
    draw_simple_beam_problem();

    $(".smt_solve").click(function () {
        // if already solved, then no input is modified
        if ($(".smt_solve").val() == "The problem is solved!") return;

        // draw FBD
        draw_simple_beam_FBD();

        // solve
        solve_simple_beam_problem();

        //draw_point_load(g_simple_beam, 0, 0 - g_sec_h / 2, 0, 2 * g_sec_h, "kN");
        //draw_point_moment(g_simple_beam, g_span / 2, 0, 90, 100, "ccw", "kN-m");

        //// draw cantilever beam
        //sy += hgt;
        //var cantilever_beam = d3.select("svg").append("g") // set svg group
        //    .attr("transform", "translate(" + sx + "," + sy + ") rotate(" + 0 + ")"); // translate and then rotate
        //draw_cantilever_beam(cantilever_beam, 0, 0, 0, span, sect_hgt, "free");
        //draw_dimensions(cantilever_beam, 0, 0, 0, [span], sect_hgt * 2, "mm", "dn");
        //draw_uniform_load(cantilever_beam, 0, 0 - sect_hgt / 2, 0, 190, 2 * sect_hgt, "kN/m");

        //// draw simple Gerber beam
        //sy += hgt;
        //var Gerber_beam = d3.select("svg").append("g") // set svg group
        //    .attr("transform", "translate(" + sx + "," + sy + ") rotate(" + 0 + ")"); // translate and then rotate
        //draw_simple_Gerber_beam(Gerber_beam, 0, 0, 0, span, sect_hgt, "roller", span / 3, span / 2);
        //var n_len = Math.min(span / 3, span / 2), f_len = Math.max(span / 3, span / 2);
        //draw_dimensions(Gerber_beam, 0, 0, 0, [n_len, f_len - n_len, span - f_len], sect_hgt * 3, "mm", "dn");

        //// draw cantilever Gerber beam
        //sy += hgt;
        //var Gerber_beam = d3.select("svg").append("g") // set svg group
        //    .attr("transform", "translate(" + sx + "," + sy + ") rotate(" + 0 + ")"); // translate and then rotate
        //draw_cantilever_Gerber_beam(Gerber_beam, 0, 0, 0, span, sect_hgt, "free", span / 3);
        //draw_dimensions(Gerber_beam, 0, 0, 0, [span / 3, span - (span / 3)], sect_hgt * 3, "mm", "dn");

        //// simple frame
        //sy += 3 * hgt;
        //var simple_frm = d3.select("svg").append("g") // set svg group
        //    .attr("transform", "translate(" + sx + "," + sy + ") rotate(" + 20 + ")"); // translate and then rotate
        //draw_2c_1b_simple_frame(simple_frm, 0, 0, 0, span, hgt, sect_hgt, "roller");
        //draw_uniform_load(simple_frm, 0 - sect_hgt / 2, 0, -90, hgt, 2 * sect_hgt, "kN/m"); // distributed load on left column
        //draw_uniform_load(simple_frm, 0, 0 - hgt - sect_hgt / 2, 0, span, 2 * sect_hgt, "kN/m"); // distributed load on beam
        //draw_uniform_load(simple_frm, 0 + span + sect_hgt / 2, 0 - hgt, 90, hgt, 2 * sect_hgt, "kN/m"); // distributed load on right column
        //draw_point_moment(simple_frm, 0 + span, -hgt / 2, -90, 100, "cw", "kN-m");
        //draw_dimensions(simple_frm, 0, 0, -90, [hgt], -sect_hgt * 4, "mm", "up");
        //draw_dimensions(simple_frm, 0, 0 - sect_hgt / 2, 0, [span], sect_hgt * 3, "mm", "dn");
        //draw_dimensions(simple_frm, 0 + span, 0 - hgt, 90, [hgt], -sect_hgt * 4, "mm", "up");

        $("#output_space").fadeIn(); // 1sec.
        $(".smt_solve").val("The problem is solved!");
    });

    $("#submit_number").click(function () {
        // change or not
        var is_changed = false;

        // get input value
        var input_value = parseFloat($("#input_number").val());

        // respond to change
        switch ($("#span_number").text()) { // get type of input = magnitude of load, span length, ...
            case "load_magnitude":
                if (input_value <= 0) { alert("Load must be positive! Solve again!"); return; }
                if (input_value != g_load) { // no consideration for position of load is needed
                    g_load = input_value;
                    is_changed = true;
                }
                if (g_load_type != $("#select_load_type option:selected").val()) { // consideration for position of load is needed
                    g_load_type = $("#select_load_type option:selected").val();
                    if (g_load_type == "point") { // unifrom ==> point
                        g_loc_to = g_loc_fr;
                    }
                    else { // point ==> uniform
                        if (g_loc_fr == g_span) g_loc_fr = 0;
                        g_loc_to = g_span;
                    }
                    is_changed = true;
                }
                break;
            case "span_length":
                if (input_value <= 0) { alert("Span must be positive! Solve again!"); return; }
                if (input_value != g_span) { // consideration for position of load is needed
                    var ratio = input_value / g_span;
                    g_span = input_value;
                    g_loc_fr = round_by_unit(g_loc_fr * ratio, 5); // round to 0, 5, 10, 15, ...
                    g_loc_to = round_by_unit(g_loc_to * ratio, 5); // round to 0, 5, 10, 15, ...
                    is_changed = true;
                }
                break;
            default: break;
        }

        // update problem (svg) and UI
        $("#div_input_outer").fadeOut();
        if (is_changed) {
            draw_simple_beam_problem();
            $("#output_space").fadeOut(); // 1sec.
            $(".smt_solve").val("Click to solve the problem!");
        }
    });

    //d3.select("#prob_space").on("click", function () {
    //    var x = d3.event.x;// - $(this).offset().left;
    //    var y = d3.event.y;// - $(this).offset().top;
    //});

    // cause automatic click event for "Solve" button
    //$(".smt_solve").trigger("click");
});

function click_load() {
    // get location of input
    var x = d3.event.x;// - $(this).offset().left;
    var y = d3.event.y;// - $(this).offset().top;

    // in case of input button for load magnitude
    //if (this.parentNode.parentNode.id == "prob_svg") { // this(force_group) ==> svg.id == "prov_svg"
    //if (this.parentNode.parentNode.parentNode.id == "prob_svg") { // this(load_magnitude) ==> force_group ==> svg.id = "prov_svg"
        $("#input_number").val(g_load);
        $("#select_load_type").val(g_load_type).show(); // set value and show
        $("#span_number").text(this.id);
        $("#div_input_inner").css("left", x.toString() + "px").css("top", y.toString() + "px");
        $("#div_input_outer").fadeIn();
    //}
}

function click_span() {
    // get location of input
    var x = d3.event.x;
    var y = d3.event.y;

    // in case of input button for span
    $("#input_number").val(g_span);
    $("#select_load_type").hide(); // only hide
    $("#span_number").text(this.id);
    $("#div_input_inner").css("left", x.toString() + "px").css("top", y.toString() + "px");
    $("#div_input_outer").fadeIn();
}

function drag_load_started() {
    // set point at start of drag
    gv_pre_x = d3.event.x;
    gv_pre_y = d3.event.y;
    gv_pre_load_width = (g_loc_to - g_loc_fr) * gv_ratio_len;

    // show tooltip
    g_tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("left", d3.event.sourceEvent.clientX.toString() + "px")
        .style("top", (d3.event.sourceEvent.clientY + 28).toString() + "px")
        .style("opacity", 0)
        .html(g_loc_fr.toString() + ", " + g_loc_to.toString());
    g_tooltip
        .transition().duration(500)
        .style("opacity", .6);
}

function drag_load_ing() {
    // get svg of this load
    var svg_load = d3.select(this.parentNode);

    // get new x
    var pre_x = get_transformation(svg_load.attr("transform")).translateX;
    var pre_y = get_transformation(svg_load.attr("transform")).translateY;
    var pre_a = get_transformation(svg_load.attr("transform")).rotate;
    var v_new_x = d3.event.x;
    var v_end_x = g_loc_to * gv_ratio_len;

    /// apply constraint to end point of load
    switch (this.id) {
        case "pnt_load": // coordinate system of parent node is used
            if (v_new_x < 0) v_new_x = 0;
            if (gv_span < v_new_x) v_new_x = gv_span;
            v_end_x = v_new_x;
            svg_load.attr("transform", "translate(" + v_new_x + "," + pre_y + ") rotate(" + pre_a + ")"); // update svg of the load
            break;
        case "ufm_load": // coordinate system of parent node is used
            v_new_x = pre_x + d3.event.dx; // pre_x + delta_x = new_x of point load or start_x of uniform load
            if (v_new_x < 0) v_new_x = 0;
            if (gv_span < v_new_x) v_new_x = gv_span;
            v_end_x = v_new_x + ((g_loc_to - g_loc_fr) * gv_ratio_len);
            if (gv_span <= v_end_x) {
                v_end_x = gv_span;
                v_new_x = v_end_x - ((g_loc_to - g_loc_fr) * gv_ratio_len);
            }
            svg_load.attr("transform", "translate(" + v_new_x + "," + pre_y + ") rotate(" + pre_a + ")"); // update svg of the load
            break;
        case "s_u_load": // coordinate system of parent of ufm_load is used
            v_new_x = d3.event.x; // d3.event.dx + g_loc_fr * gv_ratio_len;
            v_end_x = g_loc_to * gv_ratio_len;
            if (v_new_x < 0) v_new_x = 0;
            if (v_end_x <= v_new_x) v_new_x = v_end_x - 5 * gv_ratio_len; // 5 is the min of delta
            svg_load.attr("transform", "translate(" + (v_new_x - gv_pre_x) + "," + pre_y + ") rotate(" + pre_a + ")"); // update svg of the load
            break;
        case "e_u_load": // coordinate system of parent of ufm_load is used
            v_new_x = g_loc_fr * gv_ratio_len;
            v_end_x = d3.event.x; // d3.event.dx + g_loc_to * gv_ratio_len;
            if (gv_span < v_end_x) v_end_x = gv_span;
            if (v_end_x <= v_new_x) v_end_x = v_new_x + 5 * gv_ratio_len; // 5 is the min of delta
            svg_load.attr("transform", "translate(" + (v_end_x - gv_pre_x + gv_pre_load_width) + "," + pre_y + ") rotate(" + pre_a + ")"); // update svg of the load
            break;
    }

    // update input for position of the load
    g_loc_fr = round_by_unit(v_new_x / gv_ratio_len, 5); // transform to x in graphic to logical; then round to 0, 5, 10, 15, ...
    g_loc_to = round_by_unit(v_end_x / gv_ratio_len, 5); // transform to x in graphic to logical; then round to 0, 5, 10, 15, ...
    g_tooltip
        .style("left", d3.event.sourceEvent.clientX.toString() + "px")
        .html(g_loc_fr.toString() + ", " + g_loc_to.toString());
}

function drag_load_ended() {
    // hide tooltip
    g_tooltip.transition().duration(500).style("opacity", 0);
    g_tooltip = undefined;

    // redraw problem
    draw_simple_beam_problem();

    // update UI
    $("#output_space").fadeOut();
    $(".smt_solve").val("Click to solve the problem!");
}

//function check_input_value(p_ld_idx) {
//    // check span
//    gv_ratio_len = gv_span / g_span;
//    if (g_span <= 0) {
//        alert("Span must be positive! Solve again!");
//        g_span = Math.abs(g_span);
//        $(".smt_solve").val("Solve again!");
//        return false;
//    }

//    // check load
//    gv_ratio_load = gv_load / g_load;
//    if (g_load <= 0) {
//        alert("Load must be positive! Solve again!");
//        g_load = Math.abs(g_load);
//        $(".smt_solve").val("Solve again!");
//        return false;
//    }

//    // check location
//    if (g_loc_fr < 0) {
//        alert("Location \"from\" must be zero or positive! Solve again!");
//        g_loc_fr = Math.abs(g_loc_fr);
//        $(".smt_solve").val("Solve again!");
//        return false;
//    }
//    if (g_loc_to < 0) {
//        alert("Location \"to\" must be positive! Solve again!");
//        $(loc_to_id).val(Math.abs(g_loc_to));
//        $(".smt_solve").val("Solve again!");
//        return false;
//    }
//    if (g_loc_fr > g_loc_to) {
//        alert("Location \"from\" must be equal to or less than location \"to\"! Solve again!");
//        g_loc_to = g_loc_fr;
//        $(".smt_solve").val("Solve again!");
//        return false;
//    }
//    if (g_loc_fr > g_span) {
//        alert("Location \"from\" must be equal to or less than span! Solve again!");
//        g_loc_fr = g_span;
//        g_loc_to = g_span;
//        $(".smt_solve").val("Solve again!");
//        return false;
//    }
//    if (g_loc_to > g_span) {
//        alert("Location \"to\" must be equal to or less than span! Solve again!");
//        g_loc_to = g_span;
//        $(".smt_solve").val("Solve again!");
//        return false;
//    }
//    //if (g_load_type == "point") {
//    //    if (g_loc_fr != g_loc_to) {
//    //        alert("For point load, location \"to\" must be equal to location \"from\"! Solve again!");
//    //        g_loc_to = g_loc_fr;
//    //        $(".smt_solve").val("Solve again!");
//    //        return false;
//    //    }
//    //}
//    return true;
//}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw beams and frames
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function draw_simple_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    // translate and then rotate
    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

    // set variable
    span = p_span * gv_ratio_len;

    // beam and label
    draw_single_member(p_svg_mom, 0, 0, 0, span); // 0 = rotation in cw
    draw_label(p_svg_mom, 0, 0, 0, -gv_ele_unit, 0, "A", undefined, "middle"); // undefined = subscript
    draw_label(p_svg_mom, span, 0, 0, gv_ele_unit / 2, 0, "B", undefined, "middle"); // undefined = subscript

    // support
    draw_hinge(p_svg_mom, 0, gv_ele_unit / 2, 0);
    draw_roller(p_svg_mom, span, gv_ele_unit / 2, 0);

    // dimensions
    draw_dimensions(p_svg_mom, 0, 0, 0, "beam_dim", [p_span], gv_margin_unit * 3, "mm", "dn", true);
}

function draw_simple_beam_fbd(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    // translate and then rotate
    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

    // set variable
    span = p_span * gv_ratio_len;

    // beam and label
    draw_single_member(p_svg_mom, 0, 0, 0, span); // 0 = rotation in cw
    //draw_label(p_svg_mom, 0, 0, 0, gv_ele_unit * 1.5, -135, "A", undefined, "middle"); // undefined = subscript
    //draw_label(p_svg_mom, span, 0, 0, gv_ele_unit * 0.75, -45, "B", undefined, "middle"); // undefined = subscript

    // support reactions
    draw_hinge_reactions(p_svg_mom, 0, gv_ele_unit / 2, 0, "A", "up", "up");
    draw_roller_reactions(p_svg_mom, span, gv_ele_unit / 2, 0, "B", "up");
}

/*function draw_cantilever_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt) {
    // beam
    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

    // support
    if (p_l_spt == "fix") {
        draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang + 90);
    }
    else if (p_l_spt == "free") {
        draw_fix(p_svg_mom, p_org_x + p_len, p_org_y, p_ang - 90);
    }
    else {
        alert("Support must be fix or free!")
    }
}

function draw_simple_Gerber_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt, p_loc_hinge, p_loc_roller) {
    // beam
    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

    // support
    if (p_l_spt == "hinge") {
        draw_hinge(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
    }
    else if (p_l_spt == "roller") {
        draw_roller(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
        draw_hinge(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
    }
    else {
        alert("Support must be hinge or roller!")
    }
    draw_roller(p_svg_mom, p_org_x + p_loc_roller, p_org_y + p_sect_hgt / 2, p_ang); // internal roller support

    // internal hinge joint
    draw_hinge_joint(p_svg_mom, p_org_x + p_loc_hinge, p_org_y);
}

function draw_cantilever_Gerber_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt, p_loc_hinge) {
    // beam
    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

    // support
    if (p_l_spt == "fix") {
        draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang + 90);
        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
    }
    else if (p_l_spt == "free") {
        draw_roller(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
        draw_fix(p_svg_mom, p_org_x + p_len, p_org_y, p_ang - 90);
    }
    else {
        alert("Support must be fix or free!")
    }

    // internal hinge joint
    draw_hinge_joint(p_svg_mom, p_org_x + p_loc_hinge, p_org_y);
}

function draw_2c_1b_simple_frame(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_hgt, p_sect_hgt, p_l_spt) {
    // frame using path
    p_svg_mom.append("path") // border
        .attr("d", "m0,0v" + -p_hgt +"h" + p_len + "v" + p_hgt)
        .attr("style", "fill:none;stroke:dimgrey;stroke-linejoin:miter;stroke-linecap:butt;stroke-width:" + p_sect_hgt)
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    p_svg_mom.append("path") // interior
        .attr("d", "m0,-0.5v" + -(p_hgt - 0.5) + "h" + p_len + "v" + (p_hgt - 0.5))
        .attr("style", "fill:none;stroke:lightgrey;stroke-linejoin:miter;stroke-linecap:butt;stroke-width:" + (p_sect_hgt-1))
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate

    // support
    if (p_l_spt == "hinge") {
        draw_hinge(p_svg_mom, p_org_x, p_org_y, p_ang);
        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y, p_ang);
    }
    else if (p_l_spt == "roller") {
        draw_roller(p_svg_mom, p_org_x, p_org_y, p_ang);
        draw_hinge(p_svg_mom, p_org_x + p_len, p_org_y, p_ang);
    }
    else {
        alert("Support must be hinge or roller!")
    }
}*/

function draw_simple_beam_problem() {
    //// check input value
    //if (check_input_value(1) == false) return;
    // prepare variable for drawing
    gv_ratio_len = gv_span / g_span;
    gv_ratio_load = gv_load / g_load;

    // initialize svg
    $("#prob_svg, #fbd_svg, #reaction_svg").empty();
    append_hatching_pattern("#prob_svg"); // prepare hatching pattern

    // draw simple beam and loads
    var sx = 100, sy = 100, ang = 0;
    var g_structure = d3.select("#prob_svg").append("g"); // set svg group
    draw_simple_beam(g_structure, sx, sy, ang, g_span);
    draw_beam_loads(g_structure, 1, true, true); // 1 = the 1st load, true = draw dimension, true = make load draggable
}

function draw_simple_beam_FBD() {
    // draw free body diagram
    var sx = 100, sy = 100, ang = 0;
    var g_fbd = d3.select("#fbd_svg").append("g"); // set svg group
    draw_simple_beam_fbd(g_fbd, sx, sy, ang, g_span);
    draw_beam_loads(g_fbd, 1, true); // 1 = the 1st load, true = draw dimension
}

function solve_simple_beam_problem() {
    // get magnitude of load and location
    var load = g_load, dist = g_loc_fr;
    if (g_load_type == "uniform") {
        dist = +((g_loc_fr + g_loc_to) / 2).toFixed(g_digit); // 3.toFixed(4) ==> string "3.0000"; +3.toFixed(4) ==> number 3.0000
        load = +(g_load * (g_loc_to - g_loc_fr)).toFixed(g_digit);
    }

    // compute reactions
    g_H = 0;
    g_V_b = load * (dist / g_span);
    g_V_a = -g_V_b + load;

    // equilibrium equation
    //var sigma_fx = "\\(\\Sigma F_x = " + str_H + " = " + g_H + ";\\quad H_A = " + g_H + "N\\)";
    //var sigma_fy = "\\(\\Sigma F_y = V_A + V_B - " + load + " = 0;\\quad V_A = " + g_V_a + "N\\)";
    //var sigma_mz = "\\(\\Sigma M_A = -" + load + "\\times" + dist + "+ V_B \\times " + g_span + "= 0;\\quad V_B = " + g_V_b + "N\\)";
    //$("#sigma_fx").text(sigma_fx);
    //$("#sigma_mz").text(sigma_mz);
    //$("#sigma_fy").text(sigma_fy);

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //// object for display of measurement using svg; msmt = measurement
    var msmt = [{ "label": "H", "sub": "A", "val": (g_H + get_random(-0.1, 0.1)).toFixed(g_digit), "unit": "N" },
                { "label": "V", "sub": "A", "val": (g_V_a + get_random(-g_V_a * 0.1, g_V_a * 0.1)).toFixed(g_digit), "unit": "N" },
                { "label": "V", "sub": "B", "val": (g_V_b + get_random(-g_V_b * 0.1, g_V_b * 0.1)).toFixed(g_digit), "unit": "N" }];

    // draw free body diagram
    var sx = 50, sy = 0, ang = 0;
    var g_reaction = d3.select("#reaction_svg").append("g") // set svg group
    //g_measurement = d3.select("#measurement_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)

    // draw the results
    var msmt_result_grp = g_reaction.selectAll("g").data(msmt).join("g")
        .attr("transform", (d, i) => "translate(0, " + (-i * 60 - 50) + ")");
    msmt_result_grp.append("text")
        .attr("x", 0).attr("y", 0)
        //.html(d => "<pre>" + d.label + "             " + d.val + "    " + d.unit + "</pre>")
        .html(d => d.label)
        .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
        .attr("transform", "scale(1, -1)")
        .append("tspan").text(d => d.sub).attr("baseline-shift", "sub").attr("font-size", "62%"); // not work!!!
    msmt_result_grp.append("rect")
        .attr("x", 50).attr("y", -15)
        .attr("width", 150).attr("height", 40)
        .attr("rx", 20).attr("rx", 20)
        .attr("style", "stroke:grey; stroke-width:0.5; fill:none");
    msmt_result_grp.append("text")
        .attr("x", 180).attr("y", 0)
        .html(d => d.val)
        .attr("style", "cursor:default; fill:grey; font-weight:bold; text-anchor:end") // start/middle/end
        .attr("transform", "scale(1, -1)");
    msmt_result_grp.append("text")
        .attr("x", 210).attr("y", 0)
        .html(d => { return d.unit; })
        .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
        .attr("transform", "scale(1, -1)");
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////
}






////////var g_structure, g_fbd;
////////var g_span = 600, g_load = 100, g_load_type = "point", g_loc_fr = 300, g_loc_to = 300;
////////var g_V_a = 50, g_V_b = 50, g_H = 0;

////////$(document).ready(function () {
////////    if (MathJax) {
////////        MathJax.Hub.Config({ displayAlign: "left" });
////////        MathJax.Hub.Rerender();
////////    }

////////    changed_load_type(1); // 1 = the first load
////////    check_input_value(1); // 1 = the first load

////////    $(".cbx_spt").change(function () {
////////        // exclusive selection of hinge and roller
////////        if (this.id == "left_spt") {
////////            if (this.value == "hinge") $("#right_spt").val("roller");
////////            else $("#right_spt").val("hinge");
////////        }
////////        else {
////////            if (this.value == "hinge") $("#left_spt").val("roller");
////////            else $("#left_spt").val("hinge");
////////        }
////////    });

////////    $(".cbx_ld").change(function () {
////////        // get the index of load
////////        var ld_arr = this.id.split("_");
////////        var ld_idx = ld_arr[ld_arr.length - 1];

////////        // show / hide the corresponding load set
////////        changed_load_type(ld_idx);
////////    });

////////    $("#loc_fr_1").change(function () {
////////        // prepare ids
////////        var m_ld_idx = 1; // the first load
////////        var type_id = "#ld_type_" + m_ld_idx, loc_fr_id = "#loc_fr_" + m_ld_idx, loc_to_id = "#loc_to_" + m_ld_idx;

////////        // set 'location from' to 'location to' in case of point load
////////        g_loc_fr = parseFloat($(loc_fr_id).val())
////////        if ($(type_id).val() == "point") {
////////            $(loc_to_id).val(g_loc_fr);
////////        }
////////    });

////////    $(".inp_txt").focusout(function () {
////////        ////////////////// get the index of load
////////        ////////////////var ld_arr = this.id.split("_");
////////        ////////////////var ld_idx = ld_arr[ld_arr.length - 1];

////////        ////////////////// show / hide the corresponding load set
////////        ////////////////check_input_value(ld_idx);

////////        //// filter
////////        //var magnitude = parseFloat(this.value);
////////        //if (magnitude < 0) {
////////        //    alert("Span, load, locations must be positive!");
////////        //    return;
////////        //}
////////        //if (this.id.indexOf("loc_") < 0) return;

////////        //// get the index of load
////////        //var ld_arr = this.id.split("_");
////////        //var ld_idx = ld_arr[ld_arr.length - 1];
////////        //var cbx_id = "#ld_type_" + ld_idx, fr_id = "#loc_fr_" + ld_idx, to_id = "#loc_to_" + ld_idx;

////////        //// get location
////////        //var fr_val = $(fr_id).val(); if (fr_val == undefined) fr_val = 0;
////////        //var to_val = $(to_id).val(); if (to_val == undefined) to_val = 0;

////////        //// set rule for values
////////        //if (this.id.indexOf("loc_fr_") > -1) { // start location
////////        //    if ($(cbx_id).val() == "point") $(to_id).val(fr_val);
////////        //    else if (fr_val > to_val) $(to_id).val(fr_val);
////////        //}
////////        //else { // always load type is unifrom
////////        //    if (fr_val > to_val) $(fr_id).val(to_val);
////////        //}
////////    });

////////    $(".smt_solve").click(function () {
////////        // if already solved, then no input is modified
////////        if ($(".smt_solve").val() == "The problem is solved!") return;

////////        // check input value
////////        if (check_input_value(1) == false) return;

////////        // initialize svg
////////        $("svg").empty(); // delete the existing child svgs for all svgs
////////        append_hatching_pattern(); // prepare hatching pattern

////////        // get input data
////////        g_span = parseFloat($("#span").val()), gv_ratio_len = gv_span / g_span;
////////        var left_spt = $("#left_spt").val(), right_spt = $("#right_spt").val();

////////        // draw simple beam and loads
////////        var sx = 100, sy = 100, ang = 0;
////////        var g_structure = d3.select("#prob_svg").append("g"); // set svg group
////////        draw_simple_beam(g_structure, sx, sy, ang, g_span, left_spt);
////////        draw_beam_loads(g_structure, 1, true, true); // 1 = the 1st load, true = draw dimension, true = make load draggable

////////        // draw FBD
////////        var g_fbd = d3.select("#fbd_svg").append("g"); // set svg group
////////        draw_simple_beam_fbd(g_fbd, sx, sy, ang, g_span, left_spt);
////////        draw_beam_loads(g_fbd, 1, true); // 1 = the 1st load, true = draw dimension

////////        // solve and visualize support reactions
////////        solve_simple_beam(left_spt);

////////        //draw_point_load(g_simple_beam, 0, 0 - g_sec_h / 2, 0, 2 * g_sec_h, "kN");
////////        //draw_point_moment(g_simple_beam, g_span / 2, 0, 90, 100, "ccw", "kN-m");

////////        //// draw cantilever beam
////////        //sy += hgt;
////////        //var cantilever_beam = d3.select("svg").append("g") // set svg group
////////        //    .attr("transform", "translate(" + sx + "," + sy + ") rotate(" + 0 + ")"); // translate and then rotate
////////        //draw_cantilever_beam(cantilever_beam, 0, 0, 0, span, sect_hgt, "free");
////////        //draw_dimensions(cantilever_beam, 0, 0, 0, [span], sect_hgt * 2, "mm", "dn");
////////        //draw_uniform_load(cantilever_beam, 0, 0 - sect_hgt / 2, 0, 190, 2 * sect_hgt, "kN/m");

////////        //// draw simple Gerber beam
////////        //sy += hgt;
////////        //var Gerber_beam = d3.select("svg").append("g") // set svg group
////////        //    .attr("transform", "translate(" + sx + "," + sy + ") rotate(" + 0 + ")"); // translate and then rotate
////////        //draw_simple_Gerber_beam(Gerber_beam, 0, 0, 0, span, sect_hgt, "roller", span / 3, span / 2);
////////        //var n_len = Math.min(span / 3, span / 2), f_len = Math.max(span / 3, span / 2);
////////        //draw_dimensions(Gerber_beam, 0, 0, 0, [n_len, f_len - n_len, span - f_len], sect_hgt * 3, "mm", "dn");

////////        //// draw cantilever Gerber beam
////////        //sy += hgt;
////////        //var Gerber_beam = d3.select("svg").append("g") // set svg group
////////        //    .attr("transform", "translate(" + sx + "," + sy + ") rotate(" + 0 + ")"); // translate and then rotate
////////        //draw_cantilever_Gerber_beam(Gerber_beam, 0, 0, 0, span, sect_hgt, "free", span / 3);
////////        //draw_dimensions(Gerber_beam, 0, 0, 0, [span / 3, span - (span / 3)], sect_hgt * 3, "mm", "dn");

////////        //// simple frame
////////        //sy += 3 * hgt;
////////        //var simple_frm = d3.select("svg").append("g") // set svg group
////////        //    .attr("transform", "translate(" + sx + "," + sy + ") rotate(" + 20 + ")"); // translate and then rotate
////////        //draw_2c_1b_simple_frame(simple_frm, 0, 0, 0, span, hgt, sect_hgt, "roller");
////////        //draw_uniform_load(simple_frm, 0 - sect_hgt / 2, 0, -90, hgt, 2 * sect_hgt, "kN/m"); // distributed load on left column
////////        //draw_uniform_load(simple_frm, 0, 0 - hgt - sect_hgt / 2, 0, span, 2 * sect_hgt, "kN/m"); // distributed load on beam
////////        //draw_uniform_load(simple_frm, 0 + span + sect_hgt / 2, 0 - hgt, 90, hgt, 2 * sect_hgt, "kN/m"); // distributed load on right column
////////        //draw_point_moment(simple_frm, 0 + span, -hgt / 2, -90, 100, "cw", "kN-m");
////////        //draw_dimensions(simple_frm, 0, 0, -90, [hgt], -sect_hgt * 4, "mm", "up");
////////        //draw_dimensions(simple_frm, 0, 0 - sect_hgt / 2, 0, [span], sect_hgt * 3, "mm", "dn");
////////        //draw_dimensions(simple_frm, 0 + span, 0 - hgt, 90, [hgt], -sect_hgt * 4, "mm", "up");

////////        $("#output_space").show();
////////        $(".smt_solve").val("The problem is solved!");
////////    });

////////    $("#submit_number").click(function () {
////////        // get input value and update svg
////////        var span_text = $("#span_number").text(); // get type of input = magnitude of load, span length, ...
////////        switch (span_text) {
////////            case "load_magnitude":
////////                g_load = $("#input_number").val();
////////                g_load_type = $("#select_load_type option:selected").val();
////////                var unit = "N";
////////                if (g_load_type == "uniform") unit = "N/mm";
////////                d3.select("#" + span_text).text(g_load + unit);
////////                $("#load_1").val(g_load);
////////                $("#ld_type_1").val(g_load_type);
////////                update_load_type();
////////                break;
////////            case "span_length":
////////                g_span = $("#input_number").val();
////////                d3.select("#" + span_text).text(g_span + "mm");
////////                $("#span").val(g_span);
////////                break;
////////            default: break;
////////        }

////////        // update UI
////////        $("#div_input_outer").fadeOut();
////////        $("#output_space").hide();
////////        $(".smt_solve").val("Click to solve the problem!");
////////    });

////////    d3.select("#prob_space").on("click", function () {
////////        var x = d3.event.x;// - $(this).offset().left;
////////        var y = d3.event.y;// - $(this).offset().top;
////////        //alert("Oops! I was clicked at (" + x.toString() + ", " + y.toString() + ")!");
////////    });

////////    // cause automatic click event for "Solve" button
////////    $(".smt_solve").trigger("click");
////////});

////////function update_load_type() {
////////    if (g_load_type == "point") {
////////        draw_beam_loads(p_svg_mom, p_idx, p_draw_dim, p_drag)
////////    }
////////    else {
////////        if (g_loc_fr == g_span) g_loc_fr = 0;
////////        if (g_loc_fr == g_loc_to) g_loc_to = g_span;
////////    }
////////    $("#loc_fr_1").val(g_loc_fr);
////////    $("#loc_to_1").val(g_loc_to);
////////}

////////function click_load() {
////////    // get location of input
////////    var x = d3.event.x;// - $(this).offset().left;
////////    var y = d3.event.y;// - $(this).offset().top;

////////    // in case of input button for load magnitude
////////    //if (this.parentNode.parentNode.id == "prob_svg") { // this(force_group) ==> svg.id == "prov_svg"
////////    if (this.parentNode.parentNode.parentNode.id == "prob_svg") { // this(load_magnitude) ==> force_group ==> svg.id = "prov_svg"
////////        $("#input_number").val(g_load);
////////        $("#select_load_type").val(g_load_type).show(); // set value and show
////////        $("#span_number").text(this.id);
////////        $("#div_input_inner").css("left", x.toString() + "px").css("top", y.toString() + "px");
////////        $("#div_input_outer").fadeIn();
////////    }
////////}

////////function click_span() {
////////    // get location of input
////////    var x = d3.event.x;
////////    var y = d3.event.y;

////////    // in case of input button for span
////////    $("#input_number").val(g_span);
////////    $("#select_load_type").hide(); // only hide
////////    $("#span_number").text(this.id);
////////    $("#div_input_inner").css("left", x.toString() + "px").css("top", y.toString() + "px");
////////    $("#div_input_outer").fadeIn();
////////}

////////function drag_load_started() {
////////    gv_prev_x = d3.event.x;
////////    gv_prev_y = d3.event.y;
////////}

//////////function drag_load_ing(p_svg_ele, p_org_y) {
////////function drag_load_ing() {
////////    // get svg of this load
////////    var svg_load = d3.select(this.parentNode);

////////    // get new x
////////    var pre_x = get_transformation(svg_load.attr("transform")).translateX;
////////    var pre_y = get_transformation(svg_load.attr("transform")).translateY;
////////    var pre_a = get_transformation(svg_load.attr("transform")).rotate;
////////    var v_new_x = pre_x + (d3.event.x - gv_prev_x); // pre_x + delta_x = new_x of point load or start_x of uniform load
////////    if (v_new_x < 0) v_new_x = 0;
////////    if (gv_span < v_new_x) v_new_x = gv_span;
////////    if (this.tagName == "rect") { // in case of uniform load
////////        var v_end_x = v_new_x + ((g_loc_to - g_loc_fr) * gv_ratio_len);
////////        if (gv_span < v_end_x) {
////////            v_new_x -= (v_end_x - gv_span);
////////        }
////////        console.log(g_loc_fr, g_loc_to, v_new_x, v_end_x);
////////    }

////////    // update svg of the load
////////    svg_load.attr("transform", "translate(" + v_new_x + "," + pre_y + ") rotate(" + pre_a + ")");

////////    // update input for position of the load
////////    var new_x = Math.round((v_new_x / gv_ratio_len) / 5) * 5; // transform to x in graphic to logical; then round to 0, 5, 10, 15, ...
////////    g_loc_fr = new_x; g_loc_to = 
////////    $("#loc_fr_1").val(new_x);
////////    $("#loc_to_1").val(new_x);
////////    if (this.tagName == "rect") { // in case of uniform load
////////        $("#loc_to_1").val(new_x + (g_loc_to - g_loc_fr));
////////    }



////////    //// get svg of this load
////////    //var svg_load = d3.select(this.parentNode);

////////    //if (this.tagName == "rect") { // tagName is for HTML5, therefore use this(node); "this" is same to "d3.select(this).node()"
////////    //    console.log(d3.event.x);
////////    //}

////////    ////// get new x
////////    ////var pre_x = get_transformation(svg_load.attr("transform")).translateX;
////////    ////var pre_y = get_transformation(svg_load.attr("transform")).translateY;
////////    ////var pre_a = get_transformation(svg_load.attr("transform")).rotate;
////////    ////var v_new_x = pre_x + (d3.event.x - gv_prev_x);
////////    ////if (v_new_x < 0) v_new_x = 0;
////////    ////if (gv_span < v_new_x) v_new_x = gv_span;

////////    ////// update svg of the load
////////    ////svg_load.attr("transform", "translate(" + v_new_x + "," + pre_y + ") rotate(" + pre_a + ")");

////////    ////// update input for position of the load
////////    ////var new_x = Math.round((v_new_x / gv_ratio_len) / 5) * 5; // transform to x in graphic to logical; then round to 0, 5, 10, 15, ...
////////    ////$("#loc_fr_1").val(new_x);
////////    //////if (!p_uniform) { // in case of false
////////    ////$("#loc_to_1").val(new_x);
////////    //////}
////////}

////////function drag_load_ended() {
////////    $("#output_space").hide();
////////    $(".smt_solve").val("Click to solve the problem!");
////////}

////////function changed_load_type(p_ld_idx) {
////////    // prepare ids
////////    var type_id = "#ld_type_" + p_ld_idx, set_id = "#ld_set_" + p_ld_idx;
////////    var to_id = "#loc_to_" + p_ld_idx; // get the id of load set

////////    // show / hide the corresponding load set
////////    if ($(type_id).val() == "no_load") {
////////        $(set_id).css("visibility", "hidden");
////////    }
////////    else if ($(type_id).val() == "point") {
////////        $(set_id).css("visibility", "visible");
////////        $(to_id).prop("disabled", true);
////////    }
////////    else { // for "uniform"
////////        $(set_id).css("visibility", "visible");
////////        $(to_id).prop("disabled", false);
////////    }
////////}

////////function check_input_value(p_ld_idx) {
////////    // prepare ids
////////    var type_id = "#ld_type_" + p_ld_idx, load_id = "#load_" + p_ld_idx, loc_fr_id = "#loc_fr_" + p_ld_idx, loc_to_id = "#loc_to_" + p_ld_idx;

////////    // check span
////////    g_span = parseFloat($("#span").val()); gv_ratio_len = gv_span / g_span;
////////    if (g_span <= 0) {
////////        alert("Span must be positive! Solve again!");
////////        $("#span").val(Math.abs(g_span));
////////        $(".smt_solve").val("Solve again!");
////////        return false;
////////    }

////////    // check load
////////    g_load = parseFloat($(load_id).val()); gv_ratio_load = gv_load / g_load;
////////    if (g_load <= 0) {
////////        alert("Load must be positive! Solve again!");
////////        $(load_id).val(Math.abs(g_load));
////////        $(".smt_solve").val("Solve again!");
////////        return false;
////////    }

////////    // check location
////////    g_loc_fr = parseFloat($(loc_fr_id).val()), g_loc_to = parseFloat($(loc_to_id).val());
////////    if (g_loc_fr < 0) {
////////        alert("Location \"from\" must be zero or positive! Solve again!");
////////        $(loc_fr_id).val(Math.abs(g_loc_fr));
////////        $(".smt_solve").val("Solve again!");
////////        return false;
////////    }
////////    if (g_loc_to < 0) {
////////        alert("Location \"to\" must be positive! Solve again!");
////////        $(loc_to_id).val(Math.abs(g_loc_to));
////////        $(".smt_solve").val("Solve again!");
////////        return false;
////////    }
////////    if (g_loc_fr > g_loc_to) {
////////        alert("Location \"from\" must be equal to or less than location \"to\"! Solve again!");
////////        $(loc_to_id).val(g_loc_fr);
////////        $(".smt_solve").val("Solve again!");
////////        return false;
////////    }
////////    if (g_loc_fr > g_span) {
////////        alert("Location \"from\" must be equal to or less than span! Solve again!");
////////        $(loc_fr_id).val(g_span);
////////        $(loc_to_id).val(g_span);
////////        $(".smt_solve").val("Solve again!");
////////        return false;
////////    }
////////    if (g_loc_to > g_span) {
////////        alert("Location \"to\" must be equal to or less than span! Solve again!");
////////        $(loc_to_id).val(g_span);
////////        $(".smt_solve").val("Solve again!");
////////        return false;
////////    }
////////    if ($(type_id).val() == "point") {
////////        if (g_loc_fr != g_loc_to) {
////////            alert("For point load, location \"to\" must be equal to location \"from\"! Solve again!");
////////            $(loc_to_id).val(g_loc_fr);
////////            $(".smt_solve").val("Solve again!");
////////            return false;
////////        }
////////    }
////////    return true;
////////}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////// draw beams and frames
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////function draw_simple_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_span, p_l_spt)
////////{
////////    // translate and then rotate
////////    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

////////    // set variable
////////    span = p_span * gv_ratio_len;

////////    // beam and label
////////    draw_single_member(p_svg_mom, 0, 0, 0, span, gv_ele_unit); // 0 = rotation in cw
////////    draw_label(p_svg_mom, 0, 0, 0, -gv_ele_unit, 0, "A", undefined, "middle"); // undefined = subscript
////////    draw_label(p_svg_mom, span, 0, 0, gv_ele_unit / 2, 0, "B", undefined, "middle"); // undefined = subscript

////////    // support
////////    if (p_l_spt == "hinge") {
////////        draw_hinge(p_svg_mom, 0, gv_ele_unit / 2, 0);
////////        draw_roller(p_svg_mom, span, gv_ele_unit / 2, 0);
////////    }
////////    else if (p_l_spt == "roller") {
////////        draw_roller(p_svg_mom, 0, gv_ele_unit / 2, 0);
////////        draw_hinge(p_svg_mom, span, gv_ele_unit / 2, 0);
////////    }
////////    else {
////////        alert("Support must be hinge or roller!");
////////    }

////////    // dimensions
////////    draw_dimensions(p_svg_mom, 0, 0, 0, [p_span], gv_margin_unit * 3, "mm", "dn", true);
////////}

////////function draw_simple_beam_fbd(p_svg_mom, p_org_x, p_org_y, p_ang, p_span, p_l_spt) {
////////    // translate and then rotate
////////    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

////////    // set variable
////////    span = p_span * gv_ratio_len;

////////    // beam and label
////////    draw_single_member(p_svg_mom, 0, 0, 0, span, gv_ele_unit); // 0 = rotation in cw
////////    draw_label(p_svg_mom, 0, 0, 0, gv_ele_unit * 1.5, -135, "A", undefined, "middle"); // undefined = subscript
////////    draw_label(p_svg_mom, span, 0, 0, gv_ele_unit * 0.75, -45, "B", undefined, "middle"); // undefined = subscript

////////    // support reactions
////////    if (p_l_spt == "hinge") {
////////        draw_hinge_reactions(p_svg_mom, 0, gv_ele_unit / 2, 0, "A", "up", "up");
////////        draw_roller_reactions(p_svg_mom, span, gv_ele_unit / 2, 0, "B", "up");
////////    }
////////    else if (p_l_spt == "roller") {
////////        draw_roller_reactions(p_svg_mom, 0, gv_ele_unit / 2, 0, "A", "up");
////////        draw_hinge_reactions(p_svg_mom, span, gv_ele_unit / 2, 0, "B", "dn", "up");
////////    }
////////    else {
////////        alert("Support must be hinge or roller!")
////////    }

////////    // dimensions
////////    //draw_dimensions(p_svg_mom, 0, 0, 0, [p_span], gv_margin_unit * 3, "mm", "dn");
////////}

/////////*function draw_cantilever_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt) {
////////    // beam
////////    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

////////    // support
////////    if (p_l_spt == "fix") {
////////        draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang + 90);
////////    }
////////    else if (p_l_spt == "free") {
////////        draw_fix(p_svg_mom, p_org_x + p_len, p_org_y, p_ang - 90);
////////    }
////////    else {
////////        alert("Support must be fix or free!")
////////    }
////////}

////////function draw_simple_Gerber_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt, p_loc_hinge, p_loc_roller) {
////////    // beam
////////    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

////////    // support
////////    if (p_l_spt == "hinge") {
////////        draw_hinge(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
////////        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
////////    }
////////    else if (p_l_spt == "roller") {
////////        draw_roller(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
////////        draw_hinge(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
////////    }
////////    else {
////////        alert("Support must be hinge or roller!")
////////    }
////////    draw_roller(p_svg_mom, p_org_x + p_loc_roller, p_org_y + p_sect_hgt / 2, p_ang); // internal roller support

////////    // internal hinge joint
////////    draw_hinge_joint(p_svg_mom, p_org_x + p_loc_hinge, p_org_y);
////////}

////////function draw_cantilever_Gerber_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt, p_loc_hinge) {
////////    // beam
////////    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

////////    // support
////////    if (p_l_spt == "fix") {
////////        draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang + 90);
////////        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
////////    }
////////    else if (p_l_spt == "free") {
////////        draw_roller(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
////////        draw_fix(p_svg_mom, p_org_x + p_len, p_org_y, p_ang - 90);
////////    }
////////    else {
////////        alert("Support must be fix or free!")
////////    }

////////    // internal hinge joint
////////    draw_hinge_joint(p_svg_mom, p_org_x + p_loc_hinge, p_org_y);
////////}

////////function draw_2c_1b_simple_frame(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_hgt, p_sect_hgt, p_l_spt) {
////////    // frame using path
////////    p_svg_mom.append("path") // border
////////        .attr("d", "m0,0v" + -p_hgt +"h" + p_len + "v" + p_hgt)
////////        .attr("style", "fill:none;stroke:dimgrey;stroke-linejoin:miter;stroke-linecap:butt;stroke-width:" + p_sect_hgt)
////////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
////////    p_svg_mom.append("path") // interior
////////        .attr("d", "m0,-0.5v" + -(p_hgt - 0.5) + "h" + p_len + "v" + (p_hgt - 0.5))
////////        .attr("style", "fill:none;stroke:lightgrey;stroke-linejoin:miter;stroke-linecap:butt;stroke-width:" + (p_sect_hgt-1))
////////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate

////////    // support
////////    if (p_l_spt == "hinge") {
////////        draw_hinge(p_svg_mom, p_org_x, p_org_y, p_ang);
////////        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y, p_ang);
////////    }
////////    else if (p_l_spt == "roller") {
////////        draw_roller(p_svg_mom, p_org_x, p_org_y, p_ang);
////////        draw_hinge(p_svg_mom, p_org_x + p_len, p_org_y, p_ang);
////////    }
////////    else {
////////        alert("Support must be hinge or roller!")
////////    }
////////}*/

////////function draw_beam_loads(p_svg_mom, p_idx, p_draw_dim, p_drag) {
////////    // prepare ids
////////    var type_id = "#ld_type_" + p_idx, load_id = "#load_" + p_idx, loc_fr_id = "#loc_fr_" + p_idx, loc_to_id = "#loc_to_" + p_idx;

////////    // get input values
////////    g_load = parseFloat($(load_id).val()); gv_ratio_load = gv_load / g_load;
////////    g_loc_fr = parseFloat($(loc_fr_id).val()), g_loc_to = parseFloat($(loc_to_id).val()); 
////////    var v_loc_fr = g_loc_fr * gv_ratio_len, v_loc_to = g_loc_to * gv_ratio_len;

////////    // draw load and dimensions
////////    g_load_type = $(type_id).val();
////////    if (g_load_type == "point") {
////////        draw_point_load(p_svg_mom, v_loc_fr, 0 - gv_ele_unit / 2, 0, g_load, "N", "dn", p_drag, "pnt_load"); // dn = downward load
////////        if (p_draw_dim == false) return;
////////        draw_dimensions(p_svg_mom, 0, 0, 0, [g_loc_fr, (g_span - g_loc_fr)], gv_margin_unit * 5, "mm", "dn");
////////    }
////////    else if (g_load_type == "uniform") {
////////        draw_unifrom_load(p_svg_mom, v_loc_fr, 0 - gv_ele_unit / 2, 0, v_loc_to - v_loc_fr, g_load, "N/mm", p_drag, "ufm_load"); // true = make load draggable
////////        if (p_draw_dim == false) return;
////////        var dims = [g_loc_to - g_loc_fr];
////////        if (Math.abs(g_loc_fr) > 1.0e-3) dims.splice(0, 0, g_loc_fr);
////////        if (Math.abs(g_loc_to - g_span) > 1.0e-3) dims.push(g_span - g_loc_to);
////////        draw_dimensions(p_svg_mom, 0, 0, 0, dims, gv_margin_unit * 5, "mm", "dn");
////////    }
////////}

////////////////function show_main_body() {
////////////////    // show pre_view
////////////////    $('#pre_view').slideDown(1000);
////////////////    $('#proceed').slideDown(1000);

////////////////    // set date
////////////////    var tgt_date = Date.parse(target_date[get_row_idx()]);
////////////////    var cur_date = new Date($.now());

////////////////    // after the target date, show main_view
////////////////    if (cur_date >= tgt_date) {
////////////////        $('#main_view').slideDown(2000);
////////////////        $('#re_view').slideUp(2000);
////////////////        $('#span_proceed').text(""); // set for next stage

////////////////        //$("#to_next").text("학습 결과");
////////////////        $("#submit_proceed").val("복습 퀴즈 풀이");
////////////////    }
////////////////}

////////////////function get_num_exac_quiz() {
////////////////    var exact_num = 0;
////////////////    $(".span_quiz").each(function () {
////////////////        // ele = this;
////////////////        if ($(this).text() == "정답입니다!") {
////////////////            exact_num = exact_num + 1;
////////////////        }
////////////////    });
////////////////    return exact_num;
////////////////}

////////////////// validation of input values
////////////////function IsNumeric(e, v) {
////////////////    // get prev input + current input
////////////////    var keyCode = e.which ? e.which : e.keyCode;
////////////////    var curInput = v + String.fromCharCode(keyCode);

////////////////    // preclude +/-/./+./-. for validation
////////////////    switch (curInput) {
////////////////        case "+": case "-": case ".": case "+.": case "-.":
////////////////            return true;
////////////////        default:
////////////////            break;
////////////////    }

////////////////    // check if it is Not a Number
////////////////    if (isNaN(curInput)) return false;
////////////////}

////////function solve_simple_beam(p_l_spt) {

////////    // get magnitude of load and location
////////    var load = g_load, dist = g_loc_fr;
////////    if (g_load_type == "uniform") {
////////        dist = (g_loc_fr + g_loc_to) / 2;
////////        load = g_load * (g_loc_to - g_loc_fr);
////////    }

////////    // compute reactions
////////    g_H = 0;
////////    g_V_b = load * dist / g_span;
////////    g_V_a = -g_V_b + load;

////////    // string for H_a or H_b
////////    var str_H = "H_A";
////////    if (p_l_spt == "roller") str_H = "H_B";

////////    // equilibrium equation
////////    var sigma_fx = "\\(\\Sigma F_x = " + str_H + " = " + g_H + ";\\quad " + str_H + " = " + g_H + "N\\)";
////////    var sigma_fy = "\\(\\Sigma F_y = V_A + V_B - " + load + " = 0;\\quad V_A = " + g_V_a + "N\\)";
////////    var sigma_mz = "\\(\\Sigma M_A = -" + load + "\\times" + dist + "+ V_B \\times " + g_span + "= 0;\\quad V_B = " + g_V_b + "N\\)";
////////    $("#sigma_fx").text(sigma_fx);
////////    $("#sigma_mz").text(sigma_mz);
////////    $("#sigma_fy").text(sigma_fy);

////////    // rendering dynamically generated mathjax in solve space
////////    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
////////}