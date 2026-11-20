# 文本解析与格式化

parseInteger 的进制为 2..36，输入必须是完整 token；非法或越界抛异常。parseLine 不静默忽略非法后缀。

padded 返回指定最小宽度的右对齐文本，不截断、不修改外部流格式；GNU C++20。

解析 O(输入长度)；格式化 O(输出长度)，空间 O(文本长度)。

```cpp
namespace STLTools {
    // 按空白拆词，空输入返回空数组
    std::vector<std::string> split(const std::string &s) {
        std::istringstream in(s);
        std::vector<std::string> words;
        std::string token;
        while (in >> token)
            words.push_back(token);
        return words;
    }
    // 严格解析一个 i64，允许首个 +，其他空白或后缀拒绝
    i64 parseInteger(std::string_view s, int base = 10) {
        if (base < 2 || base > 36 || s.empty())
            throw std::invalid_argument("integer");
        if (s.front() == '+') {
            s.remove_prefix(1);
            if (s.empty() || s.front() == '+' || s.front() == '-')
                throw std::invalid_argument("sign");
        }
        i64 x = 0;
        auto [end, err] = std::from_chars(s.data(), s.data() + s.size(), x, base);
        if (err == std::errc::result_out_of_range)
            throw std::out_of_range("integer");
        if (err != std::errc{} || end != s.data() + s.size())
            throw std::invalid_argument("integer");
        return x;
    }
    // 把整行空白分隔整数解析为数组，不静默忽略非法后缀
    std::vector<i64> parseLine(const std::string &s) {
        std::vector<i64> a;
        for (const auto &v : split(s))
            a.push_back(parseInteger(v));
        return a;
    }
    // 返回右对齐文本，width 不足不截断；不修改外部 cout 的格式状态
    std::string padded(i64 x, int width, char fill = ' ') {
        if (width < 0)
            throw std::invalid_argument("width");
        std::ostringstream out;
        out << std::setw(width) << std::setfill(fill) << x;
        return out.str();
    }
}
```
