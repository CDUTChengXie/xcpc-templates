# KMP

text 和 pattern 为 std::string，按字符精确匹配，区分大小写。 返回 `vector<int>`，存放从 0 开始的匹配起点，按位置递增；找不到返回空数组，重叠匹配也计入。 pattern 为空时返回所有边界位置 0..text.size()。

kmpSearch O(|text|+|pattern|) 时间，空间 O(|pattern|+匹配数)；kmp O(|s|) 时间/空间。

```cpp
// 供匹配和拼接使用：f[len] 是前 len 个字符中相同前后缀的最大长度（不含整个前缀）。
std::vector<int> kmp(const std::string &s) {
    int n = s.size();
    std::vector<int> f(n + 1);
    for (int i = 1, j = 0; i < n; i++) {
        while (j && s[i] != s[j]) {
            j = f[j];
        }
        j += (s[i] == s[j]);
        f[i + 1] = j;
    }
    return f;
}

// 查找 pattern 在 text 中的所有起点（0-based），包含重叠；找不到返回空数组。
std::vector<int> kmpSearch(const std::string &text, const std::string &pattern) {
    int n = text.size(), m = pattern.size();
    std::vector<int> positions;
    if (m == 0) {
        for (int i = 0; i <= n; ++i)
            positions.push_back(i);
        return positions;
    }
    auto f = kmp(pattern);
    for (int i = 0, j = 0; i < n; ++i) {
        while (j && text[i] != pattern[j])
            j = f[j];
        j += (text[i] == pattern[j]);
        if (j == m) {
            positions.push_back(i - m + 1);
            j = f[j];
        }
    }
    return positions;
}

// 按顺序拼接字符串，并消除相邻边界的最大重叠。
string compressPrefixSuffix(const vector<string> &strings) {
    string result;
    for (const auto &s : strings) {
        if (s.empty())
            continue;
        auto failure = kmp(s);
        int j = 0;
        size_t start = result.size() > s.size() ? result.size() - s.size() : 0;
        for (size_t i = start; i < result.size(); i++) {
            char c = result[i];
            while (j && (j == int(s.size()) || s[j] != c))
                j = failure[j];
            if (j < int(s.size()) && s[j] == c)
                j++;
        }
        result.append(s, j, string::npos);
    }
    return result;
}
```
