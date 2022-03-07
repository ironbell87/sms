// mem = member of truss
const g_bg_sz = [700, 350]; // size of svg for problem
let g_pins = [], g_mems = [], g_loads = [], g_af = [];

$(document).ready(function () {
    // initialize svg
    g_setting = { L: 1000.0, A: 200.0, E: 200000.0, P: 10000.0, S: 5.0 };
    initialize_svg();

    // create and draw
    create();
    draw();

    // update UI
    $(document).on("input", "#input_L", function () {
        g_setting.L = parseFloat($(this).val());
        $("#label_L").html(g_setting.L.toFixed(g_digit) + " mm");
        create();
        draw();
    });
    $(document).on("input", "#input_A", function () {
        g_setting.A = parseFloat($(this).val());
        $("#label_A").html(g_setting.A.toFixed(g_digit) + " mm<sup>2</sup>");
        create();
        draw();
    });
    $(document).on("input", "#input_E", function () {
        g_setting.E = parseFloat($(this).val());
        $("#label_E").html(g_setting.E.toFixed(g_digit) + " MPa");
        create();
        draw();
    });
    $(document).on("input", "#input_P", function () {
        g_setting.P = parseFloat($(this).val());
        $("#label_P").html(g_setting.P.toFixed(g_digit) + " N");
        create();
        draw();
    });
    $(document).on("input", "#input_S", function () {
        g_setting.S = parseFloat($(this).val());
        $("#label_S").html(g_setting.S.toFixed(g_digit));
        create();
        draw();
    });
});

function initialize_svg() {
    $("#prob_svg").empty(); // delete the existing child svgs for all svgs
    append_hatching_pattern("#prob_svg"); // prepare hatching pattern for drawing of support
    var sx = gv_ele_unit * 1.5, sy = g_bg_sz[1] - 7 * gv_ele_unit;
    g_structure = d3.select("#prob_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)
}

function create() {
    // calculate nodal displacement
    var factor = (g_setting.P / 10000) * (g_setting.L / 1000) * (100 / g_setting.A) * (210000 / g_setting.E);
    g_af = [];
    g_af.push(create_point(factor * 4.76190, factor * -8.80251)); // top pins; af = after loading
    g_af.push(create_point(factor * 2.85714, factor * -13.00653));
    g_af.push(create_point(factor * 0.95238, factor * -8.80251));
    g_af.push(create_point(factor * 0.00000, factor * -0.00000)); // btm pins
    g_af.push(create_point(factor * 1.42857, factor * -8.80251));
    g_af.push(create_point(factor * 2.85714, factor * -12.05415));
    g_af.push(create_point(factor * 4.28571, factor * -8.80251));
    g_af.push(create_point(factor * 5.71429, factor * -0.00000));

    // create g_pins
    var L = g_setting.L, S = g_setting.S;
    g_pins = []; // bf: before loading; af: after loading
    g_pins.push({ id: 1, bf: create_point(1 * L, 1 * L), af: move_xy(create_point(1 * L, 1 * L), g_af[0].x * S, g_af[0].y * S) }); // top pins
    g_pins.push({ id: 2, bf: create_point(2 * L, 1 * L), af: move_xy(create_point(2 * L, 1 * L), g_af[1].x * S, g_af[1].y * S) });
    g_pins.push({ id: 3, bf: create_point(3 * L, 1 * L), af: move_xy(create_point(3 * L, 1 * L), g_af[2].x * S, g_af[2].y * S) });
    g_pins.push({ id: 4, bf: create_point(0 * L, 0 * L), af: move_xy(create_point(0 * L, 0 * L), g_af[3].x * S, g_af[3].y * S) }); // btm pins
    g_pins.push({ id: 5, bf: create_point(1 * L, 0 * L), af: move_xy(create_point(1 * L, 0 * L), g_af[4].x * S, g_af[4].y * S) });
    g_pins.push({ id: 6, bf: create_point(2 * L, 0 * L), af: move_xy(create_point(2 * L, 0 * L), g_af[5].x * S, g_af[5].y * S) });
    g_pins.push({ id: 7, bf: create_point(3 * L, 0 * L), af: move_xy(create_point(3 * L, 0 * L), g_af[6].x * S, g_af[6].y * S) });
    g_pins.push({ id: 8, bf: create_point(4 * L, 0 * L), af: move_xy(create_point(4 * L, 0 * L), g_af[7].x * S, g_af[7].y * S) });

    // create g_mems
    g_mems = []; // bf: before loading; af: after loading
    g_mems.push({ id: "AB", bf: create_vector(g_pins[0].bf, g_pins[1].bf), af: create_vector(g_pins[0].af, g_pins[1].af) }); // top cord
    g_mems.push({ id: "BC", bf: create_vector(g_pins[1].bf, g_pins[2].bf), af: create_vector(g_pins[1].af, g_pins[2].af) });
    g_mems.push({ id: "DE", bf: create_vector(g_pins[3].bf, g_pins[4].bf), af: create_vector(g_pins[3].af, g_pins[4].af) }); // btm cord
    g_mems.push({ id: "EF", bf: create_vector(g_pins[4].bf, g_pins[5].bf), af: create_vector(g_pins[4].af, g_pins[5].af) });
    g_mems.push({ id: "FG", bf: create_vector(g_pins[5].bf, g_pins[6].bf), af: create_vector(g_pins[5].af, g_pins[6].af) });
    g_mems.push({ id: "GH", bf: create_vector(g_pins[6].bf, g_pins[7].bf), af: create_vector(g_pins[6].af, g_pins[7].af) });
    g_mems.push({ id: "AE", bf: create_vector(g_pins[0].bf, g_pins[4].bf), af: create_vector(g_pins[0].af, g_pins[4].af) }); // vrt cord
    g_mems.push({ id: "BF", bf: create_vector(g_pins[1].bf, g_pins[5].bf), af: create_vector(g_pins[1].af, g_pins[5].af) });
    g_mems.push({ id: "CG", bf: create_vector(g_pins[2].bf, g_pins[6].bf), af: create_vector(g_pins[2].af, g_pins[6].af) });
    g_mems.push({ id: "AD", bf: create_vector(g_pins[0].bf, g_pins[3].bf), af: create_vector(g_pins[0].af, g_pins[3].af) }); // slp cord
    g_mems.push({ id: "AF", bf: create_vector(g_pins[0].bf, g_pins[5].bf), af: create_vector(g_pins[0].af, g_pins[5].af) });
    g_mems.push({ id: "CF", bf: create_vector(g_pins[2].bf, g_pins[5].bf), af: create_vector(g_pins[2].af, g_pins[5].af) });
    g_mems.push({ id: "CH", bf: create_vector(g_pins[2].bf, g_pins[7].bf), af: create_vector(g_pins[2].af, g_pins[7].af) });

    // create g_loads
    g_loads = []; // bf: before loading; af: after loading
    g_loads.push({ id: "D", bf: g_pins[3].bf, label: "P",  mag: 1 * g_setting.P });
    g_loads.push({ id: "A", bf: g_pins[0].bf, label: "2P", mag: 2 * g_setting.P });
    g_loads.push({ id: "B", bf: g_pins[1].bf, label: "2P", mag: 2 * g_setting.P });
    g_loads.push({ id: "C", bf: g_pins[2].bf, label: "2P", mag: 2 * g_setting.P });
    g_loads.push({ id: "H", bf: g_pins[7].bf, label: "P",  mag: 1 * g_setting.P });
}

function draw() {
    // coordinates of left, right pin
    var lx = 0, rx = g_bg_sz[0] - 3 * gv_ele_unit; // left and right
    var scaler = d3.scaleLinear().domain([0, 4 * g_setting.L]).range([lx, rx]); // scale [0, 4*L] to [lx, rx]

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // draw undeformed shape
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // draw g_mems
    g_structure.selectAll(".u_mem").data(g_mems).join("line").classed("u_mem", true)
        .attr("x1", mem => scaler(mem.bf.sp.x)).attr("y1", mem => scaler(mem.bf.sp.y))
        .attr("x2", mem => scaler(mem.bf.ep.x)).attr("y2", mem => scaler(mem.bf.ep.y))
        .attr("style", "stroke-width:3; stroke:lightgrey;")// stroke-dasharray:3,3")
        .on("mouseover", mem => { mouse_enter(mem.bf.mg); })
        .on("mouseout", function () { mouse_out(); });
    // draw g_pins
    g_structure.selectAll(".u_pin").data(g_pins).join("circle").classed("u_pin", true)
        .attr("cx", pin => scaler(pin.bf.x)).attr("cy", pin => scaler(pin.bf.y))
        .attr("r", 2)
        .attr("style", "cursor:pointer; fill:lightgrey; stroke-width:1; stroke:dimgrey");
        //.on("mouseover", pin => { mouse_enter(pin.bf.x, pin.bf.y); })
        //.on("mouseout", function () { mouse_out(); });
    // draw load
    g_structure.selectAll(".line").data(g_loads).join("line").classed("line", true) // line
        .attr("x1", load => scaler(load.bf.x)).attr("y1", load => scaler(load.bf.y) + tri_h)
        .attr("x2", load => scaler(load.bf.x)).attr("y2", load => scaler(load.bf.y) + tri_h + (load.label == "P" ? 1 : 1.8) * gv_load)
        .attr("style", "stroke-width:1; stroke:dimgrey");
    g_structure.selectAll(".polygon").data(g_loads).join("polygon").classed("polygon", true) // triangle
        .attr("transform", load => "translate(" + scaler(load.bf.x) + ", " + (scaler(load.bf.y) + tri_h) + ") rotate(180)") // do not know why "rotate and then translate" does not work!!
        .attr("points", tri_str)
        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
    g_structure.selectAll(".magnitude").data(g_loads).join("text").classed("magnitude", true) // magnitude
        .attr("transform", "scale(1,-1)") // translate and then rotate the object and axes
        .attr("dominant-baseline", "central")
        .attr("x", load => scaler(load.bf.x)).attr("y", load => -(scaler(load.bf.y) + tri_h + gv_ele_unit / 1.7 + (load.label == "P" ? 1 : 1.8) * gv_load))
        .html(load => load.label)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle");
    var supports = [{ type: "hinge", x: scaler(g_pins[3].bf.x), y: scaler(g_pins[3].bf.y), ang: 180 },
                    { type: "roller", x: scaler(g_pins[7].bf.x), y: scaler(g_pins[7].bf.y), ang: 180 }];
    draw_supports(g_structure, supports);

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // draw deformed shape
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // draw g_mems
    g_structure.selectAll(".mem").data(g_mems).join("rect").classed("mem", true)
        .attr("transform", mem => "translate(" + scaler(mem.af.sp.x) + ", " + scaler(mem.af.sp.y) + ") rotate(" + mem.af.ng + ")")
        .attr("x", 0).attr("y", -gv_ele_unit / 8)
        .attr("width", mem => scaler(mem.af.mg)).attr("height", gv_ele_unit / 4)
        .attr("style", "fill:lightgrey; stroke:dimgrey");
    // draw g_pins
    g_structure.selectAll(".pin").data(g_pins).join("circle").classed("pin", true)
        .attr("cx", pin => scaler(pin.af.x)).attr("cy", pin => scaler(pin.af.y))
        .attr("r", 5)
        .attr("style", "cursor:pointer; fill:white; stroke-width:1; stroke:dimgrey")
        .on("mouseover", (pin, i) => { mouse_enter(g_af[i].x, g_af[i].y); })
        .on("mouseout", function () { mouse_out(); });
}

function mouse_enter(p_x, p_y) {
    var wth = "170px", hgt = "28px";
    var lft = (d3.event.pageX - 70).toString() + "px", top = (d3.event.pageY - 35).toString() + "px";
    var tooltip_text = "L = " + p_x.toFixed(g_digit + 2) + "mm";
    if (p_y != undefined) tooltip_text = "(" + p_x.toFixed(g_digit + 2) + ", " + p_y.toFixed(g_digit + 2) + ")mm";

    g_tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div")
        .classed("tooltip", true)
        .style("left", lft).style("top", top)
        .style("width", wth).style("height", hgt)
        .style("opacity", 0)
        .html(tooltip_text);
    g_tooltip
        .transition().duration(500)
        .style("opacity", .8);
}

function mouse_out() {
    // hide tooltip
    g_tooltip.transition().duration(500).style("opacity", 0);
    g_tooltip = undefined;
}