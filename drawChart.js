var dataSet = [300, 130, 5 , 60, 240];

var margin = {width: 30, height:50};
var width = 800, height = 500;

d3.select("#myGraph")
    .append("rect")
    .attr("x", 10 )
    .attr("y",30 )
    .attr("width", dataSet[0])
    .attr("height", "40px");


$.get("./dstat.log").then(function(log){
    var semicolonSv = d3.dsv(";","text/ssv");

    // 1행 1레코드로 분할
    var lines = log.split("\n");

    [host, infoCategoryMap, infoLabels] = parseHeader(lines.slice(0, 7));

    // console.log(host);
    // console.log(infoCategoryMap);
    // console.log(infoLabels);

    lines = lines.slice(7);
    var data = semicolonSv.parse(infoLabels.join(';') + "\n" + lines.join('\n'))

    var infos = ["net/total.recv"];
    var svgs = [];

    for(var idx=0; idx< infos.length; idx++){
        svgs.push(drawChart("body", data, infos[idx], {
            width: 800,
            height: 60,
            margin: margin,
            title: infos[idx]
        }));
    }
})


function drawChart(target, data, info, opt){
    var svg = d3.select(target)
        .append('svg')
        .attr("width",opt.width  + opt.margin.width)
        .attr("height",opt.height + opt.margin.height);

    var main = svg.append('g')
        .attr("width",opt.width)
        .attr("height",opt.height)
        .attr("transform", "translate(" +50+ "," + 30 + ")");

        // .attr("transform", "translate(" +0+","+ opt.height+")");

    if(opt.title!=""){
        svg.append('text').text(opt.title)
            .attr("class","chart-title")
            .attr("dx","1em")
            .attr("dy","1.25em");
    }



    // 시간의 폭, 서버 정보의 범위 가져오기
    var xExtent = d3.extent(data,function(d){ return new Date(d.epoch * 1000);});
    var yExtent = d3.extent(data, function(d){return +d[info]});
    // console.log(xExtent);
    // console.log(yExtent);

    // x축, y축 색의 스케일 작성
    var x = d3.time.scale().domain(xExtent).range([0, opt.width]);
    var y = d3.scale.linear().domain([0, yExtent[1]]).range([opt.height, 0]);
    var color = d3.scale.category10();

    // 선분의 path 요소의 d속성값을 계산한다
    var line = d3.svg.line()
        .x(function(d){ return x(new Date(d.epoch * 1000))})
        .y(function(d){ return y(+d[info])});

    console.log(data);
    console.log([data]);

    // // // path 속성을 추가해서 그린다
    var path = main.append('path').data([data])
            .attr("class","line")
            .attr("d",line)
            .attr("fill","none")
            .attr("stroke",color(0));

    console.log("h");

    // 축을 작성
    var xaxis = d3.svg.axis().scale(x).ticks(6).tickFormat(d3.time.format('%H:%M'));
    var yaxis = d3.svg.axis().orient('right').scale(y).tickFormat(d3.format('s')).ticks(2);

    // var xaxis = d3.svg.axis().orient('top').scale(x);
    // var xaxis = d3.svg.axis().scale(x);
    // var yaxis = d3.svg.axis().orient('right').scale(y);


    var xAxis = main.append('g').call(xaxis)
        .attr("class", 'axis')
        .attr("transform", "translate(" +0+","+ opt.height+")");

    var yAxis = main.append('g').call(yaxis).attr("class", 'axis');

    return svg;
}

function parseHeader(headers){

    var hostInfo = headers[2].split(",").map(function(d){
       return d.replace(/^\"|\"$/g, "");
    });
    var categoryLabels = headers[5].split(/;/)
    var infoLabels  = headers[6].split(/;/)

    // hostInfo : ["Host:", "localhost.localdomain", "", "", "", "User:", "vagrant"]
    //categoryLabels : [""epoch"", ""total cpu usage"", "", "", "", "", "", "", ""load avg"", "", "", ""memory usage"", "", "", "", ""dsk/total"", "", ""io/total"", "", ""net/total"", ""]
    //infoLabels : [""epoch"", ""usr"", ""sys"", ""idl"", ""wai"", ""hiq"", ""siq"", ""stl"", ""1m"", ""5m"", ""15m"", ""used"", ""buff"", ""cach"", ""free"", ""read"", ""writ"", ""read"", ""writ"", ""recv"", ""send""]

    var infoCategoryMap = {}

    function trimDoubleQuote(str) {
       return str.replace(/^\"|\"$/g, "");
    }

    for(var idx=0; idx<categoryLabels.length; idx++){
        categoryLabels[idx] = trimDoubleQuote(categoryLabels[idx]).replace(/\s/g, '_');
    }
    for(var idx=0; idx<infoLabels.length; idx++){
        infoLabels[idx] = trimDoubleQuote(infoLabels[idx]).replace(/\s/g, '_');
    }

    var currentCategory;

    for(var idx=0; idx<infoLabels.length; idx++) {
        if(categoryLabels[idx] != ""){
            currentCategory = categoryLabels[idx];
        }

        if(infoCategoryMap[currentCategory] !== null)
            infoCategoryMap[currentCategory]=[];

        infoCategoryMap[currentCategory].push(infoLabels[idx]);

        if(infoLabels[idx] == currentCategory)
            continue;

        infoLabels[idx] = currentCategory +"." +infoLabels[idx];
    }

    // console.log(infoLabels);

    return [hostInfo[1], infoCategoryMap, infoLabels];
}