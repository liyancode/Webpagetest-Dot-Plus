document.addEventListener('DOMContentLoaded', function () {
    var m_data = chrome.extension.getBackgroundPage().wptRequestData;
    var renderPathData = JSON.parse(m_data);

    var tree_data = [];
    var root_name = renderPathData[0]["full_url"];
    tree_data[0] = {"name": root_name, "parent": "null", "line_number": "0","responseCode":renderPathData[0]["responseCode"],"seq_id":0};

    for (var i = 1; i < renderPathData.length; i++) {
        var initiator = renderPathData[i]["initiator"];
        var initiator_line = renderPathData[i]["initiator_line"];
        var responseCode=renderPathData[i]["responseCode"];
        if (responseCode < 300 || responseCode > 399) {
            if (initiator === undefined) {
                tree_data[i] = {"name": renderPathData[i]["full_url"], "parent": root_name, "line_number": "0","responseCode":responseCode,"seq_id":i+1};
            } else {
                tree_data[i] = {"name": renderPathData[i]["full_url"], "parent": initiator, "line_number": initiator_line,"responseCode":responseCode,"seq_id":i+1};
            }
        }
    }
    //save_svg_2_png();
    $("#test_url").text("url: " + root_name);
    $("#total_requests").text("requests: " + renderPathData.length);
    //$("#content").text(content_text);
    $("#save_svg").click(function () {
        //document.getElementById("tree_svg").style.display="none";
        d3.select("svg").remove();
        d3.select("#download_link").remove();
        show(tree_data, screen.width, screen.height);
        tag_duplicate_node();
        encode_as_img_and_link();

        var download_link = document.getElementById('download_link');
        download_link.click();
    });

    $("#save_text").click(function () {
        d3.select("#text_download_link").remove();
        save_text_file(tree_data);
        var download_link = document.getElementById('text_download_link');
        download_link.click();
    });
});

/*
 parse long full url to short format:domain_name/.../resource_name
 */
function parse_url(full_url) {
    var reg_0 = /\/[^\/]*\/[^\/]*\/[^\/]*\//g;//4 '/'
    var reg = /\/[^\/]*\/[^\/]*\//g;
    var domain_name = '';
    var resource_name = full_url.substr(full_url.lastIndexOf('/') + 1);
    var start_index = full_url.indexOf('//') + 2;

    if (reg.test(full_url)) {
        domain_name = full_url.substring(start_index, reg.lastIndex - 1);
    } else {

    }
    if (resource_name.indexOf('?') !== -1) {
        resource_name = resource_name.substring(0, resource_name.indexOf('?'));
    }
    if (reg_0.test(full_url)) {
        return '~/' + resource_name;//domain_name+'/~/'+resource_name;
    } else {
        return '~/' + resource_name;//domain_name+'/'+resource_name;
    }
};
/*paint svg*/
function show(tree_data, svg_width, svg_height) {
    var data = tree_data;

    // *********** Convert flat data into a nice tree ***************
    // create a name: node map
    var dataMap = data.reduce(function (map, node) {
        map[node.name] = node;
        return map;
    }, {});

    // create the tree array
    var treeData = [];
    data.forEach(function (node) {
        // add to parent
        var parent = dataMap[node.parent];
        if (parent) {
            // create child array if it doesn't exist
            (parent.children || (parent.children = []))
                // add node to child array
                .push(node);
        } else {
            // parent is null or missing
            treeData.push(node);
        }
    });

    // ************** Generate the tree diagram  *****************
    var margin = {top: 20, right: 120, bottom: 20, left: 120},
        width = svg_width - margin.right - margin.left,
        height = svg_height - margin.top - margin.bottom;

    var i = 0;

    var tree = d3.layout.tree()
        //.separation(function(a,b){return ((a.parent==root)&&(b.parent))?1:3;})
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    var svg = d3.select("#tree_svg").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        //.attr("width",width)
        //.attr("height",height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    root = treeData[0];

    update(root);

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.y = d.depth * 180;
        });

        // Declare the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter the nodes.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeEnter.append("circle")
            .attr("r", 12)
            .style("fill", function(d){
                if(d.responseCode>=400){
                    return "#FF0000";
                }else{
                    return "#fff";
                }
            })
            .style("stroke", "steelblue")
            .style("stroke-width", "2px");


        nodeEnter.append("text")
            .attr("x", function (d) {
                return d.children || d._children ? -13 : 13;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.line_number + ":" + parse_url(d.name);
            })
            .style("fill-opacity", 1)
            .style("font", "17px sans-serif");

        // Declare the links…
        var link = svg.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter the links.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", diagonal)
            .style("fill", "none")
            .style("stroke", "#ccc")
            .style("stroke-width", "2px");

    }
};
// 导出js svg图为png
function save_svg_2_png() {
    var tmpA = document.createElement('A');
    tmpA.download = 'crp.jpg';

    var svg2png = function (svg) {
        var canvas = document.createElement('canvas'),
            evt = document.createEvent('MouseEvent');

        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        //svg.setAttribute('width', 1000);
        //svg.setAttribute('height', 1000);
        evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

        canvg(canvas, (new XMLSerializer()).serializeToString(svg), {
            ignoreMouse: true,
            ignoreAnimation: true,
            renderCallback: function () {
                tmpA.href = canvas.toDataURL('image/jpg');
                tmpA.dispatchEvent(evt);
            }
        });
    };

    var downloadBtn = $('<a style="display:none;position:absolute;left:0;top:0;z-index:9999;" href="#" title="Download PNG">Download</a>').appendTo(document.body);

    $(document).on('mouseenter', 'svg', function (e) {
        if (downloadBtn.is(':visible') || e.relatedTarget === downloadBtn[0]) {
            return;
        }
        var me = $(this), pos = me.offset();
        downloadBtn.data('svg', me[0]);
        downloadBtn.css('left', pos.left + me.width() - 37)
            .css('top', pos.top + 6)
            .show();
    });

    $(document).on('mouseleave', 'svg', function (e) {
        if (e.relatedTarget === downloadBtn[0]) {
            return;
        }
        downloadBtn.hide();
    });

    downloadBtn.click(function (e) {
        e.preventDefault();
        svg2png(downloadBtn.data('svg'));
        return false;
    });
};

function encode_as_img_and_link() {
    // Add some critical information
    $("svg").attr({ version: '1.1', xmlns: "http://www.w3.org/2000/svg"});

    var svg = $("#tree_svg").html();
    var b64 = Base64.encode(svg); // or use btoa if supported
    // Works in recent Webkit(Chrome)
    //$("body").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' download='file.html'><img src='data:image/svg+xml;base64,\n"+b64+"' alt='file.svg'/></a>"));

    // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
    $("body").append($("<a style='display:none' id='download_link' href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n" + b64 + "' download='file.html'>Download</a>"));
};

function tag_duplicate_node() {
    var node_list = $(".node");
    var c = 0;
    for (var i = 0; i < node_list.length; i++) {
        c = c + 1;
        var node_text = node_list[i].lastChild.textContent;
        for (var j = 0; j < i; j++) {
            c = c + 1;
            var j_nodetext=node_list[j].lastChild.textContent;
            if (node_text.substring(node_text.indexOf('/')+1) === j_nodetext.substring(j_nodetext.indexOf('/')+1)) {
                $(".node")[i].firstChild.setAttribute("style", "fill: yellow; stroke: rgb(70, 130, 180); stroke-width: 2px;");
                $(".node")[j].firstChild.setAttribute("style", "fill: yellow; stroke: rgb(70, 130, 180); stroke-width: 2px;");
                break;
            }
        }
    }
};

function save_text_file(tree_data){
    var content=null;
    //%0D%0A=\r\n
    var newLinetag="%0D%0A";
    var tag="--";
    content=tag+"ROOT:"+tree_data[0]["name"]+newLinetag;
    for(var i=1;i<tree_data.length;i++){
        content=content+"       "+tag+tree_data[i]["line_number"]+" : "+parse_url(tree_data[i]["name"])+newLinetag;
    }
    //var b64 = Base64.encode(content);
    $("body").append($("<a style='display:none' id='text_download_link' href-lang='text/plain' href='data:text/plain;,\n" + content + "' download='text.txt'>Download</a>"));
};
