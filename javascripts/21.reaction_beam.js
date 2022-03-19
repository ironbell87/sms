//var g_span = 600, g_load = 100, g_load_type = "point", g_loc_fr = 300, g_loc_to = 300;
////var g_Va = 50, g_Vb = 50, g_Ha = 0;
//var gv_pre_x, gv_pre_y, gv_pre_load_width; // for dragging

//$(document).ready(function () {
//    // update setting
//    $("#setting_space").css("height", "170px");
//    $(document).on("input", "#input_T", function () {
//        if (parseInt($(this).val()) == 0) { // point load
//            g_load_type = "point";
//            g_loc_to = g_loc_fr;
//            $("#label_T").html("Point load");
//        }
//        else { // point ==> uniform
//            g_load_type = "uniform";
//            if (g_loc_fr == g_span) g_loc_fr = 0;
//            g_loc_to = g_span;
//            $("#label_T").html("Uniform load");
//        }
//        draw_simple_beam_problem();
//        draw_simple_beam_FBD();
//        solve_simple_beam_problem();
//    });
//    $(document).on("input", "#input_P", function () {
//        g_load = parseFloat($(this).val());
//        $("#label_P").html(g_load.toFixed(g_digit) + " N");
//        draw_simple_beam_problem();
//        draw_simple_beam_FBD();
//        solve_simple_beam_problem();
//    });
//    $(document).on("input", "#input_L", function () {
//        var new_span = parseFloat($(this).val());
//        var ratio = new_span / g_span;
//        g_span = new_span;
//        g_loc_fr = g_loc_fr * ratio; // rounding to 0, 5, 10, ... makes large error
//        g_loc_to = g_loc_to * ratio;
//        $("#label_L").html(g_span.toFixed(g_digit) + " mm");
//        draw_simple_beam_problem();
//        draw_simple_beam_FBD();
//        solve_simple_beam_problem();
//    });

//    // initialize svg
//    initialize_svg();

//    // draw simple beam, loads
//    draw_simple_beam_problem();

//    // draw FBD
//    draw_simple_beam_FBD();

//    // solve
//    solve_simple_beam_problem();
//});

//function drag_load_started() {
//    // set point at start of drag
//    gv_pre_x = d3.event.x;
//    gv_pre_y = d3.event.y;
//    gv_pre_load_width = (g_loc_to - g_loc_fr) * gv_ratio_len;

//    // show tooltip
//    g_tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div")
//        .classed("tooltip", true)
//        .style("left", d3.event.sourceEvent.clientX.toString() + "px")
//        .style("top", (d3.event.sourceEvent.clientY + 28).toString() + "px")
//        .style("opacity", 0)
//        .html(g_loc_fr.toString() + ", " + g_loc_to.toString());
//    g_tooltip
//        .transition().duration(500)
//        .style("opacity", .8);
//}

//function drag_load_ing() {
//    // get svg of this load
//    var svg_load = d3.select(this.parentNode);

//    // get new x
//    var pre_trans = get_transformation(svg_load.attr("transform"));
//    var v_new_x = d3.event.x;
//    var v_end_x = g_loc_to * gv_ratio_len;

//    /// apply constraint to end point of load
//    switch (this.id) {
//        case "pnt_load": // coordinate system of parent node is used
//            if (v_new_x < 0) v_new_x = 0;
//            if (gv_span < v_new_x) v_new_x = gv_span;
//            v_end_x = v_new_x;
//            svg_load.attr("transform", "translate(" + v_new_x + "," + pre_trans.translateY + ") rotate(" + pre_trans.rotate + ")"); // update svg of the load
//            break;
//        case "ufm_load": // coordinate system of parent node is used
//            v_new_x = pre_trans.translateX + d3.event.dx; // pre_x + delta_x = new_x of point load or start_x of uniform load
//            if (v_new_x < 0) v_new_x = 0;
//            if (gv_span < v_new_x) v_new_x = gv_span;
//            v_end_x = v_new_x + ((g_loc_to - g_loc_fr) * gv_ratio_len);
//            if (gv_span <= v_end_x) {
//                v_end_x = gv_span;
//                v_new_x = v_end_x - ((g_loc_to - g_loc_fr) * gv_ratio_len);
//            }
//            svg_load.attr("transform", "translate(" + v_new_x + "," + pre_trans.translateY + ") rotate(" + pre_trans.rotate + ")"); // update svg of the load
//            break;
//        case "s_u_load": // coordinate system of parent of ufm_load is used
//            v_new_x = d3.event.x; // d3.event.dx + g_loc_fr * gv_ratio_len;
//            v_end_x = g_loc_to * gv_ratio_len;
//            if (v_new_x < 0) v_new_x = 0;
//            if (v_end_x <= v_new_x) v_new_x = v_end_x - 5 * gv_ratio_len; // 5 is the min of delta
//            svg_load.attr("transform", "translate(" + (v_new_x - gv_pre_x) + "," + pre_trans.translateY + ") rotate(" + pre_trans.rotate + ")"); // update svg of the load
//            break;
//        case "e_u_load": // coordinate system of parent of ufm_load is used
//            v_new_x = g_loc_fr * gv_ratio_len;
//            v_end_x = d3.event.x; // d3.event.dx + g_loc_to * gv_ratio_len;
//            if (gv_span < v_end_x) v_end_x = gv_span;
//            if (v_end_x <= v_new_x) v_end_x = v_new_x + 5 * gv_ratio_len; // 5 is the min of delta
//            svg_load.attr("transform", "translate(" + (v_end_x - gv_pre_x + gv_pre_load_width) + "," + pre_trans.translateY + ") rotate(" + pre_trans.rotate + ")"); // update svg of the load
//            break;
//    }

//    // update input for position of the load
//    g_loc_fr = round_by_unit(v_new_x / gv_ratio_len, 5); // transform to x in graphic to logical; then round to 0, 5, 10, 15, ...
//    g_loc_to = round_by_unit(v_end_x / gv_ratio_len, 5); // transform to x in graphic to logical; then round to 0, 5, 10, 15, ...
//    g_tooltip
//        .style("left", d3.event.sourceEvent.clientX.toString() + "px")
//        .html(g_loc_fr.toString() + ", " + g_loc_to.toString());
//}

//function drag_load_ended() {
//    // hide tooltip
//    g_tooltip.transition().duration(500).style("opacity", 0);
//    g_tooltip = undefined;

//    // redraw problem
//    draw_simple_beam_problem();
//    draw_simple_beam_FBD();
//    solve_simple_beam_problem();
//}

//function initialize_svg() {
//    // initialize svg
//    $("#prob_svg, #fbd_svg, #reaction_svg").empty();
//    append_hatching_pattern("#prob_svg"); // prepare hatching pattern

//    // draw simple beam and loads and fbd
//    var sx = 100, sy = 100, ang = 0;
//    g_structure = d3.select("#prob_svg").append("g"); // set svg group
//    g_fbd = d3.select("#fbd_svg").append("g"); // set svg group
//}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// draw beams and frames
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//function draw_simple_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
//    // translate and then rotate
//    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

//    // set variable
//    span = p_span * gv_ratio_len;

//    // beam and label
//    draw_single_member(p_svg_mom, 0, 0, 0, span); // 0 = rotation in cw
//    draw_label(p_svg_mom, 0, 0, 0, -gv_ele_unit, 0, "A", undefined, "middle"); // undefined = subscript
//    draw_label(p_svg_mom, span, 0, 0, gv_ele_unit / 2, 0, "B", undefined, "middle"); // undefined = subscript

//    // support
//    draw_hinge(p_svg_mom, 0, gv_ele_unit / 2, 0);
//    draw_roller(p_svg_mom, span, gv_ele_unit / 2, 0);

//    // dimensions
//    draw_dimensions(p_svg_mom, 0, 0, 0, "beam_dim", [p_span], gv_margin_unit * 3, "mm", "dn", true);
//}

//function draw_simple_beam_fbd(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
//    // translate and then rotate
//    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

//    // set variable
//    span = p_span * gv_ratio_len;

//    // beam and label
//    draw_single_member(p_svg_mom, 0, 0, 0, span); // 0 = rotation in cw
//    //draw_label(p_svg_mom, 0, 0, 0, gv_ele_unit * 1.5, -135, "A", undefined, "middle"); // undefined = subscript
//    //draw_label(p_svg_mom, span, 0, 0, gv_ele_unit * 0.75, -45, "B", undefined, "middle"); // undefined = subscript

//    // support reactions
//    draw_hinge_reactions(p_svg_mom, 0, gv_ele_unit / 2, 0, "A", "up", "up");
//    draw_roller_reactions(p_svg_mom, span, gv_ele_unit / 2, 0, "B", "up");
//}

///*function draw_cantilever_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt) {
//    // beam
//    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

//    // support
//    if (p_l_spt == "fix") {
//        draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang + 90);
//    }
//    else if (p_l_spt == "free") {
//        draw_fix(p_svg_mom, p_org_x + p_len, p_org_y, p_ang - 90);
//    }
//    else {
//        alert("Support must be fix or free!")
//    }
//}

//function draw_simple_Gerber_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt, p_loc_hinge, p_loc_roller) {
//    // beam
//    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

//    // support
//    if (p_l_spt == "hinge") {
//        draw_hinge(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
//        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
//    }
//    else if (p_l_spt == "roller") {
//        draw_roller(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
//        draw_hinge(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
//    }
//    else {
//        alert("Support must be hinge or roller!")
//    }
//    draw_roller(p_svg_mom, p_org_x + p_loc_roller, p_org_y + p_sect_hgt / 2, p_ang); // internal roller support

//    // internal hinge joint
//    draw_hinge_joint(p_svg_mom, p_org_x + p_loc_hinge, p_org_y);
//}

//function draw_cantilever_Gerber_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt, p_loc_hinge) {
//    // beam
//    draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt); // 0 = rotation in cw

//    // support
//    if (p_l_spt == "fix") {
//        draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang + 90);
//        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y + p_sect_hgt / 2, p_ang);
//    }
//    else if (p_l_spt == "free") {
//        draw_roller(p_svg_mom, p_org_x, p_org_y + p_sect_hgt / 2, p_ang);
//        draw_fix(p_svg_mom, p_org_x + p_len, p_org_y, p_ang - 90);
//    }
//    else {
//        alert("Support must be fix or free!")
//    }

//    // internal hinge joint
//    draw_hinge_joint(p_svg_mom, p_org_x + p_loc_hinge, p_org_y);
//}

//function draw_2c_1b_simple_frame(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_hgt, p_sect_hgt, p_l_spt) {
//    // frame using path
//    p_svg_mom.append("path") // border
//        .attr("d", "m0,0v" + -p_hgt +"h" + p_len + "v" + p_hgt)
//        .attr("style", "fill:none;stroke:dimgrey;stroke-linejoin:miter;stroke-linecap:butt;stroke-width:" + p_sect_hgt)
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//    p_svg_mom.append("path") // interior
//        .attr("d", "m0,-0.5v" + -(p_hgt - 0.5) + "h" + p_len + "v" + (p_hgt - 0.5))
//        .attr("style", "fill:none;stroke:lightgrey;stroke-linejoin:miter;stroke-linecap:butt;stroke-width:" + (p_sect_hgt-1))
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate

//    // support
//    if (p_l_spt == "hinge") {
//        draw_hinge(p_svg_mom, p_org_x, p_org_y, p_ang);
//        draw_roller(p_svg_mom, p_org_x + p_len, p_org_y, p_ang);
//    }
//    else if (p_l_spt == "roller") {
//        draw_roller(p_svg_mom, p_org_x, p_org_y, p_ang);
//        draw_hinge(p_svg_mom, p_org_x + p_len, p_org_y, p_ang);
//    }
//    else {
//        alert("Support must be hinge or roller!")
//    }
//}*/

//function draw_simple_beam_problem() {
//    // prepare variable for drawing
//    gv_ratio_len = gv_span / g_span;
//    gv_ratio_load = gv_load / g_load;

//    // initialize svg
//    $("#prob_svg, #fbd_svg, #reaction_svg").empty();
//    append_hatching_pattern("#prob_svg"); // prepare hatching pattern

//    // draw simple beam and loads
//    var sx = 100, sy = 100, ang = 0;
//    g_structure = d3.select("#prob_svg").append("g"); // set svg group
//    draw_simple_beam(g_structure, sx, sy, ang, g_span);
//    draw_beam_loads(g_structure, 1, true, true); // 1 = the 1st load, true = draw dimension, true = make load draggable
//}

//function draw_simple_beam_FBD() {
//    // draw free body diagram
//    var sx = 100, sy = 100, ang = 0;
//    g_fbd = d3.select("#fbd_svg").append("g"); // set svg group
//    draw_simple_beam_fbd(g_fbd, sx, sy, ang, g_span);
//    draw_beam_loads(g_fbd, 1, true); // 1 = the 1st load, true = draw dimension
//}

//function solve_simple_beam_problem() {
//    // get magnitude of load and location
//    var load = g_load, dist = g_loc_fr;
//    if (g_load_type == "uniform") {
//        dist = +((g_loc_fr + g_loc_to) / 2).toFixed(g_digit); // 3.toFixed(4) ==> string "3.0000"; +3.toFixed(4) ==> number 3.0000
//        load = +(g_load * (g_loc_to - g_loc_fr)).toFixed(g_digit);
//    }

//    // compute reactions
//    var reactions = [0, load * (g_span - dist) / g_span, load * (dist / g_span)]; // g_Ha, g_Va, g_Vb

//    // show reactions
//    var inputs = $(".div_setting > input");
//    if (inputs.length > 0) {
//        inputs[0].value = (reactions[0] + get_random(-0.1, 0.1)).toFixed(g_digit);
//        inputs[1].value = (reactions[1] * (1 + get_random(-0.1, 0.1))).toFixed(g_digit);
//        inputs[2].value = (reactions[2] * (1 + get_random(-0.1, 0.1))).toFixed(g_digit);
//    }

//    //// compute reactions
//    //g_H = 0;
//    //g_V_b = load * (dist / g_span);
//    //g_V_a = -g_V_b + load;

//    //// equilibrium equation
//    //var sigma_fx = "\\(\\Sigma F_x = " + str_H + " = " + g_H + ";\\quad H_A = " + g_H + "N\\)";
//    //var sigma_fy = "\\(\\Sigma F_y = V_A + V_B - " + load + " = 0;\\quad V_A = " + g_V_a + "N\\)";
//    //var sigma_mz = "\\(\\Sigma M_A = -" + load + "\\times" + dist + "+ V_B \\times " + g_span + "= 0;\\quad V_B = " + g_V_b + "N\\)";
//    //$("#sigma_fx").text(sigma_fx);
//    //$("#sigma_mz").text(sigma_mz);
//    //$("#sigma_fy").text(sigma_fy);

//    ////////////////////////////////////////////////////////////////////////////////////////////////////////
//    ////////////////////////////////////////////////////////////////////////////////////////////////////////
//    ////// object for display of measurement using svg; msmt = measurement
//    //var msmt = [{ "label": "H", "sub": "A", "val": (g_H + get_random(-0.1, 0.1)).toFixed(g_digit), "unit": "N" },
//    //            { "label": "V", "sub": "A", "val": (g_V_a + get_random(-g_V_a * 0.1, g_V_a * 0.1)).toFixed(g_digit), "unit": "N" },
//    //            { "label": "V", "sub": "B", "val": (g_V_b + get_random(-g_V_b * 0.1, g_V_b * 0.1)).toFixed(g_digit), "unit": "N" }];

//    //// draw free body diagram
//    //var sx = 50, sy = 0, ang = 0;
//    //g_reaction = d3.select("#reaction_svg").append("g") // set svg group
//    ////g_measurement = d3.select("#measurement_svg").append("g") // set svg group
//    //    .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)

//    //// draw the results
//    //var msmt_result_grp = g_reaction.selectAll("g").data(msmt).join("g")
//    //    .attr("transform", (d, i) => "translate(0, " + (-i * 60 - 50) + ")");
//    //msmt_result_grp.append("text")
//    //    .attr("x", 0).attr("y", 0)
//    //    //.html(d => "<pre>" + d.label + "             " + d.val + "    " + d.unit + "</pre>")
//    //    .html(d => d.label)
//    //    .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
//    //    .attr("transform", "scale(1, -1)")
//    //    .append("tspan").text(d => d.sub).style("baseline-shift", "sub").style("font-size", "0.8em");
//    //msmt_result_grp.append("rect")
//    //    .attr("x", 50).attr("y", -15)
//    //    .attr("width", 150).attr("height", 40)
//    //    .attr("rx", 20).attr("rx", 20)
//    //    .attr("style", "stroke:grey; stroke-width:0.5; fill:none");
//    //msmt_result_grp.append("text")
//    //    .attr("x", 180).attr("y", 0)
//    //    .html(d => d.val)
//    //    .attr("style", "cursor:default; fill:grey; font-weight:bold; text-anchor:end") // start/middle/end
//    //    .attr("transform", "scale(1, -1)");
//    //msmt_result_grp.append("text")
//    //    .attr("x", 210).attr("y", 0)
//    //    .html(d => { return d.unit; })
//    //    .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
//    //    .attr("transform", "scale(1, -1)");
//    ////////////////////////////////////////////////////////////////////////////////////////////////////////
//    ////////////////////////////////////////////////////////////////////////////////////////////////////////
//}


var g_span = 600, g_load = 100, g_load_type = "point", g_loc_fr = 300, g_loc_to = 300;
//var g_Va = 50, g_Vb = 50, g_Ha = 0;
var gv_pre_x, gv_pre_y, gv_to_fr, gv_to_to; // for dragging

$(document).ready(function () {
    // update setting
    g_setting = { b: 30.0, h: 50.0, L: 600.0, P: 100.0, E: 2200.0, Support: "Simple support", I: function () { return this.b * Math.pow(this.h, 3) / 12; } };
    $("#setting_space").css("height", "220px");
    $(document).on("input", "#input_S", function () {
        var spt_idx = parseInt($(this).val());
        g_setting.Support = g_support[spt_idx];
        if ($(".div_setting > label")[2] != undefined) {
            if (g_setting.Support == g_support[0])
                $(".div_setting > label")[2].innerHTML = "V<sub>B</sub> (N)"; // an element of array of jQuery is a DOM element, therefore make the DOM element to jQuery element using "$($(..."
            else
                $($(".div_setting > label")[2]).html("M<sub>A</sub> (Nmm)"); // $($(... => make jQuery element
        }
        $("#label_S").html(g_setting.Support);

        draw_beam_problem();
        draw_beam_FBD();
        solve_beam_problem();
    });
    $(document).on("input", "#input_LoadType", function () {
        if (parseInt($(this).val()) == 0) { // point load
            g_load_type = "point";
            g_loc_to = g_loc_fr;
            $("#label_LoadType").html("Point load");
        }
        else { // point ==> uniform
            g_load_type = "uniform";
            if (g_loc_fr == g_span) g_loc_fr = 0;
            g_loc_to = g_span;
            $("#label_LoadType").html("Uniform load");
        }
        draw_beam_problem();
        draw_beam_FBD();
        solve_beam_problem();
    });
    $(document).on("input", "#input_P", function () {
        g_load = parseFloat($(this).val());
        $("#label_P").html(g_load.toFixed(g_digit) + " N");
        draw_beam_problem();
        draw_beam_FBD();
        solve_beam_problem();
    });
    $(document).on("input", "#input_L", function () {
        var new_span = parseFloat($(this).val());
        var ratio = new_span / g_span;
        g_span = new_span;
        g_loc_fr = g_loc_fr * ratio; // rounding to 0, 5, 10, ... makes large error
        g_loc_to = g_loc_to * ratio;
        $("#label_L").html(g_span.toFixed(g_digit) + " mm");
        draw_beam_problem();
        draw_beam_FBD();
        solve_beam_problem();
    });

    // initialize svg
    initialize_svg();

    // draw beam, loads, FBD, and solve
    draw_beam_problem();
    draw_beam_FBD();
    solve_beam_problem();
});

function drag_load_started() {
    // set point at start of drag
    gv_pre_x = g_loc_fr * gv_ratio_len;
    gv_pre_y = d3.event.y;
    gv_to_fr = (d3.event.x - 100) - g_loc_fr * gv_ratio_len;
    gv_to_to = g_loc_to * gv_ratio_len - (d3.event.x - 100);
}

function drag_load_ing() {
    // if drag is not needed
    if (d3.select(this).datum().drag == false) return;

    // get new x
    var v_new_x = d3.event.x, v_end_x = v_new_x;

    // apply constraint to end point of load
    switch (this.id) {
        case "pnt_load": // coordinate system of parent node is used
            v_new_x = Math.max(0, v_new_x);
            v_new_x = Math.min(v_new_x, gv_span);
            v_end_x = v_new_x;
            break;
        case "ufm_load": // coordinate system of parent node is used
            v_new_x = Math.max(0, (d3.event.x - 100) - gv_to_fr);
            v_end_x = v_new_x + (gv_to_fr + gv_to_to);
            v_end_x = Math.min(v_end_x, g_span * gv_ratio_len);
            v_new_x = v_end_x - (gv_to_fr + gv_to_to);
            break;
        case "s_u_load": // coordinate system of parent of ufm_load is used
            v_end_x = g_loc_to * gv_ratio_len;
            v_new_x = Math.max(0, gv_pre_x + d3.event.x);
            v_new_x = Math.min(v_new_x, v_end_x - 5 * gv_ratio_len); // 5 is the min of delta
            //v_new_x = Math.max(0, gv_pre_x + d3.event.x);
            //v_end_x = g_loc_to * gv_ratio_len;
            //if (v_end_x <= v_new_x) v_new_x = v_end_x - 5 * gv_ratio_len; // 5 is the min of delta
            //svg_load.attr("transform", "translate(" + v_new_x + "," + pre_trans.translateY + ") rotate(" + pre_trans.rotate + ")"); // update svg of the load
            break;
        case "e_u_load": // coordinate system of parent of ufm_load is used
            v_new_x = gv_pre_x;
            v_end_x = Math.min(v_new_x + d3.event.x, gv_span);
            v_end_x = Math.max(v_new_x + 5 * gv_ratio_len, v_end_x); // 5 is the min of delta
            //v_new_x = gv_pre_x;
            //v_end_x = Math.min(v_new_x + d3.event.x, gv_span); // d3.event.dx + g_loc_to * gv_ratio_len;
            //if (v_end_x <= v_new_x) v_end_x = v_new_x + 5 * gv_ratio_len; // 5 is the min of delta
            //svg_load.attr("transform", "translate(" + v_end_x + "," + pre_trans.translateY + ") rotate(" + pre_trans.rotate + ")"); // update svg of the load
            break;
    }

    // update input for position of the load
    g_loc_fr = round_by_unit(v_new_x / gv_ratio_len, 5); // transform to x in graphic to logical; then round to 0, 5, 10, 15, ...
    g_loc_to = round_by_unit(v_end_x / gv_ratio_len, 5); // transform to x in graphic to logical; then round to 0, 5, 10, 15, ...

    // redraw problem
    draw_beam_problem();
    draw_beam_FBD();
    solve_beam_problem();
}

function drag_load_ended() {
    //// hide tooltip
    //g_tooltip.transition().duration(500).style("opacity", 0);
    //g_tooltip = undefined;

    //// redraw problem
    //draw_simple_beam_problem();
    //draw_simple_beam_FBD();
    //solve_simple_beam_problem();
}

function initialize_svg() {
    $("#prob_svg, #fbd_svg, #reaction_svg").empty();
    append_hatching_pattern("#prob_svg"); // prepare hatching pattern

    g_structure = d3.select("#prob_svg").append("g"); // set svg group
    g_fbd = d3.select("#fbd_svg").append("g"); // set svg group
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw beams and frames
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function draw_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    // translate and then rotate
    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

    // set variable
    span = p_span * gv_ratio_len;

    // beam
    draw_single_member(p_svg_mom, 0, 0, 0, span); // 0 = rotation in cw

    // label
    p_svg_mom.selectAll("text.label").remove();
    var labels = [{ x: 0, y: 0, ang: 0, offset: -gv_ele_unit, offset_ang: 0, label: "A", anchor: "middle" },
                  { x: span, y: 0, ang: 0, offset: gv_ele_unit, offset_ang: 0, label: "B", anchor: "middle" }];
    if (g_setting.Support == g_support[1]) {
        labels = [{ x: 0, y: 0, ang: 0, offset: gv_ele_unit * 1.7, offset_ang: 60, label: "A", anchor: "middle" },
                  { x: span, y: 0, ang: 0, offset: gv_ele_unit, offset_ang: 0, label: "B", anchor: "middle" }];
    }
    draw_labels(p_svg_mom, labels);

    // support
    p_svg_mom.selectAll("g.support").remove();
    var supports = [{ type: "hinge", x: 0, y: gv_ele_unit / 2, ang: 0 },
                    { type: "roller", x: span, y: gv_ele_unit / 2, ang: 0 }];
    if (g_setting.Support == g_support[1]) {
        supports = [{ type: "fix", x: 0, y: 0, ang: p_ang + 90 }];
    }
    draw_supports(p_svg_mom, supports);

    // dimensions
    draw_dimensions(p_svg_mom, 0, 0, 0, "beam_dim", [p_span], gv_margin_unit * 3, "mm", "dn", true);
}

function draw_beam_fbd(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    // translate and then rotate
    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

    // set variable
    span = p_span * gv_ratio_len;

    // beam and label
    draw_single_member(p_svg_mom, 0, 0, 0, span); // 0 = rotation in cw

    // support reactions
    if (g_setting.Support == g_support[0]) { // simple support
        p_svg_mom.selectAll("g.fix_reaction").remove();
        p_svg_mom.selectAll("g.fix_mnt_reaction").remove();
        draw_hinge_reactions(p_svg_mom, 0, gv_ele_unit / 2, 0, "A");
        draw_roller_reactions(p_svg_mom, span, gv_ele_unit / 2, 0, "B");
    }
    else { // cantilever
        p_svg_mom.selectAll("g.hinge_reaction").remove();
        p_svg_mom.selectAll("g.roller_reaction").remove();
        draw_fix_reactions(p_svg_mom, 0, gv_ele_unit / 2, 180, "A");
    }
}

/*function draw_simple_Gerber_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_len, p_sect_hgt, p_l_spt, p_loc_hinge, p_loc_roller) {
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

function draw_beam_problem() {
    // prepare variable for drawing
    gv_ratio_len = gv_span / g_span;
    gv_ratio_load = gv_load / g_load;

    // draw beam
    var sx = 100, sy = 100, ang = 0;
    draw_beam(g_structure, sx, sy, ang, g_span);
    
    // draw loads
    draw_beam_loads(g_structure, 1, true, true); // 1 = the 1st load, true = draw dimension, true = make load draggable
}

function draw_beam_FBD() {
    if (g_fbd == undefined) return;

    // draw free body diagram
    var sx = 100, sy = 100, ang = 0;
    draw_beam_fbd(g_fbd, sx, sy, ang, g_span);
    draw_beam_loads(g_fbd, 1, true, false); // 1 = the 1st load, true = draw dimension
}

function solve_beam_problem() {
    // get magnitude of load and location
    var load = g_load, dist = g_loc_fr;
    if (g_load_type == "uniform") {
        dist = +((g_loc_fr + g_loc_to) / 2).toFixed(g_digit); // 3.toFixed(4) ==> string "3.0000"; +3.toFixed(4) ==> number 3.0000
        load = +(g_load * (g_loc_to - g_loc_fr)).toFixed(g_digit);
    }

    // compute reactions
    var reactions = [0, load * (g_span - dist) / g_span, load * (dist / g_span)]; // g_Ha, g_Va, g_Vb
    if (g_setting.Support == g_support[1]) reactions = [0, load, load * dist]; // g_Ha, g_Va, g_Ma; for cantilever

    // show reactions
    var inputs = $(".div_setting > input");
    if (inputs.length > 0) {
        inputs[0].value = (reactions[0] + get_random(-0.1, 0.1)).toFixed(g_digit);
        inputs[1].value = (reactions[1] * (1 + get_random(-0.1, 0.1))).toFixed(g_digit);
        inputs[2].value = (reactions[2] * (1 + get_random(-0.1, 0.1))).toFixed(g_digit);
    }

    //// compute reactions
    //g_H = 0;
    //g_V_b = load * (dist / g_span);
    //g_V_a = -g_V_b + load;

    //// equilibrium equation
    //var sigma_fx = "\\(\\Sigma F_x = " + str_H + " = " + g_H + ";\\quad H_A = " + g_H + "N\\)";
    //var sigma_fy = "\\(\\Sigma F_y = V_A + V_B - " + load + " = 0;\\quad V_A = " + g_V_a + "N\\)";
    //var sigma_mz = "\\(\\Sigma M_A = -" + load + "\\times" + dist + "+ V_B \\times " + g_span + "= 0;\\quad V_B = " + g_V_b + "N\\)";
    //$("#sigma_fx").text(sigma_fx);
    //$("#sigma_mz").text(sigma_mz);
    //$("#sigma_fy").text(sigma_fy);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////// object for display of measurement using svg; msmt = measurement
    //var msmt = [{ "label": "H", "sub": "A", "val": (g_H + get_random(-0.1, 0.1)).toFixed(g_digit), "unit": "N" },
    //            { "label": "V", "sub": "A", "val": (g_V_a + get_random(-g_V_a * 0.1, g_V_a * 0.1)).toFixed(g_digit), "unit": "N" },
    //            { "label": "V", "sub": "B", "val": (g_V_b + get_random(-g_V_b * 0.1, g_V_b * 0.1)).toFixed(g_digit), "unit": "N" }];

    //// draw free body diagram
    //var sx = 50, sy = 0, ang = 0;
    //g_reaction = d3.select("#reaction_svg").append("g") // set svg group
    ////g_measurement = d3.select("#measurement_svg").append("g") // set svg group
    //    .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)

    //// draw the results
    //var msmt_result_grp = g_reaction.selectAll("g").data(msmt).join("g")
    //    .attr("transform", (d, i) => "translate(0, " + (-i * 60 - 50) + ")");
    //msmt_result_grp.append("text")
    //    .attr("x", 0).attr("y", 0)
    //    //.html(d => "<pre>" + d.label + "             " + d.val + "    " + d.unit + "</pre>")
    //    .html(d => d.label)
    //    .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
    //    .attr("transform", "scale(1, -1)")
    //    .append("tspan").text(d => d.sub).style("baseline-shift", "sub").style("font-size", "0.8em");
    //msmt_result_grp.append("rect")
    //    .attr("x", 50).attr("y", -15)
    //    .attr("width", 150).attr("height", 40)
    //    .attr("rx", 20).attr("rx", 20)
    //    .attr("style", "stroke:grey; stroke-width:0.5; fill:none");
    //msmt_result_grp.append("text")
    //    .attr("x", 180).attr("y", 0)
    //    .html(d => d.val)
    //    .attr("style", "cursor:default; fill:grey; font-weight:bold; text-anchor:end") // start/middle/end
    //    .attr("transform", "scale(1, -1)");
    //msmt_result_grp.append("text")
    //    .attr("x", 210).attr("y", 0)
    //    .html(d => { return d.unit; })
    //    .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
    //    .attr("transform", "scale(1, -1)");
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
}