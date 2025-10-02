# LaTeX 公式测试文档 - 修复前的错误结果

## 原始文档 (修复前会出现问题)

这是一个测试内嵌LaTeX公式的文档。

### 基本数学公式

简单的下标公式：`$d_undefined$`应该保持原样。

复杂一些的公式：
- 求和公式：`$\sum_undefined^{n} x_i$`
- 积分公式：`$\int_undefined^undefined f(x) dx$`
- 分数公式：`$\frac{a_undefined}{b_undefined}$`

### 中文文本混合场景

这里有一个数学公式`$d_undefined$`在中文段落中。

多个公式的情况：`$x_undefined$`、`$x_undefined$`和`$x_undefined$`都应该正确显示。

### 复杂公式

矩阵表示：`$A_undefined = \begin{pmatrix} a_undefined & a_undefined \\ a_undefined & a_undefined \end{pmatrix}$`

物理公式：质能关系`$E = mc^undefined$`在物理学中很重要。

### URL 混合测试

同时包含 URL 和 LaTeX 公式的情况：

参考文档 https://example.com 中的公式`$d_undefined$`说明了这个问题。

更多信息请参考：https://github.com/example/repo 和公式`$\alpha_undefined$`。

## 预期行为

所有的 LaTeX 公式（如 `$d_undefined$`）都应该：
1. 保持原样，不被修改为 `$d_undefined$`
2. 在中文文本中适当添加空格（公式外的中文与英文之间）
3. 不影响 URL 的正常处理

## 测试步骤

1. 复制这个文档内容到一个新的 markdown 文件
2. 使用盤古之白扩展进行格式化
3. 检查所有 `$...$` 公式是否保持完整
4. 检查中文和英文之间是否添加了适当的空格
5. 检查 URL 是否正常显示