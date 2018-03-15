'use strict'
# 그리기 영역 정보 
margin = new Margin(30, 50)
[width, height] = [800, 500]

#------------------------------------------------------------
#
# ## 꺾은선그래프를 그리는 함수
#
# * @param  target        문자열 svg를 추가하는 요소의 XPath
# * @param  data          배열   데이터의 배열 
# * @param  info          문자열  서버정보 이름 (cpu등)
# * @param  opt           높이나 폭, 마진, 제목 등의 정보 
# * @return d3.selection  chart를 그린 svg요소 
#
drawChart = (target, data, info, opt)->
  # svg 요소 작성 
  svg = d3.select(target).append('svg')
    .attr(width:  opt.width  + opt.margin.width, height: opt.height + opt.margin.height)
  main = svg
    .append('g')
    .attr(
      width: opt.width, height: opt.height
      transform: "translate(#{opt.margin.left},#{opt.margin.top})"
    )

  # 타이틀이 있으면 text 요소를 작성 
  if opt.title
    svg.append('text').text(opt.title)
      .attr(class: 'chart-title', dx: '1em', dy: '1.25em')

  # 시간의 폭, 서버 정보의 범위 가져오기 
  xExtent = d3.extent data, (d)-> new Date(d.epoch * 1000)
  yExtent = d3.extent data, (d)-> +d[info]

  # x축, y축 색의 스케일 작성 
  x = d3.time.scale().range([0, opt.width]).domain(xExtent)
  y = d3.scale.linear().range([opt.height, 0]).domain([0, yExtent[1]])
  color = d3.scale.category10()

  # 선분의 path 요소의 d속성값을 계산한다 
  line = d3.svg.line().x((d)-> x(new Date(d.epoch * 1000))).y((d)-> y(+d[info]))

  # path 속성을 추가해서 그린다 
  path = main.append('path').datum(data).attr(
    class: 'line'
    d: line
    fill: 'none'
    stroke: color(0)
  )

  # 축을 작성 
  xaxis = d3.svg.axis().scale(x).ticks(6).tickFormat d3.time.format('%H:%M')
  yaxis = d3.svg.axis().orient('left').scale(y).tickFormat(d3.format('s')).ticks(4)
  xAxis = main.append('g').call(xaxis)
    .attr(class: 'axis', transform: "translate(0, #{opt.height})")
  yAxis = main.append('g').call(yaxis).attr(class: 'axis')

  return svg


#------------------------------------------------------------
#
# ## dstat의 헤더에서 서버 정보 목록을 가져온다 
#
# * @param  headers 문자열 서버정보
# * @return [hostInfo infoCategoryMap, infoLabel]
#   * hostInfo 호스트정보, infoCategoryMap 상세 서버정보와 카테고리의 대응, infoLabels 서버 정보의 라벨 
#
parseHeader = (headers)->
  hostInfo = headers[2].split(/,/).map (d)-> d.replace(/^\"|\"$/g, "")
  categoryLabels = headers[5].split(/;/)
  infoLabels  = headers[6].split(/;/)
  infoCategoryMap = {}

  trimDoubleQuote = (str)->
    str.replace(/^\"|\"$/g, "")

  for categoryLabel, idx in categoryLabels
    categoryLabels[idx] = trimDoubleQuote(categoryLabel).replace(/\s/g, '_')
  for infoLabel, idx in infoLabels
    infoLabels[idx] = trimDoubleQuote(infoLabel).replace(/\s/g, '_')



  # 카테고리로 분류 / 상세 라벨을 가져온다
  for infoLabel, idx in infoLabels
    if categoryLabels[idx] isnt ""
      currentCategory = categoryLabels[idx]
    infoCategoryMap[currentCategory] = [] unless infoCategoryMap[currentCategory]
    infoCategoryMap[currentCategory].push infoLabel

    if infoLabel is currentCategory
      continue
    infoLabels[idx] = "#{currentCategory}.#{infoLabel}"


  console.log infoLabels
  [hostInfo[1], infoCategoryMap, infoLabels]

#------------------------------------------------------------
#
# # dstat.log 을 가져와서 지정한 서버 정보의 꺾은선그래프를 그린다 
#
$.get("dstat.log").done (log)->
  # 세미콜론 separated values의 parser를 작성 
  semicolonSv = d3.dsv(";", "text/ssv");
  # 1행 1레코드로 분할
  lines = log.split(/\n/);

  # 헤더를 parse
  [host, infoCategoryMap, infoLabels] = parseHeader(lines.slice(0, 7))

  lines = lines.slice(7)
  # 레코드를 해석해서 JSON 데이터로 변환
  data = semicolonSv.parse(infoLabels.join(';') + "\n" + lines.join('\n'))

  # 아래의 정보를 표시한다 
  infos = ["net/total.recv", "net/total.send", "dsk/total.read", "dsk/total.writ", "io/total.read", "io/total.writ"]
  svgs = []
  for info in infos
    # 그래프를 그린다 
    svgs.push drawChart("body", data, info, {
      width: width
      height: 60
      margin: margin
      title: info
      })
