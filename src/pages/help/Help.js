// 帮助页脚本：提供本地内置文档的翻译与渲染逻辑
document.addEventListener("DOMContentLoaded", () => {
  // 统一图片标签生成，减少重复与便于后续替换
  const imgTag = (src, alt) => `<img src="./assets/${src}" alt="${alt}">`;
  const IMG3_ZH = imgTag("img3.svg", "历史页面示意图");
  const IMG4_ZH = imgTag("img4.svg", "配置页面示意图");
  const IMG5_ZH = imgTag("img5.svg", "更新日志示意图");
  const IMG3_EN = imgTag("img3.svg", "History page diagram");
  const IMG4_EN = imgTag("img4.svg", "Configuration page diagram");
  const IMG5_EN = imgTag("img5.svg", "Changelog diagram");
  const translations = {
    zh_CN: {
      help_title: "线束直径计算工具 - 帮助文档",
      welcome_title: "欢迎使用 线束直径计算工具！",
      intro_p1:
        "本工具是一款基于二维圆形填充算法的线束直径估算插件。它可以帮助你根据输入的多种规格导线、包裹物层数和厚度，通过模拟计算来估算线束的最终直径，并提供可视化结果和配置管理功能。",
      toc_title: "目录",
      search_placeholder_text: "搜索帮助内容...",
      search_placeholder: "搜索帮助内容...",
      toc_list: `
                <li><a href="#section1">1. 如何启动插件</a></li>
                <li><a href="#section2">2. 主界面概览</a>
                    <ul>
                        <li><a href="#section2-1">侧边栏</a></li>
                        <li><a href="#section2-2">主内容区</a></li>
                    </ul>
                </li>
                <li><a href="#section3">3. 核心功能：线束直径计算 (<code>计算</code> 页面)</a>
                    <ul>
                        <li><a href="#section3-1">界面布局概览</a></li>
                        <li><a href="#section3-2">左侧：参数输入区</a>
                            <ul>
                                <li><a href="#section3-2-1">标准导线</a></li>
                                <li><a href="#section3-2-2">特殊导线</a></li>
                                <li><a href="#section3-2-3">包裹物</a></li>
                                <li><a href="#section3-2-4">制造公差</a></li>
                                <li><a href="#section3-2-5">计算次数</a></li>
                            </ul>
                        </li>
                        <li><a href="#section3-3">底部：操作控制栏</a></li>
                        <li><a href="#section3-4">右侧：结果展示区</a>
                            <ul>
                                <li><a href="#section3-4-1">截面模拟图</a></li>
                                <li><a href="#section3-4-2">高亮最终平均直径</a></li>
                                <li><a href="#section3-4-3">输入统计</a></li>
                                <li><a href="#section3-4-4">直径计算详情</a></li>
                                <li><a href="#section3-4-5">计算结果分布图</a></li>
                            </ul>
                        </li>
                        <li><a href="#section3-5">快速计算示例</a></li>
                    </ul>
                </li>
                <li><a href="#section4">4. 查看与管理计算历史 (<code>历史</code> 页面)</a></li>
                <li><a href="#section5">5. 插件配置 (<code>配置</code> 页面)</a></li>
                <li><a href="#section6">6. 查看版本与更新日志</a></li>
            `,
      section1_title: "1. 如何启动插件",
      section1_p1:
        '安装插件后，在你的浏览器工具栏中找到 "线束直径计算工具" 的图标 (通常是一个图案图标)，点击它。插件的主界面会以一个新的弹出式窗口打开。',
      section1_caption1: "<em>这是插件的图标</em>",
      section2_title: "2. 主界面概览",
      section2_p1:
        "插件主界面分为左右两部分：左侧是 <strong>侧边栏导航</strong>，右侧是 <strong>主内容区</strong>。",
      section2_caption1:
        "<em>这是一个示意图，展示了侧边栏和主内容区的布局</em>",
      "section2-1_title": "侧边栏",
      "section2-1_content": `
                <p>侧边栏提供了主要的导航功能：</p>
                <ul>
                    <li><strong><span class="emoji">🧮</span> 计算</strong>: 点击进入核心的线束直径计算页面。这是插件的主要功能模块。</li>
                    <li><strong><span class="emoji">📜</span> 历史</strong>: 点击查看你过往的计算历史记录。</li>
                    <li><strong><span class="emoji">⚙️</span> 配置</strong>: 点击进入插件的配置页面。</li>
                    <li><strong>版本信息</strong>: 在侧边栏底部会显示当前插件的版本号，例如 <code>版本: 1.0.2.2</code>。点击版本号可以查看详细的更新日志。</li>
                    <li><strong>收起/展开按钮 (<code>&lt;</code> 或 <code>&gt;</code>)</strong>: 位于侧边栏和主内容区之间，点击可以收起或展开侧边栏，以便为内容区提供更多空间。</li>
                </ul>
            `,
      "section2-2_title": "主内容区",
      "section2-2_p1":
        '主内容区会根据你在侧边栏选择的选项动态显示不同的内容。默认情况下，打开插件后会显示 <strong>"计算"</strong> 页面的内容。',
      section3_title: "3. 核心功能：线束直径计算 (<code>计算</code> 页面)",
      section3_p1:
        '"计算" 页面是你进行所有线束直径参数输入、执行计算并查看结果的地方。',
      "section3-1_title": "界面布局概览",
      "section3-1_content": `
                <p>计算页面主要分为三个区域：</p>
                <ol>
                    <li><strong>左侧参数输入区</strong>: 用于定义线束的组成部分，如导线规格、数量，包裹物厚度等，以及设置计算相关的参数。</li>
                    <li><strong>右侧结果展示区</strong>: 用于可视化展示计算后的线束截面模拟图、详细的直径数据和统计图表。</li>
                    <li><strong>底部操作控制栏</strong>: 包含执行计算、重置页面和保存历史记录的选项。</li>
                </ol>
            `,
      "section3-2_title": "左侧：参数输入区",
      "section3-2_p1": "在这里，你需要输入构成线束的所有组件信息和计算参数。",
      "section3-2-1_title": '<span class="emoji">📏</span> 标准导线',
      "section3-2-1_content": `
                <p>此区域用于添加和管理符合预设规格的导线。</p>
                <h5>表格列说明:</h5>
                <ul>
                    <li><strong>序号</strong>: 自动编号。</li>
                    <li><strong>线径</strong>: 从下拉列表中选择导线的标称截面积 (例如 0.35, 0.5, 0.75 mm² 等)。</li>
                    <li><strong>类型</strong>: 根据选择的线径，从下拉列表中选择导线的绝缘层类型 (例如 Thin-薄壁, Thick-厚壁, UltraThin-超薄壁)。</li>
                    <li><strong>直径(mm)</strong>: 根据你选择的"线径"和"类型"，此字段会自动填充该规格导线的标称外径。</li>
                    <li><strong>数量</strong>: 输入这种规格的导线在线束中的数量。</li>
                    <li><strong>删除</strong>: 点击 "<span class="emoji">❌</span>" 按钮可以删除该行导线。</li>
                </ul>
                <h5>操作按钮:</h5>
                <ul>
                    <li><strong><span class="emoji">✨</span> 增加</strong>: 点击增加一行新的标准导线输入。</li>
                    <li><strong><span class="emoji">🔄</span> 重置</strong>: 点击将标准导线表格恢复到默认的初始状态（通常是几行预设的常用规格，数量为0）。</li>
                </ul>
                <h5>如何使用:</h5>
                <ol>
                    <li>点击"<span class="emoji">✨</span> 增加"按钮添加导线行。</li>
                    <li>在每一行中，从"线径"下拉框选择合适的线径。</li>
                    <li>接着，从"类型"下拉框选择对应的绝缘层类型，"直径(mm)"会自动更新。</li>
                    <li>在"数量"列输入该规格导线的根数。</li>
                    <li>如果添加错误或不再需要某行，点击该行末尾的"删除"按钮。</li>
                </ol>
            `,
      "section3-2-2_title": '<span class="emoji">🔗</span> 特殊导线',
      "section3-2-2_content": `
                <p>如果你的线束中包含没有在"标准导线"列表中预设规格的导线，可以在这里添加。</p>
                 <h5>表格列说明:</h5>
                <ul>
                    <li><strong>序号</strong>: 自动编号。</li>
                    <li><strong>直径(mm)</strong>: 直接输入这种特殊导线的外径（包含绝缘层）。</li>
                    <li><strong>数量</strong>: 输入这种特殊导线的数量。</li>
                    <li><strong>删除</strong>: 点击 "<span class="emoji">❌</span>" 按钮可以删除该行导线。</li>
                </ul>
                <h5>操作按钮:</h5>
                <ul>
                    <li><strong><span class="emoji">✨</span> 增加</strong>: 点击增加一行新的特殊导线输入。</li>
                    <li><strong><span class="emoji">🔄</span> 重置</strong>: 点击清空所有特殊导线输入。</li>
                </ul>
                <h5>如何使用:</h5>
                <ol>
                    <li>点击"<span class="emoji">✨</span> 增加"按钮添加导线行。</li>
                    <li>在"直径(mm)"列输入导线的实际外径。</li>
                    <li>在"数量"列输入该导线的根数。</li>
                </ol>
            `,
      "section3-2-3_title": '<span class="emoji">🛡️</span> 包裹物',
      "section3-2-3_content": `
                <p>此区域用于定义线束外部的包裹层，例如胶带、套管等。包裹物会增加线束的最终直径。</p>
                <h5>表格列说明:</h5>
                <ul>
                    <li><strong>序号</strong>: 自动编号，代表包裹的层数顺序（从内到外）。</li>
                    <li><strong>厚度(mm)</strong>: 输入这一层包裹物的单边厚度。</li>
                    <li><strong>删除</strong>: 点击 "<span class="emoji">❌</span>" 按钮可以删除该行包裹物。</li>
                </ul>
                <h5>操作按钮:</h5>
                <ul>
                    <li><strong><span class="emoji">✨</span> 增加</strong>: 点击增加一层新的包裹物输入。</li>
                    <li><strong><span class="emoji">🔄</span> 重置</strong>: 点击清空所有包裹物输入。</li>
                </ul>
                <h5>如何使用:</h5>
                <ol>
                    <li>如果线束有多层包裹，从最内层开始，逐层点击"<span class="emoji">✨</span> 增加"按钮添加。</li>
                    <li>在每一行的"厚度(mm)"列输入该层包裹的厚度。</li>
                </ol>
            `,
      "section3-2-4_title": '<span class="emoji">📐</span> 制造公差',
      "section3-2-4_content": `
                <p>考虑到实际生产中的各种因素，线束的实际直径通常会比理论计算值稍大。这里可以设置一个放大系数。</p>
                <h5>滑块与输入框:</h5>
                <p>你可以通过拖动滑块或直接在输入框中输入百分比来调整制造公差。</p>
                <ul>
                    <li>范围是 100% 到 200%。例如，输入 110% 表示最终计算直径会在理论值（含包裹物）的基础上再放大 10%。</li>
                    <li>默认值为 110%。</li>
                </ul>
                <h5>操作按钮:</h5>
                <ul>
                    <li><strong><span class="emoji">🔄</span> 重置</strong>: 点击将制造公差恢复到默认值 (110%)。</li>
                </ul>
            `,
      "section3-2-5_title": '<span class="emoji">🧮</span> 计算次数',
      "section3-2-5_content": `
                <p>本工具使用蒙特卡洛模拟方法来估算线束直径，这意味着它会进行多次随机的导线堆叠模拟，然后取统计结果。</p>
                <h5>滑块与输入框:</h5>
                <p>你可以通过拖动滑块或直接在输入框中输入次数来调整模拟计算的运行次数。</p>
                <ul>
                    <li>范围是 1 到 100 次。次数越多，结果可能越接近真实情况的平均值，但计算时间也会相应增加。</li>
                    <li>默认值为 10 次。</li>
                </ul>
                <h5>操作按钮:</h5>
                <ul>
                    <li><strong><span class="emoji">🔄</span> 重置</strong>: 点击将计算次数恢复到默认值 (10)。</li>
                </ul>
            `,
      "section3-3_title": "底部：操作控制栏",
      "section3-3_content": `
                <ul>
                    <li><strong>保存历史记录 (复选框)</strong>:
                        <p>默认勾选。当勾选时，每次点击"<span class="emoji">📏</span> 计算直径"后，当前的输入参数和计算结果会自动保存到"历史"页面中，方便日后查阅。</p>
                        <p>如果不想自动保存，可以取消勾选。</p>
                    </li>
                    <li><strong><span class="emoji">🧹</span> 全部重置 (按钮)</strong>:
                        <p>点击此按钮会将整个"计算"页面上的所有输入项（标准导线、特殊导线、包裹物、制造公差、计算次数）恢复到它们的初始默认状态。</p>
                    </li>
                    <li><strong><span class="emoji">📏</span> 计算直径 (按钮)</strong>:
                        <p>这是最重要的操作按钮。当你完成了所有参数的输入后，点击此按钮，插件会开始执行线束直径的模拟计算。</p>
                        <p>计算完成后，结果会显示在页面的右侧结果展示区。</p>
                        <p>你也可以直接按键盘上的 <code>Enter</code> 键来触发计算。</p>
                    </li>
                </ul>
            `,
      "section3-4_title": "右侧：结果展示区",
      "section3-4_p1":
        '当你点击"<span class="emoji">📏</span> 计算直径"按钮后，计算结果会在这里显示。',
      "section3-4-1_title": '<span class="emoji">🖼️</span> 截面模拟图',
      "section3-4-1_content": `
                <ul>
                    <li><strong>Canvas 画布</strong>: 这里会展示一个基于你输入的导线进行随机堆叠后的典型线束横截面示意图。不同直径的导线会用不同颜色表示。</li>
                    <li><strong>图例 (Legend)</strong>: 画布旁边或下方会有一个图例，说明截面图中不同颜色分别对应哪种直径的导线。</li>
                    <li><strong>内层容器边界</strong>: 图中可能会有一条虚线圆圈，它代表了所有导线（不含包裹物和公差）堆叠后形成的理论线束边界。</li>
                </ul>
            `,
      "section3-4-2_title": '<span class="emoji">✨</span> 高亮最终平均直径',
      "section3-4-2_content": `
                <p>在截面模拟图区域，会有一个醒目显示的数值，例如 "<strong>Ø 12.3 mm</strong>"。</p>
                <p>这代表了<strong>最终的平均直径</strong>，它是综合考虑了所有导线、所有包裹层厚度以及你设定的制造公差后，向上取整得到的估算直径值。括号内通常会显示一个更精确（如保留两位小数）的计算值。</p>
            `,
      "section3-4-3_title": '<span class="emoji">⚙️</span> 输入统计',
      "section3-4-3_content": `
                <p>这里汇总了你当前输入的一些关键参数：</p>
                <ul>
                    <li><strong>总导线数量</strong>: 你在"标准导线"和"特殊导线"中输入的导线总根数。</li>
                    <li><strong>总包裹物层数</strong>: 你在"包裹物"区域输入的包裹层总数。</li>
                    <li><strong>总包裹物厚度</strong>: 所有包裹层厚度的总和（单边）。</li>
                </ul>
            `,
      "section3-4-4_title": '<span class="emoji">📈</span> 直径计算详情',
      "section3-4-4_content": `
                <p>这是一个表格，展示了更详细的直径计算结果：</p>
                <h5>参数:</h5>
                <ul>
                    <li><strong>最小线径</strong>: 多次模拟中得到的最小线束直径。</li>
                    <li><strong>最大线径</strong>: 多次模拟中得到的最大线束直径。</li>
                    <li><strong>平均线径</strong>: 多次模拟结果的平均线束直径。</li>
                </ul>
                <h5>裸线值 (mm):</h5>
                <p>这一列显示的是<strong>仅基于导线本身</strong>（不包含任何包裹物和制造公差）进行多次堆叠模拟后得到的理论直径的最小值、最大值和平均值。</p>
                <h5>模拟值 (mm):</h5>
                <p>这一列显示的是<strong>最终的计算直径</strong>，它是在"裸线值"的基础上，加上了所有包裹层的总厚度（双边），并且应用了你设定的"制造公差"百分比后得到的直径。这些值通常是你更关心的最终结果。</p>
            `,
      "section3-4-5_title": '<span class="emoji">📊</span> 计算结果分布图',
      "section3-4-5_content": `
                <p>这是一个直方图，显示了在多次模拟计算中，不同直径结果出现的频次分布。</p>
                <ul>
                    <li><strong>横坐标 (X轴)</strong>: 线束直径 (mm)。</li>
                    <li><strong>纵坐标 (Y轴)</strong>: 频次 (出现的次数)。</li>
                    <li>这可以帮助你直观地了解计算结果的稳定性和集中趋势。如果分布很宽，说明结果波动较大。</li>
                </ul>
            `,
      "section3-5_title": "快速计算示例",
      "section3-5_content": `
                <p>假设你需要计算一个由以下组件构成的线束：</p>
                <ul>
                    <li>10根 0.5 mm² 的薄壁导线</li>
                    <li>5根 1.5 mm² 的厚壁导线</li>
                    <li>2根外径为 2.8 mm 的特殊导线</li>
                    <li>用一层厚度为 0.13 mm 的胶带包裹</li>
                    <li>制造公差按 112% 计算</li>
                    <li>进行 20 次模拟计算</li>
                </ul>
                <p>操作步骤如下：</p>
                <ol>
                    <li>在<strong>标准导线</strong>区，增加两行。第一行选择线径 <code>0.5</code>，类型 <code>Thin</code>，数量输入 <code>10</code>。第二行选择线径 <code>1.5</code>，类型 <code>Thick</code>，数量输入 <code>5</code>。</li>
                    <li>在<strong>特殊导线</strong>区，增加一行。直径输入 <code>2.8</code>，数量输入 <code>2</code>。</li>
                    <li>在<strong>包裹物</strong>区，增加一行。厚度输入 <code>0.13</code>。</li>
                    <li>在<strong>制造公差</strong>区，将滑块或输入框的值调整为 <code>112%</code>。</li>
                    <li>在<strong>计算次数</strong>区，将滑块或输入框的值调整为 <code>20</code>。</li>
                    <li>确保<strong>保存历史记录</strong>复选框已勾选。</li>
                    <li>点击底部的 <strong><span class="emoji">📏</span> 计算直径</strong> 按钮。</li>
                    <li>稍等片刻，右侧就会显示出详细的计算结果和截面模拟图。</li>
                </ol>
            `,
      section4_title: "4. 查看与管理计算历史 (<code>历史</code> 页面)",
      section4_content: `
                <p>每次当你在"计算"页面启用了"保存历史记录"并执行计算后，该次计算的完整快照都会被保存在这里。</p>
                ${IMG3_ZH}
                <h5>主要功能:</h5>
                <ul>
                    <li><strong>历史记录列表</strong>:
                        <p>每条记录都包含计算的时间戳、最终估算直径以及一个简要的输入参数总结。</p>
                    </li>
                    <li><strong>操作按钮</strong>:
                        <ul>
                            <li><strong><span class="emoji">🔍</span> 详情</strong>: 点击可以查看该条历史记录的完整输入参数和计算结果，与当时在"计算"页面右侧看到的结果完全一致。</li>
                            <li><strong><span class="emoji">🔄</span> 加载到计算页</strong>: 点击此按钮，会将该条历史记录的所有输入参数（包括导线、包裹物、公差等）完整地加载回"计算"页面，方便你基于过去的计算进行微调和重新计算。</li>
                            <li><strong><span class="emoji">❌</span> 删除</strong>: 点击删除该条历史记录。</li>
                            <li><strong><span class="emoji">🗑️</span> 全部删除</strong>: 位于历史列表的顶部，点击可以一次性清空所有的历史记录。</li>
                        </ul>
                    </li>
                </ul>
            `,
      section5_title: "5. 插件配置 (<code>配置</code> 页面)",
      section5_content: `
                <p>在这里，你可以自定义插件的行为和参数，以更好地适应你的工作流程。</p>
                ${IMG4_ZH}
                <h5>主要配置项:</h5>
                <ul>
                    <li><strong>标准导线规格管理</strong>:
                        <p>这是配置页面的核心。你可以查看、修改、增加或删除预设的"标准导线"规格。</p>
                        <ul>
                            <li>你可以调整现有规格的标称外径，或者为某个线径增加新的绝缘层类型（例如，"FLR-B" 类型）。</li>
                            <li>通过"增加"和"删除"按钮来管理整个规格列表。</li>
                            <li>点击"恢复默认设置"可以将导线规格表重置为插件初始安装时的状态。</li>
                        </ul>
                    </li>
                    <li><strong>默认计算参数</strong>:
                        <p>你可以修改"计算"页面打开时的默认值，例如：</p>
                        <ul>
                            <li>默认的制造公差百分比。</li>
                            <li>默认的模拟计算次数。</li>
                        </ul>
                    </li>
                    <li><strong>数据管理</strong>:
                        <ul>
                            <li><strong>导出配置</strong>: 将你当前的所有配置（包括自定义的导线规格和默认参数）导出一个 <code>.json</code> 文件。</li>
                            <li><strong>导入配置</strong>: 通过选择之前导出的 <code>.json</code> 文件，可以快速恢复或在不同设备间同步你的配置。</li>
                            <li><strong>重置所有设置为默认值</strong>: 这是一个最终的重置选项，它会将插件的所有设置（包括导线规格、默认参数和所有历史记录）全部恢复到初始状态。<strong>请谨慎操作！</strong></li>
                        </ul>
                    </li>
                </ul>
            `,
      section6_title: "6. 查看版本与更新日志",
      section6_content: `
                <p>在主界面侧边栏的底部，你会看到当前插件的版本号，例如 <code>版本: 1.0.2.2</code>。</p>
                <p><strong>点击这个版本号</strong>，会弹出一个窗口，显示详细的更新日志 (Changelog)。这可以帮助你了解每个版本新增了哪些功能或修复了哪些问题。</p>
                ${IMG5_ZH}
            `,
    },
    en: {
      help_title: "Wire Bundle Diameter Calculator - Help Document",
      welcome_title: "Welcome to the Wire Bundle Diameter Calculator!",
      intro_p1:
        "This tool is a plug-in for estimating the diameter of wire bundles based on a 2D circle packing algorithm. It can help you estimate the final diameter of a wire bundle by simulating calculations based on the input of various wire specifications, number of wrapping layers, and thickness, and provides visualization results and configuration management functions.",
      toc_title: "Table of Contents",
      search_placeholder_text: "Search help content...",
      search_placeholder: "Search help content...",
      toc_list: `
                <li><a href="#section1">1. How to launch the plugin</a></li>
                <li><a href="#section2">2. Main Interface Overview</a>
                    <ul>
                        <li><a href="#section2-1">Sidebar</a></li>
                        <li><a href="#section2-2">Main Content Area</a></li>
                    </ul>
                </li>
                <li><a href="#section3">3. Core Function: Wire Bundle Diameter Calculation (<code>Calculate</code> Page)</a>
                    <ul>
                        <li><a href="#section3-1">Interface Layout Overview</a></li>
                        <li><a href="#section3-2">Left: Parameter Input Area</a>
                            <ul>
                                <li><a href="#section3-2-1">Standard Wires</a></li>
                                <li><a href="#section3-2-2">Special Wires</a></li>
                                <li><a href="#section3-2-3">Wrappings</a></li>
                                <li><a href="#section3-2-4">Manufacturing Tolerance</a></li>
                                <li><a href="#section3-2-5">Number of Calculations</a></li>
                            </ul>
                        </li>
                        <li><a href="#section3-3">Bottom: Operation Control Bar</a></li>
                        <li><a href="#section3-4">Right: Result Display Area</a>
                            <ul>
                                <li><a href="#section3-4-1">Cross-section Simulation Diagram</a></li>
                                <li><a href="#section3-4-2">Highlighted Final Average Diameter</a></li>
                                <li><a href="#section3-4-3">Input Statistics</a></li>
                                <li><a href="#section3-4-4">Diameter Calculation Details</a></li>
                                <li><a href="#section3-4-5">Calculation Result Distribution Chart</a></li>
                            </ul>
                        </li>
                        <li><a href="#section3-5">Quick Calculation Example</a></li>
                    </ul>
                </li>
                <li><a href="#section4">4. View and Manage Calculation History (<code>History</code> Page)</a></li>
                <li><a href="#section5">5. Plugin Configuration (<code>Config</code> Page)</a></li>
                <li><a href="#section6">6. View Version and Changelog</a></li>
            `,
      section1_title: "1. How to launch the plugin",
      section1_p1:
        'After installing the plugin, find the "Wire Bundle Diameter Calculator" icon (usually a graphic icon) in your browser toolbar and click it. The main interface of the plugin will open in a new pop-up window.',
      section1_caption1: "<em>This is the plugin icon</em>",
      section2_title: "2. Main Interface Overview",
      section2_p1:
        "The main interface of the plugin is divided into two parts: the left is the <strong>sidebar navigation</strong>, and the right is the <strong>main content area</strong>.",
      section2_caption1:
        "<em>This is a schematic diagram showing the layout of the sidebar and the main content area</em>",
      "section2-1_title": "Sidebar",
      "section2-1_content": `
                <p>The sidebar provides the main navigation functions:</p>
                <ul>
                    <li><strong><span class="emoji">🧮</span> Calculate</strong>: Click to enter the core wire bundle diameter calculation page. This is the main functional module of the plugin.</li>
                    <li><strong><span class="emoji">📜</span> History</strong>: Click to view your past calculation history.</li>
                    <li><strong><span class="emoji">⚙️</span> Config</strong>: Click to enter the plugin configuration page.</li>
                    <li><strong>Version Information</strong>: The current version number of the plugin will be displayed at the bottom of the sidebar, for example <code>Version: 1.0.2.2</code>. Click the version number to view the detailed changelog.</li>
                    <li><strong>Collapse/Expand Button (<code>&lt;</code> or <code>&gt;</code>)</strong>: Located between the sidebar and the main content area, click to collapse or expand the sidebar to provide more space for the content area.</li>
                </ul>
            `,
      "section2-2_title": "Main Content Area",
      "section2-2_p1":
        'The main content area will dynamically display different content according to the options you select in the sidebar. By default, the content of the <strong>"Calculate"</strong> page will be displayed after opening the plugin.',
      section3_title:
        "3. Core Function: Wire Bundle Diameter Calculation (<code>Calculate</code> Page)",
      section3_p1:
        'The "Calculate" page is where you enter all wire bundle diameter parameters, perform calculations, and view the results.',
      "section3-1_title": "Interface Layout Overview",
      "section3-1_content": `
                <p>The calculation page is mainly divided into three areas:</p>
                <ol>
                    <li><strong>Left Parameter Input Area</strong>: Used to define the components of the wire bundle, such as wire specifications, quantity, wrapping thickness, etc., and to set calculation-related parameters.</li>
                    <li><strong>Right Result Display Area</strong>: Used to visualize the simulated cross-section of the wire bundle after calculation, detailed diameter data, and statistical charts.</li>
                    <li><strong>Bottom Operation Control Bar</strong>: Contains options for performing calculations, resetting the page, and saving history.</li>
                </ol>
            `,
      "section3-2_title": "Left: Parameter Input Area",
      "section3-2_p1":
        "Here, you need to enter all the component information and calculation parameters that make up the wire bundle.",
      "section3-2-1_title": '<span class="emoji">📏</span> Standard Wires',
      "section3-2-1_content": `
                <p>This area is used to add and manage wires that conform to preset specifications.</p>
                <h5>Table Column Description:</h5>
                <ul>
                    <li><strong>No.</strong>: Automatic numbering.</li>
                    <li><strong>Wire Gauge</strong>: Select the nominal cross-sectional area of the wire from the drop-down list (e.g., 0.35, 0.5, 0.75 mm², etc.).</li>
                    <li><strong>Type</strong>: Based on the selected wire gauge, select the insulation layer type of the wire from the drop-down list (e.g., Thin, Thick, UltraThin).</li>
                    <li><strong>Diameter (mm)</strong>: This field will be automatically filled with the nominal outer diameter of the wire of this specification based on the "Wire Gauge" and "Type" you selected.</li>
                    <li><strong>Quantity</strong>: Enter the number of wires of this specification in the wire bundle.</li>
                    <li><strong>Delete</strong>: Click the "<span class="emoji">❌</span>" button to delete this row of wires.</li>
                </ul>
                <h5>Operation Buttons:</h5>
                <ul>
                    <li><strong><span class="emoji">✨</span> Add</strong>: Click to add a new standard wire input row.</li>
                    <li><strong><span class="emoji">🔄</span> Reset</strong>: Click to restore the standard wire table to its default initial state (usually a few rows of preset common specifications with a quantity of 0).</li>
                </ul>
                <h5>How to use:</h5>
                <ol>
                    <li>Click the "<span class="emoji">✨</span> Add" button to add a wire row.</li>
                    <li>In each row, select the appropriate wire gauge from the "Wire Gauge" drop-down box.</li>
                    <li>Next, select the corresponding insulation layer type from the "Type" drop-down box, and the "Diameter (mm)" will be updated automatically.</li>
                    <li>Enter the number of wires of this specification in the "Quantity" column.</li>
                    <li>If you add it incorrectly or no longer need a row, click the "Delete" button at the end of the row.</li>
                </ol>
            `,
      "section3-2-2_title": '<span class="emoji">🔗</span> Special Wires',
      "section3-2-2_content": `
                <p>If your wire bundle contains wires that are not pre-configured in the "Standard Wires" list, you can add them here.</p>
                 <h5>Table Column Description:</h5>
                <ul>
                    <li><strong>No.</strong>: Automatic numbering.</li>
                    <li><strong>Diameter (mm)</strong>: Directly enter the outer diameter of this special wire (including the insulation layer).</li>
                    <li><strong>Quantity</strong>: Enter the quantity of this special wire.</li>
                    <li><strong>Delete</strong>: Click the "<span class="emoji">❌</span>" button to delete this row of wires.</li>
                </ul>
                <h5>Operation Buttons:</h5>
                <ul>
                    <li><strong><span class="emoji">✨</span> Add</strong>: Click to add a new special wire input row.</li>
                    <li><strong><span class="emoji">🔄</span> Reset</strong>: Click to clear all special wire inputs.</li>
                </ul>
                <h5>How to use:</h5>
                <ol>
                    <li>Click the "<span class="emoji">✨</span> Add" button to add a wire row.</li>
                    <li>Enter the actual outer diameter of the wire in the "Diameter (mm)" column.</li>
                    <li>Enter the number of this wire in the "Quantity" column.</li>
                </ol>
            `,
      "section3-2-3_title": '<span class="emoji">🛡️</span> Wrappings',
      "section3-2-3_content": `
                <p>This area is used to define the outer wrapping layers of the wire bundle, such as tape, tubing, etc. Wrappings will increase the final diameter of the wire bundle.</p>
                <h5>Table Column Description:</h5>
                <ul>
                    <li><strong>No.</strong>: Automatic numbering, representing the order of the wrapping layers (from inside to outside).</li>
                    <li><strong>Thickness (mm)</strong>: Enter the single-sided thickness of this layer of wrapping.</li>
                    <li><strong>Delete</strong>: Click the "<span class="emoji">❌</span>" button to delete this row of wrapping.</li>
                </ul>
                <h5>Operation Buttons:</h5>
                <ul>
                    <li><strong><span class="emoji">✨</span> Add</strong>: Click to add a new wrapping layer input.</li>
                    <li><strong><span class="emoji">🔄</span> Reset</strong>: Click to clear all wrapping inputs.</li>
                </ul>
                <h5>How to use:</h5>
                <ol>
                    <li>If the wire bundle has multiple layers of wrapping, start from the innermost layer and click the "<span class="emoji">✨</span> Add" button to add them layer by layer.</li>
                    <li>Enter the thickness of this layer of wrapping in the "Thickness (mm)" column of each row.</li>
                </ol>
            `,
      "section3-2-4_title":
        '<span class="emoji">📐</span> Manufacturing Tolerance',
      "section3-2-4_content": `
                <p>Considering various factors in actual production, the actual diameter of the wire bundle is usually slightly larger than the theoretical calculated value. A magnification factor can be set here.</p>
                <h5>Slider and Input Box:</h5>
                <p>You can adjust the manufacturing tolerance by dragging the slider or directly entering a percentage in the input box.</p>
                <ul>
                    <li>The range is 100% to 200%. For example, entering 110% means that the final calculated diameter will be increased by another 10% on the basis of the theoretical value (including wrappings).</li>
                    <li>The default value is 110%.</li>
                </ul>
                <h5>Operation Buttons:</h5>
                <ul>
                    <li><strong><span class="emoji">🔄</span> Reset</strong>: Click to restore the manufacturing tolerance to the default value (110%).</li>
                </ul>
            `,
      "section3-2-5_title":
        '<span class="emoji">🧮</span> Number of Calculations',
      "section3-2-5_content": `
                <p>This tool uses the Monte Carlo simulation method to estimate the wire bundle diameter, which means it will perform multiple random wire stacking simulations and then take the statistical results.</p>
                <h5>Slider and Input Box:</h5>
                <p>You can adjust the number of simulation calculations by dragging the slider or directly entering the number in the input box.</p>
                <ul>
                    <li>The range is 1 to 100 times. The more times, the closer the result may be to the average of the real situation, but the calculation time will also increase accordingly.</li>
                    <li>The default value is 10 times.</li>
                </ul>
                <h5>Operation Buttons:</h5>
                <ul>
                    <li><strong><span class="emoji">🔄</span> Reset</strong>: Click to restore the number of calculations to the default value (10).</li>
                </ul>
            `,
      "section3-3_title": "Bottom: Operation Control Bar",
      "section3-3_content": `
                <ul>
                    <li><strong>Save History (Checkbox)</strong>:
                        <p>Checked by default. When checked, every time you click "<span class="emoji">📏</span> Calculate Diameter", the current input parameters and calculation results will be automatically saved to the "History" page for future reference.</p>
                        <p>If you do not want to save automatically, you can uncheck it.</p>
                    </li>
                    <li><strong><span class="emoji">🧹</span> Reset All (Button)</strong>:
                        <p>Clicking this button will restore all input items on the entire "Calculate" page (standard wires, special wires, wrappings, manufacturing tolerance, number of calculations) to their initial default state.</p>
                    </li>
                    <li><strong><span class="emoji">📏</span> Calculate Diameter (Button)</strong>:
                        <p>This is the most important operation button. After you have finished entering all the parameters, click this button and the plugin will start to perform the simulation calculation of the wire bundle diameter.</p>
                        <p>After the calculation is complete, the results will be displayed in the result display area on the right side of the page.</p>
                        <p>You can also directly press the <code>Enter</code> key on your keyboard to trigger the calculation.</p>
                    </li>
                </ul>
            `,
      "section3-4_title": "Right: Result Display Area",
      "section3-4_p1":
        'When you click the "<span class="emoji">📏</span> Calculate Diameter" button, the calculation results will be displayed here.',
      "section3-4-1_title":
        '<span class="emoji">🖼️</span> Cross-section Simulation Diagram',
      "section3-4-1_content": `
                <ul>
                    <li><strong>Canvas</strong>: A typical cross-section diagram of a wire bundle based on the wires you entered will be displayed here after random stacking. Wires of different diameters will be represented by different colors.</li>
                    <li><strong>Legend</strong>: There will be a legend next to or below the canvas, explaining which diameter of wire the different colors in the cross-section diagram correspond to.</li>
                    <li><strong>Inner Container Boundary</strong>: There may be a dashed circle in the figure, which represents the theoretical wire bundle boundary formed by the stacking of all wires (excluding wrappings and tolerances).</li>
                </ul>
            `,
      "section3-4-2_title":
        '<span class="emoji">✨</span> Highlighted Final Average Diameter',
      "section3-4-2_content": `
                <p>In the cross-section simulation diagram area, there will be a prominently displayed value, for example, "<strong>Ø 12.3 mm</strong>".</p>
                <p>This represents the <strong>final average diameter</strong>, which is the estimated diameter value obtained by rounding up after comprehensively considering all wires, all wrapping layer thicknesses, and the manufacturing tolerance you set. The value in parentheses usually shows a more precise calculated value (e.g., reserved to two decimal places).</p>
            `,
      "section3-4-3_title": '<span class="emoji">⚙️</span> Input Statistics',
      "section3-4-3_content": `
                <p>Here are some key parameters you are currently entering:</p>
                <ul>
                    <li><strong>Total number of wires</strong>: The total number of wires you entered in "Standard Wires" and "Special Wires".</li>
                    <li><strong>Total number of wrapping layers</strong>: The total number of wrapping layers you entered in the "Wrappings" area.</li>
                    <li><strong>Total wrapping thickness</strong>: The sum of the thicknesses of all wrapping layers (single-sided).</li>
                </ul>
            `,
      "section3-4-4_title":
        '<span class="emoji">📈</span> Diameter Calculation Details',
      "section3-4-4_content": `
                <p>This is a table showing more detailed diameter calculation results:</p>
                <h5>Parameters:</h5>
                <ul>
                    <li><strong>Minimum wire diameter</strong>: The minimum wire bundle diameter obtained from multiple simulations.</li>
                    <li><strong>Maximum wire diameter</strong>: The maximum wire bundle diameter obtained from multiple simulations.</li>
                    <li><strong>Average wire diameter</strong>: The average wire bundle diameter of multiple simulation results.</li>
                </ul>
                <h5>Bare wire value (mm):</h5>
                <p>This column shows the minimum, maximum, and average values of the theoretical diameter obtained by multiple stacking simulations based on <strong>the wire itself</strong> (without any wrappings and manufacturing tolerances).</p>
                <h5>Simulated value (mm):</h5>
                <p>This column shows the <strong>final calculated diameter</strong>, which is the diameter obtained by adding the total thickness of all wrapping layers (double-sided) to the "bare wire value" and applying the "manufacturing tolerance" percentage you set. These values are usually the final results you are more concerned about.</p>
            `,
      "section3-4-5_title":
        '<span class="emoji">📊</span> Calculation Result Distribution Chart',
      "section3-4-5_content": `
                <p>This is a histogram showing the frequency distribution of different diameter results in multiple simulation calculations.</p>
                <ul>
                    <li><strong>Horizontal axis (X-axis)</strong>: Wire bundle diameter (mm).</li>
                    <li><strong>Vertical axis (Y-axis)</strong>: Frequency (number of occurrences).</li>
                    <li>This can help you intuitively understand the stability and central tendency of the calculation results. If the distribution is wide, it means that the results fluctuate greatly.</li>
                </ul>
            `,
      "section3-5_title": "Quick Calculation Example",
      "section3-5_content": `
                <p>Suppose you need to calculate a wire bundle composed of the following components:</p>
                <ul>
                    <li>10 thin-walled wires of 0.5 mm²</li>
                    <li>5 thick-walled wires of 1.5 mm²</li>
                    <li>2 special wires with an outer diameter of 2.8 mm</li>
                    <li>Wrapped with a layer of tape with a thickness of 0.13 mm</li>
                    <li>Manufacturing tolerance is calculated at 112%</li>
                    <li>Perform 20 simulation calculations</li>
                </ul>
                <p>The operation steps are as follows:</p>
                <ol>
                    <li>In the <strong>Standard Wires</strong> area, add two rows. In the first row, select wire gauge <code>0.5</code>, type <code>Thin</code>, and enter quantity <code>10</code>. In the second row, select wire gauge <code>1.5</code>, type <code>Thick</code>, and enter quantity <code>5</code>.</li>
                    <li>In the <strong>Special Wires</strong> area, add a row. Enter diameter <code>2.8</code> and quantity <code>2</code>.</li>
                    <li>In the <strong>Wrappings</strong> area, add a row. Enter thickness <code>0.13</code>.</li>
                    <li>In the <strong>Manufacturing Tolerance</strong> area, adjust the value of the slider or input box to <code>112%</code>.</li>
                    <li>In the <strong>Number of Calculations</strong> area, adjust the value of the slider or input box to <code>20</code>.</li>
                    <li>Make sure the <strong>Save History</strong> checkbox is checked.</li>
                    <li>Click the <strong><span class="emoji">📏</span> Calculate Diameter</strong> button at the bottom.</li>
                    <li>After a while, the detailed calculation results and cross-section simulation diagram will be displayed on the right.</li>
                </ol>
            `,
      section4_title:
        "4. View and Manage Calculation History (<code>History</code> Page)",
      section4_content: `
                <p>Every time you enable "Save History" and perform a calculation on the "Calculate" page, a complete snapshot of that calculation will be saved here.</p>
                ${IMG3_EN}
                <h5>Main functions:</h5>
                <ul>
                    <li><strong>History List</strong>:
                        <p>Each record contains the timestamp of the calculation, the final estimated diameter, and a brief summary of the input parameters.</p>
                    </li>
                    <li><strong>Operation Buttons</strong>:
                        <ul>
                            <li><strong><span class="emoji">🔍</span> Details</strong>: Click to view the complete input parameters and calculation results of this historical record, which are completely consistent with the results seen on the right side of the "Calculate" page at that time.</li>
                            <li><strong><span class="emoji">🔄</span> Load to Calculation Page</strong>: Click this button to fully load all the input parameters of this historical record (including wires, wrappings, tolerances, etc.) back to the "Calculate" page, which is convenient for you to fine-tune and recalculate based on past calculations.</li>
                            <li><strong><span class="emoji">❌</span> Delete</strong>: Click to delete this historical record.</li>
                            <li><strong><span class="emoji">🗑️</span> Delete All</strong>: Located at the top of the history list, click to clear all historical records at once.</li>
                        </ul>
                    </li>
                </ul>
            `,
      section5_title: "5. Plugin Configuration (<code>Config</code> Page)",
      section5_content: `
                <p>Here, you can customize the behavior and parameters of the plugin to better suit your workflow.</p>
                ${IMG4_EN}
                <h5>Main configuration items:</h5>
                <ul>
                    <li><strong>Standard Wire Specification Management</strong>:
                        <p>This is the core of the configuration page. You can view, modify, add, or delete preset "Standard Wire" specifications.</p>
                        <ul>
                            <li>You can adjust the nominal outer diameter of existing specifications, or add new insulation layer types for a certain wire gauge (for example, "FLR-B" type).</li>
                            <li>Manage the entire specification list through the "Add" and "Delete" buttons.</li>
                            <li>Click "Restore Default Settings" to reset the wire specification table to the state when the plugin was initially installed.</li>
                        </ul>
                    </li>
                    <li><strong>Default Calculation Parameters</strong>:
                        <p>You can modify the default values when the "Calculate" page is opened, for example:</p>
                        <ul>
                            <li>Default manufacturing tolerance percentage.</li>
                            <li>Default number of simulation calculations.</li>
                        </ul>
                    </li>
                    <li><strong>Data Management</strong>:
                        <ul>
                            <li><strong>Export Configuration</strong>: Export all your current configurations (including custom wire specifications and default parameters) to a <code>.json</code> file.</li>
                            <li><strong>Import Configuration</strong>: By selecting a previously exported <code>.json</code> file, you can quickly restore or synchronize your configuration between different devices.</li>
                            <li><strong>Reset All Settings to Default</strong>: This is a final reset option that will restore all plugin settings (including wire specifications, default parameters, and all history) to their initial state. <strong>Please operate with caution!</strong></li>
                        </ul>
                    </li>
                </ul>
            `,
      section6_title: "6. View Version and Changelog",
      section6_content: `
                <p>At the bottom of the main interface sidebar, you will see the current version number of the plugin, for example <code>Version: 1.0.2.2</code>.</p>
                <p><strong>Click this version number</strong>, and a window will pop up showing the detailed changelog. This can help you understand what new features have been added or what problems have been fixed in each version.</p>
                ${IMG5_EN}
            `,
    },
  };

  // Search functionality
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search");
  const searchResults = document.getElementById("search-results");
  const tocList = document.getElementById("toc-list");

  // Function to highlight search terms
  function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  // Function to search content
  function searchContent(term) {
    if (!term) {
      searchResults.classList.remove("show");
      clearSearchBtn.style.display = "none";
      tocList.style.display = "block";
      return;
    }

    clearSearchBtn.style.display = "flex";
    tocList.style.display = "none";

    const sections = document.querySelectorAll("main section");
    const results = [];

    sections.forEach((section) => {
      const title = section.querySelector("h2, h3, h4, h5");
      const content = section.textContent || section.innerText;

      if (
        title &&
        (title.textContent.toLowerCase().includes(term.toLowerCase()) ||
          content.toLowerCase().includes(term.toLowerCase()))
      ) {
        const titleText = title.textContent;
        const snippet = content.substring(0, 150) + "...";
        results.push({
          id: section.id,
          title: titleText,
          snippet: snippet,
        });
      }
    });

    if (results.length > 0) {
      let resultsHTML = "";
      results.forEach((result) => {
        resultsHTML += `
                    <div class="search-result-item" data-target="${result.id}">
                        <strong>${highlightText(result.title, term)}</strong>
                        <div>${highlightText(result.snippet, term)}</div>
                    </div>
                `;
      });
      searchResults.innerHTML = resultsHTML;
      searchResults.classList.add("show");
    } else {
      searchResults.innerHTML =
        '<div class="search-result-item no-results">未找到相关结果</div>';
      searchResults.classList.add("show");
    }

    // Add click event to search results
    document.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const targetId = item.getAttribute("data-target");
        if (targetId) {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth" });
            // Highlight the target element temporarily
            targetElement.style.backgroundColor = "#FFF3CD";
            setTimeout(() => {
              targetElement.style.backgroundColor = "";
            }, 2000);
          }
        }
      });
    });
  }

  // Event listeners for search
  searchInput.addEventListener("input", (e) => {
    searchContent(e.target.value);
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchContent("");
    searchInput.focus();
  });

// 开发者说明（P3）：目录与资源一致性检查
// - 目录（TOC）与章节标题：需与 `help.html` 中的 `data-i18n-key`、章节 id 保持一致；
//   当增删章节时，同时更新 `translations` 的 `toc_list` 与对应内容键，避免搜索/跳转失配。
// - 图片资源：统一存放于 `src/assets/`，在 `help.html` 使用相对路径（如 `../assets/img5.svg`）；
//   如更改文件名或位置，请同步 README 的截图引用与此处 IMG 片段常量，防止 404。
// - 国际化：通过 URL `?lang=zh_CN|en` 切换文档语言；未匹配语言时回退到中文。
//
// Existing translation functionality
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get("lang") || "zh_CN";

  const makeUrl = (p) => {
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        typeof chrome.runtime.getURL === "function"
      ) {
        return chrome.runtime.getURL(p);
      }
    } catch (_) {}
    return `/${p}`;
  };

  async function loadExternalHelpTranslations(language) {
    const path = `_locales/${language}/help.json`;
    try {
      const resp = await fetch(makeUrl(path));
      if (!resp.ok) throw new Error(`fetch ${path} failed: ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn("External help translations not available, using built-in.", e);
      return null;
    }
  }

  function applyHelpTranslations(tt) {
    document.querySelectorAll("[data-i18n-key]").forEach((element) => {
      const key = element.getAttribute("data-i18n-key");
      if (tt[key]) {
        if (element.tagName.toLowerCase() === "title") {
          element.textContent = tt[key];
        } else {
          element.innerHTML = tt[key];
        }
      } else {
        // 标记缺失键，供审计与视觉提示
        element.classList.add("i18n-missing");
        element.setAttribute("title", `未找到翻译键: ${key}`);
      }
    });

    // Add placeholder translation
    const placeholderKey = searchInput.getAttribute("data-i18n-ph-key");
    if (placeholderKey) {
      if (tt[placeholderKey]) {
        searchInput.placeholder = tt[placeholderKey];
      } else {
        searchInput.classList.add("i18n-missing");
        searchInput.setAttribute("title", `未找到翻译键: ${placeholderKey}`);
      }
    }

    // 汇总缺失键并在页面顶部展示审计横幅
    const missingElements = Array.from(
      document.querySelectorAll(".i18n-missing")
    );
    if (missingElements.length > 0) {
      const missingKeys = missingElements
        .map((el) => el.getAttribute("data-i18n-key") || el.getAttribute("data-i18n-ph-key"))
        .filter(Boolean);
      const uniqueKeys = Array.from(new Set(missingKeys));

      const banner = document.createElement("div");
      banner.id = "i18n-missing-banner";
      banner.className = "i18n-missing-banner";
      const msgZh = `以下文案键缺失或未翻译：${uniqueKeys.join(", ")}`;
      const msgEn = `Missing/Untranslated keys: ${uniqueKeys.join(", ")}`;
      const text = (lang === "zh_CN") ? msgZh : msgEn;
      banner.innerHTML = `
        <div class="i18n-missing-banner__content">
          <span>${text}</span>
          <button class="i18n-missing-banner__close" aria-label="close">×</button>
        </div>
      `;
      const container = document.querySelector(".help-container") || document.body;
      container.insertBefore(banner, container.firstChild);
      banner.querySelector(".i18n-missing-banner__close").addEventListener("click", () => {
        banner.remove();
      });
      console.warn("Help i18n missing keys:", uniqueKeys);
    }
  }

  (async () => {
    let t = translations[lang] || translations["zh_CN"];
    const ext = await loadExternalHelpTranslations(lang);
    if (ext && typeof ext === "object") {
      t = { ...t, ...ext };
    }
    applyHelpTranslations(t);
  })();

  // Existing TOC toggle functionality
  const toc = document.getElementById("toc");
  const tocToggleBtn = document.getElementById("toc-toggle-btn");
  const helpContainer = document.querySelector(".help-container");

  if (tocToggleBtn) {
    tocToggleBtn.addEventListener("click", () => {
      toc.classList.toggle("collapsed");
      if (helpContainer) {
        helpContainer.classList.toggle("toc-collapsed");
      }
    });
  }
});
