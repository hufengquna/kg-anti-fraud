var KgAnti = function () {
    this.context = {};
};


//接受配置参数, 创建context
//下文需要的参数都在这里面取
KgAnti.prototype.configure = function (context) {
    /*
    * context:{
    *   nodeTypeContainer:
    *   edgeTypeContainer:
    *   nodeSelected:
    * }*/

    if (typeof context !== "object") {
        throw new Error("[context] must be a type of [object]");
    }


    this.context = context;

    //外界可配的部分
    // if (context.graph == null) {
    //     try {
    //         this.context.graph = new Springy.Graph();
    //     } catch (e) {
    //         console.error("未找到依赖插件:[Spring.js]");
    //     }
    // }

};


KgAnti.prototype.springyGraph  = function (graph) {
    $('#springydemo').springy({
        graph: graph,
        nodeSelected: this.context.nodeSelected
    });
    var layout = new Springy.Layout.ForceDirected(graph, 640, 480.0, 0.5);
};


/**
 * 加载后台数据并画图
 * */
KgAnti.prototype.loadDataAndDraw = function (requestArguments) {
    if (requestArguments.url === undefined || requestArguments.url === null) {
        return;
    }


//    $.getJSON("../json/data21.json", function (data) {
//     var reqUrl = "/certno/110101195607302022.do";   //全局搜索定义的请求路径
    /* ABANDON: 貌似无法post请求
    $.getJSON(requestArguments.url,requestArguments.data, function (data) {
        console.log(requestArguments);
        console.log(requestArguments.url);
        console.log(requestArguments.data);

        //获取数据
        var json = JSON.stringify(data);
        var data = JSON.parse(json);
        //判断从后台获取的数据是否格式正确
        if (data.nodes === undefined || data.edges === undefined) {
            throw new Error("后台相应的json格式有误");
        }

        this.context.data = data;
        //初始化图形  将查到的所有节点和边全部展示
        this.initGraph(this.context);


        //根据nodeTypeSet中的nodeType显示复选框列表
        var nodeTypeHtml = this.genCategoryHtml(graphArgs.nodeTypeSet, "node");
        var edgeTypeHtml = this.genCategoryHtml(graphArgs.edgeTypeSet, 'edge');

        //todo 返回默认分类html, 放入属性中, 供外面调用
        //$('#nodeTypes').html(nodeTypeHtml);
        //$('#edgeTypes').html(edgeTypeHtml);
    }.bind(this));
    */  //回调函数绑定当前类实例, 否则, this指向的是其他域
    $.ajax({
        type: 'POST',
        url: requestArguments.url,
        data: requestArguments.data,
        success: function (data) {
            console.log(requestArguments);
            console.log(requestArguments.url);
            console.log(requestArguments.data);

            //获取数据
            var json = JSON.stringify(data);
            var data = JSON.parse(json);
            //判断从后台获取的数据是否格式正确
            if (data.nodes === undefined || data.edges === undefined) {
                throw new Error("后台响应的json格式有误");
            }
            //判断结果给出提示
            if (data.status != null) {
                alert(data.status.msg);
                return;
            }

            //创建Graph实例     没有数据不会被创建 解决没有数据导致以后闪屏问题
            this.context.graph = new Springy.Graph();

            this.context.data = data;
            //初始化图形  将查到的所有节点和边全部展示
            this.initGraph(this.context);


            //根据nodeTypeSet中的nodeType显示分类按钮
            this.genCategoryHtml("node");
            this.genCategoryHtml('edge');

            //画图
            this.springyGraph(this.context.graph);


        }.bind(this),
        dataType: 'json'
    });

}


//
// jQuery(function () {
//     var springy = window.springy = jQuery('#springydemo').springy({
//         graph: graph,
//         nodeSelected: function (node, e) {
//             console.log(e);
//             $('#showInfo').html(JSON.stringify(node.data));
// //                alert('Node selected: ' + JSON.stringify(node.data));
//             //$('body').append('<div style="width: 200px;height: 100px;background: #333;margin-left:'+e.pageX+'margin-top:"'++'";></div>');
//             //$('.shader').html(JSON.stringify(node.data)).show().css({"left":e.pageX+10+"px","top":e.pageY+10+"px"});
//         }
//
//
//     });
//     var layout = new Springy.Layout.ForceDirected(graph, 640, 480.0, 0.5);
//     console.log(layout.graph.nodes);
// });
//END: 业务代码


//START: 方法区
/**根据contentType映射出颜色配置*/
function mapColorFromEdgeType(edgeType) {
    //TODO
    return "#990677";
}

/**根据contentType映射出颜色配置*/
function mapColorFromNodeType(nodeType) {
    //TODO
    return "#A8E667";
}


/**双击连通or断开此节点和周边一度节点的边
 * 双击图中节点,携带节点id去后台获取对应的一度点,边数据*/
KgAnti.prototype.toggleNeighborShow = function (url, nodeId) {
    var oneLevelNeighborEdges = {}; //存储一度边
    //TODO 根据当前节点id, 获取关联的所有一度关系数据
    $.getJSON(url, {nodeId: nodeId}, function (dbclickGetData) {
        //start: 根据当前节点的id从后台获取其周边一度关联节点数据  --!根据当前节点id筛选之后的!
        var dbclickGetData = JSON.stringify(dbclickGetData);
        var dbclickGetData = JSON.parse(dbclickGetData);


        //从后台传入的数据集中, 获取所有一度关联的边
        dbclickGetData.edges.forEach(function (e) {
            //一度关联节点: sourceId一致或targetId一致
            if (e.source == nodeId || e.target == nodeId) {
                oneLevelNeighborEdges[e.id] = e;
            }
        });

        //当前节点关联的真实边数(来自数据库)
        var oneLevelNeighborEdgesNum = Object.getOwnPropertyNames(oneLevelNeighborEdges).length;
        //end

        //计算当前图中此节点与一度周边节点相连接的边数
        var count = 0;
        var adjacency = args.graph.adjacency;
        for (var source in adjacency) {
            //sourceId 一致, 其上所有targetId包括在内
            if (source == nodeId) {
                //获取source:{key:value,....}key的个数, 即targetId的个数
                count += Object.getOwnPropertyNames(adjacency[source]).length;
                //sourceId一致说明肯定是周边节点
            } else {
                //否则, 需要注意判断targetId是否一致, 若是, 则也是属于周边节点
                for (var target in adjacency[source]) {
                    if (target == nodeId) {
                        count++;
                    }
                }
            }
        }

        //比较实际变数和图中当前显示的变数
        if (count < oneLevelNeighborEdgesNum) {
            //说明当前为显示全部一度变数-->全部展示出来
            args.data = dbclickGetData;
            initGraph(args);   //'递归'调用
        } else {
            //说明当前一度变数处于全部显示状态-->删除(这里仅删除边)
            if (oneLevelNeighborEdges != null && oneLevelNeighborEdges.length > 0) {
                oneLevelNeighborEdges.forEach(function (t) {
                    graph.removeEdge(t);
                })
            }
        }

    })

};


/**初始化图形  将查到的所有节点和边全部展示
 * @param args graph:图对象; data:数据集nodes:[]  edges:[]*/
KgAnti.prototype.initGraph = function () {

    var data = this.context.data;
    var graph = this.context.graph;
    //todo
    var dbClickUrl = (this.context.dbClickUrl) !== undefined ? this.context.dbClickUrl : '';
    if (data === undefined || data == null) {
        return;
    }

    /*
    * 节点id和边id为后台传入的id
    *
    * */
    var nodes = data.nodes;
    if (nodes != null) {
        for (var nodeKey in nodes) {

            //建立节点
            var nodeData = nodes[nodeKey];
            nodeData.label = nodes[nodeKey].name;     //可灵活指定用什么字段作为label
            //配置节点字体样式
            nodeData.font = "30px Verdana, sans-serif";
            //填充颜色
            nodeData.fillColor = 'rgba(90,25,222,0.25)';
            //文本颜色
            nodeData.color = "#993366";
            //显示图片
            //nodeData.image = ;
            nodeData.radius = 35;
            //节点类型
            nodeData.type = nodeData.nodeType;
            // 添加双击事件, 展示/收起周边节点
            nodeData.ondoubleclick = function () {
                //判断当前节点是否显示了全部周边节点-->然后据此展开还是收缩
                toggleNeighborShow(dbClickUrl, nodeData.id);
            };

            var node = new Springy.Node(nodeKey, nodeData);
            graph.addNode(node);

            //将节点类型记录下来, 用于页面显示  nodeType:[nodeId,...]
            /* ABANDON: springy.js中已有搞定
            if (!(nodeData.nodeType in this.context.nodeTypeSet)) {
                this.context.nodeTypeSet[nodeData.nodeType] = [];
            }
            if ($.inArray(nodeKey, this.context.nodeTypeSet[nodeData.nodeType]) == -1) {    //去重
                this.context.nodeTypeSet[nodeData.nodeType].push(nodeKey);
            }
            */
        }


    }

    var edges = data.edges;
    if (edges != null) {
        for (var edgeKey in edges) {
            //建立边
            var edgeData = edges[edgeKey];
            edgeData.color = mapColorFromEdgeType(edgeData.contentType);
            edgeData.label = edgeData.contentType + "\n" + edgeData.content;      //可根据需求灵活配置边上显示的内容
            edgeData.font = "20px Verdana, sans-serif";
            edgeData.type = edgeData.contentType;

            //根据节点id在上述已经创建的node中找出node
            var source = graph.nodeSet[edgeData.source];
            var target = graph.nodeSet[edgeData.target];


            //vid 由 content和contentType取md5唯一确定出的边
            var edge = new Springy.Edge(edgeKey, source, target, edgeData);
            graph.addEdge(edge);

            //将边类型记录下来 <edgeType:[edgeId,....]>
            // if (!(edgeData.contentType in this.context.edgeTypeSet)) {
            //     this.context.edgeTypeSet[edgeData.contentType] = [];
            // }
            // if ($.inArray(edgeKey, this.context.edgeTypeSet[edgeData.contentType]) == -1) {
            //     this.context.edgeTypeSet[edgeData.contentType].push(edgeKey);
            // }
        }
    }

    console.log("[initGraph()]完成, 图形参数:");
    console.log("this.context.graph.graphCache.nodeTypeSet");
    console.log(this.context.graph.graphCache.nodeTypeSet);
    console.log("this.context.graph.edgeTypeSet");
    console.log(this.context.graph.edgeTypeSet);
    console.log("this.context.graph.graphCache.edgeTypeSet");
    console.log(this.context.graph.graphCache.edgeTypeSet);

}


/**根据复选框状态切换被选中类别的显示或隐藏*/
KgAnti.prototype.toggleDisplayByType = function (categoryLi, graphType) {
    var flag;
    if (categoryLi.hasClass("color-grey")) {
        //切换按钮样式
        categoryLi.removeClass("color-grey");
        categoryLi.find('span').removeClass("bg-grey");
        flag = true;
    } else {
        categoryLi.addClass("color-grey");
        categoryLi.find('span').addClass("bg-grey");
        flag = false;
    }

    var typeName = categoryLi.attr("typeName");
    if (typeName === undefined) {    //考虑兼容性
        typeName = categoryLi.prop("typeName");
    }
    if (typeName === undefined) {
        throw new Error('未获取[typeName], 将无法确定切换显示哪一类点/边元素');
    }

    //删除此类别下的所有图形元素
    //var selectedType = categoryLi.val();
    switch (graphType) {
        case 'node':
            //取出全局变量this.context中的 *TypeSet
            if (flag) {  //要显示
                //根据nodeId 在 Springy.graphCache中找到对应点, 然后恢复显示
                this.context.graph.recoverNodeByType(typeName);
            } else {  //要隐藏
                //批量删除节点
                this.context.graph.removeNodeByType(typeName);
            }
            console.log("[toggleDisplayByType] this.context.graph.nodeTypeSet");
            console.log(this.context.graph.nodeTypeSet);
            console.log("[toggleDisplayByType] this.context.graph.graphCache.nodeTypeSet 缓存:");
            console.log(this.context.graph.graphCache.nodeTypeSet);

            console.log("this.context.graph.edgeTypeSet");
            console.log(this.context.graph.edgeTypeSet);
            console.log("this.context.graph.graphCache.edgeTypeSet");
            console.log(this.context.graph.graphCache.edgeTypeSet);

            break;
        case 'edge':
            //取出全局变量this.context中的 *TypeSet
            if (flag) {  //要显示
                //根据nodeId 在 graph.graphCache中找到对应点, 然后恢复显示
                this.context.graph.recoverEdgeByType(typeName);
            } else {  //要隐藏
                //批量删除节点
                this.context.graph.removeEdgeByType(typeName);
            }
            console.log("[toggleDisplayByType]  this.context.graph.edgeTypeSet");
            console.log(this.context.graph.edgeTypeSet);
            console.log("[toggleDisplayByType] 缓存: ");
            console.log(this.context.graph.graphCache.edgeTypeSet);
            break;
        default:
            throw new Error("node? edge?");
    }


}

/**根据节点类别或边类别生成分类选择列表的html
 * @param typeSet 节点或边类型set
 * @param graphType 'node'  'edge'*/
KgAnti.prototype.genCategoryHtml = function (graphType) {
    // console.log(typeof graphType);
    // var html = '';
    // for (var type in typeSet) {
    //     html += '<input class="' + graphType + '" type="checkbox" checked="checked" onclick="toggleDisplayByType($(this),\'' + graphType + '\')" value="' + type + '"/>' + type
    // }
    var categoryClass = '';
    var typeContainer;
    var typeSet;
    if (graphType === 'node') {
        categoryClass = 'dot';   //点
        typeContainer = $(this.context.nodeTypeContainer);
        typeSet = this.context.graph.nodeTypeSet;
    }
    if (graphType === 'edge') {
        categoryClass = 'line'; //线
        typeContainer = $(this.context.edgeTypeContainer);
        typeSet = this.context.graph.edgeTypeSet;
    }


    var categoryLi = '';
    var categoryColor;
    //遍历typeSet, 动态生成分类开关按钮
    for (var typeKey in typeSet) {
        //todo
        categoryColor = mapColorFromNodeType(typeKey);
        categoryLi += '<li typeName="' + typeKey + '" class="categoryLi_' + graphType + '"><span style="background-color:' + categoryColor + ';"></span>' + typeKey + '</li>';
        // onclick="toggleDisplayByType($(this),\'' + graphType + '\',\''+typeKey+'\')"
    }


    var categoryHtml =
        '<ul class="' + categoryClass + '">\n' + categoryLi + '</ul>';

    //放入节点类型容器中
    if (typeContainer == null) {
        console.warn("存放[graphType]类别的开关按钮的容器未定义, 将无法显示当前类别的显示开关按钮")
    }
    else {
        typeContainer.html(categoryHtml);
        $('.categoryLi_' + graphType).bind('click', this, function (e) {
            //Note: 2th: 向回调函数传入额外的参数
            e.data.toggleDisplayByType($(this), graphType);
        })
    }

}

//END: 方法区
