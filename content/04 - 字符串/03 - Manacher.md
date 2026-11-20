# Manacher

s 为 std::string；回文指正着读和倒着读相同，按字符精确比较。 最长回文并列时返回最靠左的一段；空串返回空字符串，回文出现次数为 0。

O(|s|) 时间和空间。

```cpp
// 返回字符串 s 插入分隔符后的回文半径数组。
std::vector<int> manacher(const std::string &s) {
    std::string t = "#";
    for (auto c : s) {
        t += c;
        t += '#';
    }
    int n = t.size();
    std::vector<int> r(n);
    for (int i = 0, j = 0; i < n; i++) {
        if (2 * j - i >= 0 && j + r[j] > i) {
            r[i] = std::min(r[2 * j - i], j + r[j] - i);
        }
        while (i - r[i] >= 0 && i + r[i] < n && t[i - r[i]] == t[i + r[i]]) {
            r[i] += 1;
        }
        if (i + r[i] > j + r[j]) {
            j = i;
        }
    }
    return r;
}

// 返回最长回文子串；长度并列取最靠左的一段，空串返回空字符串。
std::string longestPalindrome(const std::string &s) {
    auto radii = manacher(s);
    int start = 0, length = 0;
    for (int center = 0; center < int(radii.size()); ++center) {
        int candidate = radii[center] - 1;
        if (candidate > length) {
            length = candidate;
            start = (center - candidate) / 2;
        }
    }
    return s.substr(start, length);
}

// 返回所有非空回文子串的出现次数；同一内容在不同位置分别计数。
i64 palindromeCount(const std::string &s) {
    auto radii = manacher(s);
    i64 count = 0;
    for (int radius : radii)
        count += radius / 2;
    return count;
}

// vector 版（处理非字符值域，如数字）
/*
std::vector<int> manacher(const std::vector<int> &s) {
    std::vector<int> t{0};
    for (auto c : s) {
        t.push_back(c);
        t.push_back(0);
    }
    int n = t.size();
    std::vector<int> r(n);
    for (int i = 0, j = 0; i < n; i++) {
        if (2 * j - i >= 0 && j + r[j] > i) {
            r[i] = std::min(r[2 * j - i], j + r[j] - i);
        }
        while (i - r[i] >= 0 && i + r[i] < n && t[i - r[i]] == t[i + r[i]]) {
            r[i] += 1;
        }
        if (i + r[i] > j + r[j]) {
            j = i;
        }
    }
    return r;
}
*/
```
