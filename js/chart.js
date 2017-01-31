$(function () {
    var margin = { top: 50, right: 30, bottom: 50, left: 40 },
        width = $(window).width() - margin.left - margin.right,
        height = $(window).height() - margin.top - margin.bottom;

    var customTimeFormat = d3.time.format.multi([
        ["%d-%m-%y %H:%M", function (d) { return d.getHours() != 0; }],
        ["%d %b %y", function (d) { return d.getDay() && d.getDate() != 1; }],
        ["%d %b %y", function (d) { return d.getDate() != 1; }],
        ["%B %y", function (d) { return d.getMonth(); }],
        ["%Y", function () { return true; }]
    ]);

    var format = d3.time.format("%d-%m-%Y %H:%M");
    var lineArray = []; //Array for multiColored lines
    var itemMap;

    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5)
        .tickFormat(customTimeFormat)
        .tickPadding(10)
        .innerTickSize(-height);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format("d"))
        .tickPadding(10)
        .innerTickSize(-width);

    var itemType = "line";
    var itemTypeB;
    var lineGenerator;
    var maxValLine;

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", x(0))
        .attr("y", y(1))
        .attr("width", x(1) - x(0))
        .attr("height", y(0) - y(1));

    var zoom = d3.behavior.zoom()
        .on("zoom", redraw);

    d3.json('./data/dataset.json', function(error, jsonData) {
        if (error != null) {
            console.log("ERROR JSON = " + error);
            return false;
        }

        if (jsonData.init == undefined || jsonData.init == "") {
            alert("Error!\nNo data!");
            return false;
        }
        var valInit = jsonData.init;
        if (valInit.errm != undefined) {
            alert("Error!\n " + valInit.errm);
            return;
        }
        if (jsonData.data == undefined) {
            svg.append("text") // Title shadow
                .attr("x", (width / 2))
                .attr("y", (height / 2))
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .text("No data");
            return;
        }

        jsonData.data.forEach(function (d) {
            d.date = format.parse(d.date)
        });

        jsonData.data.reduce(function (prevVal, currVal) {
            var color = (prevVal.val == "0" || currVal.val == "0") ? "#ff003a" : "#02c211";
            lineArray.push({
                p: [{ x: prevVal.date, y: prevVal.val }, { x: currVal.date, y: currVal.val }],
                c: color
            })
            return currVal;
        });

        itemMap = jsonData.data.map(function (dd) {
            return { date: dd.date, val: +dd.val };
        })

        x.domain(d3.extent(itemMap, function (d) { return d.date; }))
        y.domain([+valInit.valMin, +valInit.valMax]);

        zoom.x(x);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .style("font-size", "12px");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .style("font-size", "12px")
            .append("text")
            .attr("y", -15)
            .attr("dy", ".171em")
            .style("text-anchor", "end")
            .text("ratio");

        svg.append("text")
            .attr("style", "font-size:10px;")
            .attr("y", y(valInit.valMin) + 35)
            .attr("x", x(d3.max(itemMap, function (d) { return d.date; })))
            .attr("dy", ".171em")
            .style("text-anchor", "end")
            .text("Use the mouse wheel to zoom in or out");

        itemTypeB = d3.svg.area()
            .interpolate(valInit.interpolate)
            .x(function (d) { return x(d.date); })
            .y0(height)
            .y1(function (d) { return y(+d.val); });

        svg.append("path")
            .datum(itemMap)
            .attr("class", "area")
            .attr("clip-path", "url(#clip)")
            .style("stroke", "#02c211")
            .style("fill", "#7cff62")
            .attr("d", itemTypeB);

        var linesGrid = svg.append("g")
            .attr("class", "linesgrid");

        // Line generator
        lineGenerator = d3.svg.line()
            .x(function (d) { return x(d.x); })
            .y(function (d) { return y(+d.y); });

        svg.selectAll("path.lines")
            .data(lineArray)
            .enter().append("path")
            .attr("class", "lines")
            .attr("clip-path", "url(#clip)")
            .attr("stroke-width", function (d) { var w; (d.c == "#ff003a") ? w = 2 : w = 4; return w })
            .attr("stroke", function (d) { return d.c; })
            .attr("d", function (d) { return lineGenerator(d.p); });

        //Draw the line
        svg.append("text") // Title shadow
            .attr("x", (width / 2))
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text(valInit.gName);

        svg.append("rect")
            .attr("class", "pane")
            .attr("width", width)
            .attr("height", height)
            .call(zoom);
    });


    function redraw() {
        svg.select("g.x.axis").call(xAxis);
        svg.selectAll("path.area")
            .attr("d", itemTypeB)

        svg.selectAll("path.lines")
            .attr("d", function (d) { return lineGenerator(d.p);
            });
    }
});
